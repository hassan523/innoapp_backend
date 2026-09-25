import express from "express";
import { AcceptParcelBidFareOffer, cancelParcelRide, CreateParcel, CreateParcelBid, 
    declineParcelBidbyUser, get_parcels_Admin, get_parcels_users,
     GetAcceptedParcelride,
     getAllParcelBidsUserAgainstRide, 
     getParcelHistoryofdriver, 
     getParcelHistoryofUser, 
     GetParcelStatus, 
     GetShowDriverParcelRide,
     updateParcelSatatuscompleted,
     updateSatatusdelivering,
     //  GetParcelBidStatus,
    } from "../controller/ParcelController.js";



const router = express.Router();

router.post("/create-parcel/:userId/:VehicleCategoryId", CreateParcel);
router.get("/get-parcel-users/:userId", get_parcels_users);
router.get("/get-parcels-admin/:AdminId", get_parcels_Admin);

router.get("/get-parcels-ride/:DriverId", GetShowDriverParcelRide);

router.post("/create-parcel-bid/:DriverId/:ParcelBookingId/:AdminId", CreateParcelBid);
router.get("/get-parcels-bid-for-users/:userId/:ParcelId", getAllParcelBidsUserAgainstRide);

router.patch("/accept-parcels-bid/:userId/:parcelbidId", AcceptParcelBidFareOffer);
router.delete("/decline-parcels-bid/:userId/:parcelbidId", declineParcelBidbyUser);
router.get("/get-accepted-parcel-ride/:DriverId", GetAcceptedParcelride);

router.patch("/cancel-ride/:userId/:parcelRideId", cancelParcelRide);
router.patch("/update-status-delivering/:DriverId/:ParcelsrideId", updateSatatusdelivering);
router.patch("/update-status-completed/:DriverId/:ParcelsrideId", updateParcelSatatuscompleted);

router.get("/get-parcel-status/:userId/:parcelId", GetParcelStatus);

router.get("/get-parcel-history-user/:userID", getParcelHistoryofUser);
router.get("/get-parcel-history-driver/:driverId", getParcelHistoryofdriver);

export default router;