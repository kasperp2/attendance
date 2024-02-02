import {sequelize} from './connection'

await sequelize.sync({ force: true });
