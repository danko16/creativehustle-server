const express = require('express');
const multer = require('multer');
const { query, body, validationResult } = require('express-validator');
const {
  Sequelize,
  courses: Course,
  digital_assets: Asset,
  sections: Section,
  contents: Content,
  preview_sections: PreviewSection,
  preview_contents: PreviewContent,
} = require('../models');
const {
  auth: { isAllow },
  response,
} = require('../utils');
const config = require('../../config');
const { Op } = Sequelize;

const router = express.Router();

const storage = multer.diskStorage({
  destination: config.uploads,
  filename: function (req, file, cb) {
    cb(null, Date.now() + '.' + file.mimetype.split('/')[1]);
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 8000000, files: 3 },
  fileFilter: async function (req, file, cb) {
    // if (!req.body.type) {
    //   cb(new Error('Type need to be specified'));
    // }
    cb(null, true);
  },
}).single('file');

router.post(
  '/',
  isAllow,
  [
    query('title', 'title should present').exists(),
    query('price', 'price should present').exists(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json(response(422, errors.array()));
    }
    const { user } = res.locals;
    const { title, price, promo_price } = req.query;

    if (user.type !== 'teacher') {
      return res.status(400).json(response(400, 'Anda tidak terdaftar sebagai mentor'));
    }

    upload(req, res, async function (error) {
      if (error instanceof multer.MulterError) {
        return res.status(500).json(response(500, 'Internal Server Error!', error));
      } else if (error) {
        return res.status(500).json(response(500, 'Unkonwn Error!', error));
      }

      try {
        const { file } = req;

        const servePath = `uploads/${file.filename}`;
        const filePath = `${file.destination}/${file.filename}`;
        const urlPath = `${config.serverDomain}/${servePath}`;

        const kursus = await Course.create(
          {
            teacher_id: user.id,
            title,
            price,
            promo_price,
            course_assets: {
              url: urlPath,
              path: filePath,
              filename: file.filename,
              type: 'thumbnail',
            },
          },
          { include: { model: Asset, as: 'course_assets' } }
        );

        const payload = Object.freeze({
          kursus_id: kursus.id,
          title,
          price,
          promo_price,
          thumbnail: urlPath,
        });

        return res.status(200).json(response(200, 'Kursus Berhasil di Upload', payload));
      } catch (error) {
        return res.status(500).json(response(500, 'Internal Server Error!', error));
      }
    });
  }
);

router.post(
  '/section',
  isAllow,
  [
    body('kursus_id', 'kursus id should be present').exists(),
    body('sections', 'sections should be present')
      .exists()
      .isArray()
      .withMessage('sections must be array'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json(response(422, errors.array()));
    }

    const { user } = res.locals;
    const { sections, kursus_id } = req.body;

    if (user.type !== 'teacher') {
      return res.status(400).json(response(400, 'Anda tidak terdaftar sebagai mentor'));
    }

    try {
      if (!sections.length) {
        return res.status(400).json(response(400, 'Request sections kosong'));
      }

      let kursus = await Course.findOne({ where: { id: kursus_id }, include: { model: Section } });

      if (!kursus) {
        return res.status(400).json(response(400, 'kursus tidak ditemukan'));
      }

      if (kursus.sections.length) {
        return res.status(400).json(response(400, 'Silahkan update kursus'));
      }

      for (let i = 0; i < sections.length; i++) {
        const section = await Section.create({
          course_id: kursus.id,
          title: sections[i].title,
        });

        const contents = sections[i].contents;

        for (let j = 0; j < contents.length; j++) {
          await Content.create({
            section_id: section.id,
            title: contents[j].title,
            url: contents[j].url,
          });
        }
      }

      kursus = await Course.findOne({
        where: { id: kursus_id },
        include: [
          {
            model: Section,
            attributes: ['id', 'title'],
            include: {
              model: Content,
              attributes: ['id', 'section_id', 'title', 'url'],
            },
          },
          {
            model: Asset,
            as: 'course_assets',
            attributes: ['url'],
            where: {
              type: 'thumbnail',
            },
          },
        ],
      });

      return res
        .status(200)
        .json(response(200, 'Berhasil menambahkan section dan content', kursus));
    } catch (error) {
      console.log(error);
      return res.status(500).json(response(500, 'Internal Server Error!', error));
    }
  }
);

router.post(
  '/preview-section',
  isAllow,
  [
    body('kursus_id', 'kursus id should be present').exists(),
    body('preview_sections', 'preview sections should be present')
      .exists()
      .isArray()
      .withMessage('sections must be array'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json(response(422, errors.array()));
    }

    const { user } = res.locals;
    const { preview_sections, kursus_id } = req.body;

    if (user.type !== 'teacher') {
      return res.status(400).json(response(400, 'Anda tidak terdaftar sebagai mentor'));
    }

    try {
      if (!preview_sections.length) {
        return res.status(400).json(response(400, 'Request preview sections kosong'));
      }

      let kursus = await Course.findOne({
        where: { id: kursus_id },
        include: { model: PreviewSection },
      });

      if (!kursus) {
        return res.status(400).json(response(400, 'kursus tidak ditemukan'));
      }

      if (kursus.preview_sections.length) {
        return res.status(400).json(response(400, 'Silahkan update kursus'));
      }

      for (let i = 0; i < preview_sections.length; i++) {
        const previewSection = await PreviewSection.create({
          course_id: kursus.id,
          title: preview_sections[i].title,
        });

        const contents = preview_sections[i].preview_contents;

        for (let j = 0; j < contents.length; j++) {
          await PreviewContent.create({
            preview_sections_id: previewSection.id,
            title: contents[j].title,
            url: contents[j].url,
          });
        }
      }

      kursus = await Course.findOne({
        where: { id: kursus_id },
        include: [
          {
            model: PreviewSection,
            attributes: ['id', 'title'],
            include: {
              model: PreviewContent,
              attributes: ['id', 'preview_sections_id', 'title', 'url'],
            },
          },
          {
            model: Asset,
            as: 'course_assets',
            attributes: ['url'],
            where: {
              type: 'thumbnail',
            },
          },
        ],
      });

      return res
        .status(200)
        .json(response(200, 'Berhasil menambahkan section dan content', kursus));
    } catch (error) {
      return res.status(500).json(response(500, 'Internal Server Error!', error));
    }
  }
);

router.get('/', [body('from', 'from must be present').exists()], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json(response(422, errors.array()));
  }
  const { from } = req.body;
  try {
    const kursus = await Course.findAll({
      where: {
        id: { [Op.gt]: from },
      },
      limit: 9,
      include: [
        {
          model: PreviewSection,
          attributes: ['id', 'title'],
          required: true,
          include: {
            model: PreviewContent,
            required: true,
            attributes: ['id', 'preview_sections_id', 'title', 'url'],
          },
        },
        {
          model: Asset,
          as: 'course_assets',
          attributes: ['url'],
          where: {
            type: 'thumbnail',
          },
        },
      ],
    });
    return res.status(200).json(response(200, 'Berhasil mendapatkan kursus', kursus));
  } catch (error) {
    return res.status(500).json(response(500, 'Internal Server Error!', error));
  }
});

module.exports = router;
