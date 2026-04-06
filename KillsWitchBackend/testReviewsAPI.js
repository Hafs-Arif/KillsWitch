const db = require("./models");

async function testReviewsAPI() {
  try {
    console.log("🧪 Testing Reviews API...\n");

    // Connect to database
    await db.sequelize.authenticate();
    console.log("✅ Database connected\n");

    // Count total reviews
    const totalCount = await db.Review.count();
    console.log(`📊 Total reviews in database: ${totalCount}\n`);

    // Get featured reviews (4-5 stars)
    const featuredReviews = await db.Review.findAll({
      where: {
        rating: {
          [db.Sequelize.Op.gte]: 4
        }
      },
      include: [
        {
          model: db.product,
          as: 'product',
          attributes: ['product_id', 'part_number', 'short_description', 'image', 'price']
        },
        {
          model: db.User,
          as: 'user',
          attributes: ['id', 'name'],
          required: false
        }
      ],
      order: [
        ['rating', 'DESC'],
        ['createdAt', 'DESC']
      ],
      limit: 10
    });

    console.log(`⭐ Featured reviews (4-5 stars): ${featuredReviews.length}\n`);

    if (featuredReviews.length > 0) {
      console.log("📝 Sample reviews:\n");
      featuredReviews.slice(0, 3).forEach((review, index) => {
        console.log(`${index + 1}. Review by ${review.reviewer_name}`);
        console.log(`   Rating: ${'⭐'.repeat(review.rating)}`);
        console.log(`   Product: ${review.product?.part_number || 'N/A'}`);
        console.log(`   Comment: ${review.comment?.substring(0, 80)}...`);
        console.log('');
      });
    } else {
      console.log("❌ No reviews found! Run: node seedReviews.js\n");
    }

    // Test the exact query used by the API
    console.log("🔍 Testing API endpoint query...\n");
    const apiResponse = {
      success: true,
      data: featuredReviews.map(r => r.toJSON()),
      total: featuredReviews.length
    };

    console.log("✅ API Response structure:");
    console.log(`   success: ${apiResponse.success}`);
    console.log(`   data: Array(${apiResponse.data.length})`);
    console.log(`   total: ${apiResponse.total}\n`);

    if (apiResponse.data.length > 0) {
      console.log("📦 First review data structure:");
      const firstReview = apiResponse.data[0];
      console.log(`   id: ${firstReview.id}`);
      console.log(`   rating: ${firstReview.rating}`);
      console.log(`   reviewer_name: ${firstReview.reviewer_name}`);
      console.log(`   reviewer_name: ${firstReview.reviewer_name}`);
      console.log(`   product: ${firstReview.product ? 'Yes' : 'No'}`);
      console.log(`   createdAt: ${firstReview.createdAt}`);
    }

    console.log("\n✨ Test completed successfully!");
    
    process.exit(0);
  } catch (error) {
    console.error("❌ Test failed:", error);
    process.exit(1);
  }
}

testReviewsAPI();
