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
    loginMode: (state) => localStorage.getItem('loginMode') || 'user',
    // Try multiple possible id field names to be tolerant to backend differences
    userId: (state) => {
      const u = state.user
      if (!u) return null
      return u.userId || u.id || u.user_id || null
    }
  },

  actions: {
    /**
     * 用户登录
     * @param {String} loginName 登录名
     * @param {String} password 密码
     */
    async login(loginName, password, loginType = 'user') {
      try {
        const response = await loginApi(loginName, password, loginType)
        // 后端返回格式: { user: {...}, token: "...", loginType }
        this.token = response.token
        this.user = response.user
        const mode = response.loginType || loginType
        
        // 保存到localStorage
        localStorage.setItem('token', this.token)
        localStorage.setItem('user', JSON.stringify(this.user))
        localStorage.setItem('loginMode', mode)
        
        return { success: true, loginType: mode }
      } catch (error) {
        return { 
          success: false, 
          message: error.message || '登录失败，请检查用户名和密码' 
        }
      }
    },

    /**
     * 用户注册
     * @param {Object} userData 用户注册数据
     */
    async register(userData) {
      try {
        await registerApi(userData)
        return { success: true, message: '注册成功，请登录' }
      } catch (error) {
        return { 
          success: false, 
          message: error.message || '注册失败，请检查输入信息' 
        }
      }
    },

    /**
     * 用户登出
     */
    logout() {
      this.token = ''
      this.user = null
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      localStorage.removeItem('loginMode')
    }
  }
})

