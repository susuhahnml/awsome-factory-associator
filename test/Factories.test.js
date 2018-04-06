const Promise = require('bluebird');
const Sails = require('sails').Sails;
const should = require('should');
const faker = require('faker');

describe('Factories test', function() {

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

    it('should return error defining repeted name', () => {
      try{
        factory.define("paasengerRepeted", Passenger);
        factory.define("paasengerRepeted", Passenger);
        true.should.be.false();
      }catch(err){
        should.exist(err);
      }
    });

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

    it('should error using invalid factory name', () => {
      try{
        return factory.create('Wrong')
        .then(() => {
          true.should.be.false();
        })
      }catch(err){
        should.exist(err);
      }
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

    it('should return error defining with invalid association name', () => {
      try{
        factory.define("ticketWrongAss", Ticket)
        .attr("seat","22A")
        .attr("price",16)
        .assoc("InvalidAs","saleDef", {total:16})
        true.should.be.false();
      }catch(err){
        should.exist(err);
      }
    });

    it('should return error defining with invalid association type', () => {
      try{
        factory.define("ticketWrongAss", Ticket)
        .attr("seat","22A")
        .attr("price",16)
        .assoc("MainDiscount","discountFact") //Using asssoc and should be assocAfter
        true.should.be.false();
      }catch(err){
        should.exist(err);
      }
    });

    it('should return error defining without model', () => {
      try{
        factory.define("ticketWrongModel")
        .attr("seat","22A")
        .attr("price",16)
        .assoc("InvalidAs","saleDef", {total:16})
        true.should.be.false();
      }catch(err){
        should.exist(err);
      }
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

    it('should use saved definition attribute as attribute', () => {
      return factory.create('ticketA', {Sale:{$:'saleSaved'},price:'$saleSaved.total'})
      .then((ticket) => {
        ticket.should.have.property('seat','22A');
        ticket.should.have.property('Sale');
        ticket.Sale.should.have.property('total',ticket.price);
        ticket.Sale.should.have.property('id',ticket.sale_key);
        ticket.should.have.property('$');
      })
    });

    it('should use saved definition function as attribute', () => {
      return factory.create('ticketA', {Sale:{$:'saleSaved'},price:'$saleSaved.getTotal(3)'})
      .then((ticket) => {
        ticket.should.have.property('seat','22A');
        ticket.should.have.property('Sale');
        ticket.should.have.property('price',3);
      })
    });

    it('should use saved definition function as attribute without attributes', () => {
      return factory.create('ticketA', {Sale:{$:'saleSaved'},price:'$saleSaved.getTotal()'})
      .then((ticket) => {
        ticket.should.have.property('seat','22A');
        ticket.should.have.property('Sale');
        ticket.should.have.property('price',0);
      })
    });

    it('should use saved definition function as attribute without attributes', () => {
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

  describe('AssocMany', function() {

    it('should define a salseman asociated to many stores', () => {
      factory.define("storeDef", Store)
      .attr("city","London")
      factory.define("salesmanWithStores", Salesman)
      .attr("name","Sus")
      .assocMany("StoreHired","storeDef", [{city:"Paris"},{city:"Barcelona"}])

      const assocManyConfig = factory.definitions.salesmanWithStores.config.assocMany;
      assocManyConfig.should.have.property('StoreHired');
      assocManyConfig.StoreHired.should.have.property('factoryName',"storeDef");
      assocManyConfig.StoreHired.should.have.property('options',[{city:"Paris"},{city:"Barcelona"}]);
      assocManyConfig.StoreHired.should.have.property('plural','StoreHired');
    });



    it('should create a belongs to many association', () => {
      return factory.create('salesmanA')
      .then((salesman) => {
        salesman.should.have.property('name','Sus');
        salesman.should.have.property('StoreHired');
        salesman.StoreHired.should.have.length(2);
        const storeP = salesman.StoreHired.find((s)=>{return s.city=="Paris"});
        should.exist(storeP);
        const storeL = salesman.StoreHired.find((s)=>{return s.city=="London"});
        should.exist(storeL);
      })
    });

    it('should create a belongs to many association with id', () => {
      let storeId;
      return factory.create('storeA',{city:"Mexico"})
      .then((storeCreated) => {
        storeId = storeCreated.id;
        return factory.create('salesmanA',{StoreHired:[storeId]})
      })
      .then((salesman) => {
        salesman.should.have.property('name','Sus');
        salesman.should.have.property('StoreHired');
        salesman.StoreHired.should.have.length(1);
        salesman.StoreHired[0].should.have.property("city","Mexico");
        salesman.StoreHired[0].should.have.property("id",storeId);
      })
    });

    it('should create a belongs to many overwriting factory name', () => {
      factory.define("storeNew", Store)
      .attr("city","Berlin")
      return factory.create('salesmanA',{StoreHired:[{_factoryName:"storeNew"}]})
      .then((salesman) => {
        salesman.should.have.property('name','Sus');
        salesman.should.have.property('StoreHired');
        salesman.StoreHired.should.have.length(1);
        salesman.StoreHired[0].should.have.property("city","Berlin");
      })
    });

    it('should create a belongs to many using size', () => {
      return factory.create('salesmanA',{name: faker.name.firstName,StoreHired:{city:"LA",_size:10}})
      .then((salesman) => {
        salesman.should.have.property('name');
        salesman.should.have.property('StoreHired');
        salesman.StoreHired.should.have.length(10);
        salesman.StoreHired[0].should.have.property("city","LA");
      })
    });

    it('should save associated instance in same object and use it', () => {
      factory.define("storeRandom", Store)
      .attr("city",faker.address.city)
      factory.define("salesmanWithRandomStores", Salesman)
      .attr("name","Sus")
      .assocMany("StoreHired","storeRandom", [{"$":"store1"},{city:"$store1.city","$":"store2"}])
      return factory.create('salesmanWithRandomStores',{name:"Ale"})
      .then((salesman) => {
        salesman.should.have.property('name','Ale');
        salesman.should.have.property('StoreHired');
        salesman.StoreHired.should.have.length(2);
        salesman['$'].should.have.property("store1");
        salesman['$'].store1.should.have.property("city");
        salesman['$'].should.have.property("store2");
        salesman['$'].store2.should.have.property("city",salesman['$'].store1.city);
      })
    });

  });

});
