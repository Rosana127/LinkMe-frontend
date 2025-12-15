<template>
  <div class="settings-page">
    <div class="settings-container">
      <h1 class="page-title">设置</h1>
      
      <div class="settings-sections">
        <!-- 账号设置 -->
        <div class="settings-section">
          <h2 class="section-title">账号设置</h2>
          <div class="settings-item">
            <div class="item-info">
              <h3>个人资料</h3>
              <p>修改头像、昵称、生日和简介</p>
            </div>
            <button class="settings-btn" @click="openEditModal">编辑</button>
          </div>
          <div class="settings-item">
            <div class="item-info">
              <h3>隐私设置</h3>
              <p>控制谁可以查看你的内容</p>
            </div>
            <button class="settings-btn">暂未开放</button>
          </div>
        </div>

        <!-- 应用设置 -->
        <div class="settings-section">
          <h2 class="section-title">应用设置</h2>
          <div class="settings-item">
            <div class="item-info">
              <h3>通知设置</h3>
              <p>管理通知提醒方式</p>
            </div>
            <button class="settings-btn">暂未开放</button>
          </div>
          <div class="settings-item">
            <div class="item-info">
              <h3>主题外观</h3>
              <p>选择你喜欢的主题样式</p>
            </div>
            <div class="theme-selector-wrapper">
              <button 
                class="settings-btn" 
                @click="toggleThemeMenu"
                :class="{ active: showThemeMenu }"
              >
                {{ getCurrentThemeName() }}
                <span class="iconify" data-icon="mdi:chevron-down" data-inline="false"></span>
              </button>
              <div v-if="showThemeMenu" class="theme-menu">
                <button
                  v-for="theme in availableThemes"
                  :key="theme.id"
                  class="theme-option"
                  :class="{ active: currentTheme === theme.id }"
                  @click="selectTheme(theme.id)"
                >
                  <span class="theme-name">{{ theme.name }}</span>
                  <span v-if="currentTheme === theme.id" class="iconify" data-icon="mdi:check" data-inline="false"></span>
                </button>
              </div>
            </div>
          </div>
          <div class="settings-item">
            <div class="item-info">
              <h3>AI 助手</h3>
              <p>启用对话情感分析与建议</p>
            </div>
            <button class="settings-btn" @click="toggleAI">
              {{ aiEnabled ? '关闭' : '开启' }}
            </button>
          </div>
        </div>

        <!-- 帮助支持 -->
        <div class="settings-section">
          <h2 class="section-title">帮助支持</h2>
          <div class="settings-item">
            <div class="item-info">
              <h3>帮助中心</h3>
              <p>查看常见问题与使用说明</p>
            </div>
            <button class="settings-btn">查看</button>
          </div>
          <div class="settings-item">
            <div class="item-info">
              <h3>联系我们</h3>
              <p>提交反馈或报告问题</p>
            </div>
            <button class="settings-btn">联系</button>
          </div>
        </div>

        <!-- 账号操作 -->
        <div class="settings-section danger-section">
          <h2 class="section-title">账号操作</h2>
          <div class="settings-item">
            <div class="item-info">
              <h3>退出登录</h3>
              <p>退出当前账号</p>
            </div>
            <button class="settings-btn danger-btn" @click="handleLogout">
              <span class="iconify" data-icon="mdi:logout" data-inline="false"></span>
              退出登录
            </button>
          </div>
          <div class="settings-item">
            <div class="item-info">
              <h3>注销账号</h3>
              <p>永久删除账号及相关数据</p>
            </div>
            <button class="settings-btn danger-btn">
              <span class="iconify" data-icon="mdi:delete-outline" data-inline="false"></span>
              暂未开放
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 编辑个人资料弹窗 -->
    <div v-if="showEditModal" class="modal-overlay" @click="closeEditModal">
      <div class="modal-content edit-modal" @click.stop>
        <div class="modal-header">
          <h3>编辑个人资料</h3>
          <button class="modal-close" @click="closeEditModal">
            <span class="iconify" data-icon="mdi:close" data-inline="false"></span>
          </button>
        </div>
        
        <div class="edit-form">
          <div class="form-field">
            <label class="field-label">头像</label>
            <div class="avatar-upload-section">
              <div class="avatar-preview">
                <img 
                  :src="avatarPreview || editForm.avatar || currentUserInfo?.avatar || currentUserInfo?.avatarUrl || 'https://modao.cc/ai/uploads/ai_pics/32/327755/aigp_1758963762.jpeg'" 
                  alt="头像预览"
                  class="avatar-image"
                >
              </div>
              <div class="avatar-actions">
                <input 
                  ref="avatarInput"
                  type="file" 
                  accept="image/*"
                  class="avatar-input"
                  @change="handleAvatarChange"
                  style="display: none"
                >
                <button 
                  type="button"
                  class="btn-upload"
                  @click="$refs.avatarInput.click()"
                >
                  <span class="iconify" data-icon="mdi:upload" data-inline="false"></span>
                  上传头像
                </button>
                <button 
                  v-if="avatarPreview || editForm.avatar"
                  type="button"
                  class="btn-remove"
                  @click="removeAvatar"
                >
                  <span class="iconify" data-icon="mdi:delete" data-inline="false"></span>
                  移除
                </button>
              </div>
            </div>
            <div class="avatar-hint">支持 JPG、PNG 格式，建议尺寸 200x200px</div>
          </div>

          <div class="form-field">
            <label class="field-label">昵称</label>
            <input 
              v-model="editForm.nickname" 
              type="text" 
              placeholder="输入您的名字"
              class="form-input"
              maxlength="50"
            >
          </div>

          <div class="form-field">
            <label class="field-label">生日</label>
            <input
              v-model="editForm.birthday"
              type="date"
              placeholder="请选择您的生日"
              class="form-input"
            >
          </div>

          <div class="form-field">
            <label class="field-label">地区</label>
            <input
              v-model="editForm.location"
              type="text"
              placeholder="例如：北京、上海、深圳"
              class="form-input"
              maxlength="50"
            >
          </div>

          <div class="form-field">
            <label class="field-label">简介</label>
            <textarea 
              v-model="editForm.bio" 
              placeholder="介绍一下自己..."
              class="form-textarea"
              rows="4"
              maxlength="200"
            ></textarea>
            <div class="char-count">{{ editForm.bio.length }} / 200</div>
          </div>

          <div class="form-field">
            <label class="field-label">标签</label>
            <div class="tags-scroll" role="listbox">
              <button
                v-for="tag in availableTags"
                :key="tag.id || tag.name"
                type="button"
                :class="['tag-chip', { selected: isTagSelected(tag.id) }]"
                @click="toggleTag(tag.id)"
              >
                {{ tag.name }}
              </button>
            </div>
            <div class="tags-hint">
              <span v-if="tagsLoading">标签加载中...</span>
              <span v-else-if="tagsError">{{ tagsError }}</span>
              <span v-else>点击选择标签（支持多选）</span>
            </div>
          </div>

          <div v-if="saveMessage" class="save-message" :class="{ error: saveError }">
            {{ saveMessage }}
          </div>

          <div class="modal-actions">
            <button class="btn-cancel" @click="closeEditModal">取消</button>
            <button 
              class="btn-confirm" 
              @click="saveProfile"
              :disabled="saving"
            >
              {{ saving ? '保存中...' : '保存' }}
            </button>
          </div>

          <!-- 开发时显示请求/响应原文，便于调试 -->
          <div v-if="DEBUG_MODE" class="debug-panel" style="margin-top:16px;">
            <details>
              <summary>调试：最近请求/响应</summary>
              <div style="margin-top:8px;">
                <div><strong>请求</strong></div>
                <pre style="max-height:200px;overflow:auto;background:#111;color:#cfcfcf;padding:8px;border-radius:6px">{{ JSON.stringify(debugInfo.request, null, 2) }}</pre>
                <div style="margin-top:8px;"><strong>响应</strong></div>
                <pre style="max-height:200px;overflow:auto;background:#111;color:#cfcfcf;padding:8px;border-radius:6px">{{ JSON.stringify(debugInfo.response, null, 2) }}</pre>
              </div>
            </details>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { getUserInfo, updateCurrentUser } from '@/api/user'
import { fetchTagDefinitions } from '@/api/tags'
import { parseJwtPayload, buildUpdatePayload as utilBuildUpdatePayload, extractServerMessage as utilExtractServerMessage } from '@/utils/settingsProfile'
import * as aiApi from '@/api/ai'
import { getCurrentTheme, setTheme, getAvailableThemes, THEMES } from '@/utils/theme'

const router = useRouter()
const authStore = useAuthStore()

// 编辑模态框状态
const showEditModal = ref(false)
const saving = ref(false)
const saveMessage = ref('')
const saveError = ref(false)

// 表单数据
const editForm = ref({
  nickname: '',
  bio: '',
  avatar: '', // base64 编码的头像或 URL
  birthday: '',
  location: ''
})

// 当前用户信息（用于显示原始头像）
const currentUserInfo = ref(null)

// 头像预览（临时预览，还未保存）
const avatarPreview = ref('')

// 标签相关
const availableTags = ref([])
const selectedTagIds = ref([])
const tagsLoading = ref(false)
const tagsError = ref('')

// 默认标签（如果API失败时使用）
const DEFAULT_TAGS = [
  { id: 1, name: '摄影爱好者' },
  { id: 2, name: '旅行达人' },
  { id: 3, name: '美食家' },
  { id: 4, name: '读书人' },
  { id: 5, name: '运动健身' },
  { id: 6, name: '音乐爱好者' },
  { id: 7, name: '电影迷' },
  { id: 8, name: '游戏玩家' }
]

// 开发时显示请求/响应的调试开关
const DEBUG_MODE = import.meta.env.DEV === true
const debugInfo = ref({ request: null, response: null })

// AI助手开关
const aiEnabled = ref(false)
async function loadAIStatus() {
  try {
    const res = await aiApi.getStatus()
    const data = res?.data || res
    aiEnabled.value = !!data?.enabled
  } catch (e) {
    aiEnabled.value = false
  }
}
async function toggleAI() {
  try {
    if (aiEnabled.value) {
      await aiApi.disableAI()
      aiEnabled.value = false
    } else {
      await aiApi.enableAI()
      aiEnabled.value = true
    }
  } catch (e) {
    // 简单回退：不改变本地状态
  }
}

// 保存事件处理函数引用，以便在 onUnmounted 中清理
let likeStatusChangeHandler = null

// 主题选择相关
const showThemeMenu = ref(false)
const currentTheme = ref(getCurrentTheme())
const availableThemes = ref(getAvailableThemes())

// 切换主题菜单显示
function toggleThemeMenu() {
  showThemeMenu.value = !showThemeMenu.value
}

// 选择主题
function selectTheme(themeId) {
  currentTheme.value = themeId
  setTheme(themeId)
  showThemeMenu.value = false
}

// 获取当前主题名称
function getCurrentThemeName() {
  const theme = availableThemes.value.find(t => t.id === currentTheme.value)
  return theme ? theme.name : '无主题'
}

// 点击外部关闭菜单
function handleClickOutside(event) {
  const themeSelector = document.querySelector('.theme-selector-wrapper')
  if (themeSelector && !themeSelector.contains(event.target)) {
    showThemeMenu.value = false
  }
}

onMounted(() => {
  // 加载AI状态
  loadAIStatus()
  
  // 主题相关初始化
  document.addEventListener('click', handleClickOutside)
  currentTheme.value = getCurrentTheme()
  
  // 监听喜欢状态变化事件（从匹配页面或聊天页面触发）
  likeStatusChangeHandler = (event) => {
    const { userId, isLiked } = event.detail;
    console.log('设置页面收到喜欢状态变化事件:', { userId, isLiked });
    
    // 如果设置页面有显示喜欢状态的地方，可以在这里更新
    // 例如：如果有显示已喜欢用户列表，可以在这里刷新
    // 目前设置页面没有显示喜欢状态，但保留事件监听以便将来扩展
    
    // 如果需要，可以触发页面刷新或更新相关状态
    // 例如：如果设置了显示已喜欢用户列表，可以在这里调用刷新函数
  };
  window.addEventListener('like-status-changed', likeStatusChangeHandler);
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  // 清理喜欢状态变化事件监听器
  if (likeStatusChangeHandler) {
    window.removeEventListener('like-status-changed', likeStatusChangeHandler);
  }
})

// 小函数：尝试从 store 或 token 中获得 userId
function resolveUserId() {
  let id = authStore.userId
  if (!id && authStore.token) {
    const payload = parseJwtPayload(authStore.token)
    id = payload?.userId || payload?.id || payload?.sub || payload?.user_id || null
  }
  return id
}

// 使用 utils 中的 buildUpdatePayload

// 小函数：执行更新请求并记录调试信息
async function doUpdate(userId, payload) {
  // 记录调试日志，便于通过控制台或 debug 面板排查
  console.debug('[Settings] doUpdate: payload=', payload)
  if (DEBUG_MODE) debugInfo.value.request = { url: `/api/users/me`, method: 'PUT', body: payload }
  // 使用 updateCurrentUser API (PUT /api/users/me)，不需要 userId
  const res = await updateCurrentUser(payload)
  console.debug('[Settings] doUpdate: response=', res)
  if (DEBUG_MODE) debugInfo.value.response = res
  return res
}

// 使用 utils 中的 extractServerMessage


// JWT 解析使用 utils 中的 parseJwtPayload

// 打开编辑模态框
async function openEditModal() {
  showEditModal.value = true
  saveMessage.value = ''
  saveError.value = false
  
  // 加载用户信息
  await loadUserInfo()
  
  // 加载标签
  await loadTags()
}

// 关闭编辑模态框
function closeEditModal() {
  showEditModal.value = false
  saveMessage.value = ''
  saveError.value = false
  avatarPreview.value = '' // 清除预览
}

// 处理头像上传
function handleAvatarChange(event) {
  const file = event.target.files[0]
  if (!file) return
  
  // 检查文件类型
  if (!file.type.startsWith('image/')) {
    saveMessage.value = '请选择图片文件'
    saveError.value = true
    return
  }
  
  // 检查文件大小（限制为 2MB）
  const maxSize = 2 * 1024 * 1024 // 2MB
  if (file.size > maxSize) {
    saveMessage.value = '图片大小不能超过 2MB'
    saveError.value = true
    return
  }
  
  // 读取文件并转换为 base64
  const reader = new FileReader()
  reader.onload = (e) => {
    const base64String = e.target.result
    avatarPreview.value = base64String
    // 将 base64 保存到表单数据中
    editForm.value.avatar = base64String
    saveMessage.value = ''
    saveError.value = false
  }
  reader.onerror = () => {
    saveMessage.value = '图片读取失败，请重试'
    saveError.value = true
  }
  reader.readAsDataURL(file)
}

// 移除头像
function removeAvatar() {
  avatarPreview.value = ''
  editForm.value.avatar = ''
  // 清空文件输入
  if (document.querySelector('.avatar-input')) {
    document.querySelector('.avatar-input').value = ''
  }
}

// 加载用户信息
async function loadUserInfo() {
  const userId = authStore.userId
  if (!userId) {
    saveMessage.value = '请先登录'
    saveError.value = true
    return
  }
  
  try {
    const info = await getUserInfo(userId)
    const userData = info?.data || info || authStore.user
    
    // 保存当前用户信息
    currentUserInfo.value = userData
    
    // 填充表单
    editForm.value.nickname = userData?.nickname || userData?.username || ''
    editForm.value.bio = userData?.bio || ''
    editForm.value.avatar = userData?.avatar || userData?.avatarUrl || ''
    // 生日：直接读取后端 birthday（应为 YYYY-MM-DD）
    editForm.value.birthday = userData?.birthday || ''
    // 位置：region/location/city 任一即可
    editForm.value.location = userData?.region || userData?.location || userData?.city || ''
    avatarPreview.value = '' // 重置预览，使用已保存的头像（editForm.value.avatar 会在模板中使用）
    
    // 加载用户标签
    if (userData?.tags && Array.isArray(userData.tags)) {
      selectedTagIds.value = userData.tags
        .map(tag => {
          if (typeof tag === 'number') return tag
          if (typeof tag === 'object' && tag?.id) return tag.id
          return null
        })
        .filter(id => id !== null)
    } else if (userData?.tagIds && Array.isArray(userData.tagIds)) {
      selectedTagIds.value = userData.tagIds.filter(id => id !== null)
    } else {
      selectedTagIds.value = []
    }
  } catch (error) {
    console.error('加载用户信息失败:', error)
    saveMessage.value = '加载用户信息失败: ' + (error.message || '未知错误')
    saveError.value = true
  }
}

// 加载标签列表
async function loadTags() {
  tagsLoading.value = true
  tagsError.value = ''
  
  try {
    const tags = await fetchTagDefinitions()
    const normalized = Array.isArray(tags) ? tags : []
    
    if (normalized.length > 0) {
      // 确保每个标签都有 id 和 name
      availableTags.value = normalized.map(tag => ({
        id: tag.id || tag.tagId || tag.tag_id,
        name: tag.name || tag.tagName || tag.tag_name || '未知标签'
      })).filter(tag => tag.id && tag.name)
    } else {
      tagsError.value = '暂无可用标签，已展示默认选项'
      availableTags.value = [...DEFAULT_TAGS]
    }
  } catch (error) {
    console.error('加载标签失败:', error)
    tagsError.value = '标签加载失败，已使用默认标签'
    availableTags.value = [...DEFAULT_TAGS]
  } finally {
    tagsLoading.value = false
  }
}

// 检查标签是否被选中
function isTagSelected(tagId) {
  const normalizedId = typeof tagId === 'string' ? Number(tagId) : tagId
  return selectedTagIds.value.some(id => {
    const normalized = typeof id === 'string' ? Number(id) : id
    return normalized === normalizedId
  })
}

// 切换标签选择
function toggleTag(tagId) {
  // 确保 ID 类型一致（转换为数字进行比较）
  const normalizedId = typeof tagId === 'string' ? Number(tagId) : tagId
  const index = selectedTagIds.value.findIndex(id => {
    const normalized = typeof id === 'string' ? Number(id) : id
    return normalized === normalizedId
  })
  
  if (index > -1) {
    selectedTagIds.value.splice(index, 1)
  } else {
    selectedTagIds.value.push(tagId)
  }
}

// 保存个人资料（使用拆分的小函数，降低复杂度）
async function saveProfile() {
  saving.value = true
  saveMessage.value = ''
  saveError.value = false

  try {
    // 使用 updateCurrentUser API，不需要 userId
    if (!authStore.userId) {
      saveMessage.value = '请先登录'
      saveError.value = true
      return
    }

    const payload = utilBuildUpdatePayload(editForm.value)
    console.debug('[Settings] saveProfile: payload=', payload)
    if (Object.keys(payload).length === 0) {
      saveMessage.value = '没有可保存的更改'
      return
    }

    await doUpdate(null, payload)

    // 更新本地 store
    if (authStore.user) {
      if (payload.nickname) authStore.user.nickname = payload.nickname
      if (payload.bio) authStore.user.bio = payload.bio
      // 生日和地区
      if (payload.birthday) authStore.user.birthday = payload.birthday
      if (payload.region) {
        authStore.user.region = payload.region
        // 同步到 location/city 方便老代码使用
        authStore.user.location = payload.region
        authStore.user.city = payload.region
      }
      if (editForm.value.avatar) {
        authStore.user.avatar = editForm.value.avatar
        authStore.user.avatarUrl = editForm.value.avatar
      }
      if (selectedTagIds.value.length > 0) authStore.user.tags = selectedTagIds.value
      localStorage.setItem('user', JSON.stringify(authStore.user))
    }

    saveMessage.value = '保存成功！'
    saveError.value = false

    setTimeout(() => {
      closeEditModal()
      globalThis.location.reload()
    }, 1500)
  } catch (error) {
    console.error('保存失败:', error)
    console.error('错误对象完整信息:', JSON.stringify(error, null, 2))
    console.error('错误响应数据:', error.response?.data)
    console.error('错误请求数据:', error.config?.data)
    const serverMessage = utilExtractServerMessage(error)
    console.error('后端错误详情（可能包含字段级信息）：', error.httpData || error.response?.data || error)
    
    // 显示更详细的错误信息
    let errorMsg = '保存失败: '
    if (serverMessage && serverMessage !== '用户信息更新失败') {
      errorMsg += serverMessage
    } else if (error.response?.data?.message) {
      errorMsg += error.response.data.message
    } else if (error.message) {
      errorMsg += error.message
    } else {
      errorMsg += '用户信息更新失败，请查看控制台获取详细信息'
    }
    
    saveMessage.value = errorMsg
    saveError.value = true
  } finally {
    saving.value = false
  }
}

const handleLogout = () => {
  // 调用authStore的logout方法清除登录状态
  authStore.logout()
  // 跳转到登录页
  router.push('/login')
}
</script>

<style scoped>
.settings-page {
  min-height: 100vh;
  padding: 20px;
}

.settings-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 40px 20px;
}

.page-title {
  font-size: 32px;
  font-weight: bold;
  margin-bottom: 40px;
  color: #ffffff;
}

.settings-sections {
  display: flex;
  flex-direction: column;
  gap: 40px;
}

.settings-section {
  background-color: #1a1a1a;
  border-radius: 16px;
  padding: 24px;
  border: 1px solid #333333;
}

.section-title {
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 20px;
  color: #ffffff;
}

.settings-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 0;
  border-bottom: 1px solid #333333;
}

.settings-item:last-child {
  border-bottom: none;
}

.item-info h3 {
  font-size: 16px;
  font-weight: 500;
  color: #ffffff;
  margin: 0 0 4px 0;
}

.item-info p {
  font-size: 14px;
  color: #888888;
  margin: 0;
}

.settings-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: 8px;
  background-color: #8b5cf6;
  color: #ffffff;
  border: none;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.settings-btn:hover {
  background-color: #7c3aed;
}

.settings-btn .iconify {
  font-size: 16px;
  width: 16px;
  height: 16px;
}

.danger-section {
  border-color: #dc2626;
}

.danger-btn {
  background-color: #dc2626;
}

.danger-btn:hover {
  background-color: #b91c1c;
}

/* 模态框样式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content.edit-modal {
  background-color: #1a1a1a;
  border-radius: 16px;
  padding: 0;
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  border: 1px solid #333333;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24px;
  border-bottom: 1px solid #333333;
}

.modal-header h3 {
  font-size: 20px;
  font-weight: 600;
  color: #ffffff;
  margin: 0;
}

.modal-close {
  background: none;
  border: none;
  color: #888888;
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.2s;
}

.modal-close:hover {
  color: #ffffff;
}

.modal-close .iconify {
  font-size: 24px;
}

.edit-form {
  padding: 24px;
}

.form-field {
  margin-bottom: 24px;
}

.field-label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #ffffff;
  margin-bottom: 8px;
}

.form-input,
.form-textarea {
  width: 100%;
  padding: 12px;
  background-color: #2a2a2a;
  border: 1px solid #333333;
  border-radius: 8px;
  color: #ffffff;
  font-size: 16px;
  font-family: inherit;
  box-sizing: border-box;
  transition: border-color 0.2s;
}

.form-input:focus,
.form-textarea:focus {
  outline: none;
  border-color: #8b5cf6;
}

.form-textarea {
  resize: vertical;
  min-height: 100px;
}

.char-count {
  font-size: 12px;
  color: #888888;
  text-align: right;
  margin-top: 4px;
}

/* 头像上传样式 */
.avatar-upload-section {
  display: flex;
  gap: 20px;
  align-items: flex-start;
}

.avatar-preview {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  overflow: hidden;
  border: 2px solid #333333;
  background-color: #2a2a2a;
  flex-shrink: 0;
}

.avatar-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
}

.btn-upload,
.btn-remove {
  padding: 8px 16px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 6px;
}

.btn-upload {
  background-color: #8b5cf6;
  color: #ffffff;
}

.btn-upload:hover {
  background-color: #7c3aed;
}

.btn-remove {
  background-color: #2a2a2a;
  color: #ffffff;
  border: 1px solid #444444;
}

.btn-remove:hover {
  background-color: #3a3a3a;
  border-color: #dc2626;
  color: #dc2626;
}

.btn-upload .iconify,
.btn-remove .iconify {
  font-size: 16px;
}

.avatar-hint {
  font-size: 12px;
  color: #888888;
  margin-top: 8px;
}

/* 标签选择样式 */
.tags-scroll {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 12px;
  background-color: #2a2a2a;
  border: 1px solid #333333;
  border-radius: 8px;
  max-height: 200px;
  overflow-y: auto;
  margin-bottom: 8px;
}

.tag-chip {
  padding: 6px 12px;
  background-color: #3a3a3a;
  border: 1px solid #444444;
  border-radius: 16px;
  color: #ffffff;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.tag-chip:hover {
  background-color: #4a4a4a;
  border-color: #8b5cf6;
}

.tag-chip.selected {
  background-color: #8b5cf6;
  border-color: #8b5cf6;
  color: #ffffff;
}

.tags-hint {
  font-size: 12px;
  color: #888888;
  margin-top: 4px;
}

.save-message {
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 16px;
  font-size: 14px;
  text-align: center;
}

.save-message:not(.error) {
  background-color: #10b981;
  color: #ffffff;
}

.save-message.error {
  background-color: #dc2626;
  color: #ffffff;
}

.modal-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 24px;
}

.btn-cancel,
.btn-confirm {
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-cancel {
  background-color: #2a2a2a;
  color: #ffffff;
}

.btn-cancel:hover {
  background-color: #3a3a3a;
}

.btn-confirm {
  background-color: #8b5cf6;
  color: #ffffff;
}

.btn-confirm:hover:not(:disabled) {
  background-color: #7c3aed;
}

.btn-confirm:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.tags-scroll::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

.tags-scroll::-webkit-scrollbar-track {
  background: #2a2a2a;
  border-radius: 3px;
}

.tags-scroll::-webkit-scrollbar-thumb {
  background: #555555;
  border-radius: 3px;
}

.tags-scroll::-webkit-scrollbar-thumb:hover {
  background: #666666;
}

/* 主题选择器样式 */
.theme-selector-wrapper {
  position: relative;
}

.settings-btn.active {
  background-color: #7c3aed;
}

.settings-btn .iconify {
  margin-left: 4px;
  font-size: 14px;
  transition: transform 0.2s;
}

.settings-btn.active .iconify {
  transform: rotate(180deg);
}

.theme-menu {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  background-color: #1a1a1a;
  border: 1px solid #333333;
  border-radius: 8px;
  padding: 8px;
  min-width: 160px;
  z-index: 1000;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.theme-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 10px 12px;
  background: none;
  border: none;
  color: #ffffff;
  font-size: 14px;
  cursor: pointer;
  border-radius: 6px;
  transition: background-color 0.2s;
  text-align: left;
}

.theme-option:hover {
  background-color: #2a2a2a;
}

.theme-option.active {
  background-color: #3a3a3a;
  color: #8b5cf6;
}

.theme-name {
  flex: 1;
}

.theme-option .iconify {
  font-size: 18px;
  color: #8b5cf6;
}

@media (max-width: 768px) {
  .settings-container {
    padding: 20px 10px;
  }
  
  .settings-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .settings-btn {
    align-self: flex-end;
  }

  .modal-content.edit-modal {
    width: 95%;
    max-height: 85vh;
  }

  .edit-form {
    padding: 20px;
  }

  .modal-header {
    padding: 20px;
  }
}
</style>