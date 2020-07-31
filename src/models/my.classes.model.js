module.exports = function (sequelize, DataTypes) {
  const MyClasses = sequelize.define(
    'my_classes',
    {
      id: {
        primaryKey: true,
        allowNull: false,
        type: DataTypes.INTEGER,
        autoIncrement: true,
      },
      class_id: {
        allowNull: false,
        foreignKey: true,
        type: DataTypes.INTEGER,
        references: {
          model: 'classes',
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

  MyClasses.associate = function (models) {
    MyClasses.belongsTo(models.students, {
      foreignKey: 'student_id',
    });

    MyClasses.belongsTo(models.classes, {
      foreignKey: 'class_id',
    });
  };

  return MyClasses;
};
