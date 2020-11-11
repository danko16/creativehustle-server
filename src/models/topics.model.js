module.exports = function (sequelize, DataTypes) {
  const Topics = sequelize.define(
    'topics',
    {
      id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },
      category_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        foreignKey: true,
        references: {
          model: 'topics',
          key: 'id',
        },
      },
      sub_category_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        foreignKey: true,
        references: {
          model: 'sub_categories',
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
    {
      timestamps: true,
      underscored: true,
    }
  );

  Topics.associate = function (models) {
    Topics.belongsTo(models.categories, {
      foreignKey: 'category_id',
    });

    Topics.belongsTo(models.sub_categories, {
      foreignKey: 'sub_category_id',
    });

    Topics.hasMany(models.course_topics, {
      foreignKey: 'topic_id',
      onDelete: 'CASCADE',
    });
  };

  return Topics;
};
