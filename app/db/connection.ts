import {Sequelize} from 'sequelize-typescript'
import Mqtt from 'mqtt'
import Models from '@db/models'
import { Dialect } from 'sequelize'

const sequelize = new Sequelize({
    database: process.env.DB_NAME,
    username: process.env.DB_USER,
    password: process.env.DB_PASS,

    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT as string),
    dialect: process.env.DB_DIALECT as Dialect,
    models: Models,

    logging: false
})

const mqtt = Mqtt.connect(`mqtt://${process.env.MQTT_HOST}:${process.env.MQTT_PORT}`,{
    username: process.env.MQTT_USER,
    password: process.env.MQTT_PASS,
    clientId: 'api_' + Math.random().toString(16).substr(2,8),
    clean: true,
    connectTimeout: 4000,
    reconnectPeriod: 1000,

})

export {sequelize, mqtt}