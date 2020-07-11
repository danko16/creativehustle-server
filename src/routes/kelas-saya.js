const express = require('express');
const { param, body, validationResult } = require('express-validator');
const {
  classes: Kelas,
  my_classes: MyClass,
  class_schedules: ClassSchedule,
  digital_assets: Asset,
  teachers: Teacher,
  extra_matters: ExtraMatter,
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
    let myClass = await MyClass.findAll({
      where: {
        student_id: user.id,
      },
      attributes: { exclude: ['createdAt', 'updatedAt'] },
      include: {
        model: Kelas,
        attributes: { exclude: ['desc', 'sections', 'createdAt', 'updatedAt'] },
        include: [
          {
            model: Asset,
            as: 'class_assets',
            attributes: ['url'],
            where: {
              type: 'thumbnail',
            },
          },
          {
            model: Teacher,
            attributes: ['full_name'],
          },
          {
            model: ClassSchedule,
            attributes: { exclude: ['createdAt', 'updatedAt'] },
          },
        ],
      },
    });

    const classes = [];
    for (let i = 0; i < myClass.length; i++) {
      const kelas = myClass[i].get('class', { plain: true });
      const schedules = kelas.class_schedules;
      schedules.sort((a, b) => {
        const aDate = a.date.split('-');
        const bDate = b.date.split('-');
        const startDate = new Date(aDate[2], aDate[1], aDate[0]);
        const endDate = new Date(bDate[2], bDate[1], bDate[0]);
        if (a.link) {
          delete a.link;
        }
        if (a.password) {
          delete a.password;
        }
        if (b.link) {
          delete b.link;
        }
        if (b.password) {
          delete b.password;
        }

        return startDate - endDate;
      });

      classes.push({
        id: kelas.id,
        teacher_id: kelas.teacher_id,
        title: kelas.title,
        tel_group: kelas.tel_group,
        start_date: schedules[0],
        end_date: schedules[schedules.length - 1],
        thumbnail: kelas.class_assets.url,
        teacher_name: kelas.teacher.full_name,
      });
    }

    return res.status(200).json(response(200, 'Berhasil mendapatkan kelas', classes));
  } catch (error) {
    return res.status(500).json(response(500, 'Internal Server Error!', error));
  }
});

router.get(
  '/:class_id/jadwal',
  isAllow,
  [param('class_id', 'class id should be present').exists()],
  async (req, res) => {
    const { user } = res.locals;
    const { class_id } = req.params;

    if (user.type !== 'student') {
      return res.status(400).json(response(400, 'Anda tidak terdaftar sebagai siswa'));
    }
    try {
      let myClasses = await MyClass.findOne({
        where: {
          class_id,
          student_id: user.id,
        },
        attributes: { exclude: ['createdAt', 'updatedAt'] },
        include: {
          model: Kelas,
          attributes: { exclude: ['desc', 'sections', 'createdAt', 'updatedAt'] },
          include: [
            {
              model: Teacher,
              attributes: ['full_name'],
            },
            {
              model: ClassSchedule,
              attributes: { exclude: ['createdAt', 'updatedAt'] },
            },
            {
              model: ExtraMatter,
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
      });

      if (!myClasses) {
        return res.status(400).json(response(400, 'anda tidak terdaftar kelas ini!'));
      }

      const kelas = myClasses.get('class', { plain: true });
      const materiTambahan = kelas.extra_matters.map((el) => ({
        id: el.id,
        class_id: el.class_id,
        title: el.title,
        matter: el.extra_matter_assets.url,
      }));

      const schedules = kelas.class_schedules;
      schedules.sort((a, b) => {
        const aDate = a.date.split('-');
        const bDate = b.date.split('-');
        const startDate = new Date(aDate[2], aDate[1], aDate[0]);
        const endDate = new Date(bDate[2], bDate[1], bDate[0]);

        return startDate - endDate;
      });

      const payload = {
        schedules,
        materi_tambahan: materiTambahan,
        tel_group: kelas.tel_group,
      };
      return res.status(200).json(response(200, 'Berhasil mendapatkan jadwal', payload));
    } catch (error) {
      return res.status(500).json(response(500, 'Internal Server Error!', error));
    }
  }
);

router.post(
  '/subscribe',
  isAllow,
  [body('class_id', 'class id should be present').exists()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json(response(422, errors.array()));
    }

    const { user } = res.locals;
    const { class_id } = req.body;

    if (user.type !== 'student') {
      return res.status(400).json(response(400, 'Anda tidak terdaftar sebagai siswa'));
    }

    try {
      const kelas = await Kelas.findOne({
        where: { id: class_id },
        attributes: { exclude: ['createdAt', 'updatedAt'] },
        include: {
          model: ClassSchedule,
          attributes: { exclude: ['createdAt', 'updatedAt'] },
        },
      });

      if (!kelas) {
        return res.status(400).json(response(400, 'Kelas tidak ditemukan'));
      }

      let kelasSaya = await MyClass.findOne({
        where: {
          class_id: kelas.id,
          student_id: user.id,
        },
      });

      if (kelasSaya) {
        return res.status(400).json(response(400, 'anda sudah subscribe kelas ini'));
      }

      const schedules = kelas.get('class_schedules', { plain: true });

      kelasSaya = await MyClass.create({
        class_id: kelas.id,
        student_id: user.id,
        schedules: JSON.stringify(schedules),
      });

      return res.status(200).json(response(200, 'Berhasil subscribe kelas'));
    } catch (error) {
      return res.status(500).json(response(500, 'Internal Server Error!', error));
    }
  }
);

module.exports = router;
