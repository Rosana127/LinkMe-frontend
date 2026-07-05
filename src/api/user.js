import request from './request'

export function register(userData) {
  const requestData = { ...userData }

  if (requestData.password) {
    requestData.passwordHash = requestData.password
    delete requestData.password
  }

  if (requestData.gender) {
    const genderMap = {
      男: 'male',
      女: 'female',
      其他: 'other'
    }
    requestData.gender = genderMap[requestData.gender] || requestData.gender
  }

  return request({
    url: '/user/register',
    method: 'post',
    data: requestData
  })
}

export function login(loginName, password) {
  return request({
    url: '/user/login',
    method: 'post',
    data: {
      loginName,
      password
    }
  })
}

export function getUserInfo(userId) {
  return request({
    url: `/user/${userId}/info`,
    method: 'get'
  })
}

export function getCurrentUserInfo() {
  const userStr = localStorage.getItem('user')
  if (!userStr) {
    return Promise.reject(new Error('用户未登录'))
  }

  try {
    const user = JSON.parse(userStr)
    const userId = user.userId || user.id || user.user_id
    if (!userId) {
      return Promise.reject(new Error('无法获取用户 ID'))
    }

    return request({
      url: `/user/${userId}/info`,
      method: 'get'
    })
  } catch (error) {
    return Promise.reject(new Error(`解析用户信息失败：${error.message}`))
  }
}

export function updateUserInfo(userId, userData) {
  return request({
    url: `/user/${userId}/info`,
    method: 'put',
    data: userData
  })
}

export function followUser(userId) {
  return request({
    url: `/user/follow/${userId}`,
    method: 'post'
  }).catch(() => Promise.resolve({ code: 200, message: '关注成功' }))
}

export function unfollowUser(userId) {
  return request({
    url: `/user/unfollow/${userId}`,
    method: 'delete'
  }).catch(() => Promise.resolve({ code: 200, message: '取消关注成功' }))
}

export function getFollowers(userId, offset = 0, limit = 10) {
  return request({
    url: `/user/${userId}/followers`,
    method: 'get',
    params: { offset, limit }
  })
}

export function getFollowing(userId, offset = 0, limit = 10) {
  return request({
    url: `/user/${userId}/followings`,
    method: 'get',
    params: { offset, limit }
  })
}

export function checkFollowing(userId) {
  return request({
    url: `/user/follow/${userId}/check`,
    method: 'get'
  }).catch(() => Promise.resolve({ code: 200, data: { isFollowing: false } }))
}

export function getUserStats(userId) {
  return request({
    url: `/user/${userId}/stats`,
    method: 'get'
  }).catch(() => Promise.resolve({
    code: 200,
    data: { posts: 0, likes: 0, followers: 0, following: 0 }
  }))
}

export function blockUser(userId) {
  return request({
    url: `/user/block/${userId}`,
    method: 'post'
  })
}

export function unblockUser(userId) {
  return request({
    url: `/user/unblock/${userId}`,
    method: 'delete'
  })
}

export function checkBlocking(userId) {
  return request({
    url: `/user/block/${userId}/check`,
    method: 'get'
  })
}

export function updateCurrentUser(userData) {
  const userStr = localStorage.getItem('user')
  if (!userStr) {
    return Promise.reject(new Error('用户未登录'))
  }

  try {
    const user = JSON.parse(userStr)
    const userId = user.userId || user.id || user.user_id
    if (!userId) {
      return Promise.reject(new Error('无法获取用户 ID'))
    }

    return request({
      url: `/user/${userId}/info`,
      method: 'put',
      data: userData
    })
  } catch (error) {
    return Promise.reject(new Error(`解析用户信息失败：${error.message}`))
  }
}

export function getUserList(offset = 0, limit = 100) {
  return request({
    url: '/user/list',
    method: 'get',
    params: { offset, limit }
  })
}

export function getMatchedUsers(offset = 0, limit = 50) {
  return request({
    url: '/user/matched',
    method: 'get',
    params: {
      offset,
      limit,
      hasQuestionnaire: 1
    }
  })
}

export function getUsersWithQuestionnaire(offset = 0, limit = 50) {
  return request({
    url: '/user/with-questionnaire',
    method: 'get',
    params: { offset, limit }
  })
}
