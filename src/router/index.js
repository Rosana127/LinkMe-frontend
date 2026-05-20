import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import HomePage from '../views/HomePage.vue'
import DiscoverPage from '../views/DiscoverPage.vue'
import MatchPage from '../views/MatchPage.vue'
import ChatPage from '../views/ChatPage.vue'
import SettingsPage from '../views/SettingsPage.vue'
import CreatePost from '../views/CreatePost.vue'
import LoginPage from '../views/LoginPage.vue'
import RegisterPage from '../views/RegisterPage.vue'
import PostDetail from '../views/PostDetail.vue'
import UserDetailPage from '../views/UserDetailPage.vue'
import QuestionnairePage from '../views/QuestionnairePage.vue'
import AdminPage from '../views/AdminPage.vue'

const routes = [
  {
    path: '/',
    redirect: '/discover'
  },
  {
    path: '/login',
    name: 'login',
    component: LoginPage,
    meta: { requiresAuth: false }
  },
  {
    path: '/register',
    name: 'register',
    component: RegisterPage,
    meta: { requiresAuth: false }
  },
  {
    path: '/home',
    name: 'home',
    component: HomePage,
    meta: { requiresAuth: true }
  },
  {
    path: '/discover',
    name: 'discover',
    component: DiscoverPage,
    meta: { requiresAuth: false } // 不需要登录即可访问
  },
  {
    path: '/match',
    name: 'match',
    component: MatchPage,
    meta: { requiresAuth: true }
  },
  {
    path: '/questionnaire',
    name: 'questionnaire',
    component: QuestionnairePage,
    meta: { requiresAuth: true }
  },
  {
    path: '/chat/:userId?',
    name: 'chat',
    component: ChatPage,
    props: true,
    meta: { requiresAuth: true }
  },
  {
    path: '/profile',
    redirect: '/home'
  },
  {
    path: '/settings',
    name: 'settings',
    component: SettingsPage,
    meta: { requiresAuth: true }
  },
  {
    path: '/create',
    name: 'create',
    component: CreatePost,
    meta: { requiresAuth: true }
  }
  ,
  {
    path: '/post/:id',
    name: 'post',
    component: PostDetail,
    props: true,
    meta: { requiresAuth: false }
  },
  {
    path: '/user/:id',
    name: 'user',
    component: UserDetailPage,
    props: true,
    meta: { requiresAuth: false }
  },
  {
    path: '/admin',
    name: 'admin',
    component: AdminPage,
    meta: { requiresAuth: true, requiresAdmin: true }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()

  if (to.path === '/' || to.path === '/discover') {
    if (authStore.isAuthenticated && authStore.loginMode === 'admin' && authStore.isAdmin) {
      next({ name: 'admin' })
      return
    }
  }

  // 管理员登录后仅允许管理端与登录页，不进入发现/聊天等用户界面
  if (
    authStore.isAuthenticated &&
    authStore.loginMode === 'admin' &&
    authStore.isAdmin &&
    to.name !== 'admin' &&
    to.name !== 'login'
  ) {
    next({ name: 'admin' })
    return
  }
  
  // 如果路由需要认证
  if (to.meta.requiresAuth) {
    if (!authStore.isAuthenticated) {
      next({ name: 'login', query: { redirect: to.fullPath } })
      return
    }
    if (to.meta.requiresAdmin && !authStore.isAdmin) {
      next({ name: 'discover' })
      return
    }
    next()
    return
  }

  if ((to.name === 'login' || to.name === 'register') && authStore.isAuthenticated) {
    if (authStore.loginMode === 'admin' && authStore.isAdmin) {
      next({ name: 'admin' })
    } else {
      next({ name: 'discover' })
    }
    return
  }
  next()
})

export default router
