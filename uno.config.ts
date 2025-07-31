// https://www.npmjs.com/package/@uni-helper/unocss-preset-uni
import { presetUni } from '@uni-helper/unocss-preset-uni'
import {
  defineConfig,
  presetAttributify,
  presetIcons,
  transformerDirectives,
  transformerVariantGroup,
} from 'unocss'

export default defineConfig({
  presets: [
    presetUni({
      attributify: {
        // prefix: 'fg-', // 如果加前缀，则需要在代码里面使用 `fg-` 前缀，如：<div fg-border="1px solid #000"></div>
        prefixedOnly: true,
      },
    }),
    presetIcons({
      scale: 1.2,
      warn: true,
      extraProperties: {
        'display': 'inline-block',
        'vertical-align': 'middle',
      },
    }),
    // 支持css class属性化
    presetAttributify(),
  ],
  transformers: [
    // 启用指令功能：主要用于支持 @apply、@screen 和 theme() 等 CSS 指令
    transformerDirectives(),
    // 启用 () 分组功能
    // 支持css class组合，eg: `<div class="hover:(bg-gray-400 font-medium) font-(light mono)">测试 unocss</div>`
    transformerVariantGroup(),
  ],
  shortcuts: [
    {
      center: 'flex justify-center items-center',
      'ocean-bg': 'bg-gradient-to-br from-ocean-blue via-ocean-light to-blue-900',
      'ocean-card': 'bg-black/60 backdrop-blur-15 border border-white/20 rounded-16',
      'ocean-btn': 'bg-gradient-to-r from-ocean-accent to-blue-400 text-white font-semibold rounded-lg transition-all duration-300',
      'ocean-btn-hover': 'hover:from-teal-500 hover:to-blue-500 hover:shadow-lg',
      'glass-panel': 'bg-white/10 backdrop-blur-20 border border-white/20',
      'status-online': 'bg-green-500 animate-pulse',
      'status-warning': 'bg-yellow-500 animate-pulse',
      'status-error': 'bg-red-500 animate-pulse',
      'status-offline': 'bg-gray-500',
    },
  ],
  safelist: [],
  rules: [
    [
      'p-safe',
      {
        padding:
          'env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left)',
      },
    ],
    ['pt-safe', { 'padding-top': 'env(safe-area-inset-top)' }],
    ['pb-safe', { 'padding-bottom': 'env(safe-area-inset-bottom)' }],
    // 船舶管理系统专用样式
    ['joystick-container', {
      'width': '320rpx',
      'height': '320rpx',
      'border-radius': '50%',
      'background': 'radial-gradient(circle, rgba(79,209,199,0.1) 0%, rgba(0,0,0,0.8) 70%)',
      'border': '6rpx solid rgba(79,209,199,0.5)',
      'backdrop-filter': 'blur(15px)',
    }],
    ['ship-status-card', {
      'background': 'rgba(0,0,0,0.6)',
      'backdrop-filter': 'blur(15px)',
      'border': '2rpx solid rgba(255,255,255,0.2)',
      'border-radius': '16rpx',
      'padding': '24rpx',
    }],
    ['ocean-gradient', {
      'background': 'linear-gradient(135deg, #0b1426 0%, #1a365d 50%, #2563eb 100%)',
    }],
  ],
  theme: {
    colors: {
      /** 主题色，用法如: text-primary */
      primary: 'var(--wot-color-theme,#0957DE)',
      /** 海洋主题色彩 */
      'ocean-blue': '#0B1426',
      'ocean-light': '#1A365D',
      'ocean-accent': '#4FD1C7',
      'ocean-warning': '#F56565',
      'ocean-success': '#10B981',
      'ocean-info': '#3B82F6',
    },
    fontSize: {
      /** 提供更小号的字体，用法如：text-2xs */
      '2xs': ['20rpx', '28rpx'],
      '3xs': ['18rpx', '26rpx'],
    },
  },
})
