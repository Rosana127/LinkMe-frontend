<template>
  <div class="app-container">
    <!-- 登录/注册 -->
    <template v-if="isAuthPage">
      <router-view />
    </template>

    <!-- 管理端：独立全屏布局，无用户侧栏 -->
    <template v-else-if="isAdminLayout">
      <router-view />
    </template>
    
    <!-- 用户端页面 -->
    <template v-else>
      <!-- 侧边栏 -->
      <Sidebar />
      
      <!-- 主内容区域 -->
      <main class="main-content">
        <div class="content-wrapper">
          <!-- 左侧主内容区 -->
          <div class="main-feed">
            <router-view />
          </div>
          
          <!-- 右侧栏 - 根据页面显示不同内容 -->
          <div class="right-sidebar" v-if="showRightSidebar">
            <div class="creators-card">
              <h3 class="creators-title">Top Creators</h3>
              <ul class="creators-list">
                <li class="creator-item">
                  <a href="https://github.com/erikLukin" target="_blank" rel="noopener noreferrer">
                    erikLukin
                  </a>
                </li>
                <li class="creator-item">
                  <a href="https://github.com/Rosana127" target="_blank" rel="noopener noreferrer">
                    Rosana127
                  </a>
                </li>
                <li class="creator-item">
                  <a href="https://github.com/Helina-cloud" target="_blank" rel="noopener noreferrer">
                    Helina-cloud
                  </a>
                </li>
                <li class="creator-item">
                  <a href="https://github.com/LinQsse" target="_blank" rel="noopener noreferrer">
                    LinQsse
                  </a>
                </li>
                <li class="creator-item">
                  <a href="https://github.com/ahzlll" target="_blank" rel="noopener noreferrer">
                    ahzlll
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </main>

      <!-- 移动端底部导航栏 -->
      <nav class="bottom-nav">
        <router-link to="/discover" class="bottom-nav-item" :class="{ active: $route.name === 'discover' }">
          <span class="iconify nav-icon" data-icon="mdi:compass-outline" data-inline="false"></span>
          <span class="nav-label">发现</span>
        </router-link>
        <router-link to="/match" class="bottom-nav-item" :class="{ active: $route.name === 'match' }">
          <span class="iconify nav-icon" data-icon="mdi:account-group-outline" data-inline="false"></span>
          <span class="nav-label">匹配</span>
        </router-link>
        <router-link to="/chat" class="bottom-nav-item" :class="{ active: $route.name === 'chat' }">
          <span class="iconify nav-icon" data-icon="mdi:message-outline" data-inline="false"></span>
          <span class="nav-label">聊天</span>
        </router-link>
        <router-link to="/home" class="bottom-nav-item" :class="{ active: $route.name === 'home' }">
          <span class="iconify nav-icon" data-icon="mdi:home-outline" data-inline="false"></span>
          <span class="nav-label">主页</span>
        </router-link>
        <router-link to="/create" class="bottom-nav-item bottom-nav-create" :class="{ active: $route.name === 'create' }">
          <span class="iconify nav-icon" data-icon="mdi:plus-circle-outline" data-inline="false"></span>
          <span class="nav-label">创建帖子</span>
        </router-link>
        <router-link to="/settings" class="bottom-nav-item" :class="{ active: $route.name === 'settings' }">
          <span class="iconify nav-icon" data-icon="mdi:cog-outline" data-inline="false"></span>
          <span class="nav-label">设置</span>
        </router-link>
      </nav>
    </template>
  </div>
</template>

<script setup>
import { computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import Sidebar from './components/Sidebar.vue'
import { initTheme, applyTheme } from '@/utils/theme'

const route = useRoute()
const authStore = useAuthStore()

const isAuthPage = computed(() => route.name === 'login' || route.name === 'register')

/** 管理员审核后台：与用户端发现/聊天等完全分离 */
const isAdminLayout = computed(() => {
  if (route.name === 'admin') return true
  return authStore.loginMode === 'admin' && authStore.isAdmin
})

// 控制右侧栏显示，只有home页面显示，且需要登录
const showRightSidebar = computed(() => {
  if (!authStore.isAuthenticated) {
    return false // 未登录时不显示右侧栏
  }
  return route.name === 'home' // 只显示home页面的右侧栏
})

// 路由监听和组件加载相关代码已简化

// 初始化主题
onMounted(() => {
  initTheme()
})

// 监听路由变化，重新应用主题到新页面
watch(() => route.name, () => {
  setTimeout(() => {
    applyTheme()
  }, 200)
})

// 用户统计数据相关代码已移除


</script>

<style scoped>
.app-container {
  display: flex;
  min-height: 100vh;
  width: 100%;
  background-color: #ffffff;
  padding-left: 280px;
  box-sizing: border-box;
}

.app-container:has(.admin-standalone-root) {
  padding-left: 0;
}

.main-content {
  flex: 1;
  padding: 20px;
  background-color: #ffffff;
  box-sizing: border-box;
  min-width: 0;
}

.content-wrapper {
  display: flex;
  gap: 20px;
  max-width: 100%;
  margin: 0;
  width: 100%;
}

.main-feed {
  flex: 1;
}

.right-sidebar {
  width: 300px;
  position: sticky;
  top: 20px;
  align-self: flex-start;
  height: calc(100vh - 40px);
}

.creators-card {
  background-color: #1a1a1a;
  border-radius: 12px;
  padding: 16px;
  border: 1px solid #333333;
}

.creators-title {
  font-size: 16px;
  font-weight: 600;
  color: #ffffff;
  margin: 0 0 12px 0;
}

.creators-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.creator-item a {
  display: block;
  padding: 8px 10px;
  border-radius: 8px;
  color: #e5e7eb;
  font-size: 14px;
  text-decoration: none;
  background-color: #111827;
  border: 1px solid #1f2937;
  transition: background-color 0.2s, transform 0.2s, border-color 0.2s;
}

.creator-item a:hover {
  background-color: #4b5563;
  border-color: #8b5cf6;
  transform: translateY(-1px);
}

.stat-card {
  background-color: #222222;
  border-radius: 8px;
  padding: 16px;
  text-align: center;
  transition: transform 0.2s, background-color 0.2s;
}

.stat-card:hover {
  transform: translateY(-2px);
  background-color: #2a2a2a;
}

.stat-number {
  font-size: 24px;
  font-weight: bold;
  color: #8b5cf6;
}

.stat-label {
  font-size: 12px;
  color: #888888;
  margin-top: 4px;
}

.top-categories {
  margin-top: 20px;
}

.category-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 200px;
  overflow-y: auto;
}

.category-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px;
  border-radius: 6px;
  transition: all 0.2s;
  cursor: pointer;
}

.category-item:hover {
  background-color: #333333;
  transform: translateX(4px);
}

.category-icon {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(139, 92, 246, 0.1);
  border-radius: 50%;
}

.category-icon .iconify {
  font-size: 16px;
  color: #8b5cf6;
}

.category-name {
  flex: 1;
  color: #ffffff;
  font-size: 14px;
  font-weight: 500;
}

.category-count {
  color: #888888;
  font-size: 12px;
  font-weight: 600;
}

/* 滚动条样式 */
.category-list::-webkit-scrollbar {
  width: 4px;
}

.category-list::-webkit-scrollbar-track {
  background: transparent;
}

.category-list::-webkit-scrollbar-thumb {
  background: #444444;
  border-radius: 2px;
}

.category-list::-webkit-scrollbar-thumb:hover {
  background: #555555;
}

/* ========== 移动端底部导航栏 ========== */
.bottom-nav {
  display: none; /* 桌面端隐藏 */
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 60px;
  background-color: #ffffff;
  border-top: 1px solid #e5e7eb;
  z-index: 1001;
  justify-content: space-around;
  align-items: center;
  padding-bottom: env(safe-area-inset-bottom, 0);
}

.bottom-nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  padding: 4px 8px;
  color: #9ca3af;
  text-decoration: none;
  font-size: 11px;
  flex: 1;
  transition: color 0.2s;
}

.bottom-nav-item .nav-icon {
  font-size: 22px;
  width: 22px;
  height: 22px;
}

.bottom-nav-item.active {
  color: #8b5cf6;
}

.bottom-nav-item:hover {
  color: #8b5cf6;
}

/* "创建帖子"按钮图标略大突出，但颜色跟随高亮逻辑 */
/* "Create Post" button icon slightly larger, but color follows highlight logic */
.bottom-nav-create .nav-icon {
  font-size: 26px;
  width: 26px;
  height: 26px;
}

.bottom-nav-create.active .nav-icon {
  color: #7c3aed;
}

/* 移动端/平板端显示底部导航，隐藏侧边栏（≤1024px 覆盖手机+平板） */
/* Show bottom nav and hide sidebar on mobile/tablet (≤1024px covers phone+tablet) */
@media (max-width: 1024px) {
  .bottom-nav {
    display: flex;
  }

  .sidebar {
    display: none;
  }

  .app-container {
    padding-left: 0 !important;
  }

  .main-content {
    padding-bottom: 80px; /* 给底部导航留空间 */
    margin-left: 0;
    padding-left: 10px;
    padding-right: 10px;
    padding-top: 10px;
  }

  .content-wrapper {
    flex-direction: column;
  }

  .right-sidebar {
    display: none; /* 移动端隐藏右侧栏，避免遮挡主页个人信息 / Hide right sidebar on mobile */
  }
}
</style>
