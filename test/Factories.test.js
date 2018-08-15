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

    it('should create using function arready called as attribute', () => {
      factory.define('saleCancelled', Sale)
        .attr("total", faker.random.number)
        .attr("cancelled_at", faker.date.future(1))
      return factory.create('saleCancelled')
        .then((sale) => {
          should.exist(sale.cancelled_at);
          should.exist(sale.total);
        })
    });

    it('should create using null as attribute', () => {
      factory.define('saleNotCancelled', Sale)
        .attr("total", faker.random.number)
        .attr("cancelled_at", null)
      return factory.create('saleNotCancelled')
        .then((sale) => {
          should.not.exist(sale.cancelled_at);
          should.exist(sale.total);
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

    it('should define a store asociated to many salesman using default as', () => {
      factory.define("salesmanOne", Salesman)
      .attr("name","Pedro")

      factory.define("storeWithSalesmans", Store)
      .attr("city","London")
      .assocMany("Salesmans","salesmanOne",[{}])

      const assocManyConfig = factory.definitions.storeWithSalesmans.config.assocMany;
      assocManyConfig.should.have.property('Salesmans');
      assocManyConfig.Salesmans.should.have.property('factoryName',"salesmanOne");
      assocManyConfig.Salesmans.should.have.property('options',[{}]);
      assocManyConfig.Salesmans.should.have.property('plural','Salesmans');
      return factory.create("storeWithSalesmans")
      .then((store) => {
        store.should.have.property("Salesmans");
        store.Salesmans.should.have.length(1);
        store.Salesmans[0].should.have.property("name","Pedro");
      })
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

    it('should create a belongs to many using size and save it', () => {
      return factory.create('salesmanA',{name: faker.name.firstName,StoreHired:{city:"LA",_size:2, $:'store-'}})
      .then((salesman) => {
        salesman.should.have.property('name');
        salesman.should.have.property('StoreHired');
        salesman.StoreHired.should.have.length(2);
        salesman.StoreHired[0].should.have.property("city","LA");
        salesman.$.should.have.property('store-0');
        salesman.$.should.have.property('store-1');
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

  describe('hasOne', function() {

    it('should define a ticket asociated to one discount', () => {
      factory.define("discountFact", Discount)
      .attr("percentage",20)

      factory.define("ticketFactDiscount", Ticket)
      .assocAfter("MainDiscount","discountFact",{percentage:50})

      const assocAfterConfig = factory.definitions.ticketFactDiscount.config.assocAfter;
      assocAfterConfig.should.have.property('MainDiscount');
      assocAfterConfig.MainDiscount.should.have.property('factoryName',"discountFact");
      assocAfterConfig.MainDiscount.should.have.property('options',{percentage:50});
      assocAfterConfig.MainDiscount.should.have.property('foreignKey','ticket_key');
    });

    it('should create a has one association', () => {
      return factory.create('ticketWithDiscount',{price:100})
      .then((ticket) => {
        ticket.should.have.property('price',100);
        ticket.should.have.property('MainDiscount');
        ticket.MainDiscount.should.have.property("percentage",10);
      })
    });

    it('should create a has one association with options', () => {
      return factory.create('ticketWithDiscount',{MainDiscount:{percentage:80}})
      .then((ticket) => {
        ticket.should.have.property('MainDiscount');
        ticket.MainDiscount.should.have.property("percentage",80);
      })
    });

    it('should create a has one association with diferent factory', () => {
      factory.define("discountFull", Discount)
      .attr("percentage",100)
      return factory.create('ticketWithDiscount',{MainDiscount:{_factoryName:"discountFull"}})
      .then((ticket) => {
        ticket.should.have.property('MainDiscount');
        ticket.MainDiscount.should.have.property("percentage",100);
      })
    });

    it('should respond error if id passed', () => {
      return factory.create('ticketWithDiscount',{MainDiscount:2})
        .then((ticket) => {
          true.should.be.false();
        })
        .catch((err) => {
          err.message.should.equal("Ids can not be passed in MainDiscount since it is a HasOne or HasMany association.");
        });
    });

    it('should save has one association', () => {
      return factory.create('ticketWithDiscount',{MainDiscount:{percentage:"$root.price", $:"discountSaved"}})
      .then((ticket) => {
        ticket.should.have.property('MainDiscount');
        ticket.MainDiscount.should.have.property("percentage",ticket.price);
        ticket.$.should.have.property("discountSaved");
        ticket.$.discountSaved.should.have.property("id",ticket.MainDiscount.id);
      })
    });
  });


  describe('hasMany', function() {

    it('should define a sale asociated to many tickets', () => {
      factory.define("ticketFactNoSale", Ticket)

      factory.define("saleFactWithTickets", Sale)
      .attr("total",120)
      .assocManyAfter("Tickets","ticketFactNoSale",[{price:120/2},{price:120/2}])

      const assocManyAfterConfig = factory.definitions.saleFactWithTickets.config.assocManyAfter;
      assocManyAfterConfig.should.have.property('Tickets');
      assocManyAfterConfig.Tickets.should.have.property('factoryName',"ticketFactNoSale");
      assocManyAfterConfig.Tickets.should.have.property('options',[{price:120/2},{price:120/2}]);
      assocManyAfterConfig.Tickets.should.have.property('foreignKey','sale_key');
    });

    it('should create has many association', () => {
      return factory.create('saleB')
      .then((ticket) => {
        ticket.should.have.property('Tickets');
        ticket.Tickets.should.have.length(2);
      })
    });

    it('should create has many with options', () => {
      return factory.create('saleB',{Tickets:{_size:3,price:"$root.total"}})
      .then((sale) => {
        sale.should.have.property('Tickets');
        sale.Tickets.should.have.length(3);
        sale.Tickets[0].should.have.property('price',sale.total);
        sale.Tickets[1].should.have.property('price',sale.total);
        sale.Tickets[2].should.have.property('price',sale.total);
      })
    });

    it('should respond error if id passed', () => {
      return factory.create('saleB',{Tickets:[1]})
      .then((ticket) => {
        true.should.be.false();
      })
      .catch((err) => {
        err.message.should.equal("Ids can not be passed in Tickets since it is a HasOne or HasMany association.");
      });
    });

    it('should save has many association', () => {
      return factory.create('saleB',{Tickets:[{$:"ticket1"}]})
      .then((sale) => {
        sale.should.have.property('Tickets');
        sale.Tickets.should.have.length(1);
        sale.$.should.have.property('ticket1');
      })
    });
  });

});
