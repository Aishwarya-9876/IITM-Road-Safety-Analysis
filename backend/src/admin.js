// Admin API: login, video upload (-> Google Drive + 'pending' row for the Colab worker),
// video status list, and detection review (relabel / delete).
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import express from "express";
import multer from "multer";
import { pool } from "./db.js";
import { uploadToDrive, deleteFromDrive, driveConfigured } from "./drive.js";

const router = express.Router();
const ADMIN_USER = process.env.ADMIN_USER || "admin";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";
const SECRET = process.env.ADMIN_SECRET || ADMIN_PASSWORD;
const token = () => crypto.createHmac("sha256", SECRET).update(`roadsafe-admin:${ADMIN_USER}`).digest("hex");
const same = (a, b) => a.length === b.length && crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));

router.post("/login", (req, res) => {
  const { username = "", password = "" } = req.body || {};
  if (same(String(username), ADMIN_USER) && same(String(password), ADMIN_PASSWORD)) return res.json({ token: token() });
  res.status(401).json({ error: "Invalid username or password." });
});

// everything below needs "Authorization: Bearer <token>"
router.use((req, res, next) => {
  const t = (req.headers.authorization || "").replace(/^Bearer /, "");
  if (t && same(t, token())) return next();
  res.status(401).json({ error: "Not signed in." });
});

const markSignsDirty = () =>
  pool.query("insert into app_state (key, value) values ('signs_dirty', '1') on conflict (key) do update set value = '1'");

// ------------------------------------------------------------------------------------ videos
const upload = multer({
  dest: os.tmpdir(),
  limits: { fileSize: 2 * 1024 ** 3 },
  fileFilter: (_req, f, cb) => cb(null, /^video\//.test(f.mimetype) || /\.(mp4|mov|avi|mkv)$/i.test(f.originalname))
});

router.post("/videos", upload.single("video"), async (req, res, next) => {
  const f = req.file;
  try {
    if (!f) return res.status(400).json({ error: "Send one video file in the 'video' field (MP4, MOV, AVI or MKV)." });
    if (!driveConfigured()) return res.status(500).json({ error: "Google Drive is not configured on the server (see backend/README.md)." });
    const name = path.basename(f.originalname).replace(/[^\w.\-]+/g, "_");
    const { rows: [existing] } = await pool.query("select id, status from videos where filename = $1", [name]);
    if (existing && existing.status !== "failed")
      return res.status(409).json({ error: `${name} is already in the system (status: ${existing.status}).` });

    const fileId = await uploadToDrive(f.path, name, f.mimetype);
    const { rows: [video] } = await pool.query(`
      insert into videos (filename, recorded_at, status, source, size_bytes, uploaded_at, drive_file_id)
      values ($1, $2, 'pending', 'upload', $3, now(), $4)
      on conflict (filename) do update set status = 'pending', source = 'upload', size_bytes = excluded.size_bytes,
        uploaded_at = now(), drive_file_id = excluded.drive_file_id, error = null
      returning *`, [name, recordedAt(name), f.size, fileId]);
    res.status(201).json({ video });
  } catch (e) { next(e); }
  finally { if (f) fs.promises.unlink(f.path).catch(() => {}); }
});

function recordedAt(name) {
  const m = name.match(/(\d{4})(\d{2})(\d{2})-(\d{2})(\d{2})(\d{2})/);
  return m ? `${m[1]}-${m[2]}-${m[3]} ${m[4]}:${m[5]}:${m[6]}` : null;
}

router.get("/videos", async (_req, res, next) => {
  try {
    const { rows } = await pool.query(`
      select id, filename, status, source, size_bytes, n_detections, error, uploaded_at, processed_at, recorded_at
      from videos order by coalesce(uploaded_at, processed_at) desc nulls last, id desc`);
    res.json({ videos: rows });
  } catch (e) { next(e); }
});

router.post("/videos/:id/retry", async (req, res, next) => {
  try {
    const { rowCount } = await pool.query("update videos set status = 'pending', error = null where id = $1", [Number(req.params.id)]);
    rowCount ? res.json({ ok: true }) : res.sendStatus(404);
  } catch (e) { next(e); }
});

router.delete("/videos/:id", async (req, res, next) => {
  try {
    const { rows: [v] } = await pool.query("delete from videos where id = $1 returning drive_file_id", [Number(req.params.id)]);
    if (!v) return res.sendStatus(404);
    await deleteFromDrive(v.drive_file_id);
    await markSignsDirty();   // its detections are gone; the worker rebuilds `signs`
    res.json({ ok: true });
  } catch (e) { next(e); }
});

// -------------------------------------------------------------------------------- detections
router.get("/labels", async (_req, res, next) => {
  try { res.json({ labels: (await pool.query("select label, name, type from sign_classes order by name")).rows }); }
  catch (e) { next(e); }
});

router.get("/detections", async (req, res, next) => {
  try {
    const params = [], where = [];
    if (req.query.video_id) { params.push(Number(req.query.video_id)); where.push(`d.video_id = $${params.length}`); }
    if (req.query.label) { params.push(String(req.query.label)); where.push(`d.label = $${params.length}`); }
    const { rows } = await pool.query(`
      select d.id, d.video_id, v.filename as video, d.label, c.name, d.confidence, d.lat, d.lon, d.time_s,
             (d.snapshot is not null) as has_snapshot
      from detections d join videos v on v.id = d.video_id left join sign_classes c on c.label = d.label
      ${where.length ? "where " + where.join(" and ") : ""}
      order by v.filename, d.time_s limit 1000`, params);
    res.json({ detections: rows.map(r => ({ ...r, image: r.has_snapshot ? `/snapshots/${r.id}.jpg` : null })) });
  } catch (e) { next(e); }
});

router.patch("/detections/:id", async (req, res, next) => {
  try {
    const label = String(req.body?.label || "");
    const { rowCount: known } = await pool.query("select 1 from sign_classes where label = $1", [label]);
    if (!known) return res.status(400).json({ error: "Unknown label." });
    const { rowCount } = await pool.query("update detections set label = $1 where id = $2", [label, Number(req.params.id)]);
    if (!rowCount) return res.sendStatus(404);
    await markSignsDirty();
    res.json({ ok: true });
  } catch (e) { next(e); }
});

router.delete("/detections/:id", async (req, res, next) => {
  try {
    const { rowCount } = await pool.query("delete from detections where id = $1", [Number(req.params.id)]);
    if (!rowCount) return res.sendStatus(404);
    await markSignsDirty();
    res.json({ ok: true });
  } catch (e) { next(e); }
});

router.get("/status", async (_req, res, next) => {
  try {
    const { rows: [s] } = await pool.query("select exists(select 1 from app_state where key = 'signs_dirty') as signs_dirty");
    res.json({ driveConfigured: driveConfigured(), signsDirty: s.signs_dirty });
  } catch (e) { next(e); }
});

export default router;
