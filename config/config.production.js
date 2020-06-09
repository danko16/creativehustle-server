const config = require('./config.global');

config.email = {
  host: '',
  port: '',
  auth: {
    user: '',
    pass: '',
  },
};
config.domain = 'http://localhost:3000';
config.host = 'http://localhost';
config.port = 3000;
config.db = {
  username: process.env.PROD_USER,
  password: process.env.PROD_PASS,
  database: process.env.PROD_DATABASE,
  host: process.env.PROD_HOST,
  dialect: 'mysql',
  timezone: '+07:00',
  dialectOptions: {
    dateStrings: true,
    typeCast: true,
  },
  pool: {
    max: 50,
    min: 0,
    acquire: 1000000,
    idle: 10000,
  },
};

module.exports = config;
