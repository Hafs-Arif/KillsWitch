module.exports = (sequelize, DataTypes) => {
    const Newsletter = sequelize.define('Newsletter', {
      newsletter_id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false
      }
    }, {
      tableName: 'newsletters',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    });
  
    return Newsletter;
  };
  