const config = require('./config.global');

config.documents = process.env.DOCUMENT ? process.env.DOCUMENT : 'public/documents';
config.uploads = process.env.UPLOAD ? process.env.UPLOAD : 'public/uploads';
config.domain = 'http://localhost:3000';
config.port = 3000;
config.db = 'danko';

module.exports = config;
