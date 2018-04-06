const faker = require('faker');

module.exports = (factory) => {

  factory.define("discountFact", Discount)
  .attr('percentage',10);



}
