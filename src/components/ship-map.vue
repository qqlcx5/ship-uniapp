<template>
  <view class="map-container">
    <map
      id="shipMap"
      class="ship-map"
      :longitude="center[1]"
      :latitude="center[0]"
      :scale="scale"
      :markers="mapMarkers"
      :polyline="polylines"
      :show-location="true"
      :enable-3D="false"
      :show-compass="true"
      :enable-overlooking="false"
      :enable-zoom="true"
      :enable-scroll="true"
      :enable-rotate="false"
      @markertap="onMarkerTap"
      @tap="onMapTap"
      @regionchange="onRegionChange"
    />
    
    <!-- 船只信息浮窗 -->
    <view 
      v-if="selectedShip" 
      class="ship-info-popup"
      :style="{ 
        left: selectedShip.x + 'px', 
        top: selectedShip.y + 'px' 
      }"
    >
      <view class="popup-content">
        <text class="ship-name">{{ selectedShip.name }}</text>
        <text class="ship-coords">
          经度: {{ selectedShip.longitude.toFixed(4) }}°
        </text>
        <text class="ship-coords">
          纬度: {{ selectedShip.latitude.toFixed(4) }}°
        </text>
        <text class="ship-heading">
          航向: {{ selectedShip.heading }}°
        </text>
        <text class="ship-status" :class="selectedShip.status">
          状态: {{ getStatusText(selectedShip.status) }}
        </text>
      </view>
      <view class="popup-arrow" />
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'

interface ShipData {
  id: number
  name: string
  latitude: number
  longitude: number
  heading: number
  status: 'active' | 'idle' | 'warning' | 'offline'
  x?: number
  y?: number
}

const props = defineProps<{
  center: [number, number]
  scale?: number
  ships: ShipData[]
}>()

const emit = defineEmits<{
  shipClick: [ship: ShipData]
  mapClick: [event: any]
  mapReady: []
}>()

const selectedShip = ref<ShipData | null>(null)

// 地图标记点
const mapMarkers = computed(() => {
  return props.ships.map(ship => ({
    id: ship.id,
    latitude: ship.latitude,
    longitude: ship.longitude,
    iconPath: getShipIcon(ship.status),
    rotate: ship.heading,
    width: 40,
    height: 40,
    anchor: { x: 0.5, y: 0.5 },
    callout: {
      content: ship.name,
      color: '#ffffff',
      fontSize: 12,
      borderRadius: 4,
      bgColor: 'rgba(0,0,0,0.7)',
      padding: 8,
      display: 'ALWAYS'
    }
  }))
})

// 航线数据（示例）
const polylines = ref([
  {
    points: [
      { latitude: 26.0614, longitude: 119.3061 },
      { latitude: 26.0714, longitude: 119.3161 },
      { latitude: 26.0814, longitude: 119.3261 }
    ],
    color: '#4fd1c7',
    width: 3,
    dottedLine: false
  }
])

// 获取船只图标
function getShipIcon(status: string): string {
  const icons = {
    active: '/static/icons/ship-active.png',
    idle: '/static/icons/ship-idle.png', 
    warning: '/static/icons/ship-warning.png',
    offline: '/static/icons/ship-offline.png'
  }
  return icons[status as keyof typeof icons] || icons.active
}

// 获取状态文本
function getStatusText(status: string): string {
  const statusMap = {
    active: '航行中',
    idle: '待机',
    warning: '警告',
    offline: '离线'
  }
  return statusMap[status as keyof typeof statusMap] || '未知'
}

// 标记点击事件
function onMarkerTap(e: any) {
  const markerId = e.detail.markerId
  const ship = props.ships.find(s => s.id === markerId)
  if (ship) {
    selectedShip.value = ship
    emit('shipClick', ship)
  }
}

// 地图点击事件
function onMapTap(e: any) {
  selectedShip.value = null
  emit('mapClick', e)
}

// 地图区域变化事件
function onRegionChange(e: any) {
  // 可以在这里处理地图缩放、移动等事件
}

// 监听船只数据变化
watch(() => props.ships, (newShips) => {
  // 更新选中船只的信息
  if (selectedShip.value) {
    const updatedShip = newShips.find(s => s.id === selectedShip.value?.id)
    if (updatedShip) {
      selectedShip.value = updatedShip
    }
  }
}, { deep: true })
</script>

<style lang="scss" scoped>
.map-container {
  position: relative;
  width: 100%;
  height: 100%;
}

.ship-map {
  width: 100%;
  height: 100%;
}

.ship-info-popup {
  position: absolute;
  z-index: 1000;
  transform: translate(-50%, -100%);
  margin-top: -10rpx;
}

.popup-content {
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(15px);
  border: 2rpx solid rgba(255, 255, 255, 0.2);
  border-radius: 12rpx;
  padding: 16rpx;
  min-width: 200rpx;
}

.ship-name {
  display: block;
  color: #4fd1c7;
  font-size: 28rpx;
  font-weight: bold;
  margin-bottom: 8rpx;
}

.ship-coords,
.ship-heading {
  display: block;
  color: rgba(255, 255, 255, 0.8);
  font-size: 24rpx;
  margin-bottom: 4rpx;
  font-family: monospace;
}

.ship-status {
  display: block;
  font-size: 24rpx;
  font-weight: 500;
  margin-top: 8rpx;
  
  &.active { color: #10b981; }
  &.idle { color: #f59e0b; }
  &.warning { color: #ef4444; }
  &.offline { color: #6b7280; }
}

.popup-arrow {
  position: absolute;
  bottom: -8rpx;
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  height: 0;
  border-left: 8rpx solid transparent;
  border-right: 8rpx solid transparent;
  border-top: 8rpx solid rgba(0, 0, 0, 0.8);
}
</style>
