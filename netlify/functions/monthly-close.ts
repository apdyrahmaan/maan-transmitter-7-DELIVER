import closing from "../../monthly-closing.js";
import { withState } from "../lib/state.js";

// Runs shortly after midnight Mogadishu time at month end (schedule in netlify.toml).
export default async () => {
  const closed = await withState(async () => closing.closeFinishedMonths());
  console.log(closed.length ? `Closed months: ${closed.join(", ")}` : "No months to close.");
};
