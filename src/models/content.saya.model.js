module.exports = function (sequelize, DataTypes) {
  const ContentSaya = sequelize.define(
    'content_saya',
    {
      id: {
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
        type: DataTypes.INTEGER,
      },
      kursus_saya_id: {
        allowNull: false,
        foreignKey: true,
        type: DataTypes.INTEGER,
        references: {
          model: 'kursus_saya',
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
      freezeTableName: true,
      tableName: 'content_saya',
    }
  );

  ContentSaya.associate = function (models) {
    ContentSaya.belongsTo(models.kursus_saya, {
      foreignKey: 'kursus_saya_id',
    });

    ContentSaya.belongsTo(models.contents, {
      foreignKey: 'content_id',
    });
  };

  return ContentSaya;
};
