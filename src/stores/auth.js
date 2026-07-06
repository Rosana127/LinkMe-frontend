import { defineStore } from 'pinia'
import { login as loginApi, register as registerApi } from '@/api/user'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: localStorage.getItem('token') || '',
    user: JSON.parse(localStorage.getItem('user') || 'null')
  }),

  getters: {
    isAuthenticated: (state) => !!state.token,
    isAdmin: (state) => {
      const role = state.user?.role
      return role === 'admin' || role === 'moderator'
    },
    userId: (state) => {
      const user = state.user
      if (!user) {
        return null
      }
      return user.userId || user.id || user.user_id || null
    }
  },

  actions: {
    async login(loginName, password) {
      try {
        const response = await loginApi(loginName, password)
        this.token = response.token
        this.user = response.user

        localStorage.setItem('token', this.token)
        localStorage.setItem('user', JSON.stringify(this.user))

        const role = response.user?.role
        const mode = role === 'admin' || role === 'moderator' ? 'admin' : 'user'
        return { success: true, loginType: mode }
      } catch (error) {
        return {
          success: false,
          message: error.message || '登录失败，请检查账号和密码'
        }
      }
    },

    async register(userData) {
      try {
        await registerApi(userData)
        return { success: true, message: '注册成功，请登录' }
      } catch (error) {
        return {
          success: false,
          message: error.message || '注册失败，请检查填写信息'
        }
      }
    },

    logout() {
      this.token = ''
      this.user = null
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    }
  }
})
