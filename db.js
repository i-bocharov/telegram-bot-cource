const {Sequelize} = require('sequelize');

module.exports = new Sequelize(
  'default_db',
  'root_user',
  'gQVB;pE%\\}*D^2',
  {
    host: '46.149.70.34',
    port: '5432',
    dialect: 'postgres',
  }
);