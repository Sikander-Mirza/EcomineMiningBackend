import express from "express";
import multer from "multer";
import { createDeposit } from "../controller/depositeController.js";

const router = express.Router();
const upload = multer(); // memory storage for buffer

// POST /api/deposit
router.post("/deposit", upload.array("attachment"), createDeposit);
console.log("route trigger")

export default router;
