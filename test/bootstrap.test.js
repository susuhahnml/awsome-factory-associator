const sails = require('sails');
const each = require('lodash/forEach');
const includes = require('lodash/includes');
const Promise = require('bluebird');

const sailsrc = {
  environment: 'test',
  hooks: {
    orm: false,
    blueprints: false,
    pubsub: false,
    grunt: false,
  },
  log:{
    level: 'silent'
  },
  connections: {
    testConnection: {
      user: process.env.USER || 'Susana',
      port: process.env.PORT || 5432,
      database: process.env.DB || 'factory_associatior',
      password: process.env.PSSWD || '',
      dialect: process.env.DIALECT || 'postgres',
      options: {
        dialect: process.env.DIALECT || 'postgres',
        host: process.env.HOST || 'localhost',
        port: process.env.PORT || 5432
      }
    }
  },
  port: 1451,
  models: {
    connection: 'testConnection',
    migrate: 'drop'
  },
}

before((done) => {
  if(process.env.DBUSER){
    sailsrc.connections.testConnection.user = process.env.DBUSER;
  }
  if(process.env.PSSWD){
    sailsrc.connections.testConnection.password = process.env.PSSWD;
  }
  if(process.env.DB){
    sailsrc.connections.testConnection.database = process.env.DB;
  }
  sails.lift(sailsrc, (err, sails) => {
    if(err){
      return done(err);
    }
    global.factory = require('../index.js');
    factory.load();
    done();
  });
});

after((done) => {
  done();
  sails.lower(process.exit);
});

beforeEach(() => {
  let models = [];
  for (let model in sails.models){
    models.push(sails.models[model]);
  }
  return Promise.map(models, (model) => {
    return model.destroy({where: {}, force:true});
  });
});



/**
* Litern tests
*/
const glob = require('glob');
const CLIEngine = require('eslint').CLIEngine;
const testModule = process.env.MODULE || '*';
const linterPath = ['lib'].includes(testModule)
  ? testModule + '/'
  : '/**/' + testModule;
const paths = glob.sync('./+(api|lib)/' + linterPath + '*.js');
const engine = new CLIEngine({
  envs: ['node'],
  useEslintrc: true
});

describe('Linting on ' + testModule, () => {
  before(function() {
    if (process.env.NO_LINTER == 'true') {
      this.skip();
    }
  });

  function generateTest(result) {
    const {filePath, messages} = result;
    const project = 'awsome-factory-associatior';
    const realPathIndex = filePath.indexOf(project);
    const realPath = filePath.substring(realPathIndex + project.length);

    it(`passes ${realPath}`, function() {
      if (messages.length > 0) {
        const errors = messages.map((message) => {
          return message.line +
          ':' +
          message.column +
          ' ' +
          message.message.slice(0, -1) +
          ' - ' +
          message.ruleId +
          '\n';
        });
        const throwable = '\n' + errors.join('');

        throw new Error(throwable);
      }
    });
  }
  const results = engine.executeOnFiles(paths).results;

  results.forEach((result) => generateTest(result));
});
