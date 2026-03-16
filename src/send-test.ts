import "dotenv/config";
import { handler } from "./handler.js";

handler({} as any).catch((err) => {
  console.error(err);
  process.exit(1);
});
