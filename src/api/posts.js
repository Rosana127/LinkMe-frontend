import request from "./request";

/**
 * 创建帖子
 * @param {Object} postData { userId, topic, content, images, tags, visibility }
 */
export function createPost(postData) {
  // 后端示例期望: { userId, content, images: [string], tags: [...] }
  // 我们会将前端的 images (data URLs) 和 tags 原样发送
  return request({
    url: "/posts",
    method: "post",
    data: postData,
  });
}

/**
 * 获取某个用户的帖子列表
 * 后端端点：GET /posts?userId={userId}
 * @param {Number} userId
 */
export async function getUserPosts(userId) {
  try {
    const res = await request({
      url: `/posts`,
      method: "get",
      params: { userId },
    });
    return Array.isArray(res) ? res : res?.data || [];
  } catch (e) {
    // 如果请求失败，抛出错误给调用者处理
    console.error("[getUserPosts] 获取用户帖子失败:", e);
    throw e;
  }
}

/**
 * 删除帖子
 * @param {Number|String} postId
 */
export function deletePost(postId) {
  return request({
    url: `/posts/${postId}`,
    method: "delete",
  });
}

/**
 * 获取单个帖子详情
 * @param {Number|String} postId
 */
export function getPost(postId) {
  return request({
    url: `/posts/${postId}`,
    method: "get",
  });
}

/**
 * 获取帖子评论列表
 * @param {Number|String} postId
 */
export function getComments(postId) {
  return request({
    url: `/posts/${postId}/comments`,
    method: "get",
  });
}

/**
 * 创建评论
 * @param {Number|String} postId
 * @param {Object} commentData { userId, content, parentId? }
 */
export function postComment(postId, commentData) {
  return request({
    url: `/posts/${postId}/comments`,
    method: "post",
    data: commentData,
  });
}

/**
 * 删除评论
 * @param {Number|String} postId
 * @param {Number|String} commentId
 */
export function deleteComment(postId, commentId) {
  return request({
    url: `/posts/${postId}/comments/${commentId}`,
    method: "delete",
  });
}

/**
 * 举报评论
 * @param {Number|String} postId
 * @param {Number|String} commentId
 */
export function reportComment(postId, commentId, data = {}) {
  return request({
    url: `/posts/${postId}/comments/${commentId}/report`,
    method: "post",
    data,
  });
}

export function reportPost(postId, data = {}) {
  return request({
    url: `/posts/${postId}/report`,
    method: "post",
    data,
  });
}

/**
 * 获取帖子列表（公共探索列表）
 * 支持 query params，如 page, limit, userId 等
 */
export function getPosts(params = {}) {
  return request({
    url: "/posts",
    method: "get",
    params,
  });
}

/**
 * 获取协同过滤推荐帖子
 * 已登录：基于点赞行为的 User-Based CF；未登录/冷启动：热门/最新兜底
 * @param {Number} limit 推荐数量，默认 20，最大 100
 */
export async function getRecommendedPosts(limit = 20) {
  try {
    const res = await request({
      url: "/posts/recommended",
      method: "get",
      params: { limit },
    });
    return Array.isArray(res) ? res : res?.data || [];
  } catch (e) {
    console.error("[getRecommendedPosts] 获取推荐帖子失败:", e);
    throw e;
  }
}

/**
 * 点赞帖子
 * @param {Number|String} postId
 * @param {Number} userId
 */
export function likePost(postId, userId) {
  return request({
    url: `/posts/${postId}/like`,
    method: "post",
    data: { userId },
  });
}

/**
 * 取消点赞
 * @param {Number|String} postId
 * @param {Number} userId
 */
export function unlikePost(postId, userId) {
  return request({
    url: `/posts/${postId}/like`,
    method: "delete",
    data: { userId },
  });
}

const postsApi = {
  createPost,
  getUserPosts,
  deletePost,
  getPosts,
  getRecommendedPosts,
  getPost,
  getComments,
  postComment,
  deleteComment,
  reportComment,
  reportPost,
  likePost,
  unlikePost,
};

export default postsApi;
