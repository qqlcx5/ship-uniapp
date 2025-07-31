<route lang="jsonc">
{
  "style": {
    "navigationStyle": "custom",
    "navigationBarTitleText": "自动巡航"
  }
}
</route>

<script lang="ts" setup>
import type { PathPoint, ShipData } from '@/utils/map'
import LeafletMap from '@/components/LeafletMap/LeafletMap.vue'
import { MapUtils } from '@/utils/map'

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
  totalDistance: 0,
  estimatedRange: 45.2,
  isNavigating: false,
  currentWaypoint: 0,
  estimatedTime: 0,
})

// 高级设置面板显示状态
const showAdvancedSettings = ref(false)

// 地图中心点（福建海域）
const mapCenter = ref<[number, number]>([26.0614, 119.3061])

// 主控船舶
const mainShip = ref<ShipData>({
  id: 1,
  name: '海巡001',
  latitude: 26.0614,
  longitude: 119.3061,
  heading: 45,
  status: 'active',
  speed: 8.5,
  battery: 85,
})

// 路径点数据
const pathPoints = ref<PathPoint[]>([])

// 船舶运行状态数据
const shipStatus = ref({
  speed: 8.5,
  battery: 85,
  power: 850,
  current: 12.3,
  voltage: 24.8,
  alerts: ['GPS信号良好', '自动巡航待命'],
})

// 地图实例引用
const mapRef = ref()

// 航点数据（兼容旧代码）
const waypoints = ref([
  { id: 1, latitude: 26.0614, longitude: 119.3061, name: '起点' },
  { id: 2, latitude: 26.0624, longitude: 119.3071, name: '航点1' },
])

// 将航点转换为路径点格式
function convertWaypointsToPathPoints() {
  pathPoints.value = waypoints.value.map((wp, index) => ({
    id: wp.id.toString(),
    latitude: wp.latitude,
    longitude: wp.longitude,
    order: index + 1,
  }))
  updateCruiseStatus()
}

// 更新巡航状态
function updateCruiseStatus() {
  if (pathPoints.value.length >= 2) {
    cruiseStatus.value.totalDistance = MapUtils.calculatePathDistance(pathPoints.value)
    cruiseStatus.value.estimatedTime = MapUtils.estimateNavigationTime(
      cruiseStatus.value.totalDistance,
      cruiseStatus.value.targetSpeed,
    )
    cruiseStatus.value.estimatedRange = MapUtils.estimateRemainingRange(
      shipStatus.value.battery,
      shipStatus.value.power,
      cruiseStatus.value.currentSpeed,
    )
  }
}

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
    latitude: mapCenter.value[0] + (Math.random() - 0.5) * 0.02,
    longitude: mapCenter.value[1] + (Math.random() - 0.5) * 0.02,
    name: `航点${newId - 1}`,
  })
  convertWaypointsToPathPoints()
  uni.showToast({ title: '航点已添加', icon: 'success' })
}

function removeWaypoint() {
  if (waypoints.value.length > 2) {
    waypoints.value.pop()
    convertWaypointsToPathPoints()
    uni.showToast({ title: '航点已删除', icon: 'success' })
  }
  else {
    uni.showToast({ title: '至少需要2个航点', icon: 'none' })
  }
}

// 地图点击添加路径点
function handleMapClick(event: { latitude: number, longitude: number }) {
  const newId = pathPoints.value.length + 1
  pathPoints.value.push({
    id: `point_${newId}`,
    latitude: event.latitude,
    longitude: event.longitude,
    order: newId,
  })
  updateCruiseStatus()
  uni.showToast({ title: '路径点已添加', icon: 'success' })
}

// 删除路径点
function handlePathPointRemove(pointId: string) {
  const index = pathPoints.value.findIndex(p => p.id === pointId)
  if (index > -1) {
    pathPoints.value.splice(index, 1)
    // 重新排序
    pathPoints.value.forEach((point, idx) => {
      point.order = idx + 1
    })
    updateCruiseStatus()
    uni.showToast({ title: '路径点已删除', icon: 'success' })
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

// 地图准备就绪
function handleMapReady() {
  console.log('地图初始化完成')
}

// 获取路径点在地图上的位置（简化实现）
function getPointPosition(point: PathPoint) {
  // 这里应该根据地图的实际坐标转换来计算
  // 简化实现，返回固定位置
  return { x: 100, y: 100 }
}

// 删除路径点（简化版本）
function removePathPoint(index: number) {
  pathPoints.value.splice(index, 1)
  updateCruiseStatus()
  uni.showToast({ title: '路径点已删除', icon: 'success' })
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

// 初始化数据
function initializeData() {
  convertWaypointsToPathPoints()
}

onLoad(() => {
  console.log('自动巡航页面加载')
  initializeData()
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
      <LeafletMap
        ref="mapRef"
        :center="mapCenter"
        :zoom="12"
        :ships="[mainShip]"
        :path-points="pathPoints"
        :show-path="true"
        :interactive="true"
        @ship-click="handleShipClick"
        @map-click="handleMapClick"
        @path-point-remove="handlePathPointRemove"
        @map-ready="handleMapReady"
      />

      <!-- 路径点标记 -->
      <view
        v-for="(point, index) in pathPoints"
        :key="point.id"
        class="path-point-marker"
        :style="{
          left: `${getPointPosition(point).x}px`,
          top: `${getPointPosition(point).y}px`,
        }"
        @click="removePathPoint(index)"
      >
        <text class="point-number">
          {{ index + 1 }}
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
  width: 120rpx;
  height: 120rpx;
  border-radius: 24rpx;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(15px);
  border: 4rpx solid rgba(255, 255, 255, 0.2);
  transition: all 0.3s ease;
  cursor: pointer;

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
  font-size: 40rpx;
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
  width: 320rpx;
  height: 100rpx;
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
  cursor: pointer;

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
  font-size: 28rpx;
  font-weight: 500;
}

// 速度控制样式
.speed-control {
  background: rgba(0, 0, 0, 0.6);
  border-radius: 16rpx;
  padding: 20rpx;
  border: 2rpx solid rgba(255, 255, 255, 0.2);
}

.speed-title {
  color: white;
  font-size: 24rpx;
  text-align: center;
  margin-bottom: 16rpx;
  font-weight: 500;
}

.speed-buttons {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
}

.speed-btn {
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
  cursor: pointer;

  &.decrease {
    background: linear-gradient(135deg, #ef4444, #dc2626);
  }

  &.increase {
    background: linear-gradient(135deg, #10b981, #059669);
  }

  &:active {
    transform: scale(0.95);
  }

  .btn-icon {
    font-size: 24rpx;
  }
}

.speed-value {
  color: #4fd1c7;
  font-size: 28rpx;
  font-weight: bold;
  font-family: monospace;
  text-align: center;
  min-width: 120rpx;
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
  font-size: 40rpx;
  margin-bottom: 8rpx;
  color: rgba(255, 255, 255, 0.7);
  transition: color 0.3s ease;
}

.menu-label {
  font-size: 22rpx;
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
