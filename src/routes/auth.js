const express = require('express');
const sequelize = require('sequelize');
const multer = require('multer');
const fs = require('fs');
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
const { students: Student, teachers: Teacher, digital_assets: Asset } = require('../models');
const Op = sequelize.Op;

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

      const tokenUrl = `${config.serverDomain}/auth/confirm-email?token=${registerToken}&email=${user.email}&type=${type}`;

      await sendActivationEmail({
        email: user.email,
        name: user.full_name,
        tokenUrl,
      });

      const token = await getToken({ uid: user.id, type });
      let getExpToken = await getPayload(token.pure);

      const payload = Object.freeze({
        token: { key: token.key, exp: getExpToken.exp },
        user: {
          id: user.id,
          name: user.full_name,
          email: user.email,
          phone: user.phone,
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
              as: 'student_assets',
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
              as: 'teacher_assets',
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
      let avatar;
      if (type === 'student') {
        avatar = user.student_assets.length ? user.student_assets[0].dataValues.url : null;
      } else if (type === 'teacher') {
        avatar = user.teacher_assets.length ? user.teacher_assets[0].dataValues.url : null;
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

      const payload = Object.freeze({
        token: { key: token.key, exp: getExpToken.exp },
        user: {
          id: user.id,
          name: user.full_name,
          email: user.email,
          phone: user.phone,
          avatar,
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

router.patch(
  '/password',
  isAllow,
  [
    body('new_password', 'new password should be present').exists(),
    body('old_password', 'old password should be present').exists(),
  ],
  async function (req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json(response(422, errors.array()));
    }

    const { user } = res.locals;
    const { old_password, new_password } = req.body;
    try {
      if (user.type === 'student') {
        const student = await Student.findOne({ where: { id: user.id } });
        const compare = encrypt(old_password) === student.password;
        if (!compare && student.provider !== 'google') {
          return res.status(400).json(response(400, 'Password Lama Salah'));
        }
        await student.update({
          password: encrypt(new_password),
          provider: 'local',
        });
      } else if (user.type === 'teacher') {
        const teacher = await Teacher.findOne({ where: { id: user.id } });
        const compare = encrypt(old_password) === teacher.password;
        if (!compare) {
          return res.status(400).json(response(400, 'Password Lama Salah'));
        }
        await teacher.update({
          password: encrypt(new_password),
        });
      }

      return res.status(200).json(response(200, 'Berhasil Mengganti Password'));
    } catch (error) {
      return res.status(500).json(response(500, 'Internal Server Error!', error));
    }
  }
);

router.patch(
  '/profile',
  isAllow,
  [
    query('name', 'name should be present').exists(),
    query('phone', 'phone number should be present').exists(),
  ],
  async function (req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json(response(422, errors.array()));
    }

    const { user } = res.locals;

    const { name, phone } = req.query;

    let isPhoneExist = false;
    if (user.type === 'student') {
      const isPhone = await Student.findOne({
        where: {
          phone,
          id: {
            [Op.not]: user.id,
          },
        },
      });
      if (isPhone) {
        isPhoneExist = true;
      }
    } else if (user.type === 'teacher') {
      const isPhone = await Teacher.findOne({
        where: {
          phone,
          id: {
            [Op.not]: user.id,
          },
        },
      });
      if (isPhone) {
        isPhoneExist = true;
      }
    }

    if (isPhoneExist) {
      return res.status(400).json(response(400, 'Nomor Telephone sudah terdaftar'));
    }
    upload(req, res, async function (error) {
      if (error instanceof multer.MulterError) {
        return res.status(500).json(response(500, 'Internal Server Error!', error));
      } else if (error) {
        return res.status(500).json(response(500, 'Unkonwn Error!', error));
      }
      try {
        const { file } = req;
        let servePath;
        let filePath;
        let urlPath;

        if (file) {
          servePath = `uploads/${file.filename}`;
          filePath = `${file.destination}/${file.filename}`;
          urlPath = `${config.serverDomain}/${servePath}`;
        }

        let payload;
        if (user.type === 'student') {
          if (file) {
            const asset = await Asset.findOne({
              where: { student_id: user.id, type: 'avatar' },
              as: 'student_assets',
            });

            if (asset) {
              if (asset.path) {
                fs.unlinkSync(asset.path);
              }
              await asset.update({
                url: urlPath,
                path: filePath,
                filename: file.filename,
              });
            } else {
              await Asset.create({
                url: urlPath,
                path: filePath,
                filename: file.filename,
                type: 'avatar',
                student_id: user.id,
              });
            }
          }

          await Student.update(
            {
              full_name: name,
              phone: phone.trim(),
            },
            { where: { id: user.id } }
          );

          payload = await Student.findOne({
            where: {
              id: user.id,
            },
            include: {
              model: Asset,
              as: 'student_assets',
              where: {
                type: 'avatar',
              },
              required: false,
            },
          });

          payload = Object.freeze({
            id: payload.id,
            name: payload.full_name,
            avatar: payload.student_assets[0].dataValues.url,
            email: payload.email,
            phone: payload.phone,
          });
        } else if (user.type === 'teacher') {
          if (file) {
            const asset = await Asset.findOne({
              where: { teacher_id: user.id, type: 'avatar' },
              as: 'techer_assets',
            });

            if (asset) {
              if (asset.path) {
                fs.unlinkSync(asset.path);
              }
              await asset.update({
                url: urlPath,
                path: filePath,
                filename: file.filename,
              });
            } else {
              await Asset.create({
                url: urlPath,
                path: filePath,
                filename: file.filename,
                type: 'avatar',
                teacher_id: user.id,
              });
            }
          }

          await Teacher.update(
            {
              full_name: name,
              phone: phone.trim(),
            },
            { where: { id: user.id } }
          );

          payload = await Teacher.findOne({
            where: {
              id: user.id,
            },
            include: {
              model: Asset,
              as: 'teacher_assets',
              where: {
                type: 'avatar',
              },
              required: false,
            },
          });

          payload = Object.freeze({
            id: payload.id,
            name: payload.full_name,
            avatar: payload.teacher_assets[0].dataValues.url,
            email: payload.email,
            phone: payload.phone,
          });
        }

        return res.status(200).json(response(200, 'Berhasil Update Profile', payload));
      } catch (error) {
        return res.status(500).json(response(500, 'Internal Server Error!', error));
      }
    });
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
  passport.authenticate('google', { failureRedirect: `${config.clientDomain}/` }),
  async function (req, res) {
    const { user } = req;
    const token = await getToken({ uid: user.id, rememberMe: true, type: 'student' });
    let getExpToken = await getPayload(token.pure);
    res.redirect(
      url.format({
        pathname: `${config.clientDomain}/google-auth`,
        query: {
          key: token.key,
          exp: getExpToken.exp,
          id: user.id,
          name: user.full_name,
          avatar: user.student_assets.length ? user.student_assets[0].dataValues.url : null,
          phone: user.phone,
          email: user.email,
          type: 'student',
        },
      })
    );
  }
);

module.exports = router;
