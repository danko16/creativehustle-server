module.exports = function (sequelize, DataTypes) {
  const SubCategories = sequelize.define(
    'sub_categories',
    {
      id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      category_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        foreignKey: true,
        references: {
          model: 'categories',
          key: 'id',
        },
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
      },
    },
    { timestamps: true, underscored: true }
  );

  SubCategories.associate = function (models) {
    SubCategories.belongsTo(models.categories, {
      foreignKey: 'category_id',
    });

    SubCategories.hasMany(models.topics, {
      foreignKey: 'sub_category_id',
    });
  };

  return SubCategories;
};
