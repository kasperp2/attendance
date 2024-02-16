import { ref } from 'vue'
import { defineStore } from 'pinia'
import router from '@/router'

export const useAuthStore = defineStore('auth', () => {
  const ip = import.meta.env.VITE_APP_API_URL
  const user = ref(null)

  const loginToken = async () => {
    const response = await fetch(ip+'/user/login-token', {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      },
    }).then(res => {
        return res.json()
    })

    if (response.error) return false
    user.value = response
  }

  const login = async (username, password) => {
    const response = await fetch(ip+'/user/login', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password })
    }).then(res => {
      return res.json()
    })

    if(response.error) return false

    user.value = response

    router.push({ path: '/' })
  }

  const logout = async () => {
    await fetch(ip+'/user/logout', {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    user.value = null

    router.push({ path: '/login' })
  }
  return { user, login, loginToken, logout }
})
