module.exports = function (sequelize, DataTypes) {
  const Webinars = sequelize.define(
    'webinars',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true,
      },
      teacher_id: {
        type: DataTypes.INTEGER,
        foreignKey: true,
        allowNull: false,
        references: {
          model: 'teachers',
          key: 'id',
        },
      },
      title: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      desc: {
        allowNull: false,
        type: DataTypes.TEXT,
      },
      sections: {
        allowNull: false,
        type: DataTypes.TEXT,
      },
      price: {
        allowNull: false,
        type: DataTypes.INTEGER,
      },
      promo_price: {
        allowNull: true,
        type: DataTypes.INTEGER,
      },
      topics: {
        allowNull: false,
        type: DataTypes.STRING,
      },
      type: {
        allowNull: false,
        type: DataTypes.STRING,
      },
      tel_group: {
        allowNull: true,
        type: DataTypes.STRING,
      },
      approved: {
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
    { timestamps: true, underscored: true }
  );

  Webinars.associate = function (models) {
    Webinars.belongsTo(models.teachers, {
      foreignKey: 'teacher_id',
    });

    Webinars.hasOne(models.digital_assets, {
      foreignKey: 'webinar_id',
      as: 'webinar_assets',
      onDelete: 'CASCADE',
    });

    Webinars.hasMany(models.my_webinars, {
      foreignKey: 'webinar_id',
      onDelete: 'CASCADE',
    });

    Webinars.hasMany(models.extra_matters, {
      foreignKey: 'webinar_id',
      onDelete: 'CASCADE',
    });

    Webinars.hasMany(models.webinar_schedules, {
      foreignKey: 'webinar_id',
      onDelete: 'CASCADE',
    });

    Webinars.hasMany(models.carts, {
      foreignKey: 'webinar_id',
      onDelete: 'CASCADE',
    });
  };

  return Webinars;
};
