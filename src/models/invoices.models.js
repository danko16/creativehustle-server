module.exports = function (sequelize, DataTypes) {
  const Invoices = sequelize.define(
    'invoices',
    {
      id: {
        primaryKey: true,
        allowNull: false,
        type: DataTypes.INTEGER,
        autoIncrement: true,
      },
      student_id: {
        foreignKey: true,
        allowNull: false,
        type: DataTypes.INTEGER,
        references: {
          model: 'students',
          key: 'id',
        },
      },
      course_id: {
        foreignKey: true,
        allowNull: true,
        type: DataTypes.INTEGER,
        references: {
          model: 'courses',
          key: 'id',
        },
      },
      class_id: {
        foreignKey: true,
        allowNull: true,
        type: DataTypes.INTEGER,
        references: {
          model: 'classes',
          key: 'id',
        },
      },
      date: {
        allowNull: false,
        type: DataTypes.DATE,
      },
      pay_amount: {
        allowNull: false,
        type: DataTypes.INTEGER,
      },
      account_destination: {
        allowNull: false,
        type: DataTypes.STRING,
      },
      bank_destination: {
        allowNull: false,
        type: DataTypes.STRING,
      },
      sender_account_name: {
        allowNull: false,
        type: DataTypes.STRING,
      },
      additional_message: {
        allowNull: false,
        type: DataTypes.TEXT,
      },
      status: {
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
    { timestamps: true, underscored: true }
  );

  Invoices.associate = function (models) {
    Invoices.belongsTo(models.students, {
      foreignKey: 'student_id',
    });

    Invoices.belongsTo(models.courses, {
      foreignKey: 'course_id',
    });

    Invoices.belongsTo(models.classes, {
      foreignKey: 'class_id',
    });

    Invoices.hasOne(models.digital_assets, {
      foreignKey: 'invoice_id',
      as: 'invoice_assets',
    });
  };

  return Invoices;
};
