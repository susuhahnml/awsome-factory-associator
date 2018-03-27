const Promise = require('bluebird');
const Sails = require('sails').Sails;
const should = require('should');
const faker = require('faker');

describe('Factories test', function() {

  describe('Load', function() {
    it('should load', () => {
      factory.load();
      return factory.create('saleFact')
        .then((sale) => {
          (sale instanceof Sale).should.be.true();
          return Sale.findAndCountAll()
        })
        .then((result) => {
          result.count.should.equal(1);
        })
    });
  });

  describe('Creation', function() {

    it('should define a factory', () => {
      return new Promise((resolve, reject) => {
        factory.define('passenger', Passenger)
          .attr("name", "Pedro");
        factory.definitions.passenger.name.should.equal('passenger');
        factory.definitions.passenger.config.attr.name.should.equal('Pedro');
        return resolve();
      });
    })

    it('should build', () => {
      return factory.build('passenger')
        .then((passenger) => {
          (passenger instanceof Passenger).should.be.true();
          passenger.name.should.eql("Pedro");
          passenger.is_disabled.should.eql(false);
          return Passenger.findAndCountAll({where:{name:"Pedro"}});
        })
        .then((result) => {
          result.count.should.equal(0);
        })
    });

    it('should create', () => {
      return factory.create('passenger')
        .then((passenger) => {
          (passenger instanceof Passenger).should.be.true();
          passenger.name.should.eql("Pedro");
          passenger.is_disabled.should.eql(false);
          return Passenger.findAndCountAll({where:{name:"Pedro"}});
        })
        .then((result) => {
          result.count.should.equal(1);
        })
    });
  });


  describe('Attributes', function() {

    it('should create using function as attribute', () => {
      factory.define('passengerFunction', Passenger)
        .attr("name", faker.lorem.word)
      return factory.create('passengerFunction')
        .then((passenger) => {
          (passenger instanceof Passenger).should.be.true();
          (typeof passenger.name).should.eql('string');
          return Passenger.findAndCountAll({where:{name:passenger.name}});
        })
        .then((result) => {
          result.count.should.equal(1);
        })
    });

    it('should create auto incremet for string', () => {
      factory.define('passengerAutoIncrement', Passenger)
        .attr("name", faker.lorem.word, {auto_increment:2});
      return factory.create('passengerAutoIncrement')
        .then((passenger) => {
          (typeof passenger.name).should.eql('string');
          passenger.name.slice(-1).should.eql('1');
          return factory.create('passengerAutoIncrement')
        })
        .then((passenger2) => {
          passenger2.name.slice(-1).should.eql('3');
        })
    });

    it('should overwrite value incremented', () => {
      return factory.create('passengerAutoIncrement',{name:'nameString'})
        .then((passenger) => {
          (typeof passenger.name).should.eql('string');
          passenger.name.should.eql('nameString');
        })
    });

    it('should create auto incremet for intener', () => {
      let ticket1;
      factory.define('ticketIncrementCode', Ticket)
        .attr("price", faker.random.number)
        .attr("seat", "A24")
        .attr("code", 1, {auto_increment:1});
      return factory.create('ticketIncrementCode')
        .then((ticket) => {
          ticket1 = ticket;
          (typeof ticket.price).should.eql('number');
          ticket.seat.should.eql("A24");
          ticket.code.should.eql(1);
          return factory.create('ticketIncrementCode')
        })
        .then((ticket2) => {
          ticket2.code.should.not.eql(ticket1.price);
          ticket2.code.should.eql(2);
        })
    });

    it('should share increment with children and alter attributes', () => {
      factory.define('ticketIncrementCodeChild', Ticket)
      .parent('ticketIncrementCode')
      .attr('seat','X');
      return factory.create('ticketIncrementCodeChild')
        .then((ticket) => {
          (typeof ticket.price).should.eql('number');
          ticket.seat.should.eql("X");
          ticket.code.should.eql(3);
        })
    });

  });

});
