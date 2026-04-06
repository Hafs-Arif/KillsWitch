const { Review, product, User } = require("../models");
const { Op } = require("sequelize");

// Get all reviews with optional filtering
exports.getAllReviews = async (req, res) => {
  try {
    const { productId, userId, rating, page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'DESC' } = req.query;
    
    const whereClause = {};
    const includeClause = [
      {
        model: product,
        as: 'product',
        attributes: ['product_id', 'part_number', 'short_description', 'image']
      },
      {
        model: User,
        as: 'user',
        attributes: ['id', 'name', 'email'],
        required: false
      }
    ];

    // Apply filters
    if (productId) whereClause.productId = productId;
    if (userId) whereClause.userId = userId;
    if (rating) whereClause.rating = rating;

    const offset = (page - 1) * limit;

    const reviews = await Review.findAndCountAll({
      where: whereClause,
      include: includeClause,
      order: [[sortBy, sortOrder.toUpperCase()]],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      data: reviews.rows,
      pagination: {
        total: reviews.count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(reviews.count / limit)
      }
    });
  } catch (error) {
    console.error("Get reviews error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Internal server error",
      error: error.message 
    });
  }
};

// Get a single review by ID
exports.getReviewById = async (req, res) => {
  try {
    const { id } = req.params;

    const review = await Review.findByPk(id, {
      include: [
        {
          model: product,
          as: 'product',
          attributes: ['product_id', 'part_number', 'short_description', 'image']
        },
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email'],
          required: false
        }
      ]
    });

    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found"
      });
    }

    res.json({
      success: true,
      data: review
    });
  } catch (error) {
    console.error("Get review error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Internal server error",
      error: error.message 
    });
  }
};

// Get reviews for a specific product
exports.getProductReviews = async (req, res) => {
  try {
    const { productId } = req.params;
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'DESC' } = req.query;

    // Check if product exists
    const productExists = await product.findByPk(productId);
    if (!productExists) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }

    const offset = (page - 1) * limit;

    const reviews = await Review.findAndCountAll({
      where: { productId },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email'],
          required: false
        }
      ],
      order: [[sortBy, sortOrder.toUpperCase()]],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    // Calculate average rating
    const avgRating = await Review.findOne({
      where: { productId },
      attributes: [
        [Review.sequelize.fn('AVG', Review.sequelize.col('rating')), 'averageRating'],
        [Review.sequelize.fn('COUNT', Review.sequelize.col('id')), 'totalReviews']
      ],
      raw: true
    });

    res.json({
      success: true,
      data: reviews.rows,
      averageRating: parseFloat(avgRating.averageRating || 0).toFixed(1),
      totalReviews: parseInt(avgRating.totalReviews || 0),
      pagination: {
        total: reviews.count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(reviews.count / limit)
      }
    });
  } catch (error) {
    console.error("Get product reviews error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Internal server error",
      error: error.message 
    });
  }
};

// Create a new review
exports.createReview = async (req, res) => {
  try {
    const { productId, rating, comment, reviewer_name, userId } = req.body;

    // Validate required fields
    if (!productId || !rating) {
      return res.status(400).json({
        success: false,
        message: "Product ID and rating are required"
      });
    }

    // Validate rating range
    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: "Rating must be between 1 and 5"
      });
    }

    // Check if product exists
    const productExists = await product.findByPk(productId);
    if (!productExists) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }

    // Get user information from authenticated user (req.user from auth middleware)
    let authenticatedUserId = null;
    let authenticatedUserName = null;

    if (req.user && req.user.id) {
      // User is authenticated, get their information
      const authenticatedUser = await User.findByPk(req.user.id);
      if (authenticatedUser) {
        authenticatedUserId = authenticatedUser.id;
        authenticatedUserName = authenticatedUser.name;
        
        // Check if user has already reviewed this product
        const existingReview = await Review.findOne({
          where: { productId, userId: authenticatedUserId }
        });

        if (existingReview) {
          return res.status(400).json({
            success: false,
            message: "You have already reviewed this product"
          });
        }
      }
    }

    // Determine reviewer name. If user provided a name in the payload, use it; otherwise fall back
    // to the authenticated user's registered name (if any), and finally a generic default.
    const finalReviewerName = (reviewer_name && reviewer_name.trim())
      ? reviewer_name.trim()
      : authenticatedUserName || "Anonymous User";
    const finalUserId = authenticatedUserId || userId || null;

    const review = await Review.create({
      productId,
      rating,
      comment,
      reviewer_name: finalReviewerName,
      userId: finalUserId
    });

    // Fetch the created review with associations
    const createdReview = await Review.findByPk(review.id, {
      include: [
        {
          model: product,
          as: 'product',
          attributes: ['product_id', 'part_number', 'short_description', 'image']
        },
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email'],
          required: false
        }
      ]
    });

    res.status(201).json({
      success: true,
      message: "Review created successfully",
      data: createdReview
    });
  } catch (error) {
    console.error("Create review error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Internal server error",
      error: error.message 
    });
  }
};

// Update a review
exports.updateReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, comment, reviewer_name } = req.body;

    const review = await Review.findByPk(id);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found"
      });
    }

    // Validate rating if provided
    if (rating && (rating < 1 || rating > 5)) {
      return res.status(400).json({
        success: false,
        message: "Rating must be between 1 and 5"
      });
    }

    // Update only provided fields
    const updateData = {};
    if (rating !== undefined) updateData.rating = rating;
    if (comment !== undefined) updateData.comment = comment;
    if (reviewer_name !== undefined) updateData.reviewer_name = reviewer_name;

    await review.update(updateData);

    // Fetch updated review with associations
    const updatedReview = await Review.findByPk(id, {
      include: [
        {
          model: product,
          as: 'product',
          attributes: ['product_id', 'part_number', 'short_description', 'image']
        },
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email'],
          required: false
        }
      ]
    });

    res.json({
      success: true,
      message: "Review updated successfully",
      data: updatedReview
    });
  } catch (error) {
    console.error("Update review error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Internal server error",
      error: error.message 
    });
  }
};

// Delete a review
exports.deleteReview = async (req, res) => {
  try {
    const { id } = req.params;

    const review = await Review.findByPk(id);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found"
      });
    }

    await review.destroy();

    res.json({
      success: true,
      message: "Review deleted successfully"
    });
  } catch (error) {
    console.error("Delete review error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Internal server error",
      error: error.message 
    });
  }
};

// Get review statistics for a product
exports.getProductReviewStats = async (req, res) => {
  try {
    const { productId } = req.params;

    // Check if product exists
    const productExists = await product.findByPk(productId);
    if (!productExists) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }

    const stats = await Review.findOne({
      where: { productId },
      attributes: [
        [Review.sequelize.fn('AVG', Review.sequelize.col('rating')), 'averageRating'],
        [Review.sequelize.fn('COUNT', Review.sequelize.col('id')), 'totalReviews'],
        [Review.sequelize.fn('MIN', Review.sequelize.col('rating')), 'minRating'],
        [Review.sequelize.fn('MAX', Review.sequelize.col('rating')), 'maxRating']
      ],
      raw: true
    });

    // Get rating distribution
    const ratingDistribution = await Review.findAll({
      where: { productId },
      attributes: [
        'rating',
        [Review.sequelize.fn('COUNT', Review.sequelize.col('id')), 'count']
      ],
      group: ['rating'],
      order: [['rating', 'ASC']],
      raw: true
    });

    res.json({
      success: true,
      data: {
        averageRating: parseFloat(stats.averageRating || 0).toFixed(1),
        totalReviews: parseInt(stats.totalReviews || 0),
        minRating: parseInt(stats.minRating || 0),
        maxRating: parseInt(stats.maxRating || 0),
        ratingDistribution: ratingDistribution.reduce((acc, item) => {
          acc[item.rating] = parseInt(item.count);
          return acc;
        }, {})
      }
    });
  } catch (error) {
    console.error("Get review stats error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Internal server error",
      error: error.message 
    });
  }
};

// Get featured reviews for homepage/about page
exports.getFeaturedReviews = async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    // Get top-rated reviews (4-5 stars) with product and user info
    const reviews = await Review.findAll({
      where: {
        rating: {
          [Op.gte]: 4 // Only 4 and 5 star reviews
        }
      },
      include: [
        {
          model: product,
          as: 'product',
          attributes: ['product_id', 'part_number', 'short_description', 'image', 'price']
        },
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name'],
          required: false
        }
      ],
      order: [
        ['rating', 'DESC'],
        ['createdAt', 'DESC']
      ],
      limit: parseInt(limit)
    });

    res.json({
      success: true,
      data: reviews,
      total: reviews.length
    });
  } catch (error) {
    console.error("Get featured reviews error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Internal server error",
      error: error.message 
    });
  }
};
