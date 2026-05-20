# LinkMe 交友聊天社交软件前端

- **[API 文档](./API.md)** - 完整的 API 接口文档和使用说明

LinkMe-frontend 是一个现代化的交友聊天社交软件前端系统，基于 Vue 3 开发，提供完整的用户界面和交互体验，包括用户管理、帖子发布、匹配交友、聊天通信等核心功能。

## 技术栈

- **框架**: Vue 3.3.4 (Composition API)
- **路由**: Vue Router 4.2.4
- **状态管理**: Pinia 2.1.6
- **HTTP 客户端**: Axios 1.13.1
- **样式**: Tailwind CSS (CDN)
- **图标**: Iconify 4.1.1
- **图表**: ECharts 5.4.3
- **构建工具**: Vite 4.4.5
- **Node 版本**: >= 16.0.0

## 核心功能

### 1. 用户管理

- 用户注册/登录
- 个人信息管理
- 用户资料展示
- 关注/取关功能
- 用户屏蔽功能
- 用户列表查询

### 2. 帖子系统

- 发布帖子（支持图片、标签）
- 帖子浏览和搜索
- 评论和点赞
- 收藏功能（支持自定义收藏夹）
- 帖子详情查看

### 3. 匹配交友

- 基于标签的智能匹配
- 用户卡片滑动匹配
- 关注系统
- 匹配统计图表
- 问卷匹配系统

### 4. 聊天通信

- 私聊功能
- 实时消息发送（WebSocket）
- 消息通知
- 聊天列表管理
- 会话置顶和免打扰
- 清空聊天记录

### 5. 发现探索

- 推荐内容展示
- 内容分类和搜索
- 热门话题展示
- 用户互动功能

### 6. 问卷系统

- 用户问卷填写
- 自动保存草稿
- 问卷数据查询
- 匹配用户推荐

## 项目结构

```
LinkMe-frontend/
├── src/
│   ├── api/                     # API接口
│   │   ├── posts.js             # 帖子相关API
│   │   ├── user.js              # 用户相关API
│   │   ├── chat.js              # 聊天相关API
│   │   ├── favorites.js         # 收藏相关API
│   │   ├── tags.js              # 标签相关API
│   │   ├── questionnaire.js    # 问卷相关API
│   │   ├── match.js             # 匹配相关API
│   │   ├── likes.js              # 点赞相关API
│   │   ├── ai.js                # AI相关API
│   │   └── request.js           # 请求封装
│   ├── components/              # 组件
│   │   ├── Sidebar.vue          # 侧边栏导航组件
│   │   └── UserListModal.vue   # 用户列表弹窗组件
│   ├── views/                   # 页面视图
│   │   ├── HomePage.vue         # 首页
│   │   ├── ...
│   ├── stores/                  # 状态管理
│   │   └── auth.js              # 认证状态管理
│   ├── router/                  # 路由配置
│   │   └── index.js             # 路由配置
│   ├── utils/                   # 工具函数
│   │   ├── settingsProfile.js   # 设置相关工具
│   │   ├── avatar.js            # 头像相关工具
│   │   └── theme.js             # 主题相关工具
│   ├── data/                    # 数据文件
│   │   └── posts.js             # 帖子数据
│   ├── App.vue                  # 主应用组件
│   ├── main.js                  # 应用入口
│   └── style.css                # 全局样式
├── public/                      # 静态资源
├── vite.config.js               # Vite配置
├── package.json                 # 项目依赖
└── README.md                    # 项目文档
```

## 快速开始

### 环境要求

- Node.js >= 16.0.0
- npm >= 8.0.0

### 安装依赖

```bash
cd LinkMe-frontend
npm install
```

### 开发模式

```bash
npm run dev
```

开发服务器将在 `http://localhost:3000` 启动。

### 构建生产版本

```bash
npm run build
```

构建产物将输出到 `dist/` 目录。

### 预览生产版本

```bash
npm run preview
```

## 配置说明

### 后端 API 代理配置

项目使用 Vite 代理转发 API 请求，配置位于 `vite.config.js`：

```javascript
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:8080',  // 后端服务地址
      changeOrigin: true,
      rewrite: (path) => path.replace(/^\/api/, '')
    }
  }
}
```

**注意事项：**

- 确保后端服务运行在 `http://localhost:8080`
- 如果后端运行在其他端口，需要修改 `vite.config.js` 中的 `target` 配置
- 前端请求会自动添加 `/api` 前缀，代理会转发到后端

### API 请求封装

所有 API 接口调用统一通过 `src/api/request.js` 封装，具有以下特性：

- ✅ 自动添加 JWT Token 认证
- ✅ 统一错误处理
- ✅ 开发环境下详细的请求/响应日志
- ✅ 自动处理 401 错误（清除 token 并跳转登录）

**使用示例：**

```javascript
import request from "@/api/request";

// GET 请求
const data = await request({
  url: "/posts",
  method: "get",
  params: { page: 1, limit: 10 },
});

// POST 请求
const result = await request({
  url: "/posts",
  method: "post",
  data: { title: "标题", content: "内容" },
});
```

## API 接口文档

详细的 API 接口文档请参考 [API 文档](./API文档.md)。

主要 API 模块包括：

- **用户管理**: 注册、登录、用户信息、关注/取关、屏蔽等
- **帖子系统**: 创建、查询、删除、评论、点赞等
- **聊天通信**: 会话管理、消息发送、通知等
- **收藏功能**: 收藏夹管理、收藏帖子等
- **匹配系统**: 推荐列表、匹配度计算等
- **问卷系统**: 问卷提交、查询、更新等

## 开发规范

### 1. 代码规范

- 使用小驼峰命名法
- 组件使用 PascalCase 命名
- 文件使用 kebab-case 命名
- 统一使用 ES6+ 语法

### 2. API 调用规范

- 所有 API 调用统一通过 `src/api/request.js` 封装
- 自动添加 JWT Token 认证
- 统一错误处理
- 请求和响应日志（开发环境）

### 3. 组件规范

- 使用 Vue 3 Composition API
- 组件按功能拆分，保持单一职责
- 使用 TypeScript 类型定义（auto-imports.d.ts）

### 4. 路由规范

- 路由路径使用 kebab-case
- 路由名称使用 PascalCase
- 路由守卫统一在 `router/index.js` 中管理

## 浏览器支持

- Chrome >= 87
- Firefox >= 78
- Safari >= 14
- Edge >= 88

## 部署说明

### 生产环境配置

1. 修改 `vite.config.js` 中的代理配置，指向生产环境后端地址
2. 或使用环境变量配置后端 API 地址
3. 构建生产版本：`npm run build`
4. 将 `dist/` 目录部署到静态文件服务器

### 环境变量

可以通过环境变量配置后端 API 地址：

```bash
# .env.production
VITE_API_BASE_URL=https://api.example.com
```

## 更新日志

### v1.0.0

- 初始版本发布
- 完成基础功能搭建
- 实现用户管理、帖子系统、聊天通信等核心功能

### v1.1.0

- 新增问卷系统
- 完善匹配推荐功能
- 优化用户体验

### v1.2.0

- 新增 WebSocket 实时通信
- 完善聊天功能
- 新增会话管理功能

## 贡献指南

1. Fork 项目
2. 创建功能分支
3. 提交代码
4. 创建 Pull Request

欢迎提交 Issue 和 Pull Request 来改进这个项目。

## 许可证

MIT License

## 联系方式

- 项目地址: [https://github.com/Rosana127/LinkMe-frontend](https://github.com/Rosana127/LinkMe-frontend)
- 后端仓库: [https://github.com/ahzlll/LinkMe-backend](https://github.com/ahzlll/LinkMe-backend)
- 邮箱: <huangy837@mail2.sysu.edu.cn>
- GitHub: Helina-cloud
- 问题反馈: 通过 GitHub Issues
