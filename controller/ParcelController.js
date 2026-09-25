import mongoose from "mongoose";
import Admin from "../models/Admin.js";
import Driver from "../models/Driver.js";
import LocationsModel from "../models/LocationsModel.js";
import ParcelBidSchema from "../models/ParcelBidSchema.js";
import ParcelsSchema from "../models/ParcelsSchema.js";
import Users from "../models/Users.js";
import VehicleCategorySchema from "../models/VehicleCategorySchema.js";
import Vehicles from "../models/Vehicles.js";
import { calculateMiles } from "../utils/calculateMiles.js";
import { v2 as cloudinary } from "cloudinary";

const CreateParcel = async (req, res) => {
  try {
    const { userId, VehicleCategoryId } = req.params;

    const findUser = await Users.findById(userId);

    const findVehicleCategory = await VehicleCategorySchema.findById(
      VehicleCategoryId
    );

    if (!findUser) {
      return res.status(400).json({ message: "User Not Found!" });
    }
    if (!findVehicleCategory) {
      return res.status(400).json({ message: "Vehicle category Not Found!" });
    }
    const {
      orgin,
      miles,
      comment,
      farePrice,
      ReciverName,
      Reciverphone,
      ReciverSecondaryPhone,
      destination,
      Value,
    } = req.body;

    if (
      !orgin ||
      !miles ||
      !farePrice ||
      !ReciverName ||
      !Reciverphone ||
      !destination ||
      !Value
    ) {
      return res.status(400).json({ message: "Missing required fields!" });
    }

    const generateOTP = () => Math.floor(100000 + Math.random() * 900000);
    const Otp = generateOTP();

    const createOrigin = new LocationsModel({
      location: {
        type: "Point",
        coordinates: [orgin.longitude, orgin.latitude],
      },
      address: orgin.originAddressLine,
      locationType: ["ParcelBooking"],
    });
    await createOrigin.save();

    const createDestination = new LocationsModel({
      location: {
        type: "Point",
        coordinates: [destination.longitude, destination.latitude],
      },
      address: destination.destinationAddressLine,
      locationType: ["ParcelBooking"],
    });
    await createDestination.save();

    const NewParcel = new ParcelsSchema({
      userId: findUser._id,
      VehicleCategoryId: findVehicleCategory._id,
      to: createOrigin._id,
      from: createDestination._id,
      miles: miles,
      comment: comment,
      farePrice: farePrice,
      ReciverName: ReciverName,
      Reciverphone: Reciverphone,
      ReciverSecondaryPhone: ReciverSecondaryPhone,
      Value: Value,
      OTp: Otp,
    });

    await NewParcel.save();

    const populateParcelRide = await ParcelsSchema.findById(NewParcel._id);

    const findOrigin = await LocationsModel.findById(NewParcel.from);
    const findDestinations = await LocationsModel.findById(NewParcel.to);

    const parcelRes = {
      ...populateParcelRide.toObject(),
      origin: findOrigin,
      destinations: findDestinations,
    };

    console.log(parcelRes, "populateParcelRide");
    return res.status(201).json({
      message: "Parcel created successfully!",
      data: parcelRes,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error!" });
  }
};

const get_parcels_users = async (req, res) => {
  try {
    const { userId } = req.body;

    const findUser = await Users.findById(userId);
    if (!findUser) {
      return res.status(404).json({ message: "User Not Found!" });
    }

    const Parcels = await ParcelsSchema.find({ userId: findUser._id });

    return res.status(200).json({ message: "All User Parcels", Parcels });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal Server Error!" });
  }
};

const get_parcels_Admin = async (req, res) => {
  try {
    const { AdminId } = req.body;

    const findAdmin = await Users.findById(AdminId);

    if (!findAdmin) {
      return res.status(404).json({ message: "Admin Not Found!" });
    }

    const Parcels = await ParcelsSchema.find({ AdminId: findAdmin._id });

    return res.status(200).json({ message: "All User Parcels", Parcels });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal Server Error!" });
  }
};

const GetShowDriverParcelRide = async (req, res) => {
  try {
    const { DriverId } = req.params;
    const { radiusInMeters } = req.query;

    const findDriver = await Driver.findById(DriverId);
    if (!findDriver) {
      return res.status(404).json({ message: "Driver not found!" });
    }
    if (
      !findDriver.cordinates ||
      !findDriver.cordinates.latitude ||
      !findDriver.cordinates.longitude
    ) {
      return res
        .status(400)
        .json({ message: "Driver's coordinates are not set!" });
    }

    const findNearbyRideBooking = await ParcelsSchema.find({
      status: "pending",
    })
      .populate({
        path: "userId",
        model: "Users",
      })
      .populate({
        path: "VehicleCategoryId",
        model: "VehicleCategory",
      });
    if (
      findNearbyRideBooking.some((task) =>
        ["accepted", "delivering"].includes(task.status)
      )
    ) {
      return res
        .status(400)
        .json({ message: "You are already In This booking Task!" });
    }

    const dummyArr = [];

    findNearbyRideBooking.map((item) => {
      const x = calculateMiles(findDriver.cordinates, {
        latitude: item.orgin.latitude,
        longitude: item.orgin.longitude,
      });

      if (x <= radiusInMeters) {
        dummyArr.push(item);
      }
    });

    return res
      .status(200)
      .json({ message: "All Nearby Rides!", data: dummyArr });
  } catch (error) {
    console.log(error, "in get ");

    console.error("Internal server error:", error);
    return res.status(500).json({ message: "Internal Server Error!" });
  }
};

const CreateParcelBid = async (req, res) => {
  try {
    const { DriverId, ParcelBookingId, AdminId } = req.params;
    const { bidamount, VinNumber } = req.body;
    const findAdmin = await Admin.findById(AdminId);
    if (!findAdmin) {
      return res.status(404).json({ message: "Admin Not Found!" });
    }
    if (findAdmin.IsActive === false) {
      return res
        .status(404)
        .json({ message: "Admin Subscription is Expired!  " });
    }
    const findDrivers = await Driver.findById(DriverId);
    if (!findDrivers) {
      return res.status(404).json({ message: "Driver Not Found!" });
    }
    if (findDrivers.AdminId.toString() !== findAdmin._id.toString()) {
      return res.status(400).json({ message: "Unautorized User!" });
    }
    const findParcelBooking = await ParcelsSchema.findById(ParcelBookingId);
    if (!findParcelBooking) {
      return res.status(404).json({ message: "Ride Booking Not Found!" });
    }
    const findVehicle = await Vehicles.findOne({ vin: VinNumber });
    if (!findVehicle) {
      return res.status(404).json({ message: "Vehicle Not Found!" });
    }
    if (findParcelBooking.status.includes("pending")) {
      if (findParcelBooking.farePrice > bidamount) {
        return res.status(400).json({
          message:
            "You cannot Bid Less Amount than fare Price Calculated by App!",
        });
      }

      await ParcelBidSchema.findOneAndDelete({
        DriverId: findDrivers._id,
        ParcelBookingId: findParcelBooking._id,
      });
      const checkAlreadBids = await ParcelBidSchema.find({
        DriverId: findDrivers._id,
      });
      if (checkAlreadBids?.length < 0) {
        return res.status(400).json({
          message:
            "You cannot create Bid Because you have already created Bid on another Ride!",
        });
      }

      const creatingParcelBid = new ParcelBidSchema({
        AdminId: findAdmin._id,
        DriverId: findDrivers._id,
        VehicleId: findVehicle._id,
        ParcelBookingId: findParcelBooking._id,
        bidamount: bidamount,
      });
      await creatingParcelBid.save();
      return res
        .status(200)
        .json({ message: "Parcel Bid Created!", creatingParcelBid });
    }
    return res.status(400).json({ message: "Someone Else took Booking!" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal Server Error!" });
  }
};

const getAllParcelBidsUserAgainstRide = async (req, res) => {
  try {
    const { userId, ParcelId } = req.params;

    const findUser = await Users.findById(userId);

    if (!findUser) {
      return res.status(404).json({ message: "User Not Found!" });
    }

    const findParcelRide = await ParcelsSchema.findById(ParcelId);

    if (!findParcelRide) {
      return res.status(404).json({ message: "Parcel Not Found!" });
    }
    const findBid = await ParcelBidSchema.find({
      ParcelBookingId: findParcelRide._id,
    })
      .populate({
        path: "AdminId",
        model: "Admin",
      })
      .populate({
        path: "DriverId",
        model: "Driver",
      })
      .populate({
        path: "VehicleId",
        model: "Vehicles",
      });

    if (!findBid) {
      return res.status(404).json({ message: "Bids Not Found!" });
    }

    if (findParcelRide.status.includes("cancelled")) {
      return res.status(400).json({ message: "Ride was cancelled!" });
    }
    return res.status(200).json({ message: "All Parcel Bids", findBid });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal Server Error!" });
  }
};

const AcceptParcelBidFareOffer = async (req, res) => {
  try {
    const { userId, parcelbidId } = req.params;

    const findUser = await Users.findById(userId);
    if (!findUser) {
      return res.status(404).json({ message: "User Not Found!" });
    }

    const findBid = await ParcelBidSchema.findById(parcelbidId);
    if (!findBid) {
      return res
        .status(404)
        .json({ message: "Bid Not Available! Try Another Bid!" });
    }

    const findParcelRideBooking = await ParcelsSchema.findOne({
      userId: findUser._id,
      status: "pending",
    });

    if (!findParcelRideBooking) {
      return res.status(404).json({ message: "Booking Not Found!" });
    }

    // Validate Bid Amount
    if (findParcelRideBooking.farePrice > findBid.bidamount) {
      return res.status(400).json({ message: "Price Unacceptable" });
    }

    // Update Ride Booking
    findParcelRideBooking.AdminId = findBid.AdminId;
    findParcelRideBooking.driverId = findBid.DriverId;
    findParcelRideBooking.VehcileId = findBid.VehicleId;
    findParcelRideBooking.farePrice = findBid.bidamount;
    findParcelRideBooking.status = "accepted";

    const updatedRideBooking = await findParcelRideBooking.save();

    // Remove All Bids for the Ride Booking
    await ParcelBidSchema.deleteMany({
      ParcelBookingId: findParcelRideBooking._id,
    });

    const findParcelRideBookingagain = await ParcelsSchema.findOne({
      userId: findUser._id,
      status: "accepted",
    })
      .populate({
        path: "AdminId",
        model: "Admin",
      })
      .populate({
        path: "driverId",
        model: "Driver",
      })
      .populate({
        path: "VehcileId",
        model: "Vehicles",
      })
      .populate({
        path: "VehicleCategoryId",
        model: "VehicleCategory",
      });

    return res.status(200).json({
      message: "Ride Will Be With You Shortly.",
      data: findParcelRideBookingagain,
    });
  } catch (error) {
    console.error("Internal Server Error:", error);
    return res.status(500).json({ message: "Internal Server Error!" });
  }
};

const declineParcelBidbyUser = async (req, res) => {
  try {
    const { userId, parcelbidId } = req.params;

    const findUser = await Users.findById(userId);

    if (!findUser) {
      return res.status(404).json({ message: "User Not Found!" });
    }
    const findParcelBidandDelete = await ParcelBidSchema.findByIdAndDelete(
      parcelbidId
    );

    if (!findParcelBidandDelete) {
      return res.status(404).json({ message: "Bid Not Found!" });
    }

    return res.status(200).json({ message: "Bid Declined Successfully!" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal Server Error!" });
  }
};

const GetAcceptedParcelride = async (req, res) => {
  try {
    const { DriverId } = req.params;

    const findDriver = await Driver.findById(DriverId);

    if (!findDriver) {
      return res.status(404).json({ message: "Driver Not Found!" });
    }

    const findParcelRide = await ParcelsSchema.findOne({
      driverId: findDriver._id,
      status: "accepted",
    })
      .populate({
        path: "VehcileId",
        model: "Vehicles",
      })
      .populate({
        path: "userId",
        model: "Users",
      });

    if (!findParcelRide) {
      return res.status(404).json({ message: "Ride Not Found!" });
    }

    return res
      .status(200)
      .json({ message: "Ride Found Successfully!", findParcelRide });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal Server Error!" });
  }
};

const cancelParcelRide = async (req, res) => {
  try {
    const { userId, parcelRideId } = req.params;

    const findUser = await Users.findById(userId);

    if (!findUser) {
      return res.status(404).json({ message: "User Not Found!" });
    }
    const findparcelRide = await ParcelsSchema.findById(parcelRideId);

    if (!findparcelRide) {
      return res.status(404).json({ message: "Ride Not Found!" });
    }

    findparcelRide.status = "cancelled";

    await findparcelRide.save();
    return res
      .status(200)
      .json({ message: "Parcel Ride Cancelled Successfully!" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal Server error!" });
  }
};

const updateSatatusdelivering = async (req, res) => {
  try {
    const { Otp } = req.body;

    const { DriverId, ParcelsrideId } = req.params;

    const findDriver = await Driver.findById(DriverId);

    if (!findDriver) {
      return res.status(404).json({ message: "User Not Found!" });
    }
    const findParcelRide = await ParcelsSchema.findById(ParcelsrideId);

    if (!findParcelRide) {
      return res.status(404).json({ message: "Ride Not Found!" });
    }
    if (findParcelRide.OTp.toString() !== Otp) {
      return res.status(400).json({ message: "Otp Is Not Valid!" });
    }

    findParcelRide.status = "delivering";
    await findParcelRide.save();
    return res.status(200).json({
      message: "Ride status updated delivering Successfully!",
      parcel: findParcelRide,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal Server Error!" });
  }
};

const updateParcelSatatuscompleted = async (req, res) => {
  try {
    const { DriverId, ParcelsrideId } = req.params;

    const proofOfDelivery = req.files.proofOfDelivery;
    const uploadResult = proofOfDelivery
      ? await cloudinary.uploader.upload(proofOfDelivery.tempFilePath, {
          resource_type: "image",
          folder: "proofOfDelivery",
        })
      : "";

    if (!proofOfDelivery) {
      return res.status(400).json({ message: "Proof Of Delivery Is Required" });
    }

    const findDriver = await Driver.findById(DriverId);

    if (!findDriver) {
      return res.status(404).json({ message: "Driver Not Found!" });
    }
    const findParcelRide = await ParcelsSchema.findById(ParcelsrideId);

    if (!findParcelRide) {
      return res.status(404).json({ message: "Ride Not Found!" });
    }

    findParcelRide.status = "completed";
    findParcelRide.proofOfDelivery = uploadResult.secure_url;
    await findParcelRide.save();

    return res.status(200).json({
      message: "Ride completed Successfully!",
      parcel: findParcelRide,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal Server Error!" });
  }
};

const GetParcelStatus = async (req, res) => {
  try {
    const { userId, parcelId } = req.params;

    const findUser = await Users.findById(userId);

    if (!findUser) {
      return res.status(400).json({ message: "User Not Found!" });
    }

    const findBid = await ParcelsSchema.findById(parcelId);

    if (!findBid) {
      return res.status(400).json({ message: "Bid Not Found!" });
    }
    return res.status(200).json({ message: "Bid", findBid });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal Server Error!" });
  }
};

const getParcelHistoryofUser = async (req, res) => {
  try {
    const { userID } = req.params;

    const findUser = await Users.findById(userID);

    const findParcels = await ParcelsSchema.find({ userId: findUser._id })
      .populate({
        path: "AdminId",
        model: "Admin",
        select: "-password",
      })
      .populate({
        path: "VehcileId",
        model: "Vehicles",
      })
      .populate({
        path: "driverId",
        model: "Driver",
        select: "-password",
      });

    if (!findUser) {
      return res.status(404).json({ message: "User Not found!" });
    }
    if (!findParcels) {
      return res.status(404).json({ message: "Parcels Not found!" });
    }

    return res.status(200).json({ message: "Parcels Not found!", findParcels });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal Server Error!" });
  }
};

const getParcelHistoryofdriver = async (req, res) => {
  try {
    const { driverId } = req.params;

    const findDriver = await Driver.findById(driverId);

    if (!findDriver) {
      return res.status(404).json({ message: "Driver Not found!" });
    }

    const pipeline = [
      {
        $match: {
          driverId: new mongoose.Types.ObjectId(findDriver._id),
        },
      },

      {
        $lookup: {
          from: "admins",
          localField: "AdminId",
          foreignField: "_id",
          as: "AdminId",
        },
      },
      {
        $lookup: {
          from: "Vehicles",
          localField: "VehcileId",
          foreignField: "_id",
          as: "VehcileId",
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "userId",
        },
      },
      {
        $lookup: {
          from: "locations",
          localField: "from",
          foreignField: "_id",
          as: "origin",
        },
      },
      {
        $lookup: {
          from: "locations",
          localField: "to",
          foreignField: "_id",
          as: "destinations",
        },
      },
      {
        $unwind: {
          path: "$AdminId",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $unwind: {
          path: "$AdminId",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $unwind: {
          path: "$VehcileId",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $unwind: {
          path: "$userId",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $unwind: {
          path: "$origin",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $unwind: {
          path: "$destinations",
          preserveNullAndEmptyArrays: true,
        },
      },
    ];
    const findParcelHistory = await ParcelsSchema.aggregate(pipeline);

    return res.status(200).json({ message: "Rides Not found!", findParcels: findParcelHistory });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal Server Error!" });
  }
};

export {
  CreateParcel,
  get_parcels_users,
  get_parcels_Admin,
  GetShowDriverParcelRide,
  CreateParcelBid,
  getAllParcelBidsUserAgainstRide,
  AcceptParcelBidFareOffer,
  declineParcelBidbyUser,
  GetParcelStatus,
  GetAcceptedParcelride,
  cancelParcelRide,
  updateSatatusdelivering,
  updateParcelSatatuscompleted,
  getParcelHistoryofUser,
  getParcelHistoryofdriver,
};
