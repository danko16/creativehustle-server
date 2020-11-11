module.exports = function (sequelize, DataTypes) {
  const Modules = sequelize.define(
    'modules',
    {
      id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      teacher_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        foreignKey: true,
        references: {
          model: 'teachers',
          key: 'id',
        },
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
      },
    },
    { timestamps: true, underscored: true }
  );

  Modules.associate = function (models) {
    Modules.hasMany(models.courses, {
      foreignKey: 'module_id',
    });

    Modules.belongsTo(models.teachers, {
      foreignKey: 'teacher_id',
    });

    Modules.hasMany(models.course_topics, {
      foreignKey: 'module_id',
      onDelete: 'CASCADE',
    });
  };

  return Modules;
};
