const Promise = require('bluebird');
const Sails = require('sails').Sails;
const should = require('should');
const faker = require('faker');

describe('Factories test', function() {

  it('should define', () => {
    return new Promise((resolve, reject) => {
      factory.define('mini', TableType)
        .attr("name", "Mini");
      factory.definitions.mini.name.should.equal('mini');
      factory.definitions.mini.config.attr.name.should.equal('Mini');
      return resolve();
    });
  })

  it('should build', () => {
    factory.define('mini', TableType)
      .attr("name", "Mini");
    return factory.build('mini')
      .then((table) => {
        (table instanceof TableType).should.be.true();
      })
  });

  it('should create', () => {
    factory.define('mini', TableType)
      .attr("name", "Mini");
    return factory.create('mini')
      .then((table) => {
        (table instanceof TableType).should.be.true();
        return TableType.findAndCountAll({where:{name:"Mini"}})
      })
      .then((result) => {
        result.count.should.equal(1);
      })
  });

  it('should randomly create', () => {
    factory.define('activeRandom', Restaurant)
      .attr("name", faker.lorem.word);
    return factory.create('activeRandom')
      .then((restaurant) => {
        (restaurant instanceof Restaurant).should.be.true();
        return Restaurant.findAndCountAll({where:{name:restaurant.name}})
      })
      .then((result) => {
        result.count.should.equal(1);
      })
  });

  it('should randomly create and increment', () => {
    factory.define('activeRandom', Restaurant)
      .attr("name", faker.lorem.word, {auto_increment: 2});

    return factory.create('activeRandom')
      .then((restaurant) => {
        (restaurant instanceof Restaurant).should.be.true();
        restaurant.name.slice(-1).should.equal('1');
        return Restaurant.findAndCountAll({where:{name:restaurant.name}})
      })
      .then((result) => {
        result.count.should.equal(1);
      })
  });

  it('should overwrite an increment', () => {
    factory.define('activeRandom', Restaurant)
      .attr("name", faker.lorem.word, {auto_increment: 2});

    return factory.create('activeRandom',{name:"NewName"})
      .then((restaurant) => {
        (restaurant instanceof Restaurant).should.be.true();
        restaurant.name.should.eql("NewName");
      })
  });


  // it.only('should create an incremt with number', () => {
  //   factory.define('activeRandom', Restaurant)
  //     .attr("number", 1, {auto_increment: 1});
  //
  //   return factory.create('activeRandom')
  //     .then((restaurant) => {
  //       (restaurant instanceof Restaurant).should.be.true();
  //       restaurant.number.should.eql(1);
  //       return factory.create('activeRandom')
  //     })
  //     .then((restarurant2) => {
  //       restaurant.number.should.eql(2);
  //     })
  // });

  it('should alter define', () => {
    factory.define('active', Restaurant)
      .attr("name", "Mini")
      .attr("active", true);
    factory.define('inactive').parent('active')
      .attr("active", false);
    return factory.create('inactive')
      .then((restaurant) => {
        (restaurant instanceof Restaurant).should.be.true();
        return Restaurant.findAndCountAll({where:{active:false}})
      })
      .then((result) => {
        result.count.should.equal(1);
      })
  });

  it('should load', () => {
    factory.load();
    return factory.create('inactive')
      .then((restaurant) => {
        (restaurant instanceof Restaurant).should.be.true();
        return Restaurant.findAndCountAll({where:{active:false}})
      })
      .then((result) => {
        result.count.should.equal(1);
      })
  });

  it('should increment', () => {
    factory.define('active', Restaurant)
      .attr("name", "Mini", {auto_increment:2});
    factory.define('inactive').parent('active');
    return factory.create('inactive')
      .then((restaurant) => {
        (restaurant instanceof Restaurant).should.be.true();
        return Restaurant.findAndCountAll({where:{name:"Mini1"}})
      })
      .then((result) => {
        result.count.should.equal(1);
      })
      .then(() => {
        return factory.create('active')
      })
      .then((restaurant) => {
        (restaurant instanceof Restaurant).should.be.true();
        return Restaurant.findAndCountAll({where:{name:"Mini3"}})
      })
      .then((result) => {
        result.count.should.equal(1);
      })
  });

});
