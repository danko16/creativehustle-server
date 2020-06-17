const express = require('express');
const multer = require('multer');
const { query, validationResult } = require('express-validator');
const { kursus: Kursus, assets: Asset } = require('../models');
const {
  auth: { isAllow },
  response,
} = require('../utils');
const config = require('../../config');

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
        return res.status(500).json(response(500, 'Unkonwn Erro!', error));
      }

      try {
        const { file } = req;
        const filePath = `uploads/${file.filename}`;
        const urlPath = `${config.serverDomain}/${filePath}`;
        const kursus = await Kursus.create({
          teacher_id: user.id,
          title,
          price,
          promo_price,
        });

        await Asset.create({
          url: urlPath,
          type: 'thumbnail',
          uploadable_type: 'kursus',
          uploadable_id: kursus.id,
        });

        return res.status(200).json(response(200, 'Kursus Berhasil di Upload'));
      } catch (error) {
        return res.status(500).json(response(500, 'Internal Server Error!', error));
      }
    });
  }
);

module.exports = router;
