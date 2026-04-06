module.exports = (sequelize, DataTypes) => {
  const Session = sequelize.define('Session', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    tokenHash: {
      type: DataTypes.STRING(255),
      allowNull: false,
      comment: 'Hash of refresh token'
    },
    userAgent: {
      type: DataTypes.STRING(512),
      allowNull: true
    },
    ipAddress: {
      type: DataTypes.STRING(64),
      allowNull: true
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false
    },
    revokedAt: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    tableName: 'sessions',
    timestamps: true
  });

  Session.associate = (models) => {
    Session.belongsTo(models.User, { foreignKey: 'userId', as: 'user', onDelete: 'CASCADE' });
  };

  return Session;
};


