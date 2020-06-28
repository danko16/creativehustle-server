module.exports = function (sequelize, DataTypes) {
  const Courses = sequelize.define(
    'courses',
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
      desc: {
        allowNull: false,
        type: DataTypes.TEXT,
      },
      benefit: {
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
  Courses.associate = function (models) {
    Courses.belongsTo(models.teachers, {
      foreignKey: 'teacher_id',
    });

    Courses.hasOne(models.digital_assets, {
      foreignKey: 'course_id',
      as: 'course_assets',
    });

    Courses.hasMany(models.course_recommendations, {
      foreignKey: 'course_id',
      onDelete: 'CASCADE',
    });

    Courses.hasMany(models.my_courses, {
      foreignKey: 'course_id',
      onDelete: 'CASCADE',
    });

    Courses.hasMany(models.ratings, {
      foreignKey: 'course_id',
      onDelete: 'CASCADE',
    });

    Courses.hasMany(models.sections, {
      foreignKey: 'course_id',
      onDelete: 'CASCADE',
    });

    Courses.hasMany(models.contents, {
      foreignKey: 'course_id',
      onDelete: 'CASCADE',
    });
  };

  return Courses;
};
