const path = require('path');
const require_tree = require('require-tree');
const Definition = require('./Definition');

class Factory {
  constructor() {
    this.definitions = {};
    for (const method of ['build', 'create']) {
      Factory.prototype[method] = (name, options) => {
        const definition = this.createDefinitionFromTemplate(name, options);

        return definition[method]();
      };
    }
  }

  static defaultFolder() {
    return path.join(process.cwd(), 'test', 'factories');
  }

  define(name, model) {
    if (this.definitions[name]) {
      throw new Error('Factory name ' + name + ' already used');
    }
    this.definitions[name] = new Definition(this, name, model);
    return this.definitions[name];
  }

  createDefinitionFromTemplate(name, options) {
    if (!this.definitions[name]) {
      throw new Error('No factory defined for name ' + name);
    }

    const definitionCopy = new Definition(this.definitions[name]);

    definitionCopy.addOptionsToConfig(options);
    return definitionCopy;
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
