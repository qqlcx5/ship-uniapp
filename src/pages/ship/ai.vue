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

// 电池状态数据
const batteryData = ref({
  main: { level: 18, voltage: 12.1, status: 'critical' },
  backup: { level: 76, voltage: 12.8, status: 'good' },
  solar: { power: 45, status: 'charging' }
})

// 能耗统计数据
const energyConsumption = ref([
  { name: '推进系统', percentage: 64, color: '#EF4444' },
  { name: '导航设备', percentage: 18, color: '#3B82F6' },
  { name: '通讯系统', percentage: 12, color: '#10B981' },
  { name: '其他设备', percentage: 6, color: '#8B5CF6' }
])

// 运行数据
const operationData = ref({
  totalDistance: 1847.6,
  totalFuelConsumption: 356.8,
  operationTime: '1,247小时',
  maintenanceReminder: '距离下次保养还有15天'
})

// AI分析结果
const aiAnalysis = ref({
  batteryPrediction: '预计续航2.5小时',
  recommendation: '建议启用节能模式',
  alertLevel: 'warning'
})

// 获取电池状态样式类
function getBatteryClass(status: string) {
  switch (status) {
    case 'critical': return 'critical'
    case 'warning': return 'warning'
    case 'good': return 'good'
    default: return 'good'
  }
}

// 返回主控台
function goBack() {
  uni.navigateBack()
}

onLoad(() => {
  console.log('AI管理页面加载')
})
</script>

<template>
  <view class="ai-container" :style="{ paddingTop: `${safeAreaInsets?.top || 0}px` }">
    <!-- 顶部状态栏 -->
    <view class="status-bar">
      <view class="status-left">
        <button class="back-button" @click="goBack">
          <text class="back-icon">←</text>
        </button>
        <view class="title-section">
          <text class="ai-icon">🧠</text>
          <text class="title">AI智能电量管理</text>
        </view>
        <view class="ai-status">
          <view class="status-dot active"></view>
          <text class="status-text">AI监控活跃</text>
        </view>
      </view>
      
      <view class="battery-summary">
        <text class="summary-text">电池状态: </text>
        <text class="summary-value warning">{{ batteryData.main.level }}%警告</text>
        <text class="summary-text"> | 预计续航: </text>
        <text class="summary-value">{{ aiAnalysis.batteryPrediction }}</text>
      </view>
    </view>
    
    <!-- 主要内容区域 -->
    <scroll-view class="content-area" scroll-y>
      <!-- 电池状态监控 -->
      <view class="section-title">
        <text class="title-icon">🔋</text>
        <text class="title-text">电池状态监控</text>
      </view>
      
      <view class="battery-grid">
        <!-- 主电池 -->
        <view class="battery-card">
          <view class="battery-indicator">
            <view 
              class="battery-level"
              :class="getBatteryClass(batteryData.main.status)"
              :style="{ width: `${batteryData.main.level}%` }"
            ></view>
          </view>
          <text class="battery-label">主电池</text>
          <text class="battery-percentage" :class="getBatteryClass(batteryData.main.status)">
            {{ batteryData.main.level }}%
          </text>
          <view class="battery-status">
            <view class="status-indicator" :class="getBatteryClass(batteryData.main.status)"></view>
            <text class="status-label" :class="getBatteryClass(batteryData.main.status)">
              {{ batteryData.main.status === 'critical' ? '低电量警告' : '正常' }}
            </text>
          </view>
          <text class="battery-voltage">{{ batteryData.main.voltage }}V</text>
        </view>
        
        <!-- 备用电池 -->
        <view class="battery-card">
          <view class="battery-indicator">
            <view 
              class="battery-level"
              :class="getBatteryClass(batteryData.backup.status)"
              :style="{ width: `${batteryData.backup.level}%` }"
            ></view>
          </view>
          <text class="battery-label">备用电池</text>
          <text class="battery-percentage" :class="getBatteryClass(batteryData.backup.status)">
            {{ batteryData.backup.level }}%
          </text>
          <view class="battery-status">
            <view class="status-indicator" :class="getBatteryClass(batteryData.backup.status)"></view>
            <text class="status-label" :class="getBatteryClass(batteryData.backup.status)">正常</text>
          </view>
          <text class="battery-voltage">{{ batteryData.backup.voltage }}V</text>
        </view>
        
        <!-- 太阳能充电 -->
        <view class="solar-card">
          <view class="solar-icon">
            <text class="icon">☀️</text>
          </view>
          <text class="solar-label">太阳能</text>
          <text class="solar-power">{{ batteryData.solar.power }}W</text>
          <view class="solar-status">
            <view class="status-indicator good"></view>
            <text class="status-label good">充电中</text>
          </view>
        </view>
      </view>
      
      <!-- 能耗统计分析 -->
      <view class="section-title">
        <text class="title-icon">📊</text>
        <text class="title-text">能耗统计分析</text>
      </view>
      
      <view class="energy-analysis">
        <view class="energy-chart">
          <view 
            v-for="item in energyConsumption" 
            :key="item.name"
            class="energy-item"
          >
            <text class="energy-name">{{ item.name }}</text>
            <view class="energy-bar">
              <view 
                class="energy-fill"
                :style="{ 
                  width: `${item.percentage}%`, 
                  backgroundColor: item.color 
                }"
              ></view>
            </view>
            <text class="energy-percentage" :style="{ color: item.color }">
              {{ item.percentage }}%
            </text>
          </view>
        </view>
      </view>
      
      <!-- 累计运行数据 -->
      <view class="section-title">
        <text class="title-icon">📈</text>
        <text class="title-text">累计运行数据</text>
      </view>
      
      <view class="operation-stats">
        <view class="stat-item">
          <text class="stat-label">总航程</text>
          <text class="stat-value">{{ operationData.totalDistance }} 海里</text>
        </view>
        <view class="stat-item">
          <text class="stat-label">总油耗</text>
          <text class="stat-value">{{ operationData.totalFuelConsumption }} 升</text>
        </view>
        <view class="stat-item">
          <text class="stat-label">运行时间</text>
          <text class="stat-value">{{ operationData.operationTime }}</text>
        </view>
        <view class="stat-item">
          <text class="stat-label">保养提醒</text>
          <text class="stat-value warning">{{ operationData.maintenanceReminder }}</text>
        </view>
      </view>
      
      <!-- AI智能建议 -->
      <view class="section-title">
        <text class="title-icon">🤖</text>
        <text class="title-text">AI智能建议</text>
      </view>
      
      <view class="ai-suggestions">
        <view class="suggestion-card">
          <view class="suggestion-header">
            <text class="suggestion-icon">⚡</text>
            <text class="suggestion-title">电量优化建议</text>
          </view>
          <text class="suggestion-content">{{ aiAnalysis.recommendation }}</text>
        </view>
        
        <view class="suggestion-card">
          <view class="suggestion-header">
            <text class="suggestion-icon">🔧</text>
            <text class="suggestion-title">维护建议</text>
          </view>
          <text class="suggestion-content">建议检查推进系统，能耗偏高</text>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<style lang="scss" scoped>
.ai-container {
  width: 100vw;
  height: 100vh;
  background: linear-gradient(135deg, #0B1426 0%, #1A365D 50%, #2563EB 100%);
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
  color: #4FD1C7;
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
  background: #10B981;
  border-radius: 50%;
  animation: pulse 2s infinite;
}

.status-text {
  color: #10B981;
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
  color: #4FD1C7;
  font-size: 20rpx;
  
  &.warning {
    color: #F59E0B;
  }
}

.content-area {
  flex: 1;
  padding: 32rpx;
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

.battery-card, .solar-card {
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
    background: linear-gradient(90deg, #EF4444, #DC2626);
    animation: batteryPulse 1.5s infinite;
  }
  
  &.warning {
    background: linear-gradient(90deg, #F59E0B, #D97706);
  }
  
  &.good {
    background: linear-gradient(90deg, #10B981, #059669);
  }
}

.battery-label, .solar-label {
  display: block;
  color: white;
  font-size: 24rpx;
  margin-bottom: 16rpx;
}

.battery-percentage, .solar-power {
  display: block;
  font-size: 36rpx;
  font-weight: bold;
  margin-bottom: 16rpx;
  
  &.critical {
    color: #EF4444;
  }
  
  &.warning {
    color: #F59E0B;
  }
  
  &.good {
    color: #10B981;
  }
}

.solar-power {
  color: #F59E0B;
}

.battery-status, .solar-status {
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
    background: #EF4444;
    animation: pulse 2s infinite;
  }
  
  &.warning {
    background: #F59E0B;
  }
  
  &.good {
    background: #10B981;
  }
}

.status-label {
  font-size: 20rpx;
  
  &.critical {
    color: #EF4444;
  }
  
  &.warning {
    color: #F59E0B;
  }
  
  &.good {
    color: #10B981;
  }
}

.battery-voltage {
  color: rgba(255, 255, 255, 0.6);
  font-size: 20rpx;
}

.solar-icon {
  width: 96rpx;
  height: 96rpx;
  background: linear-gradient(135deg, #F59E0B, #D97706);
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
  color: #4FD1C7;
  font-size: 28rpx;
  font-weight: bold;
  font-family: monospace;
  
  &.warning {
    color: #F59E0B;
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
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}

@keyframes batteryPulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}
</style>
