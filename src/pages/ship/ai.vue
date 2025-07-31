<route lang="jsonc">
{
  "style": {
    "navigationStyle": "custom",
    "navigationBarTitleText": "AI管理"
  }
}
</route>

<script lang="ts" setup>
defineOptions({
  name: 'ShipAI',
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
const activeMenu = ref('ai')

// 累计航行数据
const cumulativeData = ref({
  totalDistance: 1847.6, // 累计航行里程
  totalEnergyConsumption: 356.8, // 总消耗电量
  singleTripDistance: 45.2, // 单次里程
  singleTripEnergy: 12.3, // 单次消耗电量
  optimizedSpeed: 8.5, // 优化航速
  optimizedRange: 52.8, // 优化航程
})

// 电池状态数据
const batteryData = ref({
  main: { level: 18, voltage: 12.1, status: 'critical' },
  backup: { level: 76, voltage: 12.8, status: 'good' },
  isLowBattery: true, // 低于20%预警
  estimatedTime: '2.5小时', // 预计续航时间
})

// 历史轨迹数据
const historyTracks = ref([
  { id: 1, date: '2024-01-15', distance: 23.5, duration: '3小时15分', energy: 8.2 },
  { id: 2, date: '2024-01-14', distance: 18.7, duration: '2小时30分', energy: 6.1 },
  { id: 3, date: '2024-01-13', distance: 31.2, duration: '4小时05分', energy: 11.8 },
  { id: 4, date: '2024-01-12', distance: 15.3, duration: '2小时10分', energy: 4.9 },
  { id: 5, date: '2024-01-11', distance: 27.8, duration: '3小时45分', energy: 9.7 },
])

// 能效分析数据
const efficiencyData = ref([
  { speed: 6, efficiency: 95, range: 58 },
  { speed: 8, efficiency: 88, range: 52 },
  { speed: 10, efficiency: 78, range: 45 },
  { speed: 12, efficiency: 65, range: 38 },
  { speed: 14, efficiency: 52, range: 31 },
])

// 菜单项配置
const menuItems = [
  { id: 'manual', icon: '🎮', label: '手动导航', page: '/pages/ship/manual' },
  { id: 'cruise', icon: '🗺️', label: '自动巡航', page: '/pages/ship/cruise' },
  { id: 'ai', icon: '🧠', label: 'AI管理', page: '/pages/ship/ai' },
  { id: 'management', icon: '⚙️', label: '综合管理', page: '/pages/ship/management' },
]

// 获取电池状态样式类
function getBatteryClass(status: string) {
  switch (status) {
    case 'critical': return 'critical'
    case 'warning': return 'warning'
    case 'good': return 'good'
    default: return 'good'
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

// 查看历史轨迹详情
function viewTrackDetail(track: any) {
  uni.showModal({
    title: `${track.date} 航行记录`,
    content: `航行距离: ${track.distance}km\n航行时长: ${track.duration}\n能耗: ${track.energy}kWh\n平均速度: ${(track.distance / Number.parseFloat(track.duration)).toFixed(1)}节`,
    showCancel: false,
  })
}

// 优化建议
function getOptimizationSuggestion() {
  const bestEfficiency = efficiencyData.value.reduce((prev, current) =>
    prev.efficiency > current.efficiency ? prev : current,
  )

  uni.showModal({
    title: 'AI优化建议',
    content: `建议航速: ${bestEfficiency.speed}节\n能效: ${bestEfficiency.efficiency}%\n预计航程: ${bestEfficiency.range}km\n\n当前电池状态较低，建议启用节能模式并降低航速。`,
    showCancel: false,
  })
}

// 电池预警处理
function handleBatteryWarning() {
  if (batteryData.value.isLowBattery) {
    uni.showModal({
      title: '电池预警',
      content: `主电池电量已低于20%！\n当前电量: ${batteryData.value.main.level}%\n预计续航: ${batteryData.value.estimatedTime}\n\n建议立即返航或寻找充电点。`,
      confirmText: '返航',
      cancelText: '继续',
      success: (res) => {
        if (res.confirm) {
          uni.showToast({ title: '启动自动返航', icon: 'success' })
        }
      },
    })
  }
}

onLoad(() => {
  console.log('AI管理页面加载')
})
</script>

<template>
  <view class="ai-container" :style="{ paddingTop: `${safeAreaInsets?.top || 0}px` }">
    <!-- 电池预警横幅 -->
    <view v-if="batteryData.isLowBattery" class="battery-warning" @click="handleBatteryWarning">
      <text class="warning-icon">
        ⚠️
      </text>
      <text class="warning-text">
        电池电量低于20%！点击查看详情
      </text>
      <text class="warning-level">
        {{ batteryData.main.level }}%
      </text>
    </view>

    <!-- 主要内容区域 -->
    <scroll-view class="content-area" scroll-y>
      <!-- 累计航行数据 -->
      <view class="section-title">
        <text class="title-icon">
          📊
        </text>
        <text class="title-text">
          累计航行数据
        </text>
      </view>

      <view class="cumulative-grid">
        <view class="data-card">
          <text class="data-label">
            累计航行里程
          </text>
          <text class="data-value">
            {{ cumulativeData.totalDistance }}
          </text>
          <text class="data-unit">
            海里
          </text>
        </view>
        <view class="data-card">
          <text class="data-label">
            总消耗电量
          </text>
          <text class="data-value">
            {{ cumulativeData.totalEnergyConsumption }}
          </text>
          <text class="data-unit">
            kWh
          </text>
        </view>
        <view class="data-card">
          <text class="data-label">
            单次里程
          </text>
          <text class="data-value">
            {{ cumulativeData.singleTripDistance }}
          </text>
          <text class="data-unit">
            海里
          </text>
        </view>
        <view class="data-card">
          <text class="data-label">
            单次消耗电量
          </text>
          <text class="data-value">
            {{ cumulativeData.singleTripEnergy }}
          </text>
          <text class="data-unit">
            kWh
          </text>
        </view>
        <view class="data-card">
          <text class="data-label">
            优化航速
          </text>
          <text class="data-value">
            {{ cumulativeData.optimizedSpeed }}
          </text>
          <text class="data-unit">
            节
          </text>
        </view>
        <view class="data-card">
          <text class="data-label">
            优化航程
          </text>
          <text class="data-value">
            {{ cumulativeData.optimizedRange }}
          </text>
          <text class="data-unit">
            海里
          </text>
        </view>
      </view>

      <!-- 历史轨迹查询 -->
      <view class="section-title">
        <text class="title-icon">
          🗺️
        </text>
        <text class="title-text">
          历史轨迹查询
        </text>
      </view>

      <view class="history-tracks">
        <view
          v-for="track in historyTracks"
          :key="track.id"
          class="track-item"
          @click="viewTrackDetail(track)"
        >
          <view class="track-date">
            {{ track.date }}
          </view>
          <view class="track-details">
            <view class="track-info">
              <text class="info-label">
                距离:
              </text>
              <text class="info-value">
                {{ track.distance }}km
              </text>
            </view>
            <view class="track-info">
              <text class="info-label">
                时长:
              </text>
              <text class="info-value">
                {{ track.duration }}
              </text>
            </view>
            <view class="track-info">
              <text class="info-label">
                能耗:
              </text>
              <text class="info-value">
                {{ track.energy }}kWh
              </text>
            </view>
          </view>
          <text class="track-arrow">
            >
          </text>
        </view>
      </view>

      <!-- 电池预警功能 -->
      <view class="section-title">
        <text class="title-icon">
          🔋
        </text>
        <text class="title-text">
          电池预警功能
        </text>
      </view>

      <view class="battery-warning-section">
        <view class="battery-status-card">
          <view class="battery-visual">
            <view class="battery-shell">
              <view
                class="battery-fill"
                :class="getBatteryClass(batteryData.main.status)"
                :style="{ width: `${batteryData.main.level}%` }"
              />
            </view>
            <text class="battery-percentage" :class="getBatteryClass(batteryData.main.status)">
              {{ batteryData.main.level }}%
            </text>
          </view>

          <view class="battery-info">
            <view class="info-row">
              <text class="info-label">
                主电池电压:
              </text>
              <text class="info-value">
                {{ batteryData.main.voltage }}V
              </text>
            </view>
            <view class="info-row">
              <text class="info-label">
                备用电池:
              </text>
              <text class="info-value">
                {{ batteryData.backup.level }}%
              </text>
            </view>
            <view class="info-row">
              <text class="info-label">
                预计续航:
              </text>
              <text class="info-value">
                {{ batteryData.estimatedTime }}
              </text>
            </view>
          </view>
        </view>

        <view v-if="batteryData.isLowBattery" class="warning-actions">
          <button class="action-btn emergency" @click="handleBatteryWarning">
            <text class="btn-icon">
              🚨
            </text>
            <text class="btn-text">
              紧急返航
            </text>
          </button>
          <button class="action-btn optimize" @click="getOptimizationSuggestion">
            <text class="btn-icon">
              ⚡
            </text>
            <text class="btn-text">
              节能模式
            </text>
          </button>
        </view>
      </view>

      <!-- AI优化建议 -->
      <view class="section-title">
        <text class="title-icon">
          🤖
        </text>
        <text class="title-text">
          AI优化建议
        </text>
      </view>

      <view class="optimization-section">
        <view class="efficiency-chart">
          <view class="chart-title">
            速度-能效关系图
          </view>
          <view class="chart-container">
            <view
              v-for="data in efficiencyData"
              :key="data.speed"
              class="chart-bar"
              :style="{ height: `${data.efficiency}%` }"
            >
              <text class="bar-label">
                {{ data.speed }}节
              </text>
              <text class="bar-value">
                {{ data.efficiency }}%
              </text>
            </view>
          </view>
        </view>

        <button class="optimization-btn" @click="getOptimizationSuggestion">
          <text class="btn-icon">
            🎯
          </text>
          <text class="btn-text">
            获取AI优化建议
          </text>
        </button>
      </view>
    </scroll-view>

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
.ai-container {
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

.ai-icon {
  color: #4fd1c7;
  font-size: 28rpx;
}

.title {
  color: white;
  font-size: 28rpx;
  font-weight: 600;
}

.ai-status {
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

.battery-summary {
  display: flex;
  align-items: center;
  gap: 8rpx;
}

.summary-text {
  color: white;
  font-size: 20rpx;
}

.summary-value {
  color: #4fd1c7;
  font-size: 20rpx;

  &.warning {
    color: #f59e0b;
  }
}

.content-area {
  flex: 1;
  // padding: 32rpx;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 16rpx;
  margin-bottom: 32rpx;
  margin-top: 32rpx;

  &:first-child {
    margin-top: 0;
  }
}

.title-icon {
  font-size: 32rpx;
}

.title-text {
  color: white;
  font-size: 32rpx;
  font-weight: 600;
}

.battery-grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 24rpx;
  margin-bottom: 48rpx;
}

.battery-card,
.solar-card {
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(15px);
  border: 2rpx solid rgba(255, 255, 255, 0.2);
  border-radius: 24rpx;
  padding: 32rpx;
  text-align: center;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(0, 0, 0, 0.7);
    border-color: rgba(79, 209, 199, 0.5);
    transform: translateY(-4rpx);
  }
}

.battery-indicator {
  width: 120rpx;
  height: 60rpx;
  border: 4rpx solid rgba(255, 255, 255, 0.3);
  border-radius: 8rpx;
  background: rgba(0, 0, 0, 0.3);
  margin: 0 auto 24rpx;
  position: relative;
  overflow: hidden;
}

.battery-level {
  height: 100%;
  border-radius: 4rpx;
  transition: all 0.3s ease;

  &.critical {
    background: linear-gradient(90deg, #ef4444, #dc2626);
    animation: batteryPulse 1.5s infinite;
  }

  &.warning {
    background: linear-gradient(90deg, #f59e0b, #d97706);
  }

  &.good {
    background: linear-gradient(90deg, #10b981, #059669);
  }
}

.battery-label,
.solar-label {
  display: block;
  color: white;
  font-size: 24rpx;
  margin-bottom: 16rpx;
}

.battery-percentage,
.solar-power {
  display: block;
  font-size: 36rpx;
  font-weight: bold;
  margin-bottom: 16rpx;

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

.solar-power {
  color: #f59e0b;
}

.battery-status,
.solar-status {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12rpx;
  margin-bottom: 16rpx;
}

.status-indicator {
  width: 16rpx;
  height: 16rpx;
  border-radius: 50%;

  &.critical {
    background: #ef4444;
    animation: pulse 2s infinite;
  }

  &.warning {
    background: #f59e0b;
  }

  &.good {
    background: #10b981;
  }
}

.status-label {
  font-size: 20rpx;

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

.battery-voltage {
  color: rgba(255, 255, 255, 0.6);
  font-size: 20rpx;
}

.solar-icon {
  width: 96rpx;
  height: 96rpx;
  background: linear-gradient(135deg, #f59e0b, #d97706);
  border-radius: 50%;
  margin: 0 auto 24rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon {
  font-size: 48rpx;
}

.energy-analysis {
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(15px);
  border: 2rpx solid rgba(255, 255, 255, 0.2);
  border-radius: 24rpx;
  padding: 32rpx;
  margin-bottom: 48rpx;
}

.energy-chart {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.energy-item {
  display: flex;
  align-items: center;
  gap: 24rpx;
}

.energy-name {
  color: rgba(255, 255, 255, 0.7);
  font-size: 24rpx;
  width: 120rpx;
  flex-shrink: 0;
}

.energy-bar {
  flex: 1;
  height: 16rpx;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8rpx;
  overflow: hidden;
}

.energy-fill {
  height: 100%;
  border-radius: 8rpx;
  transition: all 0.3s ease;
}

.energy-percentage {
  font-size: 24rpx;
  font-weight: bold;
  width: 60rpx;
  text-align: right;
  flex-shrink: 0;
}

.operation-stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24rpx;
  margin-bottom: 48rpx;
}

.stat-item {
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(15px);
  border: 2rpx solid rgba(255, 255, 255, 0.2);
  border-radius: 16rpx;
  padding: 24rpx;
  text-align: center;
}

.stat-label {
  display: block;
  color: rgba(255, 255, 255, 0.7);
  font-size: 24rpx;
  margin-bottom: 12rpx;
}

.stat-value {
  display: block;
  color: #4fd1c7;
  font-size: 28rpx;
  font-weight: bold;
  font-family: monospace;

  &.warning {
    color: #f59e0b;
  }
}

.ai-suggestions {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.suggestion-card {
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(15px);
  border: 2rpx solid rgba(255, 255, 255, 0.2);
  border-radius: 16rpx;
  padding: 24rpx;
}

.suggestion-header {
  display: flex;
  align-items: center;
  gap: 16rpx;
  margin-bottom: 16rpx;
}

.suggestion-icon {
  font-size: 32rpx;
}

.suggestion-title {
  color: white;
  font-size: 28rpx;
  font-weight: 600;
}

.suggestion-content {
  color: rgba(255, 255, 255, 0.8);
  font-size: 24rpx;
  line-height: 1.5;
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

@keyframes batteryPulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.6;
  }
}
</style>
