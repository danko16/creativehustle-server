module.exports = function (sequelize, DataTypes) {
  const Categories = sequelize.define(
    'categories',
    {
      id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      createdAt: {
        allowNull: false,
        type: DataTypes.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: DataTypes.DATE,
      },
    },
    { timestamps: true, underscored: true }
  );

  Categories.associate = function (models) {
    Categories.hasMany(models.sub_categories, {
      foreign_key: 'category_id',
      onDelete: 'CASCADE',
    });

    Categories.hasMany(models.digital_assets, {
      foreign_key: 'category_id',
      as: 'category_assets',
      onDelete: 'CASCADE',
    });
  };

  return Categories;
};
