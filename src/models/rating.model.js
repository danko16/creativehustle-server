module.exports = function (sequelize, DataTypes) {
  const Ratings = sequelize.define(
    'ratings',
    {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER,
      },
      kursus_id: {
        allowNull: false,
        foreignKey: true,
        type: DataTypes.INTEGER,
        references: {
          model: 'kursus',
          key: 'id',
        },
      },
      student_id: {
        allowNull: false,
        foreignKey: true,
        type: DataTypes.INTEGER,
        references: {
          model: 'students',
          key: 'id',
        },
      },
      message: {
        allowNull: false,
        type: DataTypes.STRING,
      },
      rating: {
        allowNull: false,
        type: DataTypes.FLOAT,
        max: 5.0,
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

  Ratings.associate = function (models) {
    Ratings.belongsTo(models.kursus, {
      foreignKey: 'kursus_id',
    });

    Ratings.belongsTo(models.students, {
      foreignKey: 'student_id',
    });
  };

  return Ratings;
};
