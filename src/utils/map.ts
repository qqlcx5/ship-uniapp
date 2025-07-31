import type { LatLngExpression, Map as LeafletMap, Marker } from 'leaflet'

// 地图配置
export const MAP_CONFIG = {
  // 福建海域中心点
  DEFAULT_CENTER: [26.0614, 119.3061] as LatLngExpression,
  DEFAULT_ZOOM: 12,
  MIN_ZOOM: 8,
  MAX_ZOOM: 18,
  
  // 高德地图瓦片服务
  AMAP_TILE_URL: 'https://webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}',
  AMAP_SUBDOMAINS: ['1', '2', '3', '4'],
  
  // 船舶图标配置
  SHIP_ICON_SIZE: [40, 40] as [number, number],
  SHIP_ICON_ANCHOR: [20, 20] as [number, number],
}

// 船舶数据接口
export interface ShipData {
  id: number
  name: string
  latitude: number
  longitude: number
  heading: number
  status: 'active' | 'standby' | 'offline'
  speed?: number
  battery?: number
}

// 路径点接口
export interface PathPoint {
  id: string
  latitude: number
  longitude: number
  order: number
}

// 地图工具类
export class MapUtils {
  /**
   * 计算两点之间的距离（海里）
   */
  static calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371 // 地球半径（公里）
    const dLat = this.toRadians(lat2 - lat1)
    const dLng = this.toRadians(lng2 - lng1)
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    const distance = R * c
    return distance * 0.539957 // 转换为海里
  }

  /**
   * 角度转弧度
   */
  static toRadians(degrees: number): number {
    return degrees * (Math.PI / 180)
  }

  /**
   * 弧度转角度
   */
  static toDegrees(radians: number): number {
    return radians * (180 / Math.PI)
  }

  /**
   * 计算航向角度
   */
  static calculateBearing(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const dLng = this.toRadians(lng2 - lng1)
    const lat1Rad = this.toRadians(lat1)
    const lat2Rad = this.toRadians(lat2)
    
    const y = Math.sin(dLng) * Math.cos(lat2Rad)
    const x = Math.cos(lat1Rad) * Math.sin(lat2Rad) - 
              Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLng)
    
    const bearing = this.toDegrees(Math.atan2(y, x))
    return (bearing + 360) % 360
  }

  /**
   * 根据当前位置、航向和距离计算新位置
   */
  static calculateNewPosition(lat: number, lng: number, bearing: number, distance: number): [number, number] {
    const R = 6371 // 地球半径（公里）
    const d = distance * 1.852 // 海里转公里
    
    const bearingRad = this.toRadians(bearing)
    const latRad = this.toRadians(lat)
    const lngRad = this.toRadians(lng)
    
    const newLatRad = Math.asin(
      Math.sin(latRad) * Math.cos(d / R) +
      Math.cos(latRad) * Math.sin(d / R) * Math.cos(bearingRad)
    )
    
    const newLngRad = lngRad + Math.atan2(
      Math.sin(bearingRad) * Math.sin(d / R) * Math.cos(latRad),
      Math.cos(d / R) - Math.sin(latRad) * Math.sin(newLatRad)
    )
    
    return [this.toDegrees(newLatRad), this.toDegrees(newLngRad)]
  }

  /**
   * 格式化坐标显示
   */
  static formatCoordinate(value: number, type: 'lat' | 'lng'): string {
    const direction = type === 'lat' 
      ? (value >= 0 ? 'N' : 'S')
      : (value >= 0 ? 'E' : 'W')
    
    const absValue = Math.abs(value)
    const degrees = Math.floor(absValue)
    const minutes = (absValue - degrees) * 60
    
    return `${degrees}°${minutes.toFixed(3)}'${direction}`
  }

  /**
   * 创建船舶图标HTML
   */
  static createShipIconHtml(ship: ShipData): string {
    const statusColor = {
      active: '#10B981',
      standby: '#F59E0B', 
      offline: '#EF4444'
    }[ship.status]

    return `
      <div style="
        width: 40px;
        height: 40px;
        position: relative;
        transform: rotate(${ship.heading}deg);
      ">
        <div style="
          width: 100%;
          height: 100%;
          background: ${statusColor};
          border-radius: 50% 50% 50% 0;
          border: 2px solid white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          color: white;
        ">
          ⚓
        </div>
        <div style="
          position: absolute;
          top: -25px;
          left: 50%;
          transform: translateX(-50%) rotate(-${ship.heading}deg);
          background: rgba(0,0,0,0.8);
          color: white;
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 10px;
          white-space: nowrap;
          pointer-events: none;
        ">
          ${ship.name}
        </div>
      </div>
    `
  }

  /**
   * 生成路径轨迹的SVG路径
   */
  static generatePathSvg(points: PathPoint[]): string {
    if (points.length < 2) return ''
    
    const sortedPoints = points.sort((a, b) => a.order - b.order)
    let path = `M ${sortedPoints[0].longitude} ${sortedPoints[0].latitude}`
    
    for (let i = 1; i < sortedPoints.length; i++) {
      path += ` L ${sortedPoints[i].longitude} ${sortedPoints[i].latitude}`
    }
    
    return path
  }

  /**
   * 计算路径总距离
   */
  static calculatePathDistance(points: PathPoint[]): number {
    if (points.length < 2) return 0
    
    const sortedPoints = points.sort((a, b) => a.order - b.order)
    let totalDistance = 0
    
    for (let i = 1; i < sortedPoints.length; i++) {
      const prev = sortedPoints[i - 1]
      const curr = sortedPoints[i]
      totalDistance += this.calculateDistance(
        prev.latitude, prev.longitude,
        curr.latitude, curr.longitude
      )
    }
    
    return totalDistance
  }

  /**
   * 估算航行时间（小时）
   */
  static estimateNavigationTime(distance: number, speed: number): number {
    return distance / speed
  }

  /**
   * 估算剩余航程（基于当前电量和功耗）
   */
  static estimateRemainingRange(battery: number, powerConsumption: number, speed: number): number {
    // 简化计算：假设线性功耗关系
    const remainingPower = battery / 100 // 剩余电量百分比
    const estimatedHours = remainingPower * 10 // 假设满电可航行10小时
    return estimatedHours * speed
  }
}

// 地图事件类型
export interface MapEvents {
  shipClick: (ship: ShipData) => void
  pathPointAdd: (point: { latitude: number, longitude: number }) => void
  pathPointRemove: (pointId: string) => void
  mapMove: (center: LatLngExpression, zoom: number) => void
}

// 导出默认配置
export default MAP_CONFIG
