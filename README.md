# IITM RoadSafe

Frontend: React + Vite in the project root.
Backend: Express API in `backend/`.

## Start the backend
Terminal 1:
```bash
cd backend
npm install
npm run dev
```

## Start the frontend
Terminal 2 (project root):
```bash
npm install
npm run dev
```

Open the Vite URL (normally http://localhost:5173).

The five route dropdown locations are Main Gate, Gajendra Circle, MSB, Ed Dept and Velachery. The backend reads `backend/data/signs.csv` and returns matching sign detections near the selected route.

The signboard SVGs are representative illustrations, not original video snapshot photographs. The CSV references a snapshots folder that was not supplied.

## New update (map selection, route-specific review, admin portal)
- Home route selection is now performed directly by clicking labeled campus map markers; the old start/destination dropdowns are removed from Home and Analysis.
- First map click selects Start; second selects Destination. Analyse opens a route-specific review prompt based on route detections returned by the backend. Closing the review navigates to Analysis and carries the prompt content.
- Admin portal now includes Dashboard, Upload Videos, All Videos, Detection Management, and Admin Settings sections.
- Admin portal upload/video/detection management are frontend demo interfaces only. Upload and processing APIs are not connected, and the route review is a data-driven prompt preview—not live AI generation. Connect a model API and secure backend auth before production.
- This project copy does not include snapshot JPG files; the existing snapshots folder contains a note/placeholder only. Add your snapshot images to `backend/public/snapshots/` as in your original project.
