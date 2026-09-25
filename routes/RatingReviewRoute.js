import express from "express";
import { CreateRatingReview, getReViewforAdmin, getReViewforDriver, getReViewforUser } from "../controller/RatingReviewController.js";


const router = express.Router();

router.post("/create-rating-review/:rideId/:userId", CreateRatingReview);
router.get("/get-rating-review-admin/:AdminId", getReViewforAdmin);
router.get("/get-rating-review-driver/:DriverId", getReViewforDriver);
router.get("/get-rating-review-user/:userId", getReViewforUser);



export default router;