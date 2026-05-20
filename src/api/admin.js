import request from './request'

export function getAdminStats() {
  return request({ url: '/admin/stats', method: 'get' })
}

export function getAdminUsers(params = {}) {
  return request({ url: '/admin/users', method: 'get', params })
}

export function getAdminUserDetail(userId) {
  return request({ url: `/admin/users/${userId}`, method: 'get' })
}

export function punishUser(userId, data) {
  return request({ url: `/admin/users/${userId}/punish`, method: 'post', data })
}

export function unbanUser(userId, reason) {
  return request({
    url: `/admin/users/${userId}/unban`,
    method: 'post',
    params: reason ? { reason } : {}
  })
}

export function deleteAdminUser(userId) {
  return request({ url: `/admin/users/${userId}`, method: 'delete' })
}

export function getAdminPosts(params = {}) {
  return request({ url: '/admin/posts', method: 'get', params })
}

export function moderatePost(postId, data) {
  return request({ url: `/admin/posts/${postId}/moderate`, method: 'post', data })
}

export function deleteAdminPost(postId) {
  return request({ url: `/admin/posts/${postId}`, method: 'delete' })
}

export function getAdminComments(params = {}) {
  return request({ url: '/admin/comments', method: 'get', params })
}

export function moderateComment(commentId, data) {
  return request({ url: `/admin/comments/${commentId}/moderate`, method: 'post', data })
}

export function deleteAdminComment(commentId) {
  return request({ url: `/admin/comments/${commentId}`, method: 'delete' })
}

export function getAuditLogs(params = {}) {
  return request({ url: '/admin/audit-logs', method: 'get', params })
}

export function getOperationLogs(params = {}) {
  return request({ url: '/admin/operation-logs', method: 'get', params })
}

/** @deprecated 使用 punishUser */
export function banUser(userId) {
  return punishUser(userId, { action: 'perm_banned', reason: '管理员封禁' })
}
