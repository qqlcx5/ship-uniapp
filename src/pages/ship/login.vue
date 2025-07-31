<route lang="jsonc">
{
  "style": {
    "navigationStyle": "custom",
    "navigationBarTitleText": "船舶智能管理系统"
  }
}
</route>

<script lang="ts" setup>
defineOptions({
  name: 'ShipLogin',
})

// 获取屏幕边界到安全区域距离
let safeAreaInsets
let systemInfo

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

// 蓝牙连接状态
const bluetoothStatus = ref('正在搜索蓝牙设备...')
const isConnected = ref(false)
const signalStrength = ref(85)

// 模拟蓝牙连接
function connectDevice() {
  uni.showLoading({
    title: '连接中...',
  })

  setTimeout(() => {
    uni.hideLoading()
    isConnected.value = true
    bluetoothStatus.value = '设备已连接'
    uni.showToast({
      title: '连接成功',
      icon: 'success',
    })

    // 连接成功后跳转到手动导航页面
    setTimeout(() => {
      uni.navigateTo({
        url: '/pages/ship/manual',
      })
    }, 1500)
  }, 2000)
}

onLoad(() => {
  console.log('船舶管理系统登录页面加载')
})
</script>

<template>
  <view class="login-container" :style="{ paddingTop: `${safeAreaInsets?.top || 0}px` }">
    <!-- 海洋背景 -->
    <view class="ocean-background">
      <image
        src="https://images.unsplash.com/photo-1505142468610-359e7d316be0?w=800&h=400&fit=crop"
        mode="aspectFill"
        class="background-image"
      />
      <view class="background-overlay" />
    </view>

    <!-- 登录内容 -->
    <view class="login-content">
      <view class="login-card">
        <!-- Logo -->
        <view class="logo-section">
          <view class="logo-icon">
            <text class="iconfont icon-ship">
              ⚓
            </text>
          </view>
          <text class="app-title">
            海洋智控
          </text>
          <text class="app-subtitle">
            船舶智能管理系统
          </text>
        </view>

        <!-- 蓝牙连接状态 -->
        <view class="bluetooth-section">
          <view class="bluetooth-status">
            <view class="status-indicator" :class="{ connected: isConnected }" />
            <text class="status-text">
              {{ bluetoothStatus }}
            </text>
          </view>

          <view class="device-card">
            <view class="device-info">
              <text class="device-name">
                主控设备-001
              </text>
              <text class="bluetooth-icon">
                📶
              </text>
            </view>
            <text class="signal-strength">
              信号强度: {{ signalStrength }}%
            </text>
          </view>
        </view>

        <!-- 连接按钮 -->
        <button
          class="connect-button"
          :class="{ connected: isConnected }"
          :disabled="isConnected"
          @click="connectDevice"
        >
          <text class="button-icon">
            🔗
          </text>
          <text class="button-text">
            {{ isConnected ? '已连接' : '连接设备' }}
          </text>
        </button>

        <view class="tips-text">
          请确保蓝牙已开启并靠近设备
        </view>
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.login-container {
  position: relative;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
}

.ocean-background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
}

.background-image {
  width: 100%;
  height: 100%;
  opacity: 0.3;
}

.background-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #0b1426 0%, #1a365d 50%, #2563eb 100%);
  opacity: 0.85;
}

.login-content {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  // padding: 40rpx;
}

.login-card {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px);
  border-radius: 32rpx;
  padding: 60rpx 40rpx;
  width: 100%;
  max-width: 640rpx;
  text-align: center;
  border: 2rpx solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 16rpx 48rpx rgba(0, 0, 0, 0.3);
}

.logo-section {
  margin-bottom: 48rpx;
}

.logo-icon {
  width: 128rpx;
  height: 128rpx;
  background: linear-gradient(135deg, #4fd1c7, #60a5fa);
  border-radius: 50%;
  margin: 0 auto 32rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 48rpx;
  box-shadow: 0 16rpx 32rpx rgba(79, 209, 199, 0.3);
}

.app-title {
  display: block;
  font-size: 48rpx;
  font-weight: bold;
  color: white;
  margin-bottom: 16rpx;
}

.app-subtitle {
  display: block;
  font-size: 28rpx;
  color: rgba(255, 255, 255, 0.7);
}

.bluetooth-section {
  margin-bottom: 48rpx;
}

.bluetooth-status {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 32rpx;
}

.status-indicator {
  width: 24rpx;
  height: 24rpx;
  background: #4fd1c7;
  border-radius: 50%;
  margin-right: 16rpx;
  animation: pulse 2s infinite;

  &.connected {
    background: #10b981;
  }
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

.status-text {
  color: white;
  font-size: 28rpx;
}

.device-card {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 16rpx;
  padding: 24rpx;
  border: 2rpx solid rgba(255, 255, 255, 0.3);
}

.device-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8rpx;
}

.device-name {
  color: white;
  font-size: 28rpx;
}

.bluetooth-icon {
  color: #4fd1c7;
  font-size: 32rpx;
}

.signal-strength {
  color: rgba(255, 255, 255, 0.6);
  font-size: 24rpx;
}

.connect-button {
  width: 100%;
  background: linear-gradient(135deg, #4fd1c7, #60a5fa);
  color: white;
  font-weight: 600;
  padding: 24rpx;
  border-radius: 16rpx;
  border: none;
  font-size: 32rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8rpx 24rpx rgba(79, 209, 199, 0.3);
  transition: all 0.3s ease;
  margin-bottom: 32rpx;

  &:hover {
    transform: translateY(-4rpx);
    box-shadow: 0 12rpx 32rpx rgba(79, 209, 199, 0.4);
  }

  &.connected {
    background: linear-gradient(135deg, #10b981, #059669);
  }

  &:disabled {
    opacity: 0.8;
  }
}

.button-icon {
  margin-right: 16rpx;
  font-size: 28rpx;
}

.tips-text {
  color: rgba(255, 255, 255, 0.6);
  font-size: 24rpx;
}
</style>
