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
config.port = 3000;
config.db = 'database_name';

module.exports = config;
