const express = require('express');
const { body, param, validationResult } = require('express-validator');
const {
  courses: Course,
  sections: Section,
  contents: Content,
  teachers: Teacher,
  my_courses: MyCourse,
  digital_assets: Asset,
  course_recommendations: CourseRecommendation,
} = require('../models');
const {
  auth: { isAllow },
  response,
} = require('../utils');

const router = express.Router();

router.get('/', isAllow, async (req, res) => {
  const { user } = res.locals;

  if (user.type !== 'student') {
    return res.status(400).json(response(400, 'Anda tidak terdaftar sebagai siswa'));
  }
  try {
    const kursusSaya = await MyCourse.findAll({
      where: {
        student_id: user.id,
      },
      include: [
        {
          model: Course,
          attributes: { exclude: ['createdAt', 'updatedAt'] },
          include: [
            {
              model: Teacher,
              attributes: ['full_name'],
            },
            {
              model: Asset,
              attributes: ['url'],
              as: 'course_assets',
            },
          ],
        },
      ],
    });

    const kursusPayload = [];
    for (let i = 0; i < kursusSaya.length; i++) {
      const myCourse = kursusSaya[i].get('course', { plain: true });
      const myContent = JSON.parse(kursusSaya[i].contents);
      let doneTotal = 0;
      let total = myContent.length;

      for (let j = 0; j < myContent.length; j++) {
        const { done } = myContent[j];

        if (done) {
          doneTotal++;
        }
      }

      const progress = Math.floor((doneTotal / total) * 100);

      const course = Object.freeze({
        id: myCourse.id,
        teacher_id: myCourse.teacher_id,
        title: myCourse.title,
        price: myCourse.price,
        promo_price: myCourse.promo_price,
        teacher_name: myCourse.teacher.full_name,
        thumbnail: myCourse.course_assets.url,
        first_content: myContent[0].id,
        progress,
      });

      kursusPayload.push(course);
    }

    return res.status(200).json(response(200, 'Berhasil Mendapatkan Kursus', kursusPayload));
  } catch (error) {
    return res.status(500).json(response(500, 'Internal Server Error!', error));
  }
});

router.get(
  '/:course_id/contents',
  isAllow,
  [param('course_id', 'course id should be present').exists()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json(response(422, errors.array()));
    }

    const { user } = res.locals;
    const { course_id } = req.params;

    if (user.type !== 'student') {
      return res.status(400).json(response(400, 'Anda tidak terdaftar sebagai siswa'));
    }

    try {
      let myCourse = await MyCourse.findOne({
        where: { course_id, student_id: user.id },
        include: {
          model: Course,
          include: {
            model: Section,
            attributes: { exclude: ['createdAt', 'updatedAt'] },
          },
        },
      });

      if (!myCourse) {
        return res.status(400).json(response(400, 'anda tidak terdaftar kursus ini!'));
      }

      const contents = myCourse.get('contents', { plain: true });
      const sections = myCourse.course.get('sections', { plain: true });

      return res.status(200).json(
        response(200, 'Berhasil Mendapatkan Contents', {
          sections,
          contents: JSON.parse(contents),
        })
      );
    } catch (error) {
      return res.status(500).json(response(500, 'Internal Server Error!', error));
    }
  }
);

router.post(
  '/subscribe',
  isAllow,
  [body('kursus_id', 'kursus id should be present').exists()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json(response(422, errors.array()));
    }

    const { user } = res.locals;
    const { kursus_id } = req.body;

    if (user.type !== 'student') {
      return res.status(400).json(response(400, 'Anda tidak terdaftar sebagai siswa'));
    }

    try {
      const kursus = await Course.findOne({
        where: { id: kursus_id },
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

      if (!kursus) {
        return res.status(400).json(response(400, 'kursus tidak ditemukan'));
      }

      if (!kursus.sections.length) {
        return res.status(400).json(response(400, 'kursus masih kosong'));
      }

      let kursusSaya = await MyCourse.findOne({
        where: {
          course_id: kursus.id,
          student_id: user.id,
        },
      });

      if (kursusSaya) {
        return res.status(400).json(response(400, 'anda sudah subscribe kursus ini'));
      }

      const myContents = [];
      for (let i = 0; i < kursus.contents.length; i++) {
        myContents.push({ ...kursus.contents[i].dataValues, done: false });
      }

      kursusSaya = await MyCourse.create({
        course_id: kursus.id,
        student_id: user.id,
        contents: JSON.stringify(myContents),
      });

      return res.status(200).json(response(200, 'Berhasil Subscribe kursus'));
    } catch (error) {
      return res.status(500).json(response(500, 'Internal Server Error!', error));
    }
  }
);

router.patch(
  '/done',
  isAllow,
  [
    body('content_id', 'content id should present').exists(),
    body('course_id', 'course id should present').exists(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json(response(422, errors.array()));
    }

    const { user } = res.locals;
    const { content_id, course_id } = req.body;

    if (user.type !== 'student') {
      return res.status(400).json(response(400, 'Anda tidak terdaftar sebagai siswa'));
    }
    try {
      const myCourse = await MyCourse.findOne({
        where: {
          student_id: user.id,
          course_id,
        },
      });
      if (!myCourse) {
        return res.status(400).json(response(400, 'anda tidak terdaftar kursus ini!'));
      }

      let isExist = false;
      let myContents = JSON.parse(myCourse.contents);
      myContents = myContents.map((val) => {
        if (val.id === parseInt(content_id)) {
          isExist = true;
          return {
            ...val,
            done: true,
          };
        }
        return val;
      });

      if (!isExist) {
        return res.status(400).json(response(400, 'konten tidak di temukan!'));
      }
      await myCourse.update({
        contents: JSON.stringify(myContents),
      });
      return res.status(200).json(response(200, 'Status berhasil di ubah', myContents));
    } catch (error) {
      return res.status(500).json(response(500, 'Internal Server Error!', error));
    }
  }
);

router.get('/rekomendasi', isAllow, async (req, res) => {
  const { user } = res.locals;

  if (user.type !== 'student') {
    return res.status(400).json(response(400, 'Anda tidak terdaftar sebagai siswa'));
  }

  try {
    const recommendations = await CourseRecommendation.findAll({
      attributes: { exclude: ['createdAt', 'updatedAt'] },
      limit: 2,
      include: {
        model: Course,
        attributes: { exclude: ['createdAt', 'updatedAt'] },
        include: [
          {
            model: Teacher,
            attributes: ['full_name'],
          },
          {
            model: Asset,
            as: 'course_assets',
            attributes: ['url'],
          },
        ],
      },
    });

    const payload = [];
    for (let i = 0; i < recommendations.length; i++) {
      const { id, course_id, course } = recommendations[i];
      payload.push({
        id,
        course_id,
        teacher_id: course.teacher_id,
        title: course.title,
        price: course.price,
        promo_price: course.promo_price,
        teacher_name: course.teacher.full_name,
        thumbnail: course.course_assets.url,
      });
    }
    return res.status(200).json(response(200, 'berhasil mendapatkan rekomendasi', payload));
  } catch (error) {
    return res.status(500).json(response(500, 'Internal Server Error!', error));
  }
});

module.exports = router;
