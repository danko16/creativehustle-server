module.exports = function (sequelize, DataTypes) {
  const Contents = sequelize.define(
    'contents',
    {
      id: {
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
        type: DataTypes.INTEGER,
      },
      section_id: {
        allowNull: false,
        foreignKey: true,
        type: DataTypes.INTEGER,
        references: {
          model: 'sections',
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

  Contents.assoctiate = function (models) {
    Contents.belongsTo(models.sections, {
      foreignKey: 'section_id',
    });

    Contents.hasMany(models.my_contents, {
      foreignKey: 'content_id',
      onDelete: 'CASCADE',
    });
  };
  return Contents;
};
