module.exports = function (sequelize, DataTypes) {
  const MyContents = sequelize.define(
    'my_contents',
    {
      id: {
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
        type: DataTypes.INTEGER,
      },
      my_course_id: {
        allowNull: false,
        foreignKey: true,
        type: DataTypes.INTEGER,
        references: {
          model: 'my_courses',
          key: 'id',
        },
      },
      content_id: {
        allowNull: false,
        foreignKey: true,
        type: DataTypes.INTEGER,
        references: {
          model: 'contents',
          key: 'id',
        },
      },
      done: {
        allowNull: false,
        type: DataTypes.BOOLEAN,
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

  MyContents.associate = function (models) {
    MyContents.belongsTo(models.my_courses, {
      foreignKey: 'my_course_id',
    });

    MyContents.belongsTo(models.contents, {
      foreignKey: 'content_id',
    });
  };

  return MyContents;
};
