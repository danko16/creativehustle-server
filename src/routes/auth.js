require('module-alias/register');
const express = require('express');
const { body, validationResult } = require('express-validator');
const response = require('@utils/response');
const Users = require('@schema/users');
const router = express.Router();

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
      return res.status(422).json(response(false, errors.array()));
    }

    const { full_name, email, password } = req.body;
    try {
      let user = await Users.findOne({ email });
      console.log(user);
      if (user) {
        return res.status(400).json(response(false, 'Email sudah terdaftar'));
      }

      user = await Users.create({ full_name, email, password });
      return res.status(200).json(response(true, 'Registrasi berhasil'));
    } catch (error) {
      return res.status(400).json(response(false, error));
    }
  }
);
router.post('/login', [], async (req, res) => {});

module.exports = router;
