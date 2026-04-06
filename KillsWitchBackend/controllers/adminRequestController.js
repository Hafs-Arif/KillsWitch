const { AdminRequest, Order, Shipment, OrderItem, User } = require('../models');


const createAdminRequest = async (req, res) => {
  try {
    const data = req.body;

    const orderExists = await Order.findOne({ where: { order_id: data.order_id } });

    if (!orderExists) {
      return res.status(404).json({ message: 'Order not found' });
    }
    const newRequest = await AdminRequest.create(data);

    res.status(201).json({
      message: 'Admin request created successfully',
      data: newRequest
    });
  } catch (error) {
    console.error('Error creating admin request:', error);
    res.status(500).json({ message: 'Server error' });
  }
};


const updateApprovalStatus = async (req, res) => {
  try {
    const { admin_req_id, isApproved, order_id } = req.body;

    const adminReq = await AdminRequest.findOne({
      where: { admin_request_id: admin_req_id }
    });

    if (!adminReq) {
      return res.status(404).json({ message: 'Request not found' });
    }

    adminReq.IsApproved = isApproved;
    await adminReq.save(); // Save approval status

    if (isApproved === true) {
      const order = await Order.findOne({
        where: { order_id },
        include: [
          { model: Shipment, as: 'shipment' },
          { model: User, as: 'user' },
          { model: OrderItem, as: 'orderItem' }
        ]
      });

      if (order && order.shipment) {
        order.shipment.shippingAddress = adminReq.updatedshippingAddress;
        order.shipment.shippingPhone = adminReq.updatedshippingPhone;
        await order.shipment.save(); // Save shipment changes
      }
    }

    return res.status(200).json({ success: true, message: 'Approval status updated successfully.' });

  } catch (error) {
    console.error('Error updating approval:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};
const findAllAdminRequests = async (req, res) => {
    try {
      const requests = await AdminRequest.findAll();
      res.status(200).json(requests);
    } catch (error) {
      console.error('Error fetching admin requests:', error);
      res.status(500).json({ message: 'Server error' });
    }
  };
  
  
module.exports = { updateApprovalStatus, findAllAdminRequests, createAdminRequest };
