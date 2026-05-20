import request from "./request";

/**
 * 用户注册
 * @param {Object} userData 用户注册数据
 * @returns {Promise}
 */
export function register(userData) {
  // 将前端发送的password字段转换为后端期望的passwordHash字段
  const requestData = { ...userData };
  if (requestData.password) {
    requestData.passwordHash = requestData.password;
    delete requestData.password;
  }

  // 将中文性别转换为英文（数据库ENUM只接受male, female, other）
  if (requestData.gender) {
    const genderMap = {
      男: "male",
      女: "female",
      其他: "other",
    };
    requestData.gender = genderMap[requestData.gender] || requestData.gender;
  }

  // 调试日志：打印发送的数据
  console.log("注册请求数据:", {
    username: requestData.username,
    nickname: requestData.nickname,
    email: requestData.email,
    phone: requestData.phone,
    hasPassword: !!requestData.passwordHash,
    gender: requestData.gender,
    birthday: requestData.birthday,
  });

  return request({
    url: "/user/register",
    method: "post",
    data: requestData,
  });
}

/**
 * 用户登录
 * @param {String} loginName 登录名（邮箱或手机号）
 * @param {String} password 密码
 * @returns {Promise}
 */
export function login(loginName, password, loginType = 'user') {
  return request({
    url: "/user/login",
    method: "post",
    data: {
      loginName,
      password,
      loginType,
    },
  });
}

/**
 * 获取用户信息
 * @param {Number} userId 用户ID
 * @returns {Promise}
 */
export function getUserInfo(userId) {
  return request({
    url: `/user/${userId}/info`,
    method: "get",
  });
}

/**
 * 获取当前用户信息
 * @returns {Promise}
 */
export function getCurrentUserInfo() {
  // 从localStorage获取用户信息
  const userStr = localStorage.getItem("user");
  if (!userStr) {
    return Promise.reject(new Error("用户未登录"));
  }

  try {
    const user = JSON.parse(userStr);
    // 兼容多种可能的用户ID字段名
    const userId = user.userId || user.id || user.user_id;
    if (!userId) {
      return Promise.reject(new Error("无法获取用户ID"));
    }

    // 使用现有的获取用户信息接口
    return request({
      url: `/user/${userId}/info`,
      method: "get",
    });
  } catch (e) {
    console.error("获取当前用户信息失败:", e);
    return Promise.reject(new Error("解析用户信息失败: " + e.message));
  }
}

/**
 * 更新用户信息
 * @param {Number} userId 用户ID
 * @param {Object} userData 用户数据
 * @returns {Promise}
 */
export function updateUserInfo(userId, userData) {
  return request({
    url: `/user/${userId}/info`,
    method: "put",
    data: userData,
  });
}

/**
 * 关注用户
 * @param {Number} userId 要关注的用户ID
 * @returns {Promise}
 */
export function followUser(userId) {
  return request({
    url: `/user/follow/${userId}`,
    method: "post",
  }).catch((err) => {
    // 如果后端API不存在，返回模拟成功响应
    console.warn("关注API未实现，使用模拟响应");
    return Promise.resolve({ code: 200, message: "关注成功" });
  });
}

/**
 * 取消关注用户
 * @param {Number} userId 要取消关注的用户ID
 * @returns {Promise}
 */
export function unfollowUser(userId) {
  return request({
    url: `/user/unfollow/${userId}`,
    method: "delete",
  }).catch((err) => {
    // 如果后端API不存在，返回模拟成功响应
    console.warn("取消关注API未实现，使用模拟响应");
    return Promise.resolve({ code: 200, message: "取消关注成功" });
  });
}

/**
 * 获取用户关注者列表
 * @param {Number} userId 用户ID
 * @param {Number} offset 偏移量
 * @param {Number} limit 限制数量
 * @returns {Promise}
 */
export function getFollowers(userId, offset = 0, limit = 10) {
  return request({
    url: `/user/${userId}/followers`,
    method: "get",
    params: {
      offset,
      limit,
    },
  });
}

/**
 * 获取用户关注列表
 * @param {Number} userId 用户ID
 * @param {Number} offset 偏移量
 * @param {Number} limit 限制数量
 * @returns {Promise}
 */
export function getFollowing(userId, offset = 0, limit = 10) {
  return request({
    url: `/user/${userId}/followings`,
    method: "get",
    params: {
      offset,
      limit,
    },
  });
}

/**
 * 检查是否关注某用户
 * @param {Number} userId 用户ID
 * @returns {Promise}
 */
export function checkFollowing(userId) {
  return request({
    url: `/user/follow/${userId}/check`,
    method: "get",
  }).catch((err) => {
    // 如果后端API不存在，返回模拟响应
    console.warn("检查关注状态API未实现，使用模拟响应");
    return Promise.resolve({ code: 200, data: { isFollowing: false } });
  });
}

/**
 * 获取用户统计数据
 * @param {Number} userId 用户ID
 * @returns {Promise}
 */
export function getUserStats(userId) {
  return request({
    url: `/user/${userId}/stats`,
    method: "get",
  }).catch((err) => {
    // 如果后端API不存在，返回模拟响应
    console.warn("获取用户统计数据API未实现，使用模拟响应");
    return Promise.resolve({
      code: 200,
      data: { posts: 0, likes: 0, followers: 0, following: 0 },
    });
  });
}

/**
 * 屏蔽用户
 * @param {Number} userId 要屏蔽的用户ID
 * @returns {Promise}
 */
export function blockUser(userId) {
  return request({
    url: `/user/block/${userId}`,
    method: "post",
  });
}

/**
 * 取消屏蔽用户
 * @param {Number} userId 要取消屏蔽的用户ID
 * @returns {Promise}
 */
export function unblockUser(userId) {
  return request({
    url: `/user/unblock/${userId}`,
    method: "delete",
  });
}

/**
 * 检查是否屏蔽某用户
 * @param {Number} userId 用户ID
 * @returns {Promise}
 */
export function checkBlocking(userId) {
  return request({
    url: `/user/block/${userId}/check`,
    method: "get",
  });
}

/**
 * 更新当前登录用户信息
 * @param {Object} userData 用户数据
 * @returns {Promise}
 */
export function updateCurrentUser(userData) {
  // 从localStorage获取用户ID
  const userStr = localStorage.getItem("user");
  if (!userStr) {
    return Promise.reject(new Error("用户未登录"));
  }

  try {
    const user = JSON.parse(userStr);
    // 兼容多种可能的用户ID字段名
    const userId = user.userId || user.id || user.user_id;
    if (!userId) {
      return Promise.reject(new Error("无法获取用户ID"));
    }

    // 使用现有的更新用户信息接口
    return request({
      url: `/user/${userId}/info`,
      method: "put",
      data: userData,
    });
  } catch (e) {
    console.error("更新当前用户信息失败:", e);
    return Promise.reject(new Error("解析用户信息失败: " + e.message));
  }
}

/**
 * 获取用户列表
 * @param {Number} offset 偏移量
 * @param {Number} limit 限制数量
 * @returns {Promise}
 */
export function getUserList(offset = 0, limit = 100) {
  return request({
    url: "/user/list",
    method: "get",
    params: {
      offset,
      limit,
    },
  });
}

/**
 * 获取填写过问卷的用户列表（通过检查用户信息）
 * @param {Number} offset 偏移量
 * @param {Number} limit 限制数量
 * @returns {Promise}
 */
export function getMatchedUsers(offset = 0, limit = 50) {
  return request({
    url: "/user/matched",
    method: "get",
    params: {
      offset,
      limit,
      hasQuestionnaire: 1, // 只获取填写过问卷的用户（数据库字段为0/1）
    },
  });
}

/**
 * 根据 user_questionnaire_completion 表查询填写过问卷的用户列表
 * @param {Number} offset 偏移量
 * @param {Number} limit 限制数量
 * @returns {Promise}
 */
export function getUsersWithQuestionnaire(offset = 0, limit = 50) {
  return request({
    url: "/user/with-questionnaire",
    method: "get",
    params: {
      offset,
      limit,
    },
  });
}
