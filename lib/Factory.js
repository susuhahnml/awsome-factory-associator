const path = require('path');
const require_tree = require('require-tree');
const Instance = require('./Instance');

class Factory {
  constructor() {
    this.definitions = {};
    for (const method of ['build', 'create']) {
      Factory.prototype[method] = (name, options, cb) => {
        const instance = this.createInstanceFromTemplate(name, options);

        if (!instance) {
          throw new Error('Factory not found');
        }
        return instance[method](cb);
      };
    }
  }

  static defaultFolder() {
    return path.join(process.cwd(), 'test', 'factories');
  }

  define(name, model) {
    this.definitions[name] = new Instance(this, name, model);
    return this.definitions[name];
  }

  createInstanceFromTemplate(name, options) {
    if (!this.definitions[name]) {
      throw new Error('No factory defined for name ' + name);
    }

    const instanceCopy = new Instance(this.definitions[name]);

    for (const attrib in options) {
      instanceCopy.attr(attrib, options[attrib]);
    }
    return instanceCopy;
  }

  load(folder) {
    folder = folder? folder: Factory.defaultFolder();
    const definitions = require_tree(folder);

    for (const index in definitions) {
      definitions[index](this);
    }
  }
}

module.exports = Factory;
