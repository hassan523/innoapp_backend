import mongoose from "mongoose";
import BidSchema from "../models/BidSchema.js";
import Driver from "../models/Driver.js";
import LocationsModel from "../models/LocationsModel.js";
import RidebookingSchema from "../models/RidebookingSchema.js";
import ParcelsSchema from "../models/ParcelsSchema.js";
import ParcelBidSchema from "../models/ParcelBidSchema.js";

const ParcelBooking = (io, socket) => {
  socket.on("parcel-booking-open", (parcelBookingRoom) => {
    socket.join(parcelBookingRoom);
    console.log("User Joined Room For Parcel", parcelBookingRoom);
  });

  socket.on("is-rider-free-parcel", async (driverID) => {
    try {
      console.log("is-rider-free-parcel", driverID, "Recieved From Client");

      const findDriver = await Driver.findById(driverID);
      if (!findDriver) {
        console.log("Driver not found");
        socket.emit("error", { message: "Driver not found" });
        return;
      }

      const validateBooking = await ParcelsSchema.find({
        driverId: driverID,
        status: { $in: ["delivering", "accepted"] },
      });

      if (validateBooking.length !== 0) {
        const parcelAggregation = await ParcelsSchema.aggregate([
          {
            $match: {
              driverId: new mongoose.Types.ObjectId(driverID),
              status: { $in: ["delivering", "accepted"] },
            },
          },
          {
            $lookup: {
              from: "drivers",
              localField: "driverId",
              foreignField: "_id",
              as: "driverId",
            },
          },
          {
            $unwind: {
              path: "$driverId",
              preserveNullAndEmptyArrays: true,
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
            $unwind: {
              path: "$userId",
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $lookup: {
              from: "vehicles",
              localField: "VehcileId",
              foreignField: "_id",
              as: "VehcileId",
            },
          },
          {
            $unwind: {
              path: "$VehcileId",
              preserveNullAndEmptyArrays: true,
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
            $unwind: {
              path: "$origin",
              preserveNullAndEmptyArrays: true,
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
              path: "$destinations",
              preserveNullAndEmptyArrays: true,
            },
          },
        ]);

        console.log(parcelAggregation, "parcelAggregation")

        console.log(false, "is-rider-free", "Sent To Client");

        return socket.emit("rider-free-parcel", {
          isWaiting: false,
          parcel: parcelAggregation,
        });
      }

      console.log(true, "is-rider-free", "Sent To Client");
      socket.emit("rider-free-parcel", { isWaiting: true, parcel: null });
    } catch (error) {
      console.error("Error in is-rider-free:", error);
      socket.emit("error", { message: "Error checking rider status" });
    }
  });

  socket.on("find-parcels", async ({ driverID, radiusInMeters }) => {
    try {
      console.log(driverID, radiusInMeters, "Recieved From The Client");

      const findDriver = await Driver.findById(driverID);
      if (!findDriver) {
        console.log("Driver not found");
        socket.emit("error", { message: "Driver not found" });
        return;
      }

      if (!findDriver.location || !findDriver.location.coordinates) {
        socket.emit("error", { message: "Driver's location is invalid" });
        return;
      }

      const driverLocation = findDriver.location.coordinates;
      if (!driverLocation || driverLocation.length !== 2) {
        socket.emit("error", {
          message: "Driver's location coordinates are invalid",
        });
        return;
      }

      const radiusInMiles = radiusInMeters / 1609.34;

      const nearbyRides = await ParcelsSchema.aggregate([
        {
          $lookup: {
            from: "locations",
            localField: "from",
            foreignField: "_id",
            as: "locationData",
          },
        },
        {
          $unwind: "$locationData",
        },
        {
          $match: {
            "locationData.location": {
              $geoWithin: {
                $centerSphere: [driverLocation, radiusInMiles / 3963.2],
              },
            },
            status: { $in: ["pending"] },
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
          $unwind: {
            path: "$userId",
            preserveNullAndEmptyArrays: true,
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
          $unwind: {
            path: "$origin",
            preserveNullAndEmptyArrays: true,
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
            path: "$destinations",
            preserveNullAndEmptyArrays: true,
          },
        },
      ])
        .then((rides) => {
          console.log("sent to client");
          console.log(rides, "rides rides")
          socket.emit("parcels-found", { data: rides });
        })
        .catch((err) => {
          console.error("Error finding nearby rides:", err);
        });
    } catch (error) {
      console.error("Error in find-rides:", error);
      socket.emit("error", { message: "Error finding rides" });
    }
  });

  socket.on("send-bid-parcel", async ({ parcelID }) => {
    console.log(parcelID, "Booking ID Recieved From Client");

    const findBid = await ParcelBidSchema.find({ ParcelBookingId: parcelID })
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
    socket.broadcast.to(parcelID).emit("get-bids-parcel", findBid);

    console.log("Booking ID Sent To Client");
  });

  socket.on("start-ride-parcel", async ({ parcel }) => {
    if (!parcel) {
      socket.emit("error", { message: "Invalid request" });
      return;
    }

    socket.join(parcel.driverId);

    const findParcel = await ParcelsSchema.findById(parcel._id);
    if (!findParcel) {
      socket.emit("error", { message: "Ride not found" });
      return;
    }

    const parcelAggregation = await ParcelsSchema.aggregate([
      {
        $match: { _id: new mongoose.Types.ObjectId(parcel._id) },
      },
      {
        $lookup: {
          from: "drivers",
          localField: "driverId",
          foreignField: "_id",
          as: "driverId",
        },
      },
      {
        $unwind: {
          path: "$driverId",
          preserveNullAndEmptyArrays: true,
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
        $unwind: {
          path: "$userId",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "vehicles",
          localField: "VehcileId",
          foreignField: "_id",
          as: "VehcileId",
        },
      },
      {
        $unwind: {
          path: "$VehcileId",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "locations",
          localField: "from",
          foreignField: "_id",
          as: "fromLocation",
        },
      },
      {
        $unwind: {
          path: "$fromLocation",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "locations",
          localField: "to",
          foreignField: "_id",
          as: "toLocation",
        },
      },
      {
        $unwind: {
          path: "$toLocation",
          preserveNullAndEmptyArrays: true,
        },
      },
    ]);

    socket.broadcast
      .to(parcel._id)
      .emit("ride-started-parcel", parcelAggregation[0]);
  });

  socket.on("location-tracking-parcel", async ({ parcelID, coordinates }) => {
    console.log(parcelID);
    console.log(coordinates);

    if (!parcelID || !coordinates) {
      socket.emit("error", { message: "Invalid request" });
      return;
    }

    const findParcel = await ParcelsSchema.findById(parcelID);

    // console.log(findRide, "Ride")

    if (!findParcel) {
      socket.emit("error", { message: "Ride not found" });
      return;
    }
    const findDriver = await Driver.findByIdAndUpdate(findParcel.driverId, {
      location: {
        type: "Point",
        coordinates,
      },
    });
    if (!findDriver) {
      socket.emit("error", { message: "Driver not found" });
      return;
    }

    const parcelAggregation = await ParcelsSchema.aggregate([
      {
        $match: {
          _id: new mongoose.Types.ObjectId(parcelID),
        },
      },
      {
        $lookup: {
          from: "drivers",
          localField: "driverId",
          foreignField: "_id",
          as: "driverId",
        },
      },
      {
        $unwind: {
          path: "$driverId",
          preserveNullAndEmptyArrays: true,
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
        $unwind: {
          path: "$userId",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "vehicles",
          localField: "VehcileId",
          foreignField: "_id",
          as: "VehcileId",
        },
      },
      {
        $unwind: {
          path: "$VehcileId",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "locations",
          localField: "from",
          foreignField: "_id",
          as: "fromLocation",
        },
      },
      {
        $unwind: {
          path: "$fromLocation",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "locations",
          localField: "to",
          foreignField: "_id",
          as: "toLocation",
        },
      },
      {
        $unwind: {
          path: "$toLocation",
          preserveNullAndEmptyArrays: true,
        },
      },
    ]);

    socket.broadcast
      .to(parcelID)
      .emit("driver-location-parcel", parcelAggregation[0]);
  });
};

export { ParcelBooking };
