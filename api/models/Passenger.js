/**
 * Passenger.js
 *
 * @description ::Represents a Passenger
 */

module.exports = {
  attributes: {
    name: {
      type: Sequelize.STRING,
    },
    is_disabled: {
      type: Sequelize.BOOLEAN,
      defaultValue: false
    }
  },
  associations: () => {
    Passenger.hasMany(Ticket, {
      foreignKey: {
        name: 'passenger_key',
      }
    });
  },

};
