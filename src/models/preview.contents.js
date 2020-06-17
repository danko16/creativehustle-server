module.exports = function (sequelize, DataTypes) {
  const previewContents = sequelize.define(
    'preview_contents',
    {
      id: {
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
        type: DataTypes.INTEGER,
      },
      preview_sections_id: {
        allowNull: false,
        foreignKey: true,
        type: DataTypes.INTEGER,
        references: {
          model: 'preview_sections',
          key: 'id',
        },
      },
      title: {
        allowNull: false,
        type: DataTypes.STRING,
      },
      url: {
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
    { timestamps: true, underscored: true }
  );

  previewContents.assoctiate = function (models) {
    previewContents.belongsTo(models.preview_sections, {
      foreignKey: 'preview_sections_id',
    });
  };
  return previewContents;
};
