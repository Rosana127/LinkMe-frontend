# API 接口文档

本文档详细说明前端实现的 API 接口及其使用方法。

## 请求封装

所有 API 接口调用统一通过 `src/api/request.js` 封装，具有以下特性：

- 自动添加 JWT Token 认证（`Authorization: Bearer ${token}`）
- 统一错误处理
- 开发环境下详细的请求/响应日志
- 自动处理 401 错误（清除 token 并跳转登录）

**请求配置：**

- **baseURL**: `/api` (通过 Vite 代理转发到后端)
- **timeout**: 10000ms
- **认证方式**: Bearer Token

## 用户管理 API

### 用户注册

**接口**: `POST /user/register`

**实现位置**: `src/api/user.js` - `register()`

**请求参数**:

```javascript
{
  username: string,      // 用户名
  nickname: string,     // 昵称
  email: string,        // 邮箱
  phone: string,        // 手机号
  password: string,     // 密码（会自动转换为 passwordHash）
  gender: string,       // 性别（会自动转换为 male/female/other）
  birthday: string      // 生日
}
```

**使用示例**:

```javascript
import { register } from "@/api/user";

await register({
  username: "user123",
  nickname: "张三",
  email: "user@example.com",
  phone: "13800138000",
  password: "password123",
  gender: "男",
  birthday: "1990-01-01",
});
```

### 用户登录

**接口**: `POST /user/login`

**实现位置**: `src/api/user.js` - `login()`

**请求参数**:

```javascript
{
  loginName: string,  // 登录名（邮箱或手机号）
  password: string   // 密码
}
```

### 获取用户信息

**接口**: `GET /user/{userId}/info`

**实现位置**: `src/api/user.js` - `getUserInfo()`

### 更新用户信息

**接口**: `PUT /user/{userId}/info`

**实现位置**: `src/api/user.js` - `updateUserInfo()`

### 关注/取关用户

**接口**:

- `POST /user/follow/{userId}` - 关注用户
- `DELETE /user/unfollow/{userId}` - 取消关注
- `GET /user/follow/{userId}/check` - 检查关注状态

**实现位置**: `src/api/user.js` - `followUser()`, `unfollowUser()`, `checkFollowing()`

### 屏蔽用户

**接口**:

- `POST /user/block/{userId}` - 屏蔽用户
- `DELETE /user/unblock/{userId}` - 取消屏蔽
- `GET /user/block/{userId}/check` - 检查屏蔽状态

**实现位置**: `src/api/user.js` - `blockUser()`, `unblockUser()`, `checkBlocking()`

### 获取用户列表

**接口**: `GET /user/list`

**实现位置**: `src/api/user.js` - `getUserList()`

**请求参数**:

```javascript
{
  offset: number,  // 偏移量，默认 0
  limit: number    // 限制数量，默认 100
}
```

### 获取填写过问卷的用户

**接口**: `GET /user/with-questionnaire`

**实现位置**: `src/api/user.js` - `getUsersWithQuestionnaire()`

**请求参数**:

```javascript
{
  offset: number,  // 偏移量，默认 0
  limit: number    // 限制数量，默认 50
}
```

## 帖子系统 API

### 创建帖子

**接口**: `POST /posts`

**实现位置**: `src/api/posts.js` - `createPost()`

**调用位置**: `src/views/CreatePost.vue` - `publish()`

**请求参数**:

```javascript
{
  userId: number,
  title: string,
  content: string,
  images: string[],  // 图片 URL 数组
  tags: string[],   // 标签数组
  visibility: string
}
```

### 获取帖子列表

**接口**: `GET /posts`

**实现位置**: `src/api/posts.js` - `getPosts()`

**调用位置**: `src/views/DiscoverPage.vue` - `loadExplore()`

**请求参数**:

```javascript
{
  page: number,     // 页码
  limit: number,    // 每页数量
  userId: number    // 可选，按用户ID筛选
}
```

### 获取帖子详情

**接口**: `GET /posts/{postId}`

**实现位置**: `src/api/posts.js` - `getPost()`

### 删除帖子

**接口**: `DELETE /posts/{postId}`

**实现位置**: `src/api/posts.js` - `deletePost()`

### 获取用户帖子列表

**接口**: `GET /posts?userId={userId}`

**实现位置**: `src/api/posts.js` - `getUserPosts()`

### 发布评论

**接口**: `POST /posts/{postId}/comments`

**实现位置**: `src/api/posts.js` - `postComment()`

**调用位置**: `src/views/PostDetail.vue` - `addComment()`

**请求参数**:

```javascript
{
  postId: number,
  userId: number,
  content: string,
  parentId: number | null  // 可选，父评论ID
}
```

### 获取评论列表

**接口**: `GET /posts/{postId}/comments`

**实现位置**: `src/api/posts.js` - `getComments()`

### 删除评论

**接口**: `DELETE /posts/{postId}/comments/{commentId}`

**实现位置**: `src/api/posts.js` - `deleteComment()`

### 点赞/取消点赞

**接口**:

- `POST /posts/{postId}/like` - 点赞
- `DELETE /posts/{postId}/like` - 取消点赞

**实现位置**: `src/api/posts.js` - `likePost()`, `unlikePost()`

**请求参数**:

```javascript
{
  userId: number;
}
```

## 聊天通信 API

### 获取会话列表

**接口**: `GET /conversations`

**实现位置**: `src/api/chat.js` - `getConversations()`

### 获取会话详情

**接口**: `GET /conversations/{conversationId}`

**实现位置**: `src/api/chat.js` - `getConversation()`

### 创建会话

**接口**: `POST /conversations`

**实现位置**: `src/api/chat.js` - `createConversation()`

### 获取消息列表

**接口**: `GET /conversations/{conversationId}/messages`

**实现位置**: `src/api/chat.js` - `getMessages()`

### 发送消息

**接口**: `POST /conversations/{conversationId}/messages`

**实现位置**: `src/api/chat.js` - `postMessage()`

**请求参数**:

```javascript
{
  senderId: number,
  receiverId: number,
  content: string,
  messageType: string  // text, image, audio, video 等
}
```

### 标记消息已读

**接口**: `PUT /conversations/{conversationId}/read`

**实现位置**: `src/api/chat.js` - `markRead()`

### 设置会话置顶

**接口**: `PUT /conversations/{conversationId}/pin`

**实现位置**: `src/api/chat.js` - `setPinStatus()`

**请求参数**:

```javascript
{
  pinned: boolean;
}
```

### 设置会话免打扰

**接口**: `PUT /conversations/{conversationId}/mute`

**实现位置**: `src/api/chat.js` - `setMuteStatus()`

**请求参数**:

```javascript
{
  muted: boolean;
}
```

### 清空聊天记录

**接口**: `DELETE /conversations/{conversationId}/messages`

**实现位置**: `src/api/chat.js` - `clearChatMessages()`

## 通知系统 API

### 获取通知列表

**接口**: `GET /notifications`

**实现位置**: `src/api/chat.js` - `getNotifications()`

**请求参数**:

```javascript
{
  page: number,
  limit: number
}
```

### 获取未读通知数量

**接口**: `GET /notifications/unread-count`

**实现位置**: `src/api/chat.js` - `getUnreadNotificationCount()`

### 标记通知已读

**接口**: `PUT /notifications/{notificationId}/read`

**实现位置**: `src/api/chat.js` - `markNotificationRead()`

### 标记所有通知已读

**接口**: `PUT /notifications/read-all`

**实现位置**: `src/api/chat.js` - `markAllNotificationsRead()`

### 删除通知

**接口**: `DELETE /notifications/{notificationId}`

**实现位置**: `src/api/chat.js` - `deleteNotification()`

## 收藏功能 API

### 获取收藏夹列表

**接口**: `GET /user/{userId}/favorite-folders`

**实现位置**: `src/api/favorites.js` - `getFavoriteFolders()`

### 创建收藏夹

**接口**: `POST /user/{userId}/favorite-folders`

**实现位置**: `src/api/favorites.js` - `createFavoriteFolder()`

**请求参数**:

```javascript
{
  name: string; // 收藏夹名称
}
```

### 更新收藏夹

**接口**: `PUT /favorite_folders/{folderId}`

**实现位置**: `src/api/favorites.js` - `updateFavoriteFolder()`

### 删除收藏夹

**接口**: `DELETE /favorite_folders/{folderId}`

**实现位置**: `src/api/favorites.js` - `deleteFavoriteFolder()`

### 收藏帖子

**接口**: `POST /favorites`

**实现位置**: `src/api/favorites.js` - `addPostToFavorites()`

**请求参数**:

```javascript
{
  user_id: number,
  post_id: number,
  folder_id: number
}
```

### 取消收藏

**接口**: `DELETE /favorites/{favoriteId}`

**实现位置**: `src/api/favorites.js` - `removePostFromFavorites()`

### 获取用户收藏的帖子

**接口**: `GET /user/{userId}/favorites`

**实现位置**: `src/api/favorites.js` - `getUserFavoritePosts()`

**请求参数**:

```javascript
{
  folderId: number,  // 可选，收藏夹ID
  page: number,
  limit: number
}
```

### 获取用户点赞的帖子

**接口**: `GET /user/{userId}/likes`

**实现位置**: `src/api/favorites.js` - `getUserLikedPosts()`

## 匹配系统 API

### 获取匹配推荐列表

**接口**: `GET /match/recommendations`

**实现位置**: `src/api/match.js` - `getRecommendations()`

**请求参数**:

```javascript
{
  page: number,  // 页码，从 1 开始
  size: number   // 每页数量
}
```

## 点赞系统 API

### 发送喜欢通知

**接口**: `POST /likes/send`

**实现位置**: `src/api/likes.js` - `sendLikeNotification()`

**请求参数**:

```javascript
{
  targetUserId: number;
}
```

### 取消喜欢通知

**接口**: `DELETE /likes/cancel`

**实现位置**: `src/api/likes.js` - `cancelLikeNotification()`

### 获取发送的喜欢列表

**接口**: `GET /likes/sent`

**实现位置**: `src/api/likes.js` - `getSentLikes()`

### 获取收到的喜欢列表

**接口**: `GET /likes/received`

**实现位置**: `src/api/likes.js` - `getReceivedLikes()`

### 检查喜欢状态

**接口**: `GET /likes/status`

**实现位置**: `src/api/likes.js` - `checkLikeStatus()`

**请求参数**:

```javascript
{
  targetUserId: number;
}
```

## 问卷系统 API

### 提交问卷

**接口**: `POST /questionnaire`

**实现位置**: `src/api/questionnaire.js` - `submitQuestionnaire()`

**请求参数**:

```javascript
{
  userId: number,
  interests: string[],                    // 兴趣爱好数组
  socialEnergy: string,                  // 社交能量：extroverted, introverted, ambivert
  decisionMaking: string,                // 决策方式：rational, emotional, balanced
  lifeRhythm: string,                     // 生活节奏：planned, spontaneous, flexible
  communicationStyle: string,             // 沟通风格：direct, tactful, humorous, listening, quiet
  preferredSocialStyle: string,           // 偏好社交风格
  preferredLifestyle: string,             // 偏好生活方式
  preferredInterests: string,            // 偏好兴趣类型
  relationshipQualities: string[],        // 关系品质数组
  preferredRelationshipMode: string,      // 偏好关系模式
  communicationExpectation: string,       // 沟通期望
  ageRequirement: {                       // 年龄要求
    unlimited: boolean,
    minAge: number,
    maxAge: number
  },
  distanceRequirement: string,            // 距离要求
  mustHaveQualities: string[],            // 必须品质数组
  priorityQualities: string[],            // 优先品质数组
  additionalRequirements: string          // 额外要求（可选）
}
```

### 获取问卷数据

**接口**: `GET /questionnaire` 或 `GET /questionnaire/{userId}`

**实现位置**: `src/api/questionnaire.js` - `getQuestionnaire()`

**说明**: 如果不提供 userId，则获取当前登录用户的问卷

### 更新问卷数据

**接口**: `PUT /questionnaire`

**实现位置**: `src/api/questionnaire.js` - `updateQuestionnaire()`

**说明**: 用于自动保存和部分更新，请求参数与提交问卷相同，但可以只包含部分字段

### 删除问卷数据

**接口**: `DELETE /questionnaire`

**实现位置**: `src/api/questionnaire.js` - `deleteQuestionnaire()`

### 获取公开问卷信息

**接口**: `GET /questionnaire/{userId}/public`

**实现位置**: `src/api/questionnaire.js` - `getPublicQuestionnaire()`

**说明**: 仅包含兴趣爱好等可公开信息

## 错误处理

所有 API 接口统一使用以下错误处理机制：

### HTTP 状态码

- **200**: 请求成功
- **400**: 请求参数错误
- **401**: 未授权（Token 无效或已过期）
- **403**: 没有权限访问
- **404**: 请求的资源不存在
- **500**: 服务器内部错误

### 响应格式

**成功响应**:

```json
{
  "code": 200,
  "message": "操作成功",
  "data": { ... }
}
```

**错误响应**:

```json
{
  "code": 400,
  "message": "错误信息"
}
```

### 401 错误处理

当收到 401 错误时，前端会自动：

1. 清除 localStorage 中的 token 和 user
2. 跳转到登录页面
3. 显示友好的错误提示

## 注意事项

1. **Token 认证**: 除登录和注册接口外，所有接口都需要在请求头中携带 `Authorization: Bearer ${token}`

2. **代理配置**: 前端请求使用 `/api` 前缀，通过 Vite 代理转发到后端。确保后端服务运行在 `http://localhost:8080`

3. **数据格式**: 所有请求和响应都使用 JSON 格式

4. **错误处理**: 建议在调用 API 时使用 try-catch 处理错误

5. **开发环境日志**: 在开发环境下，所有请求和响应都会在控制台输出详细日志，便于调试
