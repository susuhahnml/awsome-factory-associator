const Promise = require('bluebird');
const Sails = require('sails').Sails;
const should = require('should');
const faker = require('faker');

describe('Factories test', function() {

  // describe('Load', function() {
  //   it.only('should load', () => {
  //     factory.load();
  //     return factory.create('saleFact')
  //       .then((sale) => {
  //         (sale instanceof Sale).should.be.true();
  //         return Sale.findAndCountAll()
  //       })
  //       .then((result) => {
  //         result.count.should.equal(1);
  //       })
  //   });
  // });

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

  describe('Assoc', function() {

    it('should define a ticket asociated to a sale', () => {
      factory.define("saleDef", Sale)
      .attr("total",120)
      factory.define("ticketDef", Ticket)
      .attr("seat","22A")
      .attr("price",16)
      .assoc("Sale","saleDef", {total:16})

      factory.definitions.ticketDef.config.assoc.should.have.property('Sale');
      factory.definitions.ticketDef.config.assoc.Sale.should.have.property('factoryName',"saleDef");
      factory.definitions.ticketDef.config.assoc.Sale.should.have.property('options',{total:16});
      factory.definitions.ticketDef.config.assoc.Sale.should.have.property('foreignKey','sale_key');
    });

    it('should get associations from parent', () => {
      factory.define("ticketAFree")
      .parent("ticketA")
      .attr("price",0)

      factory.definitions.ticketAFree.config.assoc.should.have.property('Sale');
      factory.definitions.ticketAFree.config.assoc.Sale.should.have.property('factoryName',"saleA");
      factory.definitions.ticketAFree.config.assoc.Sale.should.have.property('options',{total:30});
      factory.definitions.ticketAFree.config.assoc.Sale.should.have.property('foreignKey','sale_key');
    });

    it('should get associations from parent and overwrite associations', () => {
      factory.define("saleFree", Sale)
      .attr("total",0)
      factory.define("ticketAFreeSale")
      .parent("ticketAFree")
      .assoc("Sale","saleFree")

      factory.definitions.ticketAFreeSale.config.assoc.should.have.property('Sale');
      factory.definitions.ticketAFreeSale.config.assoc.Sale.should.have.property('factoryName',"saleFree");
      factory.definitions.ticketAFreeSale.config.assoc.Sale.should.have.property('options',undefined);
      factory.definitions.ticketAFreeSale.config.assoc.Sale.should.have.property('foreignKey','sale_key');
    });

    it('should create a belongs to association', () => {
      return factory.create('ticketA')
      .then((ticket) => {
        ticket.should.have.property('seat','22A');
        ticket.should.have.property('Sale');
        ticket.Sale.should.have.property('total',30);
        ticket.Sale.should.have.property('id',ticket.sale_key);
      })
    });

    it('should create a belongs to association from id', () => {
      let sale;
      return factory.create('saleA')
      .then((saleCreated) => {
        sale = saleCreated;
        return factory.create('ticketA',{Sale:sale.id})
      })
      .then((ticket) => {
        ticket.should.have.property('seat','22A');
        ticket.should.have.property('Sale');
        ticket.Sale.should.have.property('total',sale.total);
        ticket.Sale.should.have.property('id',sale.id);
      })
    });

    it('should create a belongs to association with options', () => {
      return factory.create('ticketA', {Sale:{total:0}})
      .then((ticket) => {
        ticket.should.have.property('seat','22A');
        ticket.should.have.property('Sale');
        ticket.Sale.should.have.property('total',0);
        ticket.Sale.should.have.property('id',ticket.sale_key);
      })
    });

    it('should create a belongs to association but overwrite if forain key sent', () => {
      let sale;
      return factory.create('saleA')
      .then((saleCreated) => {
        sale = saleCreated;
        return factory.create('ticketA',{sale_key:sale.id})
      })
      .then((ticket) => {
        ticket.should.have.property('seat','22A');
        ticket.should.have.property('Sale');
        ticket.Sale.should.have.property('total',sale.total);
        ticket.Sale.should.have.property('id',sale.id);
      })
    });

    it('should create a belongs to association with save option', () => {
      return factory.create('ticketA', {Sale:{$:'saleSaved'},$:'ticketCreated'})
      .then((ticket) => {
        ticket.should.have.property('seat','22A');
        ticket.should.have.property('Sale');
        ticket.Sale.should.have.property('total',120);
        ticket.Sale.should.have.property('id',ticket.sale_key);
        ticket.should.have.property('$');
        ticket.$.should.have.property('saleSaved');
        ticket.$.should.have.property('ticketCreated');
        ticket.$.saleSaved.should.have.property('id',ticket.Sale.id);
        ticket.$.ticketCreated.should.have.property('id',ticket.id);
      })
    });

    it('should use saved instance attribute as attribute', () => {
      return factory.create('ticketA', {Sale:{$:'saleSaved'},price:'$saleSaved.total'})
      .then((ticket) => {
        ticket.should.have.property('seat','22A');
        ticket.should.have.property('Sale');
        ticket.Sale.should.have.property('total',ticket.price);
        ticket.Sale.should.have.property('id',ticket.sale_key);
        ticket.should.have.property('$');
      })
    });

    it('should use saved instance function as attribute', () => {
      return factory.create('ticketA', {Sale:{$:'saleSaved'},price:'$saleSaved.getTotal(3)'})
      .then((ticket) => {
        ticket.should.have.property('seat','22A');
        ticket.should.have.property('Sale');
        ticket.should.have.property('price',3);
      })
    });

    it('should use saved instance function as attribute without attributes', () => {
      return factory.create('ticketA', {Sale:{$:'saleSaved'},price:'$saleSaved.getTotal()'})
      .then((ticket) => {
        ticket.should.have.property('seat','22A');
        ticket.should.have.property('Sale');
        ticket.should.have.property('price',0);
      })
    });

    it('should use saved instance function as attribute without attributes', () => {
      return factory.create('ticketA', {Sale:{$:'saleSaved'},price:'$saleSaved.getTotal()'})
      .then((ticket) => {
        ticket.should.have.property('seat','22A');
        ticket.should.have.property('Sale');
        ticket.should.have.property('price',0);
      })
    });

    it('should create a belongs to association overwriting the factory name', () => {
      factory.define("saleFacName", Sale)
      .attr("total",9)
      return factory.create('ticketA', {Sale:{_factoryName:'saleFacName'}})
      .then((ticket) => {
        ticket.should.have.property('seat','22A');
        ticket.should.have.property('Sale');
        ticket.Sale.should.have.property('total',9);
        ticket.Sale.should.have.property('id',ticket.sale_key);
      })
    });


  });

});
