const faker = require('faker');

module.exports = (factory) => {

  factory.define("salesmanA", Salesman)
  .attr("name","Sus")
  .assocMany("StoreHired","storeA", [{city:"Paris"},{}])

}
