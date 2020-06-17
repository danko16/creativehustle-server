module.exports = function (sequelize, DataTypes) {
  const Kursus = sequelize.define(
    'kursus',
    {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER,
      },
      teacher_id: {
        allowNull: false,
        type: DataTypes.INTEGER,
        foreignKey: true,
        references: {
          model: 'teachers',
          key: 'id',
        },
      },
      title: {
        allowNull: false,
        type: DataTypes.STRING,
      },
      price: {
        allowNull: false,
        type: DataTypes.INTEGER,
      },
      promo_price: {
        allowNull: true,
        type: DataTypes.INTEGER,
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
  Kursus.associate = function (models) {
    Kursus.belongsTo(models.teachers, {
      foreignKey: 'teacher_id',
    });

    Kursus.belongsToMany(models.students, {
      through: 'kursus_saya',
      foreignKey: 'kursus_id',
    });

    Kursus.hasOne(models.assets, {
      foreignKey: 'uploadable_id',
      scope: {
        uploadable_type: 'kursus',
      },
      onDelete: 'CASCADE',
    });

    Kursus.hasMany(models.ratings, {
      foreignKey: 'kursus_id',
      onDelete: 'CASCADE',
    });

    Kursus.hasMany(models.sections, {
      foreignKey: 'kursus_id',
      onDelete: 'CASCADE',
    });

    Kursus.hasMany(models.preview_sections, {
      foreignKey: 'kursus_id',
      onDelete: 'CASCADE',
    });
  };

  return Kursus;
};
