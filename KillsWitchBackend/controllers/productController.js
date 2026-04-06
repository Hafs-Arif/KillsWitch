const {
  product,
  brandcategory,
  category,
  subcategory,
  brand,
  ProductImage,
  Review,
} = require("../models");
const {
  uploadToCloudinary,
  deleteFromCloudinary,
  extractPublicId,
  uploadMultipleToCloudinary,
  deleteMultipleFromCloudinary, 
} = require("../utils/cloudinaryHelper");

exports.findAllProducts = async (req, res) => {
  try {
    const products = await product.findAll({
      include: [
        {
          model: brandcategory,
          as: "brandcategory",
          include: [
            {
              model: brand,
              as: "brand",
              attributes: ["brand_id", "brand_name"],
            },
            {
              model: category,
              as: "category",
              attributes: ["product_category_id", "category_name"],
            },
            {
              model: subcategory,
              as: "subcategory",
              attributes: ["sub_category_id", "sub_category_name"],
            },
          ],
        },
        {
          model: ProductImage,
          as: "images",
          attributes: ["id", "url"]
        },
        {
          model: Review,
          as: "reviews",
          attributes: ["id", "rating", "title", "comment", "reviewer_name", "createdAt"],
          required: false
        },
      ],
      order: [["product_id", "ASC"]],
    });

    const data = products.map((p) => ({
      product_product_id: p.product_id,
      product_part_number: p.part_number,
      product_price: p.price,
      product_image: p.image,
      product_quantity: p.quantity,
      product_short_description: p.short_description,
      product_status: p.status,
      product_condition: p.condition,
      product_sub_condition: p.sub_condition,
      product_long_description: p.long_description,
      category_product_category_id:
        p.brandcategory?.category?.product_category_id || null,
      category_category_name: p.brandcategory?.category?.category_name || null,
      brand_brand_id: p.brandcategory?.brand?.brand_id || null,
      brand_brand_name: p.brandcategory?.brand?.brand_name || null,
      sub_category_sub_category_id: p.brandcategory?.subcategory?.sub_category_id || null,
      sub_category_sub_category_name: p.brandcategory?.subcategory?.sub_category_name || null,

      // Normalized category object for frontend convenience
      category: {
        category_id: p.brandcategory?.category?.product_category_id || null,
        category_name: p.brandcategory?.category?.category_name || null
      },
      
      // Additional images
      product_images: p.images || [],
      slug: p.slug || null,
      // New fields
      sale_price: p.sale_price || null,
      video_url: p.video_url || null,
      
      // Reviews
      reviews: p.reviews || [],
      review_count: p.reviews ? p.reviews.length : 0,
      average_rating: p.reviews && p.reviews.length > 0 
        ? (p.reviews.reduce((sum, review) => sum + review.rating, 0) / p.reviews.length).toFixed(1)
        : 0,
      
      // Case specs
      product_model: p.product_model,
      motherboard: p.motherboard,
      material: p.material,
      front_ports: p.front_ports,
      gpu_length: p.gpu_length,
      cpu_height: p.cpu_height,
      hdd_support: p.hdd_support,
      ssd_support: p.ssd_support,
      expansion_slots: p.expansion_slots,
      case_size: p.case_size,
      water_cooling_support: p.water_cooling_support,
      case_fan_support: p.case_fan_support,
      carton_size: p.carton_size,
      loading_capacity: p.loading_capacity,

      // Pump specs
      pump_parameter: p.pump_parameter,
      pump_bearing: p.pump_bearing,
      pump_speed: p.pump_speed,
      pump_interface: p.pump_interface,
      pump_noise: p.pump_noise,
      tdp: p.tdp,
      pipe_length_material: p.pipe_length_material,
      light_effect: p.light_effect,
      drainage_size: p.drainage_size,

      // Fan specs
      fan_size: p.fan_size,
      fan_speed: p.fan_speed,
      fan_voltage: p.fan_voltage,
      fan_interface: p.fan_interface,
      fan_airflow: p.fan_airflow,
      fan_wind_pressure: p.fan_wind_pressure,
      fan_noise: p.fan_noise,
      fan_bearing_type: p.fan_bearing_type,
      fan_power: p.fan_power,
      fan_rated_voltage: p.fan_rated_voltage,

      // Keyboard specs
      axis: p.axis,
      number_of_keys: p.number_of_keys,
      weight: p.weight,
      carton_weight: p.carton_weight,
      package_size: p.package_size,
      carton_size_kb: p.carton_size_kb,
      keycap_technology: p.keycap_technology,
      wire_length: p.wire_length,
      lighting_style: p.lighting_style,
      body_material: p.body_material,

      // Mouse specs
      dpi: p.dpi,
      return_rate: p.return_rate,
      engine_solution: p.engine_solution,
      surface_technology: p.surface_technology,

      // Packaging & Customization
      package: p.package,
      packing: p.packing,
      moq_customization: p.moq_customization,
      customization_options: p.customization_options,
    }));
    res.json(data);
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
};

exports.findProductById = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`=== FINDING PRODUCT BY ID: ${id} ===`);
    
    const productData = await product.findByPk(id, {
      include: [
        {
          model: brandcategory,
          as: "brandcategory",
          include: [
            {
              model: brand,
              as: "brand",
              attributes: ["brand_id", "brand_name"],
            },
            {
              model: category,
              as: "category",
              attributes: ["product_category_id", "category_name"],
            },
            {
              model: subcategory,
              as: "subcategory",
              attributes: ["sub_category_id", "sub_category_name"],
            },
          ],
        },
        {
          model: ProductImage,
          as: "images",
          attributes: ["id", "url"]
        },
        {
          model: Review,
          as: "reviews",
          attributes: ["id", "rating", "title", "comment", "reviewer_name", "createdAt"],
          required: false
        },
      ],
    });

    if (!productData) {
      console.log(`Product with ID ${id} not found`);
      return res.status(404).json({ error: "Product not found" });
    }

    console.log('Raw product data from DB:', {
      id: productData.product_id,
      mainImage: productData.image,
      additionalImages: productData.images,
      additionalImagesCount: productData.images ? productData.images.length : 0
    });

    const data = {
      product_product_id: productData.product_id,
      product_part_number: productData.part_number,
      product_price: productData.price,
      product_image: productData.image,
      product_quantity: productData.quantity,
      product_short_description: productData.short_description,
      product_status: productData.status,
      product_condition: productData.condition,
      product_sub_condition: productData.sub_condition,
      product_long_description: productData.long_description,
      category_product_category_id:
        productData.brandcategory?.category?.product_category_id || null,
      category_category_name: productData.brandcategory?.category?.category_name || null,
      brand_brand_id: productData.brandcategory?.brand?.brand_id || null,
      brand_brand_name: productData.brandcategory?.brand?.brand_name || null,
      sub_category_sub_category_id: productData.brandcategory?.subcategory?.sub_category_id || null,
      sub_category_sub_category_name: productData.brandcategory?.subcategory?.sub_category_name || null,

      // Normalized category object for frontend convenience
      category: {
        category_id: productData.brandcategory?.category?.product_category_id || null,
        category_name: productData.brandcategory?.category?.category_name || null
      },
      
      // Additional images
      product_images: productData.images || [],
      // Slug
      slug: productData.slug || null,
      // New fields
      sale_price: productData.sale_price || null,
      video_url: productData.video_url || null,
      
      // Reviews
      reviews: productData.reviews || [],
      review_count: productData.reviews ? productData.reviews.length : 0,
      average_rating: productData.reviews && productData.reviews.length > 0 
        ? (productData.reviews.reduce((sum, review) => sum + review.rating, 0) / productData.reviews.length).toFixed(1)
        : 0,
      
      // All specification fields
      product_model: productData.product_model,
      motherboard: productData.motherboard,
      material: productData.material,
      front_ports: productData.front_ports,
      gpu_length: productData.gpu_length,
      cpu_height: productData.cpu_height,
      hdd_support: productData.hdd_support,
      ssd_support: productData.ssd_support,
      expansion_slots: productData.expansion_slots,
      case_size: productData.case_size,
      water_cooling_support: productData.water_cooling_support,
      case_fan_support: productData.case_fan_support,
      carton_size: productData.carton_size,
      loading_capacity: productData.loading_capacity,
      pump_parameter: productData.pump_parameter,
      pump_bearing: productData.pump_bearing,
      pump_speed: productData.pump_speed,
      pump_interface: productData.pump_interface,
      pump_noise: productData.pump_noise,
      tdp: productData.tdp,
      pipe_length_material: productData.pipe_length_material,
      light_effect: productData.light_effect,
      drainage_size: productData.drainage_size,
      fan_size: productData.fan_size,
      fan_speed: productData.fan_speed,
      fan_voltage: productData.fan_voltage,
      fan_interface: productData.fan_interface,
      fan_airflow: productData.fan_airflow,
      fan_wind_pressure: productData.fan_wind_pressure,
      fan_noise: productData.fan_noise,
      fan_bearing_type: productData.fan_bearing_type,
      fan_power: productData.fan_power,
      fan_rated_voltage: productData.fan_rated_voltage,
      axis: productData.axis,
      number_of_keys: productData.number_of_keys,
      weight: productData.weight,
      carton_weight: productData.carton_weight,
      package_size: productData.package_size,
      carton_size_kb: productData.carton_size_kb,
      keycap_technology: productData.keycap_technology,
      wire_length: productData.wire_length,
      lighting_style: productData.lighting_style,
      body_material: productData.body_material,
      dpi: productData.dpi,
      return_rate: productData.return_rate,
      engine_solution: productData.engine_solution,
      surface_technology: productData.surface_technology,
      package: productData.package,
      packing: productData.packing,
      moq_customization: productData.moq_customization,
      customization_options: productData.customization_options,
    };

    console.log('Formatted response data:', {
      id: data.product_product_id,
      mainImage: data.product_image,
      additionalImages: data.product_images,
      additionalImagesCount: data.product_images ? data.product_images.length : 0
    });
    console.log(`=== END FINDING PRODUCT BY ID: ${id} ===`);

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.uploadProduct = async (req, res) => {
  try {
    console.log('=== OPTIMIZED PRODUCT UPLOAD REQUEST ===');
    console.log('req.files:', req.files);
    console.log('req.body keys:', Object.keys(req.body));
    
    const files = req.files;
    const mainImageFile = files?.image?.[0];
    const additionalImageFiles = files?.additional_images || [];
    const videoFile = files?.video?.[0];
    
    console.log('Main image file:', mainImageFile ? { name: mainImageFile.originalname, size: mainImageFile.size } : 'None');
    console.log('Additional image files count:', additionalImageFiles.length);
    console.log('Video file:', videoFile ? { name: videoFile.originalname, size: videoFile.size } : 'None');
    
    if (!mainImageFile) {
      return res
        .status(400)
        .json({ success: false, message: "Main image is required" });
    }

    // Check if total images exceed limit (1 main + 9 additional = 10 max)
    if (additionalImageFiles.length > 9) {
      return res
        .status(400)
        .json({ success: false, message: "Maximum 9 additional images allowed (10 total including main image)" });
    }

    const {
      brand_name,
      category_name,
      sub_category_name,
      price,
      sale_price,
      quantity,
      short_description,
      status,
      part_number,
      condition,
      sub_condition,
      long_description,
      
      // New specification fields
      product_model,
      motherboard,
      material,
      front_ports,
      gpu_length,
      cpu_height,
      hdd_support,
      ssd_support,
      expansion_slots,
      case_size,
      water_cooling_support,
      case_fan_support,
      carton_size,
      loading_capacity,
      
      // Pump specs
      pump_parameter,
      pump_bearing,
      pump_speed,
      pump_interface,
      pump_noise,
      tdp,
      pipe_length_material,
      light_effect,
      drainage_size,
      
      // Fan specs
      fan_size,
      fan_speed,
      fan_voltage,
      fan_interface,
      fan_airflow,
      fan_wind_pressure,
      fan_noise,
      fan_bearing_type,
      fan_power,
      fan_rated_voltage,
      
      // Keyboard specs
      axis,
      number_of_keys,
      weight,
      carton_weight,
      package_size,
      carton_size_kb,
      keycap_technology,
      wire_length,
      lighting_style,
      body_material,
      
      // Mouse specs
      dpi,
      return_rate,
      engine_solution,
      surface_technology,
      
      // Packaging & Customization
      package: packageType,
      packing,
      moq_customization,
      customization_options
    } = req.body;
    
    // Generate slug from part_number or product_model
    const generateSlug = (text) => {
      return text
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .substring(0, 50);
    };
    // Allow admin to provide a custom slug; otherwise generate from part_number/product_model
    const providedSlug = (req.body.slug || "").toString().trim();
    const baseSlug = providedSlug ? generateSlug(providedSlug) : generateSlug(part_number || product_model || `product-${Date.now()}`);
    let slug = baseSlug;
    let slugExists = await product.findOne({ where: { slug } });
    let counter = 1;
    while (slugExists) {
      slug = `${baseSlug}-${counter}`;
      slugExists = await product.findOne({ where: { slug } });
      counter++;
    }

    // ⚡ PERFORMANCE OPTIMIZATION: Parallel database queries instead of sequential
    console.log('🚀 Starting parallel database validation...');
    const [brands, categorys, subCategory] = await Promise.all([
      brand.findOne({ where: { brand_name } }),
      category.findOne({ where: { category_name } }),
      subcategory.findOne({ where: { sub_category_name } })
    ]);

    // Validate results
    if (!brands) {
      return res.status(404).json({ 
        success: false, 
        message: `Brand '${brand_name}' not found.` 
      });
    }
    if (!categorys) {
      return res.status(404).json({
        success: false,
        message: `Category '${category_name}' not found.`,
      });
    }
    if (!subCategory) {
      return res.status(404).json({
        success: false,
        message: `Subcategory '${sub_category_name}' not found.`,
      });
    }

    // Find brand-category relationship
    const brandCategory = await brandcategory.findOne({
      where: {
        brand_id: brands.brand_id,
        category_id: categorys.product_category_id,
        sub_category_id: subCategory.sub_category_id,
      },
    });
    
    if (!brandCategory) {
      return res.status(404).json({
        success: false,
        message: `No brand-category-subcategory relation found for ${brand_name} -> ${category_name} -> ${sub_category_name}.`,
      });
    }

    // ⚡ PERFORMANCE OPTIMIZATION: Parallel image uploads + video upload
    console.log('🚀 Starting parallel media uploads...');
    const mediaUploadPromises = [];
    
    // Upload main image
    mediaUploadPromises.push(
      uploadToCloudinary(
        mainImageFile.buffer,
        "products",
        mainImageFile.originalname
      ).then(result => ({ type: 'main', result }))
    );
    
    // Upload additional images in parallel
    additionalImageFiles.forEach((imageFile, index) => {
      mediaUploadPromises.push(
        uploadToCloudinary(
          imageFile.buffer,
          "products",
          `additional_${index}_${imageFile.originalname}`
        ).then(result => ({ type: 'additional', result, index }))
      );
    });
    
    // Upload video if provided
    let videoUrl = null;
    if (videoFile) {
      mediaUploadPromises.push(
        uploadToCloudinary(
          videoFile.buffer,
          "product-videos",
          videoFile.originalname,
          { resource_type: 'video', format: 'mp4' }
        ).then(result => ({ type: 'video', result }))
      );
    }
    
    // Wait for all uploads to complete
    const uploadResults = await Promise.all(mediaUploadPromises);
    console.log('✅ All media uploads completed');
    
    // Extract URLs
    const mainImageResult = uploadResults.find(r => r.type === 'main');
    const imageUrl = mainImageResult.result.secure_url;
    const videoResult = uploadResults.find(r => r.type === 'video');
    videoUrl = videoResult ? videoResult.result.secure_url : null;

    // ⚡ Create product with optimized data structure
    console.log('🚀 Creating product record...');
    const newProduct = await product.create({
      image: imageUrl, // ✅ Cloudinary URL stored
      slug,
      price,
      sale_price: sale_price || null,
      video_url: videoUrl,
      quantity,
      short_description,
      status,
      part_number,
      condition,
      sub_condition,
      long_description,
      brandcategoryId: brandCategory.id,
      
      // New specification fields
      product_model,
      motherboard,
      material,
      front_ports,
      gpu_length,
      cpu_height,
      hdd_support,
      ssd_support,
      expansion_slots,
      case_size,
      water_cooling_support,
      case_fan_support,
      carton_size,
      loading_capacity,
      
      // Pump specs
      pump_parameter,
      pump_bearing,
      pump_speed,
      pump_interface,
      pump_noise,
      tdp,
      pipe_length_material,
      light_effect,
      drainage_size,
      
      // Fan specs
      fan_size,
      fan_speed,
      fan_voltage,
      fan_interface,
      fan_airflow,
      fan_wind_pressure,
      fan_noise,
      fan_bearing_type,
      fan_power,
      fan_rated_voltage,
      
      // Keyboard specs
      axis,
      number_of_keys,
      weight,
      carton_weight,
      package_size,
      carton_size_kb,
      keycap_technology,
      wire_length,
      lighting_style,
      body_material,
      
      // Mouse specs
      dpi,
      return_rate,
      engine_solution,
      surface_technology,
      
      // Packaging & Customization
      package: packageType,
      packing,
      moq_customization,
      customization_options,
    });
    console.log('✅ Product created successfully');

    // ⚡ PERFORMANCE OPTIMIZATION: Parallel database inserts for additional images
    const additionalImageResults = uploadResults.filter(r => r.type === 'additional');
    
    if (additionalImageResults.length > 0) {
      console.log(`🚀 Saving ${additionalImageResults.length} additional images to database...`);
      
      const imageInsertPromises = additionalImageResults.map(({ result, index }) => {
        return ProductImage.create({
          url: result.secure_url,
          productId: newProduct.product_id
        });
      });
      
      const savedImages = await Promise.all(imageInsertPromises);
      console.log('✅ All additional images saved to database');
      console.log('Saved images:', savedImages.map(img => ({ id: img.id, url: img.url })));
    } else {
      console.log('No additional images to save');
    }

    return res.status(201).json({
      success: true,
      message: "Product added successfully!",
      product: newProduct,
    });
  } catch (error) {
    console.error("Upload Error:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong",
      error: error.message,
    });
  }
};

exports.updateProduct = async (req, res) => {
  const { id } = req.params;
  const files = req.files;
  const mainImageFile = files?.image?.[0];
  const additionalImageFiles = files?.additional_images || [];
  const videoFile = files?.video?.[0];
  const updateDto = { ...req.body };

  console.log('🔄 Product Update Request:', {
    productId: id,
    requestBody: req.body,
    updateDto: updateDto,
    files: files ? Object.keys(files) : 'none',
    statusUpdate: updateDto.status ? `Updating status to: ${updateDto.status}` : 'No status update'
  });

  try {
    const products = await product.findByPk(id, {
      include: [{ model: ProductImage, as: 'images' }]
    });
    if (!products)
      return res.status(404).json({ message: "Product not found" });

    // ⚡ PERFORMANCE OPTIMIZATION: Handle brand/category/subcategory relationship with parallel queries
    if (updateDto.brand_name || updateDto.category_name || updateDto.sub_category_name) {
      const brand_name = updateDto.brand_name;
      const category_name = updateDto.category_name;
      const sub_category_name = updateDto.sub_category_name;

      if (brand_name && category_name && sub_category_name) {
        console.log('🚀 Starting parallel brand/category validation for update...');
        const [brands, categorys, subCategory] = await Promise.all([
          brand.findOne({ where: { brand_name } }),
          category.findOne({ where: { category_name } }),
          subcategory.findOne({ where: { sub_category_name } })
        ]);

        if (!brands)
          return res.status(404).json({ message: `Brand '${brand_name}' not found.` });
        if (!categorys)
          return res.status(404).json({ message: `Category '${category_name}' not found.` });
        if (!subCategory)
          return res.status(404).json({ message: `Subcategory '${sub_category_name}' not found.` });

        const brandCategory = await brandcategory.findOne({
          where: {
            brand_id: brands.brand_id,
            category_id: categorys.product_category_id,
            sub_category_id: subCategory.sub_category_id,
          },
        });
        if (!brandCategory) {
          return res.status(404).json({
            message: `No brand-category-subcategory relation found for ${brand_name} -> ${category_name} -> ${sub_category_name}.`,
          });
        }

        updateDto.brandcategoryId = brandCategory.id;
        console.log('✅ Brand/category validation completed');
      }

      // Remove the individual fields from updateDto as they're not direct product fields
      delete updateDto.brand_name;
      delete updateDto.category_name;
      delete updateDto.sub_category_name;
    }

    // ⬇️ If a new main image is uploaded, replace on Cloudinary
    if (mainImageFile) {
      // delete old main image from Cloudinary (if present)
      const oldPublicId = extractPublicId(products.image);
      if (oldPublicId) {
        try {
          await deleteFromCloudinary(oldPublicId);
        } catch (_) {}
      }

      // upload new main image to Cloudinary
      const cloud = await uploadToCloudinary(
        mainImageFile.buffer,
        "products",
        mainImageFile.originalname
      );
      updateDto.image = cloud.secure_url; // ✅ save HTTPS URL
    }

    // ⬇️ If a new video file is uploaded, replace on Cloudinary
    if (videoFile) {
      // delete old video from Cloudinary (if present)
      const oldVideoId = extractPublicId(products.video_url);
      if (oldVideoId) {
        try {
          await deleteFromCloudinary(oldVideoId, { resource_type: 'video' });
        } catch (_) {}
      }

      // upload new video
      const cloudVid = await uploadToCloudinary(
        videoFile.buffer,
        "product-videos",
        videoFile.originalname,
        { resource_type: 'video', format: 'mp4' }
      );
      updateDto.video_url = cloudVid.secure_url;
    }

    // ⚡ PERFORMANCE OPTIMIZATION: Handle additional images update with parallel processing
    if (additionalImageFiles && additionalImageFiles.length > 0) {
      // Check if total additional images exceed limit (9 max)
      if (additionalImageFiles.length > 9) {
        return res.status(400).json({ 
          message: "Maximum 9 additional images allowed" 
        });
      }

      console.log('🚀 Starting parallel additional image processing...');
      
      // ⚡ Parallel operations: Delete old images and upload new ones simultaneously
      const operations = [];
      
      // Delete existing additional images from Cloudinary and database
      if (products.images && products.images.length > 0) {
        const deletePromises = products.images.map(async (img) => {
          const imgPublicId = extractPublicId(img.url);
          if (imgPublicId) {
            try {
              await deleteFromCloudinary(imgPublicId);
            } catch (_) {}
          }
          return img.destroy();
        });
        operations.push(Promise.all(deletePromises));
      }
      
      // Upload new additional images in parallel
      const uploadPromises = additionalImageFiles.map(async (imageFile, index) => {
        try {
          const cloud = await uploadToCloudinary(
            imageFile.buffer,
            "products",
            `${id}_additional_${index}_${imageFile.originalname}`
          );
          
          return {
            url: cloud.secure_url,
            productId: id
          };
        } catch (error) {
          console.error(`Error uploading additional image ${index}:`, error);
          throw error;
        }
      });
      
      // Wait for uploads to complete
      const uploadResults = await Promise.all(uploadPromises);
      
      // Wait for deletions to complete (if any)
      if (operations.length > 0) {
        await Promise.all(operations);
      }
      
      // Batch insert new images
      if (uploadResults.length > 0) {
        const insertPromises = uploadResults.map(imageData => 
          ProductImage.create(imageData)
        );
        await Promise.all(insertPromises);
      }
      
      console.log('✅ Additional image processing completed');
    }

    // If slug provided - validate uniqueness (not colliding with other products)
    if (updateDto.slug) {
      const existing = await product.findOne({ where: { slug: updateDto.slug } });
      if (existing && existing.product_id !== products.product_id) {
        return res.status(400).json({ message: 'Slug already in use by another product' });
      }
    }

    console.log('🔄 Updating product in database with:', updateDto);
    await products.update(updateDto);
    console.log('✅ Product updated in database successfully');
    
    // Fetch updated product with full relationships and images
    const updatedProduct = await product.findByPk(id, {
      include: [
        {
          model: brandcategory,
          as: "brandcategory",
          include: [
            {
              model: brand,
              as: "brand",
              attributes: ["brand_id", "brand_name"],
            },
            {
              model: category,
              as: "category",
              attributes: ["product_category_id", "category_name"],
            },
            {
              model: subcategory,
              as: "subcategory",
              attributes: ["sub_category_id", "sub_category_name"],
            },
          ],
        },
        {
          model: ProductImage,
          as: "images",
          attributes: ["id", "url"]
        }
      ]
    });
    
    // Format the response similar to findAllProducts
    const formattedProduct = {
      product_product_id: updatedProduct.product_id,
      product_part_number: updatedProduct.part_number,
      product_price: updatedProduct.price,
      product_image: updatedProduct.image,
      product_quantity: updatedProduct.quantity,
      product_short_description: updatedProduct.short_description,
      product_status: updatedProduct.status,
      product_condition: updatedProduct.condition,
      product_sub_condition: updatedProduct.sub_condition,
      product_long_description: updatedProduct.long_description,
      category_product_category_id: updatedProduct.brandcategory?.category?.product_category_id || null,
      category_category_name: updatedProduct.brandcategory?.category?.category_name || null,
      brand_brand_id: updatedProduct.brandcategory?.brand?.brand_id || null,
      brand_brand_name: updatedProduct.brandcategory?.brand?.brand_name || null,
      sub_category_sub_category_id: updatedProduct.brandcategory?.subcategory?.sub_category_id || null,
      sub_category_sub_category_name: updatedProduct.brandcategory?.subcategory?.sub_category_name || null,
      product_images: updatedProduct.images || [],
      
      // All specification fields
      product_model: updatedProduct.product_model,
      motherboard: updatedProduct.motherboard,
      material: updatedProduct.material,
      front_ports: updatedProduct.front_ports,
      gpu_length: updatedProduct.gpu_length,
      cpu_height: updatedProduct.cpu_height,
      hdd_support: updatedProduct.hdd_support,
      ssd_support: updatedProduct.ssd_support,
      expansion_slots: updatedProduct.expansion_slots,
      case_size: updatedProduct.case_size,
      water_cooling_support: updatedProduct.water_cooling_support,
      case_fan_support: updatedProduct.case_fan_support,
      carton_size: updatedProduct.carton_size,
      loading_capacity: updatedProduct.loading_capacity,
      pump_parameter: updatedProduct.pump_parameter,
      pump_bearing: updatedProduct.pump_bearing,
      pump_speed: updatedProduct.pump_speed,
      pump_interface: updatedProduct.pump_interface,
      pump_noise: updatedProduct.pump_noise,
      tdp: updatedProduct.tdp,
      pipe_length_material: updatedProduct.pipe_length_material,
      light_effect: updatedProduct.light_effect,
      drainage_size: updatedProduct.drainage_size,
      fan_size: updatedProduct.fan_size,
      fan_speed: updatedProduct.fan_speed,
      fan_voltage: updatedProduct.fan_voltage,
      fan_interface: updatedProduct.fan_interface,
      fan_airflow: updatedProduct.fan_airflow,
      fan_wind_pressure: updatedProduct.fan_wind_pressure,
      fan_noise: updatedProduct.fan_noise,
      fan_bearing_type: updatedProduct.fan_bearing_type,
      fan_power: updatedProduct.fan_power,
      fan_rated_voltage: updatedProduct.fan_rated_voltage,
      axis: updatedProduct.axis,
      number_of_keys: updatedProduct.number_of_keys,
      weight: updatedProduct.weight,
      carton_weight: updatedProduct.carton_weight,
      package_size: updatedProduct.package_size,
      carton_size_kb: updatedProduct.carton_size_kb,
      keycap_technology: updatedProduct.keycap_technology,
      wire_length: updatedProduct.wire_length,
      lighting_style: updatedProduct.lighting_style,
      body_material: updatedProduct.body_material,
      dpi: updatedProduct.dpi,
      return_rate: updatedProduct.return_rate,
      engine_solution: updatedProduct.engine_solution,
      surface_technology: updatedProduct.surface_technology,
      package: updatedProduct.package,
      packing: updatedProduct.packing,
      moq_customization: updatedProduct.moq_customization,
      customization_options: updatedProduct.customization_options,
    };
    
    return res.json({ 
      message: "Product updated successfully", 
      product: formattedProduct 
    });
  } catch (error) {
    console.error("Update error:", error.message);
    return res.status(500).json({ message: "Internal server error" });
  }
};

exports.deleteProduct = async (req, res) => {
  const { id } = req.params;

  try {
    const products = await product.findByPk(id, {
      include: [{ model: ProductImage, as: 'images' }]
    });
    if (!products)
      return res.status(404).json({ message: "Product not found" });

    // ⬇️ Delete main image from Cloudinary if exists
    const publicId = extractPublicId(products.image);
    if (publicId) {
      try {
        await deleteFromCloudinary(publicId);
      } catch (_) {}
    }

    // ⬇️ Delete additional images from Cloudinary
    if (products.images && products.images.length > 0) {
      const deletePromises = products.images.map(async (img) => {
        const imgPublicId = extractPublicId(img.url);
        if (imgPublicId) {
          try {
            await deleteFromCloudinary(imgPublicId);
          } catch (_) {}
        }
      });
      await Promise.all(deletePromises);
    }

    await products.destroy();
    return res.json({ message: "Product deleted successfully" });
  } catch (error) {
    console.error("Delete error:", error.message);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// New function to add additional images to a product
exports.addProductImages = async (req, res) => {
  const { productId } = req.params;
  const files = req.files;

  try {
    const productExists = await product.findByPk(productId);
    if (!productExists) {
      return res.status(404).json({ message: "Product not found" });
    }

    if (!files || files.length === 0) {
      return res.status(400).json({ message: "No images provided" });
    }

    // Upload all images to Cloudinary
    const cloudResults = await uploadMultipleToCloudinary(files, "products");

    // Create ProductImage records
    const imagePromises = cloudResults.map((cloud) => {
      return ProductImage.create({
        url: cloud.secure_url,
        productId: productId
      });
    });

    const newImages = await Promise.all(imagePromises);

    return res.status(201).json({
      success: true,
      message: "Images added successfully",
      images: newImages
    });
  } catch (error) {
    console.error("Add images error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// New function to delete a specific product image
exports.deleteProductImage = async (req, res) => {
  const { imageId } = req.params;

  try {
    const productImage = await ProductImage.findByPk(imageId);
    if (!productImage) {
      return res.status(404).json({ message: "Image not found" });
    }

    // Delete from Cloudinary
    const publicId = extractPublicId(productImage.url);
    if (publicId) {
      try {
        await deleteFromCloudinary(publicId);
      } catch (_) {}
    }

    await productImage.destroy();
    return res.json({ message: "Image deleted successfully" });
  } catch (error) {
    console.error("Delete image error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
