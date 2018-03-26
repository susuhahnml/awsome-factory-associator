const Promise = require('bluebird');
const Collection = require('./Collection');

class Instance {

  constructor(factory, name, model) {
    const creatingFromCopy = factory instanceof Instance;

    if (creatingFromCopy) {
      const optons = name;
      const templateInstance = factory;

      this.templateInstance = templateInstance.factory;
      this.name = templateInstance.name;
      this.model = templateInstance.model;
      this.setConfigFromInstance(templateInstance);
    } else {
      this.factory = factory;
      this.name = name;
      this.setNewConfig();
      if (model) {
        //Mabe add error
        this.model = model;
      }
    }
  }

  setNewConfig() {
    this.config = {
      attr: {},
      assoc: {},
      assocMany: {},
      assocAfter: {},
      assocManyAfter: {}
    };
  }

  setConfigFromInstance(instance) {
    this.config = {};
    for (const optionKey in instance.config) {
      this.config[optionKey] = Object.assign(instance.config[optionKey]);
    }
  }

  addOptionsToConfig(options) {
    //Buscar cada atributo si es unn assoc o attr o asociacion
    for (const attributeName in options) {
      this.attr(attributeName, options[attributeName]);
    }
  }

  getCreationData() {
    const json = {};

    for (const attrib in this.config.attr) {
      if (this.config.attr[attrib] instanceof Collection) {
        json[attrib] = this.config.attr[attrib].getNext();
      } else if (typeof this.config.attr[attrib] === 'function') {
        json[attrib] = this.config.attr[attrib]();
      } else {
        json[attrib] = this.config.attr[attrib];
      }
    }
    return json;
  }


  create(cb) {
    //Add all submodels creations
    const json = this.getCreationData();

    return this.model.create(json).asCallback(cb);
  }

  build(cb) {
    const json = this.getCreationData();

    return new Promise((resolve) => {
      return resolve(this.model.build(json));
    }).asCallback(cb);
  }

  attr(name, value, options) {
    const isAutoIncrement = options && options.auto_increment;

    if (isAutoIncrement) {
      // this.config.attr[name] = new Collection(value, options.auto_increment);
      const collection = new Collection(value, options.auto_increment);

      this.config.attr[name] = collection;
    } else {
      this.config.attr[name] = value;
    }
    return this;
  }

  parent(parentInstance) {
    parentInstance = this.factory.definitions[parentInstance];
    if (!parentInstance) {
      throw new Error('No factory defined for name ' + name + ' of parent');
    }
    this.autoIncrement = parentInstance.autoIncrement;
    this.model = parentInstance.model;

    this.setConfigFromInstance(parentInstance);
    return this;
  }
}

module.exports = Instance;
