import express from "express";
import {
  createVehicle,
  createVehicleCategory,
  getAdminVehicles,
  getAsingmentsRecordsforAdmin,
  getAsingmentsRecordsforDriver,
  getCategoryVehiclespublic,
  getVehicles,
  getVehiclesforSuperAdmin,
  HandleGetVehicleCategory,
  HandleGetVehicleCategoryofAdmin,
  HandleUpdateVehicleCat,
  returnVehicleAsingment,
  VehicleAsingmentforDriver,
} from "../controller/VehicleController.js";

const router = express.Router();

router.post("/create-vehicle-category/:superAdminId", createVehicleCategory);
router.patch("/:superAdminId/update-vehicle-category/:VehicleCategoryId", HandleUpdateVehicleCat);
router.post("/create-vehicle/:AdminId/:VehicleCategory", createVehicle);
router.post(
  "/vehicle-assingment/:AdminId/:DriverId",
  VehicleAsingmentforDriver
);
router.post("/get-vehicle/:AdminId", getVehicles);

router.get("/get-vehicle-category", HandleGetVehicleCategory);
router.get(
  "/get-vehicle-category-for-admin/:AdminId",
  HandleGetVehicleCategoryofAdmin
);
router.patch("/return-vehicle/:AsingmentId/:AdminId", returnVehicleAsingment);
router.get(
  "/getAsingmentsRecordsforDriver/:DriverId",
  getAsingmentsRecordsforDriver
);
router.get(
  "/getAsingmentsRecordsforAdmin/:AdminId",
  getAsingmentsRecordsforAdmin
);
router.get(
  "/getCategoryVehiclespublic/:catID/:asingmenttype",
  getCategoryVehiclespublic
);

router.get("/all-vehicles/:AdminId", getAdminVehicles);

router.get("/get-vehicle-by/:superAdminId/:VehicleCategoryId", getVehiclesforSuperAdmin);

export default router;
