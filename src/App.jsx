import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Link, NavLink, useNavigate, useLocation, Navigate } from "react-router-dom";
import { ShieldCheck, ArrowRight, MapPin, BarChart3, AlertTriangle, Navigation, Clock3, Search, Crosshair, Info, UploadCloud, LogOut, FileVideo, UserRound, GraduationCap, LockKeyhole, ArrowLeft, Leaf, Menu, X, LayoutDashboard, Video, Settings, ListChecks, Trash2 } from "lucide-react";
import { locations } from "./data.js";

function Navbar() {
  return <header className="navbar">
    <Link to="/" className="logo"><img className="iitm-logo" src="/images/iitm-logo.png" alt="IIT Madras logo" /><span className="logo-name">Indian Institute of<br /><b>Technology Madras</b></span></Link>
    <nav><NavLink to="/" end>Home</NavLink><NavLink to="/about">About</NavLink><NavLink to="/analysis">Analysis</NavLink><NavLink to="/contact">Contact</NavLink></nav>
    <div className="nav-tag"><Leaf size={27} /><span>Safer Campus<br /><b>Greener Tomorrow</b></span></div>
    <Link className="admin-link" to="/admin-login"><LockKeyhole size={14} /> Admin</Link>
  </header>;
}
function Footer() { return <footer className="footer"><b>IITM Road Safety Analytics</b><span>Smarter Routes · Safer Roads · A Safer IITM for Everyone</span><small>Indian Institute of Technology Madras</small></footer> }

function CampusMap({ start, end, onSelect, onAnalyse }) {
  const [next, setNext] = useState("start");
  const points = [{ id: "main-gate", x: 92, y: 64 }, { id: "gajendra-circle", x: 270, y: 125 }, { id: "msb", x: 335, y: 158 }, { id: "ed-dept", x: 390, y: 198 }, { id: "velachery", x: 448, y: 235 }];
  const chosenStart = locations.find(l => l.id === start), chosenEnd = locations.find(l => l.id === end);
  const clickPoint = id => { if (next === "start") { onSelect("start", id); setNext("destination") } else { onSelect("destination", id); setNext("start") } };
  return <div className="campus-map-panel"><div className="campus-map-instructions"><b>Choose locations directly on the map</b><span>{!start ? "Click a marker to select Start" : !end ? "Now click a marker to select Destination" : "Click any marker to change Start or Destination"}</span></div><div className="campus-map"><svg viewBox="0 0 520 290" aria-label="Interactive IITM campus location map">
    <rect width="520" height="290" rx="12" fill="#e8f1e7" /><g fill="#cbdcc9" stroke="#b8cbb6" strokeWidth="1"><rect x="30" y="20" width="90" height="46" rx="6" /><rect x="145" y="24" width="60" height="44" rx="6" /><rect x="300" y="30" width="95" height="45" rx="6" /><rect x="410" y="18" width="75" height="58" rx="6" /><rect x="42" y="125" width="85" height="54" rx="6" /><rect x="170" y="170" width="75" height="60" rx="6" /><rect x="295" y="205" width="70" height="52" rx="6" /></g>
    <path d="M20 95 C105 85 150 92 225 115 S330 155 395 200 S465 230 505 260 M95 10 L105 280 M260 10 L265 280 M410 10 L410 280" fill="none" stroke="#fff" strokeWidth="19" strokeLinecap="round" /><path d="M20 95 C105 85 150 92 225 115 S330 155 395 200 S465 230 505 260" fill="none" stroke="#c2d1c1" strokeWidth="2" strokeDasharray="7 7" />
    {start && end && <path d={`M${points.find(p => p.id === start)?.x || 92} ${points.find(p => p.id === start)?.y || 64} Q260 100 ${points.find(p => p.id === end)?.x || 270} ${points.find(p => p.id === end)?.y || 125}`} fill="none" stroke="#0b86e7" strokeWidth="7" strokeLinecap="round" />}
    {points.map(pt => { const loc = locations.find(l => l.id === pt.id), isS = start === pt.id, isE = end === pt.id; return <g key={pt.id} onClick={() => clickPoint(pt.id)} style={{ cursor: "pointer" }}><circle cx={pt.x} cy={pt.y} r={isS || isE ? 17 : 12} fill={isS ? "#087d4a" : isE ? "#e21c27" : "#537b58"} stroke="white" strokeWidth="4" /><text x={pt.x} y={pt.y - 23} textAnchor="middle" fontSize="12" fontWeight="700" fill="#1b3c2b" stroke="#fff" strokeWidth="3" paintOrder="stroke">{loc.name}</text><text x={pt.x} y={pt.y + 4} textAnchor="middle" fontSize="12" fontWeight="800" fill="white">{isS ? "S" : isE ? "D" : "•"}</text></g> })}
  </svg></div><div className="campus-map-legend"><span><i className="legend-start" /> Start: {chosenStart?.name || "Not selected"}</span><span><i className="legend-end" /> Destination: {chosenEnd?.name || "Not selected"}</span></div><button className="analyse-btn" onClick={onAnalyse} disabled={!start || !end || start === end}><BarChart3 size={20} /> Analyse Selected Route <ArrowRight size={18} /></button></div>;
}

function Home() {
  const [start, setStart] = useState(""), [end, setEnd] = useState(""), [error, setError] = useState(""), [preview, setPreview] = useState(null), [reviewOpen, setReviewOpen] = useState(false), [review, setReview] = useState("");
  const nav = useNavigate();
  useEffect(() => { if (!start || !end) return; let active = true; fetch(`/api/analysis?start=${start}&end=${end}`).then(r => r.ok ? r.json() : null).then(d => { if (active) setPreview(d) }).catch(() => { if (active) setPreview(null) }); return () => { active = false } }, [start, end]);
  const choose = (type, id) => { if (type === "start") { setStart(id); if (id === end) setEnd("") } else { setEnd(id); if (id === start) setStart("") } setError("") };
  const loc = id => locations.find(x => x.id === id); const stats = preview?.counts || { total: 0, regulatory: 0, cautionary: 0, informational: 0 };
const makeReview = () => {
  if (!start || !end || start === end) {
    return setError("Select two different locations on the map.");
  }

  const signs = preview?.detections || [];

  const signNames = signs
    .map((s) => s.name || s.label || s.description || "")
    .filter(Boolean);

  const uniqueSigns = [...new Set(signNames)];

  const hasSpeedSigns = uniqueSigns.some((s) =>
    /speed|km\/h|kmh/i.test(s)
  );

  const hasPedestrianSigns = uniqueSigns.some((s) =>
    /pedestrian|crossing|school|walk/i.test(s)
  );

  const hasWarningSigns = uniqueSigns.some((s) =>
    /warning|caution|curve|bend|danger/i.test(s)
  );

  const hasRestrictionSigns = uniqueSigns.some((s) =>
    /no parking|no entry|prohibited|restriction|u-turn|one way|stop/i.test(s)
  );

  const safetyPoints = [];

  if (hasSpeedSigns) {
    safetyPoints.push(
      "Speed-related signs were detected along the route. Drivers should observe the applicable speed restrictions and adjust their speed according to the signs encountered."
    );
  }

  if (hasPedestrianSigns) {
    safetyPoints.push(
      "Pedestrian-related signage was detected. Drivers should remain alert to pedestrian movement and take additional care near the indicated areas."
    );
  }

  if (hasWarningSigns) {
    safetyPoints.push(
      "Warning signage was detected along the route. Drivers should remain attentive and take the appropriate precautions indicated by these signs."
    );
  }

  if (hasRestrictionSigns) {
    safetyPoints.push(
      "Traffic restriction signs were detected. Drivers should follow the applicable restrictions while travelling along the route."
    );
  }

  const safetyAnalysis =
    safetyPoints.length > 0
      ? safetyPoints.join("\n\n")
      : "The available detected signboard data does not provide enough information to identify specific safety concerns for this route. Drivers should follow the signs encountered during their journey.";

  const text = `AI Road Safety Review

Route Overview

Start Location: ${loc(start)?.name || "Not available"}
Destination: ${loc(end)?.name || "Not available"}
Distance: ${preview?.distance || "Not available"}
Estimated Travel Time: ${preview?.travelTime || "Not available"}

Overall Safety Assessment

${safetyAnalysis}

Key Safety Concerns

${
  safetyPoints.length > 0
    ? safetyPoints.join("\n\n")
    : "Insufficient detected sign information is available to identify specific concerns."
}

Recommended Driving Behaviour

Drivers should follow the road signs detected along the selected route, adjust their driving behaviour according to the indicated restrictions and warnings, and remain attentive throughout the journey.

AI Conclusion

${
  signs.length > 0
    ? `Based on ${signs.length} detected signboard records along the selected route, drivers should remain attentive to the traffic regulations and safety indications present. The assessment is based only on the available signboard detection data.`
    : "Insufficient signboard detection data is available for a route-specific safety assessment."
}`;

  setReview(text);
  setReviewOpen(true);
};  return <><section className="home-hero"><div className="home-overlay" /><div className="home-content"><div className="home-heading"><span className="eyebrow">SMARTER ROUTES · SAFER ROADS</span><h1>IITM <em>Road Safety</em> Analytics</h1><p>A safer IITM for everyone</p></div><CampusMap start={start} end={end} onSelect={choose} onAnalyse={makeReview} />{error && <p className="selector-error">{error}</p>}</div></section>
    <section className="home-preview"><div className="preview-title"><BarChart3 /><h2>Analysis Results</h2><span>{preview ? "Route data" : "Select a route to view data"}</span></div><div className="preview-grid"><article className="preview-card"><h3><AlertTriangle /> Detected Road Signs</h3><div className="summary-icons">{[["↔", stats.total, "Total Signboards"], ["20", stats.regulatory, "Regulatory"], ["⚠", stats.cautionary, "Cautionary"], ["P", stats.informational, "Informational"], ["!", stats.other || 0, "Other Signs"]].map((x, i) => <div key={i}><strong>{x[0]}</strong><b>{x[1]}</b><small>{x[2]}</small></div>)}</div><div className="preview-signs">{(preview?.detections || []).slice(0, 5).map(s => <div key={s.id}>{s.image ? <img className="preview-image-empty" src={s.image} alt={s.name} /> : <div className="preview-image-empty" role="img" aria-label={`${s.name} image not available`}></div>}<small>{s.name}</small></div>)}</div><Link to="/analysis" state={{ start, end }} className="view-analysis">View full analysis →</Link></article><article className="preview-card gps-card"><h3><MapPin /> GPS Location Information</h3><p><i className="legend-start" /> <b>Start: {loc(start)?.name || "—"}</b></p><small>Latitude: {loc(start)?.lat?.toFixed(7) || "—"}</small><small>Longitude: {loc(start)?.lon?.toFixed(7) || "—"}</small><p><i className="legend-end" /> <b>Destination: {loc(end)?.name || "—"}</b></p><small>Latitude: {loc(end)?.lat?.toFixed(7) || "—"}</small><small>Longitude: {loc(end)?.lon?.toFixed(7) || "—"}</small><hr /><h4><Navigation /> Distance <b>{preview?.distance || "—"}</b></h4><h4><Clock3 /> Estimated Travel Time <b>{preview?.travelTime || "—"}</b></h4></article></div></section>
    {reviewOpen && <div className="review-modal-backdrop" onClick={() => setReviewOpen(false)}><section className="review-modal" onClick={e => e.stopPropagation()}><header><div><span className="eyebrow dark">ROUTE-SPECIFIC AI REVIEW</span><h2>AI Road Safety Review</h2></div><button className="modal-close" onClick={() => { setReviewOpen(false); nav("/analysis", { state: { start, end, aiReview: review } }) }} aria-label="Close review and open analysis">×</button></header><div className="review-body"><p><b>Route:</b> {loc(start)?.name} → {loc(end)?.name}</p><p>This review is based on the actual route-matched detections. It is a structured review prompt/content preview; AI generation requires connecting an AI model/API.</p><pre>{review}</pre></div><footer><button className="analyse-btn" onClick={() => { setReviewOpen(false); nav("/analysis", { state: { start, end, aiReview: review } }) }}>Close & View Analysis <ArrowRight size={17} /></button></footer></section></div>}
  </>;
}

function Analysis() {
  const { state } = useLocation();
  const [start, setStart] = useState(state?.start || "main-gate"), [end, setEnd] = useState(state?.end || "gajendra-circle");
  const [result, setResult] = useState(null), [loading, setLoading] = useState(true), [error, setError] = useState("");
  const nav = useNavigate();
  const run = () => nav("/analysis", { state: { start, end } });
  useEffect(() => {
    let active = true; setLoading(true); setError("");
    fetch(`/api/analysis?start=${start}&end=${end}`)
      .then(async r => { const d = await r.json(); if (!r.ok) throw new Error(d.error || "Could not load route analysis."); return d })
      .then(d => { if (active) setResult(d) })
      .catch(e => { if (active) { setResult(null); setError(e.message) } })
      .finally(() => { if (active) setLoading(false) });
    return () => { active = false };
  }, [start, end]);
  const counts = result?.counts || { total: 0, regulatory: 0, cautionary: 0, informational: 0, other: 0 };
  const signs = result?.detections || [];
  const statCards = [["↔", counts.total, "Total Signboards Detected"], ["20", counts.regulatory, "Regulatory Signs"], ["⚠", counts.cautionary, "Cautionary Signs"], ["P", counts.informational, "Informational Signs"], ["!", counts.other, "Other Signs"]];
  return <main className="analysis-page"><section className="analysis-hero"><div className="analysis-hero-shade" /><div className="analysis-hero-inner"><div className="breadcrumb"><Link to="/">Home</Link>　›　 Analysis</div><span className="eyebrow">CAMPUS ROUTE INTELLIGENCE</span><h1>Road Safety <em>Analysis</em></h1><p>Analysis results for the selected route in IITM</p><p className="analysis-route-selection">Selected route: <b>{locations.find(x => x.id === start)?.name} → {locations.find(x => x.id === end)?.name}</b></p></div></section>
    <section className="analysis-dashboard">{state?.aiReview && <article className="ai-review-card"><h2>Route-Specific AI Review</h2><pre>{state.aiReview}</pre><small>AI API connection is not active yet; this is the route-specific prompt generated from returned detections.</small></article>}<div className="dashboard-top"><article className="dash-card summary-card"><h3><AlertTriangle /> Detected Road Signs (Summary)</h3><div className="summary-icons">{statCards.map((x, i) => <div key={i}><strong>{x[0]}</strong><b>{loading ? "…" : x[1]}</b><small>{x[2]}</small></div>)}</div></article><article className="dash-card gps-card"><h3><MapPin /> GPS Location Information</h3><p><i className="legend-start" /> <b>Start: {result?.start.name || locations.find(x => x.id === start)?.name}</b></p><small>Latitude: {result?.start.lat.toFixed(7)}° N</small><small>Longitude: {result?.start.lon.toFixed(7)}° E</small><p><i className="legend-end" /> <b>Destination: {result?.destination.name || locations.find(x => x.id === end)?.name}</b></p><small>Latitude: {result?.destination.lat.toFixed(7)}° N</small><small>Longitude: {result?.destination.lon.toFixed(7)}° E</small><hr /><h4><Navigation /> Distance <b>{result?.distance || "—"}</b></h4><h4><Clock3 /> Estimated Travel Time <b>{result?.travelTime || "—"}</b></h4></article></div>
      <section className="signboard-section"><div className="signboard-heading"><div><h2><span>▤</span> List of Detected Signboards</h2><p>Signboards ordered along the selected campus route · {result?.dataset?.totalRows ?? "…"} signboards in database</p></div></div>
        {loading && <p className="empty-state">Loading signboards for this route…</p>}
        {error && <p className="empty-state">{error} Make sure the backend server is running.</p>}
        {!loading && !error && signs.length === 0 && <p className="empty-state">No matching signboards were found in the database within the selected route corridor.</p>}
        <div className="signboard-grid">{signs.map(s => <article className="signboard" key={s.id}><div className="sign-thumb">{s.image ? <img src={s.image} alt="Detected sign snapshot" /> : <span className="image-unavailable">Image<br />not available</span>}</div><div className="sign-info"><p>{s.description}</p><small>Latitude: {Number(s.lat).toFixed(7)}° N</small><small>Longitude: {Number(s.lon).toFixed(7)}° E</small></div></article>)}</div>
        {result && <p className="dataset-note">{result.dataset.uniqueSignboards} signboards matched this route. {result.note}</p>}
      </section></section></main>;
}

function About() { return <main className="simple-page"><span className="eyebrow dark">ABOUT THE PROJECT</span><h1>Safer journeys.<br /><em>Smarter campus.</em></h1><p className="lead">IITM Road Safety Analytics is a campus-focused platform that brings together video-based road-sign detection and location information to make campus journeys safer and more informed.</p><section className="about-block"><h2>What the project does</h2><p>Road videos can be analysed to identify signboards and associate each detection with geographic coordinates. When a visitor selects a starting point and destination, the platform is designed to show relevant road signs along that route, including their images, latitude, longitude and a simple explanation of their meaning and usage.</p></section></main> }
function Contact() { return <main className="simple-page"><span className="eyebrow dark">THE PROJECT TEAM</span><h1>Meet our team.</h1><p className="lead">Indian Institute of Technology Madras</p><div className="team-grid">{[["AISHWARYA", "ME23B139"], ["SONAM", "ME23B078"]].map(m => <article key={m[1]}><UserRound /><h2>{m[0]}</h2><p><GraduationCap size={17} /> {m[1]}</p><small>Indian Institute of Technology Madras</small></article>)}</div></main> }

// ------------------------------------------------------------------ admin API helpers
const TOKEN_KEY = "iitm-admin-token";
const getToken = () => { try { return sessionStorage.getItem(TOKEN_KEY) } catch { return null } };
async function adminFetch(url, opts = {}) {
  const r = await fetch(url, { ...opts, headers: { ...(opts.headers || {}), Authorization: `Bearer ${getToken()}` } });
  if (r.status === 401) { try { sessionStorage.removeItem(TOKEN_KEY) } catch {} window.location.assign("/admin-login"); throw new Error("Signed out") }
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data.error || `Request failed (${r.status})`);
  return data;
}
// XHR so the admin sees upload progress (fetch has no upload progress events)
function uploadVideo(file, onProgress) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest(), form = new FormData();
    form.append("video", file);
    xhr.open("POST", "/api/admin/videos");
    xhr.setRequestHeader("Authorization", `Bearer ${getToken()}`);
    xhr.upload.onprogress = e => e.lengthComputable && onProgress(Math.round(e.loaded / e.total * 100));
    xhr.onload = () => { let d = {}; try { d = JSON.parse(xhr.responseText) } catch {} xhr.status < 300 ? resolve(d) : reject(new Error(d.error || `Upload failed (${xhr.status})`)) };
    xhr.onerror = () => reject(new Error("Network error during upload"));
    xhr.send(form);
  });
}
const fmtSize = b => b ? (b / 1024 / 1024).toFixed(1) + " MB" : "";
const fmtDate = d => d ? new Date(d).toLocaleString() : "";
const STATUS_TEXT = { pending: "Waiting for worker", processing: "Processing…", done: "Done", failed: "Failed" };

function AdminLogin({ onLogin }) {
  const [u, U] = useState(""), [p, P] = useState(""), [err, E] = useState(""), [busy, B] = useState(false); const nav = useNavigate();
  const submit = async e => {
    e.preventDefault(); B(true); E("");
    try {
      const r = await fetch("/api/admin/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username: u, password: p }) });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error || "Sign-in failed.");
      onLogin(d.token); nav("/admin");
    } catch (x) { E(x.message) } finally { B(false) }
  };
  return <main className="login-page"><form className="login-card" onSubmit={submit}><Link to="/" className="back-link"><ArrowLeft size={15} /> Back to website</Link><ShieldCheck size={38} /><span className="eyebrow dark">RESTRICTED ACCESS</span><h1>Admin sign in</h1><p>Sign in to upload new campus road videos and review detections.</p><label>Username<input value={u} onChange={e => U(e.target.value)} required /></label><label>Password<input type="password" value={p} onChange={e => P(e.target.value)} required /></label>{err && <p className="error">{err}</p>}<button className="analyse-btn" disabled={busy}>{busy ? "Signing in…" : <>Sign in securely <ArrowRight size={17} /></>}</button></form></main>;
}

function AdminPortal({ onLogout }) {
  const [section, setSection] = useState("dashboard");
  const [profile, setProfile] = useState({ name: "RoadSafe Admin", email: "admin@iitm.ac.in" });
  const [queue, setQueue] = useState([]);          // files picked for upload: {file, progress, state, error}
  const [uploading, setUploading] = useState(false);
  const [videos, setVideos] = useState([]);
  const [videosError, setVideosError] = useState("");
  const [datasetStats, setDatasetStats] = useState({ signs: "…", detections: "…", signTypes: "…", sourceVideos: "…" });
  const [serverStatus, setServerStatus] = useState(null);
  const [labels, setLabels] = useState([]);
  const [detVideo, setDetVideo] = useState("");
  const [detections, setDetections] = useState([]);
  const [detError, setDetError] = useState("");

  const menu = [
    ["dashboard", "Dashboard", LayoutDashboard],
    ["upload", "Upload Videos", UploadCloud],
    ["videos", "All Videos", Video],
    ["detections", "Detection Management", ListChecks],
    ["settings", "Admin Settings", Settings],
  ];

  const loadVideos = () => adminFetch("/api/admin/videos").then(d => { setVideos(d.videos); setVideosError("") }).catch(e => setVideosError(e.message));
  const loadStats = () => {
    fetch("/api/stats").then(r => r.ok ? r.json() : null).then(d => { if (d) setDatasetStats(d) }).catch(() => {});
    adminFetch("/api/admin/status").then(setServerStatus).catch(() => {});
  };
  const loadDetections = () => adminFetch(`/api/admin/detections${detVideo ? `?video_id=${detVideo}` : ""}`).then(d => { setDetections(d.detections); setDetError("") }).catch(e => setDetError(e.message));

  // poll so pending -> processing -> done shows up without a reload
  useEffect(() => { loadVideos(); loadStats(); const t = setInterval(() => { loadVideos(); loadStats() }, 10000); return () => clearInterval(t) }, []);
  useEffect(() => { adminFetch("/api/admin/labels").then(d => setLabels(d.labels)).catch(() => {}) }, []);
  useEffect(() => { if (section === "detections") loadDetections() }, [section, detVideo]);

  const startUpload = async () => {
    setUploading(true);
    for (let i = 0; i < queue.length; i++) {
      if (queue[i].state === "done") continue;
      const set = patch => setQueue(q => q.map((x, j) => j === i ? { ...x, ...patch } : x));
      set({ state: "uploading", progress: 0, error: "" });
      try { await uploadVideo(queue[i].file, p => set({ progress: p, state: p === 100 ? "saving" : "uploading" })); set({ state: "done", progress: 100 }) }
      catch (e) { set({ state: "error", error: e.message }) }
      loadVideos();
    }
    setUploading(false);
  };
  const act = (promise, after) => promise.then(after).catch(e => alert(e.message));
  const retryVideo = id => act(adminFetch(`/api/admin/videos/${id}/retry`, { method: "POST" }), loadVideos);
  const deleteVideo = v => window.confirm(`Delete ${v.filename} and all its detections? This also removes it from Google Drive.`) && act(adminFetch(`/api/admin/videos/${v.id}`, { method: "DELETE" }), () => { loadVideos(); loadStats() });
  const relabel = (id, label) => act(adminFetch(`/api/admin/detections/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ label }) }), () => { loadDetections(); loadStats() });
  const deleteDetection = id => window.confirm("Delete this detection?") && act(adminFetch(`/api/admin/detections/${id}`, { method: "DELETE" }), () => { loadDetections(); loadStats() });

  const counts = videos.reduce((c, v) => ({ ...c, [v.status]: (c[v.status] || 0) + 1 }), {});
  const waiting = (counts.pending || 0) + (counts.processing || 0);
  const currentSection = menu.find(m => m[0] === section)?.[1] || "Dashboard";
  const videoRow = (v, actions = true) => <div className="admin-row" key={v.id}>
    <FileVideo />
    <span>{v.filename}<small>{v.source === "upload" ? `Uploaded ${fmtDate(v.uploaded_at)}` : "Processed in Colab"}{v.size_bytes ? ` · ${fmtSize(v.size_bytes)}` : ""}{v.status === "done" ? ` · ${v.n_detections ?? 0} detections` : ""}{v.status === "failed" && v.error ? ` · ${v.error}` : ""}</small></span>
    <b className={`status-${v.status}`} title={v.error || ""}>{STATUS_TEXT[v.status] || v.status}</b>
    {actions && v.status === "failed" && <button className="admin-retry" title="Process again" onClick={() => retryVideo(v.id)}>Retry</button>}
    {actions && <button title="Delete video and its detections" onClick={() => deleteVideo(v)}><Trash2 /></button>}
  </div>;
  const queueText = q => q.state === "ready" ? "Ready" : q.state === "uploading" ? `Uploading ${q.progress}%` : q.state === "saving" ? "Saving to Google Drive…" : q.state === "done" ? "Uploaded, queued for processing" : `Error: ${q.error}`;

  return (
    <main className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-brand"><img src="/images/iitm-logo.png" alt="IIT Madras" /><div><b>RoadSafe</b><small>Admin Portal</small></div></div>
        <nav>{menu.map(([id, label, Icon]) => <button key={id} className={section === id ? "selected" : ""} onClick={() => setSection(id)}><Icon size={18} />{label}</button>)}</nav>
        <button className="admin-logout" onClick={onLogout}><LogOut size={17} />Logout</button>
      </aside>

      <section className="admin-main">
        <header className="admin-topbar"><div><span>ADMIN PORTAL</span><h1>{currentSection}</h1></div><div className="admin-user"><UserRound /><span>{profile.name}<small>Administrator</small></span></div></header>

        {section === "dashboard" && <div className="admin-content">
          <div style={{ position: "relative", borderRadius: "18px", overflow: "hidden", minHeight: "210px" }}>
            <img src="/images/iitm-campus-road.jpg" alt="IIT Madras campus road" style={{ width: "100%", height: "230px", objectFit: "cover", display: "block" }} />
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, rgba(5,45,28,.85), rgba(5,45,28,.2))", display: "flex", flexDirection: "column", justifyContent: "center", padding: "28px", color: "white" }}>
              <h2 style={{ margin: "0 0 8px" }}>Welcome to RoadSafe Admin</h2>
              <p style={{ margin: 0, maxWidth: "500px" }}>Upload campus road videos. Each one is processed by the detection worker and its signboards appear on the route analysis pages.</p>
            </div>
          </div>
          {serverStatus && !serverStatus.driveConfigured && <p className="admin-security-note"><AlertTriangle />Google Drive is not configured on the server, so uploads will fail. See backend/README.md.</p>}
          {waiting > 0 && <p className="admin-security-note"><Info />{waiting} video(s) waiting for processing. The Colab worker must be running to process them.</p>}
          <div className="admin-stat-grid">
            {[["Videos Processed", counts.done || 0, Video], ["Waiting / Processing", waiting, Clock3], ["Failed", counts.failed || 0, AlertTriangle], ["Unique Signboards", datasetStats.signs, ListChecks], ["Signboard Categories", datasetStats.signTypes, MapPin]].map(([title, value, Icon]) =>
              <article key={title}><Icon /><small>{title}</small><b>{value}</b></article>)}
          </div>
          <div className="admin-content-card"><h2>Recent Videos</h2>{videosError && <p className="error">{videosError}</p>}{videos.length ? videos.slice(0, 5).map(v => videoRow(v, false)) : <p className="admin-empty">No videos yet.</p>}</div>
        </div>}

        {section === "upload" && <div className="admin-content"><div className="admin-content-card">
          <h2>Upload Campus Road Videos</h2>
          <p>Videos are saved to Google Drive and queued. The Colab worker then detects the signs and adds them to the database. Keep the dashcam file name (for example NO20240110-034606-029986F.MP4): it holds the recording date.</p>
          <label className="admin-dropzone"><UploadCloud /><b>Browse video files</b><small>MP4, MOV, AVI or MKV, up to 2 GB each</small>
            <input type="file" accept="video/*,.mp4,.mov,.avi,.mkv" multiple disabled={uploading} onChange={e => { const picked = Array.from(e.target.files || []); setQueue(q => [...q, ...picked.map(file => ({ file, progress: 0, state: "ready", error: "" }))]); e.target.value = "" }} />
          </label>
          {queue.map((q, i) => <div className="admin-row" key={i}>
            <FileVideo />
            <span>{q.file.name}<small>{fmtSize(q.file.size)} · {queueText(q)}</small>
              {(q.state === "uploading" || q.state === "saving") && <i className="admin-progress"><i style={{ width: `${q.progress}%` }} /></i>}</span>
            {q.state === "done" ? <b className="status-done">Queued</b> : q.state === "error" ? <b className="status-failed">Failed</b> : null}
            {!uploading && q.state !== "done" && <button title="Remove file" onClick={() => setQueue(p => p.filter((_, j) => j !== i))}><Trash2 /></button>}
          </div>)}
          <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
            <button className="analyse-btn" disabled={uploading || !queue.some(q => q.state === "ready" || q.state === "error")} onClick={startUpload}><UploadCloud size={18} />{uploading ? "Uploading…" : "Upload Selected Videos"}</button>
            {!uploading && queue.some(q => q.state === "done") && <button className="admin-retry" onClick={() => setQueue(q => q.filter(x => x.state !== "done"))}>Clear finished</button>}
          </div>
        </div></div>}

        {section === "videos" && <div className="admin-content"><div className="admin-content-card">
          <h2>Video Library</h2>
          <p>Every video in the database. The status refreshes every 10 seconds. Deleting a video removes its detections and its signboards from the route pages.</p>
          {videosError && <p className="error">{videosError}</p>}
          {videos.length ? videos.map(v => videoRow(v)) : <p className="admin-empty">No videos yet.</p>}
        </div></div>}

        {section === "detections" && <div className="admin-content"><div className="admin-content-card">
          <h2>Detection Management</h2>
          <p>The database contains {datasetStats.signs} unique signboards ({datasetStats.detections} raw detections) in {datasetStats.signTypes} categories from {datasetStats.sourceVideos} processed videos. Fix a wrong label or delete a false detection here. The route pages update after the worker merges duplicates again (within about 30 seconds while it is running).</p>
          {serverStatus?.signsDirty && <p className="admin-security-note"><Info />There are edits the route pages don't show yet. They appear once the Colab worker has run.</p>}
          <label className="admin-field">Video
            <select value={detVideo} onChange={e => setDetVideo(e.target.value)}>
              <option value="">All videos</option>
              {videos.filter(v => v.status === "done").map(v => <option key={v.id} value={v.id}>{v.filename} ({v.n_detections ?? 0})</option>)}
            </select>
          </label>
          {detError && <p className="error">{detError}</p>}
          <div className="admin-det-grid">
            {detections.map(d => <article key={d.id}>
              {d.image ? <img src={d.image} alt={d.name || d.label} loading="lazy" /> : <div className="admin-det-noimg">No image</div>}
              <div>
                <select value={d.label} onChange={e => relabel(d.id, e.target.value)} title="Change label">
                  {labels.map(l => <option key={l.label} value={l.label}>{l.name}</option>)}
                  {!labels.some(l => l.label === d.label) && <option value={d.label}>{d.label}</option>}
                </select>
                <small>{Math.round(d.confidence * 100)}% · {d.video} @ {d.time_s}s</small>
                <small>{d.lat != null ? `${d.lat.toFixed(4)}, ${d.lon.toFixed(4)}` : "no GPS"}</small>
                <button title="Delete detection" onClick={() => deleteDetection(d.id)}><Trash2 size={15} /> Delete</button>
              </div>
            </article>)}
          </div>
          {!detections.length && !detError && <p className="admin-empty">No detections.</p>}
        </div></div>}

        {section === "settings" && <div className="admin-content"><div className="admin-content-card">
          <h2>Admin Profile & Settings</h2>
          <label className="admin-field">Display Name<input value={profile.name} onChange={e => setProfile({ ...profile, name: e.target.value })} /></label>
          <label className="admin-field">Email Address<input type="email" value={profile.email} onChange={e => setProfile({ ...profile, email: e.target.value })} /></label>
          <p className="admin-security-note"><ShieldCheck />The admin username and password are set on the server (ADMIN_USER / ADMIN_PASSWORD in backend/.env).</p>
        </div></div>}
      </section>
    </main>
  );
}
function App() { const [admin, setAdmin] = useState(Boolean(getToken())); const login = t => { setAdmin(Boolean(t)); try { if (t) sessionStorage.setItem(TOKEN_KEY, t); else sessionStorage.removeItem(TOKEN_KEY) } catch {} }; return <BrowserRouter><Routes><Route path="/admin-login" element={<AdminLogin onLogin={login} />} /><Route path="/admin" element={admin ? <AdminPortal onLogout={() => login(null)} /> : <Navigate to="/admin-login" replace />} /><Route path="/*" element={<><Navbar /><Routes><Route path="/" element={<Home />} /><Route path="/analysis" element={<Analysis />} /><Route path="/about" element={<About />} /><Route path="/contact" element={<Contact />} /></Routes><Footer /></>} /></Routes></BrowserRouter> }
export default App;
