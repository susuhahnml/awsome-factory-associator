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
      user: 'Susana',
      port: 5432,
      database: 'factory_associatior',
      password: '',
      dialect: 'postgres',
      options: {
        dialect: 'postgres',
        host: 'localhost',
        port: 5432
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
    done();
  });
});

after((done) => {
  sails.lower(done);
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
