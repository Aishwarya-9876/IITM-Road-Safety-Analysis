import express from "express";
import cors from "cors";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "csv-parse/sync";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use("/snapshots", express.static(path.resolve(__dirname, "../public/snapshots")));

const locations = [
  { id: "main-gate", name: "Main Gate", lat: 13.0061068, lon: 80.2423781 },
  { id: "gajendra-circle", name: "Gajendra Circle", lat: 12.9914165, lon: 80.2336854 },
  { id: "msb", name: "MSB", lat: 12.9908689, lon: 80.2306957 },
  { id: "ed-dept", name: "Ed Dept", lat: 12.9899784, lon: 80.2265115 },
  { id: "velachery", name: "Velachery", lat: 12.9882910, lon: 80.2233049 }
];

const descriptions = {
  direction_board: {
    name: "Direction Board", type: "Informational",
    description: "Provides directions to campus destinations and helps visitors navigate the road network.",
    usage: "Installed at junctions and decision points to guide pedestrians and vehicles."
  },
  speed_breaker: {
    name: "Speed Breaker", type: "Cautionary",
    description: "Warns road users about a raised speed breaker ahead.",
    usage: "Placed before speed breakers to encourage drivers to slow down."
  },
  speed_limit: {
    name: "Speed Limit", type: "Regulatory",
    description: "Indicates the maximum permitted speed for vehicles.",
    usage: "Used on campus roads to control vehicle speed and protect pedestrians."
  },
  walk_jog_facing_traffic: {
    name: "Walk / Jog Facing Traffic", type: "Informational",
    description: "Advises people walking or jogging to face oncoming traffic.",
    usage: "Used where pedestrians and joggers share space with vehicles."
  },
  animal_crossing: {
    name: "Animal Crossing", type: "Cautionary",
    description: "Warns drivers that animals may cross the road.",
    usage: "Placed in areas where animals are known to cross."
  },
  "barrier-falls": {
    name: "Barrier / Fall Hazard", type: "Cautionary",
    description: "Indicates a barrier or potential fall-related hazard near the road.",
    usage: "Used to alert road users to physical obstructions or edge hazards."
  },
  "Cycle Path": {
    name: "Cycle Path", type: "Informational",
    description: "Identifies a path or lane intended for cyclists.",
    usage: "Used to separate or guide bicycle movement around campus."
  },
  "Pedestrian Path": {
    name: "Pedestrian Path", type: "Informational",
    description: "Identifies a route intended for people walking.",
    usage: "Used to guide pedestrians along designated walking paths."
  },
  "Do Not smoke": {
    name: "Do Not Smoke", type: "Regulatory",
    description: "Indicates that smoking is prohibited in the marked area.",
    usage: "Displayed in smoke-free public, institutional and campus areas."
  },
  "No Parking": {
    name: "No Parking", type: "Regulatory",
    description: "Indicates that vehicles must not be parked in the marked area.",
    usage: "Used to keep road edges, entrances and access routes clear."
  },
  Others: {
    name: "Other Sign", type: "Other",
    description: "A sign detected by the model that is not assigned to a specific supported class.",
    usage: "Requires manual review to identify its exact meaning."
  },
  turn_sign: {
    name: "Turn Sign", type: "Cautionary",
    description: "Warns drivers about a turn or change in road direction ahead.",
    usage: "Placed before bends and turning sections to encourage careful driving."
  }
};

const snapshotsDir = path.resolve(__dirname, "../public/snapshots");

// CSV values may look like "snapshots/example.jpg". Only the filename is
// resolved inside backend/public/snapshots, preventing paths outside that folder.
function getSnapshotImage(snapshotValue) {
  if (!snapshotValue) return null;
  const filename = path.basename(String(snapshotValue).replaceAll("\\", "/"));
  if (!filename || filename === "." || filename === "..") return null;
  const diskPath = path.resolve(snapshotsDir, filename);
  if (!diskPath.startsWith(snapshotsDir + path.sep) || !fs.existsSync(diskPath) || !fs.statSync(diskPath).isFile()) return null;
  return `/snapshots/${encodeURIComponent(filename)}`;
}

const csvPath = path.resolve(__dirname, "../data/signs.csv");
if (!fs.existsSync(csvPath)) {
  throw new Error(`CSV dataset not found at ${csvPath}`);
}
const rows = parse(fs.readFileSync(csvPath, "utf8"), {
  columns: true, skip_empty_lines: true, trim: true
}).map(row => ({
  id: Number(row.id),
  label: row.label,
  confidence: Number(row.confidence || 0),
  lat: Number(row.lat),
  lon: Number(row.lon),
  video: row.video,
  time_s: Number(row.time_s || 0),
  speed_kmh: Number(row.speed_kmh || 0),
  frames_seen: Number(row.frames_seen || 0),
  sightings: Number(row.sightings || 1),
  snapshot: row.snapshot,
  description: row.description || ""
}));

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
function mergeNearbyDuplicates(items) {
  const groups=[];
  for(const item of items) {
    const existing=groups.find(g => g.label===item.label && haversine(g,item)<18);
    if(existing) {
      existing.sightings += item.sightings;
      existing.confidence = Math.max(existing.confidence,item.confidence);
      existing.duplicateDetections += 1;
      existing.sourceIds.push(item.id);
      existing.frames_seen += item.frames_seen;
    } else {
      groups.push({...item, duplicateDetections:1, sourceIds:[item.id]});
    }
  }
  return groups;
}

app.get("/api/health", (_req,res)=>res.json({status:"ok",datasetRows:rows.length}));
app.get("/api/locations", (_req,res)=>res.json({locations}));
app.get("/api/analysis", (req,res)=>{
  const startId=req.query.start, endId=req.query.end;
  const startIndex=locations.findIndex(l=>l.id===startId);
  const endIndex=locations.findIndex(l=>l.id===endId);
  if(startIndex<0 || endIndex<0) return res.status(400).json({error:"Select valid start and destination locations."});
  if(startIndex===endIndex) return res.status(400).json({error:"Start and destination must be different."});

  const low=Math.min(startIndex,endIndex), high=Math.max(startIndex,endIndex);
  const routePoints=locations.slice(low,high+1);
  const xyPoints=routePoints.map(p=>toXY(p.lat,p.lon));
  const ascending = startIndex < endIndex;
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
      const meta=descriptions[row.label] || descriptions.Others;
      candidates.push({
        ...row, ...meta,
        description: row.description,
        image: getSnapshotImage(row.snapshot),
        snapshotAvailable: Boolean(getSnapshotImage(row.snapshot)),
        distanceFromRouteM:Math.round(best.distance),
        routeProgressM:Math.round(best.progress),
      });
    }
  }
  candidates.sort((a,b)=>a.routeProgressM-b.routeProgressM);
  const unique=mergeNearbyDuplicates(candidates);
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
    note:"Results are filtered from the uploaded CSV using proximity to the ordered campus waypoint route. Each detection image is resolved from the CSV snapshot filename inside backend/public/snapshots. If a matching file is not present, the interface displays Image not available."
  });
});

app.listen(PORT,()=>console.log(`IITM RoadSafe API running at http://localhost:${PORT}`));
