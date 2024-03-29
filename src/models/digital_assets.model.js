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
        allowNull: true,
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
      webinar_id: {
        allowNull: true,
        foreignKey: true,
        type: DataTypes.INTEGER,
        references: {
          model: 'webinars',
          key: 'id',
        },
      },
      extra_matter_id: {
        allowNull: true,
        foreignKey: true,
        type: DataTypes.INTEGER,
        references: {
          model: 'extra_matters',
          key: 'id',
        },
      },
      invoice_id: {
        allowNull: true,
        foreignKey: true,
        type: DataTypes.INTEGER,
        references: {
          model: 'invoices',
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

    DigitalAssets.belongsTo(models.webinars, {
      foreignKey: 'webinar_id',
    });

    DigitalAssets.belongsTo(models.extra_matters, {
      foreignKey: 'extra_matter_id',
    });

    DigitalAssets.belongsTo(models.invoices, {
      foreignKey: 'extra_matter_id',
    });
  };

  return DigitalAssets;
};
