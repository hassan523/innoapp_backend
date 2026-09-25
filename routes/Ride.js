import express from "express";
import { AcceptBidFareOffer, cancelRide, CreateBid, CreateRideBooking, declineBidbyUser, GetAcceptedride, getAllBidsUserAgainstRide, getAllRidesofCompany, GetBidStatus, getDriverProfileByAdmin, getEstimatedfarePrice, getRideHistoryofdriver, getRideHistoryofUser, getRideStatatus, GetShowDriverRide, getssignedPublicVehicles, updateRideBooking, updateSatatuscompleted, updateSatatusongoing } from "../controller/RideController.js";




const router = express.Router();

router.get("/get-assigned-public-vehicles/:userID", getssignedPublicVehicles);
router.post("/get-estimated-price/:userId/:categoryID", getEstimatedfarePrice);
router.post("/create-ride-booking/:userId/:VehicleCategoryId", CreateRideBooking);

router.patch("/update-ride-booking/:userId/:rideId", updateRideBooking);

router.get("/show-near-rides-driver/:DriverId", GetShowDriverRide);

router.post("/create-bid/:DriverId/:RideBookingId/:AdminId", CreateBid);

router.patch("/accept-bid/:userId/:bidId", AcceptBidFareOffer);
router.get("/get-bids-of-ride/:userId/:rideId", getAllBidsUserAgainstRide);

router.get("/get-ride-status/:userID/:rideId", getRideStatatus);

router.get("/get-all-ride/:AdminId", getAllRidesofCompany);

router.patch("/cancel-ride/:userId/:rideId", cancelRide);

router.patch("/start-ride/:DriverId/:rideId", updateSatatusongoing);

router.patch("/complete-ride/:DriverId/:rideId", updateSatatuscompleted);

router.get("/driver-profile-by-admin/:AdminId/:DriverId", getDriverProfileByAdmin);

router.get("/get-bid-driver/:bidId/:DriverId", GetBidStatus);

router.delete("/decline-bid/:userID/:bidId", declineBidbyUser);

router.get("/get-accepted-ride/:DriverId", GetAcceptedride);

router.get("/get-ride-history-user/:userID", getRideHistoryofUser);
router.get("/get-ride-history-driver/:driverId", getRideHistoryofdriver);


export default router;
