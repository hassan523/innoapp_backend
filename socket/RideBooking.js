import mongoose from "mongoose";
import BidSchema from "../models/BidSchema.js";
import Driver from "../models/Driver.js";
import LocationsModel from "../models/LocationsModel.js";
import RidebookingSchema from "../models/RidebookingSchema.js";

const RideBooking = (io, socket) => {
  socket.on("ride-opened", (openRideRoom) => {
    socket.join(openRideRoom);
    console.log("User Joined Room For Ride: " + openRideRoom);
  });

  socket.on("is-rider-free", async (driverID) => {
    try {
      console.log("is-rider-free", driverID, "Recieved From Client");

      const findDriver = await Driver.findById(driverID);
      if (!findDriver) {
        console.log("Driver not found");
        socket.emit("error", { message: "Driver not found" });
        return;
      }

      const validateBooking = await RidebookingSchema.find({
        driverId: driverID,
        status: { $in: ["ongoing", "accepted"] },
      });

      if (validateBooking.length !== 0) {
        const rideAggregation = await RidebookingSchema.aggregate([
          {
            $match: {
              driverId: new mongoose.Types.ObjectId(driverID),
              status: { $in: ["ongoing", "accepted"] },
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

        console.log(false, "is-rider-free", "Sent To Client");

        return socket.emit("rider-free", {
          isWaiting: false,
          ride: rideAggregation,
        });
      }

      console.log(true, "is-rider-free", "Sent To Client");
      socket.emit("rider-free", { isWaiting: true, ride: null });
    } catch (error) {
      console.error("Error in is-rider-free:", error);
      socket.emit("error", { message: "Error checking rider status" });
    }
  });

  socket.on("find-rides", async ({ driverID, radiusInMeters }) => {
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

      const nearbyRides = await RidebookingSchema.aggregate([
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
                $centerSphere: [driverLocation, radiusInMiles / 3963.2], // Convert miles to radians (radius of the Earth in miles)
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
          console.log("sent to client", rides);
          socket.emit("rides-found", { data: rides });
        })
        .catch((err) => {
          console.error("Error finding nearby rides:", err);
        });
    } catch (error) {
      console.error("Error in find-rides:", error);
      socket.emit("error", { message: "Error finding rides" });
    }
  });

  socket.on("send-bid", async ({ bookingID }) => {
    console.log(bookingID, "Booking ID Recieved From Client");

    const findBid = await BidSchema.find({ RideBookingId: bookingID })
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
    socket.broadcast.to(bookingID).emit("get-bids", findBid);

    console.log(findBid, "Booking ID Sent To Client");
  });

  socket.on("start-ride", async ({ booking }) => {
    if (!booking) {
      socket.emit("error", { message: "Invalid request" });
      return;
    }

    socket.join(booking.driverId);

    const findRide = await RidebookingSchema.findById(booking._id);
    if (!findRide) {
      socket.emit("error", { message: "Ride not found" });
      return;
    }

    const rideAggregation = await RidebookingSchema.aggregate([
      {
        $match: { _id: new mongoose.Types.ObjectId(booking._id) },
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

    socket.broadcast.to(booking._id).emit("ride-started", rideAggregation[0]);
  });

  socket.on("location-tracking", async ({ bookingID, coordinates }) => {
    console.log(bookingID);
    console.log(coordinates);

    if (!bookingID || !coordinates) {
      socket.emit("error", { message: "Invalid request" });
      return;
    }

    const findRide = await RidebookingSchema.findById(bookingID);

    // console.log(findRide, "Ride")

    if (!findRide) {
      socket.emit("error", { message: "Ride not found" });
      return;
    }
    const findDriver = await Driver.findByIdAndUpdate(findRide.driverId, {
      location: {
        type: "Point",
        coordinates,
      },
    });
    if (!findDriver) {
      socket.emit("error", { message: "Driver not found" });
      return;
    }

    const rideAggregation = await RidebookingSchema.aggregate([
      {
        $match: {
          _id: new mongoose.Types.ObjectId(bookingID),
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

    // console.log(rideAggregation, "rideAggregation 11")
    // console.log(rideAggregation[0], "rideAggregation")

    socket.broadcast.to(bookingID).emit("driver-location", rideAggregation[0]);
  });
};

export { RideBooking };
