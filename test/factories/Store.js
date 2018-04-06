const faker = require('faker');

module.exports = (factory) => {

  factory.define("storeA", Store)
  .attr("city","London")

}
