import { ref } from 'vue'
import { defineStore } from 'pinia'

export const useApiStore = defineStore('api', () => {
    const ip = import.meta.env.VITE_APP_API_URL
    const wsIp = import.meta.env.VITE_APP_WS_URL

    const POSTInit = {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
    }

    const GETInit = {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
    }

    const req = async (path, body = false) => {
        const init = body ? POSTInit : GETInit
        if(body) init.body = JSON.stringify(body)

        const response = await fetch(ip+path, init)
            .then(res => res.json())
            .catch(err => console.log('Request error:', err))
        
        if(!response || response.error){
            console.log('Response error:', response.error)
            return false
        }
        
        return response
    }

    const ws = (path) => {
        const ws = new WebSocket(wsIp+path)

        ws.onerror = (e) => {
            console.log("WebSocket error: ", e)
        }

        return ws
    }

    return { req, ws }
})