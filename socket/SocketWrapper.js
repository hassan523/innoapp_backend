import mongoose from "mongoose";
import Admin from "../models/Admin.js";
import ChatModel from "../models/ChatSchema.js";
import Cleaner from "../models/Cleaner.js";
import Driver from "../models/Driver.js";
import Inspector from "../models/Inspector.js";
import SuperAdmin from "../models/SuperAdmin.js";
import Teamlead from "../models/Teamlead.js";
import Users from "../models/Users.js";
import ConnectionSchema from "../models/ConnectionSchema.js";
import { ChatSocket } from "./ChatSocket.js";
import { RideBooking } from "./RideBooking.js";
import { ParcelBooking } from "./ParcelBooking.js";

let connectedUsers = {};
const SocketWrapper = (io) => {
  io.on("connection", (socket) => {
    const userID = socket.handshake.query.userID;
    console.log("Connected to socket.io");

    socket.on("setup", async (userID) => {
      if (connectedUsers[userID] && connectedUsers[userID] !== socket.id) {
        console.log(
          `User already connected with a different socket ID. Replacing socket ID for ${userID}.`
        );
      }

      socket.join(userID);
      connectedUsers[userID] = socket.id;

      await ChatModel.updateMany(
        {
          $or: [
            {
              senderID: userID,
            },
            {
              recieverID: userID,
            },
          ],
          status: ["sent"],
        },
        {
          status: ["delivered"],
        }
      );

      console.log(
        Object.keys(connectedUsers).map((item) => item),
        "Connected to socket.io"
      );

      socket.emit("connected", socket.id);
    });

    // Admin Location Socket
    socket.on("driver-location", async ({userID, coordinates}) => {
      console.log(userID, "driver-location 1")
      console.log(coordinates, "driver-location 2")
      const findDriver = await Driver.findById(userID);
      if (!findDriver) {
        socket.emit("error", { message: "driver not found" });
        return;
      }
      if (!Array.isArray(coordinates)) {
        socket.emit("error", { message: "Invalid Coordinate Structure" });
        return; 
      }
      if (coordinates.length < 2) {
        socket.emit("error", { message: "Invalid Coordinate Length" });
        return;
      }
      const updatedLocation = {
        type: "Point",
        coordinates: coordinates,
      }
      findDriver.location = updatedLocation
      await findDriver.save();
      console.log("driver's location updated successfully");
      socket.emit("driver-location-updated", updatedLocation);
    });

    // Chat Socket
    ChatSocket(io, socket);

    // RideBooking Socket
    RideBooking(io, socket);

    // Parcel Booking ID;
    ParcelBooking(io, socket);

    socket.on("manual-disconnect", (id) => {
      if (connectedUsers[id]) {
        delete connectedUsers[id];
      } else {
        console.log("User not found:", id);
      }
    });

    socket.on("disconnect", () => {
      if (connectedUsers[userID]) {
        delete connectedUsers[userID];
        console.log("User disconnected:", userID);
      } else {
        console.log(
          "UserID not found in connectedUsers on disconnect:",
          userID
        );
      }
      console.log(
        "Updated Connected Users after actual disconnect:",
        connectedUsers
      );
    });
  });
};

export { SocketWrapper, connectedUsers };
