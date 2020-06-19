module.exports = function (sequelize, DataTypes) {
  const previewSections = sequelize.define(
    'preview_sections',
    {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER,
      },
      course_id: {
        allowNull: false,
        type: DataTypes.INTEGER,
        foreignKey: true,
        references: {
          model: 'courses',
          key: 'id',
        },
      },
      title: {
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

  previewSections.associate = function (models) {
    previewSections.belongsTo(models.courses, {
      foreignKey: 'course_id',
    });

    previewSections.hasMany(models.preview_contents, {
      foreignKey: 'preview_sections_id',
      onDelete: 'CASCADE',
    });
  };

  return previewSections;
};
