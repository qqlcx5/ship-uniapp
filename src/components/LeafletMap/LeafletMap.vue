<script lang="ts" setup>
import type { LatLngExpression, Map as LeafletMap, Marker, Polyline } from 'leaflet'
import type { PathPoint, ShipData } from '@/utils/map'
import { nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { MAP_CONFIG, MapUtils } from '@/utils/map'

// Props
interface Props {
  center?: LatLngExpression
  zoom?: number
  ships?: ShipData[]
  pathPoints?: PathPoint[]
  showPath?: boolean
  interactive?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  center: () => MAP_CONFIG.DEFAULT_CENTER,
  zoom: MAP_CONFIG.DEFAULT_ZOOM,
  ships: () => [],
  pathPoints: () => [],
  showPath: true,
  interactive: true,
})

const emit = defineEmits<Emits>()

// Emits
interface Emits {
  shipClick: [ship: ShipData]
  mapClick: [event: { latitude: number, longitude: number }]
  pathPointAdd: [point: { latitude: number, longitude: number }]
  pathPointRemove: [pointId: string]
  mapReady: [map: LeafletMap]
}

// Refs
const mapContainer = ref<HTMLDivElement>()
const loading = ref(true)

// Map instance and markers
let map: LeafletMap | null = null
const shipMarkers: Map<number, Marker> = new Map()
const pathMarkers: Map<string, Marker> = new Map()
let pathLine: Polyline | null = null

// 动态导入 Leaflet
let L: any = null

// 初始化地图
async function initMap() {
  try {
    // 动态导入 Leaflet
    L = await import('leaflet')

    // 导入 CSS
    await import('leaflet/dist/leaflet.css')

    if (!mapContainer.value)
      return

    // 创建地图实例
    map = L.map(mapContainer.value, {
      center: props.center,
      zoom: props.zoom,
      minZoom: MAP_CONFIG.MIN_ZOOM,
      maxZoom: MAP_CONFIG.MAX_ZOOM,
      zoomControl: true,
      attributionControl: false,
      interactive: props.interactive,
    })

    // 添加高德地图瓦片层
    L.tileLayer(MAP_CONFIG.AMAP_TILE_URL, {
      subdomains: MAP_CONFIG.AMAP_SUBDOMAINS,
      attribution: '© 高德地图',
    }).addTo(map)

    // 地图点击事件
    map.on('click', (e: any) => {
      const { lat, lng } = e.latlng
      emit('mapClick', { latitude: lat, longitude: lng })
    })

    // 初始化船舶标记
    updateShipMarkers()

    // 初始化路径点和路径线
    updatePathPoints()
    updatePathLine()

    loading.value = false
    emit('mapReady', map)
  }
  catch (error) {
    console.error('地图初始化失败:', error)
    loading.value = false
  }
}

// 更新船舶标记
function updateShipMarkers() {
  if (!map || !L)
    return

  // 清除现有标记
  shipMarkers.forEach(marker => map!.removeLayer(marker))
  shipMarkers.clear()

  // 添加新标记
  props.ships.forEach((ship) => {
    const icon = L.divIcon({
      html: MapUtils.createShipIconHtml(ship),
      className: 'ship-marker',
      iconSize: MAP_CONFIG.SHIP_ICON_SIZE,
      iconAnchor: MAP_CONFIG.SHIP_ICON_ANCHOR,
    })

    const marker = L.marker([ship.latitude, ship.longitude], { icon })
      .addTo(map!)
      .on('click', () => emit('shipClick', ship))

    // 添加弹出窗口
    const popupContent = `
      <div class="ship-popup">
        <h3>${ship.name}</h3>
        <p>经度: ${ship.longitude.toFixed(4)}°</p>
        <p>纬度: ${ship.latitude.toFixed(4)}°</p>
        <p>航向: ${ship.heading}°</p>
        <p>状态: ${ship.status === 'active' ? '活跃' : ship.status === 'standby' ? '待机' : '离线'}</p>
        ${ship.speed ? `<p>速度: ${ship.speed}节</p>` : ''}
        ${ship.battery ? `<p>电量: ${ship.battery}%</p>` : ''}
      </div>
    `
    marker.bindPopup(popupContent)

    shipMarkers.set(ship.id, marker)
  })
}

// 更新路径点标记
function updatePathPoints() {
  if (!map || !L)
    return

  // 清除现有路径点标记
  pathMarkers.forEach(marker => map!.removeLayer(marker))
  pathMarkers.clear()

  // 添加新路径点标记
  props.pathPoints.forEach((point) => {
    const icon = L.divIcon({
      html: `
        <div class="path-point-marker">
          <div class="point-number">${point.order}</div>
        </div>
      `,
      className: 'path-point-icon',
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    })

    const marker = L.marker([point.latitude, point.longitude], { icon })
      .addTo(map!)
      .on('click', () => emit('pathPointRemove', point.id))

    pathMarkers.set(point.id, marker)
  })
}

// 更新路径线
function updatePathLine() {
  if (!map || !L)
    return

  // 移除现有路径线
  if (pathLine) {
    map.removeLayer(pathLine)
    pathLine = null
  }

  // 如果不显示路径或路径点少于2个，则不绘制
  if (!props.showPath || props.pathPoints.length < 2)
    return

  // 按顺序排列路径点
  const sortedPoints = [...props.pathPoints].sort((a, b) => a.order - b.order)
  const latLngs = sortedPoints.map(point => [point.latitude, point.longitude] as LatLngExpression)

  // 创建路径线
  pathLine = L.polyline(latLngs, {
    color: '#4FD1C7',
    weight: 3,
    opacity: 0.8,
    dashArray: '10, 5',
  }).addTo(map)
}

// 监听属性变化
watch(() => props.ships, updateShipMarkers, { deep: true })
watch(() => props.pathPoints, () => {
  updatePathPoints()
  updatePathLine()
}, { deep: true })
watch(() => props.showPath, updatePathLine)

// 公开方法
function setView(center: LatLngExpression, zoom?: number) {
  if (map) {
    map.setView(center, zoom || map.getZoom())
  }
}

function fitBounds(bounds: any) {
  if (map) {
    map.fitBounds(bounds)
  }
}

function getMap() {
  return map
}

// 暴露方法给父组件
defineExpose({
  setView,
  fitBounds,
  getMap,
})

// 生命周期
onMounted(async () => {
  await nextTick()
  await initMap()
})

onUnmounted(() => {
  if (map) {
    map.remove()
    map = null
  }
})
</script>

<template>
  <div ref="mapContainer" class="leaflet-map-container" :style="{ width: '100%', height: '100%' }">
    <!-- 地图加载中 -->
    <div v-if="loading" class="map-loading">
      <div class="loading-spinner" />
      <text class="loading-text">
        地图加载中...
      </text>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.leaflet-map-container {
  position: relative;
  width: 100%;
  height: 100%;
}

.map-loading {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(11, 20, 38, 0.9);
  z-index: 1000;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid rgba(79, 209, 199, 0.3);
  border-top: 4px solid #4fd1c7;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

.loading-text {
  color: white;
  font-size: 14px;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
</style>

<style lang="scss">
// 全局样式，用于 Leaflet 标记
.ship-marker {
  background: transparent !important;
  border: none !important;
}

.path-point-icon {
  background: transparent !important;
  border: none !important;
}

.path-point-marker {
  width: 24px;
  height: 24px;
  background: #4fd1c7;
  border: 2px solid white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  cursor: pointer;
}

.point-number {
  color: white;
  font-size: 12px;
  font-weight: bold;
}

.ship-popup {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;

  h3 {
    margin: 0 0 8px 0;
    color: #1f2937;
    font-size: 16px;
  }

  p {
    margin: 4px 0;
    color: #6b7280;
    font-size: 14px;
  }
}

// Leaflet 控件样式优化
.leaflet-control-zoom {
  border: none !important;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3) !important;
}

.leaflet-control-zoom a {
  background: rgba(0, 0, 0, 0.8) !important;
  color: white !important;
  border: none !important;

  &:hover {
    background: rgba(79, 209, 199, 0.8) !important;
  }
}
</style>
