import express from "express";
import {  allRentalCompanyEmployees, CreateAdmin, createCleaner, createDriver, createInspector, CreateRateListForAdmin, CreateSupperAdmin, createTeamLead, CreateUser, getAdmins, getAllDrivers, getAllEmployees, getCleanerofRentalCompany, GetCordinatesDriver, GetCordinatesUser, getDriversofRentalCompany, getInspectorsofRentalCompany, GetNotifications, getProfile, getTeamofRentalCompany, HandleGetAdminDetails, HandleUpdateUserPaymentMethod, IsActive, Login, ResendOTP, UpdateUser, VerifyOTP } from "../controller/AuthController.js";


const router = express.Router();

router.post("/create_super_admin", CreateSupperAdmin);
router.post("/create_admin", CreateAdmin);
router.post("/create_driver/:AdminId", createDriver);
router.post("/create_teamlead/:AdminId", createTeamLead);
router.post("/create_cleaner/:AdminId/:TeamleadId", createCleaner);
router.post("/create_inspector/:AdminId/:TeamleadId", createInspector);
router.post("/user-signup", CreateUser);
router.post("/Login", Login);
router.patch("/change-status/:SuperAdminId", IsActive);
router.patch("/update-profile/:userId", UpdateUser);
router.get("/get-profile/:userId", getProfile);
router.get("/get-admins", getAdmins);

router.get("/get-all-employes/:AdminId", getAllEmployees);

router.get("/get-drivers/:AdminId", getDriversofRentalCompany);
router.get("/get-all-drivers/:SuperAdminId", getAllDrivers);
router.get("/get-teamlead/:AdminId", getTeamofRentalCompany);
router.get("/get-inspector/:AdminId/:TeamleadId", getInspectorsofRentalCompany);
router.get("/get-cleaner/:AdminId/:TeamleadId", getCleanerofRentalCompany);
router.get("/Notifications/:Id", GetNotifications);
router.post("/verify-otp", VerifyOTP);
router.post("/resend-otp", ResendOTP);
router.get("/all-employees/:AdminId/:SuperAdminId", allRentalCompanyEmployees);

router.patch("/get-cordinates-driver/:DriverId", GetCordinatesDriver);
router.patch("/get-cordinates-user/:userId", GetCordinatesUser);

router.post("/create-ratelist-for-company/:AdminId/:categoryID", CreateRateListForAdmin);

router.get("/get-admin-details/:AdminId", HandleGetAdminDetails);


router.post("/update-user-card/:userID", HandleUpdateUserPaymentMethod);

export default router;
