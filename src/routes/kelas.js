const express = require('express');
const multer = require('multer');
const { query, validationResult } = require('express-validator');
const { classes: Kelas, digital_assets: Asset } = require('../models');
const {
  auth: { isAllow },
  response,
} = require('../utils');
const config = require('../../config');

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

const router = express.Router();

router.post(
  '/',
  [
    query('title', 'title should present').exists(),
    query('desc', 'description should present').exists(),
    query('matter', 'matter should present').exists(),
    query('price', 'price should present').exists(),
  ],
  isAllow,
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json(response(422, errors.array()));
    }

    const { user } = res.locals;
    const { title, price, desc, matter, promo_price } = req.query;

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
            matter,
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
          matter: JSON.parse(matter),
          thumbnail: urlPath,
        });

        return res.status(200).json(response(200, 'Berhasil Upload Kelas', payload));
      } catch (error) {
        return res.status(500).json(response(500, 'Internal Server Error!', error));
      }
    });
  }
);

module.exports = router;
