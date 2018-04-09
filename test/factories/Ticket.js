const faker = require('faker');

module.exports = (factory) => {

  factory.define('ticketFact', Passenger)
  .attr("seat","22A")
  .attr("code",1,{auto_increment: 1})
  .attr("price",function() { return Math.round(100*Math.random()); }) //price must be random


  factory.define("ticketA", Ticket)
  .attr("seat","22A")
  .attr("price",30)
  .assoc("Sale","saleA", {total:30})

  factory.define("ticketWithDiscount", Ticket)
  .assocAfter("MainDiscount","discountB")

  factory.define("ticketB", Ticket)


}
