<route lang="jsonc">
{
  "style": {
    "navigationStyle": "custom",
    "navigationBarTitleText": "主控台"
  }
}
</route>

<script lang="ts" setup>
defineOptions({
  name: 'ShipDashboard',
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

// 当前活跃的菜单项
const activeMenu = ref('dashboard')

// 系统状态数据
const systemStatus = ref({
  onlineShips: 7,
  signalQuality: '良好',
  currentTime: '14:32'
})

// 菜单项配置
const menuItems = [
  { id: 'manual', icon: '🎮', label: '手动导航', page: '/pages/ship/manual' },
  { id: 'cruise', icon: '🗺️', label: '自动巡航', page: '/pages/ship/cruise' },
  { id: 'ai', icon: '🧠', label: 'AI管理', page: '/pages/ship/ai' },
  { id: 'management', icon: '⚙️', label: '综合管理', page: '/pages/ship/management' }
]

// 地图中心点和船只数据
const mapCenter = ref({
  latitude: 26.0614,
  longitude: 119.3061
})

const ships = ref([
  { id: 1, name: '海巡001', latitude: 26.0614, longitude: 119.3061, status: 'online' },
  { id: 2, name: '海巡002', latitude: 26.0624, longitude: 119.3071, status: 'online' },
  { id: 3, name: '海巡003', latitude: 26.0604, longitude: 119.3051, status: 'warning' }
])

// 菜单点击处理
const handleMenuClick = (item: any) => {
  if (item.id === 'dashboard') {
    activeMenu.value = 'dashboard'
    return
  }
  
  activeMenu.value = item.id
  uni.navigateTo({
    url: item.page
  })
}

// 地图标记点击处理
const handleMarkerTap = (e: any) => {
  const markerId = e.detail.markerId
  const ship = ships.value.find(s => s.id === markerId)
  if (ship) {
    uni.showModal({
      title: ship.name,
      content: `状态: ${ship.status === 'online' ? '在线' : '警告'}\n位置: ${ship.latitude}, ${ship.longitude}`,
      showCancel: false
    })
  }
}

// 更新时间
const updateTime = () => {
  const now = new Date()
  systemStatus.value.currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
}

onMounted(() => {
  updateTime()
  setInterval(updateTime, 60000) // 每分钟更新一次时间
})

onLoad(() => {
  console.log('主控台页面加载')
})
</script>

<template>
  <view class="dashboard-container" :style="{ paddingTop: `${safeAreaInsets?.top || 0}px` }">
    <!-- 顶部状态栏 -->
    <view class="status-bar">
      <view class="status-left">
        <view class="title-section">
          <text class="anchor-icon">⚓</text>
          <text class="title">福建海域监控中心</text>
        </view>
        <view class="online-status">
          <view class="status-dot"></view>
          <text class="status-text">系统在线</text>
        </view>
      </view>
      
      <view class="status-right">
        <view class="status-item">
          <text class="status-icon">🚢</text>
          <text class="status-value">{{ systemStatus.onlineShips }}艘在线</text>
        </view>
        <view class="status-item">
          <text class="status-icon">📡</text>
          <text class="status-value">信号{{ systemStatus.signalQuality }}</text>
        </view>
        <view class="status-item">
          <text class="status-icon">🕐</text>
          <text class="status-value">{{ systemStatus.currentTime }}</text>
        </view>
      </view>
    </view>
    
    <!-- 地图区域 -->
    <view class="map-container">
      <map
        id="shipMap"
        class="map"
        :latitude="mapCenter.latitude"
        :longitude="mapCenter.longitude"
        :scale="13"
        :markers="ships.map(ship => ({
          id: ship.id,
          latitude: ship.latitude,
          longitude: ship.longitude,
          iconPath: ship.status === 'online' ? '/static/images/ship-online.png' : '/static/images/ship-warning.png',
          width: 30,
          height: 30,
          title: ship.name
        }))"
        @markertap="handleMarkerTap"
      >
      </map>
      
      <!-- 地图上的船只信息悬浮窗 -->
      <view class="ship-info-overlay">
        <view class="info-card">
          <text class="info-title">实时监控</text>
          <text class="info-detail">{{ systemStatus.onlineShips }}艘船只在线</text>
        </view>
      </view>
    </view>
    
    <!-- 底部菜单栏 -->
    <view class="bottom-menu">
      <view class="menu-container">
        <view 
          class="menu-item"
          :class="{ 'active': activeMenu === 'dashboard' }"
          @click="handleMenuClick({ id: 'dashboard' })"
        >
          <text class="menu-icon">🏠</text>
          <text class="menu-label">主控台</text>
        </view>
        
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
.dashboard-container {
  width: 100vw;
  height: 100vh;
  background: #0B1426;
  display: flex;
  flex-direction: column;
}

.status-bar {
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(10px);
  padding: 24rpx 32rpx;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 2rpx solid rgba(255, 255, 255, 0.2);
  z-index: 1000;
}

.status-left {
  display: flex;
  align-items: center;
  gap: 32rpx;
}

.title-section {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.anchor-icon {
  color: #4FD1C7;
  font-size: 32rpx;
}

.title {
  color: white;
  font-size: 32rpx;
  font-weight: 600;
}

.online-status {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.status-dot {
  width: 16rpx;
  height: 16rpx;
  background: #10B981;
  border-radius: 50%;
  animation: pulse 2s infinite;
}

.status-text {
  color: #10B981;
  font-size: 24rpx;
}

.status-right {
  display: flex;
  align-items: center;
  gap: 48rpx;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 8rpx;
}

.status-icon {
  font-size: 24rpx;
}

.status-value {
  color: white;
  font-size: 24rpx;
}

.map-container {
  flex: 1;
  position: relative;
}

.map {
  width: 100%;
  height: 100%;
}

.ship-info-overlay {
  position: absolute;
  top: 32rpx;
  right: 32rpx;
  z-index: 100;
}

.info-card {
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(10px);
  border-radius: 16rpx;
  padding: 24rpx;
  border: 2rpx solid rgba(255, 255, 255, 0.2);
}

.info-title {
  display: block;
  color: #4FD1C7;
  font-size: 28rpx;
  font-weight: 600;
  margin-bottom: 8rpx;
}

.info-detail {
  display: block;
  color: white;
  font-size: 24rpx;
}

.bottom-menu {
  background: rgba(0, 0, 0, 0.8);
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
    background: rgba(79, 209, 199, 0.1);
    
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
</style>
