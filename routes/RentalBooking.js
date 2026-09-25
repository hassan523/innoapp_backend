import express from "express";
import { createRentalBooking, getRentalBooking, getRentalBookingsbyAdmin, updateBookingstatus } from "../controller/RentalBookingController.js";

const router = express.Router();

router.post("/create-booking/:AdminId/:userId", createRentalBooking);
router.get("/getRentalBooking/:userId", getRentalBooking);
router.get("/getRentalBookingbyadmins/:AdminId", getRentalBookingsbyAdmin);
router.patch("/updateBookingstatus/:AdminId/:BookingId", updateBookingstatus);


export default router;