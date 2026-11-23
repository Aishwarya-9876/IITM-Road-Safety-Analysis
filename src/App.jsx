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
    <section className="home-preview"><div className="preview-title"><BarChart3 /><h2>Analysis Results</h2><span>{preview ? "CSV route data" : "Select a route to view data"}</span></div><div className="preview-grid"><article className="preview-card"><h3><AlertTriangle /> Detected Road Signs</h3><div className="summary-icons">{[["↔", stats.total, "Total Signboards"], ["20", stats.regulatory, "Regulatory"], ["⚠", stats.cautionary, "Cautionary"], ["P", stats.informational, "Informational"], ["!", stats.other || 0, "Other Signs"]].map((x, i) => <div key={i}><strong>{x[0]}</strong><b>{x[1]}</b><small>{x[2]}</small></div>)}</div><div className="preview-signs">{(preview?.detections || []).slice(0, 5).map(s => <div key={s.id}>{s.image ? <img className="preview-image-empty" src={s.image} alt={s.name} /> : <div className="preview-image-empty" role="img" aria-label={`${s.name} image not available`}></div>}<small>{s.name}</small></div>)}</div><Link to="/analysis" state={{ start, end }} className="view-analysis">View full analysis →</Link></article><article className="preview-card gps-card"><h3><MapPin /> GPS Location Information</h3><p><i className="legend-start" /> <b>Start: {loc(start)?.name || "—"}</b></p><small>Latitude: {loc(start)?.lat?.toFixed(7) || "—"}</small><small>Longitude: {loc(start)?.lon?.toFixed(7) || "—"}</small><p><i className="legend-end" /> <b>Destination: {loc(end)?.name || "—"}</b></p><small>Latitude: {loc(end)?.lat?.toFixed(7) || "—"}</small><small>Longitude: {loc(end)?.lon?.toFixed(7) || "—"}</small><hr /><h4><Navigation /> Distance <b>{preview?.distance || "—"}</b></h4><h4><Clock3 /> Estimated Travel Time <b>{preview?.travelTime || "—"}</b></h4></article></div></section>
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
    <section className="analysis-dashboard">{state?.aiReview && <article className="ai-review-card"><h2>Route-Specific AI Review</h2><pre>{state.aiReview}</pre><small>AI API connection is not active yet; this is the route-specific prompt generated from returned CSV detections.</small></article>}<div className="dashboard-top"><article className="dash-card summary-card"><h3><AlertTriangle /> Detected Road Signs (Summary)</h3><div className="summary-icons">{statCards.map((x, i) => <div key={i}><strong>{x[0]}</strong><b>{loading ? "…" : x[1]}</b><small>{x[2]}</small></div>)}</div></article><article className="dash-card gps-card"><h3><MapPin /> GPS Location Information</h3><p><i className="legend-start" /> <b>Start: {result?.start.name || locations.find(x => x.id === start)?.name}</b></p><small>Latitude: {result?.start.lat.toFixed(7)}° N</small><small>Longitude: {result?.start.lon.toFixed(7)}° E</small><p><i className="legend-end" /> <b>Destination: {result?.destination.name || locations.find(x => x.id === end)?.name}</b></p><small>Latitude: {result?.destination.lat.toFixed(7)}° N</small><small>Longitude: {result?.destination.lon.toFixed(7)}° E</small><hr /><h4><Navigation /> Distance <b>{result?.distance || "—"}</b></h4><h4><Clock3 /> Estimated Travel Time <b>{result?.travelTime || "—"}</b></h4></article></div>
      <section className="signboard-section"><div className="signboard-heading"><div><h2><span>▤</span> List of Detected Signboards</h2><p>CSV detections ordered along the selected campus route · {result?.dataset?.totalRows || 58} records in source dataset</p></div></div>
        {loading && <p className="empty-state">Loading signboards for this route…</p>}
        {error && <p className="empty-state">{error} Make sure the backend server is running.</p>}
        {!loading && !error && signs.length === 0 && <p className="empty-state">No matching signboards were found in the CSV within the selected route corridor.</p>}
        <div className="signboard-grid">{signs.map(s => <article className="signboard" key={s.id}><div className="sign-thumb">{s.image ? <img src={s.image} alt="Detected sign snapshot" /> : <span className="image-unavailable">Image<br />not available</span>}</div><div className="sign-info"><p>{s.description}</p><small>Latitude: {Number(s.lat).toFixed(7)}° N</small><small>Longitude: {Number(s.lon).toFixed(7)}° E</small></div></article>)}</div>
        {result && <p className="dataset-note">{result.dataset.matchingRows} CSV detections matched this route; {result.dataset.uniqueSignboards} nearby repeat detections grouped into signboard records. {result.note}</p>}
      </section></section></main>;
}

function About() { return <main className="simple-page"><span className="eyebrow dark">ABOUT THE PROJECT</span><h1>Safer journeys.<br /><em>Smarter campus.</em></h1><p className="lead">IITM Road Safety Analytics is a campus-focused platform that brings together video-based road-sign detection and location information to make campus journeys safer and more informed.</p><section className="about-block"><h2>What the project does</h2><p>Road videos can be analysed to identify signboards and associate each detection with geographic coordinates. When a visitor selects a starting point and destination, the platform is designed to show relevant road signs along that route, including their images, latitude, longitude and a simple explanation of their meaning and usage.</p></section></main> }
function Contact() { return <main className="simple-page"><span className="eyebrow dark">THE PROJECT TEAM</span><h1>Meet our team.</h1><p className="lead">Indian Institute of Technology Madras</p><div className="team-grid">{[["AISHWARYA", "ME23B139"], ["SONAM", "ME23B078"]].map(m => <article key={m[1]}><UserRound /><h2>{m[0]}</h2><p><GraduationCap size={17} /> {m[1]}</p><small>Indian Institute of Technology Madras</small></article>)}</div></main> }

function AdminLogin({ onLogin }) { const [u, U] = useState(""), [p, P] = useState(""), [err, E] = useState(""); const nav = useNavigate(); return <main className="login-page"><form className="login-card" onSubmit={e => { e.preventDefault(); if (u === "admin" && p === "admin123") { onLogin(true); nav("/admin") } else E("Invalid demo credentials.") }}><Link to="/" className="back-link"><ArrowLeft size={15} /> Back to website</Link><ShieldCheck size={38} /><span className="eyebrow dark">RESTRICTED ACCESS</span><h1>Admin sign in</h1><p>Sign in to upload a new campus road video.</p><label>Username<input value={u} onChange={e => U(e.target.value)} required /></label><label>Password<input type="password" value={p} onChange={e => P(e.target.value)} required /></label>{err && <p className="error">{err}</p>}<button className="analyse-btn">Sign in securely <ArrowRight size={17} /></button><small className="demo-note">Frontend demo: admin / admin123. Replace with backend authentication before deployment.</small></form></main> }
function AdminPortal({ onLogout }) {
  const [section, setSection] = useState("dashboard");
  const [files, setFiles] = useState([]);
  const [profile, setProfile] = useState({
    name: "RoadSafe Admin",
    email: "admin@iitm.ac.in",
  });

  const menu = [
    ["dashboard", "Dashboard", LayoutDashboard],
    ["upload", "Upload Videos", UploadCloud],
    ["videos", "All Videos", Video],
    ["detections", "Detection Management", ListChecks],
    ["settings", "Admin Settings", Settings],
  ];

  const videos = files.map((f, i) => ({
    id: i + 1,
    name: f.name,
    date: new Date().toLocaleDateString(),
    status: "Pending",
    size: (f.size / 1024 / 1024).toFixed(1) + " MB",
  }));

  // Statistics from the currently available signs.csv dataset
  const datasetStats = {
    detections: 58,
    signTypes: 12,
    sourceVideos: 7,
  };

  // Sample records from the current CSV
  const sampleSigns = [
    {
      label: "Cycle Path",
      snapshot: "NO20210203-140716-013835F_track19.jpg",
      description:
        "Indicates a designated path for cyclists. Cyclists should use this lane.",
    },
    {
      label: "Pedestrian Path",
      snapshot: "NO20210203-140716-013835F_track20.jpg",
      description:
        "Indicates a designated walkway for pedestrians.",
    },
    {
      label: "Direction Board",
      snapshot: "NO20210203-140716-013835F_track22.jpg",
      description:
        "Provides directions to departments, buildings and campus facilities.",
    },
    {
      label: "No Parking",
      snapshot: "NO20210203-140716-013835F_track54.jpg",
      description:
        "Indicates a parking restriction at the specified location.",
    },
  ];

  const currentSection =
    menu.find((m) => m[0] === section)?.[1] || "Dashboard";

  return (
    <main className="admin-shell">

      {/* SIDEBAR */}

      <aside className="admin-sidebar">

        <div className="admin-brand">
          <img src="/images/iitm-logo.png" alt="IIT Madras" />

          <div>
            <b>RoadSafe</b>
            <small>Admin Portal</small>
          </div>
        </div>

        <nav>
          {menu.map(([id, label, Icon]) => (
            <button
              key={id}
              className={section === id ? "selected" : ""}
              onClick={() => setSection(id)}
            >
              <Icon size={18} />
              {label}
            </button>
          ))}
        </nav>

        <button className="admin-logout" onClick={onLogout}>
          <LogOut size={17} />
          Logout
        </button>

      </aside>


      {/* MAIN CONTENT */}

      <section className="admin-main">

        <header className="admin-topbar">

          <div>
            <span>ADMIN PORTAL</span>
            <h1>{currentSection}</h1>
          </div>

          <div className="admin-user">
            <UserRound />

            <span>
              {profile.name}
              <small>Administrator</small>
            </span>
          </div>

        </header>


        {/* DASHBOARD */}

        {section === "dashboard" && (
          <div className="admin-content">

            {/* CAMPUS IMAGE BANNER */}

            <div
              style={{
                position: "relative",
                borderRadius: "18px",
                overflow: "hidden",
                minHeight: "210px",
                marginBottom: "24px",
              }}
            >

              <img
                src="/images/iitm-campus-road.jpg"
                alt="IIT Madras campus road"
                style={{
                  width: "100%",
                  height: "230px",
                  objectFit: "cover",
                  display: "block",
                }}
              />

              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background:
                    "linear-gradient(90deg, rgba(5,45,28,.85), rgba(5,45,28,.2))",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  padding: "28px",
                  color: "white",
                }}
              >
                <h2 style={{ margin: "0 0 8px" }}>
                  Welcome to RoadSafe Admin
                </h2>

                <p style={{ margin: 0, maxWidth: "500px" }}>
                  Manage road videos and review the signboard detection
                  dataset available for IIT Madras campus.
                </p>
              </div>

            </div>


            {/* ONLY DATA THAT CURRENTLY EXISTS */}

            <div className="admin-stat-grid">

              {[
                ["Uploaded Videos", files.length, Video],
                ["Signboard Detections", datasetStats.detections, ListChecks],
                ["Signboard Categories", datasetStats.signTypes, MapPin],
              ].map(([title, value, Icon]) => (
                <article key={title}>
                  <Icon />
                  <small>{title}</small>
                  <b>{value}</b>
                </article>
              ))}

            </div>


           


            {/* RECENT UPLOADS */}

            <div className="admin-content-card">

              <h2>Recent Video Uploads</h2>

              {videos.length > 0 ? (
                videos.slice(-5).reverse().map((video) => (
                  <div className="admin-row" key={video.id}>

                    <FileVideo />

                    <span>
                      {video.name}
                      <small>
                        {video.date} · {video.size}
                      </small>
                    </span>

                    <b className="status-pending">
                      {video.status}
                    </b>

                  </div>
                ))
              ) : (
                <p className="admin-empty">
                  No videos uploaded in this session yet.
                </p>
              )}

            </div>

          </div>
        )}


        {/* UPLOAD VIDEOS */}

        {section === "upload" && (
          <div className="admin-content">

            <div className="admin-content-card">

              <h2>Upload Campus Road Videos</h2>

              <p>
                Select one or multiple videos for the road-sign detection
                pipeline.
              </p>

              <label className="admin-dropzone">

                <UploadCloud />

                <b>Browse video files</b>

                <small>
                  Select MP4, MOV, AVI or other video formats
                </small>

                <input
                  type="file"
                  accept="video/*"
                  multiple
                  onChange={(event) => {
                    const selectedFiles = Array.from(
                      event.target.files || []
                    );

                    setFiles((previous) => [
                      ...previous,
                      ...selectedFiles,
                    ]);
                  }}
                />

              </label>


              {files.map((file, index) => (
                <div className="admin-row" key={index}>

                  <FileVideo />

                  <span>
                    {file.name}
                    <small>
                      {(file.size / 1024 / 1024).toFixed(1)} MB · Selected
                    </small>
                  </span>

                  <button
                    title="Remove file"
                    onClick={() =>
                      setFiles((previous) =>
                        previous.filter((_, fileIndex) =>
                          fileIndex !== index
                        )
                      )
                    }
                  >
                    <Trash2 />
                  </button>

                </div>
              ))}


              <button
                className="analyse-btn"
                disabled={!files.length}
                onClick={() =>
                  alert(
                    "Frontend demo only. Backend video uploading and processing are not connected yet."
                  )
                }
              >
                <UploadCloud size={18} />
                Upload Selected Videos
              </button>

            </div>

          </div>
        )}


        {/* ALL VIDEOS */}

        {section === "videos" && (
          <div className="admin-content">

            <div className="admin-content-card">

              <h2>Video Library</h2>

              {videos.length > 0 ? (
                videos.map((video, index) => (
                  <div className="admin-row" key={video.id}>

                    <FileVideo />

                    <span>
                      {video.name}
                      <small>
                        Uploaded: {video.date} · {video.size}
                      </small>
                    </span>

                    <b className="status-pending">
                      {video.status}
                    </b>

                    <button
                      title="Remove video"
                      onClick={() =>
                        setFiles((previous) =>
                          previous.filter((_, i) => i !== index)
                        )
                      }
                    >
                      <Trash2 />
                    </button>

                  </div>
                ))
              ) : (
                <p className="admin-empty">
                  No videos uploaded in this session.
                </p>
              )}

            </div>

          </div>
        )}


        {/* DETECTION MANAGEMENT */}

        {section === "detections" && (
          <div className="admin-content">

            <div className="admin-content-card">

              <h2>Available Detection Dataset</h2>

              <p>
                The current CSV dataset contains 58 detection records
                belonging to 12 signboard categories from 7 source videos.
              </p>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(auto-fit, minmax(210px, 1fr))",
                  gap: "18px",
                  marginTop: "20px",
                }}
              >

                {sampleSigns.map((sign) => (
                  <article
                    key={sign.label}
                    style={{
                      border: "1px solid #e2eae4",
                      borderRadius: "14px",
                      overflow: "hidden",
                    }}
                  >

                    <img
                      src={`/snapshots/${sign.snapshot}`}
                      alt={sign.label}
                      onError={(e) => {
                        e.currentTarget.src =
                          "/images/iitm-campus-road.jpg";
                      }}
                      style={{
                        width: "100%",
                        height: "150px",
                        objectFit: "cover",
                      }}
                    />

                    <div style={{ padding: "14px" }}>
                      <b>{sign.label}</b>
                      <p
                        style={{
                          fontSize: "13px",
                          lineHeight: "1.6",
                        }}
                      >
                        {sign.description}
                      </p>
                    </div>

                  </article>
                ))}

              </div>

            </div>

          </div>
        )}


        {/* ADMIN SETTINGS */}

        {section === "settings" && (
          <div className="admin-content">

            <div className="admin-content-card">

              <h2>Admin Profile & Settings</h2>

              <label className="admin-field">
                Display Name

                <input
                  value={profile.name}
                  onChange={(event) =>
                    setProfile({
                      ...profile,
                      name: event.target.value,
                    })
                  }
                />
              </label>


              <label className="admin-field">
                Email Address

                <input
                  type="email"
                  value={profile.email}
                  onChange={(event) =>
                    setProfile({
                      ...profile,
                      email: event.target.value,
                    })
                  }
                />
              </label>


              <p className="admin-security-note">
                <ShieldCheck />

                Demo authentication is frontend-only. Production requires
                server-side authentication, role checks, secure sessions
                and password hashing.
              </p>

            </div>

          </div>
        )}

      </section>

    </main>
  );
}
function App() { const [admin, setAdmin] = useState(sessionStorage.getItem("iitm-admin") === "true"); const login = v => { setAdmin(v); if (v) sessionStorage.setItem("iitm-admin", "true"); else sessionStorage.removeItem("iitm-admin") }; return <BrowserRouter><Routes><Route path="/admin-login" element={<AdminLogin onLogin={login} />} /><Route path="/admin" element={admin ? <AdminPortal onLogout={() => login(false)} /> : <Navigate to="/admin-login" replace />} /><Route path="/*" element={<><Navbar /><Routes><Route path="/" element={<Home />} /><Route path="/analysis" element={<Analysis />} /><Route path="/about" element={<About />} /><Route path="/contact" element={<Contact />} /></Routes><Footer /></>} /></Routes></BrowserRouter> }
export default App;
