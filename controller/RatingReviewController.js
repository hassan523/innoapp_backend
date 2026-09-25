import { v2 as cloudinary } from "cloudinary";
import HandlePostNotification from "../utils/Notify.js";
import Users from "../models/Users.js";
import RidebookingSchema from "../models/RidebookingSchema.js";
import RatingReviewSchema from "../models/RatingReviewSchema.js";
import Admin from "../models/Admin.js";
import Driver from "../models/Driver.js";

const CreateRatingReview = async (req, res) => {
    try {
        const {rideId, userId} = req.params;
        const {rating, review} = req.body;

        const findUser = await Users.findById(userId);

        if(!findUser){
            return res.status(404).json({message:"User Not Found!"})
        }
        const findRide = await RidebookingSchema.findById(rideId);
        
        if(!findRide){
            return res.status(404).json({message:"Ride Not Avalaible!"})
        }

        const findRatinrev = await RatingReviewSchema.find({RideId:findRide._id});

        if(findRatinrev.length >= 1){
            return res.status(400).json({message:"You have already given ratings and Review!"})
        }

        if(!findRide.driverId){
            return res.status(400).json({message:"Driver havent applied for this Job or you havent completed the Ride yet!"})
        }
        if(!findRide.status.includes("completed") ){
            return res.status(400).json({message:"You havent completed the Ride yet!"})
        }

        const createReview = new RatingReviewSchema({
            AdminId: findRide.AdminId,
            DriverId: findRide.driverId,
            userId: findUser._id,
            RideId: findRide._id,
            rating:rating,
            review:review
        });
        await createReview.save();

        return res.status(200).json({message:"Review Created Successfully!",createReview})

        
    } catch (error) {
        console.log(error);
        return res.status(500).json({message:"Internal Server Error!"})
    }
}


const getReViewforAdmin = async (req, res) => {
try {
    const {AdminId} = req.params;

    const findAdmin = await Admin.findById(AdminId);

    if(!findAdmin){
        return res.status(404).json({message:"Admin Not Found!"})
    }

    const findRatinreview = await RatingReviewSchema.find({AdminId: findAdmin._id})
    .populate({
        path: "AdminId",
        model: "Admin",
      })
    .populate({
        path: "DriverId",
        model: "Driver",
      })
    .populate({
        path: "userId",
        model: "Users",
      })
    .populate({
        path: "RideId",
        model: "Ridebooking",
      })

    return res.status(200).json({message:"All rattings and Reviews", findRatinreview})
    
} catch (error) {
    console.log(error)
    return res.status(500).json({message:"Internal Server Error!"})
}}

const getReViewforDriver = async (req, res) => {
    try {
        const {DriverId} = req.params;
    
        const findDriver = await Driver.findById(DriverId);
    
        if(!findDriver){
            return res.status(404).json({message:"Admin Not Found!"})
        }
    
        const findRatinreview = await RatingReviewSchema.find({DriverId: findDriver._id})
        .populate({
            path: "AdminId",
            model: "Admin",
          })
          .populate({
            path: "DriverId",
            model: "Driver",
          })
        .populate({
            path: "userId",
            model: "Users",
          })
          .populate({
            path: "RideId",
            model: "Ridebooking",
          })
    
        return res.status(200).json({message:"All rattings and Reviews", findRatinreview})
        
    } catch (error) {
        console.log(error)
        return res.status(500).json({message:"Internal Server Error!"})
    }
    
}

const getReViewforUser = async (req, res) => {
    try {
        const {userId} = req.params;
    
        const findUser = await Driver.findById(userId);
    
        if(!findUser){
            return res.status(404).json({message:"Admin Not Found!"})
        }
        const findRatinreview = await RatingReviewSchema.find({userId: findUser._id})
        .populate({
            path: "AdminId",
            model: "Admin",
          })
          .populate({
            path: "DriverId",
            model: "Driver",
          })
        .populate({
            path: "userId",
            model: "Users",
          })
          .populate({
            path: "RideId",
            model: "Ridebooking",
          })
    
          
        return res.status(200).json({message:"All rattings and Reviews", findRatinreview})
        
    } catch (error) {
        console.log(error)
        return res.status(500).json({message:"Internal Server Error!"})
    }
}



export {
    CreateRatingReview,
    getReViewforAdmin,
    getReViewforDriver,
    getReViewforUser
}





