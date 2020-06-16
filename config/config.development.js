const config = require('./config.global');
config.email = {
  service: 'SendGrid',
  auth: {
    user: 'danko16',
    pass: '/sAMbv8v7j_+FpK',
  },
};
config.documents = process.env.DOCUMENT ? process.env.DOCUMENT : 'public/documents';
config.uploads = process.env.UPLOAD ? process.env.UPLOAD : 'public/uploads';
config.email_sender = '"http://localhost:3000" no-reply@localhost:3000';
config.serverDomain = 'http://localhost:3000';
config.clientDomain = 'http://localhost:3006';
config.host = 'http://localhost';
config.port = 3000;
config.googleId = '446876581165-gnrh6cf0en7b6s688clhneifviskctqe.apps.googleusercontent.com';
config.googleSecret = 'teAq2syE55yMOSdWUcRalii7';
config.db = {
  username: 'root',
  password: 'password',
  database: 'creative_hustle',
  host: '127.0.0.1',
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
