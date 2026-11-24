// One-time: get a Google refresh token so the backend can upload videos into your Drive.
//   1. Put GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET (OAuth client of type "Desktop app") in backend/.env
//   2. npm run drive-auth  -> open the printed link, sign in with the Google account that owns the Drive
//   3. Copy the printed GOOGLE_REFRESH_TOKEN line into backend/.env
import "dotenv/config";
import http from "node:http";
import { auth } from "@googleapis/drive";

const PORT = 5577;
const { GOOGLE_CLIENT_ID: id, GOOGLE_CLIENT_SECRET: secret } = process.env;
if (!id || !secret) { console.error("Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in backend/.env first."); process.exit(1); }
const oauth = new auth.OAuth2(id, secret, `http://localhost:${PORT}`);
const url = oauth.generateAuthUrl({
  access_type: "offline", prompt: "consent",
  scope: ["https://www.googleapis.com/auth/drive.file"]   // only files/folders this app creates
});
http.createServer(async (req, res) => {
  const code = new URL(req.url, `http://localhost:${PORT}`).searchParams.get("code");
  if (!code) { res.end("No code"); return; }
  const { tokens } = await oauth.getToken(code);
  res.end("Done. Go back to the terminal.");
  console.log(`\nAdd this line to backend/.env:\n\nGOOGLE_REFRESH_TOKEN=${tokens.refresh_token}\n`);
  process.exit(0);
}).listen(PORT, () => console.log(`Open this link in your browser:\n\n${url}\n`));
