import express from "express";
import cors from "cors";
import { pool } from "./db.js";
import adminRouter from "./admin.js";

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use("/api/admin", adminRouter);

const locations = [
  { id: "main-gate", name: "Main Gate", lat: 13.0061068, lon: 80.2423781 },
  { id: "gajendra-circle", name: "Gajendra Circle", lat: 12.9914165, lon: 80.2336854 },
  { id: "msb", name: "MSB", lat: 12.9908689, lon: 80.2306957 },
  { id: "ed-dept", name: "Ed Dept", lat: 12.9899784, lon: 80.2265115 },
  { id: "velachery", name: "Velachery", lat: 12.9882910, lon: 80.2233049 }
];

// Sign data lives in Postgres (see backend/README.md). `signs` holds one row per physical
// board (already deduplicated by the Python pipeline); `sign_classes` holds display text.
const OTHER = { name: "Other Sign", type: "Other", description: "", usage: "" };

async function loadSigns() {
  const { rows } = await pool.query(`
    select s.id, s.label, s.confidence, s.lat, s.lon, s.video, s.time_s, s.speed_kmh, s.frames_seen,
           s.sightings, s.videos, s.detection_id,
           c.name, c.type, c.description, c.usage, (d.snapshot is not null) as has_snapshot
    from signs s
    left join sign_classes c on c.label = s.label
    left join detections d on d.id = s.detection_id
    where s.lat is not null and s.lon is not null`);
  return rows.map(r => ({
    id: r.id, label: r.label, confidence: Number(r.confidence), lat: Number(r.lat), lon: Number(r.lon),
    video: r.video, time_s: Number(r.time_s || 0), speed_kmh: Number(r.speed_kmh || 0),
    frames_seen: Number(r.frames_seen || 0), sightings: Number(r.sightings || 1), videos: r.videos,
    name: r.name || OTHER.name, type: r.type || OTHER.type,
    description: r.description || OTHER.description, usage: r.usage || OTHER.usage,
    image: r.has_snapshot ? `/snapshots/${r.detection_id}.jpg` : null
  }));
}

// Snapshot JPEGs are stored in detections.snapshot (bytea).
app.get("/snapshots/:id.jpg", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.sendStatus(404);
    const { rows } = await pool.query("select snapshot from detections where id = $1", [id]);
    if (!rows[0]?.snapshot) return res.sendStatus(404);
    res.set("Cache-Control", "public, max-age=86400").type("jpg").send(rows[0].snapshot);
  } catch (e) { next(e); }
});

// Convert coordinates to local metres for route projection.
function toXY(lat, lon) {
  const meanLat = 12.997;
  return { x: lon * 111320 * Math.cos(meanLat * Math.PI / 180), y: lat * 110540 };
}
function projectPoint(point, a, b) {
  const vx = b.x - a.x, vy = b.y - a.y;
  const denom = vx * vx + vy * vy || 1;
  const t = Math.max(0, Math.min(1, ((point.x-a.x)*vx + (point.y-a.y)*vy) / denom));
  const px = a.x + t*vx, py = a.y + t*vy;
  return { t, distance: Math.hypot(point.x-px, point.y-py) };
}
function haversine(a,b) {
  const R=6371000, rad=x=>x*Math.PI/180;
  const dLat=rad(b.lat-a.lat), dLon=rad(b.lon-a.lon);
  const x=Math.sin(dLat/2)**2 + Math.cos(rad(a.lat))*Math.cos(rad(b.lat))*Math.sin(dLon/2)**2;
  return 2*R*Math.asin(Math.sqrt(x));
}
function getRouteMetrics(startIndex,endIndex) {
  let distance=0;
  for(let i=startIndex;i<endIndex;i++) distance += haversine(locations[i],locations[i+1]);
  const km=distance/1000;
  const minutes=Math.max(1,Math.round((km/15)*60));
  return { distanceKm:Number(km.toFixed(2)), distance:`${km.toFixed(2)} km`, estimatedMinutes:minutes, travelTime:`${minutes} min` };
}
app.get("/api/health", async (_req,res,next)=>{
  try { await pool.query("select 1"); res.json({status:"ok"}); } catch(e) { next(e); }
});
// Dataset totals for the admin dashboard.
app.get("/api/stats", async (_req,res,next)=>{
  try {
    const { rows:[r] } = await pool.query(`select
      (select count(*) from signs)::int as signs,
      (select count(*) from detections)::int as detections,
      (select count(distinct label) from signs)::int as "signTypes",
      (select count(*) from videos where status='done')::int as "sourceVideos"`);
    res.json(r);
  } catch(e) { next(e); }
});
app.get("/api/locations", (_req,res)=>res.json({locations}));
app.get("/api/analysis", async (req,res,next)=>{ try {
  const startId=req.query.start, endId=req.query.end;
  const startIndex=locations.findIndex(l=>l.id===startId);
  const endIndex=locations.findIndex(l=>l.id===endId);
  if(startIndex<0 || endIndex<0) return res.status(400).json({error:"Select valid start and destination locations."});
  if(startIndex===endIndex) return res.status(400).json({error:"Start and destination must be different."});

  const low=Math.min(startIndex,endIndex), high=Math.max(startIndex,endIndex);
  const routePoints=locations.slice(low,high+1);
  const xyPoints=routePoints.map(p=>toXY(p.lat,p.lon));
  const ascending = startIndex < endIndex;
  const rows=await loadSigns();
  const candidates=[];
  for(const row of rows) {
    const point=toXY(row.lat,row.lon);
    let best={distance:Infinity,progress:0};
    let cumulative=0;
    for(let i=0;i<xyPoints.length-1;i++) {
      const segLen=Math.hypot(xyPoints[i+1].x-xyPoints[i].x,xyPoints[i+1].y-xyPoints[i].y);
      const projection=projectPoint(point,xyPoints[i],xyPoints[i+1]);
      if(projection.distance<best.distance) {
        best={distance:projection.distance,progress:cumulative+projection.t*segLen};
      }
      cumulative+=segLen;
    }
    // A 70 m corridor keeps detections close to the selected campus road.
    if(best.distance<=70) {
      candidates.push({
        ...row,
        snapshotAvailable: Boolean(row.image),
        distanceFromRouteM:Math.round(best.distance),
        routeProgressM:Math.round(best.progress),
      });
    }
  }
  candidates.sort((a,b)=>a.routeProgressM-b.routeProgressM);
  const unique=candidates;  // already one row per board in the database
  if(!ascending) unique.reverse();

  const counts={
    total:unique.length,
    regulatory:unique.filter(x=>x.type==="Regulatory").length,
    cautionary:unique.filter(x=>x.type==="Cautionary").length,
    informational:unique.filter(x=>x.type==="Informational").length,
    other:unique.filter(x=>x.type==="Other").length
  };
  const metrics=getRouteMetrics(low,high);
  res.json({
    start:locations[startIndex], destination:locations[endIndex],
    route:routePoints, ...metrics, counts, detections:unique,
    dataset:{totalRows:rows.length,matchingRows:candidates.length,uniqueSignboards:unique.length,corridorMeters:70},
    note:"Results are read from the signs database and filtered by proximity to the ordered campus waypoint route. Repeat sightings of the same board are already merged into one record."
  });
  } catch(e) { next(e); }
});

app.use((err,_req,res,_next)=>{
  console.error(err);
  if (err.code === "LIMIT_FILE_SIZE") return res.status(413).json({error:"File too large (max 2 GB)."});
  res.status(500).json({error:err.message});
});

app.listen(PORT,()=>console.log(`IITM RoadSafe API running at http://localhost:${PORT}`));
