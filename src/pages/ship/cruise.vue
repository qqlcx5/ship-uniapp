<route lang="jsonc">
{
  "style": {
    "navigationStyle": "custom",
    "navigationBarTitleText": "自动巡航"
  }
}
</route>

<script lang="ts" setup>
defineOptions({
  name: 'ShipCruise',
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

// 当前活跃的菜单项
const activeMenu = ref('cruise')

// 巡航状态
const cruiseStatus = ref({
  isAutoMode: false,
  currentSpeed: 8.5,
  targetSpeed: 12.0,
  totalDistance: 12.5,
  estimatedRange: 45.2,
})

// 高级设置面板显示状态
const showAdvancedSettings = ref(false)

// 地图中心点（福建海域）
const mapCenter = ref({
  latitude: 26.0614,
  longitude: 119.3061,
})

// 船只数据（单条船）
const ship = ref({
  id: 1,
  name: '海巡001',
  latitude: 26.0614,
  longitude: 119.3061,
  heading: 45,
  status: 'active',
})

// 航点数据
const waypoints = ref([
  { id: 1, latitude: 26.0614, longitude: 119.3061, name: '起点' },
  { id: 2, latitude: 26.0624, longitude: 119.3071, name: '航点1' },
])

// 船舶运行状态数据
const shipStatus = ref({
  speed: 8.5,
  battery: 76,
  power: 850,
  current: 12.3,
  voltage: 24.8,
  alerts: ['自动模式待机', '航线规划中'],
})

// 菜单项配置
const menuItems = [
  { id: 'manual', icon: '🎮', label: '手动导航', page: '/pages/ship/manual' },
  { id: 'cruise', icon: '🗺️', label: '自动巡航', page: '/pages/ship/cruise' },
  { id: 'ai', icon: '🧠', label: 'AI管理', page: '/pages/ship/ai' },
  { id: 'management', icon: '⚙️', label: '综合管理', page: '/pages/ship/management' },
]

// 控制按钮处理
function toggleAutoMode() {
  cruiseStatus.value.isAutoMode = !cruiseStatus.value.isAutoMode
  const status = cruiseStatus.value.isAutoMode ? '启动' : '停止'
  uni.showToast({
    title: `自动模式${status}`,
    icon: 'success',
  })

  // 更新船舶状态
  if (cruiseStatus.value.isAutoMode) {
    shipStatus.value.alerts = ['自动模式运行中', '按航线执行']
  }
  else {
    shipStatus.value.alerts = ['自动模式待机', '航线规划中']
  }
}

function addWaypoint() {
  const newId = waypoints.value.length + 1
  waypoints.value.push({
    id: newId,
    latitude: mapCenter.value.latitude + (Math.random() - 0.5) * 0.02,
    longitude: mapCenter.value.longitude + (Math.random() - 0.5) * 0.02,
    name: `航点${newId - 1}`,
  })
  updateEstimatedRange()
  uni.showToast({ title: '航点已添加', icon: 'success' })
}

function removeWaypoint() {
  if (waypoints.value.length > 2) {
    waypoints.value.pop()
    updateEstimatedRange()
    uni.showToast({ title: '航点已删除', icon: 'success' })
  }
  else {
    uni.showToast({ title: '至少需要2个航点', icon: 'none' })
  }
}

function toggleAdvancedSettings() {
  showAdvancedSettings.value = !showAdvancedSettings.value
}

function handleAdvancedAction(action: string) {
  switch (action) {
    case 'clearAll':
      uni.showModal({
        title: '确认删除',
        content: '确定要删除所有路径吗？',
        success: (res) => {
          if (res.confirm) {
            waypoints.value = waypoints.value.slice(0, 2) // 保留起点和终点
            updateEstimatedRange()
            uni.showToast({ title: '路径已清除', icon: 'success' })
          }
        },
      })
      break
    case 'setServoZero':
      uni.showToast({ title: '舵机零点已设置', icon: 'success' })
      break
    case 'calibrateCompass':
      uni.showToast({ title: '磁力计标定完成', icon: 'success' })
      break
    case 'toggleAccelerometer':
      uni.showToast({ title: '加速度计状态已切换', icon: 'success' })
      break
  }
}

// 速度控制
function adjustSpeed(type: string) {
  if (type === 'increase' && cruiseStatus.value.targetSpeed < 20) {
    cruiseStatus.value.targetSpeed += 0.5
  }
  else if (type === 'decrease' && cruiseStatus.value.targetSpeed > 2) {
    cruiseStatus.value.targetSpeed -= 0.5
  }
  updateEstimatedRange()
  uni.showToast({
    title: `目标速度: ${cruiseStatus.value.targetSpeed}节`,
    icon: 'none',
  })
}

// 更新预计续航里程
function updateEstimatedRange() {
  // 根据当前电量和速度计算预计续航里程
  const batteryFactor = shipStatus.value.battery / 100
  const speedFactor = cruiseStatus.value.targetSpeed / 10
  cruiseStatus.value.estimatedRange = Math.round((batteryFactor * 60 / speedFactor) * 10) / 10
}

// 地图点击添加航点
function handleMapTap(e: any) {
  if (!cruiseStatus.value.isAutoMode) {
    const { latitude, longitude } = e.detail
    const newId = waypoints.value.length + 1
    waypoints.value.push({
      id: newId,
      latitude,
      longitude,
      name: `航点${newId - 1}`,
    })
    updateEstimatedRange()
    uni.showToast({ title: '航点已添加', icon: 'success' })
  }
}

// 地图标记点击处理
function handleMarkerTap(e: any) {
  const markerId = e.detail.markerId
  if (markerId === ship.value.id) {
    uni.showModal({
      title: ship.value.name,
      content: `位置: ${ship.value.latitude.toFixed(4)}, ${ship.value.longitude.toFixed(4)}\n航向: ${ship.value.heading}°\n状态: ${ship.value.status === 'active' ? '活跃' : '待机'}`,
      showCancel: false,
    })
  }
  else {
    const waypoint = waypoints.value.find(w => w.id === markerId)
    if (waypoint) {
      uni.showModal({
        title: waypoint.name,
        content: `位置: ${waypoint.latitude.toFixed(4)}, ${waypoint.longitude.toFixed(4)}`,
        showCancel: false,
      })
    }
  }
}

// 菜单点击处理
function handleMenuClick(item: any) {
  if (item.id === activeMenu.value)
    return

  activeMenu.value = item.id
  uni.navigateTo({
    url: item.page,
  })
}

onLoad(() => {
  console.log('自动巡航页面加载')
})
</script>

<template>
  <view class="cruise-container" :style="{ paddingTop: `${safeAreaInsets?.top || 0}px` }">
    <!-- 船舶状态信息面板 -->
    <view class="status-panel">
      <view class="status-section">
        <view class="status-title">
          <text class="status-icon">
            🚢
          </text>
          <text class="title-text">
            船舶状态
          </text>
        </view>
        <view class="status-grid">
          <view class="status-item">
            <text class="label">
              时速:
            </text>
            <text class="value">
              {{ shipStatus.speed }}节
            </text>
          </view>
          <view class="status-item">
            <text class="label">
              电量:
            </text>
            <text class="value" :class="{ warning: shipStatus.battery < 30 }">
              {{ shipStatus.battery }}%
            </text>
          </view>
          <view class="status-item">
            <text class="label">
              功率:
            </text>
            <text class="value">
              {{ shipStatus.power }}W
            </text>
          </view>
          <view class="status-item">
            <text class="label">
              电流:
            </text>
            <text class="value">
              {{ shipStatus.current }}A
            </text>
          </view>
          <view class="status-item">
            <text class="label">
              电压:
            </text>
            <text class="value">
              {{ shipStatus.voltage }}V
            </text>
          </view>
          <view class="status-item">
            <text class="label">
              预计续航:
            </text>
            <text class="value">
              {{ cruiseStatus.estimatedRange }}km
            </text>
          </view>
        </view>

        <!-- 重要报警数据 -->
        <view class="alerts-section">
          <text
            v-for="(alert, index) in shipStatus.alerts"
            :key="index"
            class="alert-item"
          >
            {{ alert }}
          </text>
        </view>
      </view>
    </view>

    <!-- 左上角控制面板 -->
    <view class="control-panel">
      <view class="control-buttons">
        <button
          class="control-btn auto-mode"
          :class="{ active: cruiseStatus.isAutoMode }"
          @click="toggleAutoMode"
        >
          <text class="btn-icon">
            🤖
          </text>
        </button>

        <button class="control-btn add" @click="addWaypoint">
          <text class="btn-icon">
            ➕
          </text>
        </button>

        <button class="control-btn remove" @click="removeWaypoint">
          <text class="btn-icon">
            ➖
          </text>
        </button>

        <button
          class="control-btn settings"
          :class="{ active: showAdvancedSettings }"
          @click="toggleAdvancedSettings"
        >
          <text class="btn-icon">
            ⚙️
          </text>
        </button>
      </view>

      <!-- 速度控制 -->
      <view class="speed-control">
        <view class="speed-title">
          目标速度
        </view>
        <view class="speed-buttons">
          <button class="speed-btn decrease" @click="adjustSpeed('decrease')">
            <text class="btn-icon">
              ➖
            </text>
          </button>
          <text class="speed-value">
            {{ cruiseStatus.targetSpeed }}节
          </text>
          <button class="speed-btn increase" @click="adjustSpeed('increase')">
            <text class="btn-icon">
              ➕
            </text>
          </button>
        </view>
      </view>
    </view>

    <!-- 右侧高级设置面板 -->
    <view v-if="showAdvancedSettings" class="advanced-panel">
      <button
        class="advanced-btn clear"
        @click="handleAdvancedAction('clearAll')"
      >
        <text class="btn-icon">
          🗑️
        </text>
        <text class="btn-text">
          删除所有路径
        </text>
      </button>

      <button
        class="advanced-btn servo"
        @click="handleAdvancedAction('setServoZero')"
      >
        <text class="btn-icon">
          🎯
        </text>
        <text class="btn-text">
          设置舵机零点
        </text>
      </button>

      <button
        class="advanced-btn compass"
        @click="handleAdvancedAction('calibrateCompass')"
      >
        <text class="btn-icon">
          🧭
        </text>
        <text class="btn-text">
          标定磁力计
        </text>
      </button>

      <button
        class="advanced-btn accelerometer"
        @click="handleAdvancedAction('toggleAccelerometer')"
      >
        <text class="btn-icon">
          ⚖️
        </text>
        <text class="btn-text">
          加速度计开关
        </text>
      </button>
    </view>

    <!-- 地图区域 -->
    <view class="map-container">
      <map
        id="cruiseMap"
        class="map"
        :latitude="mapCenter.latitude"
        :longitude="mapCenter.longitude"
        :scale="12"
        show-location
        :markers="[
          // 船只标记
          {
            id: ship.id,
            latitude: ship.latitude,
            longitude: ship.longitude,
            iconPath: '/static/images/ship-icon.png',
            width: 40,
            height: 40,
            title: ship.name,
            callout: {
              content: `${ship.name}\n航向: ${ship.heading}°`,
              color: '#ffffff',
              fontSize: 12,
              borderRadius: 8,
              bgColor: 'rgba(0,0,0,0.8)',
              padding: 8,
              display: 'ALWAYS',
            },
          },
          // 航点标记
          ...waypoints.map((waypoint, index) => ({
            id: waypoint.id + 100, // 避免与船只ID冲突
            latitude: waypoint.latitude,
            longitude: waypoint.longitude,
            iconPath: index === 0 ? '/static/images/start-point.png'
              : index === waypoints.length - 1 ? '/static/images/end-point.png'
                : '/static/images/waypoint.png',
            width: 30,
            height: 30,
            title: waypoint.name,
          })),
        ]"
        :polyline="waypoints.length > 1 ? [{
          points: waypoints.map(w => ({ latitude: w.latitude, longitude: w.longitude })),
          color: '#4FD1C7',
          width: 4,
          dottedLine: true,
        }] : []"
        @markertap="handleMarkerTap"
        @tap="handleMapTap"
      />
    </view>

    <!-- 底部菜单栏 -->
    <view class="bottom-menu">
      <view class="menu-container">
        <view
          v-for="item in menuItems"
          :key="item.id"
          class="menu-item"
          :class="{ active: activeMenu === item.id }"
          @click="handleMenuClick(item)"
        >
          <text class="menu-icon">
            {{ item.icon }}
          </text>
          <text class="menu-label">
            {{ item.label }}
          </text>
        </view>
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.cruise-container {
  width: 100vw;
  height: 100vh;
  background: #0b1426;
  position: relative;
  overflow: hidden;
}

.status-panel {
  position: absolute;
  top: 32rpx;
  left: 32rpx;
  z-index: 1000;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(15px);
  border-radius: 16rpx;
  padding: 24rpx;
  border: 2rpx solid rgba(255, 255, 255, 0.2);
  max-width: 400rpx;
}

.status-title {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-bottom: 16rpx;
}

.status-icon {
  font-size: 24rpx;
}

.title-text {
  color: white;
  font-size: 24rpx;
  font-weight: 600;
}

.status-grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 12rpx;
  margin-bottom: 16rpx;
}

.status-item {
  display: flex;
  flex-direction: column;
  gap: 4rpx;
}

.label {
  color: rgba(255, 255, 255, 0.7);
  font-size: 18rpx;
}

.value {
  color: #4fd1c7;
  font-size: 20rpx;
  font-weight: 600;
  font-family: monospace;

  &.warning {
    color: #f59e0b;
  }
}

.alerts-section {
  padding-top: 16rpx;
  border-top: 2rpx solid rgba(255, 255, 255, 0.1);
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.alert-item {
  color: #10b981;
  font-size: 18rpx;
  padding: 4rpx 8rpx;
  background: rgba(16, 185, 129, 0.1);
  border-radius: 8rpx;
  border: 1rpx solid rgba(16, 185, 129, 0.3);
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

.route-icon {
  color: #4fd1c7;
  font-size: 28rpx;
}

.title {
  color: white;
  font-size: 28rpx;
  font-weight: 600;
}

.cruise-status {
  display: flex;
  align-items: center;
  gap: 8rpx;
}

.status-dot {
  width: 12rpx;
  height: 12rpx;
  background: #6b7280;
  border-radius: 50%;
  transition: all 0.3s ease;

  &.active {
    background: #10b981;
    animation: pulse 2s infinite;
  }
}

.status-text {
  color: rgba(255, 255, 255, 0.7);
  font-size: 20rpx;
}

.route-info {
  display: flex;
  flex-direction: column;
  gap: 4rpx;
}

.info-text {
  color: white;
  font-size: 20rpx;
}

.control-panel {
  position: absolute;
  bottom: 120rpx;
  left: 32rpx;
  z-index: 1000;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(15px);
  border-radius: 24rpx;
  padding: 24rpx;
  border: 2rpx solid rgba(255, 255, 255, 0.2);
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.control-buttons {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.control-btn {
  width: 88rpx;
  height: 88rpx;
  border-radius: 24rpx;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(15px);
  border: 4rpx solid rgba(255, 255, 255, 0.2);
  transition: all 0.3s ease;

  &.power {
    background: linear-gradient(135deg, #10b981, #059669);

    &.active {
      background: linear-gradient(135deg, #ef4444, #dc2626);
      box-shadow: 0 0 20rpx rgba(239, 68, 68, 0.5);
    }
  }

  &.add {
    background: linear-gradient(135deg, #4fd1c7, #2dd4bf);
  }

  &.remove {
    background: linear-gradient(135deg, #ef4444, #dc2626);
  }

  &.settings {
    background: linear-gradient(135deg, #8b5cf6, #7c3aed);

    &.active {
      box-shadow: 0 0 20rpx rgba(139, 92, 246, 0.5);
    }
  }

  &:active {
    transform: scale(0.95);
  }
}

.btn-icon {
  color: white;
  font-size: 32rpx;
}

.advanced-panel {
  position: absolute;
  top: 120rpx;
  right: 32rpx;
  z-index: 100;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(10px);
  border-radius: 24rpx;
  padding: 24rpx;
  border: 2rpx solid rgba(255, 255, 255, 0.2);
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.advanced-btn {
  width: 288rpx;
  height: 80rpx;
  border-radius: 16rpx;
  border: none;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  padding: 0 24rpx;
  gap: 16rpx;
  backdrop-filter: blur(15px);
  border: 2rpx solid rgba(255, 255, 255, 0.2);
  transition: all 0.3s ease;

  &.clear {
    background: linear-gradient(135deg, #ef4444, #dc2626);
  }

  &.servo {
    background: linear-gradient(135deg, #f59e0b, #d97706);
  }

  &.compass {
    background: linear-gradient(135deg, #3b82f6, #2563eb);
  }

  &.accelerometer {
    background: linear-gradient(135deg, #10b981, #059669);
  }

  &:active {
    transform: scale(0.98);
  }
}

.btn-text {
  color: white;
  font-size: 24rpx;
  font-weight: 500;
}

.map-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
}

.map {
  width: 100%;
  height: 100%;
}

.bottom-menu {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(0, 0, 0, 0.9);
  backdrop-filter: blur(15px);
  border-top: 2rpx solid rgba(255, 255, 255, 0.2);
  padding: 16rpx 0;
  z-index: 1000;
}

.menu-container {
  display: flex;
  justify-content: space-around;
  align-items: center;
}

.menu-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 16rpx 24rpx;
  border-radius: 12rpx;
  transition: all 0.3s ease;
  cursor: pointer;

  &.active {
    background: rgba(79, 209, 199, 0.2);

    .menu-icon,
    .menu-label {
      color: #4fd1c7;
    }
  }

  &:hover {
    background: rgba(79, 209, 199, 0.1);
  }
}

.menu-icon {
  font-size: 32rpx;
  margin-bottom: 8rpx;
  color: rgba(255, 255, 255, 0.7);
  transition: color 0.3s ease;
}

.menu-label {
  font-size: 20rpx;
  color: rgba(255, 255, 255, 0.7);
  font-weight: 500;
  transition: color 0.3s ease;
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
