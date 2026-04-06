const sequelize = require("../config/db");
const { DataTypes } = require("sequelize");
const brandcategory = require("./brandcategory");

// Import models and pass the sequelize instance
const User = require("./User")(sequelize, DataTypes);
const passwordReset = require("./passwordReset")(sequelize, DataTypes);
const category = require("./Category")(sequelize, DataTypes);
const brand = require("./brand")(sequelize, DataTypes);
const subcategory = require("./subcategory")(sequelize, DataTypes);
const product = require("./product")(sequelize, DataTypes);
const Order = require("./order")(sequelize, DataTypes);
const Contact = require("./Contact")(sequelize, DataTypes);
const Newsletter = require("./Newsletter")(sequelize, DataTypes);
const Shipment = require("./Shipment")(sequelize, DataTypes);
const OrderItem = require("./orderitem")(sequelize, DataTypes);
const ActivityLog = require("./ActivityLog")(sequelize, DataTypes);
const AdminRequest = require("./AdminRequest")(sequelize, DataTypes);
const Payment = require("./Payment")(sequelize, DataTypes);
const brandcategories = require("./brandcategory")(sequelize, DataTypes);
const Quote = require("./Quote")(sequelize, DataTypes);
const ChatMessage = require("./chatMessage")(sequelize, DataTypes);
const ProductImage = require("./ProductImage")(sequelize, DataTypes);
const Review = require("./Review")(sequelize, DataTypes);
const Cart = require("./cart")(sequelize, DataTypes);
const CartItem = require("./cartitem")(sequelize, DataTypes);
const Session = require("./Session")(sequelize, DataTypes);
const CookieConsent = require("./CookieConsent")(sequelize, DataTypes);
const Address = require("./Address")(sequelize, DataTypes);
const Coupon = require("./coupon")(sequelize, DataTypes);

// Add all models to an object for easy access
const db = {};
db.sequelize = sequelize;
db.User = User;
db.Newsletter = Newsletter;
db.ChatMessage = ChatMessage;
db.passwordReset = passwordReset;
db.category = category;
db.ActivityLog = ActivityLog;
db.Order = Order;
db.AdminRequest = AdminRequest;
db.Contact = Contact;
db.Payment = Payment;
db.Shipment = Shipment;
db.OrderItem = OrderItem;
db.brand = brand;
db.Quote = Quote;
db.subcategory = subcategory;
db.product = product;
db.brandcategory = brandcategories;
db.ProductImage = ProductImage;
db.Review = Review;
db.Cart = Cart;
db.CartItem = CartItem;
db.Session = Session;
db.CookieConsent = CookieConsent;
db.Address = Address;
db.Coupon = Coupon;
Object.keys(db).forEach((modelName) => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

module.exports = db;
