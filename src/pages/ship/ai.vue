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

// AI分析数据
const aiAnalysis = ref({
  performanceScore: 88, // 性能评分
  efficiencyTrend: 'improving', // 效率趋势：improving, stable, declining
  recommendations: [
    '建议在风速低于15节时提高航行速度',
    '电池充电周期建议调整为每48小时一次',
    '推荐在夜间进行低功耗巡航模式',
    '根据历史数据，当前航线可优化15%的能耗',
  ],
  predictedMaintenance: '预计15天后需要进行常规维护',
  weatherOptimization: '根据天气预报，建议明日14:00-18:00进行长距离航行',
  riskAssessment: 'low', // 风险评估：low, medium, high
  learningProgress: 76, // AI学习进度百分比
})

// 智能预测数据
const predictions = ref({
  nextMaintenanceDate: '2024-02-15',
  estimatedLifespan: '预计剩余使用寿命：3.2年',
  optimalOperatingConditions: {
    temperature: '15-25°C',
    windSpeed: '< 20节',
    waveHeight: '< 2米',
  },
  energyOptimization: {
    currentEfficiency: 78,
    potentialImprovement: 12,
    recommendedActions: ['调整螺旋桨转速', '优化航行路线', '改进电池管理'],
  },
})

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

// 获取性能评分样式类
function getScoreClass(score: number) {
  if (score >= 90)
    return 'excellent'
  if (score >= 80)
    return 'good'
  if (score >= 70)
    return 'average'
  return 'poor'
}

// 获取趋势文本
function getTrendText(trend: string) {
  const trendMap = {
    improving: '📈 持续改善',
    stable: '➡️ 保持稳定',
    declining: '📉 需要关注',
  }
  return trendMap[trend as keyof typeof trendMap] || '未知'
}

// 获取风险文本
function getRiskText(risk: string) {
  const riskMap = {
    low: '🟢 低风险',
    medium: '🟡 中等风险',
    high: '🔴 高风险',
  }
  return riskMap[risk as keyof typeof riskMap] || '未知'
}

// 电池预警检查
function checkBatteryWarning() {
  if (batteryData.value.isLowBattery) {
    uni.showModal({
      title: '电池预警',
      content: `当前电量仅剩${batteryData.value.main.level}%，建议立即返航充电！\n预计续航时间：${batteryData.value.estimatedTime}`,
      confirmText: '立即返航',
      cancelText: '继续航行',
      success: (res) => {
        if (res.confirm) {
          // 触发返航逻辑
          uni.showToast({
            title: '正在规划返航路线',
            icon: 'loading',
          })
        }
      },
    })
  }
}

// 优化建议
function getOptimizationSuggestions() {
  const suggestions = []

  if (cumulativeData.value.optimizedSpeed > 10) {
    suggestions.push('建议降低航速至8-10节以提高能效')
  }

  if (batteryData.value.main.level < 30) {
    suggestions.push('电量偏低，建议规划充电计划')
  }

  const avgEfficiency = cumulativeData.value.totalDistance / cumulativeData.value.totalEnergyConsumption
  if (avgEfficiency < 3.0) {
    suggestions.push('能效偏低，建议检查船体状况')
  }

  return suggestions
}

// 返回上一页
function goBack() {
  uni.navigateBack()
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

// 初始化页面
function initializePage() {
  // 检查电池预警
  if (batteryData.value.isLowBattery) {
    setTimeout(() => {
      checkBatteryWarning()
    }, 1000)
  }

  // 显示优化建议
  const suggestions = getOptimizationSuggestions()
  if (suggestions.length > 0) {
    console.log('AI优化建议:', suggestions)
  }
}

onLoad(() => {
  console.log('AI管理页面加载')
  initializePage()
})
</script>

<template>
  <view class="ai-container" :style="{ paddingTop: `${safeAreaInsets?.top || 0}px` }">
    <!-- 顶部状态栏 -->
    <view class="status-bar">
      <view class="status-left">
        <button class="back-button" @click="goBack">
          <text class="back-icon">
            ←
          </text>
        </button>
        <view class="title-section">
          <text class="ai-icon">
            🧠
          </text>
          <text class="title">
            AI智能管理
          </text>
        </view>
        <view class="ai-status">
          <view class="status-dot" />
          <text class="status-text">
            AI监控活跃
          </text>
        </view>
      </view>
      <view class="battery-summary">
        <text class="summary-text">
          电池状态:
        </text>
        <text class="summary-value" :class="{ warning: batteryData.isLowBattery }">
          {{ batteryData.main.level }}%{{ batteryData.isLowBattery ? '警告' : '' }}
        </text>
        <text class="summary-text">
          | 预计续航:
        </text>
        <text class="summary-value">
          {{ batteryData.estimatedTime }}
        </text>
      </view>
    </view>

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
    <scroll-view class="content-area" scroll-y enable-flex>
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

      <!-- AI智能分析 -->
      <view class="section-title">
        <text class="title-icon">
          🧠
        </text>
        <text class="title-text">
          AI智能分析
        </text>
      </view>

      <view class="ai-analysis-section">
        <view class="analysis-card">
          <view class="card-header">
            <text class="card-title">
              性能评分
            </text>
            <text class="score-value" :class="getScoreClass(aiAnalysis.performanceScore)">
              {{ aiAnalysis.performanceScore }}/100
            </text>
          </view>
          <view class="progress-bar">
            <view class="progress-fill" :style="{ width: `${aiAnalysis.performanceScore}%` }" />
          </view>
        </view>

        <view class="analysis-card">
          <view class="card-header">
            <text class="card-title">
              效率趋势
            </text>
            <text class="trend-indicator" :class="aiAnalysis.efficiencyTrend">
              {{ getTrendText(aiAnalysis.efficiencyTrend) }}
            </text>
          </view>
        </view>

        <view class="analysis-card">
          <view class="card-header">
            <text class="card-title">
              AI学习进度
            </text>
            <text class="progress-value">
              {{ aiAnalysis.learningProgress }}%
            </text>
          </view>
          <view class="progress-bar">
            <view class="progress-fill learning" :style="{ width: `${aiAnalysis.learningProgress}%` }" />
          </view>
        </view>
      </view>

      <!-- AI建议列表 -->
      <view class="recommendations-section">
        <view class="section-title">
          <text class="title-icon">
            💡
          </text>
          <text class="title-text">
            智能建议
          </text>
        </view>
        <view class="recommendations-list">
          <view
            v-for="(recommendation, index) in aiAnalysis.recommendations"
            :key="index"
            class="recommendation-item"
          >
            <text class="recommendation-icon">
              {{ index + 1 }}
            </text>
            <text class="recommendation-text">
              {{ recommendation }}
            </text>
          </view>
        </view>
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

// 电池预警横幅样式
.battery-warning {
  background: linear-gradient(90deg, #ef4444, #dc2626);
  padding: 24rpx 32rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 2rpx solid rgba(255, 255, 255, 0.2);
  cursor: pointer;
  animation: warningPulse 2s infinite;
}

.warning-icon {
  font-size: 32rpx;
  margin-right: 16rpx;
}

.warning-text {
  flex: 1;
  color: white;
  font-size: 28rpx;
  font-weight: 600;
}

.warning-level {
  color: white;
  font-size: 32rpx;
  font-weight: bold;
}

@keyframes warningPulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.8;
  }
}

// 累计数据网格样式
.cumulative-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24rpx;
  margin-bottom: 48rpx;
}

.data-card {
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(15px);
  border: 2rpx solid rgba(255, 255, 255, 0.2);
  border-radius: 16rpx;
  padding: 24rpx;
  text-align: center;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(79, 209, 199, 0.1);
    border-color: rgba(79, 209, 199, 0.3);
    transform: translateY(-2rpx);
  }
}

.data-label {
  display: block;
  color: rgba(255, 255, 255, 0.7);
  font-size: 24rpx;
  margin-bottom: 12rpx;
}

.data-value {
  display: block;
  color: #4fd1c7;
  font-size: 36rpx;
  font-weight: bold;
  margin-bottom: 8rpx;
  font-family: monospace;
}

.data-unit {
  display: block;
  color: rgba(255, 255, 255, 0.5);
  font-size: 20rpx;
}

// 历史轨迹样式
.history-tracks {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
  margin-bottom: 48rpx;
}

.track-item {
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(15px);
  border: 2rpx solid rgba(255, 255, 255, 0.2);
  border-radius: 16rpx;
  padding: 24rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  transition: all 0.3s ease;
  cursor: pointer;

  &:hover {
    background: rgba(79, 209, 199, 0.1);
    border-color: rgba(79, 209, 199, 0.3);
    transform: translateY(-2rpx);
  }
}

.track-date {
  color: #4fd1c7;
  font-size: 28rpx;
  font-weight: 600;
  margin-bottom: 8rpx;
}

.track-details {
  flex: 1;
  margin-left: 24rpx;
}

.track-info {
  display: flex;
  align-items: center;
  margin-bottom: 4rpx;
}

.info-label {
  color: rgba(255, 255, 255, 0.7);
  font-size: 24rpx;
  margin-right: 8rpx;
}

.info-value {
  color: white;
  font-size: 24rpx;
  font-weight: 500;
}

.track-arrow {
  color: rgba(255, 255, 255, 0.5);
  font-size: 32rpx;
}

// 电池预警功能样式
.battery-warning-section {
  margin-bottom: 48rpx;
}

.battery-status-card {
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(15px);
  border: 2rpx solid rgba(255, 255, 255, 0.2);
  border-radius: 16rpx;
  padding: 32rpx;
  margin-bottom: 24rpx;
}

.battery-visual {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 24rpx;
  gap: 24rpx;
}

.battery-shell {
  width: 120rpx;
  height: 60rpx;
  border: 4rpx solid rgba(255, 255, 255, 0.3);
  border-radius: 8rpx;
  background: rgba(0, 0, 0, 0.3);
  position: relative;
  overflow: hidden;

  &::after {
    content: '';
    position: absolute;
    right: -8rpx;
    top: 50%;
    transform: translateY(-50%);
    width: 8rpx;
    height: 24rpx;
    background: rgba(255, 255, 255, 0.3);
    border-radius: 0 4rpx 4rpx 0;
  }
}

.battery-fill {
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

.battery-percentage {
  font-size: 36rpx;
  font-weight: bold;

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

.battery-info {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.warning-actions {
  display: flex;
  gap: 16rpx;
}

.action-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12rpx;
  padding: 20rpx;
  border-radius: 12rpx;
  border: none;
  font-size: 28rpx;
  font-weight: 600;
  transition: all 0.3s ease;

  &.emergency {
    background: linear-gradient(135deg, #ef4444, #dc2626);
    color: white;
  }

  &.optimize {
    background: linear-gradient(135deg, #f59e0b, #d97706);
    color: white;
  }

  &:hover {
    transform: translateY(-2rpx);
    box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.3);
  }
}

.btn-icon {
  font-size: 24rpx;
}

.btn-text {
  font-size: 24rpx;
}

// AI优化建议样式
.optimization-section {
  margin-bottom: 48rpx;
}

.efficiency-chart {
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(15px);
  border: 2rpx solid rgba(255, 255, 255, 0.2);
  border-radius: 16rpx;
  padding: 32rpx;
  margin-bottom: 24rpx;
}

.chart-title {
  color: white;
  font-size: 28rpx;
  font-weight: 600;
  margin-bottom: 24rpx;
  text-align: center;
}

.chart-container {
  display: flex;
  align-items: end;
  justify-content: space-between;
  height: 200rpx;
  gap: 16rpx;
}

.chart-bar {
  flex: 1;
  background: linear-gradient(to top, #4fd1c7, #60a5fa);
  border-radius: 8rpx 8rpx 0 0;
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  padding: 8rpx;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-4rpx);
    box-shadow: 0 8rpx 16rpx rgba(79, 209, 199, 0.3);
  }
}

.bar-label {
  position: absolute;
  bottom: -32rpx;
  color: rgba(255, 255, 255, 0.7);
  font-size: 20rpx;
  text-align: center;
}

.bar-value {
  color: white;
  font-size: 18rpx;
  font-weight: 600;
  margin-bottom: 8rpx;
}

.optimization-btn {
  width: 100%;
  background: linear-gradient(135deg, #4fd1c7, #60a5fa);
  color: white;
  font-weight: 600;
  padding: 24rpx;
  border-radius: 16rpx;
  border: none;
  font-size: 28rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16rpx;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2rpx);
    box-shadow: 0 8rpx 24rpx rgba(79, 209, 199, 0.3);
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

  &:hover,
  &.active {
    color: #4fd1c7;
    background: rgba(79, 209, 199, 0.1);
  }
}

.menu-icon {
  font-size: 32rpx;
  margin-bottom: 8rpx;
}

.menu-label {
  font-size: 20rpx;
  font-weight: 500;
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
