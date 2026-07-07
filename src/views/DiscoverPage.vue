<template>
  <div class="explore-page">
    <!-- toast 提示 -->
    <div v-if="showToast" class="toast">{{ toastText }}</div>
    
    <!-- 收藏夹选择弹窗 -->
    <div v-if="showFolderModal" class="modal-overlay" @click="closeFolderModal">
      <div class="modal-content" @click.stop>
        <h3 class="modal-title">选择收藏夹</h3>
        <div class="folder-list">
          <div 
            v-for="folder in favoriteFolders" 
            :key="folder.folderId" 
            class="folder-item"
            @click="saveToFolder(folder.folderId)"
          >
            <span class="iconify" data-icon="mdi:folder-outline"></span>
            <span>{{ folder.name }}</span>
          </div>
          <div class="folder-item create-folder" @click="showCreateFolder = true">
            <span class="iconify" data-icon="mdi:folder-plus-outline"></span>
            <span>创建新收藏夹</span>
          </div>
        </div>
        <button class="modal-close-btn" @click="closeFolderModal">取消</button>
      </div>
    </div>
    
    <!-- 创建收藏夹弹窗 -->
    <div v-if="showCreateFolder" class="modal-overlay" @click="showCreateFolder = false">
      <div class="modal-content" @click.stop>
        <h3 class="modal-title">创建收藏夹</h3>
        <input 
          v-model="newFolderName" 
          type="text" 
          placeholder="输入收藏夹名称" 
          class="folder-input"
          @keyup.enter="createNewFolder"
        >
        <div class="modal-actions">
          <button class="modal-btn cancel" @click="showCreateFolder = false">取消</button>
          <button class="modal-btn confirm" @click="createNewFolder">创建</button>
        </div>
      </div>
    </div>
    
    <!-- 分类和搜索区域 -->
    <div class="category-search-container fixed-header">
      <div class="categories">
        <button 
          @click="activeCategory = 'recommended'"
          :class="['category-btn', { active: activeCategory === 'recommended' }]"
        >
          推荐
        </button>
        <button 
          @click="handleFollowingClick"
          :class="['category-btn', { active: activeCategory === 'following' }]"
        >
          关注
        </button>
      </div>
      
      <div class="search-container">
        <input 
          type="text" 
          placeholder="搜索..." 
          class="search-input"
          v-model="searchQuery"
        >
        <button class="search-btn">
          <span class="iconify" data-icon="mdi:magnify" data-inline="false"></span>
        </button>
      </div>
    </div>
    
    <!-- 加载状态和错误提示 -->
    <div v-if="loading" class="loading-message">加载中...</div>
    <div v-if="error && !loading" class="error-message">{{ error }}</div>
    
    <!-- 动态流 -->
    <div v-if="!loading && !error" class="posts-grid">
      <div v-if="filteredPosts.length === 0" class="empty-message">暂无帖子</div>
      <router-link 
        v-for="post in filteredPosts" 
        :key="post.id" 
        :to="{ name: 'post', params: { id: post.id } }" 
        class="post-card post-link"
      >
        <!-- 用户信息 -->
        <div class="post-header">
          <div class="user-info">
            <!-- 用户头像 -->
            <div class="user-avatar-container">
              <img 
                :src="getAvatarUrl(post.author.avatar, post.author.name)" 
                :alt="post.author.name" 
                class="user-avatar"
                @error="handleAvatarError($event, post.author.name)"
              >
            </div>
            <div class="user-details">
              <div class="username">{{ post.author.name }}</div>
              <div class="user-handle">@{{ post.author.handle }}</div>
            </div>
          </div>
          <div class="post-meta">
            <span class="timestamp">{{ post.time }}</span>
            <span class="location">{{ post.location }}</span>
          </div>
        </div>
        
        <!-- 帖子内容 -->
        <div class="post-content">
          <p class="post-caption">{{ post.caption }}</p>
          <div class="hashtags">{{ post.hashtags }}</div>
        </div>
        
        <!-- 移动端图片预览：首页不显示图片，只在详情页显示；移动端单列布局时展示图片提升体验 -->
        <!-- Mobile image preview: hidden on desktop, shown on mobile single-column layout for better UX -->
        <div class="post-image-mobile" v-if="post.image">
          <img :src="post.image" :alt="post.caption" loading="lazy" @error="e => e.target.style.display = 'none'">
        </div>
        
        <!-- 互动按钮 -->
        <div class="post-actions">
          <button 
            :class="['action-btn', { liked: post.liked }]" 
            @click.prevent.stop="toggleLike(post)"
          >
            <span 
              class="iconify" 
              :data-icon="post.liked ? 'mdi:heart' : 'mdi:heart-outline'" 
              data-inline="false"
            ></span>
            <span>{{ post.likeCount || 0 }}</span>
          </button>
          <button 
            :class="['action-btn', { favorited: post.favorited }]" 
            @click.prevent.stop="openFolderModal(post)"
          >
            <span 
              class="iconify" 
              :data-icon="post.favorited ? 'mdi:bookmark' : 'mdi:bookmark-outline'" 
              data-inline="false"
            ></span>
            <span>{{ post.favorites || 0 }}</span>
          </button>
          <button 
            class="action-btn" 
            @click.prevent.stop="openPost(post.id)"
          >
            <span class="iconify" data-icon="mdi:comment-outline" data-inline="false"></span>
            <span>{{ post.commentCount || 0 }}</span>
          </button>
        </div>
      </router-link>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { getPosts, getRecommendedPosts, getPost, likePost, unlikePost } from '@/api/posts'
import { getFavoriteFolders, createFavoriteFolder, addPostToFavorites } from '@/api/favorites'
import { followUser, unfollowUser } from '@/api/user'
import { fetchTagDefinitions } from '@/api/tags'
import { getAvatarUrl, handleAvatarError } from '@/utils/avatar'

const authStore = useAuthStore()
const isAuthenticated = computed(() => authStore.isAuthenticated)
const currentUserId = computed(() => authStore.user?.userId)
const router = useRouter()

// 状态变量
const activeCategory = ref('recommended')
const searchQuery = ref('')
const allPosts = ref([])
const recommendedPosts = ref([])
const followingPosts = ref([])
const loading = ref(false)
const error = ref('')

// 收藏夹相关
const showFolderModal = ref(false)
const showCreateFolder = ref(false)
const currentFavoritePost = ref(null)
const favoriteFolders = ref([])
const newFolderName = ref('')

// Toast
const showToast = ref(false)
const toastText = ref('')

// 用户操作菜单
const showingMenu = ref(false)
const selectedUser = ref(null)

// 关注状态管理
const followingMap = ref(new Map())

// 标签映射
const tagMap = ref(new Map()) // 标签ID到名称的映射

// 本地存储状态管理（localStorage）
function getLocalLikeStatus(postId) {
  if (!isAuthenticated.value) return false
  const likes = JSON.parse(localStorage.getItem('userLikes') || '{}')
  return likes[postId] || false
}

function setLocalLikeStatus(postId, status) {
  const likes = JSON.parse(localStorage.getItem('userLikes') || '{}')
  likes[postId] = status
  localStorage.setItem('userLikes', JSON.stringify(likes))
}

function getLocalFavoriteStatus(postId) {
  if (!isAuthenticated.value) return false
  const favorites = JSON.parse(localStorage.getItem('userFavorites') || '{}')
  return favorites[postId] || false
}

function setLocalFavoriteStatus(postId, status) {
  const favorites = JSON.parse(localStorage.getItem('userFavorites') || '{}')
  favorites[postId] = status
  localStorage.setItem('userFavorites', JSON.stringify(favorites))
}

// 辅助函数：将Base64字符串转换为可用的图片URL
function formatImageUrl(imgString) {
  if (!imgString) return null
  // 如果已经是完整的data URL，直接返回
  if (imgString.startsWith('data:image')) {
    return imgString
  }
  // 如果是Base64字符串，添加前缀
  if (typeof imgString === 'string' && imgString.length > 0) {
    // 检查是否已经是Base64格式（不包含data:前缀）
    if (!imgString.startsWith('http://') && !imgString.startsWith('https://') && !imgString.startsWith('data:')) {
      // 假设是JPEG格式，如果需要可以检测实际格式
      return `data:image/jpeg;base64,${imgString}`
    }
    return imgString
  }
  return null
}

// 加载标签映射
async function loadTagMap() {
  try {
    const tags = await fetchTagDefinitions({ type: 'post' })
    const map = new Map()
    tags.forEach(tag => {
      const tagId = tag.tagId || tag.id || tag.tag_id
      const tagName = tag.name || tag.tagName || tag.tag_name
      if (tagId && tagName) {
        map.set(tagId, tagName)
      }
    })
    tagMap.value = map
  } catch (e) {
    console.error('加载标签失败:', e)
  }
}

// 将标签ID数组转换为标签名称字符串，每个标签前面加井号
function formatTags(tagIds) {
  if (!Array.isArray(tagIds) || tagIds.length === 0) {
    return ''
  }
  return tagIds.map(tagId => {
    const tagName = tagMap.value.get(tagId)
    const displayName = tagName || `标签${tagId}`
    return `#${displayName}`
  }).join(' ')
}

// 数据映射
function parsePostArray(res) {
  return Array.isArray(res) ? res : (res?.data && Array.isArray(res.data) ? res.data : [])
}

function mapBackendToView(raw) {
  const author = raw.user || raw.author || raw.creator || {}
  const images = Array.isArray(raw.images) ? raw.images : (raw.images ? [raw.images] : [])
  // 处理第一张图片，支持Base64格式
  let firstImage = null
  if (images.length > 0) {
    const img = images[0]
    if (typeof img === 'string') {
      firstImage = formatImageUrl(img)
    } else if (img && (img.url || img.path || img.data)) {
      firstImage = formatImageUrl(img.url || img.path || img.data)
    }
  }
  const postId = raw.postId ?? raw.id ?? raw._id
  
  return {
    id: postId,
    author: {
      id: author.id || author.userId || author.user_id || raw.authorId || raw.createdBy || raw.owner || null,
      avatar: raw.avatarUrl || author.avatar || author.photo || author.image || author.avatarUrl || null,
      name: raw.nickname || author.nickname || raw.username || author.name || author.username || '匿名',
      handle: raw.username || author.handle || author.username || (raw.nickname ? raw.nickname.replace(/\s+/g, '') : (author.nickname ? author.nickname.replace(/\s+/g, '') : '')),
      isFollowed: raw.isFollowed || author.isFollowed || false
    },
    time: raw.createdAt ? new Date(raw.createdAt).toLocaleString() : (raw.time || ''),
    location: raw.location || '',
    caption: raw.topic || raw.title || raw.caption || '', // 首页显示标题，不显示内容
    hashtags: formatTags(Array.isArray(raw.tags) ? raw.tags : (raw.tags ? [raw.tags] : [])), // 将标签ID转换为名称
    image: firstImage,
    likeCount: raw.likeCount ?? raw.likes ?? 0,
    liked: isAuthenticated.value ? getLocalLikeStatus(postId) : false,
    favorites: raw.favoriteCount ?? raw.favorites ?? raw.bookmarks ?? 0,
    commentCount: raw.commentCount ?? raw.commentsCount ?? raw.comment_count ?? (Array.isArray(raw.comments) ? raw.comments.length : (raw.commentNum ?? 0)),
    favorited: isAuthenticated.value ? getLocalFavoriteStatus(postId) : false
  }
}

// 加载推荐帖子（协同过滤）
async function loadRecommendedPosts() {
  const res = await getRecommendedPosts(50)
  const arr = parsePostArray(res)
  recommendedPosts.value = arr.map(mapBackendToView)
}

// 加载关注用户的帖子
async function loadFollowingPosts() {
  const res = await getPosts({ page: 1, limit: 100 })
  const arr = parsePostArray(res)
  allPosts.value = arr.map(mapBackendToView)
  followingPosts.value = allPosts.value.filter(p => p.author?.isFollowed)
}

// 加载探索页数据
async function loadExplore() {
  loading.value = true
  error.value = ''
  try {
    await loadRecommendedPosts()
    if (isAuthenticated.value) {
      await loadFollowingPosts()
    } else {
      allPosts.value = []
      followingPosts.value = []
    }
  } catch (e) {
    console.error('[DiscoverPage] 加载探索帖子失败', {
      error: e,
      message: e.message,
      stack: e.stack,
      response: e.response,
      request: e.request
    })
    if (e.message) {
      if (e.message.includes('401') || e.message.includes('未授权')) {
        error.value = '请先登录'
      } else if (e.message.includes('网络连接失败') || e.message.includes('ERR_CONNECTION_REFUSED')) {
        error.value = '无法连接到服务器，请检查后端服务是否运行'
      } else {
        error.value = `加载失败: ${e.message}`
      }
    } else {
      error.value = '加载失败，请稍后重试'
    }
    allPosts.value = []
    recommendedPosts.value = []
    followingPosts.value = []
  } finally {
    loading.value = false
  }
}

// 加载收藏夹
async function loadFavoriteFolders() {
  if (!isAuthenticated.value || !currentUserId.value) return
  
  try {
    const res = await getFavoriteFolders(currentUserId.value)
    const arr = Array.isArray(res) ? res : (res?.data && Array.isArray(res.data) ? res.data : [])
    favoriteFolders.value = arr
  } catch (e) {
    console.error('加载收藏夹失败', e)
    favoriteFolders.value = []
  }
}

// 导航相关
function openPost(id) {
  router.push({ name: 'post', params: { id } })
}

function goToUserDetail(userId) {
  router.push({ name: 'user', params: { id: userId } })
}

function handleFollowingClick() {
  if (!isAuthenticated.value) {
    router.push('/login')
  } else {
    activeCategory.value = 'following'
  }
}

// 过滤帖子
const filteredPosts = computed(() => {
  const category = (!isAuthenticated.value || activeCategory.value === 'recommended') ? 'recommended' : 'following'
  let posts = category === 'recommended' ? recommendedPosts.value : followingPosts.value
  
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    posts = posts.filter(post => 
      post.caption.toLowerCase().includes(query) || 
      post.hashtags.toLowerCase().includes(query) ||
      post.author.name.toLowerCase().includes(query)
    )
  }
  
  return posts
})

// Toast 提示
function showToastMessage(message) {
  toastText.value = message
  showToast.value = true
  setTimeout(() => { showToast.value = false }, 1500)
}

// 显示用户菜单
function showUserMenu(user) {
  if (showingMenu.value && selectedUser.value && selectedUser.value.id === user.id) {
    // 如果点击的是同一个用户，关闭菜单
    showingMenu.value = false
    selectedUser.value = null
  } else {
    // 显示菜单并记录当前选中的用户
    showingMenu.value = true
    selectedUser.value = user
  }
}

// 检查是否关注用户
function isFollowingUser(userId) {
  return followingMap.value.get(userId) || false
}

// 关注/取消关注用户
async function toggleFollow(userId) {
  if (!isAuthenticated.value) {
    showToastMessage('请先登录')
    setTimeout(() => router.push('/login'), 800)
    return
  }

  try {
    const isCurrentlyFollowing = isFollowingUser(userId)
    
    if (isCurrentlyFollowing) {
      await unfollowUser(userId)
      followingMap.value.set(userId, false)
      showToastMessage('已取消关注')
    } else {
      await followUser(userId)
      followingMap.value.set(userId, true)
      showToastMessage('关注成功')
    }
    
    // 关闭菜单
    showingMenu.value = false
    selectedUser.value = null
  } catch (error) {
    console.error('关注操作失败:', error)
    showToastMessage('操作失败，请重试')
  }
}

// 点赞功能
async function toggleLike(post) {
  if (!isAuthenticated.value) {
    showToastMessage('请先登录')
    setTimeout(() => router.push('/login'), 800)
    return
  }

  if (post.likeCount === undefined) post.likeCount = 0
  if (post.liked === undefined) post.liked = false

  const wasLiked = post.liked
  const wasLikeCount = post.likeCount

  try {
    if (post.liked) {
      post.liked = false
      post.likeCount = Math.max(0, post.likeCount - 1)
      await unlikePost(post.id, currentUserId.value)
      setLocalLikeStatus(post.id, false)
      showToastMessage('已取消点赞')
    } else {
      post.liked = true
      post.likeCount = (post.likeCount || 0) + 1
      await likePost(post.id, currentUserId.value)
      setLocalLikeStatus(post.id, true)
      showToastMessage('点赞成功')
    }
    
    await refreshPostData(post.id)
    // 点赞行为会影响协同过滤结果，刷新推荐列表
    if (activeCategory.value === 'recommended') {
      loadRecommendedPosts().catch(err => console.error('刷新推荐列表失败', err))
    }
  } catch (error) {
    console.error('点赞操作失败', error)
    post.liked = wasLiked
    post.likeCount = wasLikeCount
    showToastMessage('操作失败，请重试')
  }
}

// 刷新帖子数据
function updatePostInLists(newPostData) {
  const postId = newPostData.id
  const lists = [allPosts, recommendedPosts, followingPosts]
  for (const list of lists) {
    const index = list.value.findIndex(p => p.id === postId)
    if (index !== -1) {
      list.value[index] = newPostData
    }
  }
}

async function refreshPostData(postId) {
  try {
    const res = await getPost(postId)
    const raw = res?.data || res
    if (raw) {
      updatePostInLists(mapBackendToView(raw))
    }
  } catch (error) {
    console.error('刷新帖子数据失败', error)
  }
}

// 收藏夹功能
async function openFolderModal(post) {
  if (!isAuthenticated.value) {
    showToastMessage('请先登录')
    setTimeout(() => router.push('/login'), 800)
    return
  }

  currentFavoritePost.value = post
  await loadFavoriteFolders()
  showFolderModal.value = true
}

function closeFolderModal() {
  showFolderModal.value = false
  currentFavoritePost.value = null
}

async function saveToFolder(folderId) {
  if (!currentFavoritePost.value) return
  
  const postId = currentFavoritePost.value.id

  try {
    await addPostToFavorites(currentUserId.value, postId, folderId)
    currentFavoritePost.value.favorites = (currentFavoritePost.value.favorites || 0) + 1
    currentFavoritePost.value.favorited = true
    setLocalFavoriteStatus(postId, true)
    showToastMessage('收藏成功')
    closeFolderModal()
    await refreshPostData(postId)
  } catch (error) {
    console.error('收藏失败', error)
    showToastMessage('收藏失败，请重试')
  }
}

async function createNewFolder() {
  if (!newFolderName.value.trim()) {
    showToastMessage('请输入收藏夹名称')
    return
  }

  try {
    const res = await createFavoriteFolder(currentUserId.value, newFolderName.value.trim())
    const folder = res?.data || res
    if (folder && folder.folderId) {
      favoriteFolders.value.push(folder)
      showToastMessage('创建成功')
      newFolderName.value = ''
      showCreateFolder.value = false
      
      if (currentFavoritePost.value) {
        await saveToFolder(folder.folderId)
      }
    }
  } catch (error) {
    console.error('创建收藏夹失败', error)
    showToastMessage('创建失败，请重试')
  }
}

// 监听登录状态
watch(isAuthenticated, (newVal) => {
  if (!newVal) {
    activeCategory.value = 'recommended'
    followingPosts.value = []
  } else {
    loadFollowingPosts().catch(err => console.error('加载关注帖子失败', err))
    loadRecommendedPosts().catch(err => console.error('刷新推荐帖子失败', err))
  }
})

// 初始化
onMounted(async () => {
  // 先加载标签映射，然后再加载帖子
  await loadTagMap()
  loadExplore()
  if (isAuthenticated.value) {
    loadFavoriteFolders()
  }
  
  // 添加点击外部关闭菜单的监听器
  document.addEventListener('click', handleClickOutside)
})

// 清理监听器
onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})

// 处理点击外部关闭菜单
function handleClickOutside(event) {
  if (showingMenu.value && selectedUser.value) {
    const userAvatarElements = document.querySelectorAll('.user-avatar-container')
    let clickedOnAvatar = false
    
    userAvatarElements.forEach(element => {
      if (element.contains(event.target)) {
        clickedOnAvatar = true
      }
    })
    
    if (!clickedOnAvatar) {
      showingMenu.value = false
      selectedUser.value = null
    }
  }
}
</script>

<style scoped>
.explore-page {
  max-width: 100%;
  margin: 0;
  width: 100%;
}

.page-title {
  font-size: 32px;
  font-weight: bold;
  color: #333333;
  margin-top: 50px;
  margin-bottom: 1px;
  padding-left: 0;
}

/* 模态框样式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 16px;
  padding: 24px;
  min-width: 400px;
  max-width: 500px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
}

.modal-title {
  font-size: 20px;
  font-weight: 600;
  color: #333;
  margin-bottom: 20px;
}

.folder-list {
  max-height: 400px;
  overflow-y: auto;
  margin-bottom: 16px;
}

.folder-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s;
}

.folder-item:hover {
  background: #f5f5f5;
}

.folder-item.create-folder {
  color: #8b5cf6;
  font-weight: 500;
}

.folder-item .iconify {
  font-size: 20px;
}

.folder-input {
  width: 100%;
  padding: 12px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 14px;
  margin-bottom: 16px;
}

.folder-input:focus {
  outline: none;
  border-color: #8b5cf6;
}

.modal-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.modal-btn {
  padding: 10px 24px;
  border-radius: 8px;
  border: none;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.modal-btn.cancel {
  background: #f5f5f5;
  color: #666;
}

.modal-btn.cancel:hover {
  background: #e0e0e0;
}

.modal-btn.confirm {
  background: #8b5cf6;
  color: white;
}

.modal-btn.confirm:hover {
  background: #7c3aed;
}

.modal-close-btn {
  width: 100%;
  padding: 10px;
  border-radius: 8px;
  border: none;
  background: #f5f5f5;
  color: #666;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.modal-close-btn:hover {
  background: #e0e0e0;
}

/* 头部区域，跟随 main-content 宽度，不再脱离文档流 */
.category-search-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 40px;
}

.categories {
  display: flex;
  gap: 10px;
}

.category-btn {
  padding: 10px 20px;
  border-radius: 20px;
  background: #f0f0f0;
  border: none;
  color: #333333;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.2s;
}

.category-btn:hover {
  background: #e0e0e0;
}

.category-btn.active {
  background: #8b5cf6;
  color: #ffffff;
}

.search-container {
  position: relative;
}

.search-input {
  width: 200px;
  padding: 10px 40px 10px 15px;
  border-radius: 20px;
  background: #f0f0f0;
  border: 1px solid #e0e0e0;
  color: #333333;
  font-size: 14px;
}

.search-input:focus {
  outline: none;
  background: #ffffff;
  border-color: #8b5cf6;
}

.search-btn {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: #666666;
  cursor: pointer;
}

/* 帖子网格 */
.posts-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
  margin-top: 40px;
  padding-bottom: 40px;
  padding-left: 40px;
  padding-right: 40px;
}

.post-card {
  background-color: #ffffff;
  border-radius: 12px;
  padding: 20px;
  transition: all 0.2s;
  border: 1px solid #e0e0e0;
  text-decoration: none;
  color: inherit;
  display: block;
}

.post-card:hover {
  background-color: #f9f9f9;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.05);
}

.post-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 16px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
}

.user-details {
  display: flex;
  flex-direction: column;
}

.username {
  font-weight: 600;
  color: #333333;
  font-size: 16px;
}

.user-handle {
  color: #666666;
  font-size: 14px;
}

.post-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.timestamp, .location {
  color: #999999;
  font-size: 12px;
  margin-bottom: 2px;
}

.post-content {
  margin-bottom: 16px;
}

.post-caption {
  color: #333333;
  font-size: 14px;
  line-height: 1.5;
  margin-bottom: 8px;
}

.hashtags {
  color: #8b5cf6;
  font-size: 12px;
}

.post-image {
  margin-bottom: 16px;
}

.post-image img {
  width: 100%;
  border-radius: 8px;
  max-height: 400px;
  object-fit: cover;
}

.post-actions {
  display: flex;
  gap: 20px;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  background: none;
  border: none;
  color: #666666;
  font-size: 14px;
  cursor: pointer;
  transition: color 0.2s;
}

.action-btn:hover {
  color: #333333;
}

.action-btn .iconify {
  font-size: 18px;
}

.action-btn.liked {
  color: #ef4444;
}

.action-btn.favorited {
  color: #10b981;
}

/* 用户头像和菜单样式 */
.user-avatar-container {
  position: relative;
  cursor: pointer;
  display: inline-block;
}

.user-menu {
  position: absolute;
  top: 100%;
  left: 0;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 100;
  min-width: 120px;
  margin-top: 8px;
}

.user-menu::before {
  content: '';
  position: absolute;
  top: -8px;
  left: 12px;
  width: 0;
  height: 0;
  border-left: 8px solid transparent;
  border-right: 8px solid transparent;
  border-bottom: 8px solid white;
}

.menu-item {
  padding: 10px 16px;
  cursor: pointer;
  font-size: 14px;
  color: #333;
  transition: background-color 0.2s;
}

.menu-item:hover {
  background-color: #f5f5f5;
}

/* 添加第一个菜单项的上边框圆角 */
.menu-item:first-child {
  border-top-left-radius: 8px;
  border-top-right-radius: 8px;
}

/* 添加最后一个菜单项的下边框圆角 */
.menu-item:last-child {
  border-bottom-left-radius: 8px;
  border-bottom-right-radius: 8px;
}

.toast {
  position: fixed;
  top: 90px;
  right: 40px;
  background: rgba(17, 24, 39, 0.95);
  color: #fff;
  padding: 12px 20px;
  border-radius: 8px;
  box-shadow: 0 6px 18px rgba(15, 23, 42, 0.25);
  z-index: 200;
}

.loading-message,
.error-message,
.empty-message {
  text-align: center;
  padding: 60px 20px;
  color: #666;
  font-size: 16px;
  margin-top: 100px;
}

.error-message {
  color: #ef4444;
}

/* 移动端图片预览：桌面端/平板端隐藏 */
/* Mobile image preview: hidden on desktop/tablet */
.post-image-mobile {
  display: none;
}

/* ========== 手机端响应式样式（≤640px） ========== */
/* Phone responsive styles (≤640px) */
@media (max-width: 640px) {
  /* 头部区域压缩 */
  /* Compact header area */
  .category-search-container {
    padding: 10px 12px;
    flex-wrap: wrap;
    gap: 10px;
  }

  .categories {
    gap: 6px;
    width: 100%;
  }

  .category-btn {
    padding: 8px 14px;
    font-size: 14px;
    border-radius: 16px;
    flex: 1;
    text-align: center;
    min-height: 40px; /* 增大触摸目标 / Larger touch target */
  }

  .search-container {
    width: 100%;
  }

  .search-input {
    width: 100%;
    font-size: 16px; /* 防止iOS自动缩放 / Prevent iOS auto-zoom */
    padding: 10px 40px 10px 14px;
    min-height: 42px;
  }

  .search-btn {
    right: 12px;
  }

  /* 帖子网格 → 单列布局 */
  /* Post grid → single column */
  .posts-grid {
    grid-template-columns: 1fr;
    gap: 12px;
    margin-top: 12px;
    padding-left: 10px;
    padding-right: 10px;
    padding-bottom: 80px; /* 底部导航栏空间 / Space for bottom nav */
  }

  /* 帖子卡片优化 */
  /* Post card optimization */
  .post-card {
    padding: 14px;
    border-radius: 10px;
    border: 1px solid #eee;
  }

  /* 帖子头部 */
  /* Post header */
  .post-header {
    margin-bottom: 10px;
  }

  .user-info {
    gap: 10px;
  }

  .user-avatar {
    width: 36px;
    height: 36px;
  }

  .username {
    font-size: 15px;
  }

  .user-handle {
    font-size: 13px;
  }

  .timestamp, .location {
    font-size: 11px;
  }

  /* 帖子内容 */
  /* Post content */
  .post-content {
    margin-bottom: 10px;
  }

  .post-caption {
    font-size: 13px;
    line-height: 1.5;
  }

  .hashtags {
    font-size: 11px;
  }

  /* 移动端显示图片预览 */
  /* Show image preview on mobile */
  .post-image-mobile {
    display: block;
    margin-bottom: 10px;
  }

  .post-image-mobile img {
    width: 100%;
    border-radius: 8px;
    max-height: 240px;
    object-fit: cover;
  }

  /* 互动按钮增大触摸区域 */
  /* Larger touch targets for action buttons */
  .post-actions {
    gap: 12px;
    justify-content: space-around;
  }

  .action-btn {
    padding: 8px 10px;
    gap: 6px;
    font-size: 13px;
    min-height: 40px; /* 最小44px触摸目标 / Min 44px touch target */
    min-width: 44px;
  }

  .action-btn .iconify {
    font-size: 20px;
  }

  /* 弹窗适配 */
  /* Modal adaptation */
  .modal-content {
    min-width: auto;
    max-width: 90vw;
    padding: 20px 16px;
    border-radius: 14px;
  }

  .modal-title {
    font-size: 18px;
  }

  .folder-item {
    padding: 14px 12px;
  }

  .folder-input {
    font-size: 16px; /* 防止iOS自动缩放 / Prevent iOS auto-zoom */
    padding: 12px;
  }

  .modal-btn {
    padding: 10px 20px;
    font-size: 14px;
  }

  /* Toast提示适配 */
  /* Toast notification adaptation */
  .toast {
    top: 70px;
    right: 16px;
    left: 16px;
    text-align: center;
    padding: 10px 16px;
    font-size: 14px;
  }

  /* 空状态/加载状态 */
  /* Empty/loading states */
  .loading-message,
  .error-message,
  .empty-message {
    padding: 40px 16px;
    font-size: 14px;
    margin-top: 60px;
  }
}

/* ========== 小屏手机进一步优化（≤380px） ========== */
/* Small phone further optimization (≤380px) */
@media (max-width: 380px) {
  .category-btn {
    padding: 6px 10px;
    font-size: 13px;
    min-height: 36px;
  }

  .post-card {
    padding: 12px;
  }

  .post-actions {
    gap: 8px;
  }

  .action-btn {
    font-size: 12px;
    gap: 4px;
  }

  .action-btn .iconify {
    font-size: 18px;
  }
}
</style>