import { exit } from "process";
import { validateDATA } from "./services/remote.demo-data.service.js";
await validateDATA()
exit();