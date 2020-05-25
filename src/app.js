require('module-alias/register');
const express = require('express'),
  app = express(),
  mongoose = require('mongoose'),
  helmet = require('helmet'),
  cors = require('cors'),
  RateLimit = require('express-rate-limit'),
  config = require('@config');

mongoose.Promise = global.Promise;
const option = {
  socketTimeoutMS: 3000000,
  keepAlive: true,
  useNewUrlParser: true,
  useUnifiedTopology: true,
};

mongoose.connect('mongodb://localhost:27017/' + config.db, option);
mongoose.set('useFindAndModify', false);

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

module.exports = app;
