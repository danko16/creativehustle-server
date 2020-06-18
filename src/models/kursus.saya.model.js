module.exports = function (sequelize, DataTypes) {
  const KursusSaya = sequelize.define(
    'kursus_saya',
    {
      id: {
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
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
      freezeTableName: true,
      tableName: 'kursus_saya',
    }
  );

  KursusSaya.associate = function (models) {
    KursusSaya.belongsTo(models.students, {
      foreignKey: 'student_id',
    });

    KursusSaya.belongsTo(models.kursus, {
      foreignKey: 'kursus_id',
    });

    KursusSaya.hasMany(models.content_saya, {
      foreignKey: 'kursus_saya_id',
      onDelete: 'CASCADE',
    });
  };

  return KursusSaya;
};
