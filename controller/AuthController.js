import { v2 as cloudinary } from "cloudinary";
import SuperAdmin from "../models/SuperAdmin.js";
import Admin from "../models/Admin.js";
import Driver from "../models/Driver.js";
import Teamlead from "../models/Teamlead.js";
import Inspector from "../models/Inspector.js";
import Cleaner from "../models/Cleaner.js";
import Users from "../models/Users.js";
import HandlePostNotification from "../utils/Notify.js";
import VehicleAsingment from "../models/VehicleAsingment.js";
import Vehicles from "../models/Vehicles.js";
import Notifications from "../models/Notifications.js";
import VehicleCategorySchema from "../models/VehicleCategorySchema.js";
import RateListSchema from "../models/RateListSchema.js";
import mongoose from "mongoose";
import RidebookingSchema from "../models/RidebookingSchema.js";
import RatingReviewSchema from "../models/RatingReviewSchema.js";
import PlanSchema from "../models/PlanSchema.js";
import ConnectionSchema from "../models/ConnectionSchema.js";
import autoMailer from "../utils/AutoMailer.js";
import stripe from "../utils/StripeConfig.js";

const CreateSupperAdmin = async (req, res) => {
  try {
    const { email, name, password, phone } = req.body;

    // Featured image block
    const imgUrl = req?.files?.profileImg;
    const uploadResult = imgUrl
      ? await cloudinary.uploader.upload(imgUrl.tempFilePath, {
          resource_type: "image",
          folder: "user-profiles",
        })
      : {};

    const restrictCreation = await SuperAdmin.find();

    const existingUser = await Promise.all([
      SuperAdmin.findOne({ email }),
      Admin.findOne({ email }),
      Teamlead.findOne({ email }),
      Driver.findOne({ email }),
      Cleaner.findOne({ email }),
      Users.findOne({ email }),
      Inspector.findOne({ email }),
    ]).then((results) => results.find((user) => user !== null));

    if (existingUser) {
      return res.status(400).json({ message: "Email already exists" });
    }

    if (restrictCreation.length === 1) {
      return res.status(400).json({
        message: "Invalid Request, There Can Only Be One Super Admin !",
      });
    }

    const create_Supper_Admin = new SuperAdmin({
      email,
      name,
      phone,
      profileImage: uploadResult.secure_url,
      password,
    });
    await create_Supper_Admin.save();
    return res.status(200).json({
      message: "Supper Admin Created Successfully!",
      create_Supper_Admin,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal Server Error!" });
  }
};

const CreateAdmin = async (req, res) => {
  try {
    const { email, name, phone, password, companyName, address, cordinates } =
      req.body;

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

    const imgUrl = req?.files?.profileImg;

    const uploadResult = imgUrl
      ? await cloudinary.uploader.upload(imgUrl.tempFilePath, {
          resource_type: "image",
          folder: `category`,
        })
      : "";

    const findAdmin = await Admin.findOne({ email });

    const existingUser = await Promise.all([
      SuperAdmin.findOne({ email }),
      Admin.findOne({ email, companyName }),
      Teamlead.findOne({ email }),
      Driver.findOne({ email }),
      Cleaner.findOne({ email }),
      Users.findOne({ email }),
      Inspector.findOne({ email }),
    ]).then((results) => results.find((user) => user !== null));

    if (existingUser) {
      return res.status(400).json({ message: "Email already exists" });
    }
    if (findAdmin) {
      return res
        .status(401)
        .json({ message: "User with this Email Already Found!" });
    } else {
      const findSupperAdmin = await SuperAdmin.find();

      if (findSupperAdmin.length === 0) {
        return res.status(400).json({ message: "Invalid Request" });
      }

      const superAdminID = findSupperAdmin[0]._id;

      const create_Admin = new Admin({
        superAdminId: superAdminID,
        companyName,
        email,
        name,
        phone,
        password,
        address,
        cordinates,
        profileImage: uploadResult.secure_url,
        otp,
        otpExpiry,
      });
      await create_Admin.save();

      autoMailer({
        to: email,
        subject: "OTP VERIFICATION",
        message: `OTP: ${otp}`,
      });

      // Creating Connection Between Admin And SuperAdmin For Chat
      const createConnection = new ConnectionSchema({
        userOne: superAdminID,
        userTwo: create_Admin._id,
      });
      await createConnection.save();

      //notifications Module
      const Notification = HandlePostNotification({
        SupperAdminId: superAdminID,
        message: `${create_Admin.companyName} Has Registered Successfully`,
        notiftype: "Auth",
      });

      const Notification2 = HandlePostNotification({
        AdminId: create_Admin._id,
        message: `You are Registered Successfully`,
        notiftype: "Auth",
      });

      res.status(200).json({
        message: "Admin Created Successfully!",
        create_Admin,
      });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Intrnal Server Error!" });
  }
};

const createDriver = async (req, res) => {
  try {
    const { email, name, phone, password, longitude, latitude } = req.body;
    const { AdminId } = req.params;

    const findAdmin = await Admin.findById(AdminId);

    const findDriver = await Driver.findOne({ email });

    const existingUser = await Promise.all([
      SuperAdmin.findOne({ email }),
      Admin.findOne({ email }),
      Teamlead.findOne({ email }),
      Driver.findOne({ email }),
      Cleaner.findOne({ email }),
      Users.findOne({ email }),
      Inspector.findOne({ email }),
    ]).then((results) => results.find((user) => user !== null));

    if (existingUser) {
      return res.status(400).json({ message: "Email already exists" });
    }

    if (!findAdmin) {
      return res.status(404).json({ message: "Invalid Id" });
    }
    if (findDriver) {
      return res
        .status(401)
        .json({ message: "User with this Email Already Exists!" });
    } else {
      const create_Driver = new Driver({
        AdminId,
        email,
        name,
        phone,
        password,
        location: {
          type: "Point",
          coordinates: [longitude || 0, latitude || 0],
        },
      });
      await create_Driver.save();

      // Creating Connection Between Admin And Driver For Chat
      const createConnection = new ConnectionSchema({
        userOne: AdminId,
        userTwo: create_Driver._id,
      });
      await createConnection.save();

      await HandlePostNotification({
        AdminId: findAdmin._id,
        message: `You Created The Driver with this email ${create_Driver.email} Successfully!`,
        notiftype: "Auth",
      });

      await HandlePostNotification({
        DriverId: create_Driver._id,
        message: `You are Assigned as Driver in this ${findAdmin.companyName} by ${findAdmin.name} Admin`,
        notiftype: "Auth",
      });

      return res.status(200).json({
        message: "Driver Created Successfully!",
        create_Driver,
      });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal Server Error!" });
  }
};

const createTeamLead = async (req, res) => {
  try {
    const { email, name, phone, password } = req.body;
    const { AdminId } = req.params;

    const findAdmin = await Admin.findById(AdminId);

    const findTeamLead = await Teamlead.findOne({ email: email });

    const existingUser = await Promise.all([
      SuperAdmin.findOne({ email }),
      Admin.findOne({ email }),
      Teamlead.findOne({ email }),
      Driver.findOne({ email }),
      Cleaner.findOne({ email }),
      Users.findOne({ email }),
      Inspector.findOne({ email }),
    ]).then((results) => results.find((user) => user !== null));

    if (existingUser) {
      return res.status(400).json({ message: "Email already exists" });
    }

    if (!findAdmin) {
      return res.status(404).json({ message: "Invalid Id" });
    }
    if (findTeamLead) {
      return res
        .status(401)
        .json({ message: "User with this Email Already Exists!" });
    } else {
      const create_TeamLead = new Teamlead({
        AdminId,
        email,
        name,
        phone,
        password,
      });
      await create_TeamLead.save();

      // Creating Connection Between Admin And TeamLead For Chat
      const createConnection = new ConnectionSchema({
        userOne: AdminId,
        userTwo: create_TeamLead._id,
      });
      await createConnection.save();

      const Notification = HandlePostNotification({
        AdminId: findAdmin._id,
        message: `You Created The Team Lead with this email ${create_TeamLead.email} Successfully!`,
        notiftype: "Auth",
      });

      const Notification2 = HandlePostNotification({
        TeamLeadId: create_TeamLead._id,
        message: `You are Assigned as Team Lead in this ${findAdmin.companyName} by ${findAdmin.name} Admin`,
        notiftype: "Auth",
      });

      return res.status(200).json({
        message: "TeamLead Created Successfully!",
        create_TeamLead,
      });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Intrnal Server Error!" });
  }
};

const createCleaner = async (req, res) => {
  try {
    const { email, name, phone, password } = req.body;
    const { AdminId, TeamleadId } = req.params;

    const findAdmin = await Admin.findById(AdminId);
    const findTeamLead = await Teamlead.findById(TeamleadId);

    const findCleaner = await Admin.findOne({ email: email });

    const existingUser = await Promise.all([
      SuperAdmin.findOne({ email }),
      Admin.findOne({ email }),
      Teamlead.findOne({ email }),
      Driver.findOne({ email }),
      Cleaner.findOne({ email }),
      Users.findOne({ email }),
      Inspector.findOne({ email }),
    ]).then((results) => results.find((user) => user !== null));

    if (existingUser) {
      return res.status(400).json({ message: "Email already exists" });
    }

    if (!findAdmin) {
      return res.status(404).json({ message: "Invalid Admin Id" });
    }
    if (!findTeamLead) {
      return res.status(404).json({ message: "Invalid TeamLead Id" });
    }
    if (findCleaner) {
      return res
        .status(401)
        .json({ message: "User with this Email Already Exists!" });
    } else {
      const create_cleaner = new Cleaner({
        AdminId,
        TeamleadId,
        email,
        name,
        phone,
        password,
      });
      await create_cleaner.save();

      // Creating Connection Between Admin And Cleaners For Chat
      const ConnectionWithAdmin = new ConnectionSchema({
        userOne: AdminId,
        userTwo: create_cleaner._id,
      });
      await ConnectionWithAdmin.save();

      // Creating Connection Between TeamLead And Cleaners For Chat
      const ConnectionWithTeamLead = new ConnectionSchema({
        userOne: TeamleadId,
        userTwo: create_cleaner._id,
      });
      await ConnectionWithTeamLead.save();

      const NotificationforAdmin = HandlePostNotification({
        AdminId: findAdmin._id,
        message: `Your Team Lead ${findTeamLead.name} created cleaner ${create_cleaner.name} successfully! `,
        notiftype: "Auth",
      });

      const NotificationforTeamLead = HandlePostNotification({
        TeamLeadId: findTeamLead._id,
        message: `You Created ${findTeamLead.name} as Cleaner Successfully!`,
        notiftype: "Auth",
      });

      const NotificationforCleaner = HandlePostNotification({
        CleanerId: create_cleaner._id,
        message: `You are created by ${findTeamLead.name} sucessfully!`,
        notiftype: "Auth",
      });

      return res.status(200).json({
        message: "Cleaner Created Successfully!",
        create_cleaner,
      });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Intrnal Server Error!" });
  }
};

const createInspector = async (req, res) => {
  try {
    const { email, name, phone, password } = req.body;
    const { AdminId, TeamleadId } = req.params;

    const findAdmin = await Admin.findById(AdminId);
    const findTeamLead = await Teamlead.findById(TeamleadId);

    const findInspector = await Inspector.findOne({ email: email });

    const existingUser = await Promise.all([
      SuperAdmin.findOne({ email }),
      Admin.findOne({ email }),
      Teamlead.findOne({ email }),
      Driver.findOne({ email }),
      Cleaner.findOne({ email }),
      Users.findOne({ email }),
      Inspector.findOne({ email }),
    ]).then((results) => results.find((user) => user !== null));

    if (existingUser) {
      return res.status(400).json({ message: "Email already exists" });
    }

    if (!findAdmin) {
      return res.status(404).json({ message: "Invalid Admin Id" });
    }
    if (!findTeamLead) {
      return res.status(404).json({ message: "Invalid Team Lead Id" });
    }
    if (findInspector) {
      return res
        .status(401)
        .json({ message: "User with this Email Already Exists!" });
    } else {
      const create_inspector = new Inspector({
        AdminId,
        TeamleadId,
        email,
        name,
        phone,
        password,
      });
      await create_inspector.save();

      // Creating Connection Between Admin And Inspector For Chat
      const ConnectionWithAdmin = new ConnectionSchema({
        userOne: AdminId,
        userTwo: create_inspector._id,
      });
      await ConnectionWithAdmin.save();

      // Creating Connection Between TeamLead And Inspector For Chat
      const ConnectionWithTeamLead = new ConnectionSchema({
        userOne: TeamleadId,
        userTwo: create_inspector._id,
      });
      await ConnectionWithTeamLead.save();

      const NotificationforAdmin = HandlePostNotification({
        AdminId: findAdmin._id,
        message: `Your Team Lead ${findTeamLead.name} created cleaner ${create_inspector.name} successfully! `,
        notiftype: "Auth",
      });

      const NotificationforTeamLead = HandlePostNotification({
        TeamLeadId: findTeamLead._id,
        message: `You Created ${findTeamLead.name} as Cleaner Successfully!`,
        notiftype: "Auth",
      });

      const NotificationforCleaner = HandlePostNotification({
        CleanerId: create_inspector._id,
        message: `You are created by ${findTeamLead.name} sucessfully!`,
        notiftype: "Auth",
      });

      return res.status(200).json({
        message: "Inspector Created Successfully!",
        create_inspector,
      });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal Server Error!" });
  }
};

const CreateUser = async (req, res) => {
  try {
    const { email, name, password, phone, tokenID } = req.body;
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

    console.log(tokenID);

    const existingUser = await Promise.all([
      SuperAdmin.findOne({ email }),
      Admin.findOne({ email }),
      Teamlead.findOne({ email }),
      Driver.findOne({ email }),
      Cleaner.findOne({ email }),
      Users.findOne({ email }),
      Inspector.findOne({ email }),
    ]).then((results) => results.find((user) => user !== null));

    console.log(existingUser);

    if (existingUser) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const create_User = new Users({
      email,
      name,
      phone,
      password,
      otp,
      otpExpiry,
      location: {
        type: "Point",
        coordinates: [0, 0],
      },
    });

    await create_User.save();

    const customer = await stripe.customers.create({
      name: name,
      email: email,
    });

    const paymentMethod = await stripe.paymentMethods.create({
      type: "card",
      card: { token: tokenID },
    });

    const attachPaymentMethod = await stripe.paymentMethods.attach(
      paymentMethod.id,
      {
        customer: customer.id,
      }
    );

    await stripe.customers.update(customer.id, {
      invoice_settings: {
        default_payment_method: paymentMethod.id,
      },
    });

    const findUser = await Users.findById(create_User._id);
    findUser.customerID = customer.id;
    findUser.paymentMethodID = paymentMethod.id;
    await findUser.save();

    const Notification = HandlePostNotification({
      CleanerId: create_User._id,
      message: `Welcome Onboard!`,
      notiftype: "Auth",
    });

    return res.status(200).json({
      message: "User Created Successfully!",
      create_User,
    });
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

const VerifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const user =
      (await Users.findOne({ email })) || (await Admin.findOne({ email }));

    if (user.isVerified === true) {
      return res.status(200).json({ message: "You are already Verified!" });
    }
    if (!user) {
      return res.status(404).json({ message: "User not found!" });
    }
    if (user.otp.toString() !== otp) {
      return res.status(400).json({ message: "Invalid OTP!" });
    }
    if (new Date() > user.otpExpiry) {
      return res.status(400).json({ message: "OTP has expired!" });
    }

    user.otp = null;
    user.otpExpiry = null;
    user.isVerified = true;
    await user.save();

    if (user.role.includes("Admin")) {
      if (user.InvoiceId !== null) {
        const findSubscription = await PlanSchema.findOne({
          AdminId: Token._id,
        });
        if (!findSubscription) {
          return res
            .status(404)
            .json({ message: "Invalid Subscription ID Provided" });
        }
        const adminToken = {
          ...user.toObject(),
          subscribedPlan: findSubscription.subscribedPlan.toString(),
        };

        return res
          .status(200)
          .json({ message: "OTP verified successfully!", Token: adminToken });
      }

      return res
        .status(200)
        .json({ message: "OTP verified successfully!", Token: user });
    } else {
      res
        .status(200)
        .json({ message: "OTP verified successfully!", Token: user });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal Server Error!" });
  }
};

const ResendOTP = async (req, res) => {
  try {
    const { email } = req.body;

    // Find the user by email
    const user =
      (await Users.findOne({ email })) || (await Admin.findOne({ email }));

    if (!user) {
      return res.status(404).json({ message: "User not found!" });
    }

    // Generate a new 6-digit OTP
    const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // OTP expires in 10 minutes

    // Update user OTP and expiry time
    user.otp = newOtp;
    user.otpExpiry = otpExpiry;
    await user.save();

    // Simulate sending OTP (replace this with actual email/SMS service)
    console.log(`Resent OTP to ${email}: ${newOtp}`);

    return res.status(200).json({ message: "OTP resent successfully!" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error!" });
  }
};

const Login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const findUser =
      (await SuperAdmin.findOne({ email })) ||
      (await Admin.findOne({ email })) ||
      (await Teamlead.findOne({ email })) ||
      (await Driver.findOne({ email })) ||
      (await Cleaner.findOne({ email })) ||
      (await Inspector.findOne({ email })) ||
      (await Users.findOne({ email }));

    if (!findUser) {
      return res
        .status(404)
        .json({ message: "No User Found With This Email!" });
    }
    if (findUser.password.toString() !== password) {
      return res.status(400).json({ message: "Invalid Email or Password!" });
    }
    if (findUser.IsActive === false || findUser.IsActive === undefined) {
      return res.status(404).json({
        message: "Your account has been disabled, Please contact your owner!",
      });
    }
    if (findUser.role.includes("Users")) {
      if (findUser.isVerified === false) {
        return res.status(300).json({
          message: "Your Account is Not Verfied! Pelase Verify It First!",
        });
      }
    }
    if (findUser.role.includes("Admin")) {
      const checkExpiry = findUser.populate({
        path: "InvoiceId",
        model: "plan",
      });
      if (
        checkExpiry.expirydate === Date.now() ||
        checkExpiry.expirydate <= Date.now()
      ) {
        findUser.IsActive = false;
        findUser.save();
        return req
          .status(300)
          .json({ message: "Your Subscription has been Expired" });
      }
      // if(findUser.kycVerification === "Pending"){
      //   return res.status(400)
      // }
    }
    const Token =
      (await SuperAdmin.findById(findUser._id).select("-password")) ||
      (await Admin.findById(findUser._id).select("-password").populate({
        path: "InvoiceId",
        model: "plan",
        // select: "",
      })) ||
      (await Teamlead.findById(findUser._id).select("-password")) ||
      (await Driver.findById(findUser._id).select("-password").populate({
        path: "AdminId",
        model: "Admin",
        select: "-password",
      })) ||
      (await Cleaner.findById(findUser._id).select("-password").populate({
        path: "AdminId",
        model: "Admin",
        select: "-password",
      })) ||
      (await Inspector.findById(findUser._id).select("-password").populate({
        path: "AdminId",
        model: "Admin",
        select: "-password",
      })) ||
      (await Users.findById(findUser._id).select("-password"));

    if (Token.role.includes("Admin")) {
      if (!Token.isVerified) {
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
        Token.otp = otp;
        Token.otpExpiry = otpExpiry;
        Token.kycVerification;
        await Token.save();
      }

      if (Token.InvoiceId !== null) {
        const findSubscription = await PlanSchema.findOne({
          AdminId: Token._id,
        });

        if (!findSubscription) {
          return res
            .status(404)
            .json({ message: "Invalid Subscription ID Provided" });
        }

        const subscriptionData = findSubscription.toObject();

        const filterArr = [
          "TeamLeadQuantity",
          "DriverQuantity",
          "InspectorQuantity",
          "CleanerQuantity",
          "InspectionReportQuantity",
          "CleaningReportQuantity",
          "VehicleQuantity",
          "RideFeture",
          "ParcelDeliveryFeature",
        ];

        // Filter and modify only the specified fields
        filterArr.forEach((field) => {
          if (
            subscriptionData[field] === "0" ||
            subscriptionData[field] === "false"
          ) {
            subscriptionData[field] = false;
          } else if (subscriptionData[field]) {
            subscriptionData[field] = true;
          }
        });

        const adminToken = {
          ...Token.toObject(),
          subscribedPlan: findSubscription.subscriptionId.toString(),
          planDetails: subscriptionData,
        };

        return res
          .status(200)
          .json({ message: "Logged in Successfully!", Token: adminToken });
      }

      return res
        .status(200)
        .json({ message: "Logged in Successfully!", Token });
    } else if (Token.role.includes("Teamlead")) {
      const findAdmin = await Admin.findById(Token.AdminId);
      if (findAdmin.InvoiceId !== null) {
        const findSubscription = await PlanSchema.findOne({
          AdminId: Token.AdminId,
        });

        if (!findSubscription) {
          return res
            .status(404)
            .json({ message: "Invalid Subscription ID Provided" });
        }

        const subscriptionData = findSubscription.toObject();

        const filterArr = [
          "TeamLeadQuantity",
          "DriverQuantity",
          "InspectorQuantity",
          "CleanerQuantity",
          "InspectionReportQuantity",
          "CleaningReportQuantity",
          "VehicleQuantity",
          "RideFeture",
          "ParcelDeliveryFeature",
        ];

        // Filter and modify only the specified fields
        filterArr.forEach((field) => {
          if (
            subscriptionData[field] === "0" ||
            subscriptionData[field] === "false"
          ) {
            subscriptionData[field] = false;
          } else if (subscriptionData[field]) {
            subscriptionData[field] = true;
          }
        });

        const adminToken = {
          ...Token.toObject(),
          subscribedPlan: findSubscription.subscriptionId.toString(),
          planDetails: subscriptionData,
        };

        return res
          .status(200)
          .json({ message: "Logged in Successfully!", Token: adminToken });
      }
    } else {
      res.status(200).json({ message: "Logged in Successfully!", Token });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal Server Error!" });
  }
};

const IsActive = async (req, res) => {
  try {
    const { SuperAdminId } = req.params;
    const { IsActive, userId } = req.body;

    const findSupperAdmin = await SuperAdmin.findById(SuperAdminId);

    if (!findSupperAdmin.role.includes("SuperAdmin")) {
      return res.status(401).json({ message: "Forbiden" });
    } else {
      const findUser =
        (await Admin.findById(userId)) ||
        (await Teamlead.findById(userId)) ||
        (await Driver.findById(userId)) ||
        (await Cleaner.findById(userId)) ||
        (await Inspector.findById(userId));

      if (!findUser) {
        return res
          .status(404)
          .json({ message: "No User Found With This Email!" });
      } else {
        findUser.IsActive = IsActive;
        findUser.save();
        res
          .status(200)
          .json({ message: `Status Has been Updated to ${IsActive}` });
      }
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal Server Error!" });
  }
};

const UpdateUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const { name, phone, password, address, cordinates } = req.body;

    // Featured image block
    const imgUrl = req?.files?.profileImg;
    const uploadResult = imgUrl
      ? await cloudinary.uploader.upload(imgUrl.tempFilePath, {
          resource_type: "image",
          folder: "user-profiles",
        })
      : {};

    const findUser =
      (await Admin.findById(userId)) ||
      (await Teamlead.findById(userId)) ||
      (await Driver.findById(userId)) ||
      (await Cleaner.findById(userId)) ||
      (await Users.findById(userId)) ||
      (await Inspector.findById(userId));

    if (!findUser) {
      return res.status(404).json({ message: "User Not Found!" });
    } else {
      findUser.name = name || findUser.name;
      findUser.phone = phone || findUser.phone;
      findUser.password = password || findUser.password;
      findUser.profileImage = uploadResult.secure_url || findUser.profileImage;
      findUser.address = address || findUser.address;
      findUser.cordinates =
        typeof cordinates === "string"
          ? JSON.parse(cordinates)
          : cordinates || findUser.cordinates;

      findUser.save();

      const Token =
        (await SuperAdmin.findById(findUser._id).select("-password")) ||
        (await Admin.findById(findUser._id).select("-password").populate({
          path: "InvoiceId",
          model: "plan",
          // select: "",
        })) ||
        (await Teamlead.findById(findUser._id).select("-password")) ||
        (await Driver.findById(findUser._id).select("-password").populate({
          path: "AdminId",
          model: "Admin",
          select: "-password",
        })) ||
        (await Cleaner.findById(findUser._id).select("-password").populate({
          path: "AdminId",
          model: "Admin",
          select: "-password",
        })) ||
        (await Inspector.findById(findUser._id).select("-password").populate({
          path: "AdminId",
          model: "Admin",
          select: "-password",
        })) ||
        (await Users.findById(findUser._id).select("-password"));

      if (Token.role.includes("Admin")) {
        if (!Token.isVerified) {
          const otp = Math.floor(100000 + Math.random() * 900000).toString();
          const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
          Token.otp = otp;
          Token.otpExpiry = otpExpiry;
          await Token.save();
        }

        if (Token.InvoiceId !== null) {
          const findSubscription = await PlanSchema.findOne({
            AdminId: Token._id,
          });
          if (!findSubscription) {
            return res
              .status(404)
              .json({ message: "Invalid Subscription ID Provided" });
          }
          const adminToken = {
            ...Token.toObject(),
            subscribedPlan: findSubscription.subscriptionId.toString(),
            planDetails: findSubscription.toObject(),
          };

          return res
            .status(200)
            .json({ message: "Logged in Successfully!", Token: adminToken });
        }

        return res
          .status(200)
          .json({ message: "User Updated Successfully!", Token });
      } else {
        res.status(200).json({ message: "User Updated Successfully!", Token });
      }
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal Server Error!" });
  }
};

const getProfile = async (req, res) => {
  try {
    const { userId } = req.params;

    const findUser =
      (await SuperAdmin.findById(userId)) ||
      (await Admin.findById(userId)) ||
      (await Teamlead.findById(userId).populate({
        path: "AdminId",
        model: "Admin",
        select: "-password",
      })) ||
      (await Driver.findById(userId).populate({
        path: "AdminId",
        model: "Admin",
        select: "-password",
      })) ||
      (await Cleaner.findById(userId).populate({
        path: "AdminId",
        model: "Admin",
        select: "-password",
      })) ||
      (await Users.findById(userId)) ||
      (await Inspector.findById(userId).populate({
        path: "AdminId",
        model: "Admin",
        select: "-password",
      }));

    if (!findUser) {
      return res.status(404).json({ message: "User Not Found" });
    } else {
      if (findUser.role.includes("Driver") && findUser.carAssingned === true) {
        const findAssingment = await VehicleAsingment.findOne({
          DriverId: findUser._id,
        });
        if (findAssingment) {
          const findVehicle = await Vehicles.findOne({
            vin: findAssingment.VinNumber,
          });

          return res.status(200).json({
            message: "Profile data!",
            findUser,
            findVehicle,
            findAssingment,
          });
        } else {
          return res.status(200).json({
            message: "Profile data!",
            findUser,
            findVehicle: null,
            findAssingment: null,
          });
        }
      }

      return res.status(200).json({ message: "Profile data!", findUser });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal Server Error!" });
  }
};

const getAdmins = async (req, res) => {
  try {
    const allAdmins = await Admin.find();

    return res.status(200).json({ message: "All Admins", allAdmins });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal Server Error!" });
  }
};

const getDriversofRentalCompany = async (req, res) => {
  try {
    const { AdminId } = req.params;

    // Find the admin by ID
    const findAdmin = await Admin.findById(AdminId);

    if (!findAdmin) {
      return res.status(404).json({ message: "Admin Not Found!" });
    }

    // Find the drivers assigned to this admin
    const findDrivers = await Driver.find({ AdminId: findAdmin._id });

    if (findDrivers.length === 0) {
      return res
        .status(400)
        .json({ message: "No drivers with assigned cars!" });
    }

    // Fetch vehicle assignments and populate driver and admin details
    const findAssignments = await VehicleAsingment.find({
      DriverId: { $in: findDrivers.map((driver) => driver._id) },
      Active: true,
    })
      .populate({
        path: "AdminId",
        model: "Admin",
        select: "-password",
      })
      .populate({
        path: "DriverId",
        model: "Driver",
        select: "-password",
      });

    // Fetch the vehicles based on VIN numbers from the assignments
    const vehicles = await Promise.all(
      findAssignments.map(async (assignment) => {
        const vehicle = await Vehicles.findOne({ vin: assignment.VinNumber });
        return vehicle;
      })
    );

    return res.status(200).json({
      message:
        "All rental company drivers and their vehicles fetched successfully!",
      drivers: findDrivers,
      vehicles: vehicles,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal Server Error!" });
  }
};

const getAllDrivers = async (req, res) => {
  try {
    const { SuperAdminId } = req.params;
    const findSuperAdmin = await SuperAdmin.findById(SuperAdminId);

    if (!findSuperAdmin) {
      return res.status(404).json({ message: "Admin Not Found!" });
    }

    const findDrivers = await Driver.find({ carAssingned: true });

    if (findDrivers.length === 0) {
      return res
        .status(400)
        .json({ message: "No drivers with assigned cars!" });
    }

    const findAssignments = await VehicleAsingment.find({
      DriverId: { $in: findDrivers.map((driver) => driver._id) },
      Active: true,
    })
      .populate({
        path: "AdminId",
        model: "Admin",
        select: "-password",
      })
      .populate({
        path: "DriverId",
        model: "Driver",
        select: "-password",
      });

    const enrichedAssignments = await Promise.all(
      findAssignments.map(async (assignment) => {
        const vehicle = await Vehicles.findOne({ vin: assignment.VinNumber });
        return {
          ...assignment.toObject(),
          vehicleDetails: vehicle || null,
        };
      })
    );

    return res.status(200).json({
      message:
        "All rental company drivers and their vehicles fetched successfully!",
      assignments: enrichedAssignments,
    });
  } catch (error) {
    console.error("Internal server error:", error);
    return res.status(500).json({ message: "Internal Server Error!" });
  }
};

const getTeamofRentalCompany = async (req, res) => {
  try {
    const { AdminId } = req.params;
    const findAdmin = await Admin.findById(AdminId);

    if (!findAdmin) {
      return res.status(404).json({ message: "Admin Not Found!" });
    } else {
      const findTeamLead = await Teamlead.find({ AdminId: findAdmin._id });

      return res
        .status(200)
        .json({ message: "All rental Company Team Lead!", findTeamLead });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal Server Error!" });
  }
};

const getInspectorsofRentalCompany = async (req, res) => {
  try {
    const { AdminId, TeamleadId } = req.params;
    const findAdmin = await Admin.findById(AdminId);
    const findTeamLead = await Teamlead.findById(TeamleadId);

    if (!findAdmin) {
      return res.status(404).json({ message: "Admin Not Found!" });
    }
    if (!findTeamLead) {
      return res.status(404).json({ message: "Team Lead Not Found!" });
    } else {
      const findInspector = await Inspector.find({ AdminId: findAdmin._id });

      return res
        .status(200)
        .json({ message: "All rental Company Inspectors!", findInspector });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal Server Error!" });
  }
};

const getCleanerofRentalCompany = async (req, res) => {
  try {
    const { AdminId, TeamleadId } = req.params;
    const findAdmin = await Admin.findById(AdminId);
    const findTeamLead = await Teamlead.findById(TeamleadId);
    if (!findAdmin) {
      return res.status(404).json({ message: "Admin Not Found!" });
    }
    if (!findTeamLead) {
      return res.status(404).json({ message: "Team Lead Not Found!" });
    } else {
      const findCleaner = await Cleaner.find({ AdminId: findAdmin._id });
      return res
        .status(200)
        .json({ message: "All rental Company Cleaner!", findCleaner });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal Server Error!" });
  }
};

const allRentalCompanyEmployees = async (req, res) => {
  try {
    const { AdminId, SuperAdminId } = req.params;
    const findAdmin = await Admin.findById(AdminId);
    if (!findAdmin) {
      return res.status(404).json({ message: "Admin Not Found!" });
    }
    const findInspector = await Inspector.find({ AdminId: findAdmin._id });
    const findCleaners = await Cleaner.find({ AdminId: findAdmin._id });
    const findTeamLead = await Teamlead.find({ AdminId: findAdmin._id });
    const findDriver = await Driver.find({ AdminId: findAdmin._id });

    return res.status(200).json({
      findInspector,
      findCleaners,
      findTeamLead,
      findDriver,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal Server Error!" });
  }
};

const getAllEmployees = async (req, res) => {
  try {
    const { AdminId } = req.params;

    // Find Admin
    const findAdmin = await Admin.findById(AdminId);
    if (!findAdmin) {
      return res.status(404).json({ message: "Admin Not Found!" });
    }

    // Fetch Employees by Category
    const findTeamLeads = await Teamlead.find({ AdminId: findAdmin._id });
    const findDrivers = await Driver.find({ AdminId: findAdmin._id });
    const findInspectors = await Inspector.find({ AdminId: findAdmin._id });
    const findCleaners = await Cleaner.find({ AdminId: findAdmin._id });

    // Combine and Structure Response
    const employees = {
      teamLeads: findTeamLeads,
      drivers: findDrivers,
      inspectors: findInspectors,
      cleaners: findCleaners,
    };

    return res.status(200).json({
      message: "Employees Retrieved Successfully!",
      data: employees,
    });
  } catch (error) {
    console.error("Error in getAllEmployees:", error);
    return res.status(500).json({ message: "Internal Server Error!" });
  }
};

const GetNotifications = async (req, res) => {
  try {
    const { Id } = req.params;

    const ANotifications = await Notifications.find({
      $or: [
        { SupperAdminId: Id },
        { AdminId: Id },
        { DriverId: Id },
        { TeamLeadId: Id },
        { InspectorId: Id },
        { CleanerId: Id },
        { userId: Id },
      ],
    });

    return res
      .status(200)
      .json({ messsage: "All Notifications", ANotifications });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal Server Error!" });
  }
};

const GetCordinatesDriver = async (req, res) => {
  try {
    const { DriverId } = req.params;
    const { latitude, longitude } = req.body;

    const findDriver = await Driver.findById(DriverId);

    if (!findDriver) {
      return res.status(404).json({ message: "Driver Not Found" });
    }

    (findDriver.cordinates.latitude =
      latitude || findDriver.cordinates.latitude),
      (findDriver.cordinates.longitude =
        longitude || findDriver.cordinates.longitude);

    findDriver.location.type = "Point";
    findDriver.location.coordinates = [longitude, latitude];

    await findDriver.save();

    return res.status(200).json({ message: "Driver Location Updated" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal Server Error!" });
  }
};

const GetCordinatesUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { latitude, longitude } = req.body;

    const findUser = await Users.findById(userId);

    if (!findUser) {
      return res.status(404).json({ message: "Driver Not Found" });
    }
    (findUser.cordinates.latitude = latitude || findUser.cordinates.latitude),
      (findUser.cordinates.longitude =
        longitude || findUser.cordinates.longitude);

    findUser.location.type = "Point";
    findUser.location.coordinates = [longitude, latitude];

    await findUser.save();

    return res.status(200).json({ message: "User Location Updated" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal Server Error!" });
  }
};

const CreateRateListForAdmin = async (req, res) => {
  try {
    const { AdminId, categoryID } = req.params;

    const findAdmin = await Admin.findById(AdminId);
    const findvehiclecategory = await VehicleCategorySchema.findById(
      categoryID
    );

    if (!findAdmin) {
      return res.status(404).json({ message: "Admin Not Found!" });
    }
    if (!findvehiclecategory) {
      return res.status(404).json({ message: "Admin Not Found!" });
    }

    const { ratepermile } = req.body;

    const createRatelist = await RateListSchema({
      AdminId: findAdmin._id,
      categoryID: findvehiclecategory._id,
      ratepermile: ratepermile,
    });

    await createRatelist.save();
    return res.status(200).json({ message: "RateList Created Successfully!" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal Server Error!" });
  }
};

const HandleGetAdminDetails = async (req, res) => {
  try {
    const { AdminId } = req.params;
    const findAdmin = await Admin.findById(AdminId);

    if (!findAdmin) {
      return res.status(404).json({ message: "Admin Not Found!" });
    }
    const vehiclePipeline = [
      {
        $match: {
          AdminId: new mongoose.Types.ObjectId(AdminId),
        },
      },
      { $count: "totalItems" },
    ];
    const totalVehicleAggregate = await Vehicles.aggregate(vehiclePipeline);
    const totalVehicles =
      totalVehicleAggregate.length > 0
        ? totalVehicleAggregate[0].totalItems
        : 0;
    const ridesPipeline = [
      {
        $match: {
          AdminId: new mongoose.Types.ObjectId(AdminId),
        },
      },
      { $count: "totalItems" },
    ];
    const ridesAggregate = await RidebookingSchema.aggregate(ridesPipeline);
    const totalRides =
      ridesAggregate.length > 0 ? ridesAggregate[0].totalItems : 0;

    const ratingAvgPipeline = [
      {
        $match: {
          AdminId: new mongoose.Types.ObjectId(AdminId), // Match the AdminId
        },
      },
      {
        $group: {
          _id: null, // Grouping all documents together
          averageRating: { $avg: "$rating" }, // Replace "rating" with the correct field name in your schema
        },
      },
    ];

    const ratingAvgAggregate = await RatingReviewSchema.aggregate(
      ratingAvgPipeline
    );
    let averageRating;
    if (ratingAvgAggregate.length > 0) {
      // Round the average to two decimal places
      averageRating = ratingAvgAggregate[0].averageRating.toFixed(2);
    } else {
      console.log("No ratings found for this AdminId.");
    }

    // Team Lead
    const teamLeadPipeline = [
      {
        $match: {
          AdminId: new mongoose.Types.ObjectId(AdminId),
        },
      },
      { $count: "totalItems" },
    ];
    const teamLeadAggregate = await Teamlead.aggregate(teamLeadPipeline);
    const totalTeamLeads =
      teamLeadAggregate.length > 0 ? teamLeadAggregate[0].totalItems : 0;

    // Riders
    const riderPipeline = [
      {
        $match: {
          AdminId: new mongoose.Types.ObjectId(AdminId),
        },
      },
      { $count: "totalItems" },
    ];
    const riderAggregate = await Teamlead.aggregate(riderPipeline);
    const totalRiders =
      riderAggregate.length > 0 ? riderAggregate[0].totalItems : 0;

    // Cleaners =
    const cleanerPipeline = [
      {
        $match: {
          AdminId: new mongoose.Types.ObjectId(AdminId),
        },
      },
      { $count: "totalItems" },
    ];

    const cleanerAggregate = await Cleaner.aggregate(cleanerPipeline);
    const totalCleaners =
      cleanerAggregate.length > 0 ? cleanerAggregate[0].totalItems : 0;

    // Inspectors =
    const inspectorPipeline = [
      {
        $match: {
          AdminId: new mongoose.Types.ObjectId(AdminId),
        },
      },
      { $count: "totalItems" },
    ];
    const inspectorAggregate = await Inspector.aggregate(inspectorPipeline);
    const totalInspectors =
      inspectorAggregate.length > 0 ? inspectorAggregate[0].totalItems : 0;

    const totalEmployess =
      Number(totalTeamLeads) +
      Number(totalRiders) +
      Number(totalCleaners) +
      Number(totalInspectors);

    return res.status(200).json({
      totalVehicles,
      totalRides,
      totalEmployess,
      averageRating: Number(averageRating),
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal Server Error!" });
  }
};

const HandleUpdateUserPaymentMethod = async (req, res) => {
  try {
    const { userID } = req.params;

    const { cardNumber, cvc, expiryYear, expiryMonth } = req.body;

    const findUser = await Users.findById(userID);
    if (!findUser) {
      return res.status(404).json({ message: "Invalid Request!" });
    }

    const paymentMethod = await stripe.paymentMethods.update(
      findUser.paymentMethodID,
      {
        card: {
          number: cardNumber,
          cvc: cvc,
          exp_month: parseInt(expiryMonth),
          exp_year: parseInt(expiryYear),
        },
      }
    );

    findUser.paymentMethodID = paymentMethod.id;
    await findUser.save();
    res.status(200).json({ message: "Payment Method Updated Successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export {
  CreateSupperAdmin,
  CreateAdmin,
  createDriver,
  createTeamLead,
  createCleaner,
  createInspector,
  CreateUser,
  Login,
  IsActive,
  UpdateUser,
  getProfile,
  getAdmins,
  getDriversofRentalCompany,
  getAllDrivers,
  getTeamofRentalCompany,
  getInspectorsofRentalCompany,
  getCleanerofRentalCompany,
  GetNotifications,
  VerifyOTP,
  ResendOTP,
  allRentalCompanyEmployees,
  GetCordinatesDriver,
  GetCordinatesUser,
  CreateRateListForAdmin,
  getAllEmployees,
  HandleGetAdminDetails,
  HandleUpdateUserPaymentMethod,
};
