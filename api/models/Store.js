/**
 * Store.js
 *
 * @description ::Represents a Store
 */

module.exports = {
  attributes: {
    city: {
      type: Sequelize.STRING,
    }
  },
  associations: () => {
    Store.belongsToMany(Salesman, {
      as: 'StoreHired',
      through: 'SalesmanStore',
      foreignKey: 'store_id'
    });
  }

};
