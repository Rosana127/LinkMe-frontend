<template>
  <aside class="sidebar">
    <!-- Logo 区域 -->
    <div class="logo-section">
      <div class="logo-icon">
        <svg viewBox="0 0 24 24" fill="currentColor" class="w-8 h-8">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
        </svg>
      </div>
      <h1 class="logo-text">LinkMe</h1>
    </div>
    
    <!-- 用户信息区域 -->
    <div class="user-section" v-if="isAuthenticated">
      <img 
        :src="userAvatar" 
        alt="User avatar" 
        class="user-avatar"
        @error="handleAvatarError($event, userNickname || userUsername)"
      >
      <div class="user-info">
        <div class="user-name">{{ userNickname }}</div>
        <div class="user-handle">@{{ userUsername }}</div>
      </div>
    </div>
    <!-- 未登录时显示登录提示 -->
    <div class="user-section" v-else>
      <div class="user-info" style="flex: 1; text-align: center;">
        <div class="user-name" style="margin-bottom: 8px;">欢迎使用 LinkMe</div>
        <router-link to="/login" class="login-link-btn">登录/注册</router-link>
      </div>
    </div>
    
    <!-- 导航菜单 -->
    <div class="nav-menu">
      <button 
        @click="navigateTo('discover')" 
        :class="['nav-link', { active: $route.name === 'discover' }]"
      >
        <span class="iconify" data-icon="mdi:compass-outline" data-inline="false"></span>
        <span>发现</span>
      </button>
      <button 
        @click="navigateTo('match')" 
        :class="['nav-link', { active: $route.name === 'match' }]"
      >
        <span class="iconify" data-icon="mdi:account-group-outline" data-inline="false"></span>
        <span>匹配</span>
      </button>
      <button 
        @click="navigateTo('chat')" 
        :class="['nav-link', { active: $route.name === 'chat' }]"
      >
        <span class="iconify" data-icon="mdi:message-outline" data-inline="false"></span>
        <span>消息</span>
        <span v-if="hasUnreadMessages" class="sidebar-unread-dot"></span>
      </button>
      <button 
        @click="navigateTo('home')" 
        :class="['nav-link', { active: $route.name === 'home' }]"
      >
        <span class="iconify" data-icon="mdi:home-outline" data-inline="false"></span>
        <span>主页</span>
      </button>
      <button 
        @click="navigateTo('create')" 
        :class="['nav-link', { active: $route.name === 'create' }]"
      >
        <span class="iconify" data-icon="mdi:plus-circle-outline" data-inline="false"></span>
        <span>创建帖子</span>
      </button>
      <button 
        @click="navigateTo('settings')" 
        :class="['nav-link', { active: $route.name === 'settings' }]"
      >
        <span class="iconify" data-icon="mdi:cog-outline" data-inline="false"></span>
        <span>设置</span>
      </button>
    </div>
    
    <!-- 登出按钮 -->
    <div class="logout-section" v-if="isAuthenticated">
      <button @click="handleLogout" class="logout-btn">
        <span class="iconify" data-icon="mdi:logout" data-inline="false"></span>
        <span>登出</span>
      </button>
    </div>
  </aside>
</template>

<script setup>
import { computed, inject, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { getAvatarUrl, handleAvatarError } from '@/utils/avatar'

const router = useRouter()
const authStore = useAuthStore()

const isAuthenticated = computed(() => authStore.isAuthenticated)

// 消息未读红点 / Message unread badge
const hasUnreadMessages = inject('hasUnreadMessages', ref(false))
const userNickname = computed(() => authStore.user?.nickname || 'User')
const userUsername = computed(() => authStore.user?.username || 'username')

// 获取头像 URL（优先使用真实头像，否则生成文字头像）
const userAvatar = computed(() => {
  const avatar = authStore.user?.avatarUrl
  const name = userNickname.value || userUsername.value || 'User'
  return getAvatarUrl(avatar, name)
})

const navigateTo = (routeName) => {
  // 如果需要登录的路由，检查登录状态
  const requiresAuthRoutes = ['home', 'match', 'chat', 'settings', 'create']
  if (requiresAuthRoutes.includes(routeName) && !authStore.isAuthenticated) {
    router.push({ name: 'login', query: { redirect: `/${routeName}` } })
  } else {
    router.push({ name: routeName })
  }
}

const handleLogout = () => {
  authStore.logout()
  router.push({ name: 'login' })
}
</script>

<style scoped>
.sidebar {
  width: 280px;
  height: 100vh;
  background: #ffffff !important;
  background-color: #ffffff !important;
  color: #666666 !important;
  display: flex;
  flex-direction: column;
  padding: 20px;
  position: fixed;
  left: 0;
  top: 0;
  border-right: 1px solid #e0e0e0;
  z-index: 1000;
}

.logo-section {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 40px;
}

.logo-icon {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #8b5cf6, #ec4899);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
}

.logo-text {
  font-size: 24px;
  font-weight: bold;
  color: #333333;
  margin: 0;
}

.user-section {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 40px;
  padding: 12px;
  border-radius: 12px;
  background-color: #f5f5f5;
}

.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
}

.user-info {
  flex: 1;
}

.user-name {
  font-weight: 600;
  color: #333333;
  font-size: 16px;
}

.user-handle {
  color: #666666;
  font-size: 14px;
}

.nav-menu {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.nav-link {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 16px;
  border-radius: 12px;
  background: none;
  border: none;
  color: #666666;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  text-align: left;
  width: 100%;
}

.nav-link:hover {
  background-color: #8b5cf6;
  color: #ffffff;
}

.nav-link.active {
  background-color: #f0f0f0;
  color: #333333;
  font-weight: 600;
}

.nav-link .iconify {
  font-size: 20px;
  flex-shrink: 0;
}

/* 侧边栏未读消息红点 / Sidebar unread dot badge */
.sidebar-unread-dot {
  width: 8px;
  height: 8px;
  background-color: #ef4444;
  border-radius: 50%;
  margin-left: auto;
  flex-shrink: 0;
}

.login-link-btn {
  display: inline-block;
  padding: 8px 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 8px;
  text-decoration: none;
  font-size: 14px;
  font-weight: 500;
  transition: opacity 0.2s;
}

.login-link-btn:hover {
  opacity: 0.9;
}

.logout-section {
  margin-top: auto;
  padding-top: 20px;
}

.logout-btn {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 16px;
  border-radius: 12px;
  background: none;
  border: none;
  color: #666666;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  text-align: left;
  width: 100%;
}

.logout-btn:hover {
  background-color: #f5f5f5;
  color: #333333;
}

.logout-btn .iconify {
  font-size: 20px;
  width: 20px;
  height: 20px;
}
</style>
