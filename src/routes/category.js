const express = require('express');
const { query, body, validationResult } = require('express-validator');
const {
  categories: Category,
  sub_categories: SubCategory,
  topics: Topic,
  digital_assets: Asset,
  sequelize,
} = require('../models');
const {
  auth: { isAllow },
  response,
} = require('../utils');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const categories = await Category.findAll({
      include: [
        {
          model: SubCategory,
          attributes: { exclude: ['createdAt', 'updatedAt'] },
        },
        {
          model: Asset,
          as: 'category_assets',
          attributes: ['filename'],
        },
      ],
      attributes: { exclude: ['createdAt', 'updatedAt'] },
    });

    const categoriesPayload = [],
      subCategoriesPayload = [];

    categories.forEach((category) => {
      const { id, name, sub_categories, category_assets } = category;
      categoriesPayload.push({ id, name, icon: category_assets[0].filename });
      subCategoriesPayload.push(...sub_categories);
    });
    return res.status(200).json(
      response(200, 'Berhasil Mendapatkan Kategori', {
        categories: categoriesPayload,
        sub_categories: subCategoriesPayload,
      })
    );
  } catch (error) {
    return res.status(500).json(response(500, 'Internal Server Error!'));
  }
});

router.post(
  '/',
  isAllow,
  [
    body('categories', 'categories must be present')
      .exists()
      .isArray()
      .withMessage('categories must ba an array'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json(response(422, errors.array()));
    }

    const { user } = res.locals;
    const { categories } = req.body;

    if (user.type !== 'admin') {
      return res.status(400).json(response(400, 'Anda tidak terdaftar sebagai admin!'));
    }

    const transaction = await sequelize.transaction();
    try {
      for (let i = 0; i < categories.length; i++) {
        let category = await Category.findOne({ where: { name: categories[i].name } });
        if (!category) {
          category = await Category.create({ name: categories[i].name }, { transaction });
          await Asset.create(
            {
              filename: categories[i].icon,
              type: 'icon',
              category_id: category.id,
            },
            { transaction }
          );
        }
      }

      await transaction.commit();
      return res.status(201).json(response(201, 'Berhasil menambahkan kategori'));
    } catch (error) {
      await transaction.rollback();
      return res.status(500).json(response(500, 'Internal Server Error!'));
    }
  }
);

router.post(
  '/:category_id/sub',
  isAllow,
  [
    body('sub_categories', 'sub categories must be present')
      .exists()
      .isArray()
      .withMessage('sub categories must be an array'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json(response(422, errors.array()));
    }

    const { user } = res.locals;
    const { sub_categories } = req.body;
    const { category_id } = req.params;

    if (user.type !== 'admin') {
      return res.status(400).json(response(400, 'Anda tidak terdaftar sebagai admin'));
    }

    try {
      for (let i = 0; i < sub_categories.length; i++) {
        const { name } = sub_categories[i];
        const subCategory = await SubCategory.findOne({ where: { category_id, name } });
        if (!subCategory) {
          await SubCategory.create({
            category_id,
            name,
          });
        }
      }
      return res.status(201).json(response(201, 'Berhasil Menambahkan Sub Kategori'));
    } catch (error) {
      return res.status(500).json(response(500, 'Internal Server Error!'));
    }
  }
);

router.post(
  '/topics',
  isAllow,
  [
    query('category_id', 'category id must present').exists(),
    query('sub_category_id', 'sub category id must present').exists(),
    body('topics', 'topics must be present')
      .exists()
      .isArray()
      .withMessage('topics must be an array'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json(response(422, errors.array()));
    }

    const { user } = res.locals;
    const { topics } = req.body;
    const { category_id, sub_category_id } = req.query;

    if (user.type !== 'admin') {
      return res.status(400).json(response(400, 'Anda tidak terdaftar sebagai admin!'));
    }
    try {
      for (let i = 0; i < topics.length; i++) {
        const { name } = topics[i];
        const topic = await Topic.findOne({ where: { category_id, sub_category_id, name } });
        if (!topic) {
          await Topic.create({
            category_id,
            sub_category_id,
            name,
          });
        }
      }
      return res.status(201).json(response(201, 'Berhasil Menambahkan Topik'));
    } catch (error) {
      return res.status(500).json(response(500, 'Internal Server Error!'));
    }
  }
);

module.exports = router;
