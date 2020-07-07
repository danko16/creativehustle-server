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
      student_id: {
        allowNull: true,
        foreignKey: true,
        type: DataTypes.INTEGER,
        references: {
          model: 'students',
          key: 'id',
        },
      },
      teacher_id: {
        allowNull: true,
        foreignKey: true,
        type: DataTypes.INTEGER,
        references: {
          model: 'teachers',
          key: 'id',
        },
      },
      course_id: {
        allowNull: true,
        foreignKey: true,
        type: DataTypes.INTEGER,
        references: {
          model: 'courses',
          key: 'id',
        },
      },
      class_id: {
        allowNull: true,
        foreignKey: true,
        type: DataTypes.INTEGER,
        references: {
          model: 'classes',
          key: 'id',
        },
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
      foreignKey: 'student_id',
    });

    DigitalAssets.belongsTo(models.teachers, {
      foreignKey: 'teacher_id',
    });

    DigitalAssets.belongsTo(models.courses, {
      foreignKey: 'course_id',
    });

    DigitalAssets.belongsTo(models.classes, {
      foreignKey: 'class_id',
    });
  };

  return DigitalAssets;
};
