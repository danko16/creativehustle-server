module.exports = function (sequelize, DataTypes) {
  const Assets = sequelize.define(
    'assets',
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
        allowNull: false,
        type: DataTypes.STRING,
      },
      type: {
        allowNull: false,
        type: DataTypes.STRING,
      },
      uploadable_id: {
        allowNull: false,
        type: DataTypes.INTEGER,
      },
      uploadable_type: {
        allowNull: false,
        type: DataTypes.STRING,
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

  // eslint-disable-next-line no-unused-vars
  Assets.associate = function (models) {
    Assets.belongsTo(models.students, {
      foreignKey: 'uploadable_id',
      constraints: false,
    });

    Assets.belongsTo(models.teachers, {
      foreignKey: 'uploadable_id',
      constraints: false,
    });

    Assets.belongsTo(models.kursus, {
      foreignKey: 'uploadable_id',
      constraints: false,
    });
  };

  return Assets;
};
