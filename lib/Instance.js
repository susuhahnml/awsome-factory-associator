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
  const savedInstance = saved[savedAs];

  if (!savedInstance) {
    throw new Error('No instance saved with name '+ savedAs);
  }

  let finalValue = savedInstance;
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

  getValidFinalFactoryName(as, factoryName, options) {
    const oldDefiniiton = this.config.assoc[as];
    const factoryNameInOptions = typeof options == 'object'?options._factoryName:undefined;
    const factoryNameInDefinition = oldDefiniiton?oldDefiniiton.factoryName:undefined;
    const finalFactoryName = factoryNameInOptions || factoryName || factoryNameInDefinition;

    if (!finalFactoryName) {
      throw new Error('A valid factory name should be provided for association in factory ' + this.name);
    }

    if (factoryNameInOptions) {
      delete options._factoryName;
    }
    return finalFactoryName;
  }

  setCorrespondingAssociation(as, options) {
    const associationDefinition = this.getValidAssociation(as);

    switch (associationDefinition.associationType) {
    case 'BelongsTo':
      this.assoc(as, null, options);
      break;
    default:
      throw new Error('No valid association type found for ' + associationDefinition.associationType);

    }

    return associationDefinition;
  }

  belongsToInstances(method, saved) {
    const ids = {};


    return new Promise.map(_.values(this.config.assoc), (belongsToConfig) => {

      //Allow options using saved
      belongsToConfig.options = getIfSavedAtttribute(saved, belongsToConfig.options);
      const assingedById = typeof belongsToConfig.options === 'number';


      if (assingedById) {
        ids[belongsToConfig.foreignKey] = belongsToConfig.options;
        return null;
      }
      //Chack other cases
      const instance = this.factory.createInstanceFromTemplate(belongsToConfig.factoryName, belongsToConfig.options);

      return instance[method](saved)
        .then((instanceAssociated) => {
          ids[belongsToConfig.foreignKey] = instanceAssociated.id;
          return null;
        });
    })
      .then(() => {
        return ids;
      });
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
    factoryName = this.getValidFinalFactoryName(as, factoryName, options);
    this.config.assoc[as] = {
      factoryName: factoryName,
      options: options,
      foreignKey: associationDefinition.foreignKey,
    };
    return this;
  }


  create(saved) {
    const isRootCreation = !saved;

    if (isRootCreation) {
      saved = {};
    }
    return this.belongsToInstances('create', saved)
      .then((idsBelongsTo) => {
        const creationData = this.getCreationData(saved);

        _.defaults(creationData, idsBelongsTo);
        return this.model.create(creationData);
      })
      .then((createdInstance) => {
        return createdInstance.reload({
          include: [
            {
              all: true
            }
          ]
        });
      })
      .then((instancePopulated) => {
        if (this.saveAs) {
          saved[this.saveAs] = instancePopulated;
        }
        if (isRootCreation) {
          saved.root = instancePopulated;
          instancePopulated.$ = saved;
        }
        return instancePopulated;
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
