import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(helmet());
app.use(morgan("dev"));
app.use(express.json());
app.use(cookieParser());

app.post("/auth/refresh", (_req, res) => {
  return res.status(200).json({ ok: true });
});

app.get("/auth/me", (_req, res) => {
  return res.status(200).json(null);
});

export default app;
