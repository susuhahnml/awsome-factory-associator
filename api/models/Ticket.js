/**
 * Ticket.js
 *
 * @description ::Represents a Ticket
 */

module.exports = {
  attributes: {
    seat: {
      type: Sequelize.STRING,
    },
    level: {
      type: Sequelize.INTEGER,
      defaultValue: 1
    },
    price: {
      type: Sequelize.INTEGER,
    },
    code: {
      type: Sequelize.INTEGER,
      unique: true
    },
  },
  associations: () => {
    Ticket.belongsTo(Sale, {
      foreignKey: {
        name: 'sale_key',
      }
    });
    Ticket.belongsTo(Passenger, {
      foreignKey: {
        name: 'passenger_key',
      }
    });
    Ticket.hasOne(Discount, {
      foreignKey: {
        name: 'ticket_key',
        allowNull: false
      }
    });
  }

};
