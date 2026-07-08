<template>
  <div class="auth-page">
    <!-- 左侧品牌区 -->
    <div class="auth-left">
      <button class="back-button" @click="goBack">
        <span class="iconify" data-icon="mdi:arrow-left" data-inline="false"></span>
        <span>返回</span>
      </button>
      <div class="brand-content">
        <div class="brand-icon">
          <span class="iconify" data-icon="mdi:heart-pulse" data-inline="false"></span>
        </div>
        <h1 class="brand-title">LinkMe</h1>
        <p class="brand-desc">遇见有趣的灵魂，找到属于你的连接</p>
        <div class="brand-tags">
          <span>真诚交友</span>
          <span>智能匹配</span>
          <span>安全可靠</span>
        </div>
      </div>
    </div>

    <!-- 右侧表单区 -->
    <div class="auth-right">
      <div class="auth-card">
        <div class="auth-header">
          <h2 class="auth-title">欢迎回来</h2>
          <p class="auth-subtitle">支持邮箱、手机号或用户名登录</p>
        </div>

        <form class="auth-form" @submit.prevent="handleLogin">
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

          <button type="submit" class="auth-button" :disabled="loading">
            {{ loading ? '登录中...' : '登录' }}
          </button>

          <div class="auth-footer">
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
    const response = await authStore.login({
      loginName: form.value.loginName.trim(),
      password: form.value.password
    })

    if (response && response.data) {
      const data = response.data
      const user = data.user || data
      const role = user?.role || user?.user?.role || data?.user?.role

      if (role === 'admin' || role === 'moderator') {
        router.push({ name: 'Admin' })
      } else {
        const redirect = route.query.redirect
        router.push(typeof redirect === 'string' && redirect ? redirect : '/')
      }
    }
  } catch (error) {
    const msg = error?.response?.data?.message || error?.data?.message || error.message || '登录失败'
    errorMessage.value = msg
  } finally {
    loading.value = false
  }
}

const goBack = () => {
  router.push('/')
}
</script>

<style scoped>
* {
  box-sizing: border-box;
}

.auth-page {
  display: flex;
  width: 100%;
  min-height: 100vh;
}

/* 左侧品牌区 */
.auth-left {
  flex: 1;
  background: linear-gradient(135deg, #4338ca 0%, #7c3aed 50%, #db2777 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
}

.auth-left::before {
  content: '';
  position: absolute;
  width: 400px;
  height: 400px;
  border-radius: 50%;
  background: rgba(255,255,255,0.06);
  top: -100px;
  right: -100px;
}

.auth-left::after {
  content: '';
  position: absolute;
  width: 300px;
  height: 300px;
  border-radius: 50%;
  background: rgba(255,255,255,0.04);
  bottom: -80px;
  left: -60px;
}

.back-button {
  position: fixed;
  top: 24px;
  left: 24px;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: rgba(255,255,255,0.15);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255,255,255,0.2);
  border-radius: 8px;
  color: #fff;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
  z-index: 10;
}

.back-button:hover {
  background: rgba(255,255,255,0.25);
}

.brand-content {
  text-align: center;
  color: #fff;
  position: relative;
  z-index: 1;
  padding: 40px;
}

.brand-icon {
  width: 80px;
  height: 80px;
  background: rgba(255,255,255,0.15);
  border-radius: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 24px;
  backdrop-filter: blur(10px);
}

.brand-icon .iconify {
  font-size: 40px;
  color: #fff;
}

.brand-title {
  font-size: 42px;
  font-weight: 800;
  margin-bottom: 12px;
  letter-spacing: -1px;
}

.brand-desc {
  font-size: 16px;
  opacity: 0.85;
  margin-bottom: 32px;
  line-height: 1.6;
}

.brand-tags {
  display: flex;
  gap: 12px;
  justify-content: center;
  flex-wrap: wrap;
}

.brand-tags span {
  padding: 6px 16px;
  background: rgba(255,255,255,0.12);
  border-radius: 20px;
  font-size: 13px;
  backdrop-filter: blur(10px);
}

/* 右侧表单区 */
.auth-right {
  flex: 1;
  background: linear-gradient(135deg, #f5f3ff 0%, #ede9fe 50%, #fae8ff 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
}

.auth-card {
  width: 100%;
  max-width: 420px;
}

.auth-header {
  text-align: center;
  margin-bottom: 32px;
}

.auth-title {
  font-size: 28px;
  font-weight: 700;
  color: #111827;
  margin-bottom: 8px;
}

.auth-subtitle {
  font-size: 14px;
  color: #6b7280;
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-label {
  font-size: 14px;
  font-weight: 600;
  color: #374151;
}

.form-input {
  padding: 12px 16px;
  border: 1.5px solid #d1d5db;
  border-radius: 10px;
  font-size: 15px;
  color: #111827;
  background: #fff;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.form-input:focus {
  outline: none;
  border-color: #7c3aed;
  box-shadow: 0 0 0 3px rgba(124,58,237,0.1);
}

.form-input::placeholder {
  color: #9ca3af;
}

.error-message {
  padding: 12px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  color: #dc2626;
  font-size: 14px;
}

.auth-button {
  padding: 14px;
  background: linear-gradient(135deg, #4338ca, #7c3aed);
  color: #fff;
  border: none;
  border-radius: 10px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  margin-top: 4px;
}

.auth-button:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 8px 24px rgba(124,58,237,0.3);
}

.auth-button:disabled {
  background: #9ca3af;
  cursor: not-allowed;
}

.auth-footer {
  text-align: center;
  margin-top: 8px;
  font-size: 14px;
  color: #6b7280;
}

.auth-footer .link {
  color: #7c3aed;
  text-decoration: none;
  font-weight: 600;
  margin-left: 4px;
}

.auth-footer .link:hover {
  text-decoration: underline;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .auth-left {
    display: none;
  }

  .auth-right {
    flex: 1;
    padding: 24px;
  }
}
</style>
