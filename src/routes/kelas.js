const express = require('express');
const multer = require('multer');
const { query, param, body, validationResult } = require('express-validator');
const { classes: Kelas, digital_assets: Asset } = require('../models');
const {
  auth: { isAllow },
  response,
} = require('../utils');
const config = require('../../config');

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
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json(response(422, errors.array()));
    }

    const { user } = res.locals;
    const { title, price, desc, sections, promo_price } = req.query;

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

        const kelas = await Kelas.create(
          {
            teacher_id: user.id,
            title,
            price,
            desc,
            sections,
            promo_price,
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
          kursus_id: kelas.id,
          title,
          price,
          promo_price,
          desc,
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
      await kelas.update({
        schedules: JSON.stringify(schedules),
      });
      return res.status(200).json(response(200, 'Berhasil Menambahkan Jadwal'));
    } catch (error) {
      return res.status(500).json(response(500, 'Internal Server Error!', error));
    }
  }
);

router.post(
  '/:class_id/tambahan',
  isAllow,
  [
    param('class_id', 'class id should be present'),
    query('tel_group', 'tel group should be present'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json(response(422, errors.array()));
    }

    const { user } = res.locals;
    const { tel_group } = req.query;
    const { class_id } = req.params;

    if (user.type !== 'teacher') {
      return res.status(400).json(response(400, 'anda tidak terdaftar sebagai mentor!'));
    }

    const kelas = await Kelas.findOne({ where: { id: class_id } });

    if (!kelas) {
      return res.status(400).json(response(400, 'kelas tidak di temukan!'));
    }

    await kelas.update({
      tel_group,
    });

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

          await Asset.create({
            class_id,
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

module.exports = router;
