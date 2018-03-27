const faker = require('faker');

module.exports = (factory) => {

  factory.define("saleFact", Sale)
  .attr("total",120)

}
