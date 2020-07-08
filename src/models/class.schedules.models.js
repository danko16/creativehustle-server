module.exports = function (sequelize, DataTypes) {
  const ClassSchedules = sequelize.define(
    'class_schedules',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true,
      },
      class_id: {
        type: DataTypes.INTEGER,
        foreignKey: true,
        allowNull: false,
        references: {
          model: 'classes',
          key: 'id',
        },
      },
      date: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      started_time: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      ended_time: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      link: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      password: {
        type: DataTypes.STRING,
        allowNull: true,
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

  ClassSchedules.associate = function (models) {
    ClassSchedules.belongsTo(models.classes, {
      foreignKey: 'class_id',
    });
  };
  return ClassSchedules;
};
