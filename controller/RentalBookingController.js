import { v2 as cloudinary } from "cloudinary";
import Admin from "../models/Admin.js";
import Vehicles from "../models/Vehicles.js";
import HandlePostNotification from "../utils/Notify.js";
import RentalcarBookingSchema from "../models/RentalcarBookingSchema.js";
import Users from "../models/Users.js";

const createRentalBooking = async (req, res) => {
  try {
    const { AdminId, userId } = req.params;
    const {Idetification_no, name,contact_no,description, Vin_no,from_date, to_date, location,  outofcity  }= req.body;
  
    const findAdmin = await Admin.findById(AdminId);

    const findUser = await Users.findById(userId);
    if(!findUser){
        return res.status(404).json({message:"User Not Found!"})
    }
    if(!findAdmin){
        return res.status(404).json({message:"Admin Not Found!"});
    }

    const findVehicle = await Vehicles.findOne({vin:Vin_no});

    if(!findVehicle){
        return res.status(400).json({message:"Vehicle Not Found!"})
    }
    if(findVehicle.AdminId.toString() !== findAdmin._id.toString()){
        return res.status(400).json({message:"Unauthorized User!"})
    }
    if(!findVehicle.asingmenttype.includes("Private")){
        return res.status(401).json({message:"This Vehicle is not a Private Vehicle"});
    }

      const createBooking = new RentalcarBookingSchema({
          AdminId: findAdmin._id,
          userId: findUser._id,
          Idetification_no: Idetification_no,
          name: name,
          contact_no: contact_no,
          description: description,
          Vin_no: findVehicle.vin,
          from_date: from_date,
          to_date: to_date,
          location: location,
          outofcity:outofcity
      });
      createBooking.save();
      return res.status(200).json({message:"Booking Created Successfully!", createBooking});
    
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal Server Error!" });
  }
};

const getRentalBooking = async (req, res) => {
    try {
        const { userId } = req.params;
        const findrentalBookings = await RentalcarBookingSchema.find({ userId })
            .populate({
                path: "AdminId",
                model: "Admin",
            });

        if (!findrentalBookings || findrentalBookings.length === 0) {
            return res.status(404).json({ message: "No rental bookings found for this user!" });
        }
       
        const vehicles = await Promise.all(
            findrentalBookings.map(async (booking) => {
                const vehicle = await Vehicles.findOne({ vin: booking.Vin_no });
                return { ...booking.toObject(), vehicle }; 
            })
        );
        return res.status(200).json({
            message: "All rental bookings for this user retrieved successfully!",
            bookings: vehicles,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal Server Error!" });
    }
};

const getRentalBookingsbyAdmin = async (req, res) => {
    try {
        const {AdminId} = req.params;

        const findAdmin = await Admin.findById(AdminId);

        if(!findAdmin){
            return res.status(404).json({message:"Admin Not Found!"});
        }

        const findBookings = await RentalcarBookingSchema.find({AdminId:findAdmin._id});

        if(!findBookings || findBookings.length === 0){
            return res.status(404).json({message: "No rental bookings found for this user!"})
        }

        const allbookings = await Promise.all(
            findBookings.map(async (booking) => {
                const vehicle = await Vehicles.findOne({ vin: booking.Vin_no });
                return { ...booking.toObject(), vehicle }; 
            })
        );

        return res.status(200).json({message:"All Bookings", allbookings})

    } catch (error) {
        console.log(error);
        return res.status(500).json({message:"Internal Server Error!"})
    }
};

const updateBookingstatus = async (req, res) => {
    try {
        const {AdminId, BookingId} = req.params;
        const {bookingstatus} = req.body;
    
        const findAdmin = await Admin.findById(AdminId);
        const findBooking = await RentalcarBookingSchema.findById(BookingId);

        if(!findAdmin){
            return res.status(404).json({message:"Admin Not Found!"});
        }
        if(!findBooking){
            return res.status(404).json({message:"No Rental Booking Found!"})
        }
        findBooking.bookingstatus = bookingstatus || findBooking.bookingstatus;
        await findBooking.save();

        return res.status(200).json({message:"Rental Booking Status Updated!", findBooking})
        
    } catch (error) {
        console.log(error);
        return res.status(500).json({message:"Internal Server Error!"})
    }
};



export{
    createRentalBooking,
    getRentalBooking,
    getRentalBookingsbyAdmin,
    updateBookingstatus
};