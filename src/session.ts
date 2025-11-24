// src/session.ts
import fs from "fs/promises";
import path from "path";

const SESS_DIR = path.resolve(process.cwd(), "sessions");
export async function saveUserSessiontoSessions(name: string, obj: any) {
  await fs.mkdir(SESS_DIR, { recursive: true }).catch(()=>{});
  const file = path.join(SESS_DIR, `${name}.json`);
  await fs.writeFile(file, JSON.stringify(obj, null, 2), "utf8");
  return file;
}
