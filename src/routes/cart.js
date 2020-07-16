const express = require('express');
const {
  carts: Cart,
  courses: Course,
  classes: Kelas,
  teachers: Teacher,
  digital_assets: Asset,
} = require('../models');
const {
  auth: { isAllow },
  response,
} = require('../utils');
const { param, validationResult } = require('express-validator');

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

    const payload = [];
    for (let i = 0; i < carts.length; i++) {
      const { course_id, class_id } = carts[i];
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

        payload.push({
          id: course.id,
          type: 'course',
          teacher_id: course.teacher_id,
          title: course.title,
          price: course.price,
          promo_price: course.promo_price,
          teacher_name: course.teacher.full_name,
          thumbnail: course.course_assets.url,
        });
      } else if (class_id) {
        const kelas = await Kelas.findOne({
          where: { id: class_id },
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
              as: 'class_assets',
            },
          ],
        });
        payload.push({
          id: kelas.id,
          type: 'class',
          teacher_id: kelas.teacher_id,
          title: kelas.title,
          price: kelas.price,
          promo_price: kelas.promo_price,
          teacher_name: kelas.teacher.full_name,
          thumbnail: kelas.class_assets.url,
        });
      }
    }
    return res.status(200).json(response(200, 'Berhasil Mendapatkan Cart', payload));
  } catch (error) {
    return res.status(500).json(response(500, 'Internal Server Error!', error));
  }
});

router.post('/', isAllow, async (req, res) => {
  const { user } = res.locals;
  const { course_id, class_id } = req.body;

  if (!course_id && !class_id) {
    return res.status(400).json(response(400, 'course id atau class id harus ada'));
  }

  if (user.type !== 'student') {
    return res.status(400).json(response(400, 'Anda tidak terdaftar sebagai siswa'));
  }

  try {
    if (course_id) {
      let cart = await Cart.findOne({ where: { student_id: user.id, course_id } });

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
    } else if (class_id) {
      let cart = await Cart.findOne({ where: { student_id: user.id, class_id } });
      if (cart) {
        return res.status(400).json(response(400, 'Kelas sudah ditambahkan di cart'));
      }

      const kelas = await Kelas.findOne({ where: { id: class_id } });
      if (!kelas) {
        return res.status(400).json(response(400, 'Kelas tidak di temukan'));
      }

      cart = await Cart.create({
        student_id: user.id,
        class_id,
      });
    }

    const payload = await Cart.findAll({ where: { student_id: user.id } });
    return res.status(200).json(response(200, 'Berhasil Menambahkan Cart', payload));
  } catch (error) {
    return res.status(500).json(response(500, 'Internal Server Error!', error));
  }
});

router.delete(
  '/:cart_id',
  isAllow,
  [param('cart_id', 'cart id should be present').exists()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json(response(422, errors.array()));
    }
    const { user } = res.locals;
    const { cart_id } = req.params;

    if (user.type !== 'student') {
      return res.status(400).json(response(400, 'Anda tidak terdaftar sebagai siswa'));
    }

    try {
      const cart = await Cart.findOne({ where: { id: cart_id } });
      if (!cart) {
        return res.status(400).json(response(400, 'Cart tidak di temukan'));
      }
      await Cart.destroy({
        where: {
          id: cart_id,
        },
      });
      const payload = await Cart.findAll({ where: { student_id: user.id } });

      return res.status(200).json(response(200, 'Berhasil Menghapus Cart', payload));
    } catch (error) {
      return res.status(500).json(response(500, 'Internal Server Error!', error));
    }
  }
);

module.exports = router;
