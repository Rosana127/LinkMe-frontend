<template>
  <div class="create-post-page">
    <!-- 顶部切换 -->
    <div class="top-tabs">
      <button :class="['tab', { active: activeTab === 'new' }]" @click="activeTab = 'new'">发布内容</button>
      <button :class="['tab', { active: activeTab === 'manage' }]" @click="activeTab = 'manage'">内容管理</button>
    </div>

    <!-- 发布新帖视图 -->
    <div v-if="activeTab === 'new'" class="create-card">
      <label class="field">
        <div class="label-row">
          <span class="label">主题</span>
          <span class="meta">{{ topic.length }} / 30</span>
        </div>
        <input v-model="topic" type="text" maxlength="30" placeholder="输入主题，不超过30字" />
      </label>

      <label class="field">
        <div class="label">正文</div>
        <textarea v-model="content" rows="6" placeholder="写下你的作品内容..."></textarea>
      </label>

      <div class="field">
        <div class="label">图片</div>
        <div class="images-row">
          <div v-for="(img, idx) in images" :key="idx" class="thumb">
            <img :src="img.data" alt="预览" />
            <button type="button" class="remove" @click="removeImage(idx)">✕</button>
          </div>
          <button type="button" class="file-pick-btn" @click="fileInput?.click()">选择图片</button>
          <input
            ref="fileInput"
            type="file"
            class="file-input-hidden"
            accept="image/*"
            multiple
            @change="onFilesChange"
          />
        </div>
      </div>

      <label v-if="tagsLoading || availableTags.length" class="field">
        <div class="label">标签</div>
        <div v-if="tagsLoading" class="tags-hint">标签加载中...</div>
        <template v-else>
          <div class="tags-scroll" role="listbox">
            <button
              v-for="tag in availableTags"
              :key="tag.id || tag.name"
              type="button"
              :class="['tag-chip', { selected: selectedTagIds.includes(tag.id) }]"
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
        </template>
      </label>

      <label class="field">
        <div class="label">可见范围</div>
        <select v-model="visibility">
          <option value="public">公开</option>
          <option value="friends">仅好友可见</option>
          <option value="draft">草稿</option>
        </select>
      </label>

      <div class="actions">
        <button class="publish" @click="publish">立即发布</button>
        <button class="draft" @click="saveDraft">保存草稿</button>
        <button class="cancel" @click="clearForm">清空内容</button>
      </div>

      <div v-if="message" class="message">{{ message }}</div>
    </div>

    <!-- 内容管理 -->
    <div v-if="activeTab === 'manage'" class="manage-card">
      <div class="manage-tabs">
        <button :class="['manage-tab', { active: managementTab === 'all' }]" @click="managementTab = 'all'">全部笔记 ({{ counts.all }})</button>
        <button :class="['manage-tab', { active: managementTab === 'published' }]" @click="managementTab = 'published'">已发布 ({{ counts.published }})</button>
        <button :class="['manage-tab', { active: managementTab === 'rejected' }]" @click="managementTab = 'rejected'">未通过 ({{ counts.rejected }})</button>
        <button :class="['manage-tab', { active: managementTab === 'drafts' }]" @click="managementTab = 'drafts'">草稿箱 ({{ posts.filter(p=>p.status==='draft').length }})</button>
      </div>

      <!-- optional toolbar below manage-tabs, kept sticky as well -->
      <div class="manage-toolbar">
        <div class="toolbar-left">显示 {{ filteredPosts.length }} 条</div>
        <div class="toolbar-right">排序：最近</div>
      </div>

      <!-- grid wrapper is scrollable so the tabs stay fixed -->
      <div class="manage-grid-wrapper">
        <div v-if="filteredPosts.length === 0" class="empty">暂无帖子</div>
        <div class="manage-grid">
          <div v-for="post in filteredPosts" :key="post.id" class="post-card">
            <div class="card-image">
              <img :src="coverFor(post)" alt="post" />
            </div>
            <div class="card-body">
              <div class="card-title">{{ post.title }}</div>
            </div>
            <div class="card-footer">
              <div class="status">{{ statusText(post.status) }}</div>
              <div class="card-actions">
                <button v-if="post.status === 'draft'" @click="editDraft(post.id)">编辑</button>
                <button v-else-if="post.status !== 'published'" @click="setStatus(post.id, 'published')">发布</button>
                <button v-if="post.status !== 'rejected' && post.status !== 'draft'" @click="setStatus(post.id, 'rejected')">驳回</button>
                <button @click="removePost(post.id)" class="danger">删除</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { createPost, getUserPosts, deletePost, getPost } from '@/api/posts'
import { fetchTagDefinitions } from '@/api/tags'
import { containsSensitiveWords } from '@/utils/sensitiveWords'

const router = useRouter()

// tabs
const activeTab = ref('new') // 'new' or 'manage'

// create form state
const topic = ref('')
const content = ref('')
const images = ref([]) // { file, data }
const selectedTagIds = ref([])
const DEFAULT_TAGS = [
  { id: -1, name: '摄影' },
  { id: -2, name: '旅行' },
  { id: -3, name: '艺术' },
  { id: -4, name: '设计' },
  { id: -5, name: '美食' },
  { id: -6, name: '生活方式' }
]
const availableTags = ref([...DEFAULT_TAGS])
const tagsLoading = ref(false)
const tagsError = ref('')
const visibility = ref('public')
const message = ref('')
const fileInput = ref(null)

// posts list (load from backend on mount). fallback to localStorage if backend unreachable
const posts = ref([])

const LOCAL_POSTS_KEY = (userId) => `posts_user_${userId}`

function normalizeStatus(raw) {
  // common possibilities: status (string), state, reviewStatus, auditStatus, numeric codes
  // 默认状态改为 published（已发布），不再使用审核状态
  if (!raw && raw !== 0) return 'published'
  // if already a string like 'published','draft','rejected'
  // 如果后端返回 'review'，也转换为 'published'
  if (typeof raw === 'string') {
    if (raw === 'review') return 'published' // 将审核中状态转换为已发布
    return raw
  }
  // boolean flags
  if (raw === true) return 'published'
  if (raw === false) return 'published' // false 也返回已发布
  // numeric codes -> guess mapping
  // 0: draft, 1: review -> published, 2: published, 3: rejected
  if (typeof raw === 'number') {
    switch (raw) {
      case 0: return 'draft'
      case 1: return 'published' // 审核中状态转换为已发布
      case 2: return 'published'
      case 3: return 'rejected'
      default: return 'published' // 默认返回已发布
    }
  }
  return 'published' // 默认返回已发布
}

function normalizeImages(rawImages) {
  if (!Array.isArray(rawImages)) return []
  return rawImages
    .map((img, idx) => {
      if (!img) return null
      if (typeof img === 'string') {
        return { url: img, order: idx }
      }
      const order = img.imageOrder ?? img.image_order ?? img.order ?? idx
      const url =
        img.url ||
        img.imageUrl ||
        img.image_url ||
        img.path ||
        img.thumb ||
        null
      const data = img.data || img.base64 || null
      if (!url && !data) return null
      return { url, data, order }
    })
    .filter(Boolean)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
}

function normalizePost(p) {
  const post = { ...p }
  // normalize id
  post.id = p.id ?? p._id ?? p.postId ?? null
  // normalize title/content/tags
  post.title = p.topic ?? p.title ?? p.subject ?? p.heading ?? ''
  post.topic = p.topic ?? post.title ?? ''
  post.content = p.content ?? p.body ?? p.text ?? ''
  const rawTags = p.tags ?? p.tagIds ?? p.tagIDs ?? []
  post.tags = Array.isArray(rawTags)
    ? rawTags
      .map(tag => {
        if (typeof tag === 'number') return tag
        if (typeof tag === 'string' && tag.trim() !== '' && !Number.isNaN(Number(tag))) return Number(tag)
        if (typeof tag === 'object' && tag) {
          const id = tag.tagId ?? tag.tag_id ?? tag.id ?? tag.tagID
          if (id !== undefined && id !== null && !Number.isNaN(Number(id))) return Number(id)
        }
        return null
      })
      .filter(id => id !== null)
    : []
  // normalize images: backend may return array of strings (urls) or objects
  const rawImages =
    p.images ??
    p.postImages ??
    p.imageList ??
    p.imagesList ??
    p.postImageList ??
    p.post_images ??
    []
  post.images = normalizeImages(rawImages)
  // normalize status from several possible fields
  post.status = normalizeStatus(p.status ?? p.state ?? p.reviewStatus ?? p.auditStatus ?? (p.published ? 2 : undefined) ?? (p.isDraft ? 0 : undefined))
  return post
}

async function loadPosts() {
  const authStore = useAuthStore()
  const userId = authStore.userId
  if (!userId) {
    // no logged-in user: try localStorage generic key or keep empty
    const raw = localStorage.getItem('posts_guest')
    posts.value = raw ? JSON.parse(raw) : []
    return
  }

  try {
    const list = await getUserPosts(userId)
    const arr = Array.isArray(list) ? list : (list?.data && Array.isArray(list.data) ? list.data : [])
    posts.value = arr.map(normalizePost)
    await hydratePostCovers(posts.value)
    // cache to localStorage
    localStorage.setItem(LOCAL_POSTS_KEY(userId), JSON.stringify(posts.value))
  } catch (err) {
    // backend failed: try local cache
    const raw = localStorage.getItem(LOCAL_POSTS_KEY(userId))
    posts.value = raw ? JSON.parse(raw) : []
  }
}

async function hydratePostCovers(list) {
  const targets = list.filter(post => (!post.images || post.images.length === 0) && post.id)
  if (!targets.length) return
  await Promise.all(
    targets.map(async (post) => {
      try {
        const detail = await getPost(post.id)
        const data = detail?.data ? detail.data : detail
        const normalized = normalizeImages(
          data?.images ||
          data?.postImages ||
          data?.imageList ||
          data?.postImageList ||
          data?.post_images ||
          []
        )
        if (normalized.length) {
          post.images = normalized
        }
      } catch (error) {
        console.warn(`加载帖子(${post.id})封面失败`, error)
      }
    })
  )
}

const managementTab = ref('all') // all / published / rejected / drafts

const counts = computed(() => {
  return {
    all: posts.value.filter(p => p.status !== 'draft').length,
    published: posts.value.filter(p => p.status === 'published').length,
    rejected: posts.value.filter(p => p.status === 'rejected').length
  }
})

const filteredPosts = computed(() => {
  if (managementTab.value === 'all') return posts.value.filter(p => p.status !== 'draft')
  if (managementTab.value === 'published') return posts.value.filter(p => p.status === 'published')
  if (managementTab.value === 'rejected') return posts.value.filter(p => p.status === 'rejected')
  if (managementTab.value === 'drafts') return posts.value.filter(p => p.status === 'draft')
  return posts.value
})

function onFilesChange(e) {
  const files = Array.from(e.target.files || [])
  files.forEach(file => {
    if (!file.type.startsWith('image/')) return
    const reader = new FileReader()
    reader.onload = () => {
      images.value.push({ file, data: reader.result })
    }
    reader.readAsDataURL(file)
  })
  if (fileInput.value) fileInput.value.value = null
}

function removeImage(idx) {
  images.value.splice(idx, 1)
}

function toggleTag(tagId) {
  const numericId = Number(tagId)
  if (Number.isNaN(numericId)) return
  const idx = selectedTagIds.value.indexOf(numericId)
  if (idx === -1) {
    selectedTagIds.value.push(numericId)
  } else {
    selectedTagIds.value.splice(idx, 1)
  }
}

function normalizeTagName(item) {
  if (!item) return ''
  if (typeof item === 'string') return item.trim()
  return (
    item.name ||
    item.tagName ||
    item.tag ||
    item.label ||
    item.displayName ||
    item.title ||
    ''
  ).trim()
}

function normalizeTagRecord(item) {
  if (!item) return null
  const type = (item.tagType || item.tag_type || item.type || '').toString().toLowerCase()
  if (type && type !== 'post') return null
  const name = normalizeTagName(item)
  const idValue = item.tagId ?? item.tag_id ?? item.id ?? item.tagID ?? null
  const parsedId = Number(idValue)
  if (!name || Number.isNaN(parsedId)) return null
  return { id: parsedId, name }
}

function serializeImagesForPayload() {
  // 仍以数组顺序代表 image_order，后端可按索引保存
  return images.value.map((img) => img.data || '')
}

async function loadTags() {
  tagsLoading.value = true
  selectedTagIds.value = []
  try {
    const list = await fetchTagDefinitions({ tagType: 'post' })
    const normalized = list
      .map(normalizeTagRecord)
      .filter(Boolean)
      .filter((tag, index, arr) => arr.findIndex(t => t.id === tag.id) === index)
    if (normalized.length) {
      availableTags.value = normalized
    } else {
      tagsError.value = '暂无可用标签，已展示默认选项'
      availableTags.value = [...DEFAULT_TAGS]
    }
  } catch (error) {
    console.warn('标签列表加载失败', error)
    tagsError.value = '标签加载失败，已使用默认标签'
    availableTags.value = [...DEFAULT_TAGS]
  } finally {
    tagsLoading.value = false
  }
}

function clearForm() {
  topic.value = ''
  content.value = ''
  images.value = []
  selectedTagIds.value = []
  visibility.value = 'public'
  message.value = ''
}

async function publish() {
  if (!topic.value.trim()) {
    message.value = '请填写主题（不超过30字）'
    return
  }
  if (topic.value.length > 30) {
    message.value = '主题不能超过30字'
    return
  }
  if (!content.value.trim() && images.value.length === 0) {
    message.value = '请填写正文或上传图片'
    return
  }

  if (containsSensitiveWords(content.value)) {
    message.value = '（帖子）包含敏感词，不可发表'
    return
  }

  const authStore = useAuthStore()
  const userId = authStore.userId

  const payload = {
    userId,
    topic: topic.value.trim(),
    content: content.value.trim(),
    // send data URLs (或可被后端解析的字符串数组)
    images: serializeImagesForPayload(),
    tags: selectedTagIds.value.slice(),
    visibility: visibility.value
  }

  message.value = '发布中...'
  try {
    const res = await createPost(payload)
    // 如果后端返回创建的帖子对象，添加到本地管理列表，优先使用后端返回
    const newPost = res && res.id ? res : {
      id: Math.max(0, ...posts.value.map(p => p.id)) + 1,
      title: payload.topic,
      topic: payload.topic,
      content: payload.content,
      tags: payload.tags,
      images: payload.images.map((data, order) => ({ data, order })),
      status: payload.visibility === 'draft' ? 'draft' : 'published'
    }
    // 如果后端保存成功，优先从后端刷新；否则使用本地回退对象并缓存
    try {
      // 如果后端返回了 id，重新加载后端数据可以保证一致
      if (res && res.id) {
        await loadPosts()
      } else {
        posts.value.unshift(newPost)
        const authStore = useAuthStore()
        const userId = authStore.userId
        if (userId) localStorage.setItem(LOCAL_POSTS_KEY(userId), JSON.stringify(posts.value))
      }
      message.value = '发布成功！已同步到你的账号'
      activeTab.value = 'manage'
      managementTab.value = 'published' // 直接跳转到已发布标签页
      clearForm()
    } catch (reloadErr) {
      // 如果刷新失败，仍向用户展示成功并保留本地数据
      posts.value.unshift(newPost)
      const authStore = useAuthStore()
      const userId = authStore.userId
      if (userId) localStorage.setItem(LOCAL_POSTS_KEY(userId), JSON.stringify(posts.value))
      message.value = '发布成功（离线缓存），稍后会与服务器同步'
      activeTab.value = 'manage'
      managementTab.value = 'published' // 直接跳转到已发布标签页
      clearForm()
    }
  } catch (err) {
    message.value = err.message || '发布失败，请重试'
  }
}

async function saveDraft() {
  const authStore = useAuthStore()
  const userId = authStore.userId

  const payload = {
    userId,
    topic: topic.value.trim(),
    content: content.value.trim(),
    images: serializeImagesForPayload(),
    tags: selectedTagIds.value.slice(),
    visibility: 'draft'
  }

  message.value = '草稿保存中...'
  try {
    const res = await createPost(payload)
    const draftPost = res && res.id ? res : {
      id: Math.max(0, ...posts.value.map(p => p.id)) + 1,
      title: payload.topic,
      topic: payload.topic,
      content: payload.content,
      tags: payload.tags,
      images: payload.images.map((data, order) => ({ data, order })),
      status: 'draft'
    }
    // 尝试刷新后端数据
    try {
      if (res && res.id) {
        await loadPosts()
      } else {
        posts.value.unshift(draftPost)
        if (userId) localStorage.setItem(LOCAL_POSTS_KEY(userId), JSON.stringify(posts.value))
      }
      message.value = '已保存为草稿（已同步）'
      clearForm()
    } catch (e) {
      posts.value.unshift(draftPost)
      if (userId) localStorage.setItem(LOCAL_POSTS_KEY(userId), JSON.stringify(posts.value))
      message.value = '已保存为草稿（本地缓存）'
      clearForm()
    }
  } catch (err) {
    message.value = err.message || '保存草稿失败'
  }
}

function editDraft(id) {
  const p = posts.value.find(x => x.id === id && x.status === 'draft')
  if (!p) return
  // load into form
  topic.value = p.topic || p.title || ''
  content.value = p.content
  selectedTagIds.value = Array.isArray(p.tags) ? p.tags.slice() : []
  images.value = p.images.slice()
  // remove draft from list (will be re-saved or published)
  removePost(id)
  activeTab.value = 'new'
}

// load posts when component mounts
onMounted(() => {
  loadPosts()
  loadTags()
})

// when user opens management tab, reload to ensure latest from backend
watch(activeTab, (v) => {
  if (v === 'manage') loadPosts()
})

function statusText(s) {
  if (s === 'published') return '已发布'
  if (s === 'review') return '审核中'
  if (s === 'rejected') return '未通过'
  if (s === 'draft') return '草稿'
  return s
}

function setStatus(id, st) {
  const p = posts.value.find(x => x.id === id)
  if (p) p.status = st
}

async function removePost(id) {
  // confirm first
  const ok = window.confirm('确定要删除该帖子吗？该操作不可恢复。')
  if (!ok) return

  message.value = '删除中...'
  try {
    await deletePost(id)
    // 删除成功后重新从后端拉取最新数据
    await loadPosts()
    message.value = '删除成功'
  } catch (err) {
    // 如果删除接口失败，尝试在本地删除并缓存（退路），但提示用户
    const idx = posts.value.findIndex(x => x.id === id)
    if (idx !== -1) posts.value.splice(idx, 1)
    const authStore = useAuthStore()
    const userId = authStore.userId
    if (userId) localStorage.setItem(LOCAL_POSTS_KEY(userId), JSON.stringify(posts.value))
    message.value = err.message || '删除失败（已在本地移除），请稍后重试同步到服务器'
  }
}

/**
 * 返回用于卡片封面的图片 URL 或 dataURL
 */
function coverFor(p) {
  try {
    if (!p) return 'https://via.placeholder.com/400x240?text=%E6%9A%82%E6%97%A0%E5%9B%BE%E7%89%87'
    const imgs = p.images || []
    if (imgs.length === 0) return 'https://via.placeholder.com/400x240?text=%E6%9A%82%E6%97%A0%E5%9B%BE%E7%89%87'
    const first = imgs[0]
    // 支持多种形态：字符串、{url}, {data}, {path}, {thumb}, {imageUrl}
    if (typeof first === 'string') return first
    if (first.data) return first.data
    if (first.url) return first.url
    if (first.path) return first.path
    if (first.thumb) return first.thumb
    if (first.imageUrl) return first.imageUrl
    // last resort: stringify object to data URL? just show placeholder
    return 'https://via.placeholder.com/400x240?text=%E6%9A%82%E6%97%A0%E5%9B%BE%E7%89%87'
  } catch (e) {
    return 'https://via.placeholder.com/400x240?text=%E6%9A%82%E6%97%A0%E5%9B%BE%E7%89%87'
  }
}
</script>

<style scoped>
.create-post-page {
  max-width: 760px;
  margin: 0 auto;
  background-color: #ffffff;
  color: #1f2937;
  padding: 20px 24px 32px;
  min-height: 100%;
  border-radius: 16px;
}

.label-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.create-card {
  background-color: transparent;
  padding: 0;
  border-radius: 0;
  display: flex;
  flex-direction: column;
  gap: 18px;
  border: none;
  box-shadow: none;
}

.top-tabs {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.tab {
  padding: 8px 16px;
  border-radius: 999px;
  background: #f5f6f8;
  color: #6b7280;
  border: 1px solid #e2e4e8;
  cursor: pointer;
  font-size: 14px;
}

.tab.active {
  background: #8b5cf6;
  color: #fff;
  border-color: #8b5cf6;
}

.manage-card {
  background: transparent;
  padding: 0;
  border-radius: 0;
  border: none;
  box-shadow: none;
}

.manage-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  border-bottom: 1px solid #e5e7eb;
}

.manage-tab {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 16px;
  background: none;
  border: none;
  color: #6b7280;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  transition: all 0.2s;
}

.manage-tab:hover {
  color: #374151;
}

.manage-tab.active {
  color: #8b5cf6;
  border-bottom-color: #8b5cf6;
}

.manage-toolbar { display:flex; justify-content:space-between; align-items:center; padding:8px 0; margin-bottom:8px; background:#ffffff; color: #6b7280; font-size: 13px; }
.manage-grid-wrapper { max-height: 60vh; overflow:auto; padding-right:6px; }
.manage-grid { display:grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
.empty { display:flex; justify-content:center; align-items:center; height:200px; color:#9ca3af; font-size:16px; }
.post-card { background:#f5f6f8; border-radius:10px; overflow:hidden; display:flex; flex-direction:column; border:1px solid #e2e4e8 }
.card-actions button { background:#e8eaed; color:#374151; border:1px solid #d4d8de; padding:6px 8px; border-radius:6px; cursor:pointer }
.card-image { width:100%; aspect-ratio: 16/10; overflow:hidden; }
.card-image img { width:100%; height:100%; object-fit:cover; display:block }
.card-body { padding:10px; }
.card-title { color:#1f2937; font-weight:600; font-size:16px }
.card-footer { display:flex; justify-content:space-between; align-items:center; padding:8px 10px; border-top:1px solid #e5e7eb }
.card-actions .danger { background:#fee2e2; color:#dc2626; border-color:#fecaca }
.status { color:#8b5cf6; font-weight:600 }

/* sticky headers: top-tabs and manage-tabs/toolbar stick to top of the page area */
.top-tabs, .manage-tabs, .manage-toolbar {
  position: sticky;
  top: 0;
  z-index: 20;
}

.top-tabs { background: #ffffff; padding-top:6px; padding-bottom:6px }
.manage-tabs { background: #ffffff; padding:6px 0 }


.field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.label {
  color: #374151;
  font-size: 14px;
  font-weight: 500;
}

.create-post-page input[type="text"],
.create-post-page textarea,
.create-post-page select {
  background-color: #e8eaed !important;
  border: 1px solid #d4d8de !important;
  color: #1f2937 !important;
  padding: 12px;
  border-radius: 10px;
  font-size: 14px;
  transition: border-color 0.2s, background-color 0.2s;
}

.create-post-page input[type="text"]:focus,
.create-post-page textarea:focus,
.create-post-page select:focus {
  outline: none;
  border-color: #8b5cf6 !important;
  background-color: #eceef1 !important;
}

.create-post-page input[type="text"]::placeholder,
.create-post-page textarea::placeholder {
  color: #9ca3af !important;
}

.create-post-page .meta {
  color: #9ca3af;
  font-size: 12px;
}

.images-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
}

.file-input-hidden {
  position: absolute;
  width: 0;
  height: 0;
  opacity: 0;
  overflow: hidden;
  pointer-events: none;
}

.file-pick-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 120px;
  height: 120px;
  padding: 12px 16px;
  background: #e8eaed;
  color: #374151;
  border: 1px dashed #c5cad1;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  transition: border-color 0.2s, background-color 0.2s, color 0.2s;
}

.file-pick-btn:hover {
  background: #dfe2e6;
  border-color: #8b5cf6;
  color: #8b5cf6;
}

.thumb {
  position: relative;
  width: 120px;
  height: 120px;
  border-radius: 8px;
  overflow: hidden;
  background: #e8eaed;
  border: 1px solid #d4d8de;
}

.thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.thumb .remove {
  position: absolute;
  top: 6px;
  right: 6px;
  background: rgba(255,255,255,0.9);
  color: #6b7280;
  border: none;
  border-radius: 12px;
  width: 24px;
  height: 24px;
  cursor: pointer;
  box-shadow: 0 1px 2px rgba(0,0,0,0.1);
}

.thumb .remove:hover {
  background: #ef4444;
  color: #fff;
}

.tags-scroll {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  padding: 12px;
  max-height: 96px;
  overflow-y: auto;
  border: 1px solid #d4d8de;
  border-radius: 12px;
  background: #e8eaed;
}

.tags-scroll::-webkit-scrollbar {
  width: 6px;
}

.tags-scroll::-webkit-scrollbar-thumb {
  background: #d1d5db;
  border-radius: 6px;
}

.tag-chip {
  padding: 8px 14px;
  border-radius: 999px;
  background: #ffffff;
  color: #4b5563;
  border: 1px solid #d1d5db;
  cursor: pointer;
  transition: background 0.2s, color 0.2s, border-color 0.2s;
}

.tag-chip:hover {
  border-color: #8b5cf6;
  color: #8b5cf6;
}

.tag-chip.selected {
  background: #8b5cf6;
  color: #fff;
  border-color: #8b5cf6;
}

.tags-hint {
  margin-top: 6px;
  font-size: 12px;
  color: #9ca3af;
}

.actions {
  display: flex;
  gap: 12px;
}

.publish {
  background: #8b5cf6;
  color: #fff;
  border: none;
  padding: 12px 20px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
}

.publish:hover {
  background: #7c3aed;
}

.draft {
  background: #e8eaed;
  color: #4b5563;
  border: 1px solid #d4d8de;
  padding: 12px 16px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
}

.draft:hover {
  background: #dfe2e6;
}

.cancel {
  background: #ffffff;
  color: #6b7280;
  border: 1px solid #d1d5db;
  padding: 12px 16px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
}

.cancel:hover {
  background: #f9fafb;
}

.message {
  margin-top: 6px;
  color: #8b5cf6;
  font-size: 14px;
}
</style>