import {Sequelize} from 'sequelize-typescript'
import Mqtt from 'mqtt'
import Models from '@db/models'

var sequelize = new Sequelize({
    database: 'base',
    username: 'admin',
    password: 'Datait2024!',

    host: '127.0.0.1',
    port: 3306,
    dialect: 'mariadb',
    models: Models,
})

var mqtt = Mqtt.connect('mqtt://localhost:1883',{
    username: 'admin',
    password: 'Datait2024!',
    clientId: 'api_' + Math.random().toString(16).substr(2,8),
    clean: true,
    connectTimeout: 4000,
    reconnectPeriod: 1000,

})

export {sequelize, mqtt}