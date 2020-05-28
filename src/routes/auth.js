require('module-alias/register');
const express = require('express');
const { body, query, validationResult } = require('express-validator');
const moment = require('moment');
const config = require('@config');
const response = require('@utils/response');
const {
  encrypt,
  getToken,
  getRegisterToken,
  checkRegisterToken,
  getPayload,
} = require('@utils/token');
const { sendActivationEmail } = require('@utils/emails');
const Students = require('@schema/students');
const Tutors = require('@schema/tutors');
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
      let student = await Students.findOne({ email });

      if (student) {
        return res.status(400).json(response(400, 'Email sudah terdaftar'));
      }

      student = await Students.create({ full_name, email, password: encrypt(password) });

      const registerToken = await getRegisterToken({ uid: student._id, for: 'register' });
      if (!registerToken) {
        return res.status(500).json(response(500, 'Internal Server Error!'));
      }

      const tokenUrl = `${config.domain}/auth/confirm-email?token=${registerToken}&email=${student.email}`;

      await sendActivationEmail({
        email: student.email,
        name: student.full_name,
        tokenUrl,
      });

      const token = await getToken({ uid: student._id, type: 'student' });
      let getExpToken = await getPayload(token.pure);

      const payload = Object.freeze({
        token: { key: token.key, exp: getExpToken.exp },
        user: {
          id: student._id,
          name: student.full_name,
          email: student.email,
          phone: student.phone ? student.phone : null,
        },
        type: 'student',
      });

      return res.status(200).json(response(200, 'Registrasi berhasil', payload));
    } catch (error) {
      return res.status(500).json(response(500, 'Internal Server Error!', error));
    }
  }
);
router.post(
  '/login',
  [
    body('email', 'email should be present').exists(),
    body('password', 'passwords should be present').exists(),
    body('type', 'type should be present').exists(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json(response(422, errors.array()));
    }

    const { email, password, type, remember_me } = req.body;
    try {
      let user;
      if (type === 'student') {
        user = await Students.findOne({ email });
      } else if (type === 'tutor') {
        user = await Tutors.findOne({ email });
      }

      if (!user) {
        return res.status(400).json(response(400, 'User not found!'));
      }

      const compare = encrypt(password) === user.password;
      if (!compare) {
        return res.status(400).json(response(400, 'Password salah!'));
      }

      const token = await getToken({ uid: user._id, rememberMe: remember_me, type });
      let getExpToken = await getPayload(token.pure);

      const payload = Object.freeze({
        token: { key: token.key, exp: getExpToken.exp },
        user: {
          id: user._id,
          name: user.full_name,
          email: user.email,
          phone: user.phone ? user.phone : null,
        },
        type,
      });

      return res.status(200).json(response(200, 'Login berhasil', payload));
    } catch (error) {
      return res.status(500).json(response(500, 'Internal Server Error!', error));
    }
  }
);

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
      let student = await Students.findOne({ email });
      if (!student) {
        return res.status(400).json(response(400, 'student tidak ditemukan'));
      }

      const verifyToken = await checkRegisterToken(token.replace(/ /g, '+'));
      if (!verifyToken) {
        return res.status(400).json(response(400, 'Token tidak sesuai!'));
      }

      await Students.updateOne({ _id: student._id }, { is_active: true, updated_date: DateNow });

      return res.status(200).json(response(200, 'Konfirmasi email berhasil'));
    } catch (error) {
      return res.status(500).json(response(500, 'Internal Server Error!', error));
    }
  }
);

module.exports = router;
