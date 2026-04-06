module.exports = (sequelize, DataTypes) => {
  const CookieConsent = sequelize.define('CookieConsent', {
    consent_id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: true // Allow null for anonymous users - no foreign key constraint to avoid dependency issues
    },
    session_id: {
      type: DataTypes.STRING,
      allowNull: false, // Unique session identifier for anonymous users
      unique: true
    },
    ip_address: {
      type: DataTypes.STRING,
      allowNull: true
    },
    user_agent: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    consent_given: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    consent_type: {
      type: DataTypes.ENUM('accept', 'reject'),
      allowNull: false
    },
    analytics_cookies: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    functional_cookies: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true // Essential cookies always enabled
    },
    marketing_cookies: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    consent_date: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: true // Cookie consent expiration (e.g., 1 year)
    },
    country: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: 'US'
    },
    privacy_policy_version: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: '1.0'
    }
  }, {
    tableName: 'cookie_consents',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        unique: false,
        fields: ['session_id']
      },
      {
        unique: false,
        fields: ['user_id']
      },
      {
        unique: false,
        fields: ['ip_address']
      },
      {
        unique: false,
        fields: ['consent_date']
      }
    ]
  });

  CookieConsent.associate = (models) => {
    // Associate with User model (optional for logged-in users)
    // Only create association if User model exists
    if (models.User) {
      CookieConsent.belongsTo(models.User, {
        foreignKey: 'user_id',
        as: 'user',
        constraints: false // No database-level foreign key constraint
      });
    }
  };

  return CookieConsent;
};
