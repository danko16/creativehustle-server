const express = require('express');
const { body, validationResult } = require('express-validator');
const { contact_us: ContactUs } = require('../models');
const { response } = require('../utils');

const router = express.Router();

router.post(
  '/',
  [
    body('name', 'name must be present')
      .exists()
      .isLength({
        min: 4,
      })
      .withMessage('name must be at least 4 chars long'),
    body('email', 'email must be present').exists().isEmail().withMessage('email not valid'),
    body('in_regard', 'in regard must be present').exists(),
    body('message', 'message must be present')
      .exists()
      .isLength({
        min: 8,
      })
      .withMessage('name must be at least 8 chars long'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(422).json(response(422, errors.array()));
    }

    const { name, email, in_regard, message } = req.body;
    try {
      await ContactUs.create({
        name,
        email,
        in_regard,
        message,
      });
      return res.status(201).json(response(201, 'Pesan Berhasil di Kirim'));
    } catch (error) {
      return res.status(500).json(response(500, 'Internal Server Error!', error));
    }
  }
);

module.exports = router;
