module.exports = function (sequelize, DataTypes) {
  const ExtraMatters = sequelize.define(
    'extra_matters',
    {
      id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },
      course_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        foreignKey: true,
        references: {
          model: 'courses',
          key: 'id',
        },
      },
      class_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        foreignKey: true,
        references: {
          model: 'classes',
          key: 'id',
        },
      },
      title: {
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

  ExtraMatters.associate = function (models) {
    ExtraMatters.belongsTo(models.courses, {
      foreignKey: 'course_id',
    });

    ExtraMatters.belongsTo(models.classes, {
      foreignKey: 'class_id',
    });

    ExtraMatters.hasOne(models.digital_assets, {
      foreignKey: 'extra_matter_id',
      as: 'extra_matter_assets',
      onDelete: 'CASCADE',
    });
  };
  return ExtraMatters;
};
