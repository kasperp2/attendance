import { ref } from 'vue'
import { defineStore } from 'pinia'
import router from '@/router'
import { useApiStore } from '@/stores/api'

export const useAuthStore = defineStore('auth', () => {
  const api = useApiStore()
  const user = ref(null)

  const loginToken = async () => {
    user.value = await api.req('/user/login-token')
  }

  const login = async (username, password) => {
    user.value = await api.req('/user/login', { username, password })
    router.push({ path: '/' })
  }

  const logout = async () => {
    api.req('/user/logout')
    user.value = null
    router.push({ path: '/login' })
  }
  return { user, login, loginToken, logout }
})
