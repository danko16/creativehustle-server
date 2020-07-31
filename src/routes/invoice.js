const express = require('express');
const {
  courses: Course,
  classes: Kelas,
  invoices: Invoice,
  digital_assets: Asset,
} = require('../models');
const { body, query, param, validationResult } = require('express-validator');
const fs = require('fs');
const multer = require('multer');
const {
  auth: { isAllow },
  response,
} = require('../utils');

const documentsStorage = multer.diskStorage({
  destination: 'invoices/bukti_pembayaran',
  filename: function (req, file, cb) {
    cb(null, Date.now() + '.' + file.mimetype.split('/')[1]);
  },
});

const upload = multer({
  storage: documentsStorage,
  limits: { fileSize: 5000000, files: 2 },
  fileFilter: async function (req, file, cb) {
    // if (!req.body.type) {
    //   cb(new Error('Type need to be specified'));
    // }
    cb(null, true);
  },
}).single('file');

const router = express.Router();

router.get('/', isAllow, async (req, res) => {
  const { user } = res.locals;

  if (user.type !== 'student') {
    return res.status(400).json(response(400, 'Anda tidak terdaftar sebagai siswa'));
  }

  try {
    const invoices = await Invoice.findAll({
      where: { student_id: user.id },
      order: [['date', 'DESC']],
      attributes: {
        exclude: [
          'createdAt',
          'updatedAt',
          'account_destination',
          'bank_destination',
          'sender_account',
          'sender_account_name',
          'additional_message',
        ],
      },
    });
    return res.status(200).json(response(200, 'Berhasil Mendapatkan Invoices', invoices));
  } catch (error) {
    return res.status(500).json(response(500, 'Internal Server Error!', error));
  }
});

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
            'sender_account',
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
            promo_price: classes[i].promo_price,
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

      const payload = {
        total_price: totalPrice,
        total_promo_price: totalPromoPrice,
        percentage,
        ...invoice.get({ plain: true }),
        carts: carts_payload,
      };
      return res.status(200).json(response(200, 'Berhasil mendapatkan invoice!', payload));
    } catch (error) {
      console.log(error);
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
        totalPromoPrice = 0,
        percentage = 0;
      const courses_invoice_id = [],
        classes_invoice_id = [],
        carts_payload = [];
      if (courses_id.length) {
        const courses = await Course.findAll({ where: { id: courses_id } });
        if (!courses.length) {
          return res.status(400).json(response(400, 'kursus tidak di temukan'));
        }

        for (let i = 0; i < courses.length; i++) {
          courses_invoice_id.push(courses[i].id);
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

      if (classes_id.length) {
        const classes = await Kelas.findAll({ where: { id: classes_id } });
        if (!classes.length) {
          return res.status(400).json(response(400, 'kelas tidak di temukan'));
        }

        for (let i = 0; i < classes.length; i++) {
          classes_invoice_id.push(classes[i].id);
          carts_payload.push({
            course_id: classes[i].id,
            title: classes[i].title,
            price: classes[i].price,
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

      const expired = new Date();
      const aWeek = 1000 * 60 * 60 * 24 * 7;
      expired.setTime(expired.getTime() + aWeek);

      let invoice = await Invoice.create({
        student_id: user.id,
        date: Date.now(),
        expired,
        total_amount: totalPromoPrice !== 0 ? totalPromoPrice : totalPrice,
        status: 'unpaid',
        courses_id: courses_invoice_id.length ? JSON.stringify(courses_invoice_id) : null,
        classes_id: classes_invoice_id.length ? JSON.stringify(classes_invoice_id) : null,
      });

      if (totalPromoPrice !== 0) {
        percentage = ((totalPrice - totalPromoPrice) / totalPrice) * 100;
      }

      invoice = await Invoice.findOne({
        where: { id: invoice.id },
        attributes: {
          exclude: [
            'createdAt',
            'updatedAt',
            'account_destination',
            'bank_destination',
            'sender_account',
            'sender_account_name',
            'additional_message',
          ],
        },
      });

      const payload = {
        total_price: totalPrice,
        total_promo_price: totalPromoPrice,
        percentage,
        ...invoice.get({ plain: true }),
        carts: carts_payload,
      };

      return res.status(200).json(response(200, 'Berhasil menambahkan invoice!', payload));
    } catch (error) {
      return res.status(500).json(response(500, 'Internal Server Error!', error));
    }
  }
);

router.post(
  '/confirm',
  isAllow,
  [
    query('name', 'name must be present').exists(),
    query('email', 'email must be present').exists(),
    query('pay_date', 'pay date must be present').exists(),
    query('pay_amount', 'pay amount must be present').exists(),
    query('bank_destination', 'bank destination must be present').exists(),
    query('sender_account_name', 'sender account name must be present').exists(),
    query('sender_account', 'sender account must be present').exists(),
    query('invoice_id', 'invoice id must be present').exists(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json(response(422, errors.array()));
    }

    const {
      pay_date,
      pay_amount,
      bank_destination,
      sender_account_name,
      sender_account,
      invoice_id,
      additional_message,
    } = req.query;

    const { user } = res.locals;

    if (user.type !== 'student') {
      return res.status(400).json(response(400, 'anda tidak terdaftar sebagai siswa'));
    }

    const invoice = await Invoice.findOne({ where: { id: invoice_id, student_id: user.id } });
    if (!invoice) {
      return res.status(400).json(response(400, 'invoice tidak di temukan'));
    }

    if (invoice.status === 'paid') {
      return res.status(400).json(response(400, 'anda sudah melakukan konfirmasi'));
    } else if (invoice.status === 'canceled') {
      return res.status(400).json(response(400, 'invoice telah di batalkan'));
    }

    upload(req, res, async (error) => {
      if (error instanceof multer.MulterError) {
        return res.status(500).json(response(500, 'Internal Server Error!', error));
      } else if (error) {
        return res.status(500).json(response(500, 'Unkonwn Error!', error));
      }
      try {
        const { file } = req;
        if (!file) {
          return res.status(400).json(response(400, 'bukti pembayaran tidak boleh kosong'));
        }

        const filePath = `${file.destination}/${file.filename}`;
        let accountDestination;
        switch (bank_destination) {
          case 'BNI':
            accountDestination = '0722620388';
            break;
          case 'MANDIRI':
            accountDestination = '1370016138576';
            break;
          case 'BTPN':
            accountDestination = '90020619442';
            break;
        }

        await invoice.update({
          pay_date: new Date(pay_date),
          pay_amount,
          status: 'pending',
          bank_destination,
          account_destination: accountDestination,
          sender_account_name,
          sender_account,
          additional_message,
        });

        const asset = await Asset.findOne({
          where: { invoice_id: invoice.id, type: 'bukti_pembayaran' },
          as: 'invoice_assets',
        });

        if (asset) {
          if (asset.path) {
            fs.unlinkSync(asset.path);
          }
          await asset.update({
            path: filePath,
            filename: file.filename,
          });
        } else {
          await Asset.create({
            invoice_id: invoice.id,
            path: filePath,
            filename: file.filename,
            type: 'bukti_pembayaran',
          });
        }

        return res
          .status(200)
          .json(
            response(
              200,
              'Berhasil meminta konfirmasi silahkan tunggu maksimal 1 hari kerja, kami akan memberikan notifikasi melalu email anda terima kasih',
              { ok: true }
            )
          );
      } catch (error) {
        return res.status(500).json(response(500, 'Internal Server Error!', error));
      }
    });
  }
);

module.exports = router;
