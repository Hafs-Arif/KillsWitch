const bcrypt = require("bcryptjs");
const sequelize = require("./config/db"); // your Sequelize instance
const db = require("./models"); // loads models (User, etc.)

async function seedAdmin() {
  try {
    // Connect to database
    await sequelize.authenticate();
    console.log("Database connected...");

    // Sync models (optional if already migrated)
    await db.sequelize.sync();

    const hashedPassword = await bcrypt.hash("Admin@123", 10); // change password as needed

    // Create or update admin
    const [admin, created] = await db.User.findOrCreate({
      where: { email: "admin@example.com" },
      defaults: {
        name: "Super Admin",
        email: "admin@example.com",
        password: hashedPassword,
        role: "admin", // make sure your User model has this field
        isGoogleAuth: false, // depending on your schema
      },
    });

    if (created) {
      console.log("✅ Admin user created:", admin.email);
    } else {
      console.log("ℹ️ Admin already exists:", admin.email);
    }

    process.exit(0);
  } catch (err) {
    console.error("❌ Error seeding admin:", err);
    process.exit(1);
  }
}

seedAdmin();
