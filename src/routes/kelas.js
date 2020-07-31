const express = require('express');
const multer = require('multer');
const sequelize = require('sequelize');
const sharp = require('sharp');
const { query, param, body, validationResult } = require('express-validator');
const {
  classes: Kelas,
  digital_assets: Asset,
  extra_matters: ExtraMatter,
  teachers: Teacher,
  class_schedules: ClassSchedule,
} = require('../models');
const {
  auth: { isAllow },
  response,
} = require('../utils');
const config = require('../../config');
const { Op } = sequelize;

const uploadsStorage = multer.diskStorage({
  destination: config.uploads,
  filename: function (req, file, cb) {
    cb(null, Date.now() + '.' + file.mimetype.split('/')[1]);
  },
});

const documentsStorage = multer.diskStorage({
  destination: config.documents,
  filename: function (req, file, cb) {
    cb(null, Date.now() + '.' + file.mimetype.split('/')[1]);
  },
});

const upload = multer({
  storage: uploadsStorage,
  limits: { fileSize: 8000000, files: 3 },
  fileFilter: async function (req, file, cb) {
    // if (!req.body.type) {
    //   cb(new Error('Type need to be specified'));
    // }
    cb(null, true);
  },
}).single('file');

const uploads = multer({
  storage: documentsStorage,
  limits: { fileSize: 20000000, files: 5 },
  fileFilter: async function (req, file, cb) {
    // if (!req.body.type) {
    //   cb(new Error('Type need to be specified'));
    // }
    cb(null, true);
  },
}).array('files', 5);

const router = express.Router();

router.post(
  '/',
  isAllow,
  [
    query('title', 'title should present').exists(),
    query('desc', 'description should present').exists(),
    query('sections', 'sections should present').exists(),
    query('price', 'price should present').exists(),
    query('type', 'type should present').exists(),
    query('topics', 'topics should present').exists(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json(response(422, errors.array()));
    }

    const { user } = res.locals;
    const { title, price, desc, sections, promo_price, tel_group, type, topics } = req.query;

    if (user.type !== 'teacher') {
      return res.status(400).json(response(400, 'anda tidak terdaftar sebagai mentor!'));
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
          return res.status(400).json(response(400, 'File must be present'));
        }
        const servePath = `uploads/${file.filename}`;
        const filePath = `${file.destination}/${file.filename}`;
        const urlPath = `${config.serverDomain}/${servePath}`;

        const sharpFile = await sharp(filePath).toBuffer();

        sharp(sharpFile)
          .resize(420, 260)
          .toFile(filePath, (err, info) => {});

        const kelas = await Kelas.create(
          {
            teacher_id: user.id,
            title,
            price,
            desc,
            sections,
            promo_price,
            tel_group,
            approved: false,
            type,
            topics,
            class_assets: {
              url: urlPath,
              path: filePath,
              filename: file.filename,
              type: 'thumbnail',
            },
          },
          { include: { model: Asset, as: 'class_assets' } }
        );

        const payload = Object.freeze({
          kelas_id: kelas.id,
          title,
          price,
          promo_price,
          desc,
          type,
          topics,
          sections: JSON.parse(sections),
          thumbnail: urlPath,
        });

        return res.status(200).json(response(200, 'Berhasil Upload Kelas', payload));
      } catch (error) {
        return res.status(500).json(response(500, 'Internal Server Error!', error));
      }
    });
  }
);

router.post(
  '/jadwal',
  isAllow,
  [
    body('class_id', 'class id should be present').exists(),
    body('schedules', 'scheduldes should be present')
      .exists()
      .isArray()
      .withMessage('schedules must be an array'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json(response(422, errors.array()));
    }

    const { user } = res.locals;
    const { schedules, class_id } = req.body;

    if (user.type !== 'teacher') {
      return res.status(400).json(response(400, 'anda tidak terdaftar sebagai mentor!'));
    }

    try {
      const kelas = await Kelas.findOne({ where: { id: class_id } });
      if (!kelas) {
        return res.status(400).json(response(400, 'kelas tidak ditemukan!'));
      }
      for (let i = 0; i < schedules.length; i++) {
        await ClassSchedule.create({
          class_id,
          ...schedules[i],
        });
      }
      return res.status(200).json(response(200, 'Berhasil Menambahkan Jadwal'));
    } catch (error) {
      return res.status(500).json(response(500, 'Internal Server Error!', error));
    }
  }
);

router.post(
  '/:class_id/tambahan',
  isAllow,
  [param('class_id', 'class id should be present').exists()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json(response(422, errors.array()));
    }

    const { user } = res.locals;
    const { class_id } = req.params;

    if (user.type !== 'teacher') {
      return res.status(400).json(response(400, 'anda tidak terdaftar sebagai mentor!'));
    }

    const kelas = await Kelas.findOne({ where: { id: class_id } });

    if (!kelas) {
      return res.status(400).json(response(400, 'kelas tidak di temukan!'));
    }

    uploads(req, res, async function (error) {
      if (error instanceof multer.MulterError) {
        return res.status(500).json(response(500, 'Internal Server Error!', error));
      } else if (error) {
        return res.status(500).json(response(500, 'Unkonwn Error!', error));
      }

      try {
        const { files } = req;
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          const servePath = `documents/${file.filename}`;
          const filePath = `${file.destination}/${file.filename}`;
          const urlPath = `${config.serverDomain}/${servePath}`;

          const extraMatter = await ExtraMatter.create({
            class_id,
            title: files[i].title ? files[i].title : 'this is development',
          });

          await Asset.create({
            extra_matter_id: extraMatter.id,
            url: urlPath,
            path: filePath,
            filename: file.filename,
            type: 'materi',
          });
        }

        return res.status(200).json(response(200, 'Berhasil upload materi tambahan'));
      } catch (error) {
        return res.status(500).json(response(500, 'Internal Server Error!', error));
      }
    });
  }
);

router.get('/', [query('from', 'from must be present').exists()], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json(response(422, errors.array()));
  }
  const { from } = req.query;

  try {
    const kelas = await Kelas.findAll({
      where: {
        id: { [Op.gt]: from },
        approved: true,
      },
      attributes: { exclude: ['createdAt', 'updatedAt'] },
      limit: 9,
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
          attributes: ['full_name', 'job', 'biography'],
        },
        {
          model: ClassSchedule,
          required: true,
          attributes: { exclude: ['createdAt', 'updatedAt'] },
        },
      ],
    }).map((el) => el.get({ plain: true }));

    const classes = [];
    for (let i = 0; i < kelas.length; i++) {
      const schedules = kelas[i].class_schedules;
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
        id: kelas[i].id,
        teacher_id: kelas[i].teacher_id,
        title: kelas[i].title,
        desc: kelas[i].desc,
        start_date: schedules[0],
        end_date: schedules[schedules.length - 1],
        sections: JSON.parse(kelas[i].sections),
        price: kelas[i].price,
        promo_price: kelas[i].promo_price,
        type: kelas[i].type,
        topics: kelas[i].topics,
        teacher_name: kelas[i].teacher.full_name,
        teacher_job: kelas[i].teacher.job,
        teacher_biography: kelas[i].teacher.biography,
        thumbnail: kelas[i].class_assets.url,
      });
    }

    return res.status(200).json(response(200, 'Berhasil mendapatkan kelas', classes));
  } catch (error) {
    return res.status(500).json(response(500, 'Internal Server Error!', error));
  }
});

router.get('/cari', [query('keywords', 'keywords must be present').exists()], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json(response(422, errors.array()));
  }
  const { keywords } = req.query;

  try {
    const kelas = await Kelas.findAll({
      where: {
        title: { [Op.like]: `%${keywords}%` },
      },
      attributes: { exclude: ['createdAt', 'updatedAt'] },
      limit: 9,
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
          required: true,
          attributes: { exclude: ['createdAt', 'updatedAt'] },
        },
      ],
    }).map((el) => el.get({ plain: true }));

    const classes = [];
    for (let i = 0; i < kelas.length; i++) {
      const schedules = kelas[i].class_schedules;
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
        id: kelas[i].id,
        teacher_id: kelas[i].teacher_id,
        title: kelas[i].title,
        desc: kelas[i].desc,
        start_date: schedules[0],
        end_date: schedules[schedules.length - 1],
        sections: JSON.parse(kelas[i].sections),
        price: kelas[i].price,
        promo_price: kelas[i].promo_price,
        teacher_name: kelas[i].teacher.full_name,
        thumbnail: kelas[i].class_assets.url,
      });
    }

    return res.status(200).json(response(200, 'Berhasil mendapatkan kelas', classes));
  } catch (error) {
    return res.status(500).json(response(500, 'Internal Server Error!', error));
  }
});

module.exports = router;
