import mongoose from "mongoose";
import dotenv from "dotenv";
import Admin from "../models/Admin.js";

dotenv.config();

const setupSuperAdmin = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI is not defined");
    }

    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to database");

    const SUPER_ADMIN_EMAIL = "superadmin@kivelo.com";

    // 🔥 DELETE BY EMAIL (NOT ROLE)
    const deleted = await Admin.deleteMany({
      email: SUPER_ADMIN_EMAIL,
    });

    console.log(
      `🗑️ Removed ${deleted.deletedCount} admin account(s) with email ${SUPER_ADMIN_EMAIL}`
    );

    // 🔐 CREATE FRESH SUPER ADMIN
    const superAdmin = await Admin.create({
      email: SUPER_ADMIN_EMAIL,
      password: "Admin123!", // must be hashed in pre-save hook
      name: "Super Administrator",
      role: "super_admin",
      isActive: true,
      permissions: {
        users: true,
        parents: true,
        children: true,
        activities: true,
        analytics: true,
        settings: true,
        admins: true,
        audit: true,
      },
    });

    console.log("✅ Super admin overwritten successfully");
    console.log("📧 Email:", superAdmin.email);
    console.log("🔑 Password: Admin123!");
    console.log("⚠️ IMPORTANT: Change the password immediately after login");

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("❌ Failed to setup super admin:", error);
    await mongoose.disconnect();
    process.exit(1);
  }
};

setupSuperAdmin();
