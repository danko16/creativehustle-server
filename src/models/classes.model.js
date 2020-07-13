module.exports = function (sequelize, DataTypes) {
  const Classes = sequelize.define(
    'classes',
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

  Classes.associate = function (models) {
    Classes.belongsTo(models.teachers, {
      foreignKey: 'teacher_id',
    });

    Classes.hasOne(models.digital_assets, {
      foreignKey: 'class_id',
      as: 'class_assets',
      onDelete: 'CASCADE',
    });

    Classes.hasMany(models.my_classes, {
      foreignKey: 'class_id',
      onDelete: 'CASCADE',
    });

    Classes.hasMany(models.extra_matters, {
      foreignKey: 'class_id',
      onDelete: 'CASCADE',
    });

    Classes.hasMany(models.class_schedules, {
      foreignKey: 'class_id',
      onDelete: 'CASCADE',
    });

    Classes.hasMany(models.invoices, {
      foreignKey: 'class_id',
    });

    Classes.hasMany(models.carts, {
      foreignKey: 'class_id',
      onDelete: 'CASCADE',
    });

    Classes.hasMany(models.coupons, {
      foreignKey: 'class_id',
      onDelete: 'CASCADE',
    });
  };

  return Classes;
};
