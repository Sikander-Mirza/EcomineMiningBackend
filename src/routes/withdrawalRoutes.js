import express from "express";
import { createWithdrawalRequest } from "../controller/withdrawalController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Protected route for posting withdrawal request
router.post("/withdrawals", protect, createWithdrawalRequest);

export default router;
