import { v2 as cloudinary } from "cloudinary";
import Admin from "../models/Admin.js";
import Vehicles from "../models/Vehicles.js";
import HandlePostNotification from "../utils/Notify.js";
import Users from "../models/Users.js";
import Driver from "../models/Driver.js";
import VehicleAsingment from "../models/VehicleAsingment.js";
import VehicleCategorySchema from "../models/VehicleCategorySchema.js";
import RateListSchema from "../models/RateListSchema.js";
import RidebookingSchema from "../models/RidebookingSchema.js";
import { calculateMiles } from "../utils/calculateMiles.js";
import BidSchema from "../models/BidSchema.js";
import RatingReviewSchema from "../models/RatingReviewSchema.js";
import LocationsModel from "../models/LocationsModel.js";
import mongoose from "mongoose";
import stripe from "../utils/StripeConfig.js";
import KycModel from "../models/KycModel.js";
import PaymentInvoices from "../models/PaymentInvoices.js";

const getssignedPublicVehicles = async (req, res) => {
  try {
    const { userID } = req.params;
    const findUser = await Users.findById(userID);

    if (!findUser) {
      return res.status(404).json({ message: "User Not Found!" });
    }
    const findDrivers = await Driver.find({
      carAssingned: true,
      IsActive: true,
    }).populate({
      path: "AdminId",
      model: "Admin",
    });
    if (!findDrivers) {
      return res.status(404).json({ message: "No Driver Found!" });
    }

    const driverIDs = findDrivers.map((item) => item._id);

    const vehicle = await Promise.all(
      findDrivers.map(async (item) => {
        try {
          const findVehicleAssignment = await VehicleAsingment.findOne({
            DriverId: { $in: driverIDs },
            Active: true,
            expirydate: { $lt: new Date() },
          });

          if (!findVehicleAssignment) {
            return {
              driver: {
                ...item.toObject(),
                vehicle: null,
              },
            };
          }

          const findVehicle = await Vehicles.findOne({
            vin: findVehicleAssignment.VinNumber,
          });

          return {
            driver: {
              ...item.toObject(),
              vehicle: findVehicle || null,
            },
          };
        } catch (error) {
          console.error("Error processing driver assignment:", error);
          return {
            driver: {
              ...item.toObject(),
              vehicle: null,
            },
          };
        }
      })
    );

    return res.status(200).json({
      message: "All Public Vehicles Avalable to take for ride!",
      vehicle,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal Server Error!" });
  }
};

const getEstimatedfarePrice = async (req, res) => {
  try {
    const { miles } = req.body;
    const { userId, categoryID } = req.params;

    if (!miles || isNaN(miles)) {
      return res.status(400).json({ message: "Miles must be a valid number!" });
    }

    const findUser = await Users.findById(userId);
    if (!findUser) {
      return res.status(404).json({ message: "User not found!" });
    }
    const findCategory = await VehicleCategorySchema.findById(categoryID);
    if (!findCategory) {
      return res.status(404).json({ message: "Category not found!" });
    }

    const findRateLists = await RateListSchema.find({
      categoryID: findCategory._id,
    });
    if (!findRateLists || findRateLists.length === 0) {
      return res.status(404).json({ message: "Rates not found!" });
    }

    const minimumRate = Math.min(
      ...findRateLists.map((item) => item.ratepermile)
    );

    const farePrice = miles * minimumRate;

    return res.status(200).json({
      message: "Fare price calculated successfully!",
      data: {
        miles,
        category: findCategory.name,
        farePrice,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error!" });
  }
};

const CreateRideBooking = async (req, res) => {
  try {
    const { userId, VehicleCategoryId } = req.params;
    const {
      orgin,
      destination,
      miles,
      comment,
      farePrice,
      booking_type,
      sheduled_date,
    } = req.body;
    const findUser = await Users.findById(userId);

    if (!findUser) {
      return res.status(404).json({ message: "User Not Found!" });
    }

    const findVehiclecategory = await VehicleCategorySchema.findById(
      VehicleCategoryId
    );
    if (!findVehiclecategory) {
      return res.status(404).json({ message: "Vehicle category Not Found!" });
    }

    const findRideBooking = await RidebookingSchema.findOne({
      userId: findUser._id,
      status: "Pending",
    });
    if (findRideBooking) {
      return res.status(404).json({ message: "Ride Booking Already Created!" });
    }

    const createOrigin = new LocationsModel({
      location: {
        type: "Point",
        coordinates: [orgin.longitude, orgin.latitude],
      },
      address: orgin.originAddressLine,
      locationType: ["RideBooking"],
    });
    await createOrigin.save();

    const createDestination = new LocationsModel({
      location: {
        type: "Point",
        coordinates: [orgin.longitude, orgin.latitude],
      },
      address: destination.destinationAddressLine,
      locationType: ["RideBooking"],
    });
    await createDestination.save();

    if (booking_type === "Scheduled") {
      const otpcode = Math.floor(100000 + Math.random() * 900000);

      const createRideBooking = new RidebookingSchema({
        VehicleCategoryId: findVehiclecategory._id,
        userId: findUser._id,
        orgin: orgin,
        destination: destination,
        miles: miles,
        comment: comment,
        OTp: otpcode,
        farePrice: farePrice,
        booking_type: booking_type,
        sheduled_date: sheduled_date,

        from: createOrigin._id,
        to: createDestination._id,
      });
      await createRideBooking.save();

      const populateRideBooking = await RidebookingSchema.findById(
        createRideBooking._id
      );

      const findOrigin = await LocationsModel.findById(createRideBooking.from);
      const findDestinations = await LocationsModel.findById(
        createRideBooking.to
      );

      const RideBookingRes = {
        ...populateRideBooking.toObject(),
        origin: findOrigin,
        destinations: findDestinations,
      };

      return res
        .status(200)
        .json({ message: "Ride Booking Created", data: RideBookingRes });
    }

    const otpcode = Math.floor(100000 + Math.random() * 900000);

    const createRideBooking = new RidebookingSchema({
      VehicleCategoryId: findVehiclecategory._id,
      userId: findUser._id,
      orgin: orgin,
      destination: destination,
      miles: miles,
      comment: comment,
      OTp: otpcode,
      farePrice: farePrice,
      booking_type: booking_type,

      from: createOrigin._id,
      to: createDestination._id,
    });
    await createRideBooking.save();

    const populateRideBooking = await RidebookingSchema.findById(
      createRideBooking._id
    );

    const findOrigin = await LocationsModel.findById(createRideBooking.from);
    const findDestinations = await LocationsModel.findById(
      createRideBooking.to
    );

    const RideBookingRes = {
      ...populateRideBooking.toObject(),
      origin: findOrigin,
      destinations: findDestinations,
    };

    return res
      .status(200)
      .json({ message: "Ride Booking Created", data: RideBookingRes });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal Server Error!" });
  }
};

const updateRideBooking = async (req, res) => {
  try {
    const { userId, rideId } = req.params;
    const { orgin, destination, miles, comment, farePrice, VehicleCategoryId } =
      req.body;
    const findUser = await Users.findById(userId);

    if (!findUser) {
      return res.status(404).json({ message: "User Not Found!" });
    }

    const findVehiclecategory = await VehicleCategorySchema.findById(
      VehicleCategoryId
    );
    if (!findVehiclecategory) {
      return res.status(404).json({ message: "Vehicle category Not Found!" });
    }

    const findRideBooking = await RidebookingSchema.findById(rideId);

    (findRideBooking.VehicleCategoryId =
      findVehiclecategory._id || findRideBooking.VehicleCategoryId),
      (findRideBooking.orgin = orgin || findRideBooking.orgin),
      (findRideBooking.destination =
        destination || findRideBooking.destination),
      (findRideBooking.miles = miles),
      (findRideBooking.comment = comment || findRideBooking.destination),
      (findRideBooking.farePrice = farePrice || findRideBooking.farePrice);

    const createRideBooking = await findRideBooking.save();

    return res.status(200).json({
      message: "Ride Booking Updated Successfully!",
      createRideBooking,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal Server Error!" });
  }
};

const GetShowDriverRide = async (req, res) => {
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

    const findNearbyRideBooking = await RidebookingSchema.find({
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
        ["accepted", "ongoing"].includes(task.status)
      )
    ) {
      return res
        .status(400)
        .json({ message: "You are already In Ride booking!" });
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

const CreateBid = async (req, res) => {
  try {
    const { DriverId, RideBookingId, AdminId } = req.params;
    const { bidamount, VinNumber } = req.body;

    console.log(bidamount, VinNumber);
    console.log(DriverId, RideBookingId, AdminId);

    const [findAdmin, findDrivers, findRideBooking, findVehicle] =
      await Promise.all([
        Admin.findById(AdminId),
        Driver.findOne({ _id: DriverId, AdminId }),
        RidebookingSchema.findById(RideBookingId),
        Vehicles.findOne({ vin: VinNumber }),
      ]);

    if (!findAdmin)
      return res.status(404).json({ message: "Admin Not Found!" });
    if (!findDrivers)
      return res.status(404).json({ message: "Driver Not Found!" });
    if (!findRideBooking)
      return res.status(404).json({ message: "Ride Booking Not Found!" });
    if (!findVehicle)
      return res.status(404).json({ message: "Vehicle Not Found!" });

    if (findAdmin.IsActive === false)
      return res
        .status(404)
        .json({ message: "Admin Subscription is Expired!" });
    if (findRideBooking.status[0] !== "pending")
      return res.status(400).json({ message: "Someone Else took Booking!" });

    if (findRideBooking.farePrice > bidamount) {
      return res.status(400).json({
        message:
          "You cannot Bid Less Amount than fare Price Calculated by App!",
      });
    }

    const existingBid = await BidSchema.exists({
      DriverId: findDrivers._id,
      RideBookingId: findRideBooking._id,
    });

    if (existingBid) {
      return res.status(400).json({
        message:
          "You cannot create Bid Because you have already created Bid on this Ride!",
      });
    }

    const creatingBid = new BidSchema({
      AdminId: findAdmin._id,
      DriverId: findDrivers._id,
      VehicleId: findVehicle._id,
      RideBookingId: findRideBooking._id,
      bidamount: bidamount,
    });
    await creatingBid.save();
    console.log(creatingBid);

    return res.status(200).json({ message: "Bid Created!", creatingBid });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal Server Error!" });
  }
};

const GetBidStatus = async (req, res) => {
  try {
    const { DriverId, bidId } = req.params;

    const findDriver = await Driver.findById(DriverId);

    if (!findDriver) {
      return res.status(400).json({ message: "Driver Not Found!" });
    }

    const findBid = await BidSchema.findById(bidId);

    if (!findBid) {
      return res.status(400).json({ message: "Bid Not Found!" });
    }
    return res.status(200).json({ message: "Bid", findBid });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal Server Error!" });
  }
};

const GetAcceptedride = async (req, res) => {
  try {
    const { DriverId } = req.params;

    const findDriver = await Driver.findById(DriverId);

    if (!findDriver) {
      return res.status(404).json({ message: "Driver Not Found!" });
    }

    const findRide = await RidebookingSchema.findOne({
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

    if (!findRide) {
      return res.status(404).json({ message: "Ride Not Found!" });
    }

    return res
      .status(200)
      .json({ message: "Ride Found Successfully!", findRide });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal Server Error!" });
  }
};

const declineBidbyUser = async (req, res) => {
  try {
    const { userID, bidId } = req.params;

    const findUser = await Users.findById(userID);

    if (!findUser) {
      return res.status(404).json({ message: "User Not Found!" });
    }
    const findBidandDelete = await BidSchema.findByIdAndDelete(bidId);

    if (!findBidandDelete) {
      return res.status(404).json({ message: "Bid Not Found!" });
    }

    return res.status(200).json({ message: "Bid Declined Successfully!" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal Server Error!" });
  }
};

const AcceptBidFareOffer = async (req, res) => {
  try {
    const { userId, bidId } = req.params;

    const findUser = await Users.findById(userId);
    if (!findUser) {
      return res.status(404).json({ message: "User Not Found!" });
    }

    const findBid = await BidSchema.findById(bidId);
    if (!findBid) {
      return res
        .status(404)
        .json({ message: "Bid Not Available! Try Another Bid!" });
    }

    const findRideBooking = await RidebookingSchema.findOne({
      userId: findUser._id,
      status: "pending",
    });

    if (!findRideBooking) {
      return res.status(404).json({ message: "Booking Not Found!" });
    }

    // Validate Bid Amount
    if (findRideBooking.farePrice > findBid.bidamount) {
      return res.status(400).json({ message: "Price Unacceptable" });
    }

    // Update Ride Booking
    findRideBooking.AdminId = findBid.AdminId;
    findRideBooking.driverId = findBid.DriverId;
    findRideBooking.VehcileId = findBid.VehicleId;
    findRideBooking.farePrice = findBid.bidamount;
    findRideBooking.status = "accepted";

    const updatedRideBooking = await findRideBooking.save();

    // Remove All Bids for the Ride Booking
    await BidSchema.deleteMany({ RideBookingId: findRideBooking._id });

    const findRideBookingagain = await RidebookingSchema.findOne({
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

    const findOrigin = await LocationsModel.findById(findRideBookingagain.from);
    const findDestinations = await LocationsModel.findById(
      findRideBookingagain.to
    );

    const RideBookingRes = {
      ...findRideBookingagain.toObject(),
      origin: findOrigin,
      destinations: findDestinations,
    };

    return res.status(200).json({
      message: "Ride Will Be With You Shortly.",
      data: RideBookingRes,
    });
  } catch (error) {
    console.error("Internal Server Error:", error);
    return res.status(500).json({ message: "Internal Server Error!" });
  }
};

const getAllBidsUserAgainstRide = async (req, res) => {
  try {
    const { userId, rideId } = req.params;

    const findUser = await Users.findById(userId);

    if (!findUser) {
      return res.status(404).json({ message: "User Not Found!" });
    }

    const findRide = await RidebookingSchema.findById(rideId);

    if (!findRide) {
      return res.status(404).json({ message: "Ride Not Found!" });
    }
    const findBid = await BidSchema.find({ RideBookingId: findRide._id })
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

    if (findRide.status.includes("cancelled")) {
      return res.status(400).json({ message: "Ride was cancelled!" });
    }
    return res.status(200).json({ message: "All Bids", findBid });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal Server Error!" });
  }
};

const cancelRide = async (req, res) => {
  try {
    const { userId, rideId } = req.params;

    const findUser = await Users.findById(userId);

    if (!findUser) {
      return res.status(404).json({ message: "User Not Found!" });
    }
    const findRide = await RidebookingSchema.findById(rideId);

    if (!findRide) {
      return res.status(404).json({ message: "Ride Not Found!" });
    }

    findRide.status = "cancelled";

    await findRide.save();
    return res.status(200).json({ message: "Ride Cancelled Successfully!" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal Server error!" });
  }
};

const getDriverProfileByAdmin = async (req, res) => {
  try {
    const { AdminId, DriverId } = req.params;

    // Find Admin and Driver
    const findAdmin = await Admin.findById(AdminId);
    const findDriver = await Driver.findById(DriverId);

    // Validate Admin and Driver
    if (!findAdmin) {
      return res.status(404).json({ message: "Admin Not Found!" });
    }
    if (!findDriver) {
      return res.status(404).json({ message: "Driver Not Found!" });
    }
    if (findAdmin._id.toString() !== findDriver.AdminId.toString()) {
      return res
        .status(400)
        .json({ message: "This Driver Does Not Belong to This Admin!" });
    }

    // Fetch Rides for the Driver
    const findRides = await RidebookingSchema.find({
      AdminId: findAdmin._id,
      driverId: findDriver._id,
    })
      .populate({
        path: "driverId",
        model: "Driver",
      })
      .populate({
        path: "userId",
        model: "Users",
      })
      .populate({
        path: "VehcileId",
        model: "Vehicles",
      });

    // Check if Rides Exist
    if (!findRides || findRides.length === 0) {
      return res
        .status(404)
        .json({ message: "No Rides Available for This Driver!" });
    }

    // Calculate Total Miles
    const totalMiles = findRides.reduce(
      (acc, item) => acc + (item.miles || 0),
      0
    );

    // Fetch Reviews and Calculate Ratings
    const findReviewRatings = await RatingReviewSchema.find({
      AdminId: findAdmin._id,
      DriverId: findDriver._id,
    });

    let totalRatings = 0;
    let averageRatings = 0;

    if (findReviewRatings.length > 0) {
      totalRatings = findReviewRatings.reduce(
        (acc, item) => acc + (item.rating || 0),
        0
      );
      averageRatings = totalRatings / findReviewRatings.length;
    }

    // Respond with Driver Profile Dashboard Data
    return res.status(200).json({
      message: "Dashboard Data!",
      totalRides: findRides,
      totalMiles,
      totalRatings,
      averageRatings,
      findDriver,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error!" });
  }
};

const updateSatatusongoing = async (req, res) => {
  try {
    const { Otp } = req.body;

    const { DriverId, rideId } = req.params;

    const findDriver = await Driver.findById(DriverId);

    if (!findDriver) {
      return res.status(404).json({ message: "User Not Found!" });
    }
    const findRide = await RidebookingSchema.findById(rideId);

    if (!findRide) {
      return res.status(404).json({ message: "Ride Not Found!" });
    }
    if (findRide.OTp.toString() !== Otp) {
      return res.status(400).json({ message: "Otp Is Not Valid!" });
    }

    findRide.status = "ongoing";
    await findRide.save();
    return res.status(200).json({
      message: "Ride status updated ongoing Successfully!",
      ride: findRide,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal Server Error!" });
  }
};

const updateSatatuscompleted = async (req, res) => {
  try {
    const { DriverId, rideId } = req.params;

    const findDriver = await Driver.findById(DriverId);
    if (!findDriver) {
      return res.status(404).json({ message: "Driver Not Found!" });
    }

    const findRide = await RidebookingSchema.findById(rideId);
    if (!findRide) {
      return res.status(404).json({ message: "Ride Not Found!" });
    }

    const findUser = await Users.findById(findRide.userId);
    if (!findUser) {
      return res.status(404).json({ message: "User Not Found!" });
    }

    const customerID = await stripe.customers.retrieve(findUser.customerID);
    const paymentMethod = await stripe.paymentMethods.retrieve(
      findUser.paymentMethodID
    );

    const findAdmin = await Admin.findById(findDriver.AdminId);
    if (!findAdmin) {
      return res.status(404).json({ message: "Invalid Admin ID" });
    }

    const findKyc = await KycModel.findOne({ AdminId: findAdmin._id });


    const platformFee = Math.round(findRide.farePrice * 100 * 0.03);
    const afterPlatformFee = Math.round(findRide.farePrice * 100) - platformFee;

    const paymentIntent = await stripe.paymentIntents.create({
      amount: findRide.farePrice * 100, 
      currency: "usd",
      customer: customerID.id,
      payment_method: paymentMethod.id,
      transfer_data: {
          destination: findKyc.accountID, 
      },
      on_behalf_of: findKyc.accountID, 
      confirm: true,
      automatic_payment_methods: {
          enabled: true,
          allow_redirects: "never",
      },
      application_fee_amount: Math.round(findRide.farePrice * 100 * 0.03), 
  });
  

    findRide.status = ["completed"];

    const createInvoice = new PaymentInvoices({
      adminId: findAdmin._id,
      DriverId: findDriver._id,
      rideId: findRide._id,
      userId: findUser._id,
      rideType: "RideBooking",
      paymentIntentId: paymentIntent.id,
      receivingAccount: findKyc.accountID,
      platformFee: platformFee / 100,
      paidByUser: findRide.farePrice,
      totalReceiving: afterPlatformFee / 100,
    });
    await createInvoice.save();
    await findRide.save();

    return res
      .status(200)
      .json({ message: "Ride completed Successfully!", ride: findRide });
  } catch (error) {
    console.log(error);
    switch (error.type) {
      case "StripeCardError":
        return res
          .status(500)
          .json({ message: `A payment error occurred: ${error.message}` });
      case "StripeInvalidRequestError":
        return res.status(500).json({ message: error.raw.message });
      default:
        console.log(error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
  }
};

const getRideStatatus = async (req, res) => {
  try {
    const { rideId, userID } = req.params;

    const findUser = await Users.findById(userID);

    const findRide = await RidebookingSchema.findById(rideId);

    if (!findUser) {
      return res.status(404).json({ message: "User Not Found!" });
    }
    if (!findRide) {
      return res.status(404).json({ message: "Ride Not Found!" });
    }

    return res.status(200).json({ message: "Ride!", findRide });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal Server Error!" });
  }
};

const getAllRidesofCompany = async (req, res) => {
  try {
    const { AdminId } = req.params;

    const findAdmin = await Admin.findById(AdminId);

    if (!findAdmin) {
      return res.status(404).json({ message: "Admin Not Found!" });
    }
    const findAllrides = await RidebookingSchema.find({
      AdminId: findAdmin._id,
    })
      .populate({
        path: "driverId",
        model: "Driver",
      })
      .populate({
        path: "userId",
        model: "Users",
      })
      .populate({
        path: "VehcileId",
        model: "Vehicles",
      });

    return res
      .status(200)
      .json({ message: "All rides of this company!", findAllrides });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal Server error!" });
  }
};

const getRideHistoryofUser = async (req, res) => {
  try {
    const { userID } = req.params;

    const findUser = await Users.findById(userID);

    const findRides = await RidebookingSchema.find({ userId: findUser._id })
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
    if (!findRides) {
      return res.status(404).json({ message: "Rides Not found!" });
    }

    const mapRidesHistory = findRides.map(async (item) => {
      const findOrigin = await LocationsModel.findById(item.from);
      const findDestinations = await LocationsModel.findById(item.to);
      return {
        ...item.toObject(),
        origin: findOrigin,
        destinations: findDestinations,
      };
    });
    const resolved = await Promise.all(mapRidesHistory);
    return res
      .status(200)
      .json({ message: "Rides found!", findRides: resolved });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal Server Error!" });
  }
};

const getRideHistoryofdriver = async (req, res) => {
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
    const findRideHistory = await RidebookingSchema.aggregate(pipeline);

    return res
      .status(200)
      .json({ message: "Rides Not found!", findRides: findRideHistory });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal Server Error!" });
  }
};

export {
  getssignedPublicVehicles,
  getEstimatedfarePrice,
  CreateRideBooking,
  GetShowDriverRide,
  CreateBid,
  AcceptBidFareOffer,
  getAllBidsUserAgainstRide,
  cancelRide,
  getDriverProfileByAdmin,
  updateSatatusongoing,
  updateSatatuscompleted,
  updateRideBooking,
  getRideStatatus,
  getAllRidesofCompany,
  GetBidStatus,
  declineBidbyUser,
  GetAcceptedride,
  getRideHistoryofUser,
  getRideHistoryofdriver,
};
