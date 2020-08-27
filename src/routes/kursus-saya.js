const express = require('express');
const { body, param, validationResult } = require('express-validator');
const { Op } = require('sequelize');
const {
  courses: Course,
  sections: Section,
  contents: Content,
  teachers: Teacher,
  students: Student,
  my_courses: MyCourse,
  digital_assets: Asset,
  course_recommendations: CourseRecommendation,
  extra_matters: ExtraMatter,
  sequelize,
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
              model: Content,
              attributes: { exclude: ['createdAt', 'updatedAt'] },
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
      const myContent = myCourse.contents;
      const done = JSON.parse(kursusSaya[i].done);
      let doneTotal = 0;
      let total = myContent.length;

      Object.keys(done).forEach((key) => {
        if (done[key]) {
          doneTotal++;
        }
      });

      const progress = Math.floor((doneTotal / total) * 100);

      const course = Object.freeze({
        id: myCourse.id,
        teacher_id: myCourse.teacher_id,
        title: myCourse.title,
        price: myCourse.price,
        promo_price: myCourse.promo_price,
        teacher_name: myCourse.teacher.full_name,
        participant: myCourse.participant,
        rating: JSON.parse(myCourse.rating),
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
        include: [
          {
            model: Course,
            include: [
              {
                model: Section,
                attributes: { exclude: ['createdAt', 'updatedAt'] },
              },
              {
                model: Content,
                attributes: { exclude: ['createdAt', 'updatedAt'] },
              },
              {
                model: ExtraMatter,
                required: false,
                attributes: { exclude: ['createdAt', 'updatedAt'] },
                include: {
                  model: Asset,
                  as: 'extra_matter_assets',
                  required: false,
                  attributes: ['url'],
                  where: {
                    type: 'materi',
                  },
                },
              },
            ],
          },
        ],
      });

      if (!myCourse) {
        return res.status(400).json(response(400, 'anda tidak terdaftar kursus ini!'));
      }

      const contents = [];
      const done = JSON.parse(myCourse.done);
      const myContents = myCourse.course.get('contents', { plain: true });
      const sections = myCourse.course.get('sections', { plain: true });
      const materiTambahan = myCourse.course.get('extra_matters', { plain: true }).map((el) => ({
        id: el.id,
        course_id: el.course_id,
        title: el.title,
        matter: el.extra_matter_assets.url,
      }));

      myContents.forEach((content) => {
        const [section] = sections.filter((val) => val.id === content.section_id);
        contents.push({
          ...content,
          section_title: section.title,
          done: done[content.id],
        });
      });

      return res.status(200).json(
        response(200, 'Berhasil Mendapatkan Contents', {
          sections,
          contents,
          materi_tambahan: materiTambahan,
          tel_group: myCourse.course.tel_group,
        })
      );
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
      let done = JSON.parse(myCourse.done);

      if (Object.keys(done).includes(`${content_id}`)) {
        isExist = true;
      }
      if (!isExist) {
        return res.status(400).json(response(400, 'konten tidak di temukan!'));
      }
      done[content_id] = true;
      await myCourse.update({
        done: JSON.stringify(done),
      });
      return res.status(200).json(response(200, 'Status berhasil di ubah', { ok: true }));
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
    const student = await Student.findOne({
      where: { id: user.id },
      include: [
        {
          model: MyCourse,
          required: false,
        },
        {
          model: CourseRecommendation,
          required: false,
        },
      ],
    });

    if (!student) {
      return res.status(400).json(response(400, 'Anda tidak terdaftar sebagai siswa'));
    }

    const myCoursesId = student.get('my_courses', { plain: true }).map((val) => val.course_id);
    const myRecommendId = student
      .get('course_recommendations', { plain: true })
      .map((val) => val.course_id);

    const recommendation = await Course.findAll({
      where: {
        id: {
          [Op.notIn]: [...myCoursesId, ...myRecommendId],
        },
      },
      attributes: ['id'],
      limit: 4,
    }).map((val) => ({ course_id: val.id, student_id: student.id }));

    await CourseRecommendation.destroy({ where: { course_id: myCoursesId, student_id: user.id } });
    if (recommendation.length) {
      await CourseRecommendation.bulkCreate(recommendation);
    }

    const recommendations = await CourseRecommendation.findAll({
      attributes: { exclude: ['createdAt', 'updatedAt'] },
      where: {
        student_id: user.id,
      },
      limit: 4,
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
          {
            model: Content,
            required: true,
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
        participant: course.participant,
        rating: JSON.parse(course.rating),
        teacher_name: course.teacher.full_name,
        thumbnail: course.course_assets.url,
      });
    }
    return res.status(200).json(response(200, 'berhasil mendapatkan rekomendasi', payload));
  } catch (error) {
    return res.status(500).json(response(500, 'Internal Server Error!', error));
  }
});

router.post(
  '/free',
  isAllow,
  [body('course_id', 'course id must be present').exists()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json(response(422, errors.array()));
    }

    const { user } = res.locals;
    const { course_id } = req.body;

    if (user.type !== 'student') {
      return res.status(400).json(response(400, 'Anda tidak terdaftar sebagai siswa'));
    }
    const transaction = await sequelize.transaction();

    try {
      const course = await Course.findOne({
        where: { id: course_id },
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
      if (!course) {
        return res.status(400).json(response(400, 'Kursus tidak di temukan'));
      }

      if (course.type !== 'free') {
        return res.status(400).json(response(400, 'Kursus ini tidak gratis'));
      }

      let kursusSaya = await MyCourse.findOne({
        where: {
          course_id,
          student_id: user.id,
        },
      });

      if (kursusSaya) {
        return res
          .status(200)
          .json(response(200, 'Anda sudah mengikuti kursus ini', { already_followed: true }));
      }

      const contents = course.get('contents', { plain: true });
      const done = {};

      for (let i = 0; i < contents.length; i++) {
        const { id } = contents[i];
        done[id] = false;
      }

      kursusSaya = await MyCourse.create(
        {
          course_id,
          student_id: user.id,
          done: JSON.stringify(done),
        },
        { transaction }
      );

      await course.update(
        {
          participant: course.participant + 1,
        },
        { transaction }
      );

      await transaction.commit();
      return res.status(200).json(response(200, 'Berhasil mengikuti kursus!', { ok: true }));
    } catch (error) {
      await transaction.rollback();
      return res.status(500).json(response(500, 'Internal Server Error!', error));
    }
  }
);

module.exports = router;
