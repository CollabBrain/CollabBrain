import fs from 'fs';
import path from 'path';
import { Sequelize, DataTypes } from 'sequelize';
import process from 'process';

const basename = path.basename(__filename);
const env = process.env.NODE_ENV || 'development';
const configPath = path.join(__dirname, '/../config/config.json');
const config = require(configPath)[env];

const db: any = {};

let sequelize: Sequelize;
if (config.use_env_variable) {
  sequelize = new Sequelize(process.env[config.use_env_variable] as string, config);
} else {
  sequelize = new Sequelize(config.database, config.username, config.password, config);
}

fs
  .readdirSync(__dirname)
  .filter(file => {
    return (
      file.indexOf('.') !== 0 &&
      file !== basename &&
      (file.slice(-3) === '.ts' || file.slice(-3) === '.js') &&
      file.indexOf('.test.ts') === -1 &&
      file.indexOf('.test.js') === -1
    );
  })
  .forEach(file => {
    // Handling dynamic import for both CommonJS (.js) and ES6 Modules (.ts)
    const modelDefiner = require(path.join(__dirname, file)).default || require(path.join(__dirname, file));
    if (typeof modelDefiner === 'function') {
      const model = modelDefiner(sequelize, DataTypes);
      if (model && model.name) {
        db[model.name] = model;
      }
    }
  });

Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

export default db;
