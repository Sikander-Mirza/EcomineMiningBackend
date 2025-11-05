import asyncHandler from "express-async-handler";
import Withdrawal from "../model/withdrawalModel.js";
import User from "../model/UserModel.js";

// @desc    Post withdrawal request
// @route   POST /api/withdrawal
// @access  Private
export const createWithdrawalRequest = asyncHandler(async (req, res) => {
  const { amount, walletNumber, walletType, walletName } = req.body;

  if (!amount || !walletNumber || !walletType || !walletName) {
    return res.status(400).json({ message: "All fields are required" });
  }

  const userId = req.user._id; // user from auth middleware
  const user = await User.findById(userId);

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  if (user.mainBalance < amount) {
    return res.status(400).json({ message: "Insufficient balance" });
  }

  // Deduct balance temporarily (optional — or admin can deduct after approval)
  user.mainBalance -= amount;
  await user.save();

  const withdrawal = await Withdrawal.create({
    userId,
    amount,
    walletNumber,
    walletType,
    walletName,
  });

  res.status(201).json({
    message: "Withdrawal request submitted successfully",
    withdrawal,
  });
});
