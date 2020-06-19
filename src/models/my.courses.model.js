module.exports = function (sequelize, DataTypes) {
  const MyCourses = sequelize.define(
    'my_courses',
    {
      id: {
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
        type: DataTypes.INTEGER,
      },
      course_id: {
        allowNull: false,
        foreignKey: true,
        type: DataTypes.INTEGER,
        references: {
          model: 'courses',
          key: 'id',
        },
      },
      student_id: {
        allowNull: false,
        foreignKey: true,
        type: DataTypes.INTEGER,
        references: {
          model: 'students',
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

  MyCourses.associate = function (models) {
    MyCourses.belongsTo(models.students, {
      foreignKey: 'student_id',
    });

    MyCourses.belongsTo(models.courses, {
      foreignKey: 'course_id',
    });

    MyCourses.hasMany(models.my_contents, {
      foreignKey: 'my_course_id',
      onDelete: 'CASCADE',
    });
  };

  return MyCourses;
};
