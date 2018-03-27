/**
 * Salesman.js
 *
 * @description ::Represents a Salesman
 */

module.exports = {
  attributes: {
    name: {
      type: Sequelize.STRING,
    }
  },
  associations: () => {
    Salesman.belongsToMany(Store, {
      as: 'StoreHired',
      through: 'SalesmanStore',
      foreignKey: 'salesman_id'
    });
  }

};
