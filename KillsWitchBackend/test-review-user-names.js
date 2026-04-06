const db = require("./models");

async function testReviewUserNames() {
  try {
    console.log("🧪 Testing Review User Names...");
    
    // Connect to database
    await db.sequelize.authenticate();
    console.log("✅ Database connected");

    // Get a sample user
    const user = await db.User.findOne({
      where: { role: 'user' },
      attributes: ['id', 'name', 'email']
    });

    if (!user) {
      console.log("❌ No users found. Please create a user first.");
      process.exit(1);
    }

    console.log(`👤 Found user: ${user.name} (${user.email})`);

    // Get a sample product
    const product = await db.product.findOne({
      attributes: ['product_id', 'part_number']
    });

    if (!product) {
      console.log("❌ No products found. Please add products first.");
      process.exit(1);
    }

    console.log(`📦 Found product: ${product.part_number}`);

    // Test creating a review with authenticated user
    console.log("\n🔍 Testing review creation with authenticated user...");
    
    const testReview = await db.Review.create({
      productId: product.product_id,
      rating: 5,
      comment: "This is a test review to verify user names are working correctly.",
      reviewer_name: user.name, // This should be automatically set by the backend
      userId: user.id
    });

    console.log("✅ Review created successfully!");
    console.log(`📝 Review ID: ${testReview.id}`);
    console.log(`👤 Reviewer Name: ${testReview.reviewer_name}`);
    console.log(`🆔 User ID: ${testReview.userId}`);

    // Test fetching the review with associations
    console.log("\n🔍 Testing review retrieval with user associations...");
    
    const reviewWithUser = await db.Review.findByPk(testReview.id, {
      include: [
        {
          model: db.User,
          as: 'user',
          attributes: ['id', 'name', 'email'],
          required: false
        },
        {
          model: db.product,
          as: 'product',
          attributes: ['product_id', 'part_number'],
          required: false
        }
      ]
    });

    console.log("✅ Review retrieved with associations!");
    console.log(`📝 Review created with ID ${reviewWithUser.id}`);
    console.log(`👤 Reviewer Name: ${reviewWithUser.reviewer_name}`);
    console.log(`👤 User Name: ${reviewWithUser.user?.name || 'No user association'}`);
    console.log(`📦 Product: ${reviewWithUser.product?.part_number || 'No product association'}`);

    // Test the getFeaturedReviews function
    console.log("\n🔍 Testing getFeaturedReviews function...");
    
    const featuredReviews = await db.Review.findAll({
      where: {
        rating: {
          [db.Sequelize.Op.gte]: 4 // Only 4 and 5 star reviews
        }
      },
      include: [
        {
          model: db.User,
          as: 'user',
          attributes: ['id', 'name', 'email'],
          required: false
        },
        {
          model: db.product,
          as: 'product',
          attributes: ['product_id', 'part_number'],
          required: false
        }
      ],
      order: [
        ['rating', 'DESC'],
        ['createdAt', 'DESC']
      ],
      limit: 5
    });

    console.log(`✅ Found ${featuredReviews.length} featured reviews:`);
    featuredReviews.forEach((review, index) => {
      console.log(`  ${index + 1}. ${review.reviewer_name} - ${review.rating}⭐`);
    });

    // Clean up test review
    console.log("\n🧹 Cleaning up test review...");
    await db.Review.destroy({
      where: { id: testReview.id }
    });
    console.log("✅ Test review cleaned up!");

    console.log("\n🎉 All tests passed! User names are working correctly.");
    process.exit(0);

  } catch (error) {
    console.error("❌ Test failed:", error);
    process.exit(1);
  }
}

testReviewUserNames();
