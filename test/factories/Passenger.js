const faker = require('faker');

module.exports = (factory) => {

  factory.define('passengerFact', Passenger)
    .attr("name", faker.name.firstName);
    
}
