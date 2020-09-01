const express = require('express');
const { teachers: Teacher, digital_assets: Asset } = require('../models');
const { response } = require('../utils');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const teacher = await Teacher.findAll({
      attributes: ['id', 'full_name', 'email', 'phone', 'job', 'biography'],
      where: {
        approved: true,
      },
      include: {
        model: Asset,
        as: 'teacher_assets',
        required: false,
        where: {
          type: 'avatar',
        },
        attributes: ['url'],
      },
    });
    return res.status(200).json(response(200, 'Berhasil Mendapatkan Mentor', teacher));
  } catch (error) {
    return res.status(500).json(response(500, 'Internal Server Error!'));
  }
});

module.exports = router;
