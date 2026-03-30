import dotenv from "dotenv";
import { createServer } from "http";
import path from "path";
import app from "./app";
import { initSocket } from "./socket";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const PORT = process.env.PORT || 5000;
const server = createServer(app);

initSocket(server);

server.listen(PORT, () => {
  console.log(`[SERVER] Running on port ${PORT}`);
});
