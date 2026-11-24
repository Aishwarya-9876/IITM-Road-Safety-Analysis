// Uploads admin videos into the owner's Google Drive (folder DRIVE_FOLDER_NAME, created on first use),
// where the Colab worker reads them from the mounted Drive.
// Uses the owner's OAuth refresh token: a service account can't store files in a personal Drive.
import fs from "node:fs";
import { drive as gdrive, auth } from "@googleapis/drive";

const FOLDER = process.env.DRIVE_FOLDER_NAME || "traffic_uploads";
let client, folderId;

export function driveConfigured() {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && process.env.GOOGLE_REFRESH_TOKEN);
}

function getClient() {
  if (!client) {
    if (!driveConfigured()) throw new Error("Google Drive is not configured (GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET / GOOGLE_REFRESH_TOKEN). Run: npm run drive-auth");
    const oauth = new auth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET);
    oauth.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });
    client = gdrive({ version: "v3", auth: oauth });
  }
  return client;
}

async function getFolderId() {
  if (folderId) return folderId;
  const d = getClient();
  const { data } = await d.files.list({
    q: `name = '${FOLDER}' and mimeType = 'application/vnd.google-apps.folder' and 'root' in parents and trashed = false`,
    fields: "files(id)", spaces: "drive"
  });
  if (data.files.length) return (folderId = data.files[0].id);
  const res = await d.files.create({
    requestBody: { name: FOLDER, mimeType: "application/vnd.google-apps.folder", parents: ["root"] },
    fields: "id"
  });
  return (folderId = res.data.id);
}

export async function uploadToDrive(localPath, name, mimeType) {
  const d = getClient();
  const res = await d.files.create({
    requestBody: { name, parents: [await getFolderId()] },
    media: { mimeType: mimeType || "video/mp4", body: fs.createReadStream(localPath) },
    fields: "id"
  });
  return res.data.id;
}

export async function deleteFromDrive(fileId) {
  if (!fileId || !driveConfigured()) return;
  try { await getClient().files.delete({ fileId }); } catch (e) { console.warn("Drive delete failed:", e.message); }
}
