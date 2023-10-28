'use strict';

module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('courses', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      code: {
        type: Sequelize.STRING,
        allowNull: false
      },
      credits: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      owner: {
        allowNull: false,
        type: Sequelize.INTEGER,
        references: {
          model: 'Users', // Note the lowercase 'users'
          key: 'id'
        },
        onDelete: 'CASCADE' // Optional: If a user is deleted, related courses will also be deleted.
      }
      
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('courses');
  }
};
