const faker = require('faker');

module.exports = (factory) => {

  factory.define("discountB", Discount)
  .attr('percentage',10);



}
