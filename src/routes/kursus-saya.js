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
              include: {
                attributes: { exclude: ['createdAt', 'updatedAt'] },
                model: Content,
              },
            },
            {
              model: Teacher,
              attributes: ['full_name'],
            },
          ],
        },
        {
          model: MyContent,
          attributes: ['id', 'content_id', 'done'],
        },
      ],
    });

    const kursus = [];
    for (let i = 0; i < kursusSaya.length; i++) {
      const contents = kursusSaya[i].get('my_contents', { plain: true });
      let done = 0;
      let total = contents.length;
      for (let j = 0; j < contents.length; j++) {
        if (contents[j].done) {
          done++;
        }
      }

      const progress = Math.floor((done / total) * 100);
      kursus.push({
        ...kursusSaya[i].get('course', { plain: true }),
        progress,
      });
    }

    return res.status(200).json(response(200, 'Berhasil Mendapatkan Kursus', kursus));
  } catch (error) {
    console.log(error);
    return res.status(500).json(response(500, 'Internal Server Error!', error));
  }
});

router.get('/progress', isAllow, async (req, res) => {
  const { user } = res.locals;

  if (user.type !== 'student') {
    return res.status(400).json(response(400, 'Anda tidak terdaftar sebagai siswa'));
  }
  try {
    const kursusSaya = await MyCourse.findAll({
      where: {
        student_id: user.id,
      },
      include: {
        model: MyContent,
        attributes: ['id', 'content_id', 'done'],
      },
    });

    const payload = [];
    for (let i = 0; i < kursusSaya.length; i++) {
      const contents = kursusSaya[i].get('my_contents', { plain: true });

      payload.push({
        kursus_id: kursusSaya[i].course_id,
        contents,
      });
    }

    return res.status(200).json(response(200, 'Berhasil Mendapatkan Progress Kursus', payload));
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

module.exports = router;
