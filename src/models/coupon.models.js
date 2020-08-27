module.exports = function (sequelize, DataTypes) {
  const Coupons = sequelize.define(
    'coupons',
    {
      id: {
        primaryKey: true,
        allowNull: false,
        autoIncrement: true,
        type: DataTypes.INTEGER,
      },
      teacher_id: {
        foreignKey: true,
        allowNull: false,
        type: DataTypes.INTEGER,
        references: {
          model: 'teachers',
          key: 'id',
        },
      },
      course_id: {
        foreignKey: true,
        allowNull: true,
        type: DataTypes.INTEGER,
        references: {
          model: 'courses',
          key: 'id',
        },
      },
      webinar_id: {
        foreignKey: true,
        allowNull: true,
        type: DataTypes.INTEGER,
        references: {
          model: 'webinars',
          key: 'id',
        },
      },
      discounts: {
        type: DataTypes.INTEGER,
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

  Coupons.associate = function (models) {
    Coupons.belongsTo(models.courses, {
      foreignKey: 'course_id',
    });

    Coupons.belongsTo(models.webinars, {
      foreignKey: 'webinar_id',
    });

    Coupons.belongsTo(models.teachers, {
      foreignKey: 'teacher_id',
    });
  };

  return Coupons;
};
