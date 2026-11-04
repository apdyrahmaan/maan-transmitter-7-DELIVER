import database from "../../database.js";
import backups from "../../backups.js";
import { withState } from "../lib/state.js";

// Daily at 00:10 Mogadishu time (schedule in netlify.toml).
export default async () => {
  const backup = await withState(() => backups.createBackupAsync(database.readDatabase(), "automatic"));
  console.log("Automatic backup created:", backup.filename);
};
