<template>
  <div class="post-detail-page">
    <!-- 返回按钮 -->
    <button @click="goBack" class="back-button">
      <span
        class="iconify"
        data-icon="mdi:arrow-left"
        data-inline="false"
      ></span>
      <span>返回</span>
    </button>

    <div class="post-detail-card">
      <div class="post-header">
        <div class="user-avatar-container" @click="showUserMenu(post.author)">
          <img
            :src="getAvatarUrl(post.author.avatar, post.author.name)"
            :alt="post.author.name"
            class="user-avatar"
            @error="handleAvatarError($event, post.author.name)"
          />
          <!-- 用户操作菜单 -->
          <div
            v-if="
              showingMenu && selectedUser && selectedUser.id === post.author.id
            "
            class="user-menu"
            @click.stop
          >
            <div
              v-if="authStore.isAuthenticated"
              @click.stop="
                toggleFollow(post.author.id);
                hideUserMenu();
              "
              class="menu-item"
            >
              {{ isFollowing(post.author.id) ? "取消关注" : "关注" }}
            </div>
            <div
              @click.stop="
                goToUserDetail(post.author.id);
                hideUserMenu();
              "
              class="menu-item"
            >
              查看详情
            </div>
            <div
              v-if="authStore.isAuthenticated && post.author.id !== authStore.userId"
              @click.stop="openReportMenu('user', post.author)"
              class="menu-item"
            >
              举报用户
            </div>
          </div>
        </div>
        <div class="user-info">
          <div class="username">{{ post.author.name }}</div>
          <div class="user-handle">@{{ post.author.handle }}</div>
        </div>
        <div class="meta">
          <div class="time">{{ post.time }}</div>
          <div class="location">{{ post.location }}</div>
        </div>
      </div>

      <div class="post-body">
        <h2 v-if="post.title" class="post-title">{{ post.title }}</h2>
        <p class="caption">{{ post.caption }}</p>
        <div v-if="post.hashtags" class="hashtags">{{ post.hashtags }}</div>
        <div v-if="currentImageSrc" class="post-image">
          <img :src="currentImageSrc" alt="post image" />
          <button
            v-if="post.images.length > 1"
            class="carousel-arrow prev"
            :disabled="currentImageIndex === 0"
            @click="showPrevImage"
          >
            ‹
          </button>
          <button
            v-if="post.images.length > 1"
            class="carousel-arrow next"
            :disabled="currentImageIndex === post.images.length - 1"
            @click="showNextImage"
          >
            ›
          </button>
          <div v-if="post.images.length > 1" class="image-counter">
            {{ currentImageIndex + 1 }} / {{ post.images.length }}
          </div>
        </div>
      </div>

      <div class="post-interact">
        <button
          :class="['like-btn', { liked: liked.value }]"
          @click="toggleLike"
        >
          <span
            class="iconify"
            :data-icon="liked.value ? 'mdi:heart' : 'mdi:heart-outline'"
            data-inline="false"
          ></span>
          <span>{{ likes }}</span>
        </button>
        <!-- 收藏（bookmark）显示及交互 -->
        <button
          :class="['fav-btn', { favorited: favorited.value }]"
          @click="toggleFavorite"
        >
          <span
            class="iconify"
            :data-icon="
              favorited.value ? 'mdi:bookmark' : 'mdi:bookmark-outline'
            "
            data-inline="false"
          ></span>
          <span>{{ favorites }}</span>
        </button>
        <button class="comment-btn" @click="focusCommentInput">
          <span
            class="iconify"
            data-icon="mdi:comment-outline"
            data-inline="false"
          ></span>
          评论 ({{ totalCommentCount }})
        </button>
        <button
          v-if="authStore.isAuthenticated && post.author.id !== authStore.userId"
          class="comment-btn"
          @click="openReportMenu('post', post)"
        >
          举报帖子
        </button>
      </div>

      <!-- Toast 提示 -->
      <div v-if="showToast" class="toast">{{ toastText }}</div>

      <!-- 举报菜单弹窗 -->
      <div v-if="showReportMenu" class="report-overlay" @click="cancelReport">
        <div class="report-menu" @click.stop>
          <div class="report-menu-title">{{ reportDialogTitle }}</div>
          <div class="report-menu-reasons">
            <button class="report-reason-btn" @click="submitReport('色情低俗')">色情低俗</button>
            <button class="report-reason-btn" @click="submitReport('侮辱谩骂')">侮辱谩骂</button>
            <button class="report-reason-btn" @click="submitReport('广告营销')">广告营销</button>
            <button class="report-reason-btn" @click="submitReport('虚假信息')">虚假信息</button>
            <button class="report-reason-btn" @click="submitReport('其他')">其他</button>
          </div>
          <button class="report-cancel-btn" @click="cancelReport">取消</button>
        </div>
      </div>

      <!-- 关注/取消关注提示 -->
      <div v-if="showFollowToast" class="toast">{{ followToastMessage }}</div>

      <div class="comments-section">
        <!-- 评论输入框 -->
        <div class="add-comment">
          <div v-if="replyingTo" class="reply-preview">
            <div class="reply-preview-content">
              <span class="reply-preview-label"
                >回复 {{ replyingTo.author }}:</span
              >
              <span class="reply-preview-text">{{ replyingTo.text }}</span>
              <button class="reply-cancel-btn" @click="cancelReply">
                取消
              </button>
            </div>
          </div>
          <input
            ref="commentInput"
            :value="replyingTo ? replyContent : newComment"
            @input="
              replyingTo
                ? (replyContent = $event.target.value)
                : (newComment = $event.target.value)
            "
            :placeholder="
              replyingTo ? `回复 ${replyingTo.author}...` : '写评论...'
            "
            @keydown.enter.prevent="replyingTo ? submitReply() : addComment()"
          />
          <button
            @click="replyingTo ? submitReply() : addComment()"
            :disabled="loading"
          >
            <span v-if="loading">发布中...</span>
            <span v-else>发布</span>
          </button>
        </div>
        <div
          v-if="error"
          class="comment-error"
          style="color: #ef4444; margin-top: 6px"
        >
          {{ error }}
        </div>

        <!-- 评论列表 -->
        <div class="comment-list">
          <div v-if="comments.length === 0 && !loading" class="no-comments">
            暂无评论
          </div>
          <div v-for="c in comments" :key="c.id" class="comment">
            <div class="comment-header">
              <div class="comment-author-info">
                <div class="comment-author">{{ c.author }}</div>
                <div class="comment-time">{{ formatTime(c.createdAt) }}</div>
              </div>
              <div class="comment-actions-right">
                <button
                  v-if="c.userId === authStore.userId"
                  class="comment-delete-btn"
                  @click="handleDeleteComment(c.id)"
                  title="删除评论"
                >
                  <span
                    class="iconify"
                    data-icon="mdi:delete-outline"
                    data-inline="false"
                  ></span>
                </button>
                <div
                  v-if="c.userId !== authStore.userId"
                  class="comment-more-container"
                >
                  <button
                    class="comment-more-btn"
                    @click.stop="toggleCommentMore(c.id)"
                    title="更多"
                  >
                    <span
                      class="iconify"
                      data-icon="mdi:dots-vertical"
                      data-inline="false"
                    ></span>
                  </button>
                  <div
                    v-if="showingCommentMore === c.id"
                    class="comment-report-box"
                    @click.stop
                  >
                    <button class="report-btn" @click.stop="openReportMenu('comment', c)">举报该评论</button>
                  </div>
                </div>
              </div>
            </div>

            <!-- 引用的父评论 -->
            <div v-if="c.parentComment" class="comment-quote">
              <div class="comment-quote-author">
                {{ c.parentComment.author }}:
              </div>
              <div class="comment-quote-text">{{ c.parentComment.text }}</div>
            </div>

            <div class="comment-text">{{ c.text }}</div>

            <div class="comment-actions">
              <button class="comment-reply-btn" @click="startReply(c)">
                <span
                  class="iconify"
                  data-icon="mdi:reply-outline"
                  data-inline="false"
                ></span>
                回复
              </button>
            </div>

            <!-- 回复列表（支持无限层级） -->
            <div
              v-if="c.replies && c.replies.length > 0"
              class="comment-replies"
            >
              <div
                v-for="reply in c.replies"
                :key="reply.id"
                class="comment-item"
              >
                <div class="comment-header">
                  <div class="comment-author-info">
                    <div class="comment-author">{{ reply.author }}</div>
                    <div class="comment-time">
                      {{ formatTime(reply.createdAt) }}
                    </div>
                  </div>
                  <div class="comment-actions-right">
                    <button
                      v-if="reply.userId === authStore.userId"
                      class="comment-delete-btn"
                      @click="handleDeleteComment(reply.id)"
                      title="删除评论"
                    >
                      <span
                        class="iconify"
                        data-icon="mdi:delete-outline"
                        data-inline="false"
                      ></span>
                    </button>
                    <div
                      v-if="reply.userId !== authStore.userId"
                      class="comment-more-container"
                    >
                      <button
                        class="comment-more-btn"
                        @click.stop="toggleCommentMore(reply.id)"
                        title="更多操作"
                      >
                        <span
                          class="iconify"
                          data-icon="mdi:dots-vertical"
                          data-inline="false"
                        ></span>
                      </button>
                      <div
                        v-if="showingCommentMore === reply.id"
                        class="comment-report-box"
                        @click.stop
                      >
                        <button class="report-btn" @click.stop="openReportMenu('comment', reply)">举报该评论</button>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- 引用的父评论 -->
                <div v-if="reply.parentComment" class="comment-quote">
                  <div class="comment-quote-author">
                    {{ reply.parentComment.author }}:
                  </div>
                  <div class="comment-quote-text">
                    {{ reply.parentComment.text }}
                  </div>
                </div>

                <div class="comment-text">{{ reply.text }}</div>

                <div class="comment-actions">
                  <button class="comment-reply-btn" @click="startReply(reply)">
                    <span
                      class="iconify"
                      data-icon="mdi:reply-outline"
                      data-inline="false"
                    ></span>
                    回复
                  </button>
                </div>

                <!-- 递归显示更深层的回复 -->
                <div
                  v-if="reply.replies && reply.replies.length > 0"
                  class="comment-replies"
                >
                  <div
                    v-for="nestedReply in reply.replies"
                    :key="nestedReply.id"
                    class="comment-item"
                  >
                    <div class="comment-header">
                      <div class="comment-author-info">
                        <div class="comment-author">
                          {{ nestedReply.author }}
                        </div>
                        <div class="comment-time">
                          {{ formatTime(nestedReply.createdAt) }}
                        </div>
                      </div>
                      <div class="comment-actions-right">
                        <button
                          v-if="nestedReply.userId === authStore.userId"
                          class="comment-delete-btn"
                          @click="handleDeleteComment(nestedReply.id)"
                          title="删除评论"
                        >
                          <span
                            class="iconify"
                            data-icon="mdi:delete-outline"
                            data-inline="false"
                          ></span>
                        </button>
                        <div
                          v-if="nestedReply.userId !== authStore.userId"
                          class="comment-more-container"
                        >
                          <button
                            class="comment-more-btn"
                            @click.stop="toggleCommentMore(nestedReply.id)"
                            title="更多操作"
                          >
                            <span
                              class="iconify"
                              data-icon="mdi:dots-vertical"
                              data-inline="false"
                            ></span>
                          </button>
                          <div
                            v-if="showingCommentMore === nestedReply.id"
                            class="comment-report-box"
                            @click.stop
                          >
                            <button class="report-btn" @click.stop="openReportMenu('comment', nestedReply)">举报该评论</button>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div v-if="nestedReply.parentComment" class="comment-quote">
                      <div class="comment-quote-author">
                        {{ nestedReply.parentComment.author }}:
                      </div>
                      <div class="comment-quote-text">
                        {{ nestedReply.parentComment.text }}
                      </div>
                    </div>

                    <div class="comment-text">{{ nestedReply.text }}</div>

                    <div class="comment-actions">
                      <button
                        class="comment-reply-btn"
                        @click="startReply(nestedReply)"
                      >
                        <span
                          class="iconify"
                          data-icon="mdi:reply-outline"
                          data-inline="false"
                        ></span>
                        回复
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, provide } from "vue";
import { useRoute, useRouter } from "vue-router";
import {
  getPost,
  getComments,
  postComment,
  deleteComment,
  reportComment,
  reportPost,
  likePost,
  unlikePost,
} from "@/api/posts";
import { useAuthStore } from "@/stores/auth";
import { followUser, unfollowUser, reportUser } from "@/api/user";
import { fetchTagDefinitions } from "@/api/tags";
import {
  addPostToFavorites,
  removePostFromFavorites,
  getFavoriteFolders,
  getUserFavoritePosts,
} from "@/api/favorites";
import { containsSensitiveWords } from "@/utils/sensitiveWords";

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const id = route.params.id;

// 提供 authStore 给子组件使用
provide("authStore", authStore);

// 格式化时间函数
function formatTime(ts) {
  if (!ts) return "";
  try {
    const d = new Date(ts);
    return d.toLocaleString();
  } catch (e) {
    return ts;
  }
}

const post = ref({
  author: {},
  caption: "",
  hashtags: "",
  image: "",
  likes: 0,
  images: [],
  title: "",
});
const tagMap = ref(new Map()); // 标签ID到名称的映射

// 生成文字头像（显示用户名字前两个字）
function generateTextAvatar(name) {
  if (!name) return null;

  // 获取名字前两个字
  const text = name.length >= 2 ? name.substring(0, 2) : name.substring(0, 1);

  // 创建 canvas 生成头像
  const canvas = document.createElement("canvas");
  canvas.width = 80;
  canvas.height = 80;
  const ctx = canvas.getContext("2d");

  // 生成随机背景色（基于名字的哈希值）
  const colors = [
    "#8b5cf6",
    "#3b82f6",
    "#10b981",
    "#f59e0b",
    "#ef4444",
    "#ec4899",
    "#06b6d4",
    "#6366f1",
  ];
  const hash = name
    .split("")
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const bgColor = colors[hash % colors.length];

  // 绘制背景
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 绘制文字
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 32px Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, canvas.width / 2, canvas.height / 2);

  return canvas.toDataURL();
}

// 获取头像 URL（优先使用真实头像，否则生成文字头像）
function getAvatarUrl(avatar, name) {
  if (avatar && avatar !== "https://via.placeholder.com/80") {
    return avatar;
  }

  // 如果没有头像，生成文字头像
  if (name) {
    return generateTextAvatar(name) || "https://via.placeholder.com/80";
  }

  return "https://via.placeholder.com/80";
}

// 处理头像加载错误
function handleAvatarError(event, name) {
  // 如果头像加载失败，生成文字头像
  if (name) {
    const textAvatar = generateTextAvatar(name);
    if (textAvatar) {
      event.target.src = textAvatar;
    }
  }
}

// local reactive state for likes/comments
const likes = ref(0);
const comments = ref([]);
const totalCommentCount = ref(0); // 总评论数（包括所有回复）
const favorites = ref(0);
const newComment = ref("");
const commentInput = ref(null);
const currentImageIndex = ref(0);
const replyingTo = ref(null); // 当前正在回复的评论
const replyContent = ref(""); // 回复内容
const currentFavoriteId = ref(null); // 当前收藏的ID（用于取消收藏）

// toggleable states
const liked = ref(false);
const favorited = ref(false);
const loading = ref(false);
const error = ref("");

// 举报相关状态
const reportedComments = ref(new Set());
const showingCommentMore = ref(null);
const showReportMenu = ref(false);
const reportTarget = ref(null);
const reportTargetType = ref("comment");

// 用户菜单相关状态
const showingMenu = ref(false);
const selectedUser = ref(null);
const followingMap = ref(new Map());

// 关注/取消关注提示
const showFollowToast = ref(false);
const followToastMessage = ref("");

// Toast 提示
const showToast = ref(false);
const toastText = ref("");
function showToastMessage(message) {
  toastText.value = message;
  showToast.value = true;
  setTimeout(() => {
    showToast.value = false;
  }, 1500);
}

const currentImageSrc = computed(() => {
  if (post.value.images && post.value.images.length) {
    const img =
      post.value.images[currentImageIndex.value] || post.value.images[0];
    return img?.url || img?.data || "";
  }
  return post.value.image || "";
});

const reportDialogTitle = computed(() => {
  if (reportTargetType.value === "post") return "举报帖子";
  if (reportTargetType.value === "user") return "举报用户";
  return "举报评论";
});

// 获取本地点赞状态
function getLocalLikeStatus(postId) {
  try {
    const likes = JSON.parse(localStorage.getItem("userLikes") || "{}");
    return likes[postId] === true;
  } catch (e) {
    return false;
  }
}

// 设置本地点赞状态
function setLocalLikeStatus(postId, status) {
  try {
    const likes = JSON.parse(localStorage.getItem("userLikes") || "{}");
    if (status) {
      likes[postId] = true;
    } else {
      delete likes[postId];
    }
    localStorage.setItem("userLikes", JSON.stringify(likes));
  } catch (e) {
    console.error("保存点赞状态失败:", e);
  }
}

// 获取本地收藏状态
function getLocalFavoriteStatus(postId) {
  try {
    const favorites = JSON.parse(localStorage.getItem("userFavorites") || "{}");
    return favorites[postId] === true;
  } catch (e) {
    return false;
  }
}

// 设置本地收藏状态
function setLocalFavoriteStatus(postId, status) {
  try {
    const favorites = JSON.parse(localStorage.getItem("userFavorites") || "{}");
    if (status) {
      favorites[postId] = true;
    } else {
      delete favorites[postId];
    }
    localStorage.setItem("userFavorites", JSON.stringify(favorites));
  } catch (e) {
    console.error("保存收藏状态失败:", e);
  }
}

async function toggleLike() {
  if (!authStore.isAuthenticated) {
    showToastMessage("请先登录");
    setTimeout(() => router.push("/login"), 800);
    return;
  }

  const userId = authStore.userId;
  if (!userId) {
    showToastMessage("请先登录");
    setTimeout(() => router.push("/login"), 800);
    return;
  }

  // 允许给自己的帖子点赞（移除限制）
  const wasLiked = liked.value;
  const wasLikeCount = likes.value;

  try {
    if (liked.value) {
      // 取消点赞 - 乐观更新
      liked.value = false;
      likes.value = Math.max(0, likes.value - 1);
      await unlikePost(post.value.id, userId);
      setLocalLikeStatus(post.value.id, false); // 同步到 localStorage
      showToastMessage("已取消点赞");
    } else {
      // 点赞 - 乐观更新
      liked.value = true;
      likes.value = (likes.value || 0) + 1;
      await likePost(post.value.id, userId);
      setLocalLikeStatus(post.value.id, true); // 同步到 localStorage
      showToastMessage("点赞成功");
    }

    // 刷新帖子数据以确保数据同步
    await refreshPostData();
  } catch (error) {
    // 恢复状态
    liked.value = wasLiked;
    likes.value = wasLikeCount;
    console.error("点赞操作失败:", error);
    showToastMessage("操作失败，请重试");
  }
}

// 收藏
async function toggleFavorite() {
  if (!authStore.isAuthenticated) {
    showToastMessage("请先登录");
    setTimeout(() => router.push("/login"), 800);
    return;
  }

  const userId = authStore.userId;
  if (!userId) {
    showToastMessage("请先登录");
    setTimeout(() => router.push("/login"), 800);
    return;
  }

  const wasFavorited = favorited.value;
  const wasFavoriteCount = favorites.value;
  const wasFavoriteId = currentFavoriteId.value;

  try {
    if (favorited.value) {
      // 取消收藏 - 乐观更新
      favorited.value = false;
      favorites.value = Math.max(0, favorites.value - 1);

      // 如果有 favoriteId，直接使用它取消收藏
      if (currentFavoriteId.value) {
        try {
          await removePostFromFavorites(currentFavoriteId.value);
          currentFavoriteId.value = null;
        } catch (removeError) {
          // 如果取消收藏失败，可能是 favoriteId 无效，尝试刷新数据
          console.warn(
            "使用 favoriteId 取消收藏失败，尝试刷新数据:",
            removeError
          );
          await refreshPostData();
          // 如果刷新后仍然有 favoriteId，再次尝试
          if (currentFavoriteId.value) {
            await removePostFromFavorites(currentFavoriteId.value);
            currentFavoriteId.value = null;
          }
        }
      } else {
        // 如果没有 favoriteId，先刷新数据
        console.warn("currentFavoriteId 为空，刷新数据后重试");
        await refreshPostData();

        if (currentFavoriteId.value) {
          // 刷新后有了 favoriteId，使用它取消收藏
          await removePostFromFavorites(currentFavoriteId.value);
          currentFavoriteId.value = null;
        } else {
          // 如果刷新后仍然没有 favoriteId，尝试查询用户的收藏列表来找到这个帖子的收藏记录
          console.warn("刷新后仍然没有 favoriteId，尝试查询收藏列表");
          try {
            const favorites = await getUserFavoritePosts(userId, null, 1, 100);
            const favoriteList = Array.isArray(favorites)
              ? favorites
              : favorites?.data || [];
            const favoriteRecord = favoriteList.find(
              (f) => (f.postId || f.post_id || f.postId) === post.value.id
            );

            if (favoriteRecord) {
              const foundFavoriteId =
                favoriteRecord.favoriteId ||
                favoriteRecord.id ||
                favoriteRecord.favorite_id;
              if (foundFavoriteId) {
                await removePostFromFavorites(foundFavoriteId);
                currentFavoriteId.value = null;
                console.log("通过查询收藏列表找到 favoriteId 并成功取消收藏");
              } else {
                console.warn("找到收藏记录但没有 favoriteId");
              }
            } else {
              console.warn(
                "在收藏列表中未找到该帖子的收藏记录，可能已经取消收藏"
              );
            }
          } catch (queryError) {
            console.error("查询收藏列表失败:", queryError);
            // 即使查询失败，也继续执行，因为可能已经取消收藏了
          }
        }
      }
      setLocalFavoriteStatus(post.value.id, false); // 同步到 localStorage
      showToastMessage("已取消收藏");
    } else {
      // 收藏 - 先获取用户的收藏夹列表
      try {
        const folders = await getFavoriteFolders(userId);
        const folderList = Array.isArray(folders)
          ? folders
          : folders?.data || [];

        if (folderList.length === 0) {
          showToastMessage("请先创建收藏夹");
          return;
        }

        // 使用第一个收藏夹
        const folderId =
          folderList[0].folderId || folderList[0].id || folderList[0].folder_id;

        if (!folderId) {
          showToastMessage("无法获取收藏夹ID，请重试");
          return;
        }

        // 收藏 - 乐观更新
        favorited.value = true;
        favorites.value = (favorites.value || 0) + 1;
        await addPostToFavorites(userId, post.value.id, folderId);
        setLocalFavoriteStatus(post.value.id, true); // 同步到 localStorage
        showToastMessage("收藏成功");
      } catch (folderError) {
        console.error("获取收藏夹失败:", folderError);
        showToastMessage("获取收藏夹失败，请重试");
        return;
      }
    }

    // 刷新帖子数据以确保数据同步
    await refreshPostData();
  } catch (error) {
    // 恢复状态
    favorited.value = wasFavorited;
    favorites.value = wasFavoriteCount;
    currentFavoriteId.value = wasFavoriteId;
    console.error("收藏操作失败:", error);
    showToastMessage("操作失败，请重试");
  }
}

// 用户菜单相关函数
function showUserMenu(user) {
  selectedUser.value = user;
  showingMenu.value = true;
}

function hideUserMenu() {
  showingMenu.value = false;
  selectedUser.value = null;
}

function openReportMenu(type, target) {
  if (!authStore.isAuthenticated) {
    showToastMessage("请先登录");
    return;
  }
  if (type === "comment" && target?.userId === authStore.userId) {
    showToastMessage("不能举报自己的评论");
    return;
  }
  if (type === "user" && target?.id === authStore.userId) {
    showToastMessage("不能举报自己");
    return;
  }
  if (type === "post" && post.value?.author?.id === authStore.userId) {
    showToastMessage("不能举报自己的帖子");
    return;
  }
  reportTargetType.value = type;
  reportTarget.value = target;
  showReportMenu.value = true;
  showingCommentMore.value = null;
  hideUserMenu();
}

function cancelReport() {
  showReportMenu.value = false;
  reportTarget.value = null;
}

function goToUserDetail(userId) {
  if (!userId) {
    console.error("用户ID为空，无法跳转到用户详情页");
    return;
  }
  console.log("跳转到用户详情页，用户ID:", userId);
  router.push({ name: "user", params: { id: userId } });
}

// 点击页面其他地方关闭菜单
const handleClickOutside = (e) => {
  if (
    showingMenu.value &&
    !e.target.closest(".user-avatar-container") &&
    !e.target.closest(".user-menu")
  ) {
    hideUserMenu();
  }
  if (
    showingCommentMore.value &&
    !e.target.closest(".comment-more-container")
  ) {
    showingCommentMore.value = null;
  }
};

document.addEventListener("click", handleClickOutside);

// 组件卸载时移除事件监听器
onUnmounted(() => {
  document.removeEventListener("click", handleClickOutside);
});

function isFollowing(userId) {
  return followingMap.value.get(userId) || false;
}

async function toggleFollow(userId) {
  if (!authStore.isAuthenticated) return;

  try {
    if (isFollowing(userId)) {
      await unfollowUser(userId);
      followingMap.value.set(userId, false);
      followToastMessage.value = "已取消关注";
    } else {
      await followUser(userId);
      followingMap.value.set(userId, true);
      followToastMessage.value = "关注成功";
    }
    showFollowToast.value = true;
    setTimeout(() => {
      showFollowToast.value = false;
    }, 1500);
  } catch (error) {
    console.error("关注/取消关注失败:", error);
  }
}

function addComment() {
  if (!newComment.value.trim()) return;
  if (!authStore.isAuthenticated) {
    alert("请先登录");
    router.push("/login");
    return;
  }

  const content = newComment.value.trim();
  if (containsSensitiveWords(content)) {
    error.value = "（评论）包含敏感词，不可发表";
    return;
  }
  const userId = authStore.userId;
  const payload = {
    postId: id,
    userId: userId,
    content,
    parentId: null,
  };
  loading.value = true;
  error.value = "";
  postComment(id, payload)
    .then(async (res) => {
      newComment.value = "";
      await loadComments();
      // 评论数会自动更新，因为模板中使用 comments.length
      // 但为了确保首页也能更新，我们需要重新加载帖子详情
      // 这里先不处理，因为首页的更新需要事件机制
    })
    .catch((err) => {
      error.value = err.message || "发表评论失败";
    })
    .finally(() => {
      loading.value = false;
      setTimeout(() => {
        const el = document.querySelector(".comments-section");
        if (el) el.scrollTop = 0;
      }, 100);
    });
}

// 开始回复评论
function startReply(comment) {
  if (!authStore.isAuthenticated) {
    alert("请先登录");
    router.push("/login");
    return;
  }
  replyingTo.value = comment;
  replyContent.value = "";
  // 聚焦到输入框
  setTimeout(() => {
    commentInput.value?.focus();
  }, 100);
}

// 取消回复
function cancelReply() {
  replyingTo.value = null;
  replyContent.value = "";
}

// 提交回复
function submitReply() {
  if (!replyContent.value.trim() || !replyingTo.value) return;

  const content = replyContent.value.trim();
  if (containsSensitiveWords(content)) {
    error.value = "（评论）包含敏感词，不可发表";
    return;
  }
  const userId = authStore.userId;
  // 确保 parentId 是数字类型
  const parentId =
    typeof replyingTo.value.id === "string"
      ? parseInt(replyingTo.value.id)
      : replyingTo.value.id;

  console.log(
    "提交回复 - postId:",
    id,
    "userId:",
    userId,
    "parentId:",
    parentId,
    "content:",
    content
  );
  console.log("replyingTo.value:", replyingTo.value);
  console.log(
    "replyingTo.value.id 类型:",
    typeof replyingTo.value.id,
    "值:",
    replyingTo.value.id
  );

  // 注意：不要包含 postId，后端从路径参数获取
  const payload = {
    userId: userId,
    content: content,
    parentId: parentId, // 设置父评论ID，必须是数字或 null
  };

  console.log("发送的 payload:", JSON.stringify(payload));

  loading.value = true;
  error.value = "";
  postComment(id, payload)
    .then((res) => {
      console.log("回复成功，响应:", res);
      replyContent.value = "";
      replyingTo.value = null;
      // 重新加载评论以显示新的回复
      loadComments();
    })
    .catch((err) => {
      console.error("回复失败:", err);
      error.value = err.message || "回复失败";
    })
    .finally(() => {
      loading.value = false;
      setTimeout(() => {
        const el = document.querySelector(".comments-section");
        if (el) el.scrollTop = 0;
      }, 100);
    });
}

// 删除评论
async function handleDeleteComment(commentId) {
  if (!authStore.isAuthenticated) {
    alert("请先登录");
    return;
  }

  if (!confirm("确定要删除这条评论吗？")) {
    return;
  }

  try {
    loading.value = true;
    error.value = "";

    console.log("删除评论 - postId:", id, "commentId:", commentId);

    // 先尝试删除评论
    try {
      const response = await deleteComment(id, commentId);
      console.log("删除评论响应:", response, "类型:", typeof response);

      // 后端返回的格式是 R<String>，经过 request.js 处理后：
      // - 如果 code === 200 且 data 是字符串，返回字符串 "评论删除成功"
      // - 如果 code === 200 且 data 是 null/undefined，返回整个 res 对象
      // - 如果 code !== 200，抛出错误
      // 所以如果到这里没有抛出错误，说明删除成功
      if (typeof response === "string" && response.includes("删除成功")) {
        console.log("删除成功，消息:", response);
      } else if (response && typeof response === "object" && response.message) {
        console.log("删除成功，消息:", response.message);
      } else {
        console.log("删除成功（响应格式:", typeof response, ")");
      }
      error.value = "";
    } catch (deleteErr) {
      console.error("删除评论API调用失败:", deleteErr);
      console.error("错误对象:", deleteErr);
      console.error("错误消息:", deleteErr.message);
      console.error("错误响应:", deleteErr.response);
      console.error("错误httpData:", deleteErr.httpData);

      // 检查错误消息
      const errorMessage =
        deleteErr.message ||
        deleteErr.httpData?.message ||
        deleteErr.response?.data?.message ||
        "删除评论失败";
      console.error("最终错误消息:", errorMessage);

      // 如果错误消息包含 "no messages available"，可能是响应处理的问题
      // 但这种情况不应该发生，因为 DELETE 请求应该返回 R<String>
      if (
        errorMessage.toLowerCase().includes("no messages available") ||
        errorMessage.toLowerCase().includes("messages available")
      ) {
        // 可能是响应格式问题，但删除可能已经成功，尝试重新加载评论
        console.log(
          '检测到 "no messages available" 错误，可能是响应处理问题，尝试重新加载评论'
        );
        // 不显示错误，继续执行重新加载
      } else {
        // 其他错误，显示错误消息并停止
        error.value = errorMessage;
        loading.value = false;
        return;
      }
    }

    // 无论删除API是否报错，都尝试重新加载评论列表
    // 因为删除可能已经成功，只是响应处理有问题
    try {
      await loadComments();
      console.log("评论列表重新加载成功");
      error.value = ""; // 清除错误
    } catch (loadErr) {
      console.error("重新加载评论失败:", loadErr);
      // 如果加载失败，检查是否是 "no messages available" 错误
      const loadErrorMessage =
        loadErr.message || loadErr.response?.data?.message || "";
      if (
        loadErrorMessage.toLowerCase().includes("no messages available") ||
        loadErrorMessage.toLowerCase().includes("messages available")
      ) {
        // 这可能是正常的（评论列表为空），不显示错误
        error.value = "";
      } else {
        error.value = "删除成功，但刷新评论列表失败: " + loadErrorMessage;
      }
    }
  } catch (err) {
    console.error("删除评论异常:", err);
    error.value = err.message || "删除评论失败";
  } finally {
    loading.value = false;
  }
}

function focusCommentInput() {
  commentInput.value?.focus();
}

// 切换评论更多菜单显示
function toggleCommentMore(commentId) {
  if (!authStore.isAuthenticated) {
    showToastMessage("请先登录");
    setTimeout(() => router.push("/login"), 800);
    return;
  }

  if (showingCommentMore.value === commentId) {
    showingCommentMore.value = null;
  } else {
    showingCommentMore.value = commentId;
  }
}

async function submitReport(reason) {
  const target = reportTarget.value;
  if (!target) return;
  try {
    if (reportTargetType.value === "comment") {
      if (reportedComments.value.has(target.id)) {
        showToastMessage("您已举报过该评论");
        cancelReport();
        return;
      }
      await reportComment(id, target.id, { reason });
      reportedComments.value.add(target.id);
    } else if (reportTargetType.value === "post") {
      await reportPost(id, { reason });
    } else if (reportTargetType.value === "user") {
      await reportUser(target.id, { reason });
    }
    cancelReport();
    showToastMessage("举报成功，已送入人工审查");
  } catch (err) {
    console.error("举报失败:", err);
    showToastMessage("举报失败，请重试");
  }
}

// 加载标签映射
async function loadTagMap() {
  try {
    const tags = await fetchTagDefinitions({ type: "post" });
    const map = new Map();
    tags.forEach((tag) => {
      const tagId = tag.tagId || tag.id || tag.tag_id;
      const tagName = tag.name || tag.tagName || tag.tag_name;
      if (tagId && tagName) {
        map.set(tagId, tagName);
      }
    });
    tagMap.value = map;
  } catch (e) {
    console.error("加载标签失败:", e);
  }
}

// 将标签ID数组转换为标签名称字符串，每个标签前面加井号
function formatTags(tagIds) {
  if (!Array.isArray(tagIds) || tagIds.length === 0) {
    return "";
  }
  return tagIds
    .map((tagId) => {
      const tagName = tagMap.value.get(tagId);
      const displayName = tagName || `标签${tagId}`;
      return `#${displayName}`;
    })
    .join(" ");
}

// 刷新帖子数据（用于点赞/收藏后同步）
async function refreshPostData() {
  try {
    const res = await getPost(id);
    const data = res && res.id ? res : res?.data ? res.data : res;

    // 更新点赞和收藏数据
    if (data.likeCount !== undefined) {
      likes.value = data.likeCount;
    }
    if (data.favoriteCount !== undefined) {
      favorites.value = data.favoriteCount;
    }
    if (data.isLiked !== undefined) {
      liked.value = data.isLiked;
    }
    if (data.isFavorited !== undefined) {
      favorited.value = data.isFavorited;
      currentFavoriteId.value = data.favoriteId ?? null;
    }
  } catch (error) {
    console.error("刷新帖子数据失败:", error);
    // 不显示错误，静默失败
  }
}

async function loadPost() {
  loading.value = true;
  try {
    // 先加载标签映射
    await loadTagMap();

    const res = await getPost(id);
    const data = res && res.id ? res : res?.data ? res.data : res;
    // map backend fields to view
    // 后端现在直接在Post对象中包含用户信息字段（nickname, username, avatarUrl）
    const author = data.user || data.author || data.creator || {};
    const normalizedImages = normalizeImages(
      data.images ||
        data.postImages ||
        data.imageList ||
        data.postImageList ||
        data.post_images ||
        []
    );
    const firstImage = normalizedImages.length
      ? normalizedImages[0].url || normalizedImages[0].data
      : null;

    // 处理标签：将ID转换为名称
    const tagIds = Array.isArray(data.tags) ? data.tags : [];
    const hashtags = formatTags(tagIds);

    // 确保用户ID正确设置
    const authorId =
      data.userId ??
      data.user_id ??
      author.id ??
      author.userId ??
      author.user_id ??
      null;
    console.log(
      "PostDetail - 设置作者ID:",
      authorId,
      "data.userId:",
      data.userId,
      "data:",
      data
    );

    post.value = {
      id: data.id ?? data._id ?? data.postId,
      author: {
        id: authorId, // 使用明确的userId字段
        avatar:
          data.avatarUrl ||
          author.avatar ||
          author.photo ||
          author.image ||
          author.avatarUrl ||
          null,
        name:
          data.nickname ||
          author.nickname ||
          data.username ||
          author.name ||
          author.username ||
          "匿名",
        handle:
          data.username ||
          author.handle ||
          author.username ||
          (data.nickname
            ? data.nickname.replace(/\s+/g, "")
            : author.nickname
            ? author.nickname.replace(/\s+/g, "")
            : ""),
      },
      time: data.createdAt
        ? new Date(data.createdAt).toLocaleString()
        : data.time || "",
      location: data.location || "",
      caption: data.content || data.caption || "", // 详情页显示内容，不显示标题
      title: data.topic || data.title || "", // 保存标题用于显示
      hashtags: hashtags, // 使用转换后的标签名称
      image: firstImage,
      likes: data.likes ?? data.likeCount ?? 0,
      favorites: data.favorites ?? data.favoriteCount ?? data.bookmarks ?? 0,
      images: normalizedImages,
    };
    currentImageIndex.value = 0;
    likes.value = post.value.likes;
    favorites.value =
      data.favoriteCount ?? data.favorites ?? data.bookmarks ?? 0;

    // 设置点赞和收藏状态
    liked.value = data.isLiked ?? false;
    favorited.value = data.isFavorited ?? false;
    currentFavoriteId.value = data.favoriteId ?? null;

    // load comments
    await loadComments();
  } catch (e) {
    error.value = e.message || "加载帖子失败";
  } finally {
    loading.value = false;
  }
}

async function loadComments() {
  try {
    const res = await getComments(id);
    console.log("获取评论响应:", res);

    // 处理不同的响应格式
    let arr = [];
    if (Array.isArray(res)) {
      arr = res;
    } else if (res?.data && Array.isArray(res.data)) {
      arr = res.data;
    } else if (res && typeof res === "object") {
      // 可能是单个对象或其他格式
      console.warn("评论响应格式异常:", res);
      arr = [];
    }

    console.log("加载评论，原始数据:", arr);

    // 构建评论映射和树结构（支持无限层级）
    const commentMap = new Map(); // commentId -> comment
    const topLevelComments = [];
    const repliesMap = new Map(); // parentId -> [replies]

    // 第一步：构建所有评论对象并建立映射
    arr.forEach((c) => {
      const commentId = c.commentId ?? c.comment_id ?? c.id ?? c._id;
      const parentId = c.parentId ?? c.parent_id ?? null;

      const comment = {
        id: commentId,
        userId: c.userId ?? c.user_id,
        author:
          c.nickname ||
          c.userName ||
          c.authorName ||
          (c.user && (c.user.nickname || c.user.name)) ||
          c.username ||
          "匿名",
        text: c.content || c.text || "",
        createdAt: c.created_at ?? c.createdAt,
        parentId: parentId,
        parentComment: null,
        replies: [], // 初始化回复列表
      };

      commentMap.set(commentId, comment);

      if (parentId) {
        // 这是回复
        if (!repliesMap.has(parentId)) {
          repliesMap.set(parentId, []);
        }
        repliesMap.get(parentId).push(comment);
      } else {
        // 这是顶级评论
        topLevelComments.push(comment);
      }
    });

    // 第二步：为每个评论查找父评论信息（用于显示引用）
    commentMap.forEach((comment, commentId) => {
      if (comment.parentId) {
        const parentComment = commentMap.get(comment.parentId);
        if (parentComment) {
          comment.parentComment = {
            id: parentComment.id,
            author: parentComment.author,
            text: parentComment.text,
          };
        }
      }
    });

    // 第三步：为每个评论设置回复列表（支持无限层级）
    repliesMap.forEach((replies, parentId) => {
      const parentComment = commentMap.get(parentId);
      if (parentComment) {
        // 按时间正序排列回复
        parentComment.replies = replies.sort((a, b) => {
          const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return ta - tb;
        });
      }
    });

    // 评论树结构已构建完成

    // 排序：最新的在前
    comments.value = topLevelComments.sort((a, b) => {
      const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return tb - ta;
    });

    // 计算总评论数（包括所有回复）
    totalCommentCount.value = commentMap.size;
    console.log("总评论数（包括回复）:", totalCommentCount.value);
  } catch (e) {
    console.error("加载评论失败:", e);
    comments.value = [];
  }
}

function goBack() {
  // 返回到上一个页面，如果没有历史记录则返回到explore页面
  if (window.history.length > 1) {
    router.back();
  } else {
    router.push("/discover");
  }
}

function normalizeImages(raw) {
  if (!Array.isArray(raw)) raw = raw ? [raw] : [];
  return raw
    .map((img, idx) => {
      if (!img) return null;
      if (typeof img === "string") return { url: img, order: idx };
      const order = img.imageOrder ?? img.image_order ?? img.order ?? idx;
      const url =
        img.url ||
        img.imageUrl ||
        img.image_url ||
        img.path ||
        img.thumb ||
        null;
      const data = img.data || img.base64 || null;
      if (!url && !data) return null;
      return { url, data, order };
    })
    .filter(Boolean)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

function showNextImage() {
  if (currentImageIndex.value < post.value.images.length - 1) {
    currentImageIndex.value += 1;
  }
}

function showPrevImage() {
  if (currentImageIndex.value > 0) {
    currentImageIndex.value -= 1;
  }
}

onMounted(() => {
  loadPost();
});
</script>

<style scoped>
.post-detail-page {
  max-width: 800px;
  margin: 80px auto;
  position: relative;
}

.back-button {
  position: fixed;
  top: 20px;
  left: 300px; /* 放在侧边栏右侧，侧边栏宽度280px + 20px间距 */
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 18px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.8);
  border-radius: 8px;
  color: #333;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  z-index: 1001; /* 高于侧边栏的z-index: 1000 */
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.back-button:hover {
  background: rgba(255, 255, 255, 1);
  transform: translateX(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.back-button .iconify {
  font-size: 18px;
}
.post-detail-card {
  background: #fff;
  padding: 20px;
  border-radius: 10px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}
.post-header {
  display: flex;
  align-items: center;
  gap: 12px;
}
.user-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
}
.user-avatar-container {
  position: relative;
  cursor: pointer;
}
.user-menu {
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  z-index: 100;
  min-width: 120px;
  margin-top: 8px;
}
.user-menu::before {
  content: "";
  position: absolute;
  top: -8px;
  left: 50%;
  transform: translateX(-50%);
  border-width: 0 8px 8px 8px;
  border-style: solid;
  border-color: transparent transparent #fff transparent;
  z-index: -1;
}
.menu-item {
  padding: 8px 16px;
  text-align: center;
  cursor: pointer;
  font-size: 14px;
  color: #374151;
  transition: background-color 0.2s;
}
.menu-item:first-child {
  border-radius: 8px 8px 0 0;
}
.menu-item:last-child {
  border-radius: 0 0 8px 8px;
}
.menu-item:hover {
  background-color: #f3f4f6;
}
.user-info .username {
  font-weight: 700;
}
.post-body {
  margin-top: 12px;
}
.post-image {
  position: relative;
  width: 100%;
  min-height: 320px;
  max-height: 520px;
  margin-top: 12px;
  border-radius: 12px;
  overflow: hidden;
  background: #000;
  display: flex;
  align-items: center;
  justify-content: center;
}
.post-image img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  background: #000;
}
.carousel-arrow {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  background: rgba(0, 0, 0, 0.5);
  color: #fff;
  border: none;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
}
.carousel-arrow.prev {
  left: 10px;
}
.carousel-arrow.next {
  right: 10px;
}
.carousel-arrow:disabled {
  opacity: 0.4;
  cursor: default;
}
.image-counter {
  position: absolute;
  bottom: 12px;
  right: 16px;
  background: rgba(0, 0, 0, 0.6);
  color: #fff;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 12px;
}
.post-interact {
  display: flex;
  gap: 12px;
  margin-top: 12px;
}
.like-btn,
.comment-btn {
  padding: 8px 12px;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  background: #fff;
  cursor: pointer;
}
.comments-section {
  margin-top: 16px;
  max-height: 500px;
  overflow: auto;
}
.comment-list {
  margin-top: 12px;
}
.comment {
  padding: 12px 0;
  border-bottom: 1px solid #f3f4f6;
}
.comment:last-child {
  border-bottom: none;
}
.comment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}
.comment-author-info {
  display: flex;
  align-items: center;
  gap: 8px;
}
.comment-author {
  font-weight: 600;
  color: #374151;
  font-size: 14px;
}
.comment-time {
  color: #9ca3af;
  font-size: 12px;
}
.comment-text {
  color: #4b5563;
  font-size: 14px;
  line-height: 1.5;
  margin: 6px 0;
}
.comment-actions {
  margin-top: 8px;
}
.comment-reply-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  background: transparent;
  border: none;
  color: #6b7280;
  font-size: 12px;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s;
}
.comment-reply-btn:hover {
  background: #f3f4f6;
  color: #374151;
}
.comment-delete-btn {
  padding: 4px;
  background: transparent;
  border: none;
  color: #ef4444;
  cursor: pointer;
  opacity: 0.6;
  transition: opacity 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}
.comment-delete-btn:hover {
  opacity: 1;
}
.comment-more-container {
  position: relative;
  display: inline-flex;
}
.comment-more-btn {
  padding: 4px;
  background: transparent;
  border: none;
  color: #9ca3af;
  cursor: pointer;
  opacity: 0.6;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}
.comment-more-btn:hover {
  opacity: 1;
  color: #6b7280;
}
.comment-report-box {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 4px;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  z-index: 100;
  padding: 4px;
}
.report-btn {
  padding: 6px 12px;
  background: transparent;
  border: none;
  border-radius: 4px;
  font-size: 13px;
  color: #ef4444;
  cursor: pointer;
  white-space: nowrap;
  transition: background-color 0.2s;
}
.report-btn:hover {
  background-color: #fef2f2;
}
.comment-quote {
  background: #f9fafb;
  border-left: 3px solid #e5e7eb;
  padding: 8px 12px;
  margin: 8px 0;
  border-radius: 4px;
}
.comment-quote-author {
  font-weight: 600;
  color: #6b7280;
  font-size: 12px;
  margin-bottom: 4px;
}
.comment-quote-text {
  color: #9ca3af;
  font-size: 12px;
  line-height: 1.4;
}
.comment-replies {
  margin-left: 24px;
  margin-top: 12px;
  padding-left: 16px;
  border-left: 2px solid #e5e7eb;
}
.comment-item {
  padding: 8px 0;
  border-bottom: 1px solid #f3f4f6;
}
.comment-item:last-child {
  border-bottom: none;
}
.comment-reply {
  padding: 8px 0;
  border-bottom: 1px solid #f3f4f6;
}
.comment-reply:last-child {
  border-bottom: none;
}
.add-comment {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 8px;
}
.reply-preview {
  background: #f3f4f6;
  border-radius: 8px;
  padding: 8px 12px;
  margin-bottom: 8px;
}
.reply-preview-content {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.reply-preview-label {
  font-weight: 600;
  color: #6b7280;
  font-size: 12px;
}
.reply-preview-text {
  flex: 1;
  color: #9ca3af;
  font-size: 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.reply-cancel-btn {
  padding: 4px 8px;
  background: transparent;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  color: #6b7280;
  font-size: 12px;
  cursor: pointer;
}
.reply-cancel-btn:hover {
  background: #fff;
  border-color: #d1d5db;
}
.add-comment input {
  flex: 1;
  padding: 8px;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}
.add-comment > div:last-child {
  display: flex;
  gap: 8px;
}
.add-comment button {
  padding: 8px 12px;
  border-radius: 8px;
  background: #8b5cf6;
  color: #fff;
  border: none;
  cursor: pointer;
}
.add-comment button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.comment-error {
  color: #ef4444;
  margin-top: 6px;
  font-size: 12px;
}
.no-comments {
  text-align: center;
  color: #9ca3af;
  font-size: 14px;
  padding: 24px;
  margin-top: 12px;
}

.fav-btn {
  padding: 8px 12px;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  background: #fff;
  cursor: pointer;
  margin-left: 8px;
}
.fav-btn .iconify {
  margin-right: 6px;
}
.toast {
  position: fixed;
  top: 90px;
  right: 40px;
  background: rgba(17, 24, 39, 0.95);
  color: #fff;
  padding: 10px 14px;
  border-radius: 8px;
  box-shadow: 0 6px 18px rgba(15, 23, 42, 0.25);
  z-index: 200;
}
.like-btn.liked {
  color: #ef4444;
}
.fav-btn.favorited {
  color: #10b981;
}

.comment-actions-right {
  display: flex;
  align-items: center;
  gap: 4px;
}

.comment-more-btn {
  padding: 4px;
  background: transparent;
  border: none;
  color: #9ca3af;
  cursor: pointer;
  opacity: 0.6;
  transition: opacity 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.comment-more-btn:hover {
  opacity: 1;
  color: #6b7280;
}

.report-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 300;
}

.report-menu {
  background: #fff;
  border-radius: 12px;
  padding: 16px;
  min-width: 280px;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
}

.report-menu-title {
  font-weight: 600;
  font-size: 16px;
  color: #374151;
  margin-bottom: 12px;
  text-align: center;
}

.report-menu-reasons {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 12px;
}

.report-reason-btn {
  padding: 10px 12px;
  background: #f3f4f6;
  border: none;
  border-radius: 8px;
  color: #374151;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.2s;
  text-align: left;
}

.report-reason-btn:hover {
  background: #e5e7eb;
}

.report-cancel-btn {
  width: 100%;
  padding: 10px 12px;
  background: transparent;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  color: #6b7280;
  font-size: 14px;
  cursor: pointer;
  transition: border-color 0.2s, color 0.2s;
}

.report-cancel-btn:hover {
  border-color: #d1d5db;
  color: #374151;
}
</style>
