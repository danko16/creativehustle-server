module.exports = function (sequelize, DataTypes) {
  const WebinarSchedules = sequelize.define(
    'webinar_schedules',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true,
      },
      webinar_id: {
        type: DataTypes.INTEGER,
        foreignKey: true,
        allowNull: false,
        references: {
          model: 'webinars',
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

  WebinarSchedules.associate = function (models) {
    WebinarSchedules.belongsTo(models.webinars, {
      foreignKey: 'webinar_id',
    });
  };
  return WebinarSchedules;
};
