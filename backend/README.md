# IITM RoadSafe Backend

## Run backend
From this folder:
```bash
npm install
npm run dev
```
API: http://localhost:5000

## Dataset and signboard images
- `data/signs.csv` contains 58 detection records and 12 distinct labels.
- `public/signboards/` contains 12 representative SVG illustrations (fallbacks).
- `public/snapshots/` is where the original JPEG/PNG images referenced by the CSV must be placed.

The CSV's `snapshot` column references 58 unique image filenames, but those original files were not included in the CSV upload. The file `public/snapshots/IMAGES_NEEDED.txt` lists every required filename. When you add those originals, the API will automatically serve them; until then, the frontend uses the representative category SVG.

The API filters CSV detections against the selected ordered campus waypoint route using a 70 m corridor and groups same-label detections within 18 m.

### Original detection snapshot images

Place the original JPG files in `backend/public/snapshots/`. The backend reads the `snapshot` column in `data/signs.csv` (for example, `snapshots/NO20210203-140716-013835F_track19.jpg`), matches by filename, and serves the image to the React analysis cards. Keep the image filename unchanged. Missing files are reported as unavailable; no placeholder sign illustrations are used.
