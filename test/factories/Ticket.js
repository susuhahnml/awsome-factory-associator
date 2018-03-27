const faker = require('faker');

module.exports = (factory) => {

  factory.define('ticketFact', Passenger)
  .attr("seat","22A")
  .attr("code",1,{auto_increment: 1})
  .attr("price",function() { return Math.round(100*Math.random()); }) //price must be random

}
