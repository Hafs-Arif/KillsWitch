const db = require("./models");

async function seedReviews() {
  try {
    console.log("🌱 Starting review seeding...");

    // Connect to database
    await db.sequelize.authenticate();
    console.log("✅ Database connected");

    // Get all products
    const products = await db.product.findAll({
      limit: 10,
      attributes: ['product_id', 'part_number']
    });

    if (products.length === 0) {
      console.log("❌ No products found. Please add products first.");
      process.exit(1);
    }

    console.log(`📦 Found ${products.length} products`);

    // Sample reviews data
    const reviewsData = [
      {
        rating: 5,
        comment: "This hardware exceeded my expectations. The performance is outstanding and it handles all my games at max settings without any issues. Highly recommended for serious gamers!",
        reviewer_name: "Alex Johnson"
      },
      {
        rating: 5,
        comment: "Amazing quality and super fast delivery. The product works flawlessly and the build quality is top-notch. Worth every penny!",
        reviewer_name: "Sarah Williams"
      },
      {
        rating: 4,
        comment: "Very satisfied with this purchase. The performance is great and it's very reliable. Only minor issue was the setup instructions could be clearer.",
        reviewer_name: "Michael Chen"
      },
      {
        rating: 5,
        comment: "This is exactly what I needed for competitive gaming. Zero lag, excellent response time, and very durable. My game performance has improved significantly!",
        reviewer_name: "Jessica Martinez"
      },
      {
        rating: 4,
        comment: "Good product overall. Does what it's supposed to do and hasn't let me down. The cooling is efficient and it runs quietly.",
        reviewer_name: "David Thompson"
      },
      {
        rating: 5,
        comment: "The build quality is exceptional. You can tell this was made with gamers in mind. Every detail is well thought out and it performs beautifully.",
        reviewer_name: "Emily Rodriguez"
      },
      {
        rating: 5,
        comment: "Been using this for 3 months now and it's been flawless. Great performance, great price, great support. Can't ask for more!",
        reviewer_name: "James Wilson"
      },
      {
        rating: 4,
        comment: "Really happy with this purchase. The performance is excellent and it's very well made. Shipping was fast too!",
        reviewer_name: "Lisa Anderson"
      },
      {
        rating: 5,
        comment: "This product literally changed my gaming experience. Everything runs smoother, faster, and more stable. Best upgrade I've made this year!",
        reviewer_name: "Robert Taylor"
      },
      {
        rating: 5,
        comment: "Top-tier quality and performance. The difference is noticeable immediately. If you're serious about gaming, this is a must-have.",
        reviewer_name: "Amanda Brown"
      },
      {
        rating: 4,
        comment: "Excellent product for the price. Works perfectly and the quality is better than expected. Very pleased with this purchase.",
        reviewer_name: "Christopher Lee"
      },
      {
        rating: 5,
        comment: "This is professional-grade equipment at a reasonable price. The performance is incredible and it's built to last. Absolutely love it!",
        reviewer_name: "Jennifer Garcia"
      },
      {
        rating: 5,
        comment: "Everything about this product is perfect. From the packaging to the performance, it's all top quality. Will definitely buy from KillSwitch again!",
        reviewer_name: "Daniel Martinez"
      },
      {
        rating: 4,
        comment: "Great product that delivers on its promises. The performance is solid and it's very reliable. Good customer service too!",
        reviewer_name: "Michelle White"
      },
      {
        rating: 5,
        comment: "I had high expectations and this product exceeded them all. The quality, performance, and reliability are all outstanding. Highly recommend!",
        reviewer_name: "Kevin Harris"
      }
    ];

    let createdCount = 0;

    // Create reviews for random products
    for (const reviewData of reviewsData) {
      // Pick a random product
      const randomProduct = products[Math.floor(Math.random() * products.length)];
      
      try {
        await db.Review.create({
          ...reviewData,
          productId: randomProduct.product_id,
          userId: null // Anonymous reviews
        });
        
        createdCount++;
        console.log(`✅ Created review ${createdCount}/${reviewsData.length} for product: ${randomProduct.part_number}`);
      } catch (error) {
        console.error(`❌ Error creating review: ${error.message}`);
      }
    }

    console.log(`\n🎉 Successfully created ${createdCount} reviews!`);
    console.log("✨ Review seeding completed!");
    
    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding reviews:", error);
    process.exit(1);
  }
}

seedReviews();
