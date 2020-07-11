const express = require('express');
const multer = require('multer');
const { query, body, param, validationResult } = require('express-validator');
const {
  Sequelize,
  courses: Course,
  digital_assets: Asset,
  sections: Section,
  contents: Content,
  teachers: Teacher,
  extra_matters: ExtraMatter,
} = require('../models');
const {
  auth: { isAllow },
  response,
} = require('../utils');
const config = require('../../config');
const { Op } = Sequelize;

const router = express.Router();

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

router.post(
  '/',
  isAllow,
  [
    query('title', 'title should present').exists(),
    query('desc', 'description should present').exists(),
    query('benefit', 'benefit should present').exists(),
    query('price', 'price should present').exists(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json(response(422, errors.array()));
    }
    const { user } = res.locals;
    const { title, price, desc, benefit, promo_price } = req.query;

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
        if (!file) {
          return res.status(400).json(response(400, 'File must be present'));
        }
        const servePath = `uploads/${file.filename}`;
        const filePath = `${file.destination}/${file.filename}`;
        const urlPath = `${config.serverDomain}/${servePath}`;

        const kursus = await Course.create(
          {
            teacher_id: user.id,
            title,
            price,
            desc,
            benefit,
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
          desc,
          benefit: JSON.parse(benefit),
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
            course_id: kursus_id,
            section_id: section.id,
            title: contents[j].title,
            url: contents[j].url,
            is_preview: contents[j].is_preview,
          });
        }
      }

      kursus = await Course.findOne({
        where: { id: kursus_id },
        attributes: { exclude: ['createdAt', 'updatedAt'] },
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
            model: Asset,
            as: 'course_assets',
            attributes: ['url'],
            where: {
              type: 'thumbnail',
            },
          },
        ],
      });

      kursus = kursus.get({ plain: true });
      kursus.benefit = JSON.parse(kursus.benefit);
      kursus.thumbnail = kursus.course_assets.url;
      delete kursus.course_assets;

      return res
        .status(200)
        .json(response(200, 'Berhasil menambahkan section dan content', kursus));
    } catch (error) {
      return res.status(500).json(response(500, 'Internal Server Error!', error));
    }
  }
);

router.post(
  '/:course_id/tambahan',
  [
    param('course_id', 'course id should be present').exists(),
    query('tel_group', 'tel group should be present').exists(),
  ],
  isAllow,
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json(response(422, errors.array()));
    }

    const { user } = res.locals;
    const { course_id } = req.params;
    const { tel_group } = req.query;

    if (user.type !== 'teacher') {
      return res.status(400).json(response(400, 'Anda tidak terdaftar sebagai mentor'));
    }

    const kursus = await Course.findOne({ where: { id: course_id } });

    if (!kursus) {
      return res.status(400).json(response(400, 'kursus tidak di temukan!'));
    }

    await kursus.update({
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

          const extraMatter = await ExtraMatter.create({
            course_id,
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
    const kursus = await Course.findAll({
      where: {
        id: { [Op.gt]: from },
      },
      attributes: { exclude: ['createdAt', 'updatedAt'] },
      limit: 9,
      include: [
        {
          model: Asset,
          as: 'course_assets',
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
          model: Content,
          required: true,
        },
      ],
    }).map((el) => el.get({ plain: true }));

    const courses = [];
    for (let i = 0; i < kursus.length; i++) {
      courses.push({
        id: kursus[i].id,
        teacher_id: kursus[i].teacher_id,
        title: kursus[i].title,
        desc: kursus[i].desc,
        benefit: JSON.parse(kursus[i].benefit),
        price: kursus[i].price,
        promo_price: kursus[i].promo_price,
        teacher_name: kursus[i].teacher.full_name,
        thumbnail: kursus[i].course_assets.url,
      });
    }

    return res.status(200).json(response(200, 'Berhasil mendapatkan kursus', courses));
  } catch (error) {
    return res.status(500).json(response(500, 'Internal Server Error!', error));
  }
});

router.get(
  '/:course_id/contents',
  [param('course_id', 'course id should be present').exists()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json(response(422, errors.array()));
    }

    const { course_id } = req.params;

    try {
      const course = await Course.findOne({
        where: { id: course_id },
        attributes: ['id'],
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
        return res.status(400).json(response(400, 'Kursus tidak ditemukan!'));
      }

      const sections = course.get('sections', { plain: true });
      const contents = course.get('contents', { plain: true });

      return res.status(200).json(
        response(200, 'Berhasil mendapatkan Contents', {
          sections,
          contents,
        })
      );
    } catch (error) {
      return res.status(500).json(response(500, 'Internal Server Error!', error));
    }
  }
);

router.get('/cari', [query('keywords', 'keywords should be presents')], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json(response(422, errors.array()));
  }

  const { keywords } = req.query;

  try {
    const kursus = await Course.findAll({
      where: {
        title: { [Op.like]: `%${keywords}%` },
      },
      attributes: { exclude: ['createdAt', 'updatedAt'] },
      limit: 9,
      include: [
        {
          model: Asset,
          as: 'course_assets',
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
          model: Content,
          required: true,
        },
      ],
    }).map((el) => el.get({ plain: true }));

    const courses = [];
    for (let i = 0; i < kursus.length; i++) {
      courses.push({
        id: kursus[i].id,
        teacher_id: kursus[i].teacher_id,
        title: kursus[i].title,
        desc: kursus[i].desc,
        benefit: JSON.parse(kursus[i].benefit),
        price: kursus[i].price,
        promo_price: kursus[i].promo_price,
        teacher_name: kursus[i].teacher.full_name,
        thumbnail: kursus[i].course_assets.url,
      });
    }
    return res.status(200).json(response(200, 'Berhasil mendapatkan Kursus', courses));
  } catch (error) {
    return res.status(500).json(response(500, 'Internal Server Error!', error));
  }
});

module.exports = router;
