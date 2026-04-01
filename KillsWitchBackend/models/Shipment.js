const { query } = require("../config/db");

class ShipmentModel {
  static async create(shipmentId, data) {
    const {
      shippingName, shippingPhone, shippingMethod, shippingAddress, shippingDate,
      shippingCity, shippingState, shippingCountry, shippingCompany,
      billingAddress, billingName, billingCompany, billingPhone, billingCity, billingState, billingCountry
    } = data;

    await query(
      `INSERT INTO shipments (shipment_id, shipping_name, shipping_phone, shipping_method, shipping_address,
                               shipping_date, shipping_city, shipping_state, shipping_country, shipping_company,
                               billing_address, billing_name, billing_company, billing_phone, billing_city, billing_state, billing_country)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)`,
      [shipmentId, shippingName, shippingPhone, shippingMethod, shippingAddress, shippingDate,
       shippingCity, shippingState, shippingCountry, shippingCompany,
       billingAddress, billingName, billingCompany, billingPhone, billingCity, billingState, billingCountry]
    );
  }
}

module.exports = { ShipmentModel };