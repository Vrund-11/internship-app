import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth.routes";
import bookingRoutes from "./routes/booking.routes";
import cityRoutes from "./routes/city.routes";
import paymentRoutes from "./routes/payment.routes";

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(helmet());
app.use(morgan("dev"));
app.use(express.json());
app.use(cookieParser());
app.use("/auth", authRoutes);
app.use("/booking", bookingRoutes);
app.use("/cities", cityRoutes);
app.use("/payment", paymentRoutes);

export default app;
