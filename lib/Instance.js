const Promise = require('bluebird');
const Collection = require('./Collection');

class Instance {

  constructor(factory, name, model) {
    const creatingFromCopy = factory instanceof Instance;

    if (creatingFromCopy) {
      const options = name;
      const templateInstance = factory;

      this.autoIncrement = templateInstance.autoIncrement;
      this.templateInstance = templateInstance.factory;
      this.name = templateInstance.name;
      this.model = templateInstance.model;
      this.setConfigFromInstance(templateInstance);
    } else {
      this.autoIncrement = {};
      this.factory = factory;
      this.name = name;
      this.setNewConfig();
      if (model) {
        //Mabe add error
        this.model = model;
      }
    }
  }

  setNewConfig(){
    this.config = {
      attr: {},
      assoc: {},
      assocMany: {},
      assocAfter: {},
      assocManyAfter: {}
    }
  }

  setConfigFromInstance(instance){
    this.config = _.cloneDeep(instance.config);
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
    if (options && options.auto_increment) {
      this.autoIncrement[name] = new Collection(options.auto_increment);
    }
    this.config.attr[name] = value;
    return this;
  }

  getCreationData() {
    const json = {};
    let value;

    for (const attrib in this.config.attr) {
      if (typeof this.config.attr[attrib] === 'function') {
        value = this.config.attr[attrib]();
      } else {
        value = this.config.attr[attrib];
      }
      if (this.autoIncrement[attrib]) {
        json[attrib] = this.autoIncrement[attrib].update(value);
      } else {
        json[attrib] = value;
      }
    }
    return json;
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
