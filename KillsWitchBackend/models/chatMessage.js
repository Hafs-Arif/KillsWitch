// Keep your version with senderEmail and receiverEmail
module.exports = (sequelize, DataTypes) => {
  const ChatMessage = sequelize.define('ChatMessage', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    senderEmail: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    receiverEmail: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    isOfflineMessage: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
    deliveredAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    storedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    seenByAdmin: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
    seenAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    messageHash: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Hash for deduplication'
    },
  }, {
    tableName: 'chat_messages',
    timestamps: true,
  });

  return ChatMessage;
};
