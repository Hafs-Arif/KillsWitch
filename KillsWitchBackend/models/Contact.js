module.exports = (sequelize, DataTypes) => {
    const Contact = sequelize.define('Contact', {
      contact_id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false
      },
      message: {
        type: DataTypes.TEXT,
        allowNull: false
      },
      phoneno: {
        type: DataTypes.STRING,
        allowNull: false
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false
      }
    }, {
      tableName: 'contacts',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    });
  
    Contact.associate = (models) => {
      Contact.belongsTo(models.User, {
        foreignKey: 'userId', // you need to add userId as FK in the DB
        as: 'user'
      });
    };
  
    return Contact;
  };
  