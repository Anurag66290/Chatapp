const { DataTypes } = require('sequelize');
const sequelize = require('../Database');

const online_user = sequelize.define('online_user', {
		id: {
			autoIncrement: true,
			type: DataTypes.INTEGER,
			primaryKey: true
		  },
        sender: {
			type: DataTypes.STRING(50),
			allowNull: false
		},
		socket_id: {
			type: DataTypes.STRING(50),
			allowNull: false
		},
		is_online: {
			type: DataTypes.INTEGER,
			allowNull: false,
			defaultValue:1
		},
	});
	module.exports = online_user;
