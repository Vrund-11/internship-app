import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth.routes";
import bookingRoutes from "./routes/booking.routes";
import cityRoutes from "./routes/city.routes";
import paymentRoutes from "./routes/payment.routes";
import partnerRoutes from "./routes/partner.routes";
import webhookRoutes from "./routes/webhook.routes";
import reviewRoutes from "./routes/review.routes";
import complaintRoutes from "./routes/complaint.routes";
import promoRoutes from "./routes/promo.routes";

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(helmet());
app.use(morgan("dev"));
app.use(express.json());
app.use(cookieParser());
app.use("/auth", authRoutes);
app.use("/booking", bookingRoutes);
app.use("/cities", cityRoutes);
app.use("/partners", partnerRoutes);
app.use("/payment", paymentRoutes);
app.use("/webhook", webhookRoutes);
app.use("/review", reviewRoutes);
app.use("/complaint", complaintRoutes);
app.use("/promo", promoRoutes);

export default app;

