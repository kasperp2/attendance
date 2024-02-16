import { Elysia, t } from 'elysia'
import { cors } from '@elysiajs/cors'
import { jwt } from '@elysiajs/jwt'
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

    switch (topic) {
        case 'esp32/attendant':
            let nameId = message.toString()
            let name = (await Name.findByPk(nameId))
            if (!name) return
            const oldAttendance = await Attendance.findOne({  
                where: [
                    { name_id: nameId },
                    sequelize.where(
                        sequelize.fn('DATE', sequelize.col('createdAt')), 
                        sequelize.fn('DATE', sequelize.fn('NOW'))
                    )
                ]
            })
            if (oldAttendance) return

            const attendance = await Attendance.create({ name_id: nameId })
            
            const result = JSON.stringify({ action:'attendant', data: attendance })
            server.server?.publish('attendance/' + name.user_id, result)

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


const test = new Elysia({prefix: '/test'})
    .get('/set-name', async () => {
        const jane = await Name.create({ name: "Jane" });
        return true
    })
    .get('/set-user', async () => {
        const jane = await User.create({ username: "admin", password: "admin" });
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
    .use(cors({
        origin : /.*/,
        allowedHeaders: [
            'Content-Type',
            'Cookie',
        ]
    }))
    .use(
        jwt({
            name: 'jwt',
            secret: process.env.JWT_SECRET as string,
        })
    )
    .group('/attendance', (app) => app
        .ws('/', {
            body: t.Object({
                action: t.String(),
                data: t.String(),
            }),
            async beforeHandle(req){
                const userId = await req.jwt.verify(req.cookie.auth.value)
                if (!userId) return {error: 'Unauthorized'}
            },
            message(ws, {action, data }) {
            },
            async open(ws){
                const userId = await ws.data.jwt.verify(ws.data.cookie.auth.value)
                if (!userId) return

                ws.subscribe('attendance/' + userId.id)
                ws.subscribe('card/confirm')
            },
            close(ws){
                ws.unsubscribe('attendance')
            }
        })
        .get('/get/:date', async ({ params: { date }, jwt, cookie: { auth }}) => {
            const userId = await jwt.verify(auth.value)
            if (!userId) return {error: 'Unauthorized'}

            return await Attendance.findAll({ where: 
                sequelize.where(
                    sequelize.fn('DATE', sequelize.col('createdAt')), 
                    date
                ),
                
            })
        })
    )
    .group('/name', (app) => app
        .get('/get', async ({ jwt, cookie: { auth }}) => {
            const userId = await jwt.verify(auth.value)
            if (!userId) return {error: 'Unauthorized'}
            return await Name.findAll({ where: {user_id: userId.id} })
        })
        .get('create/:name', async ({ params: { name }, jwt, cookie: { auth }}) => {
            const userId = await jwt.verify(auth.value)
            if (!userId) return {error: 'Unauthorized'}
            // urldecode
            name = decodeURIComponent(name)
            const newName = await Name.create({ name, user_id: userId.id})
            return newName
        })
        .get('write/:uuid', async ({ params: { uuid }, jwt, cookie: { auth }}) => {
            const userId = await jwt.verify(auth.value)
            if (!userId) return {error: 'Unauthorized'}

            const chackName = Name.findOne({ where: {id: uuid, user_id: userId.id, card_assigned: false} })
            if (!chackName) return {error: 'No name found'}

            mqtt.publish('api/name/create', uuid)
            return true  
        })
        .get('remove/:nameId', async ({ params: { nameId }, jwt, cookie: { auth }}) => {
            const userId = await jwt.verify(auth.value)
            if (!userId) return {error: 'Unauthorized'}
            // urldecode
            nameId = decodeURIComponent(nameId)
            Name.destroy({ where: {user_id: userId.id, id: nameId} })
            Attendance.destroy({ where: {name_id: nameId}})
            return true
        })
    )
    .group('/user', (app) => app
        .post('/login', async ({ body, jwt, cookie: { auth } }) => {
            let user = await User.findOne({
                where: {username: body.username, password: body.password }
            })
            
            if(!user){
                return {error: 'no user'}
            }

            // set auth cookie
            auth.set({
                value: await jwt.sign({id: user.id}),
                httpOnly: true,
                maxAge: 7 * 86400,
                path: '/',
                secure: false
            })
    
            return user
        }, {
            body: t.Object({
                username: t.String(),
                password: t.String() 
            })
        })
        .get('/logout', async ({ cookie: { auth } }) => {
            auth.remove({
                path: '/',
                secure: false
            })
            return true
        })
        .get('/login-token', async ({ jwt, set, cookie: { auth } }) => {            
            const userId = await jwt.verify(auth.value)
    
            if (!userId) {
                set.status = 401
                return {error: 'Unauthorized'}
            }
    
            let user = await User.findByPk(userId.id)
    
            if(!user){
                return {error: 'no user'}
            }
    
            return user
        })
    )
    .use(test)
    .use(sense)
    .listen(process.env.PORT as string)


async function senseHat(f : String, v : any = '', r: boolean = false){
    const proc = Bun.spawn(["python", "src/scripts/sense-hat.py", f, v])
    if (r) return await new Response(proc.stdout).text()
    return true
}