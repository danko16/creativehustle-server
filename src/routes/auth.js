require('module-alias/register');
const express = require('express');
const { body, query, validationResult } = require('express-validator');
const moment = require('moment');
const config = require('@config');
const response = require('@utils/response');
const { encrypt, getRegisterToken, checkRegisterToken } = require('@utils/token');
const { sendActivationEmail } = require('@utils/emails');
const Users = require('@schema/users');
const router = express.Router();

const DateNow = moment().format('MM/DD/YYYY, HH:mm:ss');

router.post(
  '/register',
  [
    body('full_name', 'full name should be present')
      .matches(/^[A-Za-z\s]+$/i)
      .withMessage('full name can only contain char and space')
      .exists()
      .isLength({
        min: 4,
      })
      .withMessage('full name must be at least 4 chars long'),
    body('email', 'email should be present')
      .exists()
      .isEmail()
      .withMessage('must be a valid email'),
    body('password', 'passwords must be at least 6 chars long').exists().isLength({
      min: 6,
    }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json(response(422, errors.array()));
    }

    const { full_name, email, password } = req.body;
    try {
      let user = await Users.findOne({ email });
      if (user) {
        return res.status(400).json(response(400, 'Email sudah terdaftar'));
      }

      user = await Users.create({ full_name, email, password: encrypt(password) });

      const token = await getRegisterToken({ uid: user.id, for: 'register' });
      if (!token) {
        return res.status(500).json(response(500, 'Internal Server Error!'));
      }

      const tokenUrl = `${config.domain}/auth/confirm-email?token=${token}&email=${user.email}`;

      await sendActivationEmail({
        email: user.email,
        name: user.full_name,
        tokenUrl,
      });

      return res.status(200).json(response(200, 'Registrasi berhasil'));
    } catch (error) {
      return res.status(500).json(response(500, 'Internal Server Error!', error));
    }
  }
);
router.post('/login', [], async (req, res) => {});

router.get(
  '/confirm-email',
  [
    query('token', 'token should be present').exists(),
    query('email', 'email should be present').exists(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json(response(422, errors.array()));
    }
    const { token, email } = req.query;
    try {
      let user = await Users.findOne({ email });
      if (!user) {
        return res.status(400).json(response(400, 'User tidak ditemukan'));
      }

      const verifyToken = await checkRegisterToken(token.replace(/ /g, '+'));
      if (!verifyToken) {
        return res.status(400).json(response(400, 'Token tidak sesuai!'));
      }

      user = await Users.updateOne({ is_active: true, updated_date: DateNow });

      return res.status(200).json(response(200, 'Konfirmasi email berhasil'));
    } catch (error) {
      return res.status(500).json(response(500, 'Internal Server Error!', error));
    }
  }
);

module.exports = router;
