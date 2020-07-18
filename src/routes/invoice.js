const express = require('express');
const { courses: Course, classes: Kelas, invoices: Invoice } = require('../models');
const { body, param, validationResult } = require('express-validator');
const {
  auth: { isAllow },
  response,
} = require('../utils');

const router = express.Router();

router.get(
  '/:invoice_id',
  isAllow,
  [param('invoice_id', 'invoice id must be present').exists()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json(response(422, errors.array()));
    }

    const { user } = res.locals;
    const { invoice_id } = req.params;

    if (user.type !== 'student') {
      return res.status(400).json(response(400, 'Anda tidak terdaftar sebagai siswa'));
    }

    try {
      const invoice = await Invoice.findOne({
        where: { id: invoice_id, student_id: user.id },
        attributes: {
          exclude: [
            'createdAt',
            'updatedAt',
            'account_destination',
            'bank_destination',
            'sender_account_name',
            'additional_message',
          ],
        },
      });
      if (!invoice) {
        return res.status(400).json(response(400, 'invoice tidak di temukan'));
      }

      let totalPrice = 0,
        totalPromoPrice = 0,
        percentage = 0;
      let courses = [],
        classes = [],
        carts_payload = [];

      if (invoice.courses_id) {
        const coursesId = JSON.parse(invoice.courses_id);
        courses = await Course.findAll({ where: { id: coursesId } });
        for (let i = 0; i < courses.length; i++) {
          carts_payload.push({
            course_id: courses[i].id,
            title: courses[i].title,
            price: courses[i].price,
            type: 'course',
          });
          if (courses[i].promo_price) {
            totalPrice += courses[i].price;
            totalPromoPrice += courses[i].promo_price;
          } else {
            totalPrice += courses[i].price;
          }
        }
      }

      if (invoice.classes_id) {
        const classesId = JSON.parse(invoice.classes_id);
        classes = await Kelas.findAll({ where: { id: classesId } });
        for (let i = 0; i < classes.length; i++) {
          carts_payload.push({
            class_id: classes[i].id,
            title: classes[i].title,
            price: classes[i].price,
            promo_price: courses[i].promo_price,
            type: 'class',
          });
          if (classes[i].promo_price) {
            totalPrice += classes[i].price;
            totalPromoPrice += classes[i].promo_price;
          } else {
            totalPrice += classes[i].price;
          }
        }
      }

      if (totalPromoPrice !== 0) {
        percentage = ((totalPrice - totalPromoPrice) / totalPrice) * 100;
      }

      const prices = {
        total_price: totalPrice,
        total_promo_price: totalPromoPrice,
        percentage,
      };

      return res
        .status(200)
        .json(response(200, 'Berhasil mendapatkan invoice!', { carts_payload, prices, invoice }));
    } catch (error) {
      return res.status(500).json(response(500, 'Internal Server Error!', error));
    }
  }
);

router.post(
  '/',
  isAllow,
  [
    body('courses_id', 'courses id must be present')
      .exists()
      .isArray()
      .withMessage('courses id must be an array'),
    body('classes_id', 'classes id must be present')
      .exists()
      .isArray()
      .withMessage('classes id must be an array'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json(response(422, errors.array()));
    }

    const { user } = res.locals;
    const { courses_id, classes_id } = req.body;

    if (!courses_id.length && !classes_id.length) {
      return res
        .status(400)
        .json(response(400, 'courses id atau classes id array harus memiliki nilai'));
    }

    if (user.type !== 'student') {
      return res.status(400).json(response(400, 'Anda tidak terdaftar sebagai siswa'));
    }

    try {
      let totalPrice = 0,
        totalPromoPrice = 0;
      const courses_invoice_id = [],
        classes_invoice_id = [];
      if (courses_id.length) {
        const courses = await Course.findAll({ where: { id: courses_id } });
        if (!courses.length) {
          return res.status(400).json(response(400, 'kursus tidak di temukan'));
        }

        for (let i = 0; i < courses.length; i++) {
          courses_invoice_id.push(courses[i].id);
          if (courses[i].promo_price) {
            totalPrice += courses[i].price;
            totalPromoPrice += courses[i].promo_price;
          } else {
            totalPrice += courses[i].price;
          }
        }
      }

      if (classes_id.length) {
        const classes = await Kelas.findAll({ where: { id: classes_id } });
        if (!classes.length) {
          return res.status(400).json(response(400, 'kelas tidak di temukan'));
        }

        for (let i = 0; i < classes.length; i++) {
          classes_invoice_id.push(classes[i].id);
          if (classes[i].promo_price) {
            totalPrice += classes[i].price;
            totalPromoPrice += classes[i].promo_price;
          } else {
            totalPrice += classes[i].price;
          }
        }
      }

      let invoice = await Invoice.findOne({ where: { status: 'unpaid', student_id: user.id } });

      const expired = new Date();
      const aWeek = 1000 * 60 * 60 * 24 * 7;
      expired.setTime(expired.getTime() + aWeek);
      if (invoice) {
        await invoice.update({
          date: Date.now(),
          expired,
          pay_amount: totalPromoPrice !== 0 ? totalPromoPrice : totalPrice,
          status: 'unpaid',
          courses_id: courses_invoice_id.length ? JSON.stringify(courses_invoice_id) : null,
          classes_id: classes_invoice_id.length ? JSON.stringify(classes_invoice_id) : null,
        });
      } else {
        invoice = await Invoice.create({
          student_id: user.id,
          date: Date.now(),
          expired,
          pay_amount: totalPromoPrice !== 0 ? totalPromoPrice : totalPrice,
          status: 'unpaid',
          courses_id: courses_invoice_id.length ? JSON.stringify(courses_invoice_id) : null,
          classes_id: classes_invoice_id.length ? JSON.stringify(classes_invoice_id) : null,
        });
      }

      return res
        .status(200)
        .json(response(200, 'Berhasil menambahkan invoice!', { invoice_id: invoice.id }));
    } catch (error) {
      return res.status(500).json(response(500, 'Internal Server Error!', error));
    }
  }
);

module.exports = router;
