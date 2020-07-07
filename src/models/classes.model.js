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
      schedules: {
        allowNull: true,
        type: DataTypes.TEXT,
      },
      tel_group: {
        allowNull: true,
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

  Classes.associate = function (models) {
    Classes.belongsTo(models.teachers, {
      foreignKey: 'teacher_id',
    });

    Classes.hasMany(models.digital_assets, {
      foreignKey: 'class_id',
      as: 'class_assets',
    });

    Classes.hasMany(models.my_classes, {
      foreignKey: 'class_id',
      onDelete: 'CASCADE',
    });
  };

  return Classes;
};
