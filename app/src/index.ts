import { Op } from "sequelize"
import { Elysia, t } from "elysia"
import { cors } from '@elysiajs/cors'
import { sequelize, mqtt } from "@db/connection"
import User from '@db/models/User'
import Name from '@db/models/Name'
import Attendance from '@db/models/Attendance'

mqtt.on('connect', () => {
    mqtt.subscribe('api/test')
    mqtt.subscribe('esp32/attendant')
    mqtt.subscribe('esp32/name/card/confirm')
})

mqtt.on('message', async (topic, message) => {
    console.log(message.toString())

    switch (topic) {
        case 'esp32/attendant':
            let nameId = message.toString()
            let name = (await Name.findByPk(nameId))
            if (!name) return
            const oldAttendance = await Attendance.findOne({  
                where: {
                    [Op.and]: [
                        { name_id: nameId },
                        // WHERE (DATE(createdAt) = DATE(NOW()))
                        { where: 
                            sequelize.where(
                                sequelize.fn('DATE', sequelize.col('createdAt')), 
                                sequelize.fn('DATE', sequelize.fn('NOW'))
                            )
                        }
                    ]
                }
            })
            if (oldAttendance) return

            const attendance = await Attendance.create({ name_id: nameId })
            
            const result = JSON.stringify({ action:'attendant', data: attendance })
            server.server?.publish('attendance', result)

            senseHat('user_accepted');
        break;

        case 'esp32/name/card/confirm':
            const cardNameId = message.toString()
            const cardName = (await Name.findByPk(cardNameId))

            await cardName?.update({ card_assigned: true });

            const cardResult = JSON.stringify({ action: 'card/confirm', data: true })
            server.server?.publish('card/confirm', cardResult)
        break;
    }    
})

const user = new Elysia({prefix: '/user'})
    .post('/login', async ({ body }) => {
        let user = await User.findOne({
            where: {username: body.username,password: body.password }
        })

        if(!user){
            return 'bitch'
        }

        user.token = Math.random().toString(36).substr(2)
        user.save()

        return user
    }, {
        body: t.Object({
            username: t.String(),
            password: t.String() 
        })
    })
    .post('/login-token', async ({ body }) => {
        let user = await User.findOne({where:{ token: body.token}})

        if(!user){
            return 'bitch'
        }

        return user
    }, {
        body: t.Object({
            token: t.String()
        })
    })


const attendance = new Elysia({prefix: '/attendance'})
    .ws('/', {
        body: t.Object({
            action: t.String(),
            data: t.String(),
        }),
        message(ws, {action, data }) {
        },
        open(ws){
            ws.subscribe('attendance')
            ws.subscribe('card/confirm')
        },
        close(ws){
            ws.unsubscribe('attendance')
        }
    })
    .get('/get/:date', async ({ params: { date }}) => {
        return await Attendance.findAll({ where: 
            sequelize.where(
                sequelize.fn('DATE', sequelize.col('createdAt')), 
                date
            )
        })
    })


const name = new Elysia({prefix: '/name'})
    .get('/get', async () => {
        return await Name.findAll()
    })
    .get('create/:name', async ({ params: { name }}) => {
        // urldecode
        name = decodeURIComponent(name)
        const newName = await Name.create({ name })
        return newName
    })
    .get('write/:uuid', async ({ params: { uuid }}) => {
        mqtt.publish('api/name/create', uuid)
        return true  
    })
    .get('remove/:nameId', async ({ params: { nameId }}) => {
        // urldecode
        nameId = decodeURIComponent(nameId)
        const removeName = await Name.destroy({ where: {id: nameId} })
        const removeAttendance = await Attendance.destroy({ where: {name_id: nameId}})
        return removeName
    })

const test = new Elysia({prefix: '/test'})
    .get('/set-name', async () => {
        const jane = await Name.create({ name: "Jane" });
        console.log(jane.id);
        return true
    })
    .get('/set-user', async () => {
        const jane = await User.create({ username: "admin", password: "admin" });
        console.log(jane.id);
        return true
    })
    .get('/mqtt', async () => {
        mqtt.publish('api/test', 'hello world')
        mqtt.publish('esp32/output', 'on')
        return true
    })
    .get('/mqtt/:text', ({ params: { text }}) => {
        mqtt.publish('esp32/output', text)
        return true
    })

const sense = new Elysia({prefix: '/sense'})
    .get('/clear', async () => senseHat('clear'))
    .get('/show_message/:v', ({ params: { v }}) => senseHat('show_message', v))
    .ws('/', {
        body: t.Object({
            action: t.String(),
            data: t.Any()
        }),
        message(ws, { action, data }) {
            switch (action) {
                case 'set_pixel':
                    senseHat('set_pixel', data.join('-'), true).then(pixels => ws.publish('pixels', pixels))
                    break;
                
                case 'clear':
                    senseHat('clear', false, true).then(pixels => ws.publish('pixels', pixels))
                    break;
                default:
                    break;
            }
        },
        open(ws){
            ws.subscribe('pixels')

            senseHat('get_pixels', false, true).then(pixels => ws.send(pixels))
        },
        close(ws){
            ws.unsubscribe('pixels')
        }
    })

const server = new Elysia({
        websocket: {
            idleTimeout: 30
        }
    })
    .use(cors({origin : /.*/}))
    .use(user)
    .use(attendance)
    .use(name)
    .use(sense)
    .use(test)
    .listen(3000)


async function senseHat(f : String, v : any = '', r: boolean = false){
    const proc = Bun.spawn(["python", "src/scripts/sense-hat.py", f, v])
    if (r) return await new Response(proc.stdout).text()
    return true
}