module.exports = function (sequelize, DataTypes) {
  const Carts = sequelize.define(
    'carts',
    {
      id: {
        primaryKey: true,
        allowNull: false,
        autoIncrement: true,
        type: DataTypes.INTEGER,
      },
      student_id: {
        foreignKey: true,
        allowNull: false,
        type: DataTypes.INTEGER,
        references: {
          model: 'students',
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
      class_id: {
        foreignKey: true,
        allowNull: true,
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

  Carts.associate = function (models) {
    Carts.belongsTo(models.courses, {
      foreignKey: 'course_id',
    });

    Carts.belongsTo(models.classes, {
      foreignKey: 'class_id',
    });

    Carts.belongsTo(models.students, {
      foreignKey: 'student_id',
    });
  };

  return Carts;
};
