<template>
  <div class="user-detail-page">
    <div class="back-button" @click="goBack">
      <span class="iconify" data-icon="mdi:arrow-left" data-inline="false"></span>
      返回
    </div>
    
    <!-- 用户资料卡片 -->
    <div class="profile-card">
      <img :src="getAvatarUrl()" :alt="userInfo?.nickname" class="profile-avatar" @error="handleAvatarError">
      <h2 class="profile-name">{{ userInfo?.nickname || userInfo?.username || '用户' }}</h2>
      <p class="profile-handle">@{{ userInfo?.username || 'username' }}</p>
      <p class="profile-bio">{{ userInfo?.bio || '暂无简介' }}</p>
      
      <div class="profile-stats">
        <div class="stat-item">
          <span class="stat-number">{{ userStats?.posts || 0 }}</span>
          <span class="stat-label">帖子</span>
        </div>
        <div class="stat-item">
          <span class="stat-number">{{ userStats?.followers || 0 }}</span>
          <span class="stat-label">粉丝</span>
        </div>
        <div class="stat-item">
          <span class="stat-number">{{ userStats?.following || 0 }}</span>
          <span class="stat-label">关注</span>
        </div>
      </div>
      
      <!-- 关注/取消关注按钮和聊天按钮 -->
      <div v-if="currentUserId !== userId.value" class="action-buttons">
        <!-- 如果已关注，显示"已关注"按钮和"聊天"按钮 -->
        <template v-if="isFollowing">
          <button 
            :class="['follow-button', 'following']"
            @click="toggleFollow"
          >
            已关注
          </button>
          <button 
            class="chat-button"
            @click="startChat"
          >
            <span class="iconify" data-icon="mdi:message-text-outline" data-inline="false"></span>
            去聊天
          </button>
        </template>
        <!-- 如果未关注，只显示"未关注"按钮 -->
        <button 
          v-else
          class="follow-button"
          @click="toggleFollow"
        >
          未关注
        </button>
        <button
          class="follow-button report-button"
          @click="handleReportUser"
        >
          举报用户
        </button>
      </div>
    </div>
    
    <!-- 用户最近帖子 -->
    <h3 class="posts-title">最近帖子</h3>
    <div v-if="loadingPosts" class="loading-message">加载中...</div>
    <div v-else-if="userPosts.length === 0" class="empty-message">暂无帖子</div>
    <div v-else class="posts-grid">
      <router-link 
        v-for="post in userPosts" 
        :key="post.id" 
        :to="{ name: 'post', params: { id: post.id } }" 
        class="post-card post-link"
      >
        <!-- 帖子内容 -->
        <div class="post-content">
          <p class="post-caption">{{ post.caption }}</p>
          <div class="hashtags">{{ post.hashtags }}</div>
        </div>
        
        <!-- 图片 -->
        <div class="post-image" v-if="post.image">
          <img :src="post.image" :alt="post.caption" class="w-full rounded-lg">
        </div>
        
        <!-- 互动数据 -->
        <div class="post-stats">
          <span>{{ post.likeCount || 0 }} 点赞</span>
          <span>{{ post.commentCount || 0 }} 评论</span>
        </div>
      </router-link>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { getUserInfo, followUser, unfollowUser, checkFollowing, getUserStats, reportUser } from '@/api/user'
import { getUserPosts } from '@/api/posts'
import { fetchTagDefinitions } from '@/api/tags'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const userId = ref(Number(route.params.id))
const currentUserId = ref(authStore.userId)
const userInfo = ref(null)
const userStats = ref(null)
const userPosts = ref([])
const followingMap = ref(new Map()) // 使用Map存储关注状态，参考DiscoverPage和PostDetail
const loadingPosts = ref(false)
const tagMap = ref(new Map()) // 存储标签ID到标签名称的映射

// 计算属性：判断当前用户是否关注了该用户
const isFollowing = computed(() => {
  const id = userId.value || Number(route.params.id)
  return followingMap.value.get(id) || false
})

async function handleReportUser() {
  if (!currentUserId.value) {
    alert('请先登录')
    return
  }
  const reason = prompt('请输入举报原因', '骚扰辱骂')
  if (!reason) return
  try {
    await reportUser(userId.value, { reason })
    alert('举报成功，已提交管理员审核')
  } catch (error) {
    alert(error?.message || '举报失败，请重试')
  }
}

// 生成文字头像（显示用户名字前两个字）
function generateTextAvatar(name) {
  if (!name) return null
  
  // 获取名字前两个字
  const text = name.length >= 2 ? name.substring(0, 2) : name.substring(0, 1)
  
  // 创建 canvas 生成头像
  const canvas = document.createElement('canvas')
  canvas.width = 120
  canvas.height = 120
  const ctx = canvas.getContext('2d')
  
  // 生成随机背景色（基于名字的哈希值）
  const colors = [
    '#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', 
    '#ef4444', '#ec4899', '#06b6d4', '#6366f1'
  ]
  const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  const bgColor = colors[hash % colors.length]
  
  // 绘制背景
  ctx.fillStyle = bgColor
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  
  // 绘制文字
  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 48px Arial, sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(text, canvas.width / 2, canvas.height / 2)
  
  return canvas.toDataURL()
}

// 获取头像 URL
function getAvatarUrl() {
  const avatar = userInfo.value?.avatar || userInfo.value?.avatarUrl
  if (avatar) {
    return avatar
  }
  
  // 如果没有头像，生成文字头像
  const name = userInfo.value?.nickname || userInfo.value?.username || '用户'
  return generateTextAvatar(name)
}

// 处理头像加载错误
function handleAvatarError(event) {
  // 如果头像加载失败，生成文字头像
  const name = userInfo.value?.nickname || userInfo.value?.username || '用户'
  const textAvatar = generateTextAvatar(name)
  if (textAvatar) {
    event.target.src = textAvatar
  }
}

// 加载标签映射（同时加载用户标签和帖子标签）
const loadTagMap = async () => {
  try {
    // 加载用户标签和帖子标签
    const [userTagsResult, postTagsResult] = await Promise.all([
      fetchTagDefinitions({ type: 'user' }),
      fetchTagDefinitions({ type: 'post' })
    ])
    
    const map = new Map()
    
    // 合并两种类型的标签
    const allTags = userTagsResult.concat(postTagsResult)
    allTags.forEach(tag => {
      const tagId = tag.tagId || tag.id || tag.tag_id
      const tagName = tag.name || tag.tagName || tag.tag_name
      if (tagId && tagName) {
        // 确保 tagId 是数字类型，以便正确匹配
        const numericId = typeof tagId === 'string' ? parseInt(tagId) : tagId
        if (!isNaN(numericId)) {
          map.set(numericId, tagName)
          // 同时存储字符串类型的ID，以防万一
          if (typeof tagId === 'string') {
            map.set(tagId, tagName)
          }
        }
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
    // 尝试多种方式查找标签名称
    let tagName = tagMap.value.get(tagId)
    if (!tagName) {
      // 尝试数字类型
      const numericId = typeof tagId === 'string' ? parseInt(tagId) : tagId
      if (!isNaN(numericId)) {
        tagName = tagMap.value.get(numericId)
      }
    }
    const displayName = tagName || `标签${tagId}`
    return `#${displayName}`
  }).join(' ')
}

// 映射后端Post数据到前端视图模型
function mapBackendToView(raw) {
  const postId = raw.postId ?? raw.id ?? raw._id
  const author = raw.user || raw.author || raw.creator || {}
  
  return {
    id: postId,
    userId: raw.userId ?? raw.user_id ?? author.id ?? author.userId ?? author.user_id ?? null,
    caption: raw.topic || raw.title || raw.caption || raw.content || '',
    hashtags: formatTags(raw.tags || []), // 使用formatTags函数处理标签
    image: Array.isArray(raw.images) && raw.images.length > 0 ? raw.images[0] : null,
    likeCount: raw.likeCount ?? raw.likes ?? 0,
    commentCount: raw.commentCount ?? raw.commentsCount ?? raw.comment_count ?? 0
  }
}

// 获取用户信息
const loadUserInfo = async () => {
  try {
    console.log('加载用户信息，用户ID:', userId.value)
    const info = await getUserInfo(userId.value)
    console.log('获取到的用户信息:', info)
    userInfo.value = info?.data || info
    console.log('设置后的用户信息:', userInfo.value)
  } catch (error) {
    console.error('加载用户信息失败:', error)
    // 如果加载失败，显示错误提示
    alert('加载用户信息失败: ' + (error.message || '未知错误'))
  }
}

// 获取用户统计数据
const loadUserStats = async () => {
  try {
    const id = userId.value || Number(route.params.id)
    if (!id || isNaN(id)) {
      console.error('用户ID无效:', id)
      return
    }
    const stats = await getUserStats(id)
    userStats.value = stats?.data || stats
  } catch (error) {
    console.error('加载用户统计数据失败:', error)
  }
}

// 获取用户帖子
const loadUserPosts = async () => {
  loadingPosts.value = true
  try {
    const id = userId.value || Number(route.params.id)
    if (!id || isNaN(id)) {
      console.error('用户ID无效:', id)
      userPosts.value = []
      return
    }
    console.log('加载用户帖子，用户ID:', id)
    
    // 调用API获取用户发布的帖子（后端会返回该用户发布的帖子）
    const posts = await getUserPosts(id)
    console.log('API返回的帖子数据:', posts)
    
    // 确保返回的是数组
    const postList = Array.isArray(posts) ? posts : (posts?.data && Array.isArray(posts.data) ? posts.data : [])
    console.log('解析后的帖子列表:', postList)
    
    // 映射后端数据到前端视图模型，并过滤确保只显示该用户发布的帖子
    const mappedPosts = postList
      .map(mapBackendToView)
      .filter(post => {
        // 确保帖子属于该用户（后端应该已经过滤了，但这里再次确认）
        const postUserId = post.userId ?? post.user_id
        const matches = postUserId === id
        if (!matches) {
          console.warn('过滤掉不属于该用户的帖子:', { postUserId, targetUserId: id, post })
        }
        return matches
      })
    
    userPosts.value = mappedPosts
    console.log('最终显示的帖子列表:', userPosts.value)
  } catch (error) {
    console.error('加载用户帖子失败:', error)
    
    // 尝试从本地存储获取
    try {
      const id = userId.value || Number(route.params.id)
      const raw = localStorage.getItem(`posts_user_${id}`)
      if (raw) {
        const localPosts = JSON.parse(raw)
        const mappedPosts = localPosts
          .map(mapBackendToView)
          .filter(post => {
            const postUserId = post.userId ?? post.user_id
            return postUserId === id
          })
        userPosts.value = mappedPosts
        console.log('从本地存储获取用户帖子:', id, userPosts.value)
      } else {
        userPosts.value = []
      }
    } catch (localError) {
      console.error('从本地存储加载用户帖子失败:', localError)
      userPosts.value = []
    }
  } finally {
    loadingPosts.value = false
  }
}

// 检查关注状态
const checkFollowStatus = async () => {
  try {
    const id = userId.value || Number(route.params.id)
    if (!id || isNaN(id)) {
      console.error('用户ID无效:', id)
      return
    }
    console.log('开始检查关注状态，用户ID:', id, '当前用户ID:', currentUserId.value)
    
    // 如果查看的是自己的页面，不需要检查关注状态
    if (currentUserId.value && id === currentUserId.value) {
      console.log('查看自己的页面，跳过关注状态检查')
      return
    }
    
    const result = await checkFollowing(id)
    console.log('checkFollowing API返回结果:', result)
    
    // 处理不同的响应格式
    let isFollowing = false
    if (result?.data?.isFollowing !== undefined) {
      isFollowing = result.data.isFollowing
    } else if (result?.isFollowing !== undefined) {
      isFollowing = result.isFollowing
    } else if (result?.data !== undefined && typeof result.data === 'boolean') {
      isFollowing = result.data
    }
    
    followingMap.value.set(id, isFollowing)
    console.log('检查关注状态结果:', id, isFollowing, followingMap.value)
  } catch (error) {
    console.error('检查关注状态失败:', error)
    
    // 尝试从本地存储获取关注状态
    try {
      const id = userId.value || Number(route.params.id)
      const followingData = JSON.parse(localStorage.getItem('followingMap') || '{}')
      const isFollowing = followingData[id] || false
      followingMap.value.set(id, isFollowing)
      console.log('从本地存储获取关注状态:', id, isFollowing, followingMap.value)
    } catch (localError) {
      console.error('从本地存储加载关注状态失败:', localError)
      const id = userId.value || Number(route.params.id)
      followingMap.value.set(id, false)
      console.log('检查关注状态失败，设置为false:', id, followingMap.value)
    }
  }
}

// 关注/取消关注
const toggleFollow = async () => {
  try {
    const targetUserId = userId.value || Number(route.params.id)
    if (!targetUserId || isNaN(targetUserId)) {
      console.error('目标用户ID无效:', targetUserId)
      return
    }
    const isCurrentlyFollowing = followingMap.value.get(targetUserId) || false
    
    if (isCurrentlyFollowing) {
      await unfollowUser(targetUserId)
      followingMap.value.set(targetUserId, false)
      if (userStats.value) {
        userStats.value.followers = Math.max(0, (userStats.value.followers || 0) - 1)
      }
    } else {
      await followUser(targetUserId)
      followingMap.value.set(targetUserId, true)
      if (userStats.value) {
        userStats.value.followers = (userStats.value.followers || 0) + 1
      }
    }
    
    // 将关注状态保存到本地存储
    try {
      const followingData = {};
      followingMap.value.forEach((value, key) => {
        followingData[key] = value;
      });
      localStorage.setItem('followingMap', JSON.stringify(followingData));
      console.log('关注状态已保存到本地存储:', followingData);
    } catch (localError) {
      console.error('保存关注状态到本地存储失败:', localError);
    }
  } catch (error) {
    console.error('关注操作失败:', error)
    
    // 如果API调用失败，仍然更新本地状态和UI
    const targetUserId = userId.value || Number(route.params.id)
    const isCurrentlyFollowing = followingMap.value.get(targetUserId) || false
    
    // 反转当前状态
    const newStatus = !isCurrentlyFollowing
    followingMap.value.set(targetUserId, newStatus)
    if (userStats.value) {
      userStats.value.followers = newStatus 
        ? (userStats.value.followers || 0) + 1 
        : Math.max(0, (userStats.value.followers || 0) - 1)
    }
    
    console.log('API调用失败，已更新本地状态:', targetUserId, newStatus, followingMap.value)
  }
}

// 开始聊天
const startChat = () => {
  const targetUserId = userId.value || Number(route.params.id)
  router.push({ name: 'chat', params: { userId: targetUserId } })
}

// 返回上一页
const goBack = () => {
  router.go(-1)
}

// 初始化
onMounted(async () => {
  const id = route.params.id
  console.log('UserDetailPage onMounted, 路由参数id:', id, '类型:', typeof id)
  
  if (!id || (typeof id === 'string' && isNaN(Number(id)))) {
    console.error('无效的用户ID:', id)
    router.push('/discover')
    return
  }
  
  const numId = Number(id)
  console.log('转换后的用户ID:', numId)
  
  // 确保userId被正确设置
  userId.value = numId
  
  // 确保currentUserId被正确设置
  if (authStore.userId) {
    currentUserId.value = authStore.userId
  }
  
  // 先加载用户信息和统计数据
  await Promise.all([
    loadTagMap(), // 先加载标签映射
    loadUserInfo(),
    loadUserStats(),
    loadUserPosts()
  ])
  
  // 然后检查关注状态（需要确保用户已登录）
  if (currentUserId.value && currentUserId.value !== numId) {
    await checkFollowStatus()
  } else {
    console.log('未登录或查看自己的页面，跳过关注状态检查')
  }
})
</script>

<style scoped>
.user-detail-page {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.back-button {
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(139, 92, 246, 0.1);
  border: 1px solid rgba(139, 92, 246, 0.3);
  border-radius: 8px;
  color: #8b5cf6;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  margin-bottom: 20px;
  padding: 8px 16px;
  transition: all 0.2s;
}

.back-button:hover {
  background: rgba(139, 92, 246, 0.2);
  border-color: rgba(139, 92, 246, 0.5);
  color: #a78bfa;
}

.back-button .iconify {
  font-size: 20px;
}

.profile-card {
  background-color: #1a1a1a;
  border-radius: 12px;
  padding: 24px;
  text-align: center;
  margin-bottom: 30px;
}

.profile-avatar {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  object-fit: cover;
  margin-bottom: 16px;
}

.profile-name {
  font-size: 24px;
  font-weight: bold;
  color: #ffffff;
  margin: 0 0 4px 0;
}

.profile-handle {
  color: #888888;
  font-size: 16px;
  margin: 0 0 12px 0;
}

.profile-bio {
  color: #ffffff;
  font-size: 14px;
  line-height: 1.5;
  margin: 0 0 20px 0;
}

.profile-stats {
  display: flex;
  justify-content: center;
  gap: 40px;
  margin-bottom: 20px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-number {
  font-size: 20px;
  font-weight: bold;
  color: #ffffff;
}

.stat-label {
  font-size: 14px;
  color: #888888;
  margin-top: 4px;
}

.action-buttons {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  flex-wrap: wrap;
}

.follow-button {
  background-color: #8b5cf6;
  color: #ffffff;
  border: none;
  padding: 10px 24px;
  border-radius: 20px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;
}

.follow-button:hover {
  background-color: #7c3aed;
}

.follow-button.following {
  background-color: #333333;
  color: #ffffff;
}

.follow-button.following:hover {
  background-color: #444444;
}

.chat-button {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background-color: #1a1a1a;
  color: #8b5cf6;
  border: 1px solid #8b5cf6;
  padding: 10px 24px;
  border-radius: 20px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.chat-button:hover {
  background-color: #8b5cf6;
  color: #ffffff;
}

.posts-title {
  font-size: 20px;
  font-weight: bold;
  color: #ffffff;
  margin-bottom: 20px;
}

.posts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}

.post-card {
  background-color: #1a1a1a;
  border-radius: 12px;
  padding: 16px;
  transition: transform 0.2s;
}

.post-card:hover {
  transform: translateY(-4px);
}

.post-caption {
  color: #ffffff;
  font-size: 14px;
  margin-bottom: 12px;
}

.post-image {
  margin-bottom: 12px;
}

.post-stats {
  display: flex;
  justify-content: space-between;
  color: #888888;
  font-size: 14px;
}

.loading-message, .empty-message {
  text-align: center;
  color: #888888;
  padding: 40px 0;
}
</style>
