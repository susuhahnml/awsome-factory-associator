const Promise = require('bluebird');
const Collection = require('./Collection');

function clone(object) {
  if (object instanceof Collection) {
    return object;
  } else if (typeof object == 'object') {
    const objectConed = {};

    for (const key in object) {
      objectConed[key] = clone(object[key]);
    }
    return objectConed;
  } else {
    return object;
  }

}

function getIfSavedAtttribute(saved, phrase) {
  const isASavedPhrase = typeof phrase == 'string' && phrase.charAt(0)=='$';

  if (!isASavedPhrase) {
    return phrase;
  }
  const cleanPhras = phrase.slice(1);
  const splited = cleanPhras.split('.');
  const savedAs = splited[0];
  const savedModel = saved[savedAs];

  if (!savedModel) {
    throw new Error('No instance saved with name '+ savedAs);
  }

  let finalValue = savedModel;
  const regexp = /([^\(\)]+)(\(.*\)$)?/;

  try {
    for (let i = 1; i<splited.length;i++) {
      const match = regexp.exec(splited[i]);

      if (!match) {
        throw new Error('Sintaxis error in phrase ' + phrase);
      }
      finalValue = finalValue[match[1]];
      const isFunctionCall = match[2] != undefined;

      if (isFunctionCall) {
        if (!finalValue) {
          throw new Error('Invalid function name ' + match[1]);
        }
        const args = match[2].slice(1, -1).split(',');

        finalValue = finalValue.apply(null, args);
      }
    }
  } catch (err) {
    throw new Error('Error while obtaining value from saved object using phrase ' + phrase);
  }

  return finalValue;

}

function getValidFinalFactoryName(definition, options) {
  const factoryNameInOptions = typeof options == 'object'?options._factoryName:undefined;
  const factoryNameInDefinition = definition?definition.factoryName:undefined;
  const finalFactoryName = factoryNameInOptions || factoryNameInDefinition;

  if (!finalFactoryName) {
    throw new Error('A valid factory name should be provided for association in factory ');
  }

  if (factoryNameInOptions) {
    delete options._factoryName;
  }
  return finalFactoryName;
}


function getArrayOfOptionsFromObject(object) {
  if (typeof object._size!='number') {
    throw new Error('A valid size must be provided with the key _size');
  }
  let size = object._size;
  const arrayOptions = [];

  delete object._size;

  while (size) {
    arrayOptions.push(object);
    size-- ;
  }

  return arrayOptions;
}

//Quiza en factory
function generateFromOptionsObject(method, factory, optionsObject, associationDefinition, saved) {
  //Allow options using saved
  optionsObject = getIfSavedAtttribute(saved, optionsObject);

  //Allow creation by id
  const assingedById = typeof optionsObject === 'number';

  if (assingedById) {
    return Promise.resolve(optionsObject);
  }

  //Create from object
  //TODO add to a promise wraper
  factoryName = getValidFinalFactoryName(associationDefinition, optionsObject);

  const instance = factory.createInstanceFromTemplate(factoryName, optionsObject);

  return instance[method](saved)
    .then((modelAssociated) => {
      return modelAssociated.id;
    });
}

class Instance {

  constructor(factory, name, model) {
    const creatingFromCopy = factory instanceof Instance;

    if (creatingFromCopy) {
      const templateInstance = factory;

      this.factory = templateInstance.factory;
      this.name = templateInstance.name;
      this.model = templateInstance.model;
      this.setConfigFromInstance(templateInstance);
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

  setConfigFromInstance(instance) {
    this.config = clone(instance.config);
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
      const value = getIfSavedAtttribute(saved, this.config.attr[attrib]);

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
    const associationDefinition = this.model.associations[as];

    if (!associationDefinition) {
      throw new Error('No association defined with name ' + as + ' in factory ' + this.name + ' definition');
    }

    if (type && associationDefinition.associationType != type) {
      throw new Error('Invalid association type  '+ associationDefinition.associationType +' for ' + as + ' in factory ' + this.name + ' definition. Make sure you are using the correct option');
    }

    return associationDefinition;
  }

  setCorrespondingAssociation(as, options) {
    const associationDefinition = this.getValidAssociation(as);

    switch (associationDefinition.associationType) {
    case 'BelongsTo':
      this.assoc(as, null, options, associationDefinition);
      break;
    case 'BelongsToMany':
      this.assocMany(as, null, options, associationDefinition);
      break;
    default:
      throw new Error('No valid association type found for ' + associationDefinition.associationType);

    }

    return associationDefinition;
  }

  generateBelongsTo(method, saved) {
    const ids = {};


    return new Promise.map(_.values(this.config.assoc), (belongsToConfig) => {

      return generateFromOptionsObject(method, this.factory, belongsToConfig.options, belongsToConfig, saved)
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
    //     return generateFromOptionsObject(method, this.factory, optionsObject, belongsToManyConfig, saved);
    //   })
    //     .then((associatedModelsIds) => {
    //       return createdModel['set'+belongsToManyConfig.as+'s'](associatedModelsIds);//TODO en modelo debe de estar distinto el nombre para saber el plural
    //     });
    // });
  }

  /**
  * Used in definition
  */

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

  assoc(as, factoryName, options, associationDefinition) {
    associationDefinition = associationDefinition || this.getValidAssociation(as, 'BelongsTo');
    const factory=factoryName || (this.config.assoc[as]?this.config.assoc[as].factoryName:null);

    this.config.assoc[as] = {
      factoryName: factory,
      options: options,
      foreignKey: associationDefinition.foreignKey,
      as: as
    };
    return this;
  }

  assocMany(as, factoryName, optionsArray, associationDefinition) {
    associationDefinition = associationDefinition || this.getValidAssociation(as, 'BelongsToMany');
    const factory=factoryName || (this.config.assocMany[as]?this.config.assocMany[as].factoryName:null);

    this.config.assocMany[as] = {
      factoryName: factory,
      options: optionsArray,
      as: as,
      plural: associationDefinition.options.name.plural
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
              all: true
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

module.exports = Instance;
