# IITM RoadSafe Backend

Express API. It reads road-sign data from a **PostgreSQL** database (on Supabase) and handles admin video uploads.

## How a video gets from the admin page to the UI
```
Admin page "Upload Videos"
  → POST /api/admin/videos
  → file saved to Google Drive: My Drive/traffic_uploads/
  → videos row added (status = pending)

Colab worker (python db_store.py worker, in fill_database.ipynb)
  → finds the pending row and reads the file from the mounted Drive
  → YOLO + GPS OCR
  → writes detections, rebuilds `signs`, sets status = done

The admin "All Videos" page polls the status every 10 s.
The route analysis pages read `signs`.
```
The Colab worker has to be running for uploads to be processed. Uploads made while it is off wait as `pending`.

## Run
```bash
cp .env.example .env      # fill in DATABASE_URL, the admin password, and the Google values (below)
npm install
npm run dev               # http://localhost:5000
```

## Google Drive setup (once, about 10 minutes)
A service account can't store files in a personal Drive, so the backend uploads as **your** Google account.

1. Go to https://console.cloud.google.com and create a project, e.g. `roadsafe`.
2. Under **APIs & Services → Library**, enable the **Google Drive API**.
3. Under **APIs & Services → OAuth consent screen**:
   - Choose External and fill in the app name and your email.
   - Under scopes, add `.../auth/drive.file`.
   - Add yourself as a test user.
   - Then click **Publish app** (set it to "In production"). In "Testing" mode the token stops working after 7 days.
   - Because `drive.file` only covers files this app creates, Google doesn't need to verify the app.
4. Under **APIs & Services → Credentials → Create credentials → OAuth client ID**, choose type **Desktop app**. Copy the ID and secret into `.env` as `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`.
5. Run `npm run drive-auth`. Open the link it prints, sign in with the Google account whose Drive holds `traffic_data`, and allow access.
6. Paste the `GOOGLE_REFRESH_TOKEN=...` line it prints into `.env`, then restart the backend.

The first upload creates the folder `My Drive/traffic_uploads`. The Colab worker looks there, and in `traffic_data/`.

## Database tables
| table | contents |
|---|---|
| `signs` | **What the UI reads.** One row per physical signboard, with repeat sightings merged (`sightings` counts them). Rebuilt by the Python side; never edit it by hand |
| `detections` | Raw pipeline output: one row per tracked sign per video, plus the snapshot JPEG. The admin can relabel or delete rows here |
| `videos` | Each video: `source` (upload / colab), `status` (pending / processing / done / failed), `error` |
| `sign_classes` | Display name, type, description and usage for each model label |
| `app_state` | `signs_dirty` flag: set when the admin edits detections. The worker then rebuilds `signs` |

## API
| endpoint | returns |
|---|---|
| `GET /api/locations` | the five campus waypoints |
| `GET /api/analysis?start=main-gate&end=msb` | signboards within 70 m of the route, in route order |
| `GET /api/stats` | totals |
| `GET /snapshots/<detection_id>.jpg` | the snapshot image, served from the database |
| `POST /api/admin/login` | `{token}` for `{username, password}` (`ADMIN_USER` / `ADMIN_PASSWORD`) |
| `POST /api/admin/videos` | upload one video (multipart field `video`, max 2 GB) |
| `GET /api/admin/videos` · `POST /api/admin/videos/:id/retry` · `DELETE /api/admin/videos/:id` | list, re-queue a failed video, delete (also removes it from Drive) |
| `GET /api/admin/detections?video_id=` · `PATCH /api/admin/detections/:id {label}` · `DELETE /api/admin/detections/:id` | review detections |
| `GET /api/admin/labels` · `GET /api/admin/status` | label list; whether Drive is configured and whether edits are waiting for a rebuild |

All `/api/admin/*` routes except login need the `Authorization: Bearer <token>` header.
