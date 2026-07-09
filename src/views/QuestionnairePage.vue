<template>
  <div class="min-h-screen bg-gray-50 py-8">
    <div class="max-w-2xl mx-auto px-4">
      <!-- Header -->
      <div class="text-center mb-8">
        <h1 class="text-3xl font-bold text-gray-900 mb-2">专属匹配问卷</h1>
        <p class="text-gray-600">完善你的个人资料，获得更精准的匹配推荐</p>
      </div>

      <!-- Progress Bar -->
      <div class="mb-8">
        <div class="flex justify-between items-center mb-2">
          <span class="text-sm font-medium text-gray-700">进度</span>
          <span class="text-sm font-medium text-gray-700">{{ currentStep }} / {{ totalSteps }}</span>
        </div>
        <div class="w-full bg-gray-200 rounded-full h-3">
          <div
            class="bg-purple-600 h-3 rounded-full transition-all duration-500 ease-out shadow-sm"
            :style="{ width: (currentStep / totalSteps) * 100 + '%' }"
          ></div>
        </div>
      </div>

      <!-- Error Message -->
      <div v-if="errorMessage" class="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
        <span class="text-red-800 text-sm">{{ errorMessage }}</span>
      </div>

      <!-- Save Message -->
      <div v-if="saveMessage" class="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
        <span class="text-green-800 text-sm">{{ saveMessage }}</span>
      </div>

      <!-- Auto Save Status -->
      <div v-if="isAutoSaving" class="mb-4 p-2 bg-blue-50 border border-blue-200 rounded-lg">
        <span class="text-blue-800 text-sm">正在自动保存...</span>
      </div>

      <!-- Form -->
      <div class="bg-white rounded-xl shadow-sm p-8">
        <!-- Step 1: Interests Survey -->
        <div v-if="currentStep === 1">
          <h2 class="text-xl font-bold mb-6">爱好问卷</h2>
          <p class="text-gray-600 mb-2">选择你感兴趣的爱好（可多选）</p>
          <p class="text-sm text-purple-600 mb-6">已选择 {{ formData.interests.length }} 项</p>

          <div v-if="hobbiesLoading" class="text-sm text-gray-500">正在加载爱好选项...</div>
          <div v-else-if="hobbiesLoadError" class="text-sm text-red-600">{{ hobbiesLoadError }}</div>
          <div v-else-if="interestCategories.length === 0" class="text-sm text-gray-500">暂无可选爱好，请确认已执行 deploy.sql 初始化数据。</div>
          <div v-else class="space-y-3">
            <div
              v-for="category in interestCategories"
              :key="category.categoryId"
              class="interest-category border-2 rounded-xl overflow-hidden transition-colors"
              :class="isCategoryExpanded(category.categoryId) ? 'border-purple-200 bg-purple-50/30' : 'border-gray-200 bg-white'"
            >
              <button
                type="button"
                class="interest-category-header w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
                @click="toggleCategory(category.categoryId)"
              >
                <div class="min-w-0">
                  <div class="font-semibold text-gray-900">{{ category.name }}</div>
                  <div class="text-xs text-gray-500 mt-0.5">
                    {{ category.hobbies.length }} 个选项
                    <span v-if="getCategorySelectedCount(category) > 0">
                      · 已选 {{ getCategorySelectedCount(category) }} 项
                    </span>
                  </div>
                </div>

                <div class="flex items-center gap-2 shrink-0 ml-3">
                  <span
                    v-if="getCategorySelectedCount(category) > 0"
                    class="px-2 py-0.5 text-xs font-medium rounded-full bg-purple-100 text-purple-700"
                  >
                    {{ getCategorySelectedCount(category) }}
                  </span>
                  <span class="text-xs text-gray-500">
                    {{ isCategoryExpanded(category.categoryId) ? '收起' : '展开' }}
                  </span>
                </div>
              </button>

              <div
                v-show="isCategoryExpanded(category.categoryId)"
                class="interest-category-body px-4 pb-4 border-t border-gray-100"
              >
                <div class="grid grid-cols-2 gap-3 pt-4">
                  <div
                    v-for="hobby in category.hobbies"
                    :key="hobby.hobbyId"
                    @click="toggleInterest(hobby.name)"
                    :class="[
                      'p-3 rounded-lg border cursor-pointer transition-all duration-200 text-sm font-medium text-center',
                      formData.interests.includes(hobby.name)
                        ? 'bg-purple-50 border-purple-500 text-purple-700'
                        : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-white'
                    ]"
                  >
                    {{ hobby.name }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Step 2: 社交能量来源 -->
        <div v-if="currentStep === 2">
          <h2 class="text-xl font-bold mb-6">性格特质</h2>
          <p class="text-gray-600 mb-6">1. 你的社交能量来源是？</p>

          <div class="space-y-3">
            <label class="flex items-center p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50"
                   :class="formData.socialEnergy === 'extroverted' ? 'border-purple-500 bg-purple-50' : 'border-gray-200'">
              <input
                v-model="formData.socialEnergy"
                type="radio"
                value="extroverted"
                class="mr-4 text-purple-500"
              >
              <div>
                <div class="font-medium">外向型</div>
                <div class="text-sm text-gray-600">通过社交活动获得能量，喜欢与人互动</div>
              </div>
            </label>

            <label class="flex items-center p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50"
                   :class="formData.socialEnergy === 'introverted' ? 'border-purple-500 bg-purple-50' : 'border-gray-200'">
              <input
                v-model="formData.socialEnergy"
                type="radio"
                value="introverted"
                class="mr-4 text-purple-500"
              >
              <div>
                <div class="font-medium">内向型</div>
                <div class="text-sm text-gray-600">通过独处获得能量，享受安静的个人时光</div>
              </div>
            </label>

            <label class="flex items-center p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50"
                   :class="formData.socialEnergy === 'ambivert' ? 'border-purple-500 bg-purple-50' : 'border-gray-200'">
              <input
                v-model="formData.socialEnergy"
                type="radio"
                value="ambivert"
                class="mr-4 text-purple-500"
              >
              <div>
                <div class="font-medium">中间型</div>
                <div class="text-sm text-gray-600">看情况而定，在不同情况下表现不同</div>
              </div>
            </label>
          </div>
        </div>

        <!-- Step 3: 决策方式 -->
        <div v-if="currentStep === 3">
          <h2 class="text-xl font-bold mb-6">性格特质</h2>
          <p class="text-gray-600 mb-6">2. 你更倾向于什么样的决策方式？</p>

          <div class="space-y-3">
            <label class="flex items-center p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50"
                   :class="formData.decisionMaking === 'rational' ? 'border-purple-500 bg-purple-50' : 'border-gray-200'">
              <input
                v-model="formData.decisionMaking"
                type="radio"
                value="rational"
                class="mr-4 text-purple-500"
              >
              <div>
                <div class="font-medium">理性型</div>
                <div class="text-sm text-gray-600">逻辑优先，善于分析利弊得失</div>
              </div>
            </label>

            <label class="flex items-center p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50"
                   :class="formData.decisionMaking === 'emotional' ? 'border-purple-500 bg-purple-50' : 'border-gray-200'">
              <input
                v-model="formData.decisionMaking"
                type="radio"
                value="emotional"
                class="mr-4 text-purple-500"
              >
              <div>
                <div class="font-medium">感性型</div>
                <div class="text-sm text-gray-600">感受优先，相信直觉和内心声音</div>
              </div>
            </label>

            <label class="flex items-center p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50"
                   :class="formData.decisionMaking === 'balanced' ? 'border-purple-500 bg-purple-50' : 'border-gray-200'">
              <input
                v-model="formData.decisionMaking"
                type="radio"
                value="balanced"
                class="mr-4 text-purple-500"
              >
              <div>
                <div class="font-medium">平衡型</div>
                <div class="text-sm text-gray-600">理性与感性并重，寻求两者平衡</div>
              </div>
            </label>
          </div>
        </div>

        <!-- Step 4: 生活节奏 -->
        <div v-if="currentStep === 4">
          <h2 class="text-xl font-bold mb-6">性格特质</h2>
          <p class="text-gray-600 mb-6">3. 你更偏向什么样的生活节奏？</p>

          <div class="space-y-3">
            <label class="flex items-center p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50"
                   :class="formData.lifeRhythm === 'planned' ? 'border-purple-500 bg-purple-50' : 'border-gray-200'">
              <input
                v-model="formData.lifeRhythm"
                type="radio"
                value="planned"
                class="mr-4 text-purple-500"
              >
              <div>
                <div class="font-medium">计划型</div>
                <div class="text-sm text-gray-600">凡事按规划进行，喜欢有计划的生活</div>
              </div>
            </label>

            <label class="flex items-center p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50"
                   :class="formData.lifeRhythm === 'spontaneous' ? 'border-purple-500 bg-purple-50' : 'border-gray-200'">
              <input
                v-model="formData.lifeRhythm"
                type="radio"
                value="spontaneous"
                class="mr-4 text-purple-500"
              >
              <div>
                <div class="font-medium">随性型</div>
                <div class="text-sm text-gray-600">走一步看一步，享受自由的灵活性</div>
              </div>
            </label>

            <label class="flex items-center p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50"
                   :class="formData.lifeRhythm === 'flexible' ? 'border-purple-500 bg-purple-50' : 'border-gray-200'">
              <input
                v-model="formData.lifeRhythm"
                type="radio"
                value="flexible"
                class="mr-4 text-purple-500"
              >
              <div>
                <div class="font-medium">弹性型</div>
                <div class="text-sm text-gray-600">在计划与随性之间找到平衡</div>
              </div>
            </label>
          </div>
        </div>

        <!-- Step 5: 年龄要求 -->
        <div v-if="currentStep === 5">
          <h2 class="text-xl font-bold mb-6">交友要求</h2>
          <p class="text-gray-600 mb-6">1. 年龄要求</p>

          <div class="space-y-4">
            <!-- 无限制选项 -->
            <label class="flex items-center p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50"
                   :class="formData.ageRequirement.unlimited ? 'border-purple-500 bg-purple-50' : 'border-gray-200'">
              <input
                v-model="formData.ageRequirement.unlimited"
                type="checkbox"
                class="mr-4 text-purple-500"
                @change="toggleUnlimitedAge"
              >
              <div>
                <div class="font-medium">无限制</div>
                <div class="text-sm text-gray-600">不限制对方年龄</div>
              </div>
            </label>

            <!-- 年龄范围选择 -->
            <div class="space-y-4">
              <div class="flex items-center space-x-4">
                <div class="flex-1">
                  <label class="block text-sm font-medium text-gray-700 mb-2">最小年龄</label>
                  <select
                    v-model="formData.ageRequirement.minAge"
                    :disabled="formData.ageRequirement.unlimited"
                    class="w-full p-3 border-2 rounded-lg focus:border-purple-500 focus:outline-none"
                    :class="formData.ageRequirement.unlimited ? 'bg-gray-100 text-gray-500' : 'bg-white'"
                  >
                    <option v-for="age in ageOptions" :key="age" :value="age">{{ age }}岁</option>
                  </select>
                </div>
                <div class="flex-1">
                  <label class="block text-sm font-medium text-gray-700 mb-2">最大年龄</label>
                  <select
                    v-model="formData.ageRequirement.maxAge"
                    :disabled="formData.ageRequirement.unlimited"
                    class="w-full p-3 border-2 rounded-lg focus:border-purple-500 focus:outline-none"
                    :class="formData.ageRequirement.unlimited ? 'bg-gray-100 text-gray-500' : 'bg-white'"
                  >
                    <option v-for="age in ageOptions" :key="age" :value="age">{{ age }}岁</option>
                  </select>
                </div>
              </div>

              <!-- 年龄范围错误提示 -->
              <div v-if="ageRangeError" class="text-red-500 text-sm">
                {{ ageRangeError }}
              </div>
            </div>
          </div>
        </div>

        <!-- Step 6: 距离要求 -->
        <div v-if="currentStep === 6">
          <h2 class="text-xl font-bold mb-6">交友要求</h2>
          <p class="text-gray-600 mb-6">2. 您对交友的关系距离要求？</p>

          <div class="space-y-3">
            <label class="flex items-center p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50"
                   :class="formData.distanceRequirement === 'same_city_priority' ? 'border-purple-500 bg-purple-50' : 'border-gray-200'">
              <input
                v-model="formData.distanceRequirement"
                type="radio"
                value="same_city_priority"
                class="mr-4 text-purple-500"
              >
              <div>
                <div class="font-medium">同城优先（可线下见面）</div>
                <div class="text-sm text-gray-600">希望在同一城市，方便线下见面交流</div>
              </div>
            </label>

            <label class="flex items-center p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50"
                   :class="formData.distanceRequirement === 'both_ok' ? 'border-purple-500 bg-purple-50' : 'border-gray-200'">
              <input
                v-model="formData.distanceRequirement"
                type="radio"
                value="both_ok"
                class="mr-4 text-purple-500"
              >
              <div>
                <div class="font-medium">同城/异地均可（线上为主）</div>
                <div class="text-sm text-gray-600">同城或异地都可以，主要通过线上交流</div>
              </div>
            </label>

            <label class="flex items-center p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50"
                   :class="formData.distanceRequirement === 'no_limit' ? 'border-purple-500 bg-purple-50' : 'border-gray-200'">
              <input
                v-model="formData.distanceRequirement"
                type="radio"
                value="no_limit"
                class="mr-4 text-purple-500"
              >
              <div>
                <div class="font-medium">不限距离</div>
                <div class="text-sm text-gray-600">距离不是问题，真心最重要</div>
              </div>
            </label>
          </div>
        </div>

        <!-- Step 7: 额外要求 -->
        <div v-if="currentStep === 7">
          <h2 class="text-xl font-bold mb-6">交友要求</h2>
          <p class="text-gray-600 mb-6">3. 额外要求（选填）</p>

          <textarea
            v-model="formData.additionalRequirements"
            class="w-full p-4 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none resize-none"
            rows="4"
            placeholder="请描述你的其他要求或想法..."
          ></textarea>
        </div>

        <!-- Step 8: 头像上传（可选） -->
        <div v-if="currentStep === 8">
          <h2 class="text-xl font-bold mb-2">设置头像</h2>
          <p class="text-gray-500 mb-6">上传一张你的照片，让大家更好地认识你（可选，可跳过）</p>

          <div class="flex flex-col items-center gap-4">
            <!-- 头像预览 -->
            <div class="relative">
              <img
                v-if="avatarPreview"
                :src="avatarPreview"
                class="w-32 h-32 rounded-full object-cover border-4 border-purple-200 shadow-lg"
                alt="头像预览"
              />
              <div
                v-else
                class="w-32 h-32 rounded-full bg-gray-100 border-4 border-gray-200 flex items-center justify-center text-sm text-gray-500 text-center px-3"
              >
                暂无头像
              </div>
              <button
                v-if="avatarPreview"
                @click="removeAvatar"
                class="absolute -top-1 -right-1 px-2 py-1 text-xs bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow"
                title="移除头像"
              >
                移除
              </button>
            </div>

            <!-- 上传按钮 -->
            <label class="px-5 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors cursor-pointer font-medium">
              {{ avatarPreview ? '更换头像' : '选择图片' }}
              <input
                type="file"
                accept="image/png,image/jpeg,image/gif,image/webp"
                class="hidden"
                @change="handleAvatarUpload"
              />
            </label>
            <p class="text-xs text-gray-400">支持 JPG、PNG、GIF、WebP 格式</p>

            <!-- 跳过按钮 -->
            <button
              v-if="!avatarPreview"
              @click="nextStep"
              class="text-gray-500 text-sm underline hover:text-gray-700"
            >跳过，以后再说</button>
          </div>
        </div>

        <!-- Step 9: 完成 -->
        <div v-if="currentStep === 9">
          <div class="text-center py-8">
            <h2 class="text-2xl font-bold text-gray-900 mb-2">问卷完成！</h2>
            <p class="text-gray-600 mb-6">感谢您填写问卷，我们会根据您的信息为您提供更好的匹配推荐</p>

            <button
              @click="goBackToMatch"
              class="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
            >
              返回匹配页面
            </button>
          </div>
        </div>
      </div>

      <!-- Navigation Buttons -->
      <div class="flex justify-between mt-8">
        <button
          v-if="currentStep > 1 && currentStep < 9"
          @click="prevStep"
          class="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
        >
          上一步
        </button>
        <div v-else></div>

        <button
          v-if="currentStep < 9"
          @click="canProceed ? nextStep() : null"
          :disabled="!canProceed || isSaving"
          class="px-6 py-3 rounded-lg transition-colors font-medium border"
          :style="canProceed && !isSaving ? 'background-color: #2563eb; color: white; border-color: #2563eb; cursor: pointer;' : 'background-color: #f3f4f6; color: #1f2937; border-color: #9ca3af; cursor: not-allowed;'"
        >
          <span v-if="isSaving">保存中...</span>
          <span v-else>{{ currentStep === totalSteps - 1 ? '完成问卷' : '下一步' }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { submitQuestionnaire, getQuestionnaire, updateQuestionnaire, getHobbyOptions } from '@/api/questionnaire'
import { useAuthStore } from '@/stores/auth'

export default {
  name: 'QuestionnairePage',
  data() {
    return {
      currentStep: 1,
      totalSteps: 9,
      isLoading: false,
      isSaving: false,
      isAutoSaving: false,
      autoSaveDisabled: false,
      saveMessage: '',
      autoSaveTimer: null,
      errorMessage: '',
      formData: {
        interests: [],
        socialEnergy: '',
        decisionMaking: '',
        lifeRhythm: '',
        ageRequirement: {
          unlimited: false,
          minAge: 18,
          maxAge: 30
        },
        distanceRequirement: '',
        additionalRequirements: ''
      },
      avatarFile: null,
      avatarPreview: null,
      expandedCategoryIds: [],
      interestCategories: [],
      hobbiesLoading: false,
      hobbiesLoadError: '',
      ageOptions: Array.from({length: 82}, (_, i) => i + 18) // 18-99岁
    }
  },
  computed: {
    canProceed() {
      switch (this.currentStep) {
        case 1:
          return !this.hobbiesLoading && !this.hobbiesLoadError && this.formData.interests.length > 0
        case 2:
          return this.formData.socialEnergy !== ''
        case 3:
          return this.formData.decisionMaking !== ''
        case 4:
          return this.formData.lifeRhythm !== ''
        case 5:
          return this.validateAgeRequirement()
        case 6:
          return this.formData.distanceRequirement !== ''
        case 7:
          return true // 额外要求是选填的
        case 8:
          return true // 头像上传是可选的
        default:
          return false
      }
    },
    ageRangeError() {
      if (this.formData.ageRequirement.unlimited) {
        return ''
      }
      if (this.formData.ageRequirement.minAge > this.formData.ageRequirement.maxAge) {
        return '最小年龄不能大于最大年龄'
      }
      return ''
    }
  },
  methods: {
    buildQuestionnairePayload(userId, includeAdditional) {
      const ageUnlimited = this.formData.ageRequirement.unlimited
      const ageMin = ageUnlimited ? null : this.formData.ageRequirement.minAge
      const ageMax = ageUnlimited ? null : this.formData.ageRequirement.maxAge
      const distanceMap = {
        same_city_priority: 'same_city',
        both_ok: 'same_city_or_remote',
        no_limit: 'unlimited'
      }

      const payload = {
        userId,
        ageMin,
        ageMax,
        ageUnlimited,
        interests: Array.isArray(this.formData.interests) ? this.formData.interests.slice() : [],
        socialEnergy: this.formData.socialEnergy || null,
        decisionMaking: this.formData.decisionMaking || null,
        lifeRhythm: this.formData.lifeRhythm || null,
        distancePreference: distanceMap[this.formData.distanceRequirement] || null
      }
      if (includeAdditional) {
        payload.additionalRequirements = this.formData.additionalRequirements || ''
      }
      if (this.avatarPreview) {
        payload.avatarUrl = this.avatarPreview
      }
      return payload
    },
    toggleInterest(interestName) {
      const index = this.formData.interests.indexOf(interestName)
      if (index > -1) {
        this.formData.interests.splice(index, 1)
      } else {
        this.formData.interests.push(interestName)
      }
    },
    toggleCategory(categoryId) {
      const index = this.expandedCategoryIds.indexOf(categoryId)
      if (index > -1) {
        this.expandedCategoryIds.splice(index, 1)
      } else {
        this.expandedCategoryIds.push(categoryId)
      }
    },
    isCategoryExpanded(categoryId) {
      return this.expandedCategoryIds.includes(categoryId)
    },
    getCategorySelectedCount(category) {
      return (category.hobbies || []).filter((hobby) => this.formData.interests.includes(hobby.name)).length
    },
    normalizeInterestValues(values) {
      const codeToName = {}
      this.interestCategories.forEach((category) => {
        ;(category.hobbies || []).forEach((hobby) => {
          if (hobby.code) {
            codeToName[hobby.code] = hobby.name
          }
        })
      })
      return values
        .map((value) => codeToName[value] || value)
        .filter((value) => typeof value === 'string' && value.trim())
    },
    async loadHobbyOptions() {
      this.hobbiesLoading = true
      this.hobbiesLoadError = ''
      try {
        const data = await getHobbyOptions()
        this.interestCategories = Array.isArray(data) ? data : []
      } catch (error) {
        this.interestCategories = []
        this.hobbiesLoadError = error?.message || '加载爱好选项失败'
      } finally {
        this.hobbiesLoading = false
      }
    },
    syncExpandedCategoriesFromSelection() {
      const expanded = this.interestCategories
        .filter((category) => this.getCategorySelectedCount(category) > 0)
        .map((category) => category.categoryId)

      if (expanded.length > 0) {
        this.expandedCategoryIds = expanded
      } else if (this.interestCategories.length > 0) {
        this.expandedCategoryIds = [this.interestCategories[0].categoryId]
      }
    },
    handleAvatarUpload(event) {
      const file = event.target.files[0]
      if (!file) return
      if (file.size > 5 * 1024 * 1024) {
        this.errorMessage = '图片大小不能超过5MB'
        event.target.value = ''
        return
      }
      const reader = new FileReader()
      reader.onload = (e) => {
        this.avatarPreview = e.target.result
      }
      reader.readAsDataURL(file)
      event.target.value = ''
    },
    removeAvatar() {
      this.avatarPreview = null
    },
    toggleUnlimitedAge() {
      if (this.formData.ageRequirement.unlimited) {
        this.formData.ageRequirement.minAge = 18
        this.formData.ageRequirement.maxAge = 99
      }
    },
    validateAgeRequirement() {
      if (this.formData.ageRequirement.unlimited) {
        return true
      }
      return this.formData.ageRequirement.minAge <= this.formData.ageRequirement.maxAge
    },

    // 自动保存功能
    debounceAutoSave() {
      if (this.autoSaveDisabled) {
        return
      }
      if (this.autoSaveTimer) {
        clearTimeout(this.autoSaveTimer)
      }
      this.autoSaveTimer = setTimeout(() => {
        this.autoSave()
      }, 5000)
    },

    async autoSave() {
      if (this.autoSaveDisabled || this.isAutoSaving || this.isSaving) {
        return
      }

      const hasData = this.hasPartialData()
      if (!hasData) {
        return
      }

      this.isAutoSaving = true
      this.saveMessage = ''

      try {
        const authStore = useAuthStore()
        const userId = authStore.userId

        if (!userId) {
          return
        }

        const questionnaireData = this.buildQuestionnairePayload(userId, false)

        if (import.meta.env.DEV) {
          console.log('自动保存数据:', {
            userId: questionnaireData.userId,
            interests: questionnaireData.interests,
            socialEnergy: questionnaireData.socialEnergy,
            decisionMaking: questionnaireData.decisionMaking
          })
        }

        // 先尝试PUT更新，如果失败（404），则使用POST创建
        try {
          await updateQuestionnaire(questionnaireData)
        } catch (updateError) {
          if (updateError.status === 404 || updateError.response?.status === 404) {
            await submitQuestionnaire(questionnaireData)
          } else {
            throw updateError
          }
        }

        this.saveMessage = '草稿已自动保存'
        setTimeout(() => {
          this.saveMessage = ''
        }, 3000)

      } catch (error) {
        console.warn('自动保存失败:', error)
      } finally {
        this.isAutoSaving = false
      }
    },

    hasPartialData() {
      const data = this.formData
      return (
        data.interests.length > 0 ||
        data.socialEnergy ||
        data.decisionMaking ||
        data.lifeRhythm ||
        data.distanceRequirement ||
        (!data.ageRequirement.unlimited && data.ageRequirement.minAge !== 18) ||
        (!data.ageRequirement.unlimited && data.ageRequirement.maxAge !== 30) ||
        data.additionalRequirements
      )
    },
    async nextStep() {
      if (!this.canProceed) {
        return
      }

      // 如果是第8步（头像上传），提交问卷数据
      if (this.currentStep === this.totalSteps - 1) {
        await this.submitQuestionnaireData()
        return
      }

      // 进入下一步
      if (this.currentStep < this.totalSteps) {
        this.currentStep++
      }
    },
    async submitQuestionnaireData() {
      if (this.isSaving) {
        return
      }
      this.autoSaveDisabled = true
      if (this.autoSaveTimer) {
        clearTimeout(this.autoSaveTimer)
        this.autoSaveTimer = null
      }
      this.isSaving = true
      this.errorMessage = ''

      try {
        const authStore = useAuthStore()
        const userId = authStore.userId

        if (!userId) {
          throw new Error('用户未登录，请先登录')
        }

        const questionnaireData = this.buildQuestionnairePayload(userId, true)

        console.log('准备提交的问卷数据:', JSON.stringify(questionnaireData, null, 2))

        // 先用PUT保存数据，再用POST标记问卷完成
        try {
          await updateQuestionnaire(questionnaireData)
        } catch (updateError) {
          console.warn('PUT更新问卷失败，尝试POST创建:', updateError)
        }
        // POST会标记 matching_questionnaire_completed = TRUE
        await submitQuestionnaire(questionnaireData)

        this.saveMessage = '问卷提交成功！'
        setTimeout(() => {
          this.saveMessage = ''
        }, 3000)

        // 进入完成页面（第9步）
        if (this.currentStep < this.totalSteps) {
          this.currentStep++
        }
      } catch (error) {
        console.error('保存问卷失败:', error)

        let errorMsg = ''

        if (error?.message && typeof error.message === 'string' && error.message.trim() && error.message !== 'No message available') {
          errorMsg = error.message.trim()
        } else if (error?.response?.data?.message && typeof error.response.data.message === 'string' && error.response.data.message.trim()) {
          errorMsg = error.response.data.message.trim()
        } else if (error?.httpData?.message && typeof error.httpData.message === 'string' && error.httpData.message.trim()) {
          errorMsg = error.httpData.message.trim()
        } else if (error?.response?.data?.msg && typeof error.response.data.msg === 'string' && error.response.data.msg.trim()) {
          errorMsg = error.response.data.msg.trim()
        } else if (error?.status || error?.response?.status) {
          const status = error.status || error.response.status
          switch (status) {
            case 400:
              errorMsg = '请求参数错误，请检查填写的内容'
              break
            case 401:
              errorMsg = '登录已过期，请重新登录'
              break
            case 403:
              errorMsg = '没有权限执行此操作'
              break
            case 404:
              errorMsg = '请求的资源不存在，请检查后端API是否已实现'
              break
            case 500:
              errorMsg = '服务器内部错误，请稍后重试'
              break
            default:
              errorMsg = `请求失败 (状态码: ${status})`
          }
        } else if (error?.request && !error?.response) {
          errorMsg = '网络连接失败，请检查后端服务是否运行以及网络连接是否正常'
        }

        this.errorMessage = errorMsg || '保存问卷失败，请重试'

        if (this.errorMessage === 'No message available' || !this.errorMessage.trim()) {
          this.errorMessage = '保存问卷失败，请重试'
        }
      } finally {
        this.isSaving = false
        setTimeout(() => {
          this.autoSaveDisabled = false
        }, 6000)
      }
    },
    async loadExistingQuestionnaire() {
      if (this.isLoading) {
        return
      }

      this.isLoading = true
      this.errorMessage = ''

      try {
        const authStore = useAuthStore()
        const userId = authStore.userId

        if (!userId) {
          this.isLoading = false
          return
        }

        const existingData = await getQuestionnaire()

        if (existingData && typeof existingData === 'object') {
          // 兴趣爱好
          if (Array.isArray(existingData.interests)) {
            this.formData.interests = this.normalizeInterestValues(existingData.interests)
            this.syncExpandedCategoriesFromSelection()
          }

          // 自我性格
          this.formData.socialEnergy = existingData.socialEnergy || ''
          this.formData.decisionMaking = existingData.decisionMaking || ''
          this.formData.lifeRhythm = existingData.lifeRhythm || ''

          // 年龄要求
          const ageUnlimited = !!existingData.ageUnlimited
          const ageMin = existingData.ageMin != null ? existingData.ageMin : 18
          const ageMax = existingData.ageMax != null ? existingData.ageMax : 30
          this.formData.ageRequirement = { unlimited: ageUnlimited, minAge: ageMin, maxAge: ageMax }

          // 距离偏好：后端返回 distancePreference，需反向映射回前端编码
          const reverseDistanceMap = {
            same_city: 'same_city_priority',
            same_city_or_remote: 'both_ok',
            unlimited: 'no_limit'
          }
          if (existingData.distancePreference) {
            this.formData.distanceRequirement = reverseDistanceMap[existingData.distancePreference] || existingData.distancePreference
          }

          // 额外要求
          if (existingData.additionalRequirements) {
            this.formData.additionalRequirements = existingData.additionalRequirements
          }
          // 头像
          if (existingData.avatarUrl) {
            this.avatarPreview = existingData.avatarUrl
          }
        }
      } catch (error) {
        if (error.response?.status !== 404) {
          console.warn('获取已有问卷数据失败:', error)
        }
      } finally {
        this.isLoading = false
      }
    },
    prevStep() {
      if (this.currentStep > 1) {
        this.currentStep--
      }
    },
    goBackToMatch() {
      this.$router.push('/match')
    }
  },
  watch: {
    'formData.ageRequirement.unlimited'(newVal) {
      if (newVal) {
        this.formData.ageRequirement.minAge = 18
        this.formData.ageRequirement.maxAge = 99
      }
    },
    formData: {
      handler() {
        const authStore = useAuthStore()
        if (!this.isLoading && authStore.isAuthenticated) {
          this.debounceAutoSave()
        }
      },
      deep: true,
      immediate: false
    }
  },
  async mounted() {
    await this.loadHobbyOptions()
    await this.loadExistingQuestionnaire()
    this.syncExpandedCategoriesFromSelection()
  }
}
</script>

<style scoped>
/* 自定义样式 */
.transition-all {
  transition-property: all;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 150ms;
}

.interest-category-header:focus-visible {
  outline: 2px solid rgba(124, 58, 237, 0.45);
  outline-offset: -2px;
}
</style>

<style>
/* 深色主题下问卷页面的文字颜色 */
.app-container.theme-dark .min-h-screen h1,
.app-container.theme-dark .min-h-screen h2,
.app-container.theme-dark .min-h-screen h3,
.app-container.theme-dark .min-h-screen h4 {
  color: #f9fafb !important;
}

.app-container.theme-dark .min-h-screen .text-gray-900,
.app-container.theme-dark .min-h-screen .text-gray-700,
.app-container.theme-dark .min-h-screen .text-gray-600 {
  color: #e5e7eb !important;
}

.app-container.theme-dark .min-h-screen .text-gray-500,
.app-container.theme-dark .min-h-screen .text-gray-400 {
  color: #9ca3af !important;
}

.app-container.theme-dark .min-h-screen .font-medium {
  color: #f3f4f6 !important;
}

.app-container.theme-dark .min-h-screen .bg-white {
  background-color: #1f2937 !important;
  border-color: #374151 !important;
}

.app-container.theme-dark .min-h-screen .bg-gray-50 {
  background-color: #111827 !important;
}

.app-container.theme-dark .min-h-screen .bg-gray-200 {
  background-color: #374151 !important;
}

.app-container.theme-dark .min-h-screen .border-gray-200,
.app-container.theme-dark .min-h-screen .border-gray-300 {
  border-color: #4b5563 !important;
}

.app-container.theme-dark .min-h-screen .hover\:bg-gray-50:hover {
  background-color: #1f2937 !important;
}

.app-container.theme-dark .min-h-screen .bg-purple-50 {
  background-color: rgba(139, 92, 246, 0.2) !important;
  border-color: rgba(139, 92, 246, 0.4) !important;
}

.app-container.theme-dark .min-h-screen .bg-green-100 {
  background-color: rgba(34, 197, 94, 0.2) !important;
}

.app-container.theme-dark .min-h-screen .bg-red-50 {
  background-color: rgba(239, 68, 68, 0.2) !important;
  border-color: rgba(239, 68, 68, 0.4) !important;
}

.app-container.theme-dark .min-h-screen .bg-blue-50 {
  background-color: rgba(59, 130, 246, 0.2) !important;
  border-color: rgba(59, 130, 246, 0.4) !important;
}

.app-container.theme-dark .min-h-screen .bg-green-50 {
  background-color: rgba(34, 197, 94, 0.2) !important;
  border-color: rgba(34, 197, 94, 0.4) !important;
}

.app-container.theme-dark .min-h-screen select {
  background-color: #1f2937 !important;
  color: #e5e7eb !important;
  border-color: #4b5563 !important;
}

.app-container.theme-dark .min-h-screen textarea {
  background-color: #1f2937 !important;
  color: #e5e7eb !important;
  border-color: #4b5563 !important;
}

.app-container.theme-dark .min-h-screen textarea::placeholder {
  color: #6b7280 !important;
}

.app-container.theme-dark .min-h-screen .bg-gray-100 {
  background-color: #374151 !important;
}
</style>
