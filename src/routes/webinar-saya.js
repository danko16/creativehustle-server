const express = require('express');
const { param, body, validationResult } = require('express-validator');
const {
  webinars: Webinar,
  my_webinars: MyWebinar,
  webinar_schedules: WebinarSchedule,
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
    let myWebinar = await MyWebinar.findAll({
      where: {
        student_id: user.id,
      },
      attributes: { exclude: ['createdAt', 'updatedAt'] },
      include: {
        model: Webinar,
        attributes: { exclude: ['desc', 'sections', 'createdAt', 'updatedAt'] },
        include: [
          {
            model: Asset,
            as: 'webinar_assets',
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
            model: WebinarSchedule,
            attributes: { exclude: ['createdAt', 'updatedAt'] },
          },
        ],
      },
    });

    const webinars = [];
    for (let i = 0; i < myWebinar.length; i++) {
      const webinar = myWebinar[i].get('webinar', { plain: true });
      const schedules = webinar.webinar_schedules;
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

      webinars.push({
        id: webinar.id,
        teacher_id: webinar.teacher_id,
        title: webinar.title,
        tel_group: webinar.tel_group,
        start_date: schedules[0],
        end_date: schedules[schedules.length - 1],
        thumbnail: webinar.webinar_assets.url,
        teacher_name: webinar.teacher.full_name,
      });
    }

    return res.status(200).json(response(200, 'Berhasil mendapatkan webinar', webinars));
  } catch (error) {
    return res.status(500).json(response(500, 'Internal Server Error!', error));
  }
});

router.get(
  '/:webinar_id/jadwal',
  isAllow,
  [param('webinar_id', 'webinars id should be present').exists()],
  async (req, res) => {
    const { user } = res.locals;
    const { webinar_id } = req.params;

    if (user.type !== 'student') {
      return res.status(400).json(response(400, 'Anda tidak terdaftar sebagai siswa'));
    }
    try {
      let myWebinares = await MyWebinar.findOne({
        where: {
          webinar_id,
          student_id: user.id,
        },
        attributes: { exclude: ['createdAt', 'updatedAt'] },
        include: {
          model: Webinar,
          attributes: { exclude: ['desc', 'sections', 'createdAt', 'updatedAt'] },
          include: [
            {
              model: Teacher,
              attributes: ['full_name'],
            },
            {
              model: WebinarSchedule,
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

      if (!myWebinares) {
        return res.status(400).json(response(400, 'anda tidak terdaftar webinar ini!'));
      }

      const webinar = myWebinares.get('webinar', { plain: true });
      const materiTambahan = webinar.extra_matters.map((el) => ({
        id: el.id,
        webinar_id: el.webinar_id,
        title: el.title,
        matter: el.extra_matter_assets.url,
      }));

      const schedules = webinar.webinar_schedules;
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
        tel_group: webinar.tel_group,
      };
      return res.status(200).json(response(200, 'Berhasil mendapatkan jadwal', payload));
    } catch (error) {
      return res.status(500).json(response(500, 'Internal Server Error!', error));
    }
  }
);

router.post(
  '/free',
  isAllow,
  [body('webinar_id', 'webinar id should be present').exists()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json(response(422, errors.array()));
    }

    const { user } = res.locals;
    const { webinar_id } = req.body;

    if (user.type !== 'student') {
      return res.status(400).json(response(400, 'Anda tidak terdaftar sebagai siswa'));
    }
    try {
      const webinar = await Webinar.findOne({
        where: { id: webinar_id },
        attributes: { exclude: ['createdAt', 'updatedAt'] },
        include: {
          model: WebinarSchedule,
          attributes: { exclude: ['createdAt', 'updatedAt'] },
        },
      });

      if (!webinar) {
        return res.status(400).json(response(400, 'Webinar tidak di temukan'));
      }

      if (webinar.type !== 'free') {
        return res.status(400).json(response(400, 'Webinar tidak gratis'));
      }

      let webinarSaya = await MyWebinar.findOne({ where: { webinar_id, student_id: user.id } });

      if (webinarSaya) {
        return res
          .status(200)
          .json(response(200, 'Anda sudah mengikuti webinar ini', { already_followed: true }));
      }

      webinarSaya = await MyWebinar.create({
        webinar_id,
        student_id: user.id,
      });

      return res.status(200).json(response(200, 'Berhasil Mengikuti Webinar', { ok: true }));
    } catch (error) {
      return res.status(500).json(response(500, 'Internal Server Error!', error));
    }
  }
);

module.exports = router;
