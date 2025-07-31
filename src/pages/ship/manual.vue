<route lang="jsonc">
{
  "style": {
    "navigationStyle": "custom",
    "navigationBarTitleText": "手动导航"
  }
}
</route>

<script lang="ts" setup>
defineOptions({
  name: 'ShipManual',
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
const activeMenu = ref('manual')

// 摇杆控制状态
const joystickPosition = ref({ x: 0, y: 0 })
const isDragging = ref(false)

// 天气和海况数据
const weatherData = ref({
  temperature: 24,
  windSpeed: 12,
  waveHeight: 1.2,
  visibility: 8.5,
  weather: '多云'
})

// 船舶运行状态数据
const shipStatus = ref({
  speed: 8.5,
  battery: 76,
  power: 850,
  current: 12.3,
  voltage: 24.8,
  alerts: ['GPS信号良好', '电池状态正常']
})

// 地图中心点（福建海域）
const mapCenter = ref({
  latitude: 26.0614,
  longitude: 119.3061
})

// 船只数据（6-7条船）
const ships = ref([
  {
    id: 1,
    name: '海巡001',
    latitude: 26.0614,
    longitude: 119.3061,
    heading: 45,
    status: 'active'
  },
  {
    id: 2,
    name: '海巡002',
    latitude: 26.0724,
    longitude: 119.3171,
    heading: 120,
    status: 'active'
  },
  {
    id: 3,
    name: '海巡003',
    latitude: 26.0504,
    longitude: 119.2951,
    heading: 270,
    status: 'active'
  },
  {
    id: 4,
    name: '海巡004',
    latitude: 26.0814,
    longitude: 119.3261,
    heading: 180,
    status: 'active'
  },
  {
    id: 5,
    name: '海巡005',
    latitude: 26.0414,
    longitude: 119.2861,
    heading: 90,
    status: 'active'
  },
  {
    id: 6,
    name: '海巡006',
    latitude: 26.0914,
    longitude: 119.3461,
    heading: 315,
    status: 'active'
  },
  {
    id: 7,
    name: '海巡007',
    latitude: 26.0314,
    longitude: 119.2761,
    heading: 225,
    status: 'standby'
  }
])

// 菜单项配置
const menuItems = [
  { id: 'manual', icon: '🎮', label: '手动导航', page: '/pages/ship/manual' },
  { id: 'cruise', icon: '🗺️', label: '自动巡航', page: '/pages/ship/cruise' },
  { id: 'ai', icon: '🧠', label: 'AI管理', page: '/pages/ship/ai' },
  { id: 'management', icon: '⚙️', label: '综合管理', page: '/pages/ship/management' }
]

// 摇杆控制处理
function handleJoystickStart(e: any) {
  isDragging.value = true
}

function handleJoystickMove(e: any) {
  if (!isDragging.value) return

  const touch = e.touches[0]
  const container = e.currentTarget
  const rect = container.getBoundingClientRect()
  const centerX = rect.width / 2
  const centerY = rect.height / 2
  const maxRadius = rect.width / 2 - 25 // 减去手柄半径

  const deltaX = touch.clientX - rect.left - centerX
  const deltaY = touch.clientY - rect.top - centerY
  const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)

  if (distance <= maxRadius) {
    joystickPosition.value = {
      x: Math.round((deltaX / maxRadius) * 100),
      y: Math.round((-deltaY / maxRadius) * 100) // 反转Y轴
    }
  } else {
    const angle = Math.atan2(deltaY, deltaX)
    joystickPosition.value = {
      x: Math.round(Math.cos(angle) * 100),
      y: Math.round(-Math.sin(angle) * 100) // 反转Y轴
    }
  }

  // 实时更新船舶状态
  updateShipStatus()
}

function handleJoystickEnd() {
  isDragging.value = false
  joystickPosition.value = { x: 0, y: 0 }
}

// 更新船舶状态
function updateShipStatus() {
  // 模拟根据摇杆位置更新船舶状态
  const intensity = Math.sqrt(joystickPosition.value.x ** 2 + joystickPosition.value.y ** 2) / 100
  shipStatus.value.speed = Math.round((8.5 + intensity * 5) * 10) / 10
  shipStatus.value.power = Math.round(850 + intensity * 200)
  shipStatus.value.current = Math.round((12.3 + intensity * 3) * 10) / 10
}

// 菜单点击处理
function handleMenuClick(item: any) {
  if (item.id === activeMenu.value) return

  activeMenu.value = item.id
  uni.navigateTo({
    url: item.page
  })
}

// 地图标记点击处理
function handleMarkerTap(e: any) {
  const markerId = e.detail.markerId
  const ship = ships.value.find(s => s.id === markerId)
  if (ship) {
    uni.showModal({
      title: ship.name,
      content: `位置: ${ship.latitude.toFixed(4)}, ${ship.longitude.toFixed(4)}\n航向: ${ship.heading}°\n状态: ${ship.status === 'active' ? '活跃' : '待机'}`,
      showCancel: false
    })
  }
}

onLoad(() => {
  console.log('手动导航页面加载')
})
</script>

<template>
  <view class="manual-container" :style="{ paddingTop: `${safeAreaInsets?.top || 0}px` }">
    <!-- 右上角天气和船舶状态信息 -->
    <view class="info-panel">
      <!-- 天气和海况数据 -->
      <view class="weather-section">
        <view class="weather-title">
          <text class="weather-icon">🌤️</text>
          <text class="title-text">天气海况</text>
        </view>
        <view class="weather-data">
          <view class="weather-item">
            <text class="label">温度:</text>
            <text class="value">{{ weatherData.temperature }}°C</text>
          </view>
          <view class="weather-item">
            <text class="label">风速:</text>
            <text class="value">{{ weatherData.windSpeed }}m/s</text>
          </view>
          <view class="weather-item">
            <text class="label">浪高:</text>
            <text class="value">{{ weatherData.waveHeight }}m</text>
          </view>
          <view class="weather-item">
            <text class="label">能见度:</text>
            <text class="value">{{ weatherData.visibility }}km</text>
          </view>
        </view>
      </view>

      <!-- 船舶运行状态数据 -->
      <view class="ship-status-section">
        <view class="status-title">
          <text class="status-icon">🚢</text>
          <text class="title-text">船舶状态</text>
        </view>
        <view class="status-data">
          <view class="status-item">
            <text class="label">时速:</text>
            <text class="value">{{ shipStatus.speed }}节</text>
          </view>
          <view class="status-item">
            <text class="label">电量:</text>
            <text class="value" :class="{ 'warning': shipStatus.battery < 30 }">{{ shipStatus.battery }}%</text>
          </view>
          <view class="status-item">
            <text class="label">功率:</text>
            <text class="value">{{ shipStatus.power }}W</text>
          </view>
          <view class="status-item">
            <text class="label">电流:</text>
            <text class="value">{{ shipStatus.current }}A</text>
          </view>
          <view class="status-item">
            <text class="label">电压:</text>
            <text class="value">{{ shipStatus.voltage }}V</text>
          </view>
        </view>

        <!-- 重要报警数据 -->
        <view class="alerts-section">
          <view class="alert-title">
            <text class="alert-icon">⚠️</text>
            <text class="title-text">状态提醒</text>
          </view>
          <view class="alerts-list">
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
    </view>

    <!-- 地图区域 -->
    <view class="map-container">
      <map
        id="manualMap"
        class="map"
        :latitude="mapCenter.latitude"
        :longitude="mapCenter.longitude"
        :scale="12"
        show-location
        :markers="ships.map(ship => ({
          id: ship.id,
          latitude: ship.latitude,
          longitude: ship.longitude,
          iconPath: '/static/images/ship-icon.png',
          width: 40,
          height: 40,
          title: ship.name,
          callout: {
            content: `${ship.name}\n经度: ${ship.longitude.toFixed(4)}\n纬度: ${ship.latitude.toFixed(4)}\n航向: ${ship.heading}°`,
            color: '#ffffff',
            fontSize: 12,
            borderRadius: 8,
            bgColor: 'rgba(0,0,0,0.8)',
            padding: 8,
            display: 'ALWAYS'
          }
        }))"
        @markertap="handleMarkerTap"
      />
    </view>

    <!-- 右下角摇杆控制器 -->
    <view class="joystick-area">
      <view
        class="joystick-container"
        @touchstart="handleJoystickStart"
        @touchmove="handleJoystickMove"
        @touchend="handleJoystickEnd"
      >
        <!-- 方向指示器 -->
        <text class="direction-indicator top">前</text>
        <text class="direction-indicator bottom">后</text>
        <text class="direction-indicator left">左</text>
        <text class="direction-indicator right">右</text>

        <!-- 摇杆手柄 -->
        <view
          class="joystick-handle"
          :style="{
            transform: `translate(${joystickPosition.x * 0.6}px, ${-joystickPosition.y * 0.6}px)`
          }"
        >
          <text class="handle-icon">✛</text>
        </view>
      </view>

      <!-- 控制值显示 -->
      <view class="joystick-values">
        <text class="value-label">推进: {{ Math.abs(joystickPosition.y) }}%</text>
        <text class="value-label">转向: {{ Math.abs(joystickPosition.x) }}%</text>
      </view>
    </view>

    <!-- 底部菜单栏 -->
    <view class="bottom-menu">
      <view class="menu-container">
        <view
          v-for="item in menuItems"
          :key="item.id"
          class="menu-item"
          :class="{ 'active': activeMenu === item.id }"
          @click="handleMenuClick(item)"
        >
          <text class="menu-icon">{{ item.icon }}</text>
          <text class="menu-label">{{ item.label }}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.manual-container {
  width: 100vw;
  height: 100vh;
  background: #0B1426;
  position: relative;
  overflow: hidden;
}

.info-panel {
  position: absolute;
  top: 32rpx;
  right: 32rpx;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  gap: 16rpx;
  max-width: 400rpx;
}

.weather-section, .ship-status-section {
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(15px);
  border-radius: 16rpx;
  padding: 24rpx;
  border: 2rpx solid rgba(255, 255, 255, 0.2);
}

.weather-title, .status-title, .alert-title {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-bottom: 16rpx;
}

.weather-icon, .status-icon, .alert-icon {
  font-size: 24rpx;
}

.title-text {
  color: white;
  font-size: 24rpx;
  font-weight: 600;
}

.weather-data, .status-data {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12rpx;
}

.weather-item, .status-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.label {
  color: rgba(255, 255, 255, 0.7);
  font-size: 20rpx;
}

.value {
  color: #4FD1C7;
  font-size: 20rpx;
  font-weight: 600;
  font-family: monospace;

  &.warning {
    color: #F59E0B;
  }
}

.alerts-section {
  margin-top: 16rpx;
  padding-top: 16rpx;
  border-top: 2rpx solid rgba(255, 255, 255, 0.1);
}

.alerts-list {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.alert-item {
  color: #10B981;
  font-size: 18rpx;
  padding: 4rpx 8rpx;
  background: rgba(16, 185, 129, 0.1);
  border-radius: 8rpx;
  border: 1rpx solid rgba(16, 185, 129, 0.3);
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

.joystick-area {
  position: absolute;
  bottom: 120rpx;
  right: 32rpx;
  z-index: 1000;
}

.joystick-container {
  width: 320rpx;
  height: 320rpx;
  position: relative;
  background: radial-gradient(circle, rgba(79,209,199,0.1) 0%, rgba(0,0,0,0.8) 70%);
  border-radius: 50%;
  border: 6rpx solid rgba(79,209,199,0.5);
  backdrop-filter: blur(15px);
  box-shadow: 0 16rpx 48rpx rgba(0,0,0,0.4), inset 0 0 40rpx rgba(79,209,199,0.1);
}

.direction-indicator {
  position: absolute;
  color: rgba(255,255,255,0.7);
  font-size: 24rpx;
  font-weight: bold;
  text-shadow: 0 4rpx 8rpx rgba(0,0,0,0.5);

  &.top {
    top: 16rpx;
    left: 50%;
    transform: translateX(-50%);
  }

  &.bottom {
    bottom: 16rpx;
    left: 50%;
    transform: translateX(-50%);
  }

  &.left {
    left: 16rpx;
    top: 50%;
    transform: translateY(-50%);
  }

  &.right {
    right: 16rpx;
    top: 50%;
    transform: translateY(-50%);
  }
}

.joystick-handle {
  width: 120rpx;
  height: 120rpx;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: linear-gradient(145deg, #4FD1C7, #2DD4BF);
  border-radius: 50%;
  border: 6rpx solid white;
  box-shadow: 0 8rpx 24rpx rgba(0,0,0,0.3), 0 0 30rpx rgba(79,209,199,0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.handle-icon {
  color: white;
  font-size: 36rpx;
  font-weight: bold;
}

.joystick-values {
  background: rgba(0, 0, 0, 0.8);
  border-radius: 12rpx;
  padding: 16rpx;
  margin-top: 16rpx;
  border: 2rpx solid rgba(255, 255, 255, 0.2);
  text-align: center;
}

.value-label {
  display: block;
  color: #4FD1C7;
  font-size: 24rpx;
  font-family: monospace;
  margin-bottom: 4rpx;

  &:last-child {
    margin-bottom: 0;
  }
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

    .menu-icon, .menu-label {
      color: #4FD1C7;
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
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
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

.control-icon {
  color: #4FD1C7;
  font-size: 28rpx;
}

.title {
  color: white;
  font-size: 28rpx;
  font-weight: 600;
}

.connection-status {
  display: flex;
  align-items: center;
  gap: 8rpx;
}

.status-dot {
  width: 12rpx;
  height: 12rpx;
  background: #10B981;
  border-radius: 50%;
  animation: pulse 2s infinite;
}

.status-text {
  color: #10B981;
  font-size: 20rpx;
}

.params-panel {
  background: rgba(0, 0, 0, 0.3);
  border-radius: 12rpx;
  padding: 16rpx;
  border: 2rpx solid rgba(255, 255, 255, 0.2);
}

.param-row {
  display: flex;
  gap: 32rpx;
  margin-bottom: 8rpx;

  &:last-child {
    margin-bottom: 0;
  }
}

.param-item {
  display: flex;
  align-items: center;
  gap: 4rpx;
}

.param-icon {
  font-size: 20rpx;
}

.param-label {
  color: white;
  font-size: 20rpx;
}

.param-value {
  color: #4FD1C7;
  font-size: 20rpx;
  font-family: monospace;
}

.map-container {
  flex: 1;
  position: relative;
}

.map {
  width: 100%;
  height: 100%;
}

.left-controls {
  position: absolute;
  left: 32rpx;
  top: 50%;
  transform: translateY(-50%);
  z-index: 100;
  display: flex;
  flex-direction: column;
  gap: 32rpx;
}

.control-group {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8rpx;
}

.control-button {
  width: 88rpx;
  height: 88rpx;
  border-radius: 24rpx;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32rpx;
  backdrop-filter: blur(15px);
  border: 4rpx solid rgba(255, 255, 255, 0.2);
  transition: all 0.3s ease;

  &.emergency {
    background: linear-gradient(135deg, #EF4444, #DC2626);
  }

  &.anchor {
    background: linear-gradient(135deg, #F59E0B, #D97706);
  }

  &.alarm {
    background: linear-gradient(135deg, #F97316, #EA580C);
  }

  &.home {
    background: linear-gradient(135deg, #3B82F6, #2563EB);
  }

  &:active {
    transform: scale(0.95);
  }
}

.button-icon {
  color: white;
  font-size: 32rpx;
}

.button-label {
  color: white;
  font-size: 20rpx;
  text-align: center;
}

.joystick-area {
  position: absolute;
  bottom: 32rpx;
  right: 32rpx;
  z-index: 100;
}

.joystick-container {
  width: 280rpx;
  height: 280rpx;
  position: relative;
  background: radial-gradient(circle, rgba(79,209,199,0.1) 0%, rgba(0,0,0,0.8) 70%);
  border-radius: 50%;
  border: 6rpx solid rgba(79,209,199,0.5);
  backdrop-filter: blur(15px);
  box-shadow: 0 16rpx 48rpx rgba(0,0,0,0.4), inset 0 0 40rpx rgba(79,209,199,0.1);
}

.direction-indicator {
  position: absolute;
  color: rgba(255,255,255,0.7);
  font-size: 24rpx;
  font-weight: bold;
  text-shadow: 0 4rpx 8rpx rgba(0,0,0,0.5);

  &.top {
    top: 16rpx;
    left: 50%;
    transform: translateX(-50%);
  }

  &.bottom {
    bottom: 16rpx;
    left: 50%;
    transform: translateX(-50%);
  }

  &.left {
    left: 16rpx;
    top: 50%;
    transform: translateY(-50%);
  }

  &.right {
    right: 16rpx;
    top: 50%;
    transform: translateY(-50%);
  }
}

.joystick-handle {
  width: 100rpx;
  height: 100rpx;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: linear-gradient(145deg, #4FD1C7, #2DD4BF);
  border-radius: 50%;
  border: 6rpx solid white;
  box-shadow: 0 8rpx 24rpx rgba(0,0,0,0.3), 0 0 30rpx rgba(79,209,199,0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.handle-icon {
  color: white;
  font-size: 32rpx;
  font-weight: bold;
}

.joystick-values {
  background: rgba(0, 0, 0, 0.7);
  border-radius: 12rpx;
  padding: 16rpx;
  margin-top: 16rpx;
  border: 2rpx solid rgba(255, 255, 255, 0.2);
  text-align: center;
}

.value-label {
  display: block;
  color: #4FD1C7;
  font-size: 24rpx;
  font-family: monospace;
  margin-bottom: 4rpx;

  &:last-child {
    margin-bottom: 0;
  }
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}
</style>
