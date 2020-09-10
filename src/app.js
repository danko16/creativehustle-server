const express = require('express');
const passport = require('passport');
const app = express();
const helmet = require('helmet');
const cron = require('node-cron');
const cors = require('cors');
const RateLimit = require('express-rate-limit');
const config = require('../config');
const { events, observe } = require('./eventemitter');
const EVENT = require('./eventemitter/constants');

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

app.use(passport.initialize());
app.use(passport.session());

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.use('/uploads', express.static(config.uploads));
app.use('/documents', express.static(config.documents));

events.CronInvoiceStatus.listenCronInvoiceStatus();

cron.schedule(
  '00 00 00 * * *',
  () => {
    observe.emit(EVENT.CRON_INVOICE_STATUS);
  },
  {
    scheduled: true,
    timezone: 'Asia/Jakarta',
  }
);

app.use('/auth', limitedAccess, require('./routes/auth'));
app.use('/kursus', require('./routes/kursus'));
app.use('/kursus-saya', require('./routes/kursus-saya'));
app.use('/webinar', require('./routes/webinar'));
app.use('/webinar-saya', require('./routes/webinar-saya'));
app.use('/cart', require('./routes/cart'));
app.use('/invoice', require('./routes/invoice'));
app.use('/admin', limitedAccess, require('./routes/admin'));
app.use('/kontak-kami', limitedAccess, require('./routes/contact-us'));
app.use('/mentor', require('./routes/mentor'));

module.exports = app;
