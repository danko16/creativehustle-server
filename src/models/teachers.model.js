module.exports = function (sequelize, DataTypes) {
  const Teachers = sequelize.define(
    'teachers',
    {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER,
      },
      full_name: {
        allowNull: false,
        type: DataTypes.STRING,
        validate: {
          max: {
            args: 40,
            msg: 'Username must start with a letter,and be at less than 40 characters.',
          },
        },
      },
      email: {
        allowNull: false,
        type: DataTypes.STRING,
        unique: true,
      },
      phone: {
        allowNull: true,
        type: DataTypes.STRING,
        unique: true,
      },
      password: {
        allowNull: false,
        type: DataTypes.STRING,
      },
      date_of_birth: {
        allowNull: true,
        type: DataTypes.DATE,
      },
      gender: {
        allowNull: true,
        type: DataTypes.STRING,
      },
      is_active: {
        allowNull: false,
        type: DataTypes.BOOLEAN,
      },
      last_login: {
        allowNull: false,
        type: DataTypes.DATE,
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
  Teachers.associate = function (models) {
    Teachers.hasMany(models.digital_assets, {
      as: 'teacher_assets',
    });

    Teachers.hasMany(models.courses, {
      foreignKey: 'teacher_id',
      onDelete: 'CASCADE',
    });
  };

  return Teachers;
};
