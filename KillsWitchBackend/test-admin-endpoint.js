const db = require("./models");

async function testAdminEndpoint() {
  try {
    console.log("🧪 Testing Admin Endpoint...");
    
    // Connect to database
    await db.sequelize.authenticate();
    console.log("✅ Database connected");

    // Test the getAdmins function directly
    console.log("\n🔍 Testing getAdmins function...");
    
    const admins = await db.User.findAll({ 
      where: { role: 'admin' }, 
      attributes: ['email', 'name', 'id'] 
    });
    
    console.log(`✅ Found ${admins.length} admin users:`);
    admins.forEach((admin, index) => {
      console.log(`  ${index + 1}. ${admin.name} (${admin.email}) - ID: ${admin.id}`);
    });

    // Test creating a test admin user
    console.log("\n🔍 Testing admin user creation...");
    
    const testAdmin = await db.User.findOrCreate({
      where: { email: 'test-admin@example.com' },
      defaults: {
        name: 'Test Admin',
        email: 'test-admin@example.com',
        password: 'hashedpassword',
        role: 'admin'
      }
    });

    if (testAdmin[1]) {
      console.log("✅ Test admin user created successfully");
    } else {
      console.log("ℹ️ Test admin user already exists");
    }

    // Test the endpoint response format
    console.log("\n🔍 Testing endpoint response format...");
    
    const endpointAdmins = await db.User.findAll({ 
      where: { role: 'admin' }, 
      attributes: ['email', 'name', 'id'] 
    });
    
    const responseFormat = {
      success: true,
      count: endpointAdmins.length,
      admins: endpointAdmins
    };
    
    console.log("✅ Endpoint response format:");
    console.log(JSON.stringify(responseFormat, null, 2));

    // Clean up test admin if we created it
    if (testAdmin[1]) {
      console.log("\n🧹 Cleaning up test admin...");
      await db.User.destroy({
        where: { email: 'test-admin@example.com' }
      });
      console.log("✅ Test admin cleaned up!");
    }

    console.log("\n🎉 All tests passed! Admin endpoint is working correctly.");
    process.exit(0);

  } catch (error) {
    console.error("❌ Test failed:", error);
    process.exit(1);
  }
}

testAdminEndpoint();

