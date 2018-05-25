# The Awesome Factory Associator
  Provides a syntax to **define factories** with **any kind of association**. Helping you create models and the **environment** needed for each **test** with **inline awesome configuration**.

  This hook works with the **Sails.js** framework and using **Sequelize** as ORM.

  Using as base the code of module **sails-industrial-factories** for the attributes creation.

## Setup
### Requirements
- Salis.js
- Sequelize

### Definition
The javascript files inside the folder `test/factory`, will contain the definitions. We advise you to make one file for each model which will export the factories regarding such model.

#### Factory name
``factory.define(factoryName, Model)``
- *factoryName*: A String which defines the name used for creations
- *Model*: References the model
```javascript
  module.exports = function(factory) {
    factory.define("ticketFact", Ticket);
  }
```

#### Attributes
``.attr(attributeName, value, options)``
- *attributeName*: A String which references the name of the attribute. If an attribute must be **unique**, we advise you to use faker or auto-increment to avoid creation Errors.
- *value*: The default value used in creations. If the value is a function it will be called in each creation to generate the final value. This value can be overwritten on each creation.
- *options*: An optional object indicating some of the following options.
  - auto_increment: For every definition creation, the specified value will increase by the number indicated in the auto_increment option, starting at the initial value given. Sequence is shared among parent and children if not overwritten. If value is a string, it will add the sequence number at the end of the string starting in 1.


```javascript
  factory.define("ticketFact", Ticket)
  .attr("seat","22A")
  .attr("code",1,{auto_increment: 1}) //adds 1 to each creation
  .attr("price",function() { return Math.round(100*Math.random()); }) //price must be random
```

### Usage
To use this module it must be required in your file
``` javascript
const factory = require("awsome-factory-associator");
```

For factories to be defined you have to load them using the following command once.
We advise you to do so in the `bootstrap.test.js` file.
``` javascript
factory.load();
```

##### Create

``.create(factoryName, options)`` Asynchoronous function to create a new model object.
- *factoryName*: The name of the factory to be used
- *options*: Object with options to rewrite default attributes and associations.

This function will return a **promise** with the createdModel.
```javascript
  factory.create("ticketFact"); //Creates a ticket with the default seat and price and code 1(inital value).

  factory.create("ticketFact",{seat:"1F"}); //Creates a ticket with the default price but seat 1F and code 2(inital value + 1).
```

#### Parent

``parent`` This option reuses all the parent attributes and associations.

``.parent(parentFactoryName)``
- *parentFactoryName*: The name of the parents factory. Each attribute and associations
can be overwritten in the current factory.

```javascript
  factory.define("ticketFact", Ticket)
  .attr("seat","22A")
  .attr("price",function() { return Math.round(100*Math.random()); })

  factory.define("ticketWithLevel", Ticket)
  .parent("ticketFact")
  .attr("level",1)
  //The created definition will have the attribute seat and a random price generated on the creation
```

#### BelongsToOne Associations
``assoc`` works for hasOne and hasMany associations in the model associated. Used for n - 1 and 1 - 1 associations.

``.assoc(as, factoryName, options)``
- *as*: A String which references the *as* value to refer to the associated model. In case there is no *as* defined, the associated model name will work.
- *factoryName*: The default name of the factory used to create the associated model. Can be overwritten in options using the key *_factoryName*.
- *options*: An optional object which will define the defaults to be passed in the factory creation as main options. More details can be found in the section **Options Object**

```javascript
  Ticket.belongsTo(Sale, {
    foreignKey: 'sale_key'
  }),
  Sale.hasMany(Ticket, {
    foreignKey: 'sale_key'
  })
```

```javascript
  factory.define("saleFact", Sale)
  .attr("total",120)

  factory.define("ticketFact", Ticket)
  .attr("seat","22A")
  .attr("price",30)
  .assoc("Sale","saleFact", {total:30})
```
##### Usage
```javascript
factory.create("ticketFact"); //Creates a ticket and a sale
```
It will first create the associated *model* (Sale) and pass its id as value of the *foreignKeyName* (sale_key) param.

#### Options Object

The following options are available for any association type.

###### Passing and id in options.
When the object to associate has **already** been **crated** its id can be passed in the options object using the *as* key or the foreignKey. When an id is passed no additional object creation will be made. In this example the sale is already created and its id is passed to the ticket creation.

```javascript
  factory.create("saleFact",{total:10})//Crates a sale and return the promise
  .then((saleCreated){
    factory.create("ticketFact",{Sale:saleCreated.id}); //Uses the sale already created
  })
  .catch(err){
    //Handle error
  };
```
 Only one sale will be crated in the previous example.

In this case the foreignKey can be used instead of the association. Foreign Keys will always overwrite any other association defined.
 ```javascript
   factory.create("saleFact",{total:10})//Crates a sale and return the promise
   .then((saleCreated){
     factory.create("ticketFact",{sale_key:saleCreated.id}); //Uses the sale already created
   })
   .catch(err){
     //Handle error
   };
 ```

###### Passing options for associated model.
With the options object the associated model attributes can be modified, by sending an object with the options as value of the *as* key. This options will overwrite and be added to the defaults.
```javascript
  factory.create("ticketFact",{Sale:{total:100,date:'2018-2-1'}});
```
In this case when creating the sale defined in the ticketFact definition using the saleFact factory, the object ``{total:100,date:'2018-2-1'}`` will be passed as options for this creation. This will create a ticket associated with a sale with total 100(rewriting the default 30), and with date 2018-2-1.


###### Overwriting factory name
The associated model can be created using a different factory by adding the attribute *_factoryName* to the options for the associated model.

```javascript
  factory.create("ticketFact",{Sale:{_factoryName: "saleIncomplte", total:0}});
```

In this case the created sale will use the factory *saleIncomplte* configuration.

###### New Associations on creation
In each creation new associations can be added in the options even if not specified in the factory definition. In this case the attribute *_factoryName* is required in the options.

```javascript
  factory.create("ticketFact",{Discount:{_factoryName: "discountFac"}});
```


#### BelongsToMany Associations
``assocMany`` works for n - m associations.

``.assocMany(as, factoryName, optionsArray)``
- *as*: A String which references the *as* value to refer to the associated model. In case there is no *as* defined, the associated model **in its plural form** will work.
- *factoryName*: The default name of the factory used to create the associated models. Can be overwritten in options using the key *_factoryName*.
- *options*: An array of **Options object**. Each element of this array will trigger a creation of one associated model. This elements can use the options explored before. If a value passed is ``{}`` it will imply a creation without passing any options. Options might also be an object instead of an array, indicating the number of elements to create with the key *_size* and the default options for each creation.


```javascript
  Salesman.belongsToMany(Store, {
    as: 'StoreHired',
    through: 'SalesmanStore', //Table Name not used
    foreignKey: 'salesman_id' //Not used
  }),
  Store.belongsToMany(Salesman, {
    through: 'SalesmanStore', //Table Name not used
    foreignKey: 'store_id' //Not used
  })
```

```javascript
  factory.define("salesmanOne", Salesman)
  .attr("name","Pedro")

  factory.define("storeWithSalesmans", Store)
  .attr("city","London")
  .assocMany("Salesmans","salesmanOne",[])
  //Since no as is defined will use plural form of Salesman
```

```javascript
  factory.define("storeFact", Store)
  .attr("city","London")

  factory.define("salesmanFact", Salesman)
  .attr("name","Paco")
  .assocMany("StoreHired","storeFact",[{city:"Paris"},{}])
  //If no as is defined, use Store plural form (Stores) instead of StoreHired
```

##### Usage

```javascript
factory.create("salesmanFact");
```

It will first create the Salesman model, when this is created, it will create the
associated models using the factory storeFact, one model passing ``{city:"Paris"}``as options, and another one without passing additional options. Once all the stores are created, using the function ``setStoreHireds``*(This function is provided by Sequelize)* with the ids of the created stores, it will set the stores for the salemsman created in the first step.

##### Passing array of options

The options of the association definition can be overwritten in the creation with an array or an object as indicated in the *options* field defined above.

To pass options for a multiple association the key used must be the *as* string used in the factory definition.

```javascript
factory.create("salesmanFact",{"StoreHired":[{city:"Tokio"}]});
```
This will create a store with city Tokio, Overwriting the default array with Paris. Then create the salesman and associated such point of sale.

```javascript
factory.create("salesmanFact",{"StoreHired":[{},1]});
```
In this case the first store's city will be London as defined in the factory *storeFact* options. The second will refer to an existent store with id 1.

```javascript
factory.create("salesmanFact",{"StoreHired":{_size:10, city:"Mexico"}});
```
In this case it will create 10 Stores all using Mexico as city, and the default options of the factory *storeFact*. After that it will create the Salesman, associating every store with it.


#### HasOne Associations
``assocAfter`` works for 1 - {0,1} associations. This is used in case the associated model **requires** the current model for its creation.

``.assocAfter(as, factoryName, options)``
- *as*: A String which references the *as* value to refer to the associated model. In case there is no *as* defined, the associated model name will work.
- *factoryName*: The default name of the factory used to create the associated model. Can be overwritten in options using the key *_factoryName*.
- *options*: An optional object which will define the defaults to be passed in the factory creation as main options. More details can be found in the section **Options Object**

```javascript
  Ticket.hasOne(Discount, {
    as: 'MainDiscount',
    foreignKey: {
      name: 'ticket_key',
      allowNull: false, //Discount can not be created without ticket
    }
  }),
  Discount.belongsTo(Ticket, {
    foreignKey: {
      name: 'ticket_key',
      allowNull: false, //Discount can not be created without ticket
    }
  })
```

```javascript
  factory.define("discountFact", Discount)
  .attr("percentage",20)

  factory.define("ticketFactDiscount", Ticket)
  .assocAfter("Discount","discountFact") //In this case no options is required
```
##### Usage

```javascript
factory.create("salesmanFact");
```

When using ``assocAfter`` the main model (Ticket) will be created first, this way we have the ticket id(For definition 23). After its creation the associated model(Discount) will be created using the factoryName(discountFact) and setting the id of the created ticket using the foreignKey(ticket_key) adding `{ticket_key:23}` to the options object.  Since no options are passed it will use the values defined in the first factory. Creating a ticket associated to a discount.

##### Passing options
To pass options for this association the key used must be the *as* string used in the factory definition. The value must be an object to overwrite the default. In this case you can **not** use an **id** as options, since the associated model, if already created, must be related to another model.
```javascript
factory.create("ticketFactDiscount",{seat:"1B",Credit:{percentage:50}})
```
Creates a ticket with seat 1B. Then using the id of the ticket created creates a discount with factory discountFact passing the options ``{percentage:50,ticket_key:X}`` where ``X`` is the id of the created ticket.

#### HasMany Associations
``assocManyAfter`` works for 1 - n associations. This is can be used in case the associated model **requires** the current model for its creation.

``.assocManyAfter(as, factoryName, optionsArray)``
- *as*: A String which references the as value to refer to the associated model. In case there is no as defined, the associated model **in its plural form** will work.
- *factoryName*: The default name of the factory used to create the associated model. Can be overwritten in options using the key *_factoryName*.
- *optionsArray*: An array of **Options object** (Using an id as option is not supported in this association). Each element of this array will trigger a creation of one associated model. This elements can use the options explored before. If a value passed is ``{}`` it will imply a creation without passing any options. Options might also be an object instead of an array, indicating de number of elements to create and the default options for each creation.

```javascript
  Ticket.belongsTo(Sale, {
    foreignKey: 'sale_key'
  }),
  Sale.hasMany(Ticket, {
    foreignKey: 'sale_key'
  })
```

```javascript
  factory.define("saleFactWithTickets", Sale)
  .attr("total",120)
  .assocManyAfter("Tickets","ticketFactNoSale",[{price:120/2},{price:120/2}])

  factory.define("ticketFactNoSale", Ticket)
```
##### Usage

It works just as *assocAfter* but passing an array of options as illustrated in *asscoMany*, but in this case **ids** can **not** be passed in the array.

```javascript
factory.create("saleFactWithTickets",{Tickets:[{seat:"1A"},{seat:"1B"}]})
```
When using ``assocManyAfter`` the first model (Sale) will be created first, this way we have the sale id(For instace 4). After its creation the associeated models(Ticket) will be created using the factoryName(ticketFactNoSale) and setting the id of the created ticket using the foreignKey(sale_key) adding `{sale_key:4}` to the options object in each creation. Hence, the creation options for the first ticket will be `{seat:"1A",sale_key:4}` and for the second `{seat:"1B",sale_key:4}`. Creating two tickets associated with the same sale.

#### Reusing models
When defining a factory or setting the options, you might want to use a model already created during this process.
##### Definition
Using the ``$`` symbol you can set a name for the model already created ``{$:name}``, and use the name to refer to it ``{key:'$name.attribute'}``.

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
  factory.define("passengerFact", Passenger)
  .attr("name",faker.name.firstName) //Use faker to create a random name

  factory.define("ticketFactPassengerNoSale", Ticket)
  .assoc("Passenger","passengerFact")

  factory.define("saleFactWithTicketsAndPassenger", Sale)
  .attr("total",120)
  .assocManyAfter("Ticket","ticketFactNoSale",
  [{$:"ticketOne"},{Passenger:"$ticketOne.passenger_key"}])

  /**
  * You can also use the foreignKey, but beware that the defined model in the assoc will be
  * created even if it is overwritten by the key. In the previous example the new model
  * is not created since the association is overwritten.
  **/

  factory.define("saleFactWithTicketsAndPassenger", Sale)
  .attr("total",120)
  .assocManyAfter("Ticket","ticketFactNoSale",
  [{$:"ticketOne"},{passenger_key:"$ticketOne.passenger_key"}])

  /**
  * The save option '$' can also be used when using _size.
  * in this case the each saved model will use the $ value as prefix adding
  * a number starting in 0.
  **/

  factory.define("saleFactWithTicketsSaved", Sale)
  .attr("total",120)
  .assocManyAfter("Ticket","ticketFactNoSale",{_size:2,$:"ticket-"})
```

By setting ``{$:"ticketOne"}`` we can refer to such ticket in the creation of the second ticket, to use his passenger and link both tickets to the same passenger.

Saved models can be used when defining attributes or options. A string must be used as value, such string must start with ``$`` followed by the name of the saved definition. Afterwards, the definition can be used to obtain an attribute or call a synchronus function defined in your model.

The definitions are saved right after they are created. Hence, make sure the definition is already created when using it.

In order to refer to the main model created we can use ``$root``, this is a reserved name for this model.

By using ``$root`` we are able to refer to the sale total, and use it to set the price of each ticket.

All the saved models will be returned in the created object inside the attriute ``$``.

```javascript
  factory.create("saleFactWithTicketsAndPassenger", {total: faker.random.number, Ticket:[{price:'$root.total'/2},{price:'$root.total'/2}]})
  .then((createdSale) => {
    // createdSale.$ = {
    //   passangerName: //The passenger model created
    // }
  })

  factory.create("saleFactWithTicketsSaved")
  .then((createdSale) => {
    //cratedSale.$ will contain the keys ticket-0 and ticket-1 with the saved tickets
  })
```

#### InfinteLoops
When defining and using factories it is **important** to verify no loops are crated. Since this will take the creation into an **infinite loop**.

Example of definition **with loops**
```javascript
factory.define("salesmanWithStores", Salesman)
.assocMany("Store","storeWithSalesman",[{}])

factory.define("storeWithSalesman", Salesman)
.assocMany("Store","salesmanWithStores",[{}])
```

```javascript
factory.create("salesmanWithStores"); //Infinite loop
```
Since the factory *salesmanWithStores* creates a store using the factory *storeWithSalemsman*, which creates a sale using this same factory *salesmanWithStores*, each creation will create one of the other. Hence, this function will never return.

### Extra configurations
Configuration file ``config/factory.js``
#### Loading factories
#### Unique
When using the same factory more than one time the models creation might **fail** due to uniqueness issues. This is why we advise you to use **faker** when defining unique attributes. Even by using random data, it can fail by chance. To avoid such errors the creation of a model can be **retried** in case of uniqueness error. The number of times the creation will be retried can be configured in this file, adding ``{creationRetries: times }``, where ``times`` is a number. The default value is **1**.
#### Populated Object
The object returned after the creation will be populated, in order to refer to its values and associations during tests. To set the depth of this population use the parameter ``{populationDepth: depth }``, where ``depth`` indicates how many times the nested models associations will be populated. The default value is **3**. Note that when having **circular references**, the returned object will be highly populated so we advise you not to use big numbers in this configuration.
