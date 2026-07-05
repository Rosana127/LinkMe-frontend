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
  { path: '/', redirect: '/discover' },
  { path: '/login', name: 'login', component: LoginPage, meta: { requiresAuth: false } },
  { path: '/register', name: 'register', component: RegisterPage, meta: { requiresAuth: false } },
  { path: '/home', name: 'home', component: HomePage, meta: { requiresAuth: true } },
  { path: '/discover', name: 'discover', component: DiscoverPage, meta: { requiresAuth: false } },
  { path: '/match', name: 'match', component: MatchPage, meta: { requiresAuth: true } },
  { path: '/questionnaire', name: 'questionnaire', component: QuestionnairePage, meta: { requiresAuth: true } },
  { path: '/chat/:userId?', name: 'chat', component: ChatPage, props: true, meta: { requiresAuth: true } },
  { path: '/profile', redirect: '/home' },
  { path: '/settings', name: 'settings', component: SettingsPage, meta: { requiresAuth: true } },
  { path: '/create', name: 'create', component: CreatePost, meta: { requiresAuth: true } },
  { path: '/post/:id', name: 'post', component: PostDetail, props: true, meta: { requiresAuth: false } },
  { path: '/user/:id', name: 'user', component: UserDetailPage, props: true, meta: { requiresAuth: false } },
  { path: '/admin', name: 'admin', component: AdminPage, meta: { requiresAuth: true, requiresAdmin: true } }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()

  if ((to.path === '/' || to.path === '/discover') && authStore.isAuthenticated && authStore.isAdmin) {
    next({ name: 'admin' })
    return
  }

  if (
    authStore.isAuthenticated &&
    authStore.isAdmin &&
    to.name !== 'admin' &&
    to.name !== 'login'
  ) {
    next({ name: 'admin' })
    return
  }

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
    next(authStore.isAdmin ? { name: 'admin' } : { name: 'discover' })
    return
  }

  next()
})

export default router
