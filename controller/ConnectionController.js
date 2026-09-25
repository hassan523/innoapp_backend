import mongoose from "mongoose";
import Admin from "../models/Admin.js";
import Cleaner from "../models/Cleaner.js";
import ConnectionSchema from "../models/ConnectionSchema.js";
import Driver from "../models/Driver.js";
import Inspector from "../models/Inspector.js";
import SuperAdmin from "../models/SuperAdmin.js";
import Teamlead from "../models/Teamlead.js";
import Users from "../models/Users.js";
import ChatSchema from "../models/ChatSchema.js";

const HandleGetConnections = async (req, res) => {
  try {
    const { userOne } = req.params;

    const findUserOne =
      (await SuperAdmin.findById(userOne)) ||
      (await Users.findById(userOne)) ||
      (await Admin.findById(userOne)) ||
      (await Teamlead.findById(userOne)) ||
      (await Cleaner.findById(userOne)) ||
      (await Inspector.findById(userOne)) ||
      (await Driver.findById(userOne));

    if (!findUserOne) {
      return res.status(404).json({ message: "User Not Found" });
    }

    const aggregation = [
      {
        $match: {
          $or: [
            { userOne: new mongoose.Types.ObjectId(userOne) },
            { userTwo: new mongoose.Types.ObjectId(userOne) },
          ],
        },
      },
      {
        $lookup: {
          from: "superadmins",
          localField: "userOne",
          foreignField: "_id",
          as: "userOneSuperAdminDetails",
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "userOne",
          foreignField: "_id",
          as: "userOneUserDetails",
        },
      },
      {
        $lookup: {
          from: "admins",
          localField: "userOne",
          foreignField: "_id",
          as: "userOneAdminDetails",
        },
      },
      {
        $lookup: {
          from: "teamleads",
          localField: "userOne",
          foreignField: "_id",
          as: "userOneTeamleadDetails",
        },
      },
      {
        $lookup: {
          from: "cleaners",
          localField: "userOne",
          foreignField: "_id",
          as: "userOneCleanerDetails",
        },
      },
      {
        $lookup: {
          from: "inspectors",
          localField: "userOne",
          foreignField: "_id",
          as: "userOneInspectorDetails",
        },
      },
      {
        $lookup: {
          from: "drivers",
          localField: "userOne",
          foreignField: "_id",
          as: "userOneDriverDetails",
        },
      },

      {
        $lookup: {
          from: "superadmins",
          localField: "userTwo",
          foreignField: "_id",
          as: "userTwoSuperAdminDetails",
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "userTwo",
          foreignField: "_id",
          as: "userTwoUserDetails",
        },
      },
      {
        $lookup: {
          from: "admins",
          localField: "userTwo",
          foreignField: "_id",
          as: "userTwoAdminDetails",
        },
      },
      {
        $lookup: {
          from: "teamleads",
          localField: "userTwo",
          foreignField: "_id",
          as: "userTwoTeamleadDetails",
        },
      },
      {
        $lookup: {
          from: "cleaners",
          localField: "userTwo",
          foreignField: "_id",
          as: "userTwoCleanerDetails",
        },
      },
      {
        $lookup: {
          from: "inspectors",
          localField: "userTwo",
          foreignField: "_id",
          as: "userTwoInspectorDetails",
        },
      },
      {
        $lookup: {
          from: "drivers",
          localField: "userTwo",
          foreignField: "_id",
          as: "userTwoDriverDetails",
        },
      },

      {
        $unwind: {
          path: "$userOneSuperAdminDetails",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $unwind: {
          path: "$userOneUserDetails",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $unwind: {
          path: "$userOneAdminDetails",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $unwind: {
          path: "$userOneTeamleadDetails",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $unwind: {
          path: "$userOneCleanerDetails",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $unwind: {
          path: "$userOneInspectorDetails",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $unwind: {
          path: "$userOneDriverDetails",
          preserveNullAndEmptyArrays: true,
        },
      },

      {
        $unwind: {
          path: "$userTwoSuperAdminDetails",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $unwind: {
          path: "$userTwoUserDetails",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $unwind: {
          path: "$userTwoAdminDetails",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $unwind: {
          path: "$userTwoTeamleadDetails",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $unwind: {
          path: "$userTwoCleanerDetails",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $unwind: {
          path: "$userTwoInspectorDetails",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $unwind: {
          path: "$userTwoDriverDetails",
          preserveNullAndEmptyArrays: true,
        },
      },

      {
        $project: {
          _id: 1,
          userOne: {
            _id: {
              $ifNull: [
                "$userOneSuperAdminDetails._id",
                {
                  $ifNull: [
                    "$userOneUserDetails._id",
                    {
                      $ifNull: [
                        "$userOneAdminDetails._id",
                        {
                          $ifNull: [
                            "$userOneTeamleadDetails._id",
                            {
                              $ifNull: [
                                "$userOneCleanerDetails._id",
                                {
                                  $ifNull: [
                                    "$userOneInspectorDetails._id",
                                    "$userOneDriverDetails._id",
                                  ],
                                },
                              ],
                            },
                          ],
                        },
                      ],
                    },
                  ],
                },
              ],
            },
            name: {
              $ifNull: [
                "$userOneSuperAdminDetails.name",
                {
                  $ifNull: [
                    "$userOneUserDetails.name",
                    {
                      $ifNull: [
                        "$userOneAdminDetails.name",
                        {
                          $ifNull: [
                            "$userOneTeamleadDetails.name",
                            {
                              $ifNull: [
                                "$userOneCleanerDetails.name",
                                {
                                  $ifNull: [
                                    "$userOneInspectorDetails.name",
                                    "$userOneDriverDetails.name",
                                  ],
                                },
                              ],
                            },
                          ],
                        },
                      ],
                    },
                  ],
                },
              ],
            },
            email: {
              $ifNull: [
                "$userOneSuperAdminDetails.email",
                {
                  $ifNull: [
                    "$userOneUserDetails.email",
                    {
                      $ifNull: [
                        "$userOneAdminDetails.email",
                        {
                          $ifNull: [
                            "$userOneTeamleadDetails.email",
                            {
                              $ifNull: [
                                "$userOneCleanerDetails.email",
                                {
                                  $ifNull: [
                                    "$userOneInspectorDetails.email",
                                    "$userOneDriverDetails.email",
                                  ],
                                },
                              ],
                            },
                          ],
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          },
          userTwo: {
            _id: {
              $ifNull: [
                "$userTwoSuperAdminDetails._id",
                {
                  $ifNull: [
                    "$userTwoUserDetails._id",
                    {
                      $ifNull: [
                        "$userTwoAdminDetails._id",
                        {
                          $ifNull: [
                            "$userTwoTeamleadDetails._id",
                            {
                              $ifNull: [
                                "$userTwoCleanerDetails._id",
                                {
                                  $ifNull: [
                                    "$userTwoInspectorDetails._id",
                                    "$userTwoDriverDetails._id",
                                  ],
                                },
                              ],
                            },
                          ],
                        },
                      ],
                    },
                  ],
                },
              ],
            },
            name: {
              $ifNull: [
                "$userTwoSuperAdminDetails.name",
                {
                  $ifNull: [
                    "$userTwoUserDetails.name",
                    {
                      $ifNull: [
                        "$userTwoAdminDetails.name",
                        {
                          $ifNull: [
                            "$userTwoTeamleadDetails.name",
                            {
                              $ifNull: [
                                "$userTwoCleanerDetails.name",
                                {
                                  $ifNull: [
                                    "$userTwoInspectorDetails.name",
                                    "$userTwoDriverDetails.name",
                                  ],
                                },
                              ],
                            },
                          ],
                        },
                      ],
                    },
                  ],
                },
              ],
            },
            email: {
              $ifNull: [
                "$userTwoSuperAdminDetails.email",
                {
                  $ifNull: [
                    "$userTwoUserDetails.email",
                    {
                      $ifNull: [
                        "$userTwoAdminDetails.email",
                        {
                          $ifNull: [
                            "$userTwoTeamleadDetails.email",
                            {
                              $ifNull: [
                                "$userTwoCleanerDetails.email",
                                {
                                  $ifNull: [
                                    "$userTwoInspectorDetails.email",
                                    "$userTwoDriverDetails.email",
                                  ],
                                },
                              ],
                            },
                          ],
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          },
        },
      },
    ];

    const connections = await ConnectionSchema.aggregate(aggregation);
    return res.status(200).json(connections);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

const HandleChat = async (req, res) => {
  try {
    const { senderID, recieverID, connectionID } = req.params;
    const { message } = req.body;

    const findSender =
      (await Users.findById(senderID)) ||
      (await Admin.findById(senderID)) ||
      (await SuperAdmin.findById(senderID)) ||
      (await Teamlead.findById(senderID)) ||
      (await Cleaner.findById(senderID)) ||
      (await Inspector.findById(senderID)) ||
      (await Driver.findById(senderID));

    if (!findSender) {
      return res.status(404).json({ message: "User Not Found 1" });
    }

    const findReciever =
      (await Users.findById(senderID)) ||
      (await Admin.findById(senderID)) ||
      (await SuperAdmin.findById(senderID)) ||
      (await Teamlead.findById(senderID)) ||
      (await Cleaner.findById(senderID)) ||
      (await Inspector.findById(senderID)) ||
      (await Driver.findById(senderID));

    if (!findReciever) {
      return res.status(404).json({ message: "User Not Found 2" });
    }

    const validateConnection = await ConnectionSchema.findById(connectionID);

    if (!validateConnection) {
      return res.status(404).json({ message: "Connection Not Found" });
    }

    if (
      (validateConnection.userOne.toString() !== senderID ||
        validateConnection.userTwo.toString() !== recieverID) &&
      (validateConnection.userOne.toString() !== recieverID ||
        validateConnection.userTwo.toString() !== senderID)
    ) {
      return res.status(400).json({ message: "Invalid Request" });
    }

    const sendMessage = new ChatSchema({
      senderID: senderID,
      recieverID: recieverID,
      connectionID: connectionID,
      message: message,
    });
    await sendMessage.save();
    res.status(200).json({ message: "Message Sent ", chat: sendMessage });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const handleGetChats = async (req, res) => {
  try {
    const { connectionID } = req.params;

    const validateConnection = await ConnectionSchema.findById(connectionID);
    if (!validateConnection) {
      return res.status(404).json({ message: "Connection Not Found" });
    }

    const pipeline = [
      {
        $match: { connectionID: new mongoose.Types.ObjectId(connectionID) },
      },
    ];
    const chatAggregator = await ChatSchema.aggregate(pipeline);
    res.status(200).json({ chatList: chatAggregator });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export { HandleGetConnections, HandleChat, handleGetChats };
