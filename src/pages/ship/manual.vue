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

// 摇杆控制状态
const joystickPosition = ref({ x: 0, y: 0 })
const isDragging = ref(false)

// 实时参数
const realTimeParams = ref({
  power: 85,
  voltage: 12.5,
  speed: 8,
  runtime: '02:34:15'
})

// 地图中心点
const mapCenter = ref({
  latitude: 26.0614,
  longitude: 119.3061
})

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
}

function handleJoystickEnd() {
  isDragging.value = false
  joystickPosition.value = { x: 0, y: 0 }
}

// 控制按钮处理
function handleControlButton(type: string) {
  switch (type) {
    case 'stop':
      uni.showModal({
        title: '急停',
        content: '确定要执行急停操作吗？',
        success: (res) => {
          if (res.confirm) {
            uni.showToast({ title: '急停执行', icon: 'success' })
          }
        }
      })
      break
    case 'anchor':
      uni.showToast({ title: '锚泊模式', icon: 'success' })
      break
    case 'alarm':
      uni.showToast({ title: '警报已触发', icon: 'none' })
      break
    case 'home':
      uni.showModal({
        title: '回收',
        content: '确定要执行回收操作吗？',
        success: (res) => {
          if (res.confirm) {
            uni.showToast({ title: '开始回收', icon: 'success' })
          }
        }
      })
      break
  }
}

// 返回主控台
function goBack() {
  uni.navigateBack()
}

onLoad(() => {
  console.log('手动导航页面加载')
})
</script>

<template>
  <view class="manual-container" :style="{ paddingTop: `${safeAreaInsets?.top || 0}px` }">
    <!-- 顶部状态栏 -->
    <view class="status-bar">
      <view class="status-left">
        <button class="back-button" @click="goBack">
          <text class="back-icon">←</text>
        </button>
        <view class="title-section">
          <text class="control-icon">🎮</text>
          <text class="title">手动导航控制</text>
        </view>
        <view class="connection-status">
          <view class="status-dot"></view>
          <text class="status-text">遥控连接</text>
        </view>
      </view>
      
      <!-- 右上角实时参数 -->
      <view class="params-panel">
        <view class="param-row">
          <view class="param-item">
            <text class="param-icon">⚡</text>
            <text class="param-label">功率: </text>
            <text class="param-value">{{ realTimeParams.power }}W</text>
          </view>
          <view class="param-item">
            <text class="param-icon">🔌</text>
            <text class="param-label">电压: </text>
            <text class="param-value">{{ realTimeParams.voltage }}V</text>
          </view>
        </view>
        <view class="param-row">
          <view class="param-item">
            <text class="param-icon">🚀</text>
            <text class="param-label">速度: </text>
            <text class="param-value">{{ realTimeParams.speed }}节</text>
          </view>
          <view class="param-item">
            <text class="param-icon">⏱️</text>
            <text class="param-label">运行: </text>
            <text class="param-value">{{ realTimeParams.runtime }}</text>
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
        :scale="15"
        show-location
      />
    </view>
    
    <!-- 左侧控制按钮 -->
    <view class="left-controls">
      <view class="control-group">
        <button 
          class="control-button emergency"
          @click="handleControlButton('stop')"
        >
          <text class="button-icon">🛑</text>
        </button>
        <text class="button-label">急停</text>
      </view>
      
      <view class="control-group">
        <button 
          class="control-button anchor"
          @click="handleControlButton('anchor')"
        >
          <text class="button-icon">⚓</text>
        </button>
        <text class="button-label">锚泊</text>
      </view>
      
      <view class="control-group">
        <button 
          class="control-button alarm"
          @click="handleControlButton('alarm')"
        >
          <text class="button-icon">⚠️</text>
        </button>
        <text class="button-label">警报</text>
      </view>
      
      <view class="control-group">
        <button 
          class="control-button home"
          @click="handleControlButton('home')"
        >
          <text class="button-icon">🏠</text>
        </button>
        <text class="button-label">回收</text>
      </view>
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
            transform: `translate(${joystickPosition.x * 0.45}px, ${-joystickPosition.y * 0.45}px)`
          }"
        >
          <text class="handle-icon">✛</text>
        </view>
      </view>
      
      <!-- 控制值显示 -->
      <view class="joystick-values">
        <text class="value-label">X: {{ joystickPosition.x }}</text>
        <text class="value-label">Y: {{ joystickPosition.y }}</text>
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.manual-container {
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
