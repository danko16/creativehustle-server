const express = require('express');
const { body, query, validationResult } = require('express-validator');
const passport = require('./passport');
const url = require('url');
const config = require('../../config');
const {
  token: { encrypt, getToken, getRegisterToken, checkRegisterToken, getPayload },
  auth: { isAllow },
  emails: { sendActivationEmail },
  response,
} = require('../utils');
const { students: Student, teachers: Teacher, assets: Asset } = require('../models');

const router = express.Router();

router.post('/is-allow', isAllow, async (req, res) => {
  try {
    return res.status(200).json(response(200, 'Allowed!'));
  } catch (error) {
    return res.status(500).json(response(500, 'Internal Server Error!'));
  }
});

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
    body('type', 'type should be present').exists(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json(response(422, errors.array()));
    }

    const { full_name, email, password, type } = req.body;
    try {
      let user;
      if (type === 'student') {
        let student = await Student.findOne({ where: { email } });

        if (student) {
          return res.status(400).json(response(400, 'Email sudah terdaftar'));
        }

        user = await Student.create(
          Object.freeze({
            full_name,
            email,
            password: encrypt(password),
            is_active: false,
            last_login: Date.now(),
            provider: 'local',
          })
        );
      } else if (type === 'teacher') {
        let teacher = await Teacher.findOne({ where: { email } });

        if (teacher) {
          return res.status(400).json(response(400, 'Email sudah terdaftar'));
        }

        user = await Teacher.create(
          Object.freeze({
            full_name,
            email,
            password: encrypt(password),
            is_active: false,
            last_login: Date.now(),
            provider: 'local',
          })
        );
      }

      const registerToken = await getRegisterToken({ uid: user.id, for: 'register' });
      if (!registerToken) {
        return res.status(500).json(response(500, 'Internal Server Error!'));
      }

      const tokenUrl = `${config.domain}/auth/confirm-email?token=${registerToken}&email=${user.email}&type=${type}`;

      await sendActivationEmail({
        email: user.email,
        name: user.full_name,
        tokenUrl,
      });

      const token = await getToken({ uid: user.id, type: 'student' });
      let getExpToken = await getPayload(token.pure);

      const payload = Object.freeze({
        token: { key: token.key, exp: getExpToken.exp },
        user: {
          id: user.id,
          name: user.full_name,
          email: user.email,
          avatar: null,
        },
        type,
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
        user = await Student.findOne({
          where: { email },
          include: [
            {
              model: Asset,
              where: {
                type: 'avatar',
              },
              required: false,
            },
          ],
        });
      } else if (type === 'teacher') {
        user = await Teacher.findOne({
          where: { email },
          include: [
            {
              model: Asset,
              where: {
                type: 'avatar',
              },
              required: false,
            },
          ],
        });
      }

      if (!user) {
        return res.status(400).json(response(400, 'User not found!'));
      }

      if (user.provider === 'google') {
        return res.status(400).json(response(400, 'Login dengan Google'));
      }

      const compare = encrypt(password) === user.password;
      if (!compare) {
        return res.status(400).json(response(400, 'Password salah!'));
      }

      await user.update({ last_login: Date.now() });
      const token = await getToken({ uid: user.id, rememberMe: remember_me, type });
      let getExpToken = await getPayload(token.pure);
      console.log(user);
      const payload = Object.freeze({
        token: { key: token.key, exp: getExpToken.exp },
        user: {
          id: user.id,
          name: user.full_name,
          email: user.email,
          avatar: user.assets.length ? user.assets[0].dataValues.url : null,
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
    const { token, email, type } = req.query;
    try {
      let user;
      if (type === 'student') {
        user = await Student.findOne({ where: { email } });
      } else if (type === 'teacher') {
        user = await Teacher.findOne({ where: { email } });
      }

      if (!user) {
        return res.status(400).json(response(400, 'User not found!'));
      }

      const verifyToken = await checkRegisterToken(token.replace(/ /g, '+'));
      if (!verifyToken) {
        return res.status(400).json(response(400, 'Token tidak sesuai!'));
      }

      await user.update({ is_active: true, updated_date: Date.now() });

      return res.status(200).json(response(200, 'Konfirmasi email berhasil'));
    } catch (error) {
      return res.status(500).json(response(500, 'Internal Server Error!', error));
    }
  }
);

router.get(
  '/google',
  passport.authenticate('google', {
    scope: [
      'https://www.googleapis.com/auth/plus.login',
      'https://www.googleapis.com/auth/userinfo.email',
    ],
  })
);

router.get(
  '/google/callback',
  passport.authenticate('google', { failureRedirect: 'https://creativehustle.id' }),
  async function (req, res) {
    const { user } = req;
    const token = await getToken({ uid: user.id, rememberMe: true, type: 'student' });
    let getExpToken = await getPayload(token.pure);
    res.redirect(
      url.format({
        pathname: 'https://creativehustle.id/google-auth',
        query: {
          key: token.key,
          exp: getExpToken.exp,
          id: user.id,
          name: user.full_name,
          avatar: user.assets.length ? user.assets[0].dataValues.url : null,
          email: user.email,
          type: 'student',
        },
      })
    );
  }
);

module.exports = router;
