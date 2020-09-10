const Sequelize = require('sequelize');
const { invoices: Invoice } = require('../../models');
const EVENT = require('../constants');
const { Op } = Sequelize;

class CronInvoiceStatus {
  constructor(observable) {
    this.observable = observable;
  }
  listenCronInvoiceStatus() {
    this.observable.addListener(EVENT.CRON_INVOICE_STATUS, async () => {
      const jktTime = new Date().toLocaleString('en-US', { timeZone: 'Asia/Jakarta' });
      const now = new Date(jktTime).toISOString();

      const expInvoices = await Invoice.findAll({
        where: {
          [Op.and]: [
            Sequelize.where(
              Sequelize.fn('DATE_FORMAT', Sequelize.col('expired'), '%Y-%m-%d'),
              '<=',
              now
            ),
            { status: 'unpaid' },
          ],
        },
      }).map((el) => el.id);

      await Invoice.update(
        {
          status: 'canceled',
        },
        { where: { id: expInvoices } }
      );
    });
  }
}

module.exports = CronInvoiceStatus;
