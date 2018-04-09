const faker = require('faker');

module.exports = (factory) => {

  factory.define("saleFact", Sale)
  .attr("total",120)

  factory.define("saleA", Sale)
  .attr("total",120)

  factory.define("saleB", Sale)
  .attr("total",120)
  .assocManyAfter("Tickets","ticketA",[{price:120/2},{price:120/2}])

}
