/**
 * Discount.js
 *
 * @description ::Represents a Discount
 */

module.exports = {
  attributes: {
    percentage: {
      type: Sequelize.INTEGER,
    },
  },
  associations: () => {
    Discount.belongsTo(Ticket, {
      foreignKey: {
        name: 'ticket_key',
        allowNull: false
      }
    });
  }

};
