# 问卷系统API使用说明

## 概述

LinkMe 项目的问卷系统提供精简的匹配问卷功能，支持用户分步填写、自动保存草稿、以及数据恢复。问卷共 7 步，涵盖兴趣爱好、自身性格特质、交友要求等核心维度。

## 功能特性

### 1. 数据保存
- **最终提交**：用户完成问卷后提交完整数据（POST，标记 `matching_questionnaire_completed=TRUE`）
- **自动保存**：填写过程中每 5 秒自动保存草稿（PUT，不标记完成）
- **部分更新**：支持更新部分问卷数据

### 2. 数据拉取
- **自动加载**：页面加载时检查并加载已有数据
- **数据恢复**：支持断点续传，用户可继续之前的填写

### 3. 用户体验
- **进度提示**：显示保存状态和进度
- **错误处理**：友好的错误提示和恢复机制
- **防抖机制**：避免频繁的 API 调用

## 问卷步骤（7 步）

| 步骤 | 内容 | 字段 | 是否必填 |
|------|------|------|----------|
| 1 | 兴趣爱好（多选） | `interests` | 是（至少选 1 个） |
| 2 | 社交能量来源 | `socialEnergy` | 是 |
| 3 | 决策方式 | `decisionMaking` | 是 |
| 4 | 生活节奏 | `lifeRhythm` | 是 |
| 5 | 年龄要求 | `ageMin` / `ageMax` / `ageUnlimited` | 是 |
| 6 | 关系距离 | `distancePreference` | 是 |
| 7 | 额外要求（选填） | `additionalRequirements` | 否 |

## API接口

### 提交问卷数据 (POST)

最终提交使用 POST，后端会将 `matching_questionnaire_completed` 设为 `TRUE`。

```javascript
await submitQuestionnaire(questionnaireData)

// 数据格式
{
  userId: 123,
  interests: ['reading', 'travel', 'fitness'],
  socialEnergy: 'extroverted',       // extroverted | introverted | ambivert
  decisionMaking: 'rational',        // rational | emotional | balanced
  lifeRhythm: 'planned',             // planned | spontaneous | flexible
  ageMin: 25,
  ageMax: 35,
  ageUnlimited: false,
  distancePreference: 'same_city',   // same_city | same_city_or_remote | unlimited
  additionalRequirements: '希望找一个喜欢旅行的伴侣'
}
```

### 更新问卷数据 (PUT)

自动保存草稿使用 PUT，**不会**标记 `matching_questionnaire_completed`。

```javascript
await updateQuestionnaire(questionnaireData)
```

### 获取问卷数据 (GET)

```javascript
// 获取当前登录用户的数据
const data = await getQuestionnaire()

// 返回字段
{
  userId: 123,
  ageMin: 25,
  ageMax: 35,
  ageUnlimited: false,
  distancePreference: 'same_city',
  additionalRequirements: '...',
  interests: ['reading', 'travel'],
  socialEnergy: 'extroverted',
  decisionMaking: 'rational',
  lifeRhythm: 'planned'
}
```

### 获取公开问卷数据

```javascript
// 获取指定用户的公开问卷（用于匹配页面展示兴趣和性格）
const data = await getPublicQuestionnaire(userId)
```

## 前端实现

### 表单数据结构

```javascript
formData: {
  interests: [],               // 兴趣爱好（多选，字符串编码数组）
  socialEnergy: '',            // 社交能量来源
  decisionMaking: '',          // 决策方式
  lifeRhythm: '',              // 生活节奏
  ageRequirement: {            // 年龄要求
    unlimited: false,
    minAge: 18,
    maxAge: 30
  },
  distanceRequirement: '',     // 距离要求（前端编码）
  additionalRequirements: ''   // 额外要求（选填）
}
```

### 距离偏好编码映射

前端使用以下编码，提交时映射为后端编码：

| 前端编码 | 后端编码 | 含义 |
|----------|----------|------|
| `same_city_priority` | `same_city` | 同城优先 |
| `both_ok` | `same_city_or_remote` | 同城/异地均可 |
| `no_limit` | `unlimited` | 不限距离 |

### 自动保存机制

```javascript
watch: {
  formData: {
    handler() {
      const authStore = useAuthStore()
      if (!this.isLoading && authStore.isAuthenticated) {
        this.debounceAutoSave() // 5秒后执行自动保存
      }
    },
    deep: true,
    immediate: false
  }
}
```

### 数据加载逻辑

```javascript
async loadExistingQuestionnaire() {
  try {
    const existingData = await getQuestionnaire()

    if (existingData) {
      this.formData.interests = existingData.interests || []
      this.formData.socialEnergy = existingData.socialEnergy || ''
      this.formData.decisionMaking = existingData.decisionMaking || ''
      this.formData.lifeRhythm = existingData.lifeRhythm || ''

      // 年龄要求
      this.formData.ageRequirement = {
        unlimited: !!existingData.ageUnlimited,
        minAge: existingData.ageMin ?? 18,
        maxAge: existingData.ageMax ?? 30
      }

      // 距离偏好：后端返回 distancePreference，需反向映射回前端编码
      const reverseDistanceMap = {
        same_city: 'same_city_priority',
        same_city_or_remote: 'both_ok',
        unlimited: 'no_limit'
      }
      this.formData.distanceRequirement =
        reverseDistanceMap[existingData.distancePreference] || ''

      // 额外要求
      this.formData.additionalRequirements = existingData.additionalRequirements || ''
    }
  } catch (error) {
    // 404 表示用户还没有填写过问卷，这是正常的
    if (error.response?.status !== 404) {
      console.warn('获取问卷数据失败:', error)
    }
  }
}
```

## 验证规则

| 步骤 | 校验条件 |
|------|----------|
| 1 | `interests.length > 0` |
| 2 | `socialEnergy !== ''` |
| 3 | `decisionMaking !== ''` |
| 4 | `lifeRhythm !== ''` |
| 5 | `ageUnlimited === true` 或 `minAge <= maxAge` |
| 6 | `distanceRequirement !== ''` |
| 7 | 无（选填） |

## 访问控制

- **MatchPage**：所有用户均可浏览推荐列表（冷启动推荐）
- **喜欢（红心）**：需 `matching_questionnaire_completed = TRUE`，否则后端返回 403
- **发起聊天**：需 `matching_questionnaire_completed = TRUE`，否则后端返回 403

## 错误处理

### 常见错误类型
1. **网络错误**：显示重试提示
2. **认证错误**：跳转到登录页面
3. **验证错误**：显示具体错误信息
4. **403 错误**：提示用户先完成问卷

### 自动保存失败
- 自动保存失败不会显示错误给用户
- 避免干扰用户的填写体验
- 会在控制台记录错误日志

## 性能优化

### 防抖机制
- 5 秒延迟的自动保存
- 清除之前的定时器避免重复保存
- 只在有实际数据变化时保存

### 数据验证
- 前端验证减少无效请求
- 分步验证避免一次性处理大量数据
