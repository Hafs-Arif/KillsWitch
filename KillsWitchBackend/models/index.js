const ProductImage = require("./ProductImage");

// models/index.js
require("dotenv").config();

module.exports = {
  ActivityLog: require("./ActivityLog"),
  Address: require("./Address"),
  Cart: require("./cart").CartModel,
  CartItem: require("./cartitem").CartItemModel,
  Order: require("./order").OrderModel,
  OrderItem: require("./orderitem").OrderItemModel,
  Brand: require("./brand").BrandModel,
  Category: require("./Category").CategoryModel,
  Subcategory: require("./subcategory").SubcategoryModel,
  BrandCategory: require("./brandcategory").BrandCategoryModel,
  User: require("./User").UserModel,
  Session: require("./Session").SessionModel,
  PasswordReset: require("./passwordReset").PasswordResetModel,
  Newsletter: require("./Newsletter").NewsletterModel,
  Contact: require("./Contact").ContactModel,
  Product: require("./product").ProductModel,
  ProductImage: require("./ProductImage"),
  Payment: require("./Payment").PaymentModel,
  Review: require("./Review").ReviewModel,
  Quote: require("./Quote").QuoteModel,
  Shipment: require("./Shipment").ShipmentModel,
  CookieConsent: require("./CookieConsent").CookieConsentModel,
  Coupon: require("./coupon").CouponModel,
  AdminRequest: require("./AdminRequest").AdminRequestModel,
};