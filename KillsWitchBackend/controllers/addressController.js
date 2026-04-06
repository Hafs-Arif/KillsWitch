const { Address, User } = require("../models");

// Get all addresses for logged-in user
exports.getUserAddresses = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const addresses = await Address.findAll({
      where: { userId: req.user.id },
      order: [['createdAt', 'DESC']]
    });

    return res.json({ success: true, addresses });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// Save or update an address
exports.saveAddress = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id, type, name, company, phone, address, city, state, country, email, isDefault } = req.body;

    if (!type || !name || !phone || !address || !city || !state || !country || !email) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    let savedAddress;
    if (id) {
      // Update existing address
      await Address.update(
        {
          type,
          name,
          company,
          phone,
          address,
          city,
          state,
          country,
          email,
          isDefault: isDefault || false
        },
        { where: { id, userId: req.user.id } }
      );
      savedAddress = await Address.findByPk(id);
    } else {
      // Create new address
      savedAddress = await Address.create({
        userId: req.user.id,
        type,
        name,
        company,
        phone,
        address,
        city,
        state,
        country,
        email,
        isDefault: isDefault || false
      });
    }

    return res.json({ success: true, address: savedAddress });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// Delete an address
exports.deleteAddress = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;

    const deleted = await Address.destroy({
      where: { id, userId: req.user.id }
    });

    if (!deleted) {
      return res.status(404).json({ error: 'Address not found' });
    }

    return res.json({ success: true, message: 'Address deleted' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// Get address by ID
exports.getAddress = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;

    const address = await Address.findOne({
      where: { id, userId: req.user.id }
    });

    if (!address) {
      return res.status(404).json({ error: 'Address not found' });
    }

    return res.json({ success: true, address });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
