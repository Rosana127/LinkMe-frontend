<template>
  <div class="login-page-wrapper">
    <div class="login-container">
      <!-- 返回按钮 -->
      <button @click="goBack" class="back-button">
        <span class="iconify" data-icon="mdi:arrow-left" data-inline="false"></span>
        <span>返回</span>
      </button>
      
      <div class="login-card">
      <div class="login-header">
        <h1 class="login-title">欢迎回来</h1>
        <p class="login-subtitle">选择登录方式后进入对应系统</p>
      </div>

      <div class="login-type-tabs">
        <button type="button" class="type-tab" :class="{ active: loginType === 'user' }" @click="loginType = 'user'">用户登录</button>
        <button type="button" class="type-tab" :class="{ active: loginType === 'admin' }" @click="loginType = 'admin'">管理员登录</button>
      </div>

      <form @submit.prevent="handleLogin" class="login-form">
        <div class="form-group">
          <label for="loginName" class="form-label">邮箱/手机号</label>
          <input
            id="loginName"
            v-model="form.loginName"
            type="text"
            class="form-input"
            placeholder="请输入邮箱或手机号"
            required
          />
        </div>

        <div class="form-group">
          <label for="password" class="form-label">密码</label>
          <input
            id="password"
            v-model="form.password"
            type="password"
            class="form-input"
            placeholder="请输入密码"
            required
          />
        </div>

        <div v-if="errorMessage" class="error-message">
          {{ errorMessage }}
        </div>

        <button 
          type="submit" 
          class="login-button"
          :disabled="loading"
        >
          {{ loading ? '登录中...' : '登录' }}
        </button>

        <div class="login-footer">
          <span>还没有账号？</span>
          <router-link to="/register" class="link">立即注册</router-link>
        </div>
      </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const loginType = ref('user')
const form = ref({
  loginName: '',
  password: ''
})

const loading = ref(false)
const errorMessage = ref('')

const handleLogin = async () => {
  errorMessage.value = ''
  loading.value = true

  try {
    const result = await authStore.login(form.value.loginName, form.value.password, loginType.value)
    
    if (result.success) {
      const mode = result.loginType || loginType.value
      if (mode === 'admin') {
        router.push(route.query.redirect || '/admin')
      } else {
        const redirect = route.query.redirect || '/discover'
        router.push(redirect)
      }
    } else {
      errorMessage.value = result.message || '登录失败，请重试'
    }
  } catch (error) {
    errorMessage.value = error.message || '登录失败，请重试'
  } finally {
    loading.value = false
  }
}

const goBack = () => {
  // 总是返回到explore页面
  router.push('/discover')
}
</script>

<style scoped>
/* 登录页面全屏背景包装器 */
.login-page-wrapper {
  width: 100%;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient( rgb(239, 183, 193),rgb(151, 174, 223));
  position: relative;
  overflow: hidden;
}

.login-container {
  width: 100%;
  max-width: 500px;
  position: relative;
  padding: 20px;
  margin: 0 auto;
}

/* 返回按钮相对于全屏背景定位 */
.login-page-wrapper .back-button {
  position: fixed;
  top: 20px;
  left: 20px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 18px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.8);
  border-radius: 8px;
  color: #333;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  z-index: 10;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.back-button:hover {
  background: rgba(255, 255, 255, 1);
  transform: translateX(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.back-button .iconify {
  font-size: 18px;
}

.login-card {
  background: white;
  border-radius: 16px;
  padding: 40px;
  width: 100%;
  max-width: 400px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.login-header {
  text-align: center;
  margin-bottom: 32px;
}

.login-title {
  font-size: 28px;
  font-weight: bold;
  color: #1a1a1a;
  margin-bottom: 8px;
}

.login-subtitle {
  font-size: 14px;
  color: #666;
}

.login-type-tabs {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin-bottom: 20px;
}

.type-tab {
  padding: 10px 12px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  background: #fafafa;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.type-tab.active {
  border-color: #667eea;
  background: #eef1ff;
  color: #4c5fd7;
  font-weight: 600;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-label {
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.form-input {
  padding: 12px 16px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 14px;
  transition: border-color 0.2s;
}

.form-input:focus {
  outline: none;
  border-color: #667eea;
}

.form-input::placeholder {
  color: #999;
}

.error-message {
  padding: 12px;
  background: #fee;
  border: 1px solid #fcc;
  border-radius: 8px;
  color: #c33;
  font-size: 14px;
}

.login-button {
  padding: 12px;
  background: white;
  color: #333;
  border: 2px solid #333;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.login-button:hover:not(:disabled) {
  background: #f5f5f5;
  border-color: #000;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.login-button:disabled {
  background: #f5f5f5;
  color: #999;
  border-color: #ccc;
  cursor: not-allowed;
  opacity: 0.6;
}

.login-footer {
  text-align: center;
  margin-top: 20px;
  font-size: 14px;
  color: #666;
}

.login-footer .link {
  color: #667eea;
  text-decoration: none;
  font-weight: 500;
  margin-left: 4px;
}

.login-footer .link:hover {
  text-decoration: underline;
}
</style>

