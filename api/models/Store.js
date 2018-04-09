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
      through: 'SalesmanStore',
      foreignKey: 'store_id'
    });
  }

};
