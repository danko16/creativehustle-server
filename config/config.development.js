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
config.domain = 'http://localhost:3000';
config.host = 'http://localhost';
config.port = 3000;
config.db = 'danko';

module.exports = config;
