import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import fileUpload from "express-fileupload";
import { v2 as cloudinary } from "cloudinary";
// routes
import Auth from "./routes/Auth.js";
import Subscription from "./routes/Subscription.js";
import VehicleCategoryRoutes from "./routes/VehicleCategoryRoutes.js";
import RentalBooking from "./routes/RentalBooking.js";
import TaskController from "./routes/Task.js";
import Ride from "./routes/Ride.js";
import RatingReviewRoute from "./routes/RatingReviewRoute.js";
import ParcelRoutes from "./routes/ParcelRoutes.js";
import SupportRoute from "./routes/Support.js";
import ConnectionRoutes from "./routes/ConnectionRoutes.js";

// Kyc Routes
import KycRoutes from "./routes/KycRoutes.js";
import WalletRoutes from "./routes/WalletRoutes.js";

// Connection
import { Server } from "socket.io";
import { createServer } from "http";
import { ChatSocket } from "./socket/ChatSocket.js";
import { SocketWrapper } from "./socket/SocketWrapper.js";
import { connectDB } from "./utils/ConnectDB.js";

dotenv.config();
const app = express();

const httpServer = createServer(app);

app.use(
   fileUpload({
      useTempFiles: true,
      tempFileDir: "/tmp/",
   }),
);

connectDB();

cloudinary.config({
   cloud_name: process.env.CLOUDINARY_Cloud,
   api_secret: process.env.CLOUDINARY_API_SECRET,
   api_key: process.env.CLOUDINARY_API_KEY,
});

const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(
   cors({
      origin: "*",
      methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
      credentials: true,
   }),
);

// User Routes
app.use("/Auth", Auth);

// Kyc Routes
app.use("/kyc", KycRoutes);

// Subscription Routes
app.use("/Subscription", Subscription);

// Other Routes
app.use("/Vehicles", VehicleCategoryRoutes);
app.use("/rental-booking", RentalBooking);
app.use("/task", TaskController);
app.use("/ride", Ride);
app.use("/rating-review", RatingReviewRoute);
app.use("/parcels", ParcelRoutes);
app.use("/support", SupportRoute);

app.use("/connections", ConnectionRoutes);
app.use("/wallet", WalletRoutes);

// Testing Route
app.get("/", (req, res) => {
   try {
      res.status(200).json({ heath: "Ok" });
   } catch (error) {
      console.log(error);
   }
});

httpServer.listen(process.env.PORT, () => {
   console.log(`APP Listening To ${PORT}`);
});

const io = new Server(httpServer, {
   pingTimeout: 60000,
   cors: {
      origin: "*",
      methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
      credentials: true,
   },
});

SocketWrapper(io);
