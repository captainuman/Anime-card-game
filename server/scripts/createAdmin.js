require("dotenv").config();

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const User = require("../models/User");

const BCRYPT_ROUNDS = 12;

async function createAdmin() {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI is missing from .env");
    }

    if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD) {
      throw new Error("ADMIN_EMAIL and ADMIN_PASSWORD are required.");
    }

    const email = process.env.ADMIN_EMAIL.trim().toLowerCase();
    const username = (
      process.env.ADMIN_USERNAME || "Admin"
    ).trim();
    const password = process.env.ADMIN_PASSWORD;

    if (!username) {
      throw new Error("ADMIN_USERNAME cannot be empty.");
    }

    if (password.length < 6) {
      throw new Error(
        "ADMIN_PASSWORD must be at least 6 characters.",
      );
    }

    await mongoose.connect(process.env.MONGO_URI);

    const existingUser = await User.findOne({ email });

    const hashedPassword = await bcrypt.hash(
      password,
      BCRYPT_ROUNDS,
    );

    if (existingUser) {
      existingUser.role = "admin";
      existingUser.username = username;
      existingUser.password = hashedPassword;

      await existingUser.save();

      console.log("Existing user converted to admin.");
      console.log(`Email: ${email}`);
      console.log(`Username: ${existingUser.username}`);
    } else {
      const admin = await User.create({
        username,
        email,
        password: hashedPassword,
        role: "admin",
      });

      console.log("Admin account created.");
      console.log(`Email: ${admin.email}`);
      console.log(`Username: ${admin.username}`);
    }
  } catch (error) {
    console.error("Failed to create admin:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect().catch(() => {});
  }
}

createAdmin();