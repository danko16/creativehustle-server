module.exports = function (sequelize, DataTypes) {
  const MyWebinars = sequelize.define(
    'my_webinars',
    {
      id: {
        primaryKey: true,
        allowNull: false,
        type: DataTypes.INTEGER,
        autoIncrement: true,
      },
      webinar_id: {
        allowNull: false,
        foreignKey: true,
        type: DataTypes.INTEGER,
        references: {
          model: 'webinars',
          key: 'id',
        },
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

  MyWebinars.associate = function (models) {
    MyWebinars.belongsTo(models.students, {
      foreignKey: 'student_id',
    });

    MyWebinars.belongsTo(models.webinars, {
      foreignKey: 'webinar_id',
    });
  };

  return MyWebinars;
};
