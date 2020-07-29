'use strict';
const {
  token: { encrypt },
} = require('../../utils');

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.bulkInsert('admins', [
      {
        name: 'owner',
        email: 'owner@creativehustle.id',
        password: encrypt('1_?U4MC|EKs1?rNdE'),
        role: 'owner',
        approved: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        name: 'supervisor',
        email: 'supervisor@creativehustle.id',
        password: encrypt('_%1uW$#ZaU#7WKY3M'),
        role: 'supervisor',
        approved: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        name: 'manager',
        email: 'manager@creativehustle.id',
        password: encrypt('tL1RpZH0zv-r@7x^6'),
        role: 'manager',
        approved: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete('admins', null, {});
  },
};
