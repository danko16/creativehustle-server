const config = require('./config.global');

config.email = {
  host: '',
  port: '',
  auth: {
    user: '',
    pass: '',
  },
};
config.documents = 'public/documents';
config.uploads = 'public/uploads';
config.serverDomain = 'https://api.creativehustle.id';
config.clientDomain = 'https://creativehustle.id';
config.host = 'http://localhost';
config.port = 3000;
config.googleId = '446876581165-pbgrvmc4drv4jh81pp3dck34qgom2rac.apps.googleusercontent.com';
config.googleSecret = 'L8pHU_jxJfC1BIJeA-Xz8rI5';
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
