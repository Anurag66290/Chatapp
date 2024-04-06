const { DataTypes } = require('sequelize');
const sequelize = require('../Database');

const Message = sequelize.define('Message', {
    sender: {
        type: DataTypes.STRING,
        allowNull: false
    },
    receiver: {
        type: DataTypes.STRING,
        allowNull: false
    },
    message: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    timestamp: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    }
});

module.exports = Message;
