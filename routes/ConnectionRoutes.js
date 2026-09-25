import express from "express";
import {
  HandleChat,
  handleGetChats,
  HandleGetConnections,
} from "../controller/ConnectionController.js";

const router = express.Router();

router.get("/:userOne/get-connections", HandleGetConnections);
router.post("/:senderID/send-messages/:recieverID/:connectionID", HandleChat);

router.get("/:connectionID/get-chats", handleGetChats);

export default router;
