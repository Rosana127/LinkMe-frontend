<template>
  <div class="auth-page">
    <!-- 左侧品牌区 -->
    <div class="auth-left">
      <button class="back-button" @click="goBack">
        <span class="iconify" data-icon="mdi:arrow-left" data-inline="false"></span>
        <span>返回</span>
      </button>
      <div class="brand-content">
        <div class="brand-icon">
          <span class="iconify" data-icon="mdi:account-plus" data-inline="false"></span>
        </div>
        <h1 class="brand-title">加入 LinkMe</h1>
        <p class="brand-desc">创建账号，开启你的交友之旅</p>
        <div class="brand-tags">
          <span>智能匹配</span>
          <span>真实社交</span>
          <span>安全交友</span>
        </div>
      </div>
    </div>

    <!-- 右侧表单区 -->
    <div class="auth-right">
      <div class="register-card">
        <div class="register-header">
          <div class="brand-badge">LinkMe 账号</div>
          <h1 class="register-title">创建你的新账号</h1>
        </div>

        <form class="register-form" @submit.prevent="handleRegister">
          <div class="form-group">
            <label for="username" class="form-label">用户名</label>
            <input
              id="username"
              v-model.trim="form.username"
              type="text"
              class="form-input"
              placeholder="请输入用户名"
              required
            />
          </div>

          <div class="form-group">
            <label for="nickname" class="form-label">昵称</label>
            <input
              id="nickname"
              v-model.trim="form.nickname"
              type="text"
              class="form-input"
              placeholder="请输入昵称"
              required
            />
          </div>

          <div class="form-group">
            <label class="form-label">注册方式</label>
            <div class="contact-switch" :data-mode="contactMethod">
              <div class="contact-thumb"></div>
              <button
                type="button"
                class="contact-option"
                :class="{ active: contactMethod === 'email' }"
                @click="switchContactMethod('email')"
              >
                <span class="iconify" data-icon="mdi:email-outline" data-inline="false"></span>
                <span>邮箱</span>
              </button>
              <button
                type="button"
                class="contact-option"
                :class="{ active: contactMethod === 'phone' }"
                @click="switchContactMethod('phone')"
              >
                <span class="iconify" data-icon="mdi:cellphone" data-inline="false"></span>
                <span>手机号</span>
              </button>
            </div>
          </div>

          <div v-if="contactMethod === 'email'" class="form-group">
            <label for="email" class="form-label">邮箱</label>
            <input
              id="email"
              v-model.trim="form.email"
              type="email"
              class="form-input"
              placeholder="请输入邮箱地址"
              required
            />
          </div>

          <div v-else class="form-group">
            <label for="phone" class="form-label">手机号</label>
            <input
              id="phone"
              v-model.trim="form.phone"
              type="tel"
              class="form-input"
              placeholder="请输入手机号"
              required
            />
          </div>

          <div class="form-group">
            <label for="password" class="form-label">密码</label>
            <input
              id="password"
              v-model="form.password"
              type="password"
              class="form-input"
              placeholder="请输入至少 8 位密码"
              required
              minlength="8"
            />
            <p class="form-hint">密码长度不少于 8 位。</p>
          </div>

          <div class="form-row">
            <div class="form-group form-col">
              <label for="gender" class="form-label">性别</label>
              <select id="gender" v-model="form.gender" class="form-input" required>
                <option value="">请选择</option>
                <option value="男">男</option>
                <option value="女">女</option>
                <option value="其他">其他</option>
              </select>
            </div>

            <div class="form-group form-col">
              <label for="birthday" class="form-label">生日</label>
              <input
                id="birthday"
                ref="birthdayInput"
                v-model="form.birthday"
                type="date"
                class="form-input"
                required
                @keydown.prevent
                @click="openBirthdayPicker"
                @focus="openBirthdayPicker"
              />
            </div>
          </div>

          <div class="form-group">
            <label for="country" class="form-label">国家 / 地区</label>
            <select id="country" v-model="selectedCountry" class="form-input">
              <option v-for="country in countryOptions" :key="country.code" :value="country.code">
                {{ country.name }}
              </option>
            </select>
          </div>

          <template v-if="selectedCountry === 'CN'">
            <div class="form-row">
              <div class="form-group form-col">
                <label for="province" class="form-label">省份 / 直辖市</label>
                <select id="province" v-model="selectedProvince" class="form-input">
                  <option value="">请选择省份</option>
                  <option
                    v-for="province in chinaProvinceOptions"
                    :key="province.name"
                    :value="province.name"
                  >
                    {{ province.name }}
                  </option>
                </select>
              </div>

              <div class="form-group form-col">
                <label for="city" class="form-label">城市</label>
                <select
                  id="city"
                  v-model="selectedCity"
                  class="form-input"
                  :disabled="!selectedProvince"
                >
                  <option value="">请选择城市</option>
                  <option v-for="city in cityOptions" :key="city.name" :value="city.name">
                    {{ city.name }}
                  </option>
                </select>
              </div>
            </div>

            <div class="form-group">
              <label for="district" class="form-label">区县</label>
              <select
                id="district"
                v-model="selectedDistrict"
                class="form-input"
                :disabled="!selectedCity"
              >
                <option value="">请选择区县</option>
                <option v-for="district in districtOptions" :key="district" :value="district">
                  {{ district }}
                </option>
              </select>
              <p class="form-hint">已展示全部省级地区和全部地级市，区县会按所选城市展开。</p>
            </div>
          </template>

          <div class="form-group">
            <label class="form-label">地区结果</label>
            <div class="region-preview">{{ finalRegion }}</div>
            <p class="form-hint">如果不选择，系统会记为“未知”。</p>
          </div>

          <div v-if="errorMessage" class="error-message">
            {{ errorMessage }}
          </div>

          <div v-if="successMessage" class="success-message">
            {{ successMessage }}
          </div>

          <button type="submit" class="register-button" :disabled="loading">
            {{ loading ? '注册中...' : '注册' }}
          </button>

          <div class="register-footer">
            <span>已有账号？</span>
            <router-link to="/login" class="link">立即登录</router-link>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { chinaRegionMap, countryOptions } from '@/data/regions'

const router = useRouter()
const authStore = useAuthStore()
const birthdayInput = ref(null)
const contactMethod = ref('email')

const form = ref({
  username: '',
  nickname: '',
  email: '',
  phone: '',
  password: '',
  gender: '',
  birthday: ''
})

const selectedCountry = ref('UNKNOWN')
const selectedProvince = ref('')
const selectedCity = ref('')
const selectedDistrict = ref('')
const loading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

const chinaProvinceOptions = computed(() => chinaRegionMap)

const cityOptions = computed(() => {
  const province = chinaRegionMap.find((item) => item.name === selectedProvince.value)
  return province?.cities || []
})

const districtOptions = computed(() => {
  const city = cityOptions.value.find((item) => item.name === selectedCity.value)
  return city?.districts || []
})

const selectedCountryName = computed(() => {
  return countryOptions.find((item) => item.code === selectedCountry.value)?.name || '未知'
})

const finalRegion = computed(() => {
  if (selectedCountry.value === 'UNKNOWN') {
    return '未知'
  }

  if (selectedCountry.value === 'CN') {
    const parts = ['中国']
    if (selectedProvince.value) {
      parts.push(selectedProvince.value)
    }
    if (selectedCity.value) {
      parts.push(selectedCity.value)
    }
    if (selectedDistrict.value) {
      parts.push(selectedDistrict.value)
    }
    return parts.join(' / ')
  }

  return selectedCountryName.value
})

watch(selectedCountry, (countryCode) => {
  if (countryCode !== 'CN') {
    selectedProvince.value = ''
    selectedCity.value = ''
    selectedDistrict.value = ''
  }
})

watch(selectedProvince, () => {
  selectedCity.value = ''
  selectedDistrict.value = ''
})

watch(selectedCity, () => {
  selectedDistrict.value = ''
})

function switchContactMethod(method) {
  contactMethod.value = method
  if (method === 'email') {
    form.value.phone = ''
    return
  }
  form.value.email = ''
}

function openBirthdayPicker(event) {
  const input = event?.target || birthdayInput.value
  if (input?.showPicker) {
    input.showPicker()
  }
}

const handleRegister = async () => {
  errorMessage.value = ''
  successMessage.value = ''

  if (!form.value.username) {
    errorMessage.value = '请输入用户名'
    return
  }
  if (!form.value.nickname) {
    errorMessage.value = '请输入昵称'
    return
  }
  if (contactMethod.value === 'email' && !form.value.email) {
    errorMessage.value = '请输入邮箱地址'
    return
  }
  if (contactMethod.value === 'phone' && !form.value.phone) {
    errorMessage.value = '请输入手机号'
    return
  }
  if (!form.value.password || form.value.password.length < 8) {
    errorMessage.value = '密码长度不能少于 8 位'
    return
  }
  if (!form.value.gender) {
    errorMessage.value = '请选择性别'
    return
  }
  if (!form.value.birthday) {
    errorMessage.value = '请选择生日'
    return
  }

  loading.value = true
  try {
    const result = await authStore.register({
      ...form.value,
      email: contactMethod.value === 'email' ? form.value.email : '',
      phone: contactMethod.value === 'phone' ? form.value.phone : '',
      region: finalRegion.value
    })

    if (!result.success) {
      errorMessage.value = result.message || '注册失败，请重试'
      return
    }

    successMessage.value = result.message || '注册成功，请登录'
    setTimeout(() => {
      router.push('/login')
    }, 1200)
  } catch (error) {
    errorMessage.value = error.message || '注册失败，请重试'
  } finally {
    loading.value = false
  }
}

const goBack = () => {
  router.push('/discover')
}
</script>

<style scoped>
* {
  box-sizing: border-box;
}

.auth-page {
  display: flex;
  width: 100%;
  min-height: 100vh;
}

/* 左侧品牌区 */
.auth-left {
  flex: 1;
  background: linear-gradient(135deg, #4338ca 0%, #7c3aed 50%, #db2777 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
}

.auth-left::before {
  content: '';
  position: absolute;
  width: 400px;
  height: 400px;
  border-radius: 50%;
  background: rgba(255,255,255,0.06);
  top: -100px;
  right: -100px;
}

.auth-left::after {
  content: '';
  position: absolute;
  width: 300px;
  height: 300px;
  border-radius: 50%;
  background: rgba(255,255,255,0.04);
  bottom: -80px;
  left: -60px;
}

.back-button {
  position: fixed;
  top: 24px;
  left: 24px;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: rgba(255,255,255,0.15);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255,255,255,0.2);
  border-radius: 8px;
  color: #fff;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
  z-index: 10;
}

.back-button:hover {
  background: rgba(255,255,255,0.25);
}

.brand-content {
  text-align: center;
  color: #fff;
  position: relative;
  z-index: 1;
  padding: 40px;
}

.brand-icon {
  width: 80px;
  height: 80px;
  background: rgba(255,255,255,0.15);
  border-radius: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 24px;
  backdrop-filter: blur(10px);
}

.brand-icon .iconify {
  font-size: 40px;
  color: #fff;
}

.brand-title {
  font-size: 42px;
  font-weight: 800;
  margin-bottom: 12px;
  letter-spacing: -1px;
}

.brand-desc {
  font-size: 16px;
  opacity: 0.85;
  margin-bottom: 32px;
  line-height: 1.6;
}

.brand-tags {
  display: flex;
  gap: 12px;
  justify-content: center;
  flex-wrap: wrap;
}

.brand-tags span {
  padding: 6px 16px;
  background: rgba(255,255,255,0.12);
  border-radius: 20px;
  font-size: 13px;
  backdrop-filter: blur(10px);
}

/* 右侧表单区 */
.auth-right {
  flex: 1;
  background: linear-gradient(135deg, #f5f3ff 0%, #ede9fe 50%, #fae8ff 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
}

.register-card {
  width: 100%;
  max-width: 520px;
  max-height: 90vh;
  overflow-y: auto;
  background: #fff;
  border-radius: 18px;
  padding: 40px;
  box-shadow: 0 4px 24px rgba(0,0,0,0.06);
}

.register-header {
  text-align: center;
  margin-bottom: 28px;
}

.brand-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 7px 14px;
  margin-bottom: 14px;
  border-radius: 999px;
  background: #f5f3ff;
  color: #5b21b6;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.04em;
}

.register-title {
  font-size: 32px;
  font-weight: 700;
  color: #111827;
  margin-bottom: 8px;
}

.register-subtitle {
  font-size: 14px;
  color: #475569;
}

.register-form {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.form-row {
  display: flex;
  gap: 16px;
}

.form-col {
  flex: 1;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-label {
  font-size: 14px;
  font-weight: 600;
  color: #1f2937;
}

.form-input {
  padding: 13px 16px;
  border: 1px solid #cbd5e1;
  border-radius: 14px;
  font-size: 14px;
  color: #111827;
  background: #ffffff;
  transition: border-color 0.2s, box-shadow 0.2s, opacity 0.2s, transform 0.2s;
}

.form-input:focus {
  outline: none;
  border-color: #4f46e5;
  box-shadow: 0 0 0 4px rgba(79, 70, 229, 0.1);
}

.form-input:disabled {
  background: #f8fafc;
  color: #94a3b8;
}

.form-input::placeholder {
  color: #94a3b8;
}

.form-hint {
  margin: 0;
  font-size: 12px;
  color: #64748b;
}

.contact-switch {
  position: relative;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  padding: 3px;
  background: #f1f5f9;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  overflow: hidden;
}

.contact-thumb {
  position: absolute;
  top: 3px;
  left: 3px;
  width: calc(50% - 3px);
  height: calc(100% - 6px);
  border-radius: 9px;
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.08);
  transition: transform 0.22s ease;
}

.contact-switch[data-mode='phone'] .contact-thumb {
  transform: translateX(100%);
}

.contact-option {
  position: relative;
  z-index: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-height: 40px;
  border: none;
  background: transparent;
  color: #64748b;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: color 0.2s;
}

.contact-option.active {
  color: #111827;
}

.contact-option .iconify {
  font-size: 15px;
}

.region-preview {
  min-height: 48px;
  display: flex;
  align-items: center;
  padding: 12px 16px;
  border-radius: 14px;
  background: #f8fafc;
  border: 1px dashed #cbd5e1;
  color: #0f172a;
  font-size: 14px;
  font-weight: 500;
  line-height: 1.5;
}

.error-message {
  padding: 12px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 14px;
  color: #b91c1c;
  font-size: 14px;
}

.success-message {
  padding: 12px;
  background: #ecfdf5;
  border: 1px solid #a7f3d0;
  border-radius: 14px;
  color: #047857;
  font-size: 14px;
}

.register-button {
  padding: 14px 18px;
  background: linear-gradient(135deg, #111827 0%, #1e293b 100%);
  color: #ffffff;
  border: none;
  border-radius: 14px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.register-button:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 14px 28px rgba(15, 23, 42, 0.16);
}

.register-button:disabled {
  background: #94a3b8;
  cursor: not-allowed;
}

.register-footer {
  text-align: center;
  margin-top: 8px;
  font-size: 14px;
  color: #475569;
}

.register-footer .link {
  color: #312e81;
  text-decoration: none;
  font-weight: 600;
  margin-left: 4px;
}

.register-footer .link:hover {
  text-decoration: underline;
}

@media (max-width: 768px) {
  .auth-left {
    display: none;
  }

  .auth-right {
    padding: 24px;
  }

  .register-card {
    padding: 24px 18px;
  }

  .form-row {
    flex-direction: column;
    gap: 18px;
  }
}
</style>
