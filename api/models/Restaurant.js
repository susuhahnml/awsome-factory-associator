/**
 * Restaurant.js
 *
 * @description :: Model aimed at representing a restaurant. I guess.
 */

module.exports = {

  attributes: {
    name: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    active: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  },
};
