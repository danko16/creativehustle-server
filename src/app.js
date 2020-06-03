require('module-alias/register');
const express = require('express');
const app = express();
const helmet = require('helmet');
const cors = require('cors');
const RateLimit = require('express-rate-limit');
const config = require('@config');

const limitedAccess = new RateLimit({
  windowMs: 1 * 60 * 1000, // 15 minutes
  max: 15,
  delayMs: 0,
  statusCode: 500,
  message: 'LIMITED ACCESS!',
});

//Init Protection
app.use(cors());
app.use(helmet());
app.disable('etag');

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.use('/uploads', express.static(config.uploads));
app.use('/documents', express.static(config.documents));

app.use('/auth', limitedAccess, require('./routes/auth'));

module.exports = app;
