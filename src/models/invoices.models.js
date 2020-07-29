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
      courses_id: {
        allowNull: true,
        type: DataTypes.TEXT,
      },
      classes_id: {
        allowNull: true,
        type: DataTypes.TEXT,
      },
      date: {
        allowNull: false,
        type: DataTypes.DATE,
      },
      expired: {
        allowNull: false,
        type: DataTypes.DATE,
      },
      pay_amount: {
        allowNull: true,
        type: DataTypes.INTEGER,
      },
      total_amount: {
        allowNull: false,
        type: DataTypes.INTEGER,
      },
      account_destination: {
        allowNull: true,
        type: DataTypes.STRING,
      },
      bank_destination: {
        allowNull: true,
        type: DataTypes.STRING,
      },
      sender_account: {
        allowNull: true,
        type: DataTypes.STRING,
      },
      sender_account_name: {
        allowNull: true,
        type: DataTypes.STRING,
      },
      pay_date: {
        allowNull: true,
        type: DataTypes.DATE,
      },
      additional_message: {
        allowNull: true,
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

    Invoices.hasMany(models.digital_assets, {
      foreignKey: 'invoice_id',
      as: 'invoice_assets',
    });
  };

  return Invoices;
};
