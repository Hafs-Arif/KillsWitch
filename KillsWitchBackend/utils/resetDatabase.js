const db = require("../models");

(async function reset() {
  try {
    await db.sequelize.drop({ logging: console.log });
    await db.sequelize.sync({ force: true, logging: console.log });
    console.log("All tables recreated.");
    process.exit(0);
  } catch (err) {
    console.error("Error resetting database:", err);
    process.exit(1);
  }
})();
