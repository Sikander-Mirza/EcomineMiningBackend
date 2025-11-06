import asyncHandler from "express-async-handler";
import User from "../model/UserModel.js";
import generateToken from "../helper/generateToken.js";
import bcrypt from "bcryptjs";
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import ejs from 'ejs';
import { fileURLToPath } from 'url';
import path from 'path';
import { sendEmail } from "../helper/emailServer.js";

// Load environment variables
dotenv.config();
const __filename = fileURLToPath(import.meta.url);


export const registerUser = asyncHandler(async (req, res) => {
  const { firstName, lastName, email, password, country, phoneNumber, referralCode } = req.body;

  // Validate input
  if (!firstName || !lastName || !email || !password || !country || !phoneNumber) {
    return res.status(400).json({ message: "All fields are required" });
  }

  if (password.length < 6) {
    return res.status(400).json({ message: "Password must be at least 6 characters long" });
  }

  try {
    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    // 🔹 Optional: Check if referralCode is valid
    let referrer = null;
    if (referralCode) {
      referrer = await User.findOne({ referralCode });
      if (!referrer) {
        return res.status(400).json({ message: "Invalid referral code" });
      }
    }

    // 🔹 Generate unique referral code for the new user
    const newReferralCode = `${firstName?.toLowerCase() || "user"}-${Math.random()
      .toString(36)
      .substring(2, 8)}`;

    // 🔹 Create user with referralId if referrer found
    const user = await User.create({
      firstName,
      lastName,
      email,
      password,
      country,
      phoneNumber,
      referralId: referrer?._id || null,
      referralCode: newReferralCode,
    });

    if (user) {
      // Generate JWT token
      const token = generateToken(user._id);

      const cookieOptions = {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        path: "/",
        maxAge: 24 * 60 * 60 * 1000,
      };
      res.cookie("token", token, cookieOptions);

      // Try sending welcome email
      try {
        await sendEmail(email, "Welcome to Our Platform!", "welcome", { firstName, email });
      } catch (emailError) {
        console.error("Welcome email failed:", emailError);
      }

      res.status(200).json({
        message: "Registration successful",
        user: {
          _id: user._id.toString(),
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
          country: user.country,
          phoneNumber: user.phoneNumber,
          referralCode: user.referralCode,
          referralId: user.referralId,
        },
        token,
      });
    } else {
      return res.status(400).json({ message: "Invalid user data" });
    }
  } catch (error) {
    console.error("Registration error:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
});


// Login user
export const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }

  const user = await User.findOne({ email });

  if (!user) {
    return res.status(404).json({ message: "User not found, please sign up" });
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    return res.status(400).json({ message: "Invalid email or password" });
  }

  // Generate OTP (6 digits)
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  // Save OTP + expiry (5 min)
  user.otpCode = otp;
  user.otpExpires = new Date(Date.now() + 5 * 60 * 1000);
  await user.save();

  // Send OTP to user email
  await sendEmail(
  "sikander.mirza@themetroweb.com",
  "Your Login OTP",
  `Your one-time password (OTP) is <b>${otp}</b>.`
);

  res.status(200).json({
    message: "OTP sent to your email. Please verify to complete login.",
    email: user.email,
  });
});


export const verifyOtp = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ message: "Email and OTP are required" });
  }

  const user = await User.findOne({ email });

  if (!user || !user.otpCode) {
    return res.status(400).json({ message: "Invalid or expired OTP" });
  }

  if (user.otpCode !== otp) {
    return res.status(400).json({ message: "Incorrect OTP" });
  }

  if (user.otpExpires < Date.now()) {
    return res.status(400).json({ message: "OTP expired" });
  }

  // OTP valid — clear OTP fields
  user.otpCode = null;
  user.otpExpires = null;
  await user.save();

  // Generate token
  const token = generateToken(user._id);

  // Set cookie
  const cookieOptions = {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    path: "/",
    maxAge: 24 * 60 * 60 * 1000,
  };
  res.cookie("token", token, cookieOptions);

  res.status(200).json({
    message: "Login successful",
    user: {
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      phoneNumber: user.phoneNumber,
      mainBalance: user.mainBalance,
    },
    token,
  });
});




export const verifyPassword = asyncHandler(async (req, res) => {
  const { password } = req.body;

  if (!password) {
    return res.status(400).json({ message: "Password is required" });
  }

  const user = await User.findById(req.user._id);

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    return res.status(400).json({ message: "Invalid password" });
  }

  res.status(200).json({ message: "Password verified successfully" });
});



export const getCurrentUser = asyncHandler(async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role:user.role,
      phoneNumber:user.phoneNumber,
      country: user.country, // Include country in response
      mainBalance:user.mainBalance
    });
  } catch (error) {
    console.error("Get current user error:", error);
    res.status(500).json({ message: "Server error" });
  }
});


export const logoutUser = asyncHandler(async (req, res) => {
  const cookieOptions = {
    httpOnly: true,
    secure: true, 
    sameSite: 'none', 
    path: '/',
  };
  
  res.clearCookie("token", cookieOptions);
  res.status(200).json({ message: "User logged out successfully" });
});

export const profile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select("-password");

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  res.status(200).json({
    name: user.name,
    email: user.email,
    role: user.role,

  });
});


export const updateProfile = asyncHandler(async (req, res) => {
  const { firstName, lastName, country, phoneNumber } = req.body;

  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update only the fields that are provided
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (country) user.country = country;
    if (phoneNumber) user.phoneNumber = phoneNumber;

    // Save the updated user
    const updatedUser = await user.save();

    res.status(200).json({
      _id: updatedUser._id,
      firstName: updatedUser.firstName,
      lastName: updatedUser.lastName,
      email: updatedUser.email,
      role: updatedUser.role,
      country: updatedUser.country,
      phoneNumber: updatedUser.phoneNumber
    });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});