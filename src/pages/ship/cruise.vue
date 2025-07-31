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

// 巡航状态
const cruiseStatus = ref({
  isActive: false,
  currentWaypoint: 3,
  totalWaypoints: 5,
  totalDistance: 12.5
})

// 高级设置面板显示状态
const showAdvancedSettings = ref(false)

// 地图中心点和航点
const mapCenter = ref({
  latitude: 26.0614,
  longitude: 119.3061
})

const waypoints = ref([
  { id: 1, latitude: 26.0614, longitude: 119.3061, name: '起点' },
  { id: 2, latitude: 26.0624, longitude: 119.3071, name: '航点1' },
  { id: 3, latitude: 26.0634, longitude: 119.3081, name: '航点2' },
  { id: 4, latitude: 26.0644, longitude: 119.3091, name: '航点3' },
  { id: 5, latitude: 26.0654, longitude: 119.3101, name: '终点' }
])

// 控制按钮处理
function toggleCruise() {
  cruiseStatus.value.isActive = !cruiseStatus.value.isActive
  const status = cruiseStatus.value.isActive ? '启动' : '停止'
  uni.showToast({
    title: `自动巡航${status}`,
    icon: 'success'
  })
}

function addWaypoint() {
  const newId = waypoints.value.length + 1
  waypoints.value.push({
    id: newId,
    latitude: mapCenter.value.latitude + (Math.random() - 0.5) * 0.01,
    longitude: mapCenter.value.longitude + (Math.random() - 0.5) * 0.01,
    name: `航点${newId - 1}`
  })
  cruiseStatus.value.totalWaypoints = waypoints.value.length
  uni.showToast({ title: '航点已添加', icon: 'success' })
}

function removeWaypoint() {
  if (waypoints.value.length > 2) {
    waypoints.value.pop()
    cruiseStatus.value.totalWaypoints = waypoints.value.length
    uni.showToast({ title: '航点已删除', icon: 'success' })
  } else {
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
            cruiseStatus.value.totalWaypoints = 2
            uni.showToast({ title: '路径已清除', icon: 'success' })
          }
        }
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

// 地图标记点击处理
function handleMarkerTap(e: any) {
  const markerId = e.detail.markerId
  const waypoint = waypoints.value.find(w => w.id === markerId)
  if (waypoint) {
    uni.showModal({
      title: waypoint.name,
      content: `位置: ${waypoint.latitude.toFixed(4)}, ${waypoint.longitude.toFixed(4)}`,
      showCancel: false
    })
  }
}

// 返回主控台
function goBack() {
  uni.navigateBack()
}

onLoad(() => {
  console.log('自动巡航页面加载')
})
</script>

<template>
  <view class="cruise-container" :style="{ paddingTop: `${safeAreaInsets?.top || 0}px` }">
    <!-- 顶部状态栏 -->
    <view class="status-bar">
      <view class="status-left">
        <button class="back-button" @click="goBack">
          <text class="back-icon">←</text>
        </button>
        <view class="title-section">
          <text class="route-icon">🗺️</text>
          <text class="title">自动巡航规划</text>
        </view>
        <view class="cruise-status">
          <view class="status-dot" :class="{ 'active': cruiseStatus.isActive }"></view>
          <text class="status-text">{{ cruiseStatus.isActive ? '自动模式' : '待机模式' }}</text>
        </view>
      </view>
      
      <view class="route-info">
        <text class="info-text">航点: {{ cruiseStatus.currentWaypoint }}/{{ cruiseStatus.totalWaypoints }}</text>
        <text class="info-text">总距离: {{ cruiseStatus.totalDistance }}km</text>
      </view>
    </view>
    
    <!-- 左上角控制面板 -->
    <view class="control-panel">
      <view class="control-buttons">
        <button 
          class="control-btn power"
          :class="{ 'active': cruiseStatus.isActive }"
          @click="toggleCruise"
        >
          <text class="btn-icon">⚡</text>
        </button>
        
        <button class="control-btn add" @click="addWaypoint">
          <text class="btn-icon">➕</text>
        </button>
        
        <button class="control-btn remove" @click="removeWaypoint">
          <text class="btn-icon">➖</text>
        </button>
        
        <button 
          class="control-btn settings"
          :class="{ 'active': showAdvancedSettings }"
          @click="toggleAdvancedSettings"
        >
          <text class="btn-icon">⚙️</text>
        </button>
      </view>
    </view>
    
    <!-- 右侧高级设置面板 -->
    <view v-if="showAdvancedSettings" class="advanced-panel">
      <button 
        class="advanced-btn clear"
        @click="handleAdvancedAction('clearAll')"
      >
        <text class="btn-icon">🗑️</text>
        <text class="btn-text">删除所有路径</text>
      </button>
      
      <button 
        class="advanced-btn servo"
        @click="handleAdvancedAction('setServoZero')"
      >
        <text class="btn-icon">🎯</text>
        <text class="btn-text">设置舵机零点</text>
      </button>
      
      <button 
        class="advanced-btn compass"
        @click="handleAdvancedAction('calibrateCompass')"
      >
        <text class="btn-icon">🧭</text>
        <text class="btn-text">标定磁力计</text>
      </button>
      
      <button 
        class="advanced-btn accelerometer"
        @click="handleAdvancedAction('toggleAccelerometer')"
      >
        <text class="btn-icon">⚖️</text>
        <text class="btn-text">加速度计开关</text>
      </button>
    </view>
    
    <!-- 地图区域 -->
    <view class="map-container">
      <map
        id="cruiseMap"
        class="map"
        :latitude="mapCenter.latitude"
        :longitude="mapCenter.longitude"
        :scale="13"
        :markers="waypoints.map((waypoint, index) => ({
          id: waypoint.id,
          latitude: waypoint.latitude,
          longitude: waypoint.longitude,
          iconPath: index === 0 ? '/static/images/start-point.png' : 
                   index === waypoints.length - 1 ? '/static/images/end-point.png' : 
                   '/static/images/waypoint.png',
          width: 30,
          height: 30,
          title: waypoint.name
        }))"
        :polyline="[{
          points: waypoints.map(w => ({ latitude: w.latitude, longitude: w.longitude })),
          color: '#4FD1C7',
          width: 4,
          dottedLine: true
        }]"
        @markertap="handleMarkerTap"
      />
    </view>
  </view>
</template>

<style lang="scss" scoped>
.cruise-container {
  width: 100vw;
  height: 100vh;
  background: #0B1426;
  display: flex;
  flex-direction: column;
  position: relative;
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

.route-icon {
  color: #4FD1C7;
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
  background: #6B7280;
  border-radius: 50%;
  transition: all 0.3s ease;
  
  &.active {
    background: #10B981;
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
  top: 120rpx;
  left: 32rpx;
  z-index: 100;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(10px);
  border-radius: 24rpx;
  padding: 24rpx;
  border: 2rpx solid rgba(255, 255, 255, 0.2);
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
    background: linear-gradient(135deg, #10B981, #059669);
    
    &.active {
      background: linear-gradient(135deg, #EF4444, #DC2626);
      box-shadow: 0 0 20rpx rgba(239, 68, 68, 0.5);
    }
  }
  
  &.add {
    background: linear-gradient(135deg, #4FD1C7, #2DD4BF);
  }
  
  &.remove {
    background: linear-gradient(135deg, #EF4444, #DC2626);
  }
  
  &.settings {
    background: linear-gradient(135deg, #8B5CF6, #7C3AED);
    
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
    background: linear-gradient(135deg, #EF4444, #DC2626);
  }
  
  &.servo {
    background: linear-gradient(135deg, #F59E0B, #D97706);
  }
  
  &.compass {
    background: linear-gradient(135deg, #3B82F6, #2563EB);
  }
  
  &.accelerometer {
    background: linear-gradient(135deg, #10B981, #059669);
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
  flex: 1;
  position: relative;
}

.map {
  width: 100%;
  height: 100%;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}
</style>
