<route lang="jsonc">
{
  "style": {
    "navigationStyle": "custom",
    "navigationBarTitleText": "手动导航"
  }
}
</route>

<script lang="ts" setup>
interface ShipData {
  id: number
  name: string
  latitude: number
  longitude: number
  heading: number
  status: 'active' | 'idle' | 'warning' | 'offline'
  speed?: number
  battery?: number
}

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

// 方向控制状态
const directionControl = ref({
  forward: false,
  backward: false,
  left: false,
  right: false,
})

// 天气和海况数据
const weatherData = ref({
  temperature: 24,
  condition: '多云',
  windSpeed: 12,
  windDirection: '东南',
  windLevel: 3,
  waveHeight: 1.2,
  seaCondition: 2,
  visibility: 8.5,
  humidity: 68,
  pressure: 1015,
})

// 连接状态
const bluetoothConnected = ref(true)
const gpsConnected = ref(true)

// 地图工具函数
const MapUtils = {
  // 计算新位置
  calculateNewPosition(lat: number, lng: number, heading: number, distance: number): [number, number] {
    const R = 6371000 // 地球半径（米）
    const d = distance
    const brng = heading * Math.PI / 180 // 转换为弧度

    const lat1 = lat * Math.PI / 180
    const lng1 = lng * Math.PI / 180

    const lat2 = Math.asin(Math.sin(lat1) * Math.cos(d / R)
      + Math.cos(lat1) * Math.sin(d / R) * Math.cos(brng))
    const lng2 = lng1 + Math.atan2(Math.sin(brng) * Math.sin(d / R) * Math.cos(lat1), Math.cos(d / R) - Math.sin(lat1) * Math.sin(lat2))

    return [lat2 * 180 / Math.PI, lng2 * 180 / Math.PI]
  },

  // 格式化坐标
  formatCoordinate(coord: number, type: 'lat' | 'lng'): string {
    const direction = type === 'lat' ? (coord >= 0 ? 'N' : 'S') : (coord >= 0 ? 'E' : 'W')
    return `${Math.abs(coord).toFixed(4)}°${direction}`
  },
}

// 船舶运行状态数据
const shipStatus = ref({
  speed: 8.5,
  battery: 76,
  power: 850,
  current: 12.3,
  voltage: 24.8,
  alerts: ['GPS信号良好', '电池状态正常'],
})

// 地图中心点（福建海域）
const mapCenter = ref<[number, number]>([26.0614, 119.3061])

// 船只数据（6-7条船）
const ships = ref<ShipData[]>([
  {
    id: 1,
    name: '海巡001',
    latitude: 26.0614,
    longitude: 119.3061,
    heading: 45,
    status: 'active',
    speed: 8.5,
    battery: 85,
  },
  {
    id: 2,
    name: '海巡002',
    latitude: 26.0724,
    longitude: 119.3171,
    heading: 120,
    status: 'active',
    speed: 12.2,
    battery: 72,
  },
  {
    id: 3,
    name: '海巡003',
    latitude: 26.0504,
    longitude: 119.2951,
    heading: 270,
    status: 'active',
    speed: 6.8,
    battery: 91,
  },
  {
    id: 4,
    name: '海巡004',
    latitude: 26.0814,
    longitude: 119.3261,
    heading: 180,
    status: 'active',
    speed: 15.3,
    battery: 68,
  },
  {
    id: 5,
    name: '海巡005',
    latitude: 26.0414,
    longitude: 119.2861,
    heading: 90,
    status: 'active',
    speed: 9.7,
    battery: 79,
  },
  {
    id: 6,
    name: '海巡006',
    latitude: 26.0914,
    longitude: 119.3461,
    heading: 315,
    status: 'active',
    speed: 11.1,
    battery: 56,
  },
  {
    id: 7,
    name: '海巡007',
    latitude: 26.0314,
    longitude: 119.2761,
    heading: 225,
    status: 'idle',
    speed: 0,
    battery: 94,
  },
])

// 菜单项配置
const menuItems = [
  { id: 'manual', icon: '🎮', label: '手动导航', page: '/pages/ship/manual' },
  { id: 'cruise', icon: '🗺️', label: '自动巡航', page: '/pages/ship/cruise' },
  { id: 'ai', icon: '🧠', label: 'AI管理', page: '/pages/ship/ai' },
  { id: 'management', icon: '⚙️', label: '综合管理', page: '/pages/ship/management' },
]

// 地图实例引用
const mapRef = ref()

// 摇杆控制处理
function handleJoystickStart(e: any) {
  isDragging.value = true
  e.preventDefault()
}

function handleJoystickMove(e: any) {
  if (!isDragging.value)
    return

  e.preventDefault()

  // UniApp中使用changedTouches
  const touch = e.changedTouches[0] || e.touches[0]
  if (!touch)
    return

  // 使用固定的摇杆容器尺寸进行计算
  const containerSize = 320 // rpx转换为px，大约160px
  const centerX = containerSize / 2
  const centerY = containerSize / 2
  const maxRadius = containerSize / 2 - 60 // 减去手柄半径

  // 简化计算，使用相对位置
  const deltaX = (touch.clientX - centerX)
  const deltaY = (touch.clientY - centerY)
  const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)

  if (distance <= maxRadius) {
    joystickPosition.value = {
      x: Math.round((deltaX / maxRadius) * 100),
      y: Math.round((-deltaY / maxRadius) * 100), // 反转Y轴
    }
  }
  else {
    const angle = Math.atan2(deltaY, deltaX)
    joystickPosition.value = {
      x: Math.round(Math.cos(angle) * 100),
      y: Math.round(-Math.sin(angle) * 100), // 反转Y轴
    }
  }

  // 实时更新船舶状态和位置
  updateShipStatus()
  updateShipPosition()
}

function handleJoystickEnd(e: any) {
  isDragging.value = false
  joystickPosition.value = { x: 0, y: 0 }
  e.preventDefault()
}

// 方向控制函数
function handleDirectionControl(direction: string, isPressed: boolean) {
  directionControl.value[direction as keyof typeof directionControl.value] = isPressed

  // 根据按下的方向更新摇杆位置
  let x = 0
  let y = 0

  if (directionControl.value.left)
    x -= 100
  if (directionControl.value.right)
    x += 100
  if (directionControl.value.forward)
    y += 100
  if (directionControl.value.backward)
    y -= 100

  // 限制在圆形范围内
  const distance = Math.sqrt(x * x + y * y)
  if (distance > 100) {
    x = (x / distance) * 100
    y = (y / distance) * 100
  }

  joystickPosition.value = { x: Math.round(x), y: Math.round(y) }

  // 更新船舶状态
  updateShipStatus()
  updateShipPosition()
}

// 更新船舶状态
function updateShipStatus() {
  // 模拟根据摇杆位置更新船舶状态
  const intensity = Math.sqrt(joystickPosition.value.x ** 2 + joystickPosition.value.y ** 2) / 100
  shipStatus.value.speed = Math.round((8.5 + intensity * 5) * 10) / 10
  shipStatus.value.power = Math.round(850 + intensity * 200)
  shipStatus.value.current = Math.round((12.3 + intensity * 3) * 10) / 10
}

// 更新船舶位置（模拟实时移动）
function updateShipPosition() {
  if (joystickPosition.value.x === 0 && joystickPosition.value.y === 0)
    return

  const mainShip = ships.value[0] // 主控船舶
  if (!mainShip)
    return

  // 计算新的航向
  const bearing = Math.atan2(joystickPosition.value.x, joystickPosition.value.y) * 180 / Math.PI
  mainShip.heading = (bearing + 360) % 360

  // 计算移动距离（基于摇杆强度）
  const intensity = Math.sqrt(joystickPosition.value.x ** 2 + joystickPosition.value.y ** 2) / 100
  const distance = intensity * 0.001 // 很小的移动距离

  // 计算新位置
  const [newLat, newLng] = MapUtils.calculateNewPosition(
    mainShip.latitude,
    mainShip.longitude,
    mainShip.heading,
    distance,
  )

  mainShip.latitude = newLat
  mainShip.longitude = newLng
  mainShip.speed = shipStatus.value.speed
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

// 获取状态文本
function getStatusText(status: string): string {
  const statusMap = {
    active: '航行中',
    idle: '待机',
    warning: '警告',
    offline: '离线',
  }
  return statusMap[status as keyof typeof statusMap] || '未知'
}

// 船舶点击处理
function handleShipClick(ship: ShipData) {
  uni.showModal({
    title: ship.name,
    content: `位置: ${MapUtils.formatCoordinate(ship.latitude, 'lat')}, ${MapUtils.formatCoordinate(ship.longitude, 'lng')}\n航向: ${ship.heading}°\n状态: ${getStatusText(ship.status)}\n速度: ${ship.speed}节\n电量: ${ship.battery}%`,
    showCancel: false,
  })
}

// 地图点击处理
function handleMapClick(event: { latitude: number, longitude: number }) {
  console.log('地图点击位置:', event)
}

// 地图准备就绪
function handleMapReady() {
  console.log('地图初始化完成')
}

// 模拟实时数据更新
function startDataSimulation() {
  setInterval(() => {
    // 更新天气数据
    weatherData.value.temperature = 24 + Math.random() * 4 - 2
    weatherData.value.windSpeed = 12 + Math.random() * 6 - 3
    weatherData.value.waveHeight = 1.2 + Math.random() * 0.8 - 0.4

    // 更新其他船舶位置（模拟自动移动）
    ships.value.slice(1).forEach((ship) => {
      if (ship.status === 'active') {
        const distance = 0.0005 // 小幅移动
        const [newLat, newLng] = MapUtils.calculateNewPosition(
          ship.latitude,
          ship.longitude,
          ship.heading,
          distance,
        )
        ship.latitude = newLat
        ship.longitude = newLng

        // 偶尔改变航向
        if (Math.random() < 0.1) {
          ship.heading = (ship.heading + Math.random() * 60 - 30 + 360) % 360
        }
      }
    })
  }, 2000)
}

onLoad(() => {
  console.log('手动导航页面加载')
  startDataSimulation()
})
</script>

<template>
  <view class="manual-container" :style="{ paddingTop: `${safeAreaInsets?.top || 0}px` }">
    <!-- 右上角天气和船舶状态信息 -->
    <view class="info-panel">
      <!-- 天气和海况数据 -->
      <view class="weather-section">
        <view class="weather-title">
          <text class="weather-icon">
            🌤️
          </text>
          <text class="title-text">
            天气海况
          </text>
        </view>
        <view class="weather-data">
          <view class="weather-item">
            <text class="label">
              温度:
            </text>
            <text class="value">
              {{ weatherData.temperature }}°C
            </text>
          </view>
          <view class="weather-item">
            <text class="label">
              风速:
            </text>
            <text class="value">
              {{ weatherData.windSpeed }}m/s
            </text>
          </view>
          <view class="weather-item">
            <text class="label">
              浪高:
            </text>
            <text class="value">
              {{ weatherData.waveHeight }}m
            </text>
          </view>
          <view class="weather-item">
            <text class="label">
              能见度:
            </text>
            <text class="value">
              {{ weatherData.visibility }}km
            </text>
          </view>
        </view>
      </view>

      <!-- 船舶运行状态数据 -->
      <view class="ship-status-section">
        <view class="status-title">
          <text class="status-icon">
            🚢
          </text>
          <text class="title-text">
            船舶状态
          </text>
        </view>
        <view class="status-data">
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
        </view>

        <!-- 重要报警数据 -->
        <view class="alerts-section">
          <view class="alert-title">
            <text class="alert-icon">
              ⚠️
            </text>
            <text class="title-text">
              状态提醒
            </text>
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
      <LeafletMap
        ref="mapRef"
        :center="mapCenter"
        :zoom="12"
        :ships="ships"
        @ship-click="handleShipClick"
        @map-click="handleMapClick"
        @map-ready="handleMapReady"
      />
    </view>

    <!-- 右下角摇杆控制器 -->
    <view class="joystick-area">
      <view
        class="joystick-container"
        @touchstart="handleJoystickStart"
        @touchmove="handleJoystickMove"
        @touchend="handleJoystickEnd"
        @touchcancel="handleJoystickEnd"
      >
        <!-- 方向控制按钮 -->
        <button
          class="direction-btn top"
          @touchstart="handleDirectionControl('forward', true)"
          @touchend="handleDirectionControl('forward', false)"
          @touchcancel="handleDirectionControl('forward', false)"
        >
          前
        </button>
        <button
          class="direction-btn bottom"
          @touchstart="handleDirectionControl('backward', true)"
          @touchend="handleDirectionControl('backward', false)"
          @touchcancel="handleDirectionControl('backward', false)"
        >
          后
        </button>
        <button
          class="direction-btn left"
          @touchstart="handleDirectionControl('left', true)"
          @touchend="handleDirectionControl('left', false)"
          @touchcancel="handleDirectionControl('left', false)"
        >
          左
        </button>
        <button
          class="direction-btn right"
          @touchstart="handleDirectionControl('right', true)"
          @touchend="handleDirectionControl('right', false)"
          @touchcancel="handleDirectionControl('right', false)"
        >
          右
        </button>

        <!-- 摇杆手柄 -->
        <view
          class="joystick-handle"
          :style="{
            transform: `translate(${joystickPosition.x * 0.6}px, ${-joystickPosition.y * 0.6}px)`,
          }"
        >
          <text class="handle-icon">
            ✛
          </text>
        </view>
      </view>

      <!-- 控制值显示 -->
      <view class="joystick-values">
        <text class="value-label">
          推进: {{ Math.abs(joystickPosition.y) }}%
        </text>
        <text class="value-label">
          转向: {{ Math.abs(joystickPosition.x) }}%
        </text>
      </view>
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
.manual-container {
  width: 100vw;
  height: 100vh;
  background: #0b1426;
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

.weather-section,
.ship-status-section {
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(15px);
  border-radius: 16rpx;
  padding: 24rpx;
  border: 2rpx solid rgba(255, 255, 255, 0.2);
}

.weather-title,
.status-title,
.alert-title {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-bottom: 16rpx;
}

.weather-icon,
.status-icon,
.alert-icon {
  font-size: 24rpx;
}

.title-text {
  color: white;
  font-size: 24rpx;
  font-weight: 600;
}

.weather-data,
.status-data {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12rpx;
}

.weather-item,
.status-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.label {
  color: rgba(255, 255, 255, 0.7);
  font-size: 20rpx;
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
  color: #10b981;
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
  background: radial-gradient(circle, rgba(79, 209, 199, 0.1) 0%, rgba(0, 0, 0, 0.8) 70%);
  border-radius: 50%;
  border: 6rpx solid rgba(79, 209, 199, 0.5);
  backdrop-filter: blur(15px);
  box-shadow:
    0 16rpx 48rpx rgba(0, 0, 0, 0.4),
    inset 0 0 40rpx rgba(79, 209, 199, 0.1);
}

.direction-indicator {
  position: absolute;
  color: rgba(255, 255, 255, 0.7);
  font-size: 24rpx;
  font-weight: bold;
  text-shadow: 0 4rpx 8rpx rgba(0, 0, 0, 0.5);

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
  background: linear-gradient(145deg, #4fd1c7, #2dd4bf);
  border-radius: 50%;
  border: 6rpx solid white;
  box-shadow:
    0 8rpx 24rpx rgba(0, 0, 0, 0.3),
    0 0 30rpx rgba(79, 209, 199, 0.4);
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
  color: #4fd1c7;
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
  color: #4fd1c7;
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
  background: #10b981;
  border-radius: 50%;
  animation: pulse 2s infinite;
}

.status-text {
  color: #10b981;
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
  color: #4fd1c7;
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
  width: 120rpx;
  height: 120rpx;
  border-radius: 24rpx;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 40rpx;
  backdrop-filter: blur(15px);
  border: 4rpx solid rgba(255, 255, 255, 0.2);
  transition: all 0.3s ease;
  cursor: pointer;

  &.emergency {
    background: linear-gradient(135deg, #ef4444, #dc2626);
  }

  &.anchor {
    background: linear-gradient(135deg, #f59e0b, #d97706);
  }

  &.alarm {
    background: linear-gradient(135deg, #f97316, #ea580c);
  }

  &.home {
    background: linear-gradient(135deg, #3b82f6, #2563eb);
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
  width: 320rpx;
  height: 320rpx;
  position: relative;
  background: radial-gradient(circle, rgba(79, 209, 199, 0.1) 0%, rgba(0, 0, 0, 0.8) 70%);
  border-radius: 50%;
  border: 6rpx solid rgba(79, 209, 199, 0.5);
  backdrop-filter: blur(15px);
  box-shadow:
    0 16rpx 48rpx rgba(0, 0, 0, 0.4),
    inset 0 0 40rpx rgba(79, 209, 199, 0.1);
  cursor: pointer;
}

.direction-btn {
  position: absolute;
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  border: 3rpx solid rgba(255, 255, 255, 0.3);
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(10px);
  color: rgba(255, 255, 255, 0.8);
  font-size: 24rpx;
  font-weight: bold;
  text-shadow: 0 2rpx 4rpx rgba(0, 0, 0, 0.5);
  transition: all 0.2s ease;
  cursor: pointer;

  &:active {
    background: rgba(79, 209, 199, 0.3);
    border-color: rgba(79, 209, 199, 0.6);
    color: white;
    transform: scale(0.95);
  }

  &.top {
    top: 20rpx;
    left: 50%;
    transform: translateX(-50%);
  }

  &.bottom {
    bottom: 20rpx;
    left: 50%;
    transform: translateX(-50%);
  }

  &.left {
    left: 20rpx;
    top: 50%;
    transform: translateY(-50%);
  }

  &.right {
    right: 20rpx;
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
  background: linear-gradient(145deg, #4fd1c7, #2dd4bf);
  border-radius: 50%;
  border: 6rpx solid white;
  box-shadow:
    0 8rpx 24rpx rgba(0, 0, 0, 0.3),
    0 0 30rpx rgba(79, 209, 199, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  cursor: pointer;
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
  color: #4fd1c7;
  font-size: 24rpx;
  font-family: monospace;
  margin-bottom: 4rpx;

  &:last-child {
    margin-bottom: 0;
  }
}

// 底部菜单样式
.bottom-menu {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(15px);
  border-top: 2rpx solid rgba(255, 255, 255, 0.2);
  z-index: 1000;
  padding-bottom: env(safe-area-inset-bottom);
}

.menu-container {
  display: flex;
  height: 120rpx;
}

.menu-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.7);
  transition: all 0.3s ease;
  cursor: pointer;
  padding: 16rpx 8rpx;

  &:hover,
  &.active {
    color: #4fd1c7;
    background: rgba(79, 209, 199, 0.1);
  }
}

.menu-icon {
  font-size: 40rpx;
  margin-bottom: 8rpx;
}

.menu-label {
  font-size: 22rpx;
  font-weight: 500;
  text-align: center;
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
