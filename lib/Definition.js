const Promise = require('bluebird');
const Collection = require('./Collection');
const utils = require('./utils');

class Definition {

  constructor(factory, name, model) {
    const creatingFromCopy = factory instanceof Definition;

    if (creatingFromCopy) {
      const templateDefinition = factory;

      this.factory = templateDefinition.factory;
      this.name = templateDefinition.name;
      this.model = templateDefinition.model;
      this.setConfigFromDefinition(templateDefinition);
    } else {
      this.factory = factory;
      this.name = name;
      this.setNewConfig();
      if (model) {
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

  setConfigFromDefinition(definition) {
    this.config = utils.clone(definition.config);
  }

  addOptionsToConfig(options) {
    if (!this.model) {
      throw new Error('No model defined for factory ' + this.name + '. Make sure to pass a valid model as second parameter in definition');
    }
    for (const attributeName in options) {
      const isAttibute = this.model.attributes[attributeName];
      const value = options[attributeName];
      const isSave = attributeName == '$';

      if (isAttibute) {
        this.attr(attributeName, value);
      } else if (isSave) {
        this.saveAs = value;
        delete options[attributeName];
      } else {
        this.setCorrespondingAssociation(attributeName, value);
      }
    }
  }

  getCreationData(saved) {
    const json = {};

    for (const attrib in this.config.attr) {
      const value = utils.getIfSavedAtttribute(saved, this.config.attr[attrib]);

      if (value instanceof Collection) {
        json[attrib] = value.getNext();
      } else if (typeof value === 'function') {
        json[attrib] = value();
      } else {
        json[attrib] = value;
      }
    }
    return json;
  }

  getValidAssociation(as, type) {
    if (!this.model) {
      throw new Error('No model defined for factory ' + this.name + '. Make sure to pass a valid model as second parameter in definition');
    }
    const associationSequelizeOptions = this.model.associations[as];

    if (!associationSequelizeOptions) {
      throw new Error('No association defined with name ' + as + ' in factory ' + this.name + ' definition');
    }

    if (type && associationSequelizeOptions.associationType != type) {
      throw new Error('Invalid association type  '+ associationSequelizeOptions.associationType +' for ' + as + ' in factory ' + this.name + ' definition. Make sure you are using the correct option');
    }

    return associationSequelizeOptions;
  }

  setCorrespondingAssociation(as, options) {
    const associationSequelizeOptions = this.getValidAssociation(as);

    switch (associationSequelizeOptions.associationType) {
    case 'BelongsTo':
      this.assoc(as, null, options, associationSequelizeOptions);
      break;
    case 'BelongsToMany':
      this.assocMany(as, null, options, associationSequelizeOptions);
      break;
    default:
      throw new Error('No valid association type found for ' + associationSequelizeOptions.associationType);

    }

    return associationSequelizeOptions;
  }

  generateBelongsTo(method, saved) {
    const ids = {};


    return new Promise.map(_.values(this.config.assoc), (belongsToConfig) => {

      return utils.generateFromOptionsObject(method, this.factory, belongsToConfig.options, belongsToConfig, saved)
        .then((idAssociatedModel) => {
          ids[belongsToConfig.foreignKey] = idAssociatedModel;
          return;
        });
    })
      .then(() => {
        return ids;
      });
  }

  generateBelongsToMany(method, createdModel, saved) {
    return new Promise((resolve) => {return resolve(null);});
    // return new Promise.map(_.values(this.config.assocMany), (belongsToManyConfig) => {
    //
    //
    //   if (!isArray(belongsToManyConfig.options)) {
    //     belongsToManyConfig.options = getArrayOfOptionsFromObject(belongsToManyConfig.options);
    //   }
    //
    //   return Promise.map(belongsToManyConfig.options, (optionsObject) => {
    //     return utils.generateFromOptionsObject(method, this.factory, optionsObject, belongsToManyConfig, saved);
    //   })
    //     .then((associatedModelsIds) => {
    //       return createdModel['set'+belongsToManyConfig.as+'s'](associatedModelsIds);//TODO en modelo debe de estar distinto el nombre para saber el plural
    //     });
    // });
  }

  /**
  * Used in definition
  */

  parent(parentDefinition) {
    parentDefinition = this.factory.definitions[parentDefinition];
    if (!parentDefinition) {
      throw new Error('No factory defined for name ' + name + ' of parent');
    }
    this.autoIncrement = parentDefinition.autoIncrement;
    this.model = parentDefinition.model;

    this.setConfigFromDefinition(parentDefinition);
    return this;
  }


  attr(name, value, options) {
    const isAutoIncrement = options && options.auto_increment;

    if (isAutoIncrement) {
      const collection = new Collection(value, options.auto_increment);

      this.config.attr[name] = collection;
    } else {
      this.config.attr[name] = value;
    }
    return this;
  }

  assoc(as, factoryName, options, associationSequelizeOptions) {
    associationSequelizeOptions = associationSequelizeOptions || this.getValidAssociation(as, 'BelongsTo');
    const factory=factoryName || (this.config.assoc[as]?this.config.assoc[as].factoryName:null);

    this.config.assoc[as] = {
      factoryName: factory,
      options: options,
      foreignKey: associationSequelizeOptions.foreignKey,
      as: as
    };
    return this;
  }

  assocMany(as, factoryName, optionsArray, associationSequelizeOptions) {
    associationSequelizeOptions = associationSequelizeOptions || this.getValidAssociation(as, 'BelongsToMany');
    const factory=factoryName || (this.config.assocMany[as]?this.config.assocMany[as].factoryName:null);

    this.config.assocMany[as] = {
      factoryName: factory,
      options: optionsArray,
      as: as,
      plural: associationSequelizeOptions.options.name.plural
    };
    return this;
  }


  create(saved) {
    const isRootCreation = !saved;
    let createdModel;

    if (isRootCreation) {
      saved = {};
    }
    return this.generateBelongsTo('create', saved)
      .then((idsBelongsTo) => {
        const creationData = this.getCreationData(saved);

        _.defaults(creationData, idsBelongsTo);
        return this.model.create(creationData);
      })
      .then((created) => {
        createdModel = created;
        return this.generateBelongsToMany('create', createdModel, saved);
      })
      .then(() => {
        return createdModel.reload({
          include: [
            {
              all: true,
              required: false
            }
          ]
        });
      })
      .then((modelPopulated) => {
        if (this.saveAs) {
          saved[this.saveAs] = modelPopulated;
        }
        if (isRootCreation) {
          saved.root = modelPopulated;
          modelPopulated.$ = saved;
        }
        return modelPopulated;
      });
  }

  build() {
    if (!this.model) {
      throw new Error('No model defined for factory ' + this.name + '. Make sure to pass a valid model as second parameter in definition');
    }

    const json = this.getCreationData();

    return new Promise((resolve) => {
      return resolve(this.model.build(json));
    });
  }
}

module.exports = Definition;
