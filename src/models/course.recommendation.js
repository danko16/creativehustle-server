module.exports = function (sequelize, DataTypes) {
  const CourseRecommendation = sequelize.define(
    'course_recommendations',
    {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER,
      },
      course_id: {
        allowNull: false,
        type: DataTypes.INTEGER,
        foreignKey: true,
        references: {
          model: 'courses',
          key: 'id',
        },
      },
      student_id: {
        allowNull: false,
        type: DataTypes.INTEGER,
        foreignKey: true,
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
    { timestamps: true, underscored: true }
  );

  CourseRecommendation.associate = function (models) {
    CourseRecommendation.belongsTo(models.courses, {
      foreignKey: 'course_id',
    });

    CourseRecommendation.belongsTo(models.students, {
      foreignKey: 'student_id',
    });
  };

  return CourseRecommendation;
};
