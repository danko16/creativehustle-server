module.exports = function (sequelize, DataTypes) {
  const DigitalAssets = sequelize.define(
    'digital_assets',
    {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER,
      },
      path: {
        allowNull: true,
        type: DataTypes.STRING,
      },
      filename: {
        allowNull: true,
        type: DataTypes.STRING,
      },
      url: {
        allowNull: false,
        type: DataTypes.STRING,
      },
      type: {
        allowNull: false,
        type: DataTypes.STRING,
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
    {
      timestamps: true,
      underscored: true,
    }
  );

  DigitalAssets.associate = function (models) {
    DigitalAssets.belongsTo(models.students, {
      as: 'student_assets',
    });

    DigitalAssets.belongsTo(models.teachers, {
      as: 'teacher_assets',
    });

    DigitalAssets.belongsTo(models.courses, {
      as: 'course_assets',
    });
  };

  return DigitalAssets;
};
