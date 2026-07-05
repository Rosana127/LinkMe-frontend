<template>
  <div class="login-page-wrapper">
    <div class="login-container">
      <button class="back-button" @click="goBack">
        <span class="iconify" data-icon="mdi:arrow-left" data-inline="false"></span>
        <span>返回</span>
      </button>

      <div class="login-card">
        <div class="login-header">
          <h1 class="login-title">欢迎回来</h1>
          <p class="login-subtitle">
            支持邮箱、手机号或用户名登录
          </p>
        </div>

        <form class="login-form" @submit.prevent="handleLogin">
          <div class="form-group">
            <label for="loginName" class="form-label">邮箱 / 手机号 / 用户名</label>
            <input
              id="loginName"
              v-model.trim="form.loginName"
              type="text"
              class="form-input"
              placeholder="请输入邮箱、手机号或用户名"
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

          <button type="submit" class="login-button" :disabled="loading">
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
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

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
    const result = await authStore.login(form.value.loginName, form.value.password)

    if (!result.success) {
      errorMessage.value = result.message || '登录失败，请重试'
      return
    }

    if (result.loginType === 'admin') {
      router.push(route.query.redirect || '/admin')
      return
    }

    router.push(route.query.redirect || '/discover')
  } catch (error) {
    errorMessage.value = error.message || '登录失败，请重试'
  } finally {
    loading.value = false
  }
}

const goBack = () => {
  router.push('/discover')
}
</script>

<style scoped>
.login-page-wrapper {
  width: 100%;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(180deg, #eeb3c1 0%, #97aedf 100%);
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

.login-page-wrapper .back-button {
  position: fixed;
  top: 20px;
  left: 20px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 18px;
  background: rgba(255, 255, 255, 0.96);
  border: 1px solid rgba(67, 56, 202, 0.12);
  border-radius: 10px;
  color: #1f2937;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  z-index: 10;
  box-shadow: 0 6px 18px rgba(15, 23, 42, 0.1);
}

.back-button:hover {
  background: #ffffff;
  transform: translateX(-2px);
}

.back-button .iconify {
  font-size: 18px;
}

.login-card {
  background: rgba(255, 255, 255, 0.98);
  border-radius: 18px;
  padding: 40px;
  width: 100%;
  max-width: 420px;
  box-shadow: 0 20px 60px rgba(30, 41, 59, 0.24);
}

.login-header {
  text-align: center;
  margin-bottom: 28px;
}

.login-title {
  font-size: 30px;
  font-weight: 700;
  color: #111827;
  margin-bottom: 8px;
}

.login-subtitle {
  font-size: 14px;
  color: #374151;
  line-height: 1.6;
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
  font-weight: 600;
  color: #1f2937;
}

.form-input {
  padding: 12px 16px;
  border: 1px solid #cbd5e1;
  border-radius: 10px;
  font-size: 14px;
  color: #111827;
  background: #ffffff;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.form-input:focus {
  outline: none;
  border-color: #4f46e5;
  box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.12);
}

.form-input::placeholder {
  color: #6b7280;
}

.error-message {
  padding: 12px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 10px;
  color: #b91c1c;
  font-size: 14px;
}

.login-button {
  padding: 13px 16px;
  background: #111827;
  color: #ffffff;
  border: none;
  border-radius: 10px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.login-button:hover:not(:disabled) {
  background: #0f172a;
  transform: translateY(-1px);
  box-shadow: 0 10px 20px rgba(15, 23, 42, 0.18);
}

.login-button:disabled {
  background: #94a3b8;
  cursor: not-allowed;
}

.login-footer {
  text-align: center;
  margin-top: 8px;
  font-size: 14px;
  color: #374151;
}

.login-footer .link {
  color: #3730a3;
  text-decoration: none;
  font-weight: 600;
  margin-left: 4px;
}

.login-footer .link:hover {
  text-decoration: underline;
}

@media (max-width: 640px) {
  .login-card {
    padding: 24px 18px;
  }
}
</style>
