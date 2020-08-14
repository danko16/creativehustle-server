const config = require('./config.global');
config.documents = 'public/documents';
config.uploads = 'public/uploads';
config.serverDomain = 'https://api.creativehustle.id';
config.clientDomain = 'https://creativehustle.id';
config.host = 'http://localhost';
config.port = 3000;
config.googleId = process.env.PROD_GOOGLE_ID;
config.googleSecret = process.env.PROD_GOOGLE_SECRET;
config.jwtsecret = process.env.JWT_SECRET;
config.aessecret = process.env.AES_SECRET;
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
