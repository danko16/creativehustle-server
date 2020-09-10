const EventEmitter = require('events').EventEmitter;
const { CronInvoiceStatus } = require('./cron');

const observe = new EventEmitter();

const events = Object.freeze({
  CronInvoiceStatus: new CronInvoiceStatus(observe),
});

module.exports = { events, observe };
