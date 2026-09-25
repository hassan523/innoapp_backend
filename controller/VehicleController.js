import { v2 as cloudinary } from "cloudinary";
import VehicleCategorySchema from "../models/VehicleCategorySchema.js";
import SuperAdmin from "../models/SuperAdmin.js";
import axios from "axios";
import Admin from "../models/Admin.js";
import Vehicles from "../models/Vehicles.js";
import Driver from "../models/Driver.js";
import VehicleAsingment from "../models/VehicleAsingment.js";
import HandlePostNotification from "../utils/Notify.js";
import RateListSchema from "../models/RateListSchema.js";
import RidebookingSchema from "../models/RidebookingSchema.js";

const createVehicleCategory = async (req, res) => {
  try {
    const { superAdminId } = req.params;
    const { CategoryName } = req.body;

    // Validate required fields
    if (!superAdminId || !CategoryName) {
      return res
        .status(400)
        .json({ message: "superAdminId and CategoryName are required!" });
    }

    // Convert category name to lowercase for case-insensitive comparison
    const normalizedCategoryName = CategoryName.trim().toLowerCase();

    // Check if Super Admin exists
    const findSuperAdmin = await SuperAdmin.findById(superAdminId);
    if (!findSuperAdmin) {
      return res.status(404).json({ message: "Super Admin not found!" });
    }

    // Handle Thumbnail upload
    const Thumnail = req?.files?.Thumnail;
    let uploadResult = { secure_url: "" }; // Default value for cases without a thumbnail

    if (Thumnail) {
      try {
        uploadResult = await cloudinary.uploader.upload(Thumnail.tempFilePath, {
          resource_type: "image",
          folder: "innoapp",
        });
      } catch (uploadError) {
        console.log("Error uploading thumbnail:", uploadError);
        return res.status(500).json({ message: "Failed to upload thumbnail!" });
      }
    }

    const findCategory = await VehicleCategorySchema.find({
      CategoryName: normalizedCategoryName,
    });
    if (findCategory.length >= 1) {
      return res.status(400).json({
        message: "Category name already exists. Please use a different name!",
      });
    }

    const createCategory = new VehicleCategorySchema({
      superAdminId: findSuperAdmin._id,
      CategoryName: normalizedCategoryName, // Save as lowercase
      Thumnail: uploadResult.secure_url,
    });

    await createCategory.save();

    return res.status(201).json({
      message: "Vehicle category has been successfully created.",
      createCategory,
    });
  } catch (error) {
    console.error("Error in createVehicleCategory:", error);
    return res.status(500).json({ message: "Internal Server Error!" });
  }
};


const HandleUpdateVehicleCat = async (req, res) => {
  try {
    const { superAdminId, VehicleCategoryId } = req.params;
    const { CategoryName } = req.body;

    const findSuperAdmin = await SuperAdmin.findById(superAdminId);
    if (!findSuperAdmin) {
      return res.status(404).json({ message: "Invalid Request" });
    }
    const findVehicleCat = await VehicleCategorySchema.findById(
      VehicleCategoryId
    );
    if (!findVehicleCat) {
      return res.status(404).json({ message: "Vehicle Category Not Found!" });
    }

    const Thumnail = req?.files?.Thumnail;
    const uploadResult = Thumnail
      ? await cloudinary.uploader.upload(Thumnail.tempFilePath, {
          resource_type: "image",
          folder: `category`,
        })
      : findVehicleCat.Thumnail;

    const findCategory = await VehicleCategorySchema.findOne({
      _id: { $ne: VehicleCategoryId },
      CategoryName: CategoryName,
    });

    if (findCategory) {
      return res.status(400).json({
        message: "Category name already exists. Please use a different name!",
      });
    }

    findVehicleCat.CategoryName = CategoryName || findVehicleCat.CategoryName;
    findVehicleCat.Thumnail = uploadResult.secure_url || findVehicleCat.Thumnail;
    await findVehicleCat.save();
    return res.status(200).json({
      message: "Vehicle category has been updated successfully.",
      findVehicleCat,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const createVehicle = async (req, res) => {
  try {
    const { VinNumber, asingmenttype, description } = req.body;
    const vehicleImages = req?.files?.vehicleImages;
    const { AdminId, VehicleCategory } = req.params;

    const findAdmin = await Admin.findById(AdminId);
    if (!findAdmin) {
      return res.status(404).json({ message: "Admin Not Found!" });
    }

    if (findAdmin.IsActive === false) {
      return res.status(401).json({ message: "You are Inactive" });
    }

    if (!VinNumber) {
      return res.status(400).json({ message: "VIN number is required!" });
    }
    const findVehiclecategory = await VehicleCategorySchema.findById(
      VehicleCategory
    );
    if (!findVehiclecategory) {
      return res.status(404).json({ message: "Vehicle category Not Found!" });
    }
    const findifexixtingVehicle = await Vehicles.findOne({ vin: VinNumber });

    if (findifexixtingVehicle) {
      return res
        .status(400)
        .json({ message: "This Vehicle is Already Registered!" });
    }
    const apiUrl = `https://api.api-ninjas.com/v1/vinlookup?vin=${VinNumber}`;
    const headers = {
      "X-Api-Key": "1c3EUMYrszMksrh7QwjAqg==WSsmtrtLbbRGsgCQ",
    };
    const response = await axios.get(apiUrl, { headers });

    console.log(response.data);

    const requiredFields = [
      "vin",
      "country",
      "manufacturer",
      "region",
      "wmi",
      "vds",
      "vis",
      "year",
    ];
    const missingFields = requiredFields.filter(
      (field) => response.data[field] === null
    );
    if (missingFields.length > 0) {
      return res.status(400).json({
        message: `${missingFields.join(", ")} ${
          missingFields.length > 1 ? "are" : "is"
        } required`,
      });
    }

    // const uploadResult = Thumnail ? await cloudinary.uploader.upload(Thumnail.tempFilePath, {
    //     resource_type: 'image',
    //     folder: `innoapp`,
    // }) : '';

    const imageUrls = [];
    if (Array.isArray(vehicleImages)) {
      for (const image of vehicleImages) {
        const uploadResult = await cloudinary.uploader.upload(
          image?.tempFilePath,
          {
            resource_type: "image",
            folder: `innoapp/vehicles`,
          }
        );
        imageUrls.push(uploadResult.secure_url);
      }
    } else if (vehicleImages) {
      const uploadResult = await cloudinary.uploader.upload(
        vehicleImages?.tempFilePath,
        {
          resource_type: "image",
          folder: `innoapp/vehicles`,
        }
      );
      imageUrls.push(uploadResult.secure_url);
    }

    const creating = new Vehicles({
      VehicleCategory: findVehiclecategory._id,
      AdminId: findAdmin._id,
      vehicleImages: imageUrls,
      vin: response.data.vin,
      country: response.data.country,
      manufacturer: response.data.manufacturer,
      model: response.data.model,
      class: response.data.class,
      region: response.data.region,
      wmi: response.data.wmi,
      vds: response.data.vds,
      vis: response.data.vis,
      year: response.data.year,
      asingmenttype: asingmenttype,
      description: description,
    });

    await creating.save();

    return res
      .status(200)
      .json({ message: "Data fetched successfully", creating });
  } catch (error) {
    console.error(error);

    if (error.response) {
      return res.status(400).json({
        message: "Error fetching VIN details.",
        error: error.response.data,
      });
    }

    return res.status(500).json({ message: "Internal Server Error!" });
  }
};

const HandleGetVehicleCategory = async (req, res) => {
  try {
    const vehicleCat = await VehicleCategorySchema.find();
    return res.status(200).json({ message: "Vehicle Categories", vehicleCat });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal Server Error!" });
  }
};

const HandleGetVehicleCategoryofAdmin = async (req, res) => {
  try {
    const { AdminId } = req.params;
    const findAdmin = await Admin.findById(AdminId);

    if (!findAdmin) {
      return res.status(404).json({ message: "Admin Not Found! " });
    }
    const findRateList = await RateListSchema.find({
      AdminId: findAdmin._id,
    }).populate({
      path: "categoryID",
      model: "VehicleCategory",
    });

    return res
      .status(200)
      .json({ message: "Vehicle Categories rateList", findRateList });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal Server Error!" });
  }
};

const getVehicles = async (req, res) => {
  try {
    const { AdminId } = req.params;
    const { VehicleCategory } = req.body;

    if (!AdminId) {
      return res.status(400).json({ message: "AdminId is required." });
    }

    if (!VehicleCategory) {
      return res.status(400).json({ message: "VehicleCategory is required." });
    }

    let findVehicles;

    if (VehicleCategory.toLowerCase() === "all") {
      findVehicles = await Vehicles.find({ AdminId });
      return res
        .status(200)
        .json({ message: "All vehicles for this Admin", findVehicles });
    }

    const checkVehicleCategory = await VehicleCategorySchema.findById(
      VehicleCategory
    );

    if (!checkVehicleCategory) {
      return res.status(404).json({ message: "VehicleCategory not found." });
    }
    findVehicles = await Vehicles.find({
      AdminId,
      VehicleCategory,
    });
    return res
      .status(200)
      .json({ message: "Vehicles for this Admin and category", findVehicles });
  } catch (error) {
    console.error("Error in getVehicles:", error);
    return res.status(500).json({ message: "Internal Server Error!" });
  }
};


const getVehiclesforSuperAdmin = async (req, res) => {
  try {
    const { superAdminId, VehicleCategoryId } = req.params;

    if (!superAdminId) {
      return res.status(400).json({ message: "SuperAdmin is required." });
    } 

    const findSuperAdmin = await SuperAdmin.findById(superAdminId);

   if (!findSuperAdmin) {
      return res.status(400).json({ message: "SuperAdmin not found!" });
    }

    if (!VehicleCategoryId) {
      return res.status(400).json({ message: "VehicleCategory id is required." });
    }

   const findVehiclecategory = await VehicleCategorySchema.findById(VehicleCategoryId);

    if (!findVehiclecategory) {
      return res
      .status(400)
      .json({ message: "Category Not found!"});
    }
  const findVehicles = await Vehicles.find({ VehicleCategory: VehicleCategoryId });
    return res
      .status(200)
      .json({ message: "All vehicles for this Admin", findVehicles });

  } catch (error) {
    console.error("Error in getVehicles:", error);
    return res.status(500).json({ message: "Internal Server Error!" });
  }
};

const getAdminVehicles = async (req, res) => {
  try {
    const { AdminId } = req.params;

    const findAdmin = await Admin.findById(AdminId);

    if (!findAdmin) {
      return res.status(404).json({ message: "Admin Not Found!" });
    }
    const findVehicles = await Vehicles.find({ AdminId: findAdmin._id });

    return res.status(200).json({ message: "all Vehicles", findVehicles });
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error!" });
  }
};

const VehicleAsingmentforDriver = async (req, res) => {
  try {
    const { VinNumber, createdate, asingmenttype } = req.body;
    const { DriverId, AdminId } = req.params;
    const findVehicle = await Vehicles.findOne({
      vin: VinNumber,
      AdminId: AdminId,
    });

    const findDriver = await Driver.findOne({
      _id: DriverId,
      AdminId: AdminId,
    });

    const findAdmin = await Admin.findById(AdminId);

    const CheckAsingments = await VehicleAsingment.findOne({
      AdminId: AdminId,
      VinNumber: VinNumber,
      DriverId: DriverId,
    });

    if (!findAdmin) {
      return res.status(404).json({ message: "Admin Not Found!" });
    }
    if (!findVehicle) {
      return res.status(404).json({ message: "Vehicle Not Found!" });
    }
    if (!findDriver) {
      return res.status(404).json({ message: "Driver Not Found!" });
    }
    if (findDriver.carAssingned === true) {
      return res.status(400).json({ message: "Car already assingned!" });
    }
    if (CheckAsingments && CheckAsingments.Active === true) {
      return res.status(400).json({ message: "This Car is Already In Use!" });
    }
    const createAsingment = new VehicleAsingment({
      AdminId,
      DriverId,
      VinNumber,
      Active: true,
      createdate,
      asingmenttype,
    });
    await createAsingment.save();

    findDriver.carAssingned = true;
    findDriver.save();

    findVehicle.IsAsigned = true;
    findVehicle.save();

    const NotificationforAdmin = HandlePostNotification({
      TeamLeadId: AdminId._id,
      message: `${findVehicle.vin} is assingned to ${findDriver.name} succesfully!`,
      notiftype: "Vehicle",
    });

    const NotificationforDriver = HandlePostNotification({
      TeamLeadId: findDriver._id,
      message: `${findVehicle.vin} is assingned to you succesfully!`,
      notiftype: "Vehicle",
    });

    return res.status(200).json({
      message: `Car has been Assigned to Driver ${findDriver.name}`,
      createAsingment,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal Server Error!" });
  }
};

const returnVehicleAsingment = async (req, res) => {
  try {
    const { expirydate } = req.body;
    const { AsingmentId, AdminId } = req.params;

    // Find relevant entities
    const findAdmin = await Admin.findById(AdminId);
    const findAssignment = await VehicleAsingment.findById(AsingmentId);
    const findDriver = await Driver.findById(findAssignment.DriverId.toString());

    // Find vehicle based on VIN number and AdminId
    const findVehicle = await Vehicles.findOne({
      vin: findAssignment.VinNumber,
      AdminId: AdminId,
    });

    // Admin validation
    if (!findAdmin) {
      return res.status(404).json({ message: "Admin Not Found!" });
    }

    // Assignment validation
    if (!findAssignment) {
      return res.status(404).json({ message: "Assignment Not Found!" });
    }

    const findRideBooking = await RidebookingSchema.find({
      driverId: findDriver._id,
      status: { $in: ["ongoing", "accepted"] },
      VehcileId: findVehicle._id,
    });


    if (findRideBooking.length > 0) {
      return res.status(400).json({ message: "Driver is Occupied! He needs to complete his tasks first." });
    }


    // Perform the return actions
    if (findAdmin._id.toString() === findAssignment.AdminId.toString()) {
      // Update Assignment
      findAssignment.Active = false;
      findAssignment.expirydate = expirydate;
      await findAssignment.save();

      // Update Driver and Vehicle
      findDriver.carAssingned = false;
      await findDriver.save();

      findVehicle.IsAsigned = false;
      await findVehicle.save();

      // Send notifications
            const NotificationforAdmin = await HandlePostNotification({
                TeamLeadId: AdminId._id,
                message: `${findAssignment.VinNumber} is returned by ${findDriver.name} successfully!`,
                notiftype: "Vehicle",
              });
           
              const NotificationforDriver = await HandlePostNotification({
                TeamLeadId: findDriver._id,
                message: `You returned ${findAssignment.VinNumber} successfully!`,
                notiftype: "Vehicle",
              });

      return res.status(200).json({ message: "Vehicle has been returned to the Origin Facility!" });
    }

    return res.status(403).json({ message: "Admin is not authorized to return this vehicle!" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error!" });
  }
};


const getAsingmentsRecordsforDriver = async (req, res) => {
  try {
    const { DriverId } = req.params;

    // Find assignments for the given DriverId
    const findDriverAssignments = await VehicleAsingment.find({ DriverId })
      .populate({
        path: "AdminId",
        model: "Admin",
      })
      .populate({
        path: "DriverId",
        model: "Driver",
      });

    if (!findDriverAssignments || findDriverAssignments.length === 0) {
      return res
        .status(404)
        .json({ message: "No assignments found for this driver!" });
    }

    const vinNumbers = findDriverAssignments.map(
      (assignment) => assignment.VinNumber
    );

    const findVehicles = await Vehicles.find({ vin: { $in: vinNumbers } });

    if (!findVehicles || findVehicles.length === 0) {
      return res
        .status(404)
        .json({ message: "No vehicles found for the driver's assignments!" });
    }

    const enrichedAssignments = findDriverAssignments.map((assignment) => {
      const vehicleDetails = findVehicles.find(
        (vehicle) => vehicle.vin === assignment.VinNumber
      );
      return {
        ...assignment._doc,
        VinNumber: vehicleDetails || null,
      };
    });

    return res.status(200).json({
      message: "All Driver's Vehicle Assigned History Retrieved Successfully!",
      assignments: enrichedAssignments,
    });
  } catch (error) {
    console.error("Error fetching assignments and vehicles:", error);
    return res.status(500).json({ message: "Internal Server Error!" });
  }
};

const getAsingmentsRecordsforAdmin = async (req, res) => {
  try {
    const { AdminId } = req.params;
    const findAdminAssignments = await VehicleAsingment.find({ AdminId })
      .populate({
        path: "AdminId",
        model: "Admin",
      })
      .populate({
        path: "DriverId",
        model: "Driver",
      });

    if (!findAdminAssignments || findAdminAssignments.length === 0) {
      return res
        .status(404)
        .json({ message: "No assignments found for this admin!" });
    }

    const vinNumbers = findAdminAssignments.map(
      (assignment) => assignment.VinNumber
    );

    const findVehicles = await Vehicles.find({ vin: { $in: vinNumbers } });

    if (!findVehicles || findVehicles.length === 0) {
      return res
        .status(404)
        .json({ message: "No vehicles found for the admin's assignments!" });
    }

    const enrichedAssignments = findAdminAssignments.map((assignment) => {
      const vehicleDetails = findVehicles.find(
        (vehicle) => vehicle.vin === assignment.VinNumber
      );
      return {
        ...assignment._doc,
        VinNumber: vehicleDetails || null,
      };
    });

    return res.status(200).json({
      message: "All Admin's Vehicle Assigned History Retrieved Successfully!",
      assignments: enrichedAssignments,
    });
  } catch (error) {
    console.error("Error fetching assignments and vehicles:", error);
    return res.status(500).json({ message: "Internal Server Error!" });
  }
};

const getCategoryVehiclespublic = async (req, res) => {
  try {
    const { catID, asingmenttype } = req.params;

    const findVehicle = await Vehicles.find({
      VehicleCategory: catID,
      asingmenttype: asingmenttype,
    }).populate({
      path: "AdminId",
      model: "Admin",
    });
    if (!findVehicle) {
      return res.status(404).json({ message: "Vehicle Not Found!" });
    }
    return res
      .status(200)
      .json({ message: "All Vehicles of this category!", findVehicle });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal Server Error!" });
  }
};

export {
  createVehicleCategory,
  createVehicle,
  getVehicles,
  HandleGetVehicleCategory,
  VehicleAsingmentforDriver,
  returnVehicleAsingment,
  getAsingmentsRecordsforDriver,
  getAsingmentsRecordsforAdmin,
  getCategoryVehiclespublic,
  HandleGetVehicleCategoryofAdmin,
  getAdminVehicles,
  HandleUpdateVehicleCat,
  getVehiclesforSuperAdmin
};
