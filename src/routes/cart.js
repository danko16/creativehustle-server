const express = require('express');
const {
  carts: Cart,
  courses: Course,
  webinars: Webinar,
  teachers: Teacher,
  coupons: Coupon,
  digital_assets: Asset,
} = require('../models');
const {
  auth: { isAllow },
  response,
} = require('../utils');
const { query, validationResult } = require('express-validator');

const router = express.Router();

router.get('/', isAllow, async (req, res) => {
  const { user } = res.locals;
  if (user.type !== 'student') {
    return res.status(400).json(response(400, 'Anda tidak terdaftar sebagai siswa'));
  }
  try {
    const carts = await Cart.findAll({
      where: { student_id: user.id },
    });

    const carts_payload = [];
    let totalPrice = 0,
      totalPromoPrice = 0,
      percentage = 0;
    for (let i = 0; i < carts.length; i++) {
      const { course_id, webinar_id } = carts[i];
      if (course_id) {
        const course = await Course.findOne({
          where: { id: course_id },
          attributes: ['id', 'teacher_id', 'title', 'price', 'promo_price'],
          include: [
            {
              model: Teacher,
              attributes: ['full_name'],
            },
            {
              model: Asset,
              where: {
                type: 'thumbnail',
              },
              attributes: ['url'],
              as: 'course_assets',
            },
          ],
        });

        if (course.promo_price) {
          totalPrice += course.price;
          totalPromoPrice += course.price - course.promo_price;
        } else {
          totalPrice += course.price;
        }

        carts_payload.push({
          cart_id: carts[i].id,
          course_id: course.id,
          type: 'course',
          teacher_id: course.teacher_id,
          title: course.title,
          price: course.price,
          promo_price: course.promo_price,
          teacher_name: course.teacher.full_name,
          thumbnail: course.course_assets.url,
        });
      } else if (webinar_id) {
        const webinar = await Webinar.findOne({
          where: { id: webinar_id },
          include: [
            {
              model: Teacher,
              attributes: ['full_name'],
            },
            {
              model: Asset,
              where: {
                type: 'thumbnail',
              },
              attributes: ['url'],
              as: 'webinar_assets',
            },
          ],
        });

        if (webinar.promo_price) {
          totalPrice += webinar.price;
          totalPromoPrice += webinar.price - webinar.promo_price;
        } else {
          totalPrice += webinar.price;
        }

        carts_payload.push({
          cart_id: carts[i].id,
          webinar_id: webinar.id,
          type: 'webinar',
          teacher_id: webinar.teacher_id,
          title: webinar.title,
          price: webinar.price,
          promo_price: webinar.promo_price,
          teacher_name: webinar.teacher.full_name,
          thumbnail: webinar.webinar_assets.url,
        });
      }
    }

    if (totalPromoPrice !== 0) {
      percentage = (totalPromoPrice / totalPrice) * 100;
    }

    const prices = {
      total_price: totalPrice,
      total_promo_price: totalPromoPrice,
      final_price: totalPrice - totalPromoPrice,
      percentage,
    };

    return res.status(200).json(
      response(200, 'Berhasil Mendapatkan Cart', {
        carts_payload,
        prices,
      })
    );
  } catch (error) {
    return res.status(500).json(response(500, 'Internal Server Error!', error));
  }
});

router.get(
  '/coupon',
  isAllow,
  [query('coupon_name', 'coupon name must be provided').exists()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json(response(422, errors.array()));
    }

    const { user } = res.locals;
    const { coupon_name } = req.query;
    if (user.type !== 'student') {
      return res.status(400).json(response(400, 'Anda tidak terdaftar sebagai siswa'));
    }

    try {
      const coupon = await Coupon.findOne({
        where: { name: coupon_name },
        attributes: { exclude: ['createdAt', 'updatedAt'] },
      });
      if (!coupon) {
        return res.status(400).json(response(400, 'Kupon tidak di temukan'));
      }
      return res.status(200).json(response(200, 'Berhasil Mendapatkan Kupon', coupon));
    } catch (err) {
      return res.status(500).json(response(500, 'Internal Server Error!'));
    }
  }
);

router.post('/', isAllow, async (req, res) => {
  const { user } = res.locals;
  const { course_id, webinar_id } = req.body;

  if (!course_id && !webinar_id) {
    return res.status(400).json(response(400, 'course id atau webinar id harus ada'));
  }

  if (user.type !== 'student') {
    return res.status(400).json(response(400, 'Anda tidak terdaftar sebagai siswa'));
  }

  try {
    let cart;
    if (course_id) {
      cart = await Cart.findOne({ where: { student_id: user.id, course_id } });

      if (cart) {
        return res.status(400).json(response(400, 'Kursus sudah ditambahkan di cart'));
      }

      const course = await Course.findOne({ where: { id: course_id } });
      if (!course) {
        return res.status(400).json(response(400, 'Kursus tidak di temukan'));
      }

      cart = await Cart.create({
        student_id: user.id,
        course_id,
      });
    } else if (webinar_id) {
      cart = await Cart.findOne({ where: { student_id: user.id, webinar_id } });
      if (cart) {
        return res.status(400).json(response(400, 'Webinar sudah ditambahkan di cart'));
      }

      const webinar = await Webinar.findOne({ where: { id: webinar_id } });
      if (!webinar) {
        return res.status(400).json(response(400, 'Webinar tidak di temukan'));
      }

      cart = await Cart.create({
        student_id: user.id,
        webinar_id,
      });
    }

    return res.status(200).json(response(200, 'Berhasil Menambahkan Cart', cart));
  } catch (error) {
    return res.status(500).json(response(500, 'Internal Server Error!', error));
  }
});

router.delete(
  '/',
  isAllow,
  [query('type', 'type should be present').exists()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json(response(422, errors.array()));
    }
    const { user } = res.locals;
    const { cart_id, type } = req.query;

    if (user.type !== 'student') {
      return res.status(400).json(response(400, 'Anda tidak terdaftar sebagai siswa'));
    }

    try {
      if (type === 'single') {
        if (!cart_id) {
          return res.status(400).json(response(400, 'cart_id must be present'));
        }
        const cart = await Cart.findOne({ where: { id: cart_id } });
        if (!cart) {
          return res.status(400).json(response(400, 'Cart tidak di temukan'));
        }
        await Cart.destroy({
          where: {
            id: cart_id,
          },
        });
      } else if (type === 'all') {
        await Cart.destroy({
          where: {
            student_id: user.id,
          },
        });
      }

      return res.status(200).json(response(200, 'Berhasil Menghapus Cart', { ok: true }));
    } catch (error) {
      return res.status(500).json(response(500, 'Internal Server Error!', error));
    }
  }
);

module.exports = router;
