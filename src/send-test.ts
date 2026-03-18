import "dotenv/config";
import type { ScheduledEvent } from "aws-lambda";
import { handler } from "./handler.js";

handler({} as unknown as ScheduledEvent).catch((err) => {
  console.error(err);
  process.exit(1);
});
