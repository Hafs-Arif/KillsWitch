const { Coupon } = require('../models');

// Admin-only crud

exports.getAllCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.findAll({ order: [['createdAt', 'DESC']] });
    res.json({ success: true, data: coupons });
  } catch (err) {
    console.error('Error fetching coupons:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.getCouponById = async (req, res) => {
  try {
    const coupon = await Coupon.findByPk(req.params.id);
    if (!coupon) {
      return res.status(404).json({ success: false, error: 'Coupon not found' });
    }
    res.json({ success: true, data: coupon });
  } catch (err) {
    console.error('Error fetching coupon:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.createCoupon = async (req, res) => {
  try {
    const {
      code,
      description,
      discount_type,
      discount_value,
      min_purchase_amount,
      max_uses,
      expires_at,
      is_active,
    } = req.body;

    if (!code || !code.toString().trim()) {
      return res.status(400).json({ success: false, error: 'Code is required' });
    }

    // ensure uppercase trimmed code
    const cleanCode = code.toString().trim().toUpperCase();
    const exists = await Coupon.findOne({ where: { code: cleanCode } });
    if (exists) {
      return res.status(400).json({ success: false, error: 'Coupon code already exists' });
    }

    const coupon = await Coupon.create({
      code: cleanCode,
      description,
      discount_type,
      discount_value,
      min_purchase_amount,
      max_uses,
      expires_at,
      is_active: typeof is_active === 'boolean' ? is_active : true,
    });

    res.status(201).json({ success: true, data: coupon });
  } catch (err) {
    console.error('Error creating coupon:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.updateCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findByPk(req.params.id);
    if (!coupon) {
      return res.status(404).json({ success: false, error: 'Coupon not found' });
    }

    const updates = { ...req.body };
    if (updates.code) {
      updates.code = updates.code.toString().trim().toUpperCase();
      // if changing code ensure uniqueness
      const exists = await Coupon.findOne({ where: { code: updates.code, id: { [require('sequelize').Op.ne]: coupon.id } } });
      if (exists) {
        return res.status(400).json({ success: false, error: 'Another coupon already uses that code' });
      }
    }

    Object.assign(coupon, updates);
    await coupon.save();
    res.json({ success: true, data: coupon });
  } catch (err) {
    console.error('Error updating coupon:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.deleteCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findByPk(req.params.id);
    if (!coupon) {
      return res.status(404).json({ success: false, error: 'Coupon not found' });
    }
    await coupon.destroy();
    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting coupon:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// validate a coupon code and optionally calculate discount based on subtotal
exports.validateCoupon = async (req, res) => {
  try {
    const code = (req.query.code || '').toString().trim().toUpperCase();
    const subtotal = parseFloat(req.query.subtotal) || 0;
    if (!code) {
      return res.status(400).json({ success: false, error: 'Coupon code is required' });
    }
    const coupon = await Coupon.findOne({ where: { code, is_active: true } });
    if (!coupon) {
      return res.json({ success: true, valid: false });
    }

    const now = new Date();
    if (
      (coupon.expires_at && new Date(coupon.expires_at) < now) ||
      (coupon.min_purchase_amount && subtotal < coupon.min_purchase_amount) ||
      (coupon.max_uses && coupon.uses_count >= coupon.max_uses)
    ) {
      return res.json({ success: true, valid: false });
    }

    let discount = 0;
    if (coupon.discount_type === 'percentage') {
      discount = +(subtotal * (coupon.discount_value / 100)).toFixed(2);
    } else {
      discount = +coupon.discount_value;
    }
    discount = Math.min(discount, subtotal);

    res.json({ success: true, valid: true, discount, coupon });
  } catch (err) {
    console.error('Error validating coupon:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};
