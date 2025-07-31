<template>
  <view class="bottom-menu">
    <view class="menu-container">
      <view 
        v-for="item in menuItems" 
        :key="item.id"
        class="menu-item"
        :class="{ active: activeMenu === item.id }"
        @click="handleMenuClick(item)"
      >
        <text class="menu-icon">{{ item.icon }}</text>
        <text class="menu-label">{{ item.label }}</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

interface MenuItem {
  id: string
  label: string
  icon: string
  page: string
}

const props = defineProps<{
  activeMenu?: string
}>()

const emit = defineEmits<{
  menuChange: [menuId: string]
}>()

// 菜单项配置
const menuItems: MenuItem[] = [
  {
    id: 'manual',
    label: '手动导航',
    icon: '🧭',
    page: '/pages/ship/manual'
  },
  {
    id: 'cruise',
    label: '自动巡航',
    icon: '🚢',
    page: '/pages/ship/cruise'
  },
  {
    id: 'ai',
    label: 'AI管理',
    icon: '🧠',
    page: '/pages/ship/ai'
  },
  {
    id: 'management',
    label: '综合管理',
    icon: '⚙️',
    page: '/pages/ship/management'
  }
]

const activeMenu = computed(() => props.activeMenu || 'manual')

// 菜单点击处理
function handleMenuClick(item: MenuItem) {
  if (item.id === activeMenu.value) return
  
  emit('menuChange', item.id)
  
  uni.navigateTo({
    url: item.page,
    fail: () => {
      uni.switchTab({
        url: item.page
      })
    }
  })
}
</script>

<style lang="scss" scoped>
.bottom-menu {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(15px);
  border-top: 2rpx solid rgba(255, 255, 255, 0.2);
  z-index: 1000;
  padding-bottom: env(safe-area-inset-bottom);
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
  padding: 16rpx 8rpx;

  &:hover,
  &.active {
    color: #4fd1c7;
    background: rgba(79, 209, 199, 0.1);
  }
}

.menu-icon {
  font-size: 40rpx;
  margin-bottom: 8rpx;
}

.menu-label {
  font-size: 22rpx;
  font-weight: 500;
  text-align: center;
}
</style>
