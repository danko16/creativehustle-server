module.exports = function (sequelize, DataTypes) {
  const Sections = sequelize.define(
    'sections',
    {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER,
      },
      kursus_id: {
        allowNull: false,
        type: DataTypes.INTEGER,
        foreignKey: true,
        references: {
          model: 'kursus',
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

  Sections.associate = function (models) {
    Sections.belongsTo(models.kursus, {
      foreignKey: 'kursus_id',
    });

    Sections.hasMany(models.contents, {
      foreignKey: 'section_id',
      onDelete: 'CASCADE',
    });
  };

  return Sections;
};
