const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('chatApp', 'root', 'password', {
    host: 'localhost',
    dialect: 'mysql'
});

module.exports = sequelize;
