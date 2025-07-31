#!/usr/bin/env node

/**
 * 船舶智能管理系统项目测试脚本
 * 用于验证项目的基本功能和配置
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚢 船舶智能管理系统 - 项目测试');
console.log('=====================================\n');

// 测试项目结构
function testProjectStructure() {
  console.log('📁 检查项目结构...');

  const requiredFiles = [
    'src/pages/ship/login.vue',
    'src/pages/ship/manual.vue',
    'src/pages/ship/cruise.vue',
    'src/pages/ship/ai.vue',
    'src/pages/ship/management.vue',
    'src/components/ship-map.vue',
    'src/components/ship-bottom-menu.vue',
    'src/styles/ocean-theme.scss',
    'src/pages.json',
    'uno.config.ts',
    'package.json'
  ];

  let allFilesExist = true;

  requiredFiles.forEach(file => {
    const filePath = path.join(__dirname, file);
    if (fs.existsSync(filePath)) {
      console.log(`  ✅ ${file}`);
    } else {
      console.log(`  ❌ ${file} - 文件不存在`);
      allFilesExist = false;
    }
  });

  return allFilesExist;
}

// 测试页面配置
function testPagesConfig() {
  console.log('\n📄 检查页面配置...');

  try {
    const pagesConfigPath = path.join(__dirname, 'src/pages.json');
    const pagesConfig = JSON.parse(fs.readFileSync(pagesConfigPath, 'utf8'));

    // 检查是否包含所有船舶页面
    const requiredPages = [
      'pages/ship/login',
      'pages/ship/manual',
      'pages/ship/cruise',
      'pages/ship/ai',
      'pages/ship/management'
    ];

    const configuredPages = pagesConfig.pages.map(page => page.path);
    let allPagesConfigured = true;

    requiredPages.forEach(page => {
      if (configuredPages.includes(page)) {
        console.log(`  ✅ ${page}`);
      } else {
        console.log(`  ❌ ${page} - 页面未配置`);
        allPagesConfigured = false;
      }
    });

    // 检查是否删除了tabBar配置
    if (!pagesConfig.tabBar) {
      console.log('  ✅ tabBar配置已删除（使用自定义底部菜单）');
    } else {
      console.log('  ⚠️  仍存在tabBar配置');
    }

    // 检查全局样式配置
    if (pagesConfig.globalStyle && pagesConfig.globalStyle.backgroundColor === '#0B1426') {
      console.log('  ✅ 海洋主题背景色已配置');
    } else {
      console.log('  ⚠️  海洋主题背景色未正确配置');
    }

    return allPagesConfigured;
  } catch (error) {
    console.log(`  ❌ 读取pages.json失败: ${error.message}`);
    return false;
  }
}

// 测试UnoCSS配置
function testUnoConfig() {
  console.log('\n🎨 检查UnoCSS配置...');

  try {
    const unoConfigPath = path.join(__dirname, 'uno.config.ts');
    const unoConfig = fs.readFileSync(unoConfigPath, 'utf8');

    // 检查海洋主题色彩配置
    const hasOceanColors = unoConfig.includes('ocean-blue') &&
                          unoConfig.includes('ocean-accent') &&
                          unoConfig.includes('ocean-gradient');

    if (hasOceanColors) {
      console.log('  ✅ 海洋主题色彩已配置');
    } else {
      console.log('  ⚠️  海洋主题色彩配置不完整');
    }

    // 检查船舶专用样式
    const hasShipStyles = unoConfig.includes('joystick-container') ||
                         unoConfig.includes('ship-status-card');

    if (hasShipStyles) {
      console.log('  ✅ 船舶专用样式已配置');
    } else {
      console.log('  ⚠️  船舶专用样式配置不完整');
    }

    return hasOceanColors;
  } catch (error) {
    console.log(`  ❌ 读取uno.config.ts失败: ${error.message}`);
    return false;
  }
}

// 测试依赖包
function testDependencies() {
  console.log('\n📦 检查项目依赖...');

  try {
    const packageJsonPath = path.join(__dirname, 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

    const requiredDeps = [
      '@unocss/preset-uno',
      'vue',
      'typescript'
    ];

    let allDepsPresent = true;

    requiredDeps.forEach(dep => {
      const inDeps = packageJson.dependencies && packageJson.dependencies[dep];
      const inDevDeps = packageJson.devDependencies && packageJson.devDependencies[dep];

      if (inDeps || inDevDeps) {
        console.log(`  ✅ ${dep}`);
      } else {
        console.log(`  ❌ ${dep} - 依赖缺失`);
        allDepsPresent = false;
      }
    });

    return allDepsPresent;
  } catch (error) {
    console.log(`  ❌ 读取package.json失败: ${error.message}`);
    return false;
  }
}

// 生成测试报告
function generateTestReport(results) {
  console.log('\n📊 测试报告');
  console.log('=====================================');

  const totalTests = Object.keys(results).length;
  const passedTests = Object.values(results).filter(result => result).length;
  const score = Math.round((passedTests / totalTests) * 100);

  console.log(`总测试项: ${totalTests}`);
  console.log(`通过测试: ${passedTests}`);
  console.log(`测试得分: ${score}%\n`);

  if (score >= 90) {
    console.log('🎉 项目配置优秀！船舶智能管理系统已准备就绪。');
  } else if (score >= 70) {
    console.log('✅ 项目配置良好，建议修复剩余问题。');
  } else {
    console.log('⚠️  项目配置需要改进，请检查失败的测试项。');
  }

  console.log('\n🚀 建议的下一步操作:');
  console.log('1. 运行 npm run dev 启动开发服务器');
  console.log('2. 在浏览器中测试各个功能页面');
  console.log('3. 检查移动端适配效果');
  console.log('4. 测试蓝牙连接功能（需要真实设备）');
  console.log('5. 验证地图显示和交互功能');
}

// 主测试函数
function runTests() {
  const results = {
    projectStructure: testProjectStructure(),
    pagesConfig: testPagesConfig(),
    unoConfig: testUnoConfig(),
    dependencies: testDependencies()
  };

  generateTestReport(results);
}

// 运行测试
runTests();
