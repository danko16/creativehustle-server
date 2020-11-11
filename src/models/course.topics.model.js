module.exports = function (sequelize, DataTypes) {
  const CourseTopics = sequelize.define(
    'course_topics',
    {
      id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },
      topic_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        foreignKey: true,
        references: {
          model: 'topics',
          key: 'id',
        },
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
      module_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        foreignKey: true,
        references: {
          model: 'modules',
          key: 'id',
        },
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

  CourseTopics.associate = function (models) {
    CourseTopics.belongsTo(models.topics, {
      foreignKey: 'topic_id',
    });

    CourseTopics.belongsTo(models.courses, {
      foreignKey: 'course_id',
    });

    CourseTopics.belongsTo(models.modules, {
      foreignKey: 'module_id',
    });
  };

  return CourseTopics;
};
