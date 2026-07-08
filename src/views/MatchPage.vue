<template>
  <div class="flex match-page">
    <!-- 今日推荐区域，稍微窄一点 -->
    <div class="flex-[1.2]">
      <div class="bg-white/40 border border-gray-300/50 rounded-xl p-8 mb-6">
        <h3 class="text-xl mb-6">今日推荐</h3>
        
        <!-- 冷启动提示：未填写问卷时显示 -->
        <div v-if="!hasQuestionnaire && !checkingQuestionnaire" class="mb-6 p-4 bg-amber-50 border border-amber-300 rounded-lg flex items-start gap-3">
          <span class="iconify text-2xl text-amber-500 flex-shrink-0 mt-0.5" data-icon="mdi:lightbulb-outline" data-inline="false"></span>
          <div class="flex-1">
            <p class="text-sm font-medium text-amber-800">你还未完成匹配问卷</p>
            <p class="text-xs text-amber-700 mt-1">现在先根据同城和年龄为你推荐，完成问卷后推荐会更精准，还能喜欢和对方聊天。</p>
            <button
              @click="goToQuestionnaire"
              class="mt-3 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all"
            >
              去填写问卷
            </button>
          </div>
        </div>

        <!-- 加载状态 -->
        <div v-if="isLoading" class="text-center py-12">
          <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mb-4"></div>
          <p class="text-gray-600">正在加载用户信息...</p>
        </div>
        
        <!-- 空状态 -->
        <div v-else-if="matches.length === 0" class="text-center py-12">
          <span class="iconify text-4xl text-gray-400 mb-4 block" data-icon="mdi:account-search" data-inline="false"></span>
          <p class="text-gray-600">暂无推荐用户</p>
          <p class="text-sm text-gray-500 mt-2">目前还没有已完成问卷的用户，请稍后再试</p>
        </div>
        
        <!-- 用户卡片 -->
        <div 
          v-else
          id="match-card" 
          class="match-card relative rounded-xl overflow-hidden shadow-lg h-96 mb-6 group"
          :class="cardClass"
        >
          <img 
            :src="getUserAvatar(currentMatch)" 
            :alt="currentMatch?.name || '用户'" 
            class="w-full h-full object-cover transition-opacity duration-300 group-hover:opacity-75"
          >
          <div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent p-5 text-white">
            <h2 class="text-xl mb-2">{{ currentMatch?.name || '未知' }}</h2>
            <p class="text-sm">
              <template v-if="getGenderText(currentMatch?.gender)">
                {{ getGenderText(currentMatch?.gender) }}
              </template>
              <template v-if="getGenderText(currentMatch?.gender) && currentMatch?.age">
                <span class="mx-2">·</span>
              </template>
              <template v-if="currentMatch?.age">
                {{ currentMatch.age }}岁
              </template>
              <template v-if="currentMatch?.age && currentMatch?.location && currentMatch.location !== ''">
                <span class="mx-2">·</span>
              </template>
              <template v-if="currentMatch?.location && currentMatch.location !== ''">
                {{ currentMatch.location }}
              </template>
            </p>
          </div>
        </div>
        
        <div v-if="!isLoading && matches.length > 0" class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <h4 class="mb-4 text-2xl">个人简介</h4>
            <p class="text-gray-700">{{ currentMatch?.bio || '暂无简介' }}</p>
          </div>
          
          <div>
            <h4 class="mb-4 text-2xl">兴趣爱好</h4>
            <div class="flex flex-wrap gap-2">
              <span 
                v-for="interest in (currentMatch?.interests || [])" 
                :key="interest"
                class="bg-white/30 backdrop-blur-sm rounded-full px-3 py-1 text-sm"
              >
                {{ interest }}
              </span>
            </div>
          </div>
        </div>
        
        <div v-if="!isLoading && matches.length > 0" class="space-y-4 mb-6">
          <!-- 上一页、下一页按钮行 -->
          <div class="nav-buttons-container flex justify-between items-center gap-4">
            <button 
              @click.stop.prevent="previousMatch" 
              type="button"
              class="flex-1 px-6 py-3 rounded-lg flex items-center justify-center transition-all border-2 relative z-10"
              :class="currentIndex === 0 
                ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed' 
                : 'bg-transparent border-gray-300 text-gray-700 hover:bg-white/20 hover:shadow-md active:scale-95 cursor-pointer'"
              :disabled="currentIndex === 0"
              style="pointer-events: auto;"
            >
              <span class="iconify mr-2 text-lg" data-icon="mdi:chevron-left" data-inline="false"></span>
              <span class="whitespace-nowrap text-base">上一个</span>
            </button>
            <button 
              @click.stop.prevent="nextMatch" 
              type="button"
              class="flex-1 px-6 py-3 rounded-lg flex items-center justify-center transition-all border-2 relative z-10"
              :class="currentIndex >= matches.length - 1 
                ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed' 
                : 'bg-transparent border-gray-300 text-gray-700 hover:bg-white/20 hover:shadow-md active:scale-95 cursor-pointer'"
              :disabled="currentIndex >= matches.length - 1"
              style="pointer-events: auto;"
            >
              <span class="whitespace-nowrap text-base">下一个</span>
              <span class="iconify ml-2 text-lg" data-icon="mdi:chevron-right" data-inline="false"></span>
            </button>
          </div>
          
          <!-- 发起聊天、爱心按钮行 -->
          <div class="flex justify-between items-center gap-4">
            <button 
              class="flex-1 px-6 py-3 btn-primary flex items-center justify-center rounded-lg transition-all hover:shadow-md active:scale-95"
              @click="startChat"
            >
              <span class="iconify mr-2" data-icon="mdi:message-text" data-inline="false"></span>
              <span class="whitespace-nowrap">发起聊天</span>
            </button>
            <button 
              class="px-4 py-3 rounded-lg transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg active:scale-95 flex-shrink-0"
              :class="isLiked 
                ? 'bg-red-400 text-white hover:bg-red-500 ring-2 ring-red-200' 
                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'"
              @click="likeUser"
              title="喜欢"
            >
              <span 
                class="iconify text-xl" 
                :data-icon="isLiked ? 'mdi:heart' : 'mdi:heart-outline'" 
                :class="isLiked ? 'text-white' : 'text-red-500'"
                data-inline="false"
              ></span>
              <span class="whitespace-nowrap text-sm">喜欢</span>
            </button>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 右侧推荐区域，稍微宽一点 -->
    <div class="w-96 ml-8">
      <div class="bg-white/40 border border-gray-300/50 rounded-xl p-6 mb-6">
        <h4 class="mb-4">专属匹配问卷</h4>
        <p class="text-sm text-gray-600 mb-4">完善你的个人资料，获得更精准的匹配推荐</p>
        <button 
          v-if="hasQuestionnaire"
          @click="goToQuestionnaire" 
          class="questionnaire-btn-edit w-full bg-purple-100 text-purple-700 border border-purple-200 py-4 px-4 rounded-xl hover:bg-purple-200 hover:border-purple-300 transition-all duration-300 flex items-center justify-center"
        >
          <span class="iconify mr-3 text-3xl" data-icon="mdi:file-document-edit" data-inline="false"></span>
          <span class="text-lg">修改问卷</span>
        </button>
        <button 
          v-else
          @click="goToQuestionnaire" 
          class="questionnaire-btn w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-4 px-4 rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all duration-300 flex items-center justify-center shadow-lg hover:shadow-xl transform hover:scale-105"
        >
          <span class="iconify mr-3 text-3xl" data-icon="mdi:file-document-edit" data-inline="false"></span>
          <span class="text-lg">开始问卷</span>
        </button>
      </div>
      
      <!-- 高匹配度列表 -->
      <div v-if="hasQuestionnaire" class="bg-white/40 border border-gray-300/50 rounded-xl p-6">
        <div class="flex items-center justify-between mb-4">
          <h4 class="text-lg">高匹配度推荐</h4>
          <span class="text-xs text-gray-500">基于问卷匹配</span>
        </div>
        
        <div class="space-y-3 high-match-scroll">
          <div 
            v-for="user in highMatchUsers" 
            :key="user.id"
            @click="selectMatchUser(user)"
            class="flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all hover:bg-white/20 hover:shadow-md border border-transparent hover:border-white/30"
            :class="{ 'bg-purple-500/30 border-purple-300/50': selectedUser?.id === user.id }"
          >
            <!-- 头像 -->
            <div class="relative flex-shrink-0">
              <img 
                :src="getUserAvatar(user)" 
                :alt="user.name"
                class="w-12 h-12 rounded-full object-cover border-2"
                :class="user.matchScore >= 90 ? 'border-green-400' : user.matchScore >= 80 ? 'border-yellow-400' : 'border-gray-300'"
              >
              <!-- 在线状态指示器 -->
              <div 
                v-if="user.isOnline"
                class="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"
              ></div>
            </div>
            
            <!-- 用户信息 -->
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 mb-1">
                <span class="text-gray-900 truncate">{{ user.name }}</span>
                <span class="text-xs text-gray-500">{{ user.age }}岁</span>
              </div>
              
              <!-- 匹配度 -->
              <div class="flex items-center gap-2">
                <div class="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div 
                    class="h-full rounded-full transition-all duration-300"
                    :class="getMatchScoreColor(user.matchScore)"
                    :style="{ width: user.matchScore + '%' }"
                  ></div>
                </div>
                <span 
                  class="text-xs min-w-[40px] text-right"
                  :class="getMatchScoreTextColor(user.matchScore)"
                >
                  {{ user.matchScore }}%
                </span>
              </div>
            </div>
          </div>
          
          <!-- 空状态 -->
          <div v-if="highMatchUsers.length === 0" class="text-center py-8 text-gray-500">
            <span class="iconify text-4xl mb-2 block" data-icon="mdi:account-search" data-inline="false"></span>
            <p class="text-sm">暂无匹配推荐</p>
            <p class="text-xs mt-1">完成问卷后查看匹配结果</p>
          </div>
        </div>
      </div>
      
      <!-- 未填写问卷提示 -->
      <div v-else class="bg-white/40 border border-gray-300/50 rounded-xl p-6">
        <div class="text-center py-8">
          <span class="iconify text-4xl mb-4 block text-gray-400" data-icon="mdi:file-question" data-inline="false"></span>
          <p class="text-sm text-gray-600 mb-2">完成问卷后可查看高匹配度推荐</p>
          <button 
            @click="goToQuestionnaire" 
            class="mt-4 px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all"
          >
            去填写问卷
          </button>
        </div>
      </div>
    </div>
    
    <!-- 提示消息 -->
    <div 
      v-if="showQuestionnaireTip" 
      class="fixed top-20 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center gap-2 animate-fade-in"
    >
      <span class="iconify" data-icon="mdi:alert-circle" data-inline="false"></span>
      <span>{{ tipMessage }}</span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { getUsersWithQuestionnaire } from '@/api/user'
import { getQuestionnaire, getPublicQuestionnaire } from '@/api/questionnaire'
import { getMatchRecommendations } from '@/api/match'
import { sendLikeNotification, cancelLikeNotification, getSentLikes } from '@/api/likes'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()
const cardClass = ref('swipe-pending')
const isLoading = ref(false)

// 检查用户是否填写过问卷
const hasQuestionnaire = ref(false)
const checkingQuestionnaire = ref(false)
const showQuestionnaireTip = ref(false)
const tipMessage = ref('')

// 匹配列表数据
const matches = ref([])

// 当前匹配索引
const currentIndex = ref(0)

// 跟踪每个用户的喜欢状态
const likedUsers = ref(new Set())

// 保存喜欢标记到 localStorage（用于聊天页面显示爱心）
const LIKE_FLAG_KEY = "liked_users_list"
function saveLikeFlag(userId) {
  if (!userId) return
  try {
    const flags = loadLikeFlags()
    flags[String(userId)] = true
    localStorage.setItem(LIKE_FLAG_KEY, JSON.stringify(flags))
  } catch (e) {
    console.warn("保存喜欢标记失败:", e)
  }
}

// 移除喜欢标记
function removeLikeFlag(userId) {
  if (!userId) return
  try {
    const flags = loadLikeFlags()
    delete flags[String(userId)]
    localStorage.setItem(LIKE_FLAG_KEY, JSON.stringify(flags))
  } catch (e) {
    console.warn("移除喜欢标记失败:", e)
  }
}

// 加载喜欢标记
function loadLikeFlags() {
  try {
    const raw = localStorage.getItem(LIKE_FLAG_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === "object" ? parsed : {}
  } catch (e) {
    console.warn("读取喜欢标记失败:", e)
    return {}
  }
}

// 计算当前匹配对象
const currentMatch = computed(() => {
  if (!matches.value || matches.value.length === 0) {
    return {
      name: '暂无数据',
      age: 0,
      location: '',
      job: '',
      distance: '',
      photo: '',
      bio: '',
      tags: [],
      interests: []
    }
  }
  return matches.value[currentIndex.value] || matches.value[0]
})

// 检查当前用户是否已喜欢
const isLiked = computed(() => {
  const userId = currentMatch.value?.id || currentIndex.value
  return likedUsers.value.has(userId)
})

// 当前匹配对象的personality数据（响应式引用）
const currentPersonalityData = ref(null)
const loadingPersonality = ref(false)

// 加载当前用户的personality数据
const loadCurrentPersonalityData = async () => {
  if (!currentMatch.value || !currentMatch.value.id) {
    currentPersonalityData.value = null
    return
  }
  
  // 如果已经有数据，直接使用
  const existingPersonality = {
    socialEnergy: currentMatch.value.socialEnergy,
    decisionMaking: currentMatch.value.decisionMaking,
    lifeRhythm: currentMatch.value.lifeRhythm
  }
  
  const filteredExisting = Object.fromEntries(
    Object.entries(existingPersonality).filter(([, value]) => value !== null && value !== undefined && value !== '')
  )
  
  if (Object.keys(filteredExisting).length > 0) {
    currentPersonalityData.value = filteredExisting
    console.log('✅ 使用已有的 Personality 数据:', currentPersonalityData.value)
    return
  }
  
  // 如果没有数据，调用API获取
  loadingPersonality.value = true
  currentPersonalityData.value = null
  
  try {
    console.log(`正在从API获取用户 ${currentMatch.value.id} 的公开问卷信息（性格数据）...`)
    const questionnaire = await getPublicQuestionnaire(currentMatch.value.id)
    
    console.log(`用户 ${currentMatch.value.id} 的公开问卷原始响应:`, questionnaire)
    
    // 处理不同的响应格式
    const qData = questionnaire?.data || questionnaire || {}
    
    console.log(`用户 ${currentMatch.value.id} 的解析后数据:`, qData)
    
    // 提取personality字段
    const personality = {
      socialEnergy: qData.socialEnergy,
      decisionMaking: qData.decisionMaking,
      lifeRhythm: qData.lifeRhythm
    }
    
    // 过滤掉空值
    const filtered = Object.fromEntries(
      Object.entries(personality).filter(([, value]) => value !== null && value !== undefined && value !== '')
    )
    
    if (Object.keys(filtered).length > 0) {
      currentPersonalityData.value = filtered
      
      // 同时更新到 matches 数组中，避免重复请求
      const matchIndex = matches.value.findIndex(m => m.id === currentMatch.value.id)
      if (matchIndex >= 0) {
        matches.value[matchIndex].socialEnergy = qData.socialEnergy || null
        matches.value[matchIndex].decisionMaking = qData.decisionMaking || null
        matches.value[matchIndex].lifeRhythm = qData.lifeRhythm || null
      }
      
      console.log('✅ 从API加载 Personality 数据成功:', currentPersonalityData.value)
    } else {
      currentPersonalityData.value = null
      console.log('⚠️ 未找到 Personality 数据')
    }
  } catch (error) {
    console.error('❌ 加载 Personality 数据失败:', error)
    currentPersonalityData.value = null
  } finally {
    loadingPersonality.value = false
  }
}

// 监听当前匹配对象的变化，自动加载personality数据
watch(() => currentMatch.value?.id, (newUserId) => {
  if (newUserId) {
    // 重置personality数据
    currentPersonalityData.value = null
  }
}, { immediate: false })

// 上一个匹配
const previousMatch = () => {
  console.log('previousMatch called, currentIndex:', currentIndex.value, 'matches.length:', matches.value.length)
  if (currentIndex.value > 0) {
    currentIndex.value--
    cardClass.value = 'swipe-pending'
    console.log('Moved to previous, new index:', currentIndex.value)
  } else {
    console.log('Already at first match, cannot go previous')
  }
}

// 下一个匹配
const nextMatch = () => {
  console.log('nextMatch called, currentIndex:', currentIndex.value, 'matches.length:', matches.value.length)
  if (currentIndex.value < matches.value.length - 1) {
    currentIndex.value++
    cardClass.value = 'swipe-pending'
    console.log('Moved to next, new index:', currentIndex.value)
  } else {
    console.log('Already at last match, cannot go next')
  }
}

// 喜欢用户（发送通知，不跳转聊天）
const likeUser = async () => {
  // 检查是否填写过问卷
  if (!hasQuestionnaire.value) {
    showTip('请先完成匹配问卷后再喜欢')
    return
  }
  
  const userId = currentMatch.value?.id || currentIndex.value
  if (!userId) {
    console.warn('喜欢用户失败：当前用户缺少 id', currentMatch.value)
    return
  }
  
  const isCurrentlyLiked = likedUsers.value.has(userId)
  console.log('喜欢操作开始:', { userId, isCurrentlyLiked })
  
  try {
    if (isCurrentlyLiked) {
      // 取消喜欢
      console.log('正在取消喜欢:', userId)
      await cancelLikeNotification(userId)
      likedUsers.value.delete(userId)
      console.log('✅ 取消喜欢用户:', currentMatch.value.name)
      
      // 移除爱心标记（从 localStorage 中删除）
      removeLikeFlag(userId)
      
      // 通知聊天页面更新（通过事件或直接更新）
      // 如果用户在聊天页面，需要更新聊天列表中的 isFromMatch 状态
      window.dispatchEvent(new CustomEvent('like-status-changed', { 
        detail: { userId, isLiked: false } 
      }))
    } else {
      // 添加喜欢
      console.log('正在发送喜欢:', userId)
      await sendLikeNotification(userId)
      likedUsers.value.add(userId)
      console.log('✅ 喜欢用户:', currentMatch.value.name)
      
      // 添加爱心标记（保存到 localStorage）
      saveLikeFlag(userId)
      
      // 通知聊天页面更新
      window.dispatchEvent(new CustomEvent('like-status-changed', { 
        detail: { userId, isLiked: true } 
      }))
    }
  } catch (error) {
    console.error('❌ 喜欢操作失败:', error)
    
    // 根据错误类型给出不同的处理
    const errorMessage = error?.message || error?.data?.message || String(error)
    
    if (errorMessage.includes('已经发送过喜欢通知') || errorMessage.includes('已经喜欢过')) {
      // 如果是重复喜欢的错误，直接更新本地状态为已喜欢
      if (!isCurrentlyLiked) {
        likedUsers.value.add(userId)
        console.log('🔄 同步本地状态为已喜欢:', currentMatch.value.name)
      }
    } else if (errorMessage.includes('取消失败') || errorMessage.includes('没有发送过喜欢')) {
      // 如果是取消失败的错误，直接更新本地状态为未喜欢
      if (isCurrentlyLiked) {
        likedUsers.value.delete(userId)
        console.log('🔄 同步本地状态为未喜欢:', currentMatch.value.name)
      }
    } else {
      // 其他错误，不改变本地状态
      console.log('⚠️ 其他错误，保持本地状态不变')
    }
  }
}

// 发起聊天
const startChat = () => {
  // 检查是否填写过问卷
  if (!hasQuestionnaire.value) {
    showTip('请先完成匹配问卷后再发起聊天')
    return
  }
  
  const targetUserId = currentMatch.value?.id
  if (!targetUserId) {
    console.warn('发起聊天失败：当前用户缺少 id', currentMatch.value)
    return
  }

  // 跳转到聊天页并携带 userId，ChatPage 会根据该参数创建/选择会话
  // 不再标记为来自匹配列表，只有点击喜欢后才会显示爱心
  router.push({
    name: 'chat',
    params: { userId: targetUserId }
  })
}

// 高匹配度用户列表（由后端 /match/recommendations 根据积分规则计算）
const highMatchUsers = ref([])

// 选中的用户
const selectedUser = ref(null)

// 根据匹配度获取进度条颜色
const getMatchScoreColor = (score) => {
  if (score >= 90) return 'bg-green-500'
  if (score >= 80) return 'bg-yellow-500'
  if (score >= 70) return 'bg-orange-500'
  return 'bg-red-500'
}

// 根据匹配度获取文字颜色
const getMatchScoreTextColor = (score) => {
  if (score >= 90) return 'text-green-600'
  if (score >= 80) return 'text-yellow-600'
  if (score >= 70) return 'text-orange-600'
  return 'text-red-600'
}

// 选择匹配用户
const selectMatchUser = (user) => {
  selectedUser.value = user
  // 找到对应的匹配并切换到该用户
  const matchIndex = matches.value.findIndex(m => m.name === user.name)
  if (matchIndex !== -1) {
    currentIndex.value = matchIndex
  }
  console.log('选择用户:', user.name, '匹配度:', user.matchScore + '%')
}

const goToQuestionnaire = () => {
  router.push('/questionnaire')
}

// 检查用户是否填写过问卷
const checkUserQuestionnaire = async () => {
  checkingQuestionnaire.value = true
  try {
    const questionnaire = await getQuestionnaire()
    const qData = questionnaire?.data || questionnaire || {}
    
    // 检查是否有问卷数据（至少要有interests或其他字段）
    const hasData = qData.interests?.length > 0 || 
                    qData.socialEnergy || 
                    qData.decisionMaking || 
                    qData.lifeRhythm
    
    hasQuestionnaire.value = !!hasData
    console.log('用户问卷检查结果:', hasQuestionnaire.value, qData)
  } catch (error) {
    // 如果获取失败，说明没有填写过问卷
    hasQuestionnaire.value = false
    console.log('用户未填写问卷或获取失败:', error)
  } finally {
    checkingQuestionnaire.value = false
  }
}

// 显示提示信息
const showTip = (message) => {
  tipMessage.value = message
  showQuestionnaireTip.value = true
  setTimeout(() => {
    showQuestionnaireTip.value = false
  }, 3000)
}

// 加载匹配推荐列表（使用后端计算匹配度）
const loadMatchedUsers = async () => {
  if (isLoading.value) return
  
  isLoading.value = true
  matches.value = [] // 清空之前的数据
  
  try {
    console.log('开始加载匹配推荐列表（使用后端计算匹配度）...')
    
    // 使用后端匹配推荐API，自动筛选已填写问卷的用户
    const response = await getMatchRecommendations(1, 50)
    console.log('匹配推荐API原始响应:', response)
    
    // 处理响应数据
    let recommendations = []
    if (Array.isArray(response)) {
      recommendations = response
    } else if (response && typeof response === 'object') {
      recommendations = response.data || response.list || response || []
    }
    
    console.log('解析后的推荐数据:', recommendations)
    console.log('推荐用户数量:', recommendations.length)
    
    if (recommendations.length > 0) {
      // 格式化推荐数据为前端需要的格式
      matches.value = recommendations.map(rec => ({
        id: rec.userId,
        name: rec.nickname || '未知用户',
        age: calculateAge(rec.birthday) || 25,
        location: rec.region || '未知',
        job: '未知', // 后端暂未提供此字段
        distance: '未知距离', // 后端暂未提供此字段
        photo: rec.avatarUrl || null,
        bio: rec.bio || '这个人很懒，什么都没有留下。',
        tags: [], // 后端暂未提供此字段
        interests: [], // 后续通过问卷API加载
        matchScore: rec.matchScore || 0,
        gender: rec.gender,
        email: rec.email,
        phone: rec.phone,
        username: rec.username,
        createdAt: rec.createdAt
      }))
      
      console.log('✅ 加载匹配推荐成功，数量:', matches.value.length)
      
      // 为每个用户获取问卷信息（包括兴趣爱好）
      await loadUserQuestionnaires()
      
      console.log('格式化后的用户列表（包含问卷信息）:', matches.value)
    } else {
      console.log('暂无匹配推荐用户')
      matches.value = [] // 确保为空数组
    }
    
  } catch (error) {
    console.error('❌ 加载匹配推荐失败:', error)
    console.error('错误详情:', {
      message: error.message,
      status: error.status,
      response: error.response
    })
    matches.value = [] // 出错时设置为空数组
  } finally {
    isLoading.value = false
    console.log('加载完成，最终用户数量:', matches.value.length)
  }
}

// Personality 字段的中文映射
const PERSONALITY_LABELS = {
  socialEnergy: {
    extroverted: '外向型',
    introverted: '内向型',
    ambivert: '中间型'
  },
  decisionMaking: {
    rational: '理性型',
    emotional: '感性型',
    balanced: '平衡型'
  },
  lifeRhythm: {
    planned: '计划型',
    spontaneous: '随性型',
    flexible: '弹性型'
  }
}

// 获取 Personality 标签
const getPersonalityLabel = (field, value) => {
  return PERSONALITY_LABELS[field]?.[value] || value
}

// 生成名字文字头像（Canvas 绘制，基于名字哈希的颜色背景 + 前两个字）
const generateTextAvatar = (name) => {
  if (!name) return null

  const text = name.length >= 2 ? name.substring(0, 2) : name.substring(0, 1)
  const canvas = document.createElement('canvas')
  canvas.width = 80
  canvas.height = 80
  const ctx = canvas.getContext('2d')

  const colors = ['#8b5cf6','#3b82f6','#10b981','#f59e0b','#ef4444','#ec4899','#06b6d4','#6366f1']
  const hash = name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
  ctx.fillStyle = colors[hash % colors.length]
  ctx.fillRect(0, 0, 80, 80)
  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 32px Arial, sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(text, 40, 40)
  return canvas.toDataURL()
}

// 获取用户头像：优先上传的头像，否则用名字文字头像
const getUserAvatar = (user) => {
  const avatarUrl = user?.avatarUrl || user?.avatar || user?.photo
  if (avatarUrl) return avatarUrl
  const name = user?.name || user?.nickname || user?.username || ''
  if (name) return generateTextAvatar(name)
  return null
}

// 获取性别显示文本
const getGenderText = (gender) => {
  if (!gender) return ''
  if (gender === 'male' || gender === '男' || gender === 'M') return '男'
  if (gender === 'female' || gender === '女' || gender === 'F') return '女'
  return gender
}

// 兴趣编码到名称的映射（与问卷页保持一致）
const INTEREST_LABELS = {
  art: '绘画',
  photography: '摄影',
  calligraphy: '书法',
  writing: '写作',
  singing: '歌唱',
  dance: '舞蹈',
  theater: '戏剧',
  instrument: '乐器演奏',
  graphic_design: '平面设计',
  video_editing: '视频剪辑',
  reading: '阅读',
  programming: '编程',
  teaching: '教学',
  psychology: '心理学',
  language_learning: '语言学习',
  philosophy: '哲学思考',
  history_research: '历史研究',
  investment: '投资理财',
  public_speaking: '公开演讲',
  entrepreneurship: '创业项目',
  running: '跑步',
  fitness: '健身',
  swimming: '游泳',
  cycling: '骑行',
  fishing: '钓鱼',
  yoga: '瑜伽',
  camping: '露营',
  martial_arts: '武术',
  mountaineering: '登山',
  climbing: '攀岩',
  frisbee: '飞盘',
  team_sports: '球类运动',
  board_games: '桌游',
  card_games: '棋牌',
  magic: '魔术',
  collecting: '收藏',
  tv_shows: '追剧',
  movies: '看电影',
  music: '听音乐',
  script_killing: '剧本杀',
  escape_room: '密室逃脱',
  gaming: '电子游戏',
  cooking_baking: '烹饪/烘焙',
  coffee_tea_mixology: '咖啡/茶艺/调酒',
  handicraft_diy: '手工 DIY',
  sewing: '缝纫',
  home_decoration: '家居装饰',
  organizing: '收纳整理',
  floristry_gardening: '花艺绿植',
  travel: '旅行',
  bird_watching: '观鸟',
  music_festival: '音乐节',
  concert: '演唱会',
  restaurant_hopping: '探店打卡',
  exhibition: '展览打卡',
  astronomy: '天文观测',
  volunteering: '公益志愿',
  petting: '撸猫撸狗',
  city_walk: 'city walk'
}

// 格式化用户数据
const formatUsersData = (usersData) => {
  return usersData.map((user, index) => ({
    id: user.userId || user.id || index,
    // 名称：优先使用 nickname，然后是 name、username
    name: user.nickname || user.name || user.username || '未知用户',
    // 年龄：如果有 age 字段直接使用，否则根据 birthday 计算
    age: user.age || calculateAge(user.birthday) || 25,
    // 位置：优先使用 region，然后是 location、city
    location: user.region || user.location || user.city || '未知',
    // 工作：job 或 profession
    job: user.job || user.profession || '未知',
    // 距离：如果有就使用，否则使用默认值
    distance: user.distance || '未知距离',
    // 头像：优先使用 avatarUrl，然后是 avatar、photo
    photo: user.avatarUrl || user.avatar || user.photo || null,
    // 简介：bio、introduction、description
    bio: user.bio || user.introduction || user.description || '这个人很懒，什么都没有留下。',
    // 标签和兴趣
    tags: user.tags || [],
    // 兴趣初始为空，后续通过 loadUserQuestionnaires 从问卷API加载
    interests: [],
    // 匹配度（如果后端有返回则使用，否则默认 0，后续可以在后端补充）
    matchScore: user.matchScore ?? user.match_score ?? user.score ?? 0,
    // 保留原始数据中的其他字段（如 gender、email、phone 等）
    gender: user.gender,
    email: user.email,
    phone: user.phone,
    username: user.username,
    createdAt: user.createdAt,
    // Personality 字段
    socialEnergy: user.socialEnergy || null,
    decisionMaking: user.decisionMaking || null,
    lifeRhythm: user.lifeRhythm || null
  }))
}

// 根据生日计算年龄
const calculateAge = (birthday) => {
  if (!birthday) return null
  const birthDate = new Date(birthday)
  const today = new Date()
  let age = today.getFullYear() - birthDate.getFullYear()
  const monthDiff = today.getMonth() - birthDate.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--
  }
  return age
}

// 将兴趣编码转换为中文名称
const convertInterestsToLabels = (interestCodes) => {
  if (!Array.isArray(interestCodes) || interestCodes.length === 0) {
    return []
  }
  return interestCodes
    .map(code => INTEREST_LABELS[code] || code)
    .filter(Boolean)
}

// 为每个用户加载问卷信息（包括兴趣爱好）
const loadUserQuestionnaires = async () => {
  console.log('开始为每个用户加载问卷信息...', '当前用户数量:', matches.value.length)
  
  // 并发获取所有用户的问卷信息
  const questionnairePromises = matches.value.map(async (match) => {
    const userId = match.id
    if (!userId) {
      console.warn('用户ID为空，跳过问卷加载:', match)
      return
    }
    
    try {
      console.log(`正在获取用户 ${userId} 的公开问卷信息...`)
      const questionnaire = await getPublicQuestionnaire(userId)
      
      console.log(`用户 ${userId} 的公开问卷原始响应:`, questionnaire)
      
      // 处理不同的响应格式
      const qData = questionnaire?.data || questionnaire || {}
      
      console.log(`用户 ${userId} 的解析后数据:`, qData)
      
      // 提取兴趣列表（公开API主要就是返回兴趣爱好）
      const interests = qData.interests || qData.interest || qData.hobbies || qData.hobby || []
      
      console.log(`用户 ${userId} 的兴趣数据:`, interests)
      
      // 更新到 matches 数组中
      const matchIndex = matches.value.findIndex(m => m.id === userId)
      if (matchIndex >= 0) {
        if (interests.length > 0) {
          // 将兴趣编码转换为中文名称
          const interestLabels = convertInterestsToLabels(interests)
          matches.value[matchIndex].interests = interestLabels
          console.log(`✅ 用户 ${userId} 的兴趣爱好已加载:`, interestLabels)
        }
        
        // 更新personality字段
        if (qData.socialEnergy) matches.value[matchIndex].socialEnergy = qData.socialEnergy
        if (qData.decisionMaking) matches.value[matchIndex].decisionMaking = qData.decisionMaking
        if (qData.lifeRhythm) matches.value[matchIndex].lifeRhythm = qData.lifeRhythm
        
        if (qData.socialEnergy || qData.decisionMaking || qData.lifeRhythm) {
          console.log(`✅ 用户 ${userId} 的 Personality 数据已加载`)
        }
      } else {
        console.log(`用户 ${userId} 的公开问卷中没有兴趣爱好数据，可用字段:`, Object.keys(qData))
      }
    } catch (error) {
      // 如果获取公开问卷失败，记录但不中断流程
      console.warn(`获取用户 ${userId} 的公开问卷信息失败:`, error.message || error)
      console.warn('错误详情:', error)
      // 保持 interests 为空数组
    }
  })
  
  // 等待所有请求完成
  await Promise.all(questionnairePromises)
  console.log('✅ 所有用户的问卷信息加载完成')
  
  // 打印最终的用户列表，检查兴趣是否正确加载
  console.log('最终用户列表（包含兴趣）:', matches.value.map(m => ({
    id: m.id,
    name: m.name,
    interests: m.interests
  })))
}

// 加载高匹配度推荐列表（使用后端匹配推荐API）
const loadHighMatchUsers = async () => {
  // 如果用户没有填写问卷，不加载高匹配度推荐
  if (!hasQuestionnaire.value) {
    highMatchUsers.value = []
    return
  }
  
  try {
    console.log('开始加载高匹配度推荐列表（使用后端匹配推荐API）...')

    // 直接使用匹配推荐API获取高匹配度用户
    const response = await getMatchRecommendations(1, 20)
    console.log('高匹配度推荐原始响应:', response)

    let recommendations = []
    if (Array.isArray(response)) {
      recommendations = response
    } else if (response && typeof response === 'object') {
      recommendations = response.data || response.list || response || []
    }

    console.log('解析后的推荐数据（高匹配度）:', recommendations)

    // 格式化为前端需要的格式
    const formatted = recommendations.map(rec => ({
      id: rec.userId,
      name: rec.nickname || '未知用户',
      age: calculateAge(rec.birthday) || 25,
      photo: rec.avatarUrl || rec.avatar || rec.photo || null, // 不设置默认值，让getUserAvatar处理
      gender: rec.gender, // 保存gender，用于getUserAvatar
      matchScore: rec.matchScore || 0,
      isOnline: Math.random() > 0.5 // 随机在线状态，后续可以从后端获取
    }))

    // 根据匹配度从高到低排序，取前10个
    const sorted = formatted
      .slice()
      .sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0))

    highMatchUsers.value = sorted.slice(0, 10)

    console.log('✅ 高匹配度推荐加载完成，数量:', highMatchUsers.value.length)
    console.log('高匹配度推荐列表:', highMatchUsers.value)
  } catch (error) {
    console.error('❌ 加载高匹配度推荐失败:', error)
    highMatchUsers.value = []
  }
}

// 加载已喜欢的用户列表
const loadLikedUsers = async () => {
  try {
    console.log('开始加载已喜欢的用户列表...')
    const response = await getSentLikes(1, 100) // 获取前100个已喜欢的用户
    // 后端返回的数据结构：R.ok(sentLikes)，经过request拦截器处理后直接返回数组
    const likes = Array.isArray(response) ? response : (response?.data || [])
    
    console.log('后端返回的喜欢列表数据:', likes)
    
    // 提取所有已喜欢用户的ID
    // 后端返回的字段名是 to_user_id（下划线命名）
    const likedUserIds = new Set()
    if (Array.isArray(likes)) {
      likes.forEach(like => {
        // 兼容多种可能的字段名：to_user_id, targetUserId, userId, id
        const userId = like.to_user_id || like.targetUserId || like.userId || like.id
        if (userId) {
          likedUserIds.add(userId)
          // 同时保存到 localStorage，用于聊天页面显示爱心
          saveLikeFlag(userId)
          console.log('找到已喜欢的用户ID:', userId)
        }
      })
    }
    
    // 更新本地状态
    likedUsers.value = likedUserIds
    console.log('✅ 已加载已喜欢的用户列表，数量:', likedUserIds.size, '用户ID列表:', Array.from(likedUserIds))
  } catch (error) {
    console.error('❌ 加载已喜欢的用户列表失败:', error)
    // 如果API不存在或失败，不影响其他功能
  }
}

// 页面加载时获取匹配用户 & 高匹配度推荐
onMounted(async () => {
  // 先检查用户是否填写过问卷
  await checkUserQuestionnaire()
  
  // 加载已喜欢的用户列表（从数据库恢复状态）
  await loadLikedUsers()
  
  // 加载今日推荐（无论是否填写问卷都可以看）
  loadMatchedUsers()
  
  // 监听喜欢状态变化事件（从聊天页面触发）
  const handleLikeStatusChange = (event) => {
    const { userId, isLiked } = event.detail;
    console.log('匹配页面收到喜欢状态变化事件:', { userId, isLiked });
    
    // 更新 likedUsers Set
    if (isLiked) {
      likedUsers.value.add(userId);
      // 保存到 localStorage
      saveLikeFlag(userId);
    } else {
      likedUsers.value.delete(userId);
      // 从 localStorage 移除
      removeLikeFlag(userId);
    }
    
    console.log('✅ 匹配页面已更新喜欢状态，当前用户ID:', userId, '是否喜欢:', isLiked);
  };
  window.addEventListener('like-status-changed', handleLikeStatusChange);
  
  // 清理事件监听器
  onUnmounted(() => {
    window.removeEventListener('like-status-changed', handleLikeStatusChange);
  });
  
  // 只有填写过问卷才加载高匹配度推荐
  if (hasQuestionnaire.value) {
    loadHighMatchUsers()
  }
})
</script>

<style scoped>
.questionnaire-btn {
  position: relative;
  overflow: hidden;
}

.questionnaire-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  transition: left 0.5s;
}

.questionnaire-btn:hover::before {
  left: 100%;
}

.questionnaire-btn .iconify {
  animation: pulse 2s infinite;
}

.questionnaire-btn-edit {
  position: relative;
  overflow: hidden;
}

.questionnaire-btn-edit .iconify {
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
}

@keyframes fade-in {
  from {
    opacity: 0;
    transform: translate(-50%, -10px);
  }
  to {
    opacity: 1;
    transform: translate(-50%, 0);
  }
}

.animate-fade-in {
  animation: fade-in 0.3s ease-out;
}

/* 高匹配度推荐滚动区域 */
.high-match-scroll {
  max-height: 500px;
  overflow-y: auto;
  padding-right: 8px;
}

.high-match-scroll::-webkit-scrollbar {
  width: 6px;
}

.high-match-scroll::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
}

.high-match-scroll::-webkit-scrollbar-thumb {
  background: rgba(139, 92, 246, 0.5);
  border-radius: 3px;
}

.high-match-scroll::-webkit-scrollbar-thumb:hover {
  background: rgba(139, 92, 246, 0.7);
}

/* ========== 手机端响应式样式（≤640px） ========== */
/* Phone responsive styles (≤640px) */
@media (max-width: 640px) {
  /* 主容器改为垂直堆叠 */
  /* Main container → vertical stacking */
  .match-page {
    flex-direction: column;
    gap: 16px;
    padding-bottom: 80px; /* 底部导航栏空间 / Space for bottom nav */
  }

  /* 主区域全宽 */
  /* Main area full width */
  .match-page > .flex-\[1\.2\] {
    flex: none;
    width: 100%;
  }

  /* 主卡片内边距缩减 */
  /* Reduce main card padding */
  .match-page .bg-white\/40.border.rounded-xl.p-8 {
    padding: 16px 12px;
  }

  .match-page .bg-white\/40.border.rounded-xl.p-8.mb-6 {
    padding: 16px 12px;
  }

  /* 标题字号缩减 */
  /* Reduce title font size */
  .match-page h3.text-xl {
    font-size: 18px;
    margin-bottom: 12px;
  }

  /* 用户卡片高度缩减 */
  /* Reduce user card height */
  .match-card.h-96 {
    height: 280px;
    border-radius: 10px;
  }

  .match-card .absolute.bottom-0 {
    padding: 12px;
  }

  .match-card .absolute.bottom-0 h2 {
    font-size: 18px;
    margin-bottom: 4px;
  }

  .match-card .absolute.bottom-0 p {
    font-size: 12px;
  }

  /* 简介/兴趣 单列布局 */
  /* Bio/interests single column */
  .match-page .grid.grid-cols-1 {
    gap: 12px;
    margin-bottom: 12px;
  }

  .match-page .grid h4 {
    font-size: 16px;
    margin-bottom: 8px;
  }

  .match-page .grid p {
    font-size: 13px;
  }

  /* 兴趣标签缩小 */
  /* Smaller interest tags */
  .match-page .flex.flex-wrap.gap-2 span {
    font-size: 12px;
    padding: 4px 10px;
  }

  /* 导航按钮增大触摸区域 */
  /* Larger touch targets for nav buttons */
  .nav-buttons-container {
    margin-bottom: 12px;
  }

  .nav-buttons-container button {
    padding: 12px 16px;
    font-size: 14px;
    min-height: 48px;
  }

  .nav-buttons-container button .iconify {
    font-size: 20px;
  }

  /* 发起聊天/喜欢按钮增大触摸区域 */
  /* Larger touch targets for chat/like buttons */
  .match-page .space-y-4 > .flex {
    gap: 12px;
  }

  .match-page .space-y-4 > .flex button {
    min-height: 48px;
    padding: 12px 16px;
    font-size: 14px;
  }

  .match-page .space-y-4 > .flex button .iconify {
    font-size: 20px;
  }

  .match-page .space-y-4 > .flex button.px-4 {
    min-width: 80px;
  }

  /* 右侧栏全宽，移除左边距 */
  /* Right panel full width, remove left margin */
  .match-page > .w-96 {
    width: 100%;
    margin-left: 0;
  }

  /* 右侧栏卡片内边距缩减 */
  /* Reduce right panel card padding */
  .match-page .w-96 .bg-white\/40.border.rounded-xl.p-6 {
    padding: 16px 12px;
  }

  .match-page .w-96 h4 {
    font-size: 16px;
    margin-bottom: 8px;
  }

  .match-page .w-96 p.text-sm {
    font-size: 12px;
    margin-bottom: 8px;
  }

  /* 问卷按钮优化 */
  /* Optimize questionnaire button */
  .questionnaire-btn,
  .questionnaire-btn-edit {
    padding: 14px 12px;
  }

  .questionnaire-btn .iconify,
  .questionnaire-btn-edit .iconify {
    font-size: 24px;
    margin-right: 8px;
  }

  .questionnaire-btn span.text-lg,
  .questionnaire-btn-edit span.text-lg {
    font-size: 16px;
  }

  /* 高匹配度推荐列表 */
  /* High match list */
  .high-match-scroll {
    max-height: 300px;
  }

  .high-match-scroll .flex.items-center.gap-3 {
    padding: 10px;
  }

  .high-match-scroll .flex.items-center.gap-3 img {
    width: 44px;
    height: 44px;
  }

  .high-match-scroll .flex.items-center.gap-3 .text-gray-900 {
    font-size: 14px;
  }

  .high-match-scroll .flex.items-center.gap-3 .text-xs {
    font-size: 11px;
  }

  /* 提示消息适配 */
  /* Tip message adaptation */
  .match-page .fixed.top-20 {
    top: 60px;
    left: 10px;
    right: 10px;
    transform: none;
    text-align: center;
    padding: 10px 14px;
    font-size: 13px;
  }

  /* 加载/空状态 */
  /* Loading/empty states */
  .match-page .text-center.py-12 {
    padding: 32px 12px;
  }

  .match-page .text-center.py-12 p {
    font-size: 14px;
  }

  .match-page .text-center.py-8 {
    padding: 24px 12px;
  }
}

/* ========== 小屏手机进一步优化（≤380px） ========== */
/* Small phone further optimization (≤380px) */
@media (max-width: 380px) {
  .match-card.h-96 {
    height: 240px;
  }

  .nav-buttons-container button {
    padding: 10px 12px;
    font-size: 13px;
    min-height: 44px;
  }

  .match-page .space-y-4 > .flex button {
    min-height: 44px;
    padding: 10px 12px;
    font-size: 13px;
  }

  .match-card .absolute.bottom-0 h2 {
    font-size: 16px;
  }
}
</style>
