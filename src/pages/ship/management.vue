<route lang="jsonc">
{
  "style": {
    "navigationStyle": "custom",
    "navigationBarTitleText": "综合管理"
  }
}
</route>

<script lang="ts" setup>
defineOptions({
  name: 'ShipManagement',
})

// 获取屏幕边界到安全区域距离
let safeAreaInsets: any
let systemInfo: any

// #ifdef MP-WEIXIN
systemInfo = uni.getWindowInfo()
safeAreaInsets = systemInfo.safeArea
  ? {
      top: systemInfo.safeArea.top,
      right: systemInfo.windowWidth - systemInfo.safeArea.right,
      bottom: systemInfo.windowHeight - systemInfo.safeArea.bottom,
      left: systemInfo.safeArea.left,
    }
  : null
// #endif

// #ifndef MP-WEIXIN
systemInfo = uni.getSystemInfoSync()
safeAreaInsets = systemInfo.safeAreaInsets
// #endif

// 船只列表数据
const shipList = ref([
  { id: 1, name: '海巡001', status: 'online', battery: 85, location: '福建海域A区' },
  { id: 2, name: '海巡002', status: 'online', battery: 72, location: '福建海域B区' },
  { id: 3, name: '海巡003', status: 'warning', battery: 23, location: '福建海域C区' },
  { id: 4, name: '海巡004', status: 'offline', battery: 0, location: '维护中' },
])

// 人员管理数据
const crewList = ref([
  { id: 1, name: '张船长', role: '船长', status: 'online', avatar: 'Z' },
  { id: 2, name: '李工程师', role: '工程师', status: 'online', avatar: 'L' },
  { id: 3, name: '王技师', role: '技师', status: 'offline', avatar: 'W' },
  { id: 4, name: '陈操作员', role: '操作员', status: 'online', avatar: 'C' },
])

// 系统设置数据
const systemSettings = ref({
  autoMode: true,
  nightMode: false,
  alertSound: true,
  dataSync: true,
})

// 获取状态样式类
function getStatusClass(status: string) {
  switch (status) {
    case 'online': return 'status-online'
    case 'warning': return 'status-warning'
    case 'offline': return 'status-offline'
    default: return 'status-offline'
  }
}

// 获取电池状态样式
function getBatteryClass(battery: number) {
  if (battery > 50)
    return 'good'
  if (battery > 20)
    return 'warning'
  return 'critical'
}

// 船只管理操作
function handleShipAction(ship: any, action: string) {
  switch (action) {
    case 'control':
      uni.navigateTo({
        url: `/pages/ship/manual?shipId=${ship.id}`,
      })
      break
    case 'track':
      uni.showToast({ title: `正在追踪${ship.name}`, icon: 'success' })
      break
    case 'maintenance':
      uni.showModal({
        title: '维护确认',
        content: `确定要对${ship.name}进行维护吗？`,
        success: (res) => {
          if (res.confirm) {
            uni.showToast({ title: '维护模式已启动', icon: 'success' })
          }
        },
      })
      break
  }
}

// 人员管理操作
function handleCrewAction(crew: any, action: string) {
  switch (action) {
    case 'contact':
      uni.showToast({ title: `正在联系${crew.name}`, icon: 'success' })
      break
    case 'assign':
      uni.showToast({ title: `${crew.name}任务已分配`, icon: 'success' })
      break
  }
}

// 系统设置切换
function toggleSetting(key: string) {
  systemSettings.value[key] = !systemSettings.value[key]
  uni.showToast({
    title: `${key}已${systemSettings.value[key] ? '开启' : '关闭'}`,
    icon: 'success',
  })
}

// 返回主控台
function goBack() {
  uni.navigateBack()
}

onLoad(() => {
  console.log('综合管理页面加载')
})
</script>

<template>
  <view class="management-container" :style="{ paddingTop: `${safeAreaInsets?.top || 0}px` }">
    <!-- 顶部状态栏 -->
    <view class="status-bar">
      <view class="status-left">
        <button class="back-button" @click="goBack">
          <text class="back-icon">
            ←
          </text>
        </button>
        <view class="title-section">
          <text class="management-icon">
            ⚙️
          </text>
          <text class="title">
            综合管理中心
          </text>
        </view>
      </view>

      <view class="system-status">
        <text class="status-text">
          系统运行正常
        </text>
        <view class="status-dot online" />
      </view>
    </view>

    <!-- 主要内容区域 -->
    <scroll-view class="content-area" scroll-y>
      <!-- 船只管理 -->
      <view class="section">
        <view class="section-header">
          <text class="section-icon">
            🚢
          </text>
          <text class="section-title">
            船只管理
          </text>
        </view>

        <view class="ship-grid">
          <view
            v-for="ship in shipList"
            :key="ship.id"
            class="ship-card"
          >
            <view class="ship-header">
              <view class="ship-thumbnail">
                <text class="ship-icon">
                  🚢
                </text>
              </view>
              <view class="ship-info">
                <text class="ship-name">
                  {{ ship.name }}
                </text>
                <text class="ship-location">
                  {{ ship.location }}
                </text>
              </view>
              <view class="ship-status">
                <view class="status-indicator" :class="getStatusClass(ship.status)" />
              </view>
            </view>

            <view class="ship-details">
              <view class="detail-item">
                <text class="detail-label">
                  电量:
                </text>
                <text class="detail-value" :class="getBatteryClass(ship.battery)">
                  {{ ship.battery }}%
                </text>
              </view>
              <view class="detail-item">
                <text class="detail-label">
                  状态:
                </text>
                <text class="detail-value">
                  {{ ship.status === 'online' ? '在线' : ship.status === 'warning' ? '警告' : '离线' }}
                </text>
              </view>
            </view>

            <view class="ship-actions">
              <button
                class="action-btn control"
                :disabled="ship.status === 'offline'"
                @click="handleShipAction(ship, 'control')"
              >
                <text class="btn-icon">
                  🎮
                </text>
              </button>
              <button
                class="action-btn track"
                @click="handleShipAction(ship, 'track')"
              >
                <text class="btn-icon">
                  📍
                </text>
              </button>
              <button
                class="action-btn maintenance"
                @click="handleShipAction(ship, 'maintenance')"
              >
                <text class="btn-icon">
                  🔧
                </text>
              </button>
            </view>
          </view>
        </view>
      </view>

      <!-- 人员管理 -->
      <view class="section">
        <view class="section-header">
          <text class="section-icon">
            👥
          </text>
          <text class="section-title">
            人员管理
          </text>
        </view>

        <view class="crew-list">
          <view
            v-for="crew in crewList"
            :key="crew.id"
            class="crew-item"
          >
            <view class="crew-avatar">
              <text class="avatar-text">
                {{ crew.avatar }}
              </text>
            </view>
            <view class="crew-info">
              <text class="crew-name">
                {{ crew.name }}
              </text>
              <text class="crew-role">
                {{ crew.role }}
              </text>
            </view>
            <view class="crew-status">
              <view class="status-indicator" :class="getStatusClass(crew.status)" />
              <text class="status-text">
                {{ crew.status === 'online' ? '在线' : '离线' }}
              </text>
            </view>
            <view class="crew-actions">
              <button
                class="action-btn-small contact"
                @click="handleCrewAction(crew, 'contact')"
              >
                <text class="btn-icon">
                  📞
                </text>
              </button>
              <button
                class="action-btn-small assign"
                @click="handleCrewAction(crew, 'assign')"
              >
                <text class="btn-icon">
                  📋
                </text>
              </button>
            </view>
          </view>
        </view>
      </view>

      <!-- 系统设置 -->
      <view class="section">
        <view class="section-header">
          <text class="section-icon">
            ⚙️
          </text>
          <text class="section-title">
            系统设置
          </text>
        </view>

        <view class="settings-list">
          <view class="setting-item">
            <view class="setting-info">
              <text class="setting-name">
                自动模式
              </text>
              <text class="setting-desc">
                启用智能自动控制
              </text>
            </view>
            <switch
              :checked="systemSettings.autoMode"
              color="#4FD1C7"
              @change="toggleSetting('autoMode')"
            />
          </view>

          <view class="setting-item">
            <view class="setting-info">
              <text class="setting-name">
                夜间模式
              </text>
              <text class="setting-desc">
                降低屏幕亮度保护视力
              </text>
            </view>
            <switch
              :checked="systemSettings.nightMode"
              color="#4FD1C7"
              @change="toggleSetting('nightMode')"
            />
          </view>

          <view class="setting-item">
            <view class="setting-info">
              <text class="setting-name">
                警报声音
              </text>
              <text class="setting-desc">
                启用声音警报提醒
              </text>
            </view>
            <switch
              :checked="systemSettings.alertSound"
              color="#4FD1C7"
              @change="toggleSetting('alertSound')"
            />
          </view>

          <view class="setting-item">
            <view class="setting-info">
              <text class="setting-name">
                数据同步
              </text>
              <text class="setting-desc">
                自动同步到云端服务器
              </text>
            </view>
            <switch
              :checked="systemSettings.dataSync"
              color="#4FD1C7"
              @change="toggleSetting('dataSync')"
            />
          </view>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<style lang="scss" scoped>
.management-container {
  width: 100vw;
  height: 100vh;
  background: linear-gradient(135deg, #0b1426 0%, #1a365d 50%, #2563eb 100%);
  display: flex;
  flex-direction: column;
}

.status-bar {
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(10px);
  padding: 16rpx 32rpx;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 2rpx solid rgba(255, 255, 255, 0.2);
  z-index: 1000;
}

.status-left {
  display: flex;
  align-items: center;
  gap: 24rpx;
}

.back-button {
  background: none;
  border: none;
  padding: 8rpx;
  color: white;
  font-size: 32rpx;
}

.back-icon {
  color: white;
  font-size: 32rpx;
}

.title-section {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.management-icon {
  color: #4fd1c7;
  font-size: 28rpx;
}

.title {
  color: white;
  font-size: 28rpx;
  font-weight: 600;
}

.system-status {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.status-text {
  color: white;
  font-size: 24rpx;
}

.status-dot {
  width: 16rpx;
  height: 16rpx;
  border-radius: 50%;

  &.online {
    background: #10b981;
    animation: pulse 2s infinite;
  }
}

.content-area {
  flex: 1;
  // padding: 32rpx;
}

.section {
  margin-bottom: 48rpx;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 16rpx;
  margin-bottom: 32rpx;
}

.section-icon {
  font-size: 32rpx;
}

.section-title {
  color: white;
  font-size: 32rpx;
  font-weight: 600;
}

.ship-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24rpx;
}

.ship-card {
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(15px);
  border: 2rpx solid rgba(255, 255, 255, 0.2);
  border-radius: 16rpx;
  padding: 24rpx;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(0, 0, 0, 0.7);
    border-color: rgba(79, 209, 199, 0.5);
    transform: translateY(-4rpx);
  }
}

.ship-header {
  display: flex;
  align-items: center;
  gap: 16rpx;
  margin-bottom: 16rpx;
}

.ship-thumbnail {
  width: 60rpx;
  height: 40rpx;
  border-radius: 8rpx;
  background: linear-gradient(135deg, #1e40af, #3b82f6);
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2rpx solid rgba(255, 255, 255, 0.2);
}

.ship-icon {
  color: white;
  font-size: 20rpx;
}

.ship-info {
  flex: 1;
}

.ship-name {
  display: block;
  color: white;
  font-size: 28rpx;
  font-weight: 600;
  margin-bottom: 4rpx;
}

.ship-location {
  display: block;
  color: rgba(255, 255, 255, 0.6);
  font-size: 20rpx;
}

.ship-status {
  display: flex;
  align-items: center;
}

.status-indicator {
  width: 16rpx;
  height: 16rpx;
  border-radius: 50%;

  &.status-online {
    background: #10b981;
    animation: pulse 2s infinite;
  }

  &.status-warning {
    background: #f59e0b;
    animation: pulse 2s infinite;
  }

  &.status-offline {
    background: #6b7280;
  }
}

.ship-details {
  display: flex;
  justify-content: space-between;
  margin-bottom: 16rpx;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 4rpx;
}

.detail-label {
  color: rgba(255, 255, 255, 0.6);
  font-size: 20rpx;
}

.detail-value {
  color: white;
  font-size: 24rpx;
  font-weight: 600;

  &.critical {
    color: #ef4444;
  }

  &.warning {
    color: #f59e0b;
  }

  &.good {
    color: #10b981;
  }
}

.ship-actions {
  display: flex;
  gap: 12rpx;
}

.action-btn {
  width: 60rpx;
  height: 60rpx;
  border-radius: 12rpx;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(15px);
  border: 2rpx solid rgba(255, 255, 255, 0.2);
  transition: all 0.3s ease;

  &.control {
    background: linear-gradient(135deg, #3b82f6, #2563eb);
  }

  &.track {
    background: linear-gradient(135deg, #10b981, #059669);
  }

  &.maintenance {
    background: linear-gradient(135deg, #f59e0b, #d97706);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &:active {
    transform: scale(0.95);
  }
}

.btn-icon {
  color: white;
  font-size: 24rpx;
}

.crew-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.crew-item {
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(15px);
  border: 2rpx solid rgba(255, 255, 255, 0.2);
  border-radius: 16rpx;
  padding: 24rpx;
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.crew-avatar {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  background: linear-gradient(135deg, #4fd1c7, #10b981);
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar-text {
  color: white;
  font-size: 32rpx;
  font-weight: bold;
}

.crew-info {
  flex: 1;
}

.crew-name {
  display: block;
  color: white;
  font-size: 28rpx;
  font-weight: 600;
  margin-bottom: 4rpx;
}

.crew-role {
  display: block;
  color: rgba(255, 255, 255, 0.6);
  font-size: 20rpx;
}

.crew-status {
  display: flex;
  align-items: center;
  gap: 8rpx;
  margin-right: 16rpx;
}

.crew-actions {
  display: flex;
  gap: 8rpx;
}

.action-btn-small {
  width: 48rpx;
  height: 48rpx;
  border-radius: 8rpx;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(15px);
  border: 2rpx solid rgba(255, 255, 255, 0.2);
  transition: all 0.3s ease;

  &.contact {
    background: linear-gradient(135deg, #10b981, #059669);
  }

  &.assign {
    background: linear-gradient(135deg, #3b82f6, #2563eb);
  }

  &:active {
    transform: scale(0.95);
  }
}

.settings-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.setting-item {
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(15px);
  border: 2rpx solid rgba(255, 255, 255, 0.2);
  border-radius: 16rpx;
  padding: 24rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.setting-info {
  flex: 1;
}

.setting-name {
  display: block;
  color: white;
  font-size: 28rpx;
  font-weight: 600;
  margin-bottom: 4rpx;
}

.setting-desc {
  display: block;
  color: rgba(255, 255, 255, 0.6);
  font-size: 20rpx;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.6;
  }
}
</style>
