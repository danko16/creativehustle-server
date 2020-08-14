const config = require('./config.global');
config.documents = 'public/documents';
config.uploads = 'public/uploads';
config.serverDomain = 'http://localhost:3000';
config.clientDomain = 'http://localhost:3006';
config.host = 'http://localhost';
config.port = 3000;
config.googleId = '446876581165-gnrh6cf0en7b6s688clhneifviskctqe.apps.googleusercontent.com';
config.googleSecret = 'teAq2syE55yMOSdWUcRalii7';
config.jwtsecret = `YdU9pecapCfKi9sLdVwibLWyIZIKgSga2XS17gUewMSlRk6HV5lZ2uZFvpid`;
config.aessecret = 'tYhIlnLAMRzs06pP3izXkuCn4mwA63Z8FpgXSFLwfy7p6FRozI08VCbfjhEh';
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
