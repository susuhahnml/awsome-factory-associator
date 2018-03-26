/**
 * Table.js
 *
 * @description :: Model representing the type of a table
 */

module.exports = {
  attributes: {
    name: {
      type: Sequelize.STRING,
      allowNull: false,
      unique: true,
    },
  },
};
