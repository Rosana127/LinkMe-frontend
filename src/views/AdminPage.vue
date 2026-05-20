<template>
  <div class="admin-standalone-root min-h-screen bg-gray-50 p-4 md:p-8">
    <div class="mx-auto max-w-7xl space-y-6">
      <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 class="text-3xl font-bold text-gray-900">LinkMe 管理后台</h1>
          <p class="mt-1 text-sm text-gray-500">用户管理 · 内容审核 · 账号处罚 · 操作日志</p>
        </div>
        <div class="flex gap-2">
          <button class="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm" @click="handleLogout">退出登录</button>
          <button class="rounded-lg bg-gray-900 px-4 py-2 text-sm text-white" @click="loadAll">刷新数据</button>
        </div>
      </div>

      <div v-if="error" class="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{{ error }}</div>
      <div v-if="message" class="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">{{ message }}</div>

      <div class="grid gap-4 md:grid-cols-3">
        <div class="rounded-2xl bg-white p-5 shadow-sm">
          <div class="text-sm text-gray-500">用户数量</div>
          <div class="mt-2 text-3xl font-bold">{{ stats.users ?? '-' }}</div>
        </div>
        <div class="rounded-2xl bg-white p-5 shadow-sm">
          <div class="text-sm text-gray-500">帖子数量</div>
          <div class="mt-2 text-3xl font-bold">{{ stats.posts ?? '-' }}</div>
        </div>
        <div class="rounded-2xl bg-white p-5 shadow-sm">
          <div class="text-sm text-gray-500">当前模块</div>
          <div class="mt-2 text-xl font-bold text-purple-600">{{ activeTabText }}</div>
        </div>
      </div>

      <div class="rounded-2xl bg-white p-2 shadow-sm">
        <div class="flex flex-wrap gap-2">
          <button v-for="tab in tabs" :key="tab.key" class="rounded-xl px-4 py-2 text-sm font-semibold" :class="activeTab === tab.key ? 'bg-purple-600 text-white' : 'text-gray-600 hover:bg-gray-100'" @click="switchTab(tab.key)">
            {{ tab.label }}
          </button>
        </div>
      </div>

      <!-- 用户管理 -->
      <section v-if="activeTab === 'users'" class="rounded-2xl bg-white p-4 shadow-sm md:p-6">
        <div class="mb-4 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <h2 class="text-xl font-bold">用户管理</h2>
          <div class="flex flex-wrap gap-2">
            <input v-model="keyword" class="rounded-lg border px-3 py-2 text-sm" placeholder="搜索 ID/昵称/账号/邮箱" @keyup.enter="loadUsers" />
            <select v-model="filterRole" class="rounded-lg border px-3 py-2 text-sm" @change="loadUsers">
              <option value="">全部角色</option>
              <option value="customer">普通用户</option>
              <option value="admin">管理员</option>
              <option value="moderator">审核员</option>
            </select>
            <select v-model="filterStatus" class="rounded-lg border px-3 py-2 text-sm" @change="loadUsers">
              <option value="">全部状态</option>
              <option v-for="s in statusOptions" :key="s.value" :value="s.value">{{ s.label }}</option>
            </select>
            <button class="rounded-lg bg-purple-600 px-4 py-2 text-sm text-white" @click="loadUsers">查询</button>
          </div>
        </div>
        <div class="overflow-x-auto">
          <table class="min-w-full text-left text-sm">
            <thead class="bg-gray-50 text-gray-500">
              <tr>
                <th class="px-3 py-2">用户</th>
                <th class="px-3 py-2">账号</th>
                <th class="px-3 py-2">性别</th>
                <th class="px-3 py-2">地区</th>
                <th class="px-3 py-2">角色</th>
                <th class="px-3 py-2">账号状态</th>
                <th class="px-3 py-2">注册时间</th>
                <th class="px-3 py-2">操作</th>
              </tr>
            </thead>
            <tbody class="divide-y">
              <tr v-for="user in users" :key="user.userId">
                <td class="px-3 py-3">
                  <div class="flex items-center gap-2">
                    <img :src="user.avatarUrl || defaultAvatar" class="h-9 w-9 rounded-full object-cover" alt="" />
                    <div>
                      <div class="font-semibold">{{ user.nickname || user.username }}</div>
                      <div class="text-xs text-gray-400">ID {{ user.userId }}</div>
                    </div>
                  </div>
                </td>
                <td class="px-3 py-3 text-gray-600">
                  <div>{{ user.username }}</div>
                  <div class="text-xs">{{ user.email || user.phone }}</div>
                </td>
                <td class="px-3 py-3">{{ genderText(user.gender) }}</td>
                <td class="px-3 py-3">{{ user.region || '-' }}</td>
                <td class="px-3 py-3">{{ user.role || 'customer' }}</td>
                <td class="px-3 py-3">
                  <span class="rounded-full px-2 py-1 text-xs font-medium" :class="statusClass(user.accountStatus)">{{ statusLabel(user.accountStatus) }}</span>
                  <div v-if="user.banUntil" class="mt-1 text-xs text-gray-400">至 {{ formatTime(user.banUntil) }}</div>
                </td>
                <td class="px-3 py-3 text-gray-500">{{ formatTime(user.createdAt) }}</td>
                <td class="px-3 py-3">
                  <div class="flex flex-wrap gap-1">
                    <select class="rounded border px-2 py-1 text-xs" @change="onPunishSelect(user.userId, $event)">
                      <option value="">处罚...</option>
                      <option value="warn">警告</option>
                      <option value="restricted_post">限制发帖</option>
                      <option value="restricted_comment">限制评论</option>
                      <option value="temp_banned">临时封禁</option>
                      <option value="perm_banned">永久封禁</option>
                    </select>
                    <button v-if="user.accountStatus && user.accountStatus !== 'normal'" class="rounded bg-green-600 px-2 py-1 text-xs text-white" @click="handleUnban(user.userId)">解封</button>
                    <button class="rounded bg-red-600 px-2 py-1 text-xs text-white" @click="handleDeleteUser(user.userId)">删除</button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- 帖子 -->
      <section v-if="activeTab === 'posts'" class="rounded-2xl bg-white p-4 shadow-sm md:p-6">
        <h2 class="mb-4 text-xl font-bold">帖子审核</h2>
        <div class="grid gap-4 md:grid-cols-2">
          <article v-for="post in posts" :key="post.postId" class="rounded-xl border p-4">
            <div class="mb-2 flex justify-between text-xs text-gray-400">
              <span>{{ post.nickname || post.username }} · ID {{ post.postId }}</span>
              <span :class="modClass(post.moderationStatus)">{{ modLabel(post.moderationStatus) }}</span>
            </div>
            <div class="text-sm font-medium text-purple-600">{{ post.topic || '无主题' }}</div>
            <p class="mt-2 line-clamp-4 text-sm text-gray-700">{{ post.content }}</p>
            <div class="mt-3 flex flex-wrap gap-2">
              <button class="rounded bg-gray-100 px-2 py-1 text-xs" @click="modPost(post.postId, 'hide')">隐藏</button>
              <button class="rounded bg-green-100 px-2 py-1 text-xs" @click="modPost(post.postId, 'approve')">通过</button>
              <button class="rounded bg-yellow-100 px-2 py-1 text-xs" @click="modPost(post.postId, 'reject')">驳回</button>
              <button class="rounded bg-red-600 px-2 py-1 text-xs text-white" @click="handleDeletePost(post.postId)">删除</button>
            </div>
          </article>
        </div>
      </section>

      <!-- 评论 -->
      <section v-if="activeTab === 'comments'" class="rounded-2xl bg-white p-4 shadow-sm md:p-6">
        <h2 class="mb-4 text-xl font-bold">评论审核</h2>
        <div class="space-y-3">
          <div v-for="c in comments" :key="c.commentId" class="rounded-xl border p-4">
            <div class="mb-1 flex justify-between text-xs text-gray-400">
              <span>{{ c.nickname || c.username }} · 帖子 {{ c.postId }}</span>
              <span :class="modClass(c.moderationStatus)">{{ modLabel(c.moderationStatus) }}</span>
            </div>
            <p class="text-sm text-gray-700">{{ c.content }}</p>
            <div class="mt-2 flex flex-wrap gap-2">
              <button class="rounded bg-gray-100 px-2 py-1 text-xs" @click="modComment(c.commentId, 'hide')">隐藏</button>
              <button class="rounded bg-green-100 px-2 py-1 text-xs" @click="modComment(c.commentId, 'approve')">通过</button>
              <button class="rounded bg-yellow-100 px-2 py-1 text-xs" @click="modComment(c.commentId, 'reject')">驳回</button>
              <button class="rounded bg-red-600 px-2 py-1 text-xs text-white" @click="handleDeleteComment(c.commentId)">删除</button>
            </div>
          </div>
        </div>
      </section>

      <!-- 审核日志 -->
      <section v-if="activeTab === 'audit'" class="rounded-2xl bg-white p-4 shadow-sm md:p-6">
        <h2 class="mb-4 text-xl font-bold">内容审核日志</h2>
        <div class="space-y-2 text-sm">
          <div v-for="log in auditLogs" :key="'a-' + log.id" class="rounded-lg border border-gray-100 p-3">
            <div class="font-medium">{{ log.action }} · 目标 {{ targetTypeText(log.targetType) }} #{{ log.targetId }}</div>
            <div class="text-gray-500">审核员 {{ log.auditorNickname || log.auditorId }} · {{ formatTime(log.createTime) }}</div>
            <div v-if="log.reason" class="text-gray-600">原因：{{ log.reason }}</div>
          </div>
        </div>
      </section>

      <!-- 操作日志 -->
      <section v-if="activeTab === 'ops'" class="rounded-2xl bg-white p-4 shadow-sm md:p-6">
        <h2 class="mb-4 text-xl font-bold">管理员操作日志</h2>
        <div class="space-y-2 text-sm">
          <div v-for="log in operationLogs" :key="'o-' + log.id" class="rounded-lg border border-gray-100 p-3">
            <div class="font-medium">{{ log.action }} · 用户 {{ log.targetUserId || '-' }}</div>
            <div class="text-gray-500">管理员 {{ log.adminNickname || log.adminId }} · {{ formatTime(log.createTime) }}</div>
            <div v-if="log.reason" class="text-gray-600">原因：{{ log.reason }}</div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import {
  deleteAdminComment,
  deleteAdminPost,
  deleteAdminUser,
  getAdminComments,
  getAdminPosts,
  getAdminStats,
  getAdminUsers,
  getAuditLogs,
  getOperationLogs,
  moderateComment,
  moderatePost,
  punishUser,
  unbanUser
} from '@/api/admin'

const router = useRouter()
const authStore = useAuthStore()

const tabs = [
  { key: 'users', label: '用户管理' },
  { key: 'posts', label: '帖子审核' },
  { key: 'comments', label: '评论审核' },
  { key: 'audit', label: '审核日志' },
  { key: 'ops', label: '操作日志' }
]

const statusOptions = [
  { value: 'normal', label: '正常' },
  { value: 'warned', label: '已警告' },
  { value: 'restricted_post', label: '限制发帖' },
  { value: 'restricted_comment', label: '限制评论' },
  { value: 'temp_banned', label: '临时封禁' },
  { value: 'perm_banned', label: '永久封禁' }
]

const activeTab = ref('users')
const stats = ref({})
const users = ref([])
const posts = ref([])
const comments = ref([])
const auditLogs = ref([])
const operationLogs = ref([])
const keyword = ref('')
const filterRole = ref('')
const filterStatus = ref('')
const error = ref('')
const message = ref('')
const defaultAvatar = 'https://modao.cc/ai/uploads/ai_pics/32/327755/aigp_1758963762.jpeg'

const activeTabText = computed(() => tabs.find((t) => t.key === activeTab.value)?.label || '-')

function formatTime(v) {
  if (!v) return '-'
  return String(v).replace('T', ' ').slice(0, 19)
}

function genderText(g) {
  const map = { male: '男', female: '女', other: '其他' }
  return map[g] || g || '-'
}

function statusLabel(s) {
  return statusOptions.find((o) => o.value === (s || 'normal'))?.label || s || '正常'
}

function statusClass(s) {
  const v = s || 'normal'
  if (v.includes('banned')) return 'bg-red-100 text-red-700'
  if (v.startsWith('restricted')) return 'bg-orange-100 text-orange-700'
  if (v === 'warned') return 'bg-yellow-100 text-yellow-800'
  return 'bg-green-100 text-green-700'
}

function modLabel(s) {
  const map = { visible: '可见', hidden: '已隐藏', deleted: '已删除' }
  return map[s] || s || '可见'
}

function modClass(s) {
  if (s === 'hidden') return 'text-orange-600'
  if (s === 'deleted') return 'text-red-600'
  return 'text-green-600'
}

function targetTypeText(t) {
  return { 0: '帖子', 1: '评论', 2: '用户' }[t] || '未知'
}

function showMessage(text) {
  message.value = text
  error.value = ''
  setTimeout(() => { message.value = '' }, 2000)
}

function showError(err) {
  error.value = err?.message || '操作失败'
  message.value = ''
}

function switchTab(key) {
  activeTab.value = key
  if (key === 'audit') loadAuditLogs()
  if (key === 'ops') loadOperationLogs()
}

function handleLogout() {
  authStore.logout()
  router.push({ name: 'login' })
}

async function loadStats() {
  stats.value = await getAdminStats()
}

async function loadUsers() {
  users.value = await getAdminUsers({
    page: 1,
    size: 100,
    keyword: keyword.value,
    role: filterRole.value || undefined,
    accountStatus: filterStatus.value || undefined
  })
}

async function loadPosts() {
  posts.value = await getAdminPosts({ page: 1, size: 100 })
}

async function loadComments() {
  comments.value = await getAdminComments({ page: 1, size: 100 })
}

async function loadAuditLogs() {
  auditLogs.value = await getAuditLogs({ page: 1, size: 50 })
}

async function loadOperationLogs() {
  operationLogs.value = await getOperationLogs({ page: 1, size: 50 })
}

async function loadAll() {
  try {
    await Promise.all([loadStats(), loadUsers(), loadPosts(), loadComments()])
    if (activeTab.value === 'audit') await loadAuditLogs()
    if (activeTab.value === 'ops') await loadOperationLogs()
  } catch (err) {
    showError(err)
  }
}

async function onPunishSelect(userId, event) {
  const action = event.target.value
  event.target.value = ''
  if (!action) return
  const reason = prompt('请输入处罚原因（可选）') || ''
  let banDays
  if (action === 'temp_banned') {
    const d = prompt('临时封禁天数', '7')
    banDays = parseInt(d, 10) || 7
  }
  if (!confirm('确认执行该处罚？')) return
  try {
    const msg = await punishUser(userId, { action, reason, banDays })
    await loadUsers()
    showMessage(typeof msg === 'string' ? msg : '处罚已生效，已写入数据库')
  } catch (err) {
    const tip = err?.message || ''
    if (tip.includes('account_status')) {
      showError(new Error('数据库缺少 account_status 字段，请执行后端 sql/请先执行-管理端数据库补丁.sql 后重启服务'))
    } else {
      showError(err)
    }
  }
}

async function handleUnban(userId) {
  try {
    await unbanUser(userId, '管理员解封')
    await loadUsers()
    showMessage('已解封')
  } catch (err) {
    showError(err)
  }
}

async function handleDeleteUser(userId) {
  if (!confirm('确定删除该用户？不可恢复')) return
  try {
    await deleteAdminUser(userId)
    await Promise.all([loadUsers(), loadStats()])
    showMessage('用户已删除')
  } catch (err) {
    showError(err)
  }
}

async function modPost(postId, action) {
  const reason = prompt('原因（可选）') || ''
  try {
    await moderatePost(postId, { action, reason })
    await loadPosts()
    showMessage('帖子处理完成')
  } catch (err) {
    showError(err)
  }
}

async function handleDeletePost(postId) {
  if (!confirm('确定删除该帖子？')) return
  try {
    await deleteAdminPost(postId)
    await Promise.all([loadPosts(), loadStats()])
    showMessage('帖子已删除')
  } catch (err) {
    showError(err)
  }
}

async function modComment(commentId, action) {
  const reason = prompt('原因（可选）') || ''
  try {
    await moderateComment(commentId, { action, reason })
    await loadComments()
    showMessage('评论处理完成')
  } catch (err) {
    showError(err)
  }
}

async function handleDeleteComment(commentId) {
  if (!confirm('确定删除该评论？')) return
  try {
    await deleteAdminComment(commentId)
    await loadComments()
    showMessage('评论已删除')
  } catch (err) {
    showError(err)
  }
}

onMounted(() => {
  if (!authStore.isAdmin) {
    router.replace('/login?redirect=/admin')
    return
  }
  loadAll()
})
</script>
