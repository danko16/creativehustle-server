const express = require('express');
const { body, validationResult } = require('express-validator');
const {
  admins: Admin,
  invoices: Invoice,
  courses: Course,
  students: Student,
  webinars: Webinar,
  contents: Content,
  digital_assets: Asset,
  webinar_schedules: WebinarSchedule,
  my_courses: MyCourse,
  my_webinars: MyWebinars,
  sections: Section,
  coupons: Coupon,
  sequelize,
} = require('../models');
const {
  response,
  token: { encrypt, getToken },
  auth: { isAllow },
  emails: { sendConfirmationEmail },
  format: { formatNumber, convertSlashDate },
} = require('../utils');
const { getPayload } = require('../utils/token');
const pug = require('pug');
const path = require('path');
const puppeteer = require('puppeteer');

const router = express.Router();

router.post(
  '/login',
  [
    body('email', 'email must be present').exists().isEmail().withMessage('invalid email format'),
    body('password', 'password should be present').exists(),
  ],
  async (req, res) => {
    const error = validationResult(req);
    if (!error.isEmpty()) {
      return res.status(422).json(response(422, error.array()));
    }

    const { email, password } = req.body;
    try {
      const admin = await Admin.findOne({ where: { email } });
      if (!admin) {
        return res.status(400).json(response(400, 'Anda tidak terdaftar sebagai admin'));
      }

      if (admin.password !== encrypt(password)) {
        return res.status(400).json(response(400, 'Password salah'));
      }

      const token = await getToken({ uid: admin.id, type: 'admin' });
      const getExpToken = await getPayload(token.pure);

      const payload = Object.freeze({
        token: { key: token.key, exp: getExpToken.exp },
        user: {
          id: admin.id,
          name: admin.name,
          email: admin.email,
        },
      });
      return res.status(200).json(response(200, 'Login berhasil', payload));
    } catch (error) {
      return res.status(500).json(response(500, 'Internal server error'));
    }
  }
);

router.post(
  '/coupon',
  isAllow,
  [
    body('name', 'name must be present').exists(),
    body('discounts', 'discounts must be present')
      .exists()
      .isNumeric()
      .withMessage('discounts must be numeric'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json(response(422, errors.array()));
    }

    const { user } = res.locals;
    const { name, discounts } = req.body;

    if (user.type !== 'admin') {
      return res.status(400).json(response(400, 'Anda tidak terdaftar sebagai admin'));
    }

    try {
      let coupon = await Coupon.findOne({ where: { name } });
      if (coupon) {
        return res.status(400).json(response(400, 'Coupon already exists'));
      }

      coupon = await Coupon.create({ name: name.toUpperCase(), discounts });
      return res.status(200).json(response(200, 'Berhasil Menambahkan Kode Kupon', coupon));
    } catch (error) {
      return res.status(500).json(response(500, 'Internal server error'));
    }
  }
);

router.post(
  '/confirm/payment',
  isAllow,
  [
    body('invoice_id', 'invoice id must be present').exists(),
    body('status', 'status must be present').exists(),
  ],
  async (req, res) => {
    const error = validationResult(req);
    if (!error.isEmpty()) {
      return res.status(422).json(response(422, error.array()));
    }

    const { user } = res.locals;
    const { status, invoice_id } = req.body;

    if (user.type !== 'admin') {
      return res.status(400).json(response(400, 'Anda tidak terdaftar sebagai admin'));
    }

    const transaction = await sequelize.transaction();
    try {
      const invoice = await Invoice.findOne({
        where: { id: invoice_id },
        include: {
          where: {
            type: 'paid',
          },
          model: Asset,
          as: 'invoice_assets',
          required: false,
        },
      });
      if (!invoice) {
        return res.status(400).json(response(400, 'Invoice tidak di temukan'));
      }

      if (status === 'paid') {
        if (invoice.status === 'unpaid') {
          return res.status(400).json(response(400, 'Invoice belum di konfirmasi'));
        }

        if (invoice.status === 'canceled') {
          return res.status(400).json(response(400, 'Invoice sudah di batalkan'));
        }

        let discountPercentage = 0,
          total = 0,
          totalPromo = 0;
        const carts = [];
        const student = await Student.findOne({
          where: {
            id: invoice.student_id,
          },
        });

        if (!student) {
          return res.status(400).json(response(400, 'Siswa tidak di temukan'));
        }
        if (invoice.courses_id) {
          const courses = await Course.findAll({
            where: {
              id: JSON.parse(invoice.courses_id),
            },
            include: [
              {
                model: Section,
                attributes: { exclude: ['createdAt', 'updatedAt'] },
              },
              {
                model: Content,
                attributes: { exclude: ['createdAt', 'updatedAt'] },
              },
            ],
          });

          for (let i = 0; i < courses.length; i++) {
            const { id: course_id, price, promo_price, title } = courses[i];
            let kursusSaya = await MyCourse.findOne({
              where: {
                course_id,
                student_id: invoice.student_id,
              },
            });

            if (promo_price) {
              totalPromo += price - promo_price;
            }
            total += price;

            carts.push({
              name: title,
              type: 'Kursus',
              price: formatNumber(price),
            });

            if (!kursusSaya) {
              const contents = courses[i].get('contents', { plain: true });

              const done = {};
              for (let i = 0; i < contents.length; i++) {
                const { id } = contents[i];
                done[id] = false;
              }

              kursusSaya = await MyCourse.create(
                {
                  course_id,
                  student_id: invoice.student_id,
                  done: JSON.stringify(done),
                },
                { transaction }
              );

              await courses[i].update(
                {
                  participant: courses[i].participant + 1,
                },
                { transaction }
              );
            }
          }
        }

        if (invoice.webinars_id) {
          const webinars = await Webinar.findAll({
            where: {
              id: JSON.parse(invoice.webinars_id),
            },
            attributes: { exclude: ['createdAt', 'updatedAt'] },
            include: {
              model: WebinarSchedule,
              attributes: { exclude: ['createdAt', 'updatedAt'] },
            },
          });

          for (let i = 0; i < webinars.length; i++) {
            const { id: webinar_id, promo_price, price, title } = webinars[i];
            let webinarSaya = await MyWebinars.findOne({
              where: {
                webinar_id,
                student_id: invoice.student_id,
              },
            });

            if (promo_price) {
              totalPromo += price - promo_price;
            }
            total += price;

            carts.push({
              name: title,
              type: 'Webinar',
              price: formatNumber(price),
            });

            if (!webinarSaya) {
              webinarSaya = await MyWebinars.create(
                {
                  webinar_id: webinars[i].id,
                  student_id: invoice.student_id,
                },
                { transaction }
              );
            }
          }
        }

        if (totalPromo !== 0) {
          discountPercentage = (totalPromo / total) * 100;
        }

        let destName;
        switch (invoice.bank_destination) {
          case 'BNI':
            destName = 'Danang Eko Yudanto';
            break;
          case 'MANDIRI':
            destName = 'Reezky Pradata Sanjaya';
            break;
          case 'BCA':
            destName = 'Reezky Pradata Sanjaya';
            break;
        }

        const html = pug.renderFile(path.resolve('src/pdf_src', 'invoice.pug'), {
          invoiceId: invoice.id,
          status: 'LUNAS',
          name: student.full_name,
          email: student.email,
          carts,
          created: convertSlashDate(invoice.date),
          expired: convertSlashDate(invoice.expired),
          subTotal: formatNumber(total),
          discountPercentage: `${Math.floor(discountPercentage)}`,
          discount: formatNumber(totalPromo),
          total: `${formatNumber(total - totalPromo)}`,
        });

        const browser = await puppeteer.launch();
        const page = await browser.newPage();
        await page.setContent(html);
        await page.addStyleTag({
          content: '@page { size: auto; }',
        });
        await page.pdf({
          path: path.resolve(`invoices/paid/invoice#${invoice.id}.pdf`),
          width: 530,
        });
        await browser.close();

        if (!invoice.invoice_assets.length) {
          await Asset.create(
            {
              invoice_id: invoice.id,
              path: `invoices/paid/invoice#${invoice.id}.pdf`,
              filename: `invoice#${invoice.id}.pdf`,
              type: 'paid',
            },
            { transaction }
          );
        }

        sendConfirmationEmail({
          filename: `invoice#${invoice.id}.pdf`,
          path: path.resolve('invoices/paid', `invoice#${invoice.id}.pdf`),
          email: student.email,
          noInvoice: invoice.id,
          userName: student.full_name,
          carts,
          discountPercentage: `${Math.floor(discountPercentage)}%`,
          discountTotal: `${formatNumber(totalPromo)}`,
          total: `${formatNumber(total - totalPromo)}`,
          sender: {
            account: invoice.sender_account,
            name: invoice.sender_account_name,
          },
          receiver: {
            account: invoice.account_destination,
            name: destName,
          },
        });
      }

      await invoice.update({ status }, { transaction });

      await transaction.commit();

      return res.status(200).json(
        response(200, 'Konfirmasi Pembayaran Berhasil', {
          invoice_id: invoice.id,
          status: invoice.status,
        })
      );
    } catch (error) {
      await transaction.rollback();
      return res.status(500).json(response(500, 'Internal server error'));
    }
  }
);

module.exports = router;
