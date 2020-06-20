const express = require('express');
const { body, validationResult } = require('express-validator');
const {
  sequelize,
  courses: Course,
  sections: Section,
  contents: Content,
  teachers: Teacher,
  my_courses: MyCourse,
  my_contents: MyContent,
  digital_assets: Asset,
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
              model: Section,
              attributes: { exclude: ['createdAt', 'updatedAt'] },
            },
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
        {
          model: MyContent,
          attributes: ['id', 'content_id', 'done'],
          include: {
            attributes: { exclude: ['createdAt', 'updatedAt'] },
            model: Content,
          },
        },
      ],
    });

    const kursusPayload = [];
    const sectionsPayload = [];
    const contentsPayload = [];
    for (let i = 0; i < kursusSaya.length; i++) {
      const myCourse = kursusSaya[i].get('course', { plain: true });
      const myContent = kursusSaya[i].get('my_contents', { plain: true });

      let doneTotal = 0;
      let total = myContent.length;

      for (let j = 0; j < myContent.length; j++) {
        const { id, done, content_id, content } = myContent[j];

        const [section] = myCourse.sections.filter((val) => val.id === content.section_id);

        contentsPayload.push({
          id: id,
          course_id: myCourse.id,
          section_id: content.section_id,
          content_id,
          done,
          section_title: section.title,
          title: content.title,
          url: content.url,
        });

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
        progress,
      });

      kursusPayload.push(course);
      sectionsPayload.push(...myCourse.sections);
    }

    return res.status(200).json(
      response(200, 'Berhasil Mendapatkan Kursus', {
        courses: kursusPayload,
        sections: sectionsPayload,
        contents: contentsPayload,
      })
    );
  } catch (error) {
    console.log(error);
    return res.status(500).json(response(500, 'Internal Server Error!', error));
  }
});

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

    const transaction = await sequelize.transaction();

    try {
      const kursus = await Course.findOne({
        where: { id: kursus_id },
        include: {
          model: Section,
          attributes: ['id'],
          include: {
            model: Content,
            attributes: ['id'],
          },
        },
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

      const contents = [];

      for (let i = 0; i < kursus.sections.length; i++) {
        const sqlContents = kursus.sections[i].get('contents', { plain: true });
        contents.push(...sqlContents);
      }

      kursusSaya = await MyCourse.create(
        {
          course_id: kursus.id,
          student_id: user.id,
        },
        { transaction }
      );

      for (let i = 0; i < contents.length; i++) {
        await MyContent.create(
          {
            my_course_id: kursusSaya.id,
            content_id: contents[i].id,
            done: false,
          },
          { transaction }
        );
      }

      await transaction.commit();
      return res.status(200).json(response(200, 'Berhasil Subscribe kursus'));
    } catch (error) {
      await transaction.rollback();
      return res.status(500).json(response(500, 'Internal Server Error!', error));
    }
  }
);

router.patch(
  '/done',
  isAllow,
  [body('my_content_id', 'my content id should present').exists()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json(response(422, errors.array()));
    }

    const { user } = res.locals;
    const { my_content_id } = req.body;

    if (user.type !== 'student') {
      return res.status(400).json(response(400, 'Anda tidak terdaftar sebagai siswa'));
    }
    try {
      let myContent = await MyContent.findOne({ where: { id: my_content_id } });

      if (!myContent) {
        return res.status(400).json(response(400, 'konten saya tidak di temukan!'));
      }

      await myContent.update({
        done: true,
      });

      return res.status(200).json(response(200, 'Status berhasil di ubah'));
    } catch (error) {
      return res.status(500).json(response(500, 'Internal Server Error!', error));
    }
  }
);

module.exports = router;
