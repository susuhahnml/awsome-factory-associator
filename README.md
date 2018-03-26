# The Awesome Factory Associator
  Provides a syntax to **define factories** with **any kind of association**. Helping you create models and the **environment** needed for each **test** with **inline awesome configuration**.

  This hook works with the **Sails.js** framework and using **Sequelize** as ORM.

  Using as base the code of module **sails-industrial-factories** for the attributes creation.

## Setup
### Requirements
- Salis.js
- Sequelize

### Definition
The javascript files inside the folder `test/facass`, will contain the definitions. We advise you to make one file for each model which will export the factories regarding such model.

#### Factory name
``ass.define(factoryName, Model)``
- *factoryName*: A String which defines the name used for creations
- *Model*: References the model
```javascript
  module.exports = function(facass) {
    facass.define("ticketFact", Ticket);
  }
```

#### Attributes
``.attr(attributeName, value, options)``
- *attributeName*: A String which references the name of the attribute. If an attribute must be **unique**, we advise you to use faker or auto-increment to avoid creation Errors.
- *value*: The default value used in creations. If the value is a function it will be called in each creation to generate the final value. This value can be overwritten on each creation.
- *options*: An optional object indicating some of the following options.
  - auto_increment: In each instance creation will increment the value of the last creation by the number indicated in the auto_increment option. Starting at the initial value given. Sequence is shared among parent and children.


```javascript
  facass.define("ticketFact", Ticket)
  .attr("seat","22A")
  .attr("code","1",{auto_increment: 1}) //adds 1 to each creation
  .attr("folio",function() { return Math.random(); }) //folio must be random
```

### Usage
To use this module it must be required in your file
``` javascript
const facass = require("awsome-factory-associator");
```
##### Create

``.create(factoryName, options)`` Asynchoronous function to create a new model object.
- *factoryName*: The name of the factory to be used
- *options*: Object with options to rewrite default attributes and associations.

This function will return a **promise** with the createdModel.
```javascript
  facass.create("ticketFact"); //Creates a ticket with the default seat and folio and code 1(inital value).

  facass.create("ticketFact",{seat:"1F"}); //Creates a ticket with the default folio but seat 1F and code 2(inital value + 1).
```

##### Build
``.build(factoryName, options)``
This function works like create, but it only returns the object properties **without creating** it.

#### Parent

``parent`` This option reuses all the parent attributes and realionships.

``.parent(parentFactoryName)``
- *parentFactoryName*: The name of the factory of the parent. Each attribute and realitionship
can be overwritten in the current model.

```javascript
  facass.define("ticketFact", Ticket)
  .attr("seat","22A")
  .attr("folio",function() { return Math.random(); })

  facass.define("ticketWithLevel", Ticket)
  .parent("ticketFact")
  .attr("level",1)
  //The created instance will have the attribute seat and a random folio generated on the creation
```

#### BelongsToOne Associations
``assoc`` works for hasOne and hasMany associations in the model associated. Used for n - 1 and 1 - 1 associations.

``.assoc(foreignKeyName, factoryName, options)``
- *foreignKeyName*: A String which references the name of the foreignKey defined in the model.
- *factoryName*: The name of the factory used to create the associated model.
- *options*: An optional object which will define the defaults to be passed in the factory creation as main options.

```javascript
  Ticket.belongsTo(Sale, {
    foreignKey: 'sale_key'
  }),
  Sale.hasMany(Ticket, {
    foreignKey: 'sale_key'
  })
```

```javascript
  facass.define("saleFact", Sale)
  .attr("total",120)

  facass.define("ticketFact", Ticket)
  .attr("seat","22A")
  .attr("price",30)
  .assoc("sale_key","saleFact", {total:30})
```
##### Usage
```javascript
facass.create("ticketFact"); //Creates a ticket and a sale
```
It will first create the associated *model* (Sale) and pass its id as value of the *foreignKeyName* (sale_key) param.

##### Passing and id in options.
When the object to associate has **already** been **crated** its id can be passed in the options object using the foreignKey. When an id is passed no additional object creation will be made. In this example the sale is already created and its id is passed to the ticket creation. Only one sale will be crated in this example.

```javascript
  facass.create("saleFact",{total:10})//Crates a sale and return the promise
  .then((saleCreated){
    facass.create("ticketFact",{sale_key:saleCreated.id}); //Uses the sale already created
  })
  .catch(err){
    //Handle error
  };
```

##### Passing options for associated model.
With the options object the associated model attributes can be modified, by sending and object with the options as value of the foreignKey. This options will rewrite and be added to the defaults.
```javascript
  facass.create("ticketFact",{sale_key:{total:100,date:'2018-2-1'}});
```
In this case when creating the sale defined in the ticketFact definition using the saleFact factory, the obtect ``{total:100,date:'2018-2-1'}`` will be passed as options for this creation. This will create a ticket associated with a sale with total 100(rewriting the default 30), and with date 2018-2-1.

#### BelongsToMany Associations
``assocMany`` works for n - m associations.

``.assocMany(as, factoryName, optionsArray)``
- *as*: A String which references the *as* value to refer to the associated model. In case there is no *as* defined, the associated model name will work.
- *factoryName*: The name of the factory used to create the associated models.
- *options*: An array of options. Each element of this array will trigger a creation of one associated model using the factoryName and the options passed, if a value passed is ``{}`` it will imply a creation without passing any options. Options might also be an object indicating de number of elements to create.


```javascript
  Salesman.belongsToMany(PointOfSale, {
    as: 'PointOfSaleHired',
    through: 'SalesmanPointOfSale', //Table Name not used
    foreignKey: 'salesman_id' //Not used
  }),
  PointOfSale.belongsToMany(Salesman, {
    through: 'SalesmanPointOfSale', //Table Name not used
    foreignKey: 'point_of_sale_id' //Not used
  })
```

```javascript
  facass.define("pointOfSaleFact", PointOfSale)
  .attr("city","London")

  facass.define("salesmanFact", Salesman)
  .attr("name","Lol")
  .assocMany("PointOfSaleHired","pointOfSaleFact",[{city:"Paris"},{}])
  //If no as is defined, use PointOfSale instead of PointOfSaleHired
```

##### Usage

```javascript
facass.create("salesmanFact");
```

It will first create the associated models using the factory pointOfSaleFact, one model passing ``{city:"Paris"}``as options, and another one without passing addition options. After creating both Points of Sale it will create the salesman. Once all models are created, using the function ``setPointOfSaleHireds``*(This function is provided by Sequelize)* with the ids of the created points, it will set the points for the salemsman created.

##### Passing array of options
To pass options for a multiple association the key used must be the *as* string used in the factory definition. The value must be an array, and each element of it can be either an **options object**, in this case it will be used to rewrite the defaults, or an **id** for an **existent object**. In both cases it will be used for the same position in the default array.
```javascript
facass.create("salesmanFact",{"PointOfSaleHired":[{city:"Tokio"}]});
```
This will create a point of sale with city Tokio, rewriting the default Paris. Then create the salesman and associated such point of sale.

```javascript
facass.create("salesmanFact",{"PointOfSaleHired":[{},{city:"Mexico"}]});
```
In this case the first point of sale will be have city Paris, and the second one with the city Mexico.

```javascript
facass.create("salesmanFact",{"PointOfSaleHired":{size:10}});
```
In this case it will create 10 PointsOfSale with the default options of the factory *pointOfSaleFact*. Then create the salesman and associated such points of sale.


#### HasOne Associations
``assocAfter`` works for 1 - {0,1} associations. This is used in case the associated model **requires** the current model for its creation.

``.assocAfter(as, foreignKey, factoryName, options)``
- *as*: A String which references the *as* value to refer to the associated model. In case there is no *as* defined, the associated model name will work.
- *foreignKey* The name of the foreignKey in the associated model.
- *factoryName*: The name of the factory used to create the associated model.
- *options*: An optional object which will defined the defaults to be passed in the factory creation as main options.

```javascript
  Ticket.hasOne(Discount, {
    foreignKey: 'ticket_key'
  }),
  Discount.belongsTo(Ticket, {
    foreignKey: {
      name: 'ticket_key',
      allowNull: false, //Discount can not be created without ticket
    }
  })
```

```javascript
  facass.define("discountFact", Discount)
  .attr("percentage",20)

  facass.define("ticketFactDiscount", Ticket)
  .assocAfter("Discount","ticket_key","discountFact") //In this case no options is required
```
##### Usage

```javascript
facass.create("salesmanFact");
```

When using ``assocAfter`` the main model (Ticket) will be created first, this way we have the ticket id(For instance 23). After its creation the associated model(Discount) will be created using the factoryName(discountFact) and setting the id of the created ticket using the foreignKey(ticket_key) adding `{ticket_key:23}` to the options object.  Since no options are passed it will use the values defined in the first factory. Creating a ticket associated to a discount.

##### Passing options
To pass options for this association the key used must be the *as* string used in the factory definition. The value must be an object to rewrite the default. In this you can **not** an **id** instead of options, since the associated model, if already created, must be related to another model.
```javascript
facass.create("ticketFactDiscount",{seat:"1B",Credit:{percentage:50}})
```
Creates a ticket with seat 1B. Then using the id of the ticket created creates a discount with factory discountFact passing the options ``{percentage:50,ticket_key:X}`` where ``X`` is the id of the created ticket.

#### HasMany Associations
``assocManyAfter`` works for 1 - n associations. This is used in case the associated model **requires** the current model for its creation.

``.assocManyAfter(as, foreignKey, factoryName, optionsArray)``
- *as*: A String which references the as value to refer to the associated model. In case there is no as defined, the associated model name will work.
- *foreignKey* The name of the foreignKey in the associated model.
- *factoryName*: The name of the factory used to create the associated model.
- *optionsArray*: An array of options. Each element of this array will trigger a creation of one associated model using the factoryName and the options passed (**id** is **not** supported), if a value passed is ``undefined`` it will imply a creation without passing any options. Options might also be an object indicating de number of elements to create.

```javascript
  Ticket.belongsTo(Sale, {
    foreignKey: 'sale_key'
  }),
  Sale.hasMany(Ticket, {
    foreignKey: 'sale_key'
  })
```

```javascript
  facass.define("saleFactWithTickets", Sale)
  .attr("total",120)
  .assocManyAfter("Ticket","sale_key","ticketFactNoSale",[{price:120/2},{price:120/2}])

  facass.define("ticketFactNoSale", Ticket)
```
##### Usage

It works just as *assocAfter* but passing an array of options as illustrated in *asscoMany*, but in this case **ids** can **not** be passed in the array.

```javascript
facass.create("saleFactWithTickets",{Ticket:[{seat:"1A"},{seat:"1B"}]})
```
When using ``assocManyAfter`` the first model (Sale) will be created first, this way we have the sale id(For instace 4). After its creation the associeated models(Ticket) will be created using the factoryName(ticketFactNoSale) and setting the id of the created ticket using the foreignKey(sale_key) adding `{sale_key:4}` to the options object in each creation. Hence, the creation options for the first ticket will be `{seat:"1A",sale_key:4}` and for the second `{seat:"1B",sale_key:4}`. Creating two tickets associated with the same sale.

#### Reusing models
When defining a factory or setting the options, you might want to use a model already created during this process.
##### Definition
Using the ``$`` symbol you can set a name for the model already created ``{$:name}``, and use the name to refer to it ``{key:$name.attribute}``.

In this example we continue with the last idea of a sale with tickets, but in this case we want both tickets in the sale to be related to the same passenger.
```javascript
  Passenger.hasMany(Ticket, {
    foreignKey: 'passenger_key',
  });
  Ticket.belongsTo(Sale, {
    foreignKey: 'sale_key'
  }),
  Ticket.belongsTo(Passenger, {
    foreignKey: 'passenger_key'
  }),
  Sale.hasMany(Ticket, {
    foreignKey: 'sale_key'
  })
```

```javascript
  facass.define("passengerFact", Passenger)
  .attr("name",faker.name.firstName) //Use faker to create a random name

  facass.define("ticketFactPassengerNoSale", Ticket)
  .assoc("passenger_key","passengerFact")

  facass.define("saleFactWithTicketsAndPassenger", Sale)
  .attr("total",120)
  .assocManyAfter("Ticket","sale_key","ticketFactNoSale",
  [{$:"passangerName"},{passenger_key:"$passengerName.id"}])
```

By setting ``{$:"passangerName"}`` we can refer to such passenger in the creation of the second ticket, to use his id and lick both tickets to the same passenger.

In order to refer to the main model created we can use ``$root``, this is a reserved name for this model.

By using ``$root`` we are able to refer to the sale total, and use it to set the price of each ticket.

All the saved models will be returned in the created object inside the attriute ``$``.

```javascript
  facass.create("saleFactWithTicketsAndPassenger", {total: faker.random.number, Ticket:[{price:$root.total/2},{price:$root.total/2}]})
  .then((createdSale) => {
    // createdSale.$ = {
    //   passangerName: //The passenger model created
    // }
  })
```

<!-- #### InfinteLoops
When defining and using factories it is **important** to verify no loops are crated. Since this will take the creation into an **infinite loop**.

Example of definition **with loops**
```javascript
ass.define("saleFactWithTickets", Sale)
.attr("total",120)
.assocManyAfter("Ticket","sale_key","ticketFactNoSale",[{price:120/4}])

ass.define("ticketFact", Ticket)
.assoc("sale_key","saleFactWithTickets", {total:30})
```

```javascript
fact.create("saleFactWithTickets"); //Infinite loop
```
Since the factory saleFactWithTickets creates a ticket but the ticket creates a sale using this same factory, each creation will create one of the other. Hence, this function will never return. -->

### Extra configurations
Configuration file ``config/facass.js``
#### Loading factories
#### Unique
When using the same factory more than one time the models creation might **fail** due to uniqueness issues. This is why we advise you to use **faker** when defining unique attributes. Even by using random data, it can fail by chance. To avoid such errors the creation of a model can be **retried** in case of uniqueness error. The number of times the creation will be retried can be configured in this file, adding ``{creationRetries: times }``, where ``times`` is a number. The default value is **1**.
#### Populated Object
The object returned after the creation will be populated, in order to refer to its values and associations during tests. To set the depth of this population use the parameter ``{populationDepth: depth }``, where ``depth`` indicates how many times the nested models associations will be populated. The default value is **3**. Note that when having **circular references**, the returned object will be highly populated so we advise you not to use big numbers in this configuration.
