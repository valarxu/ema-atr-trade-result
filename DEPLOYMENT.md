# 部署指南

## 🚀 Vercel 部署步骤

### 方法一：通过 Vercel 网站部署

1. **准备代码**
   - 确保所有文件已保存
   - 项目结构完整（包含 vercel.json）

2. **连接 GitHub**
   - 访问 [vercel.com](https://vercel.com)
   - 点击 "New Project"
   - 连接您的 GitHub 账户
   - 选择本项目仓库

3. **配置项目**
   - Framework Preset: **Other**
   - Build Command: 留空
   - Output Directory: 留空
   - Install Command: `npm install`

4. **环境变量**（可选）
   - 如需自定义端口，可添加 `PORT=8080`

5. **部署**
   - 点击 "Deploy" 按钮
   - 等待构建完成（约1-2分钟）

### 方法二：通过 Vercel CLI 部署

```bash
# 安装 Vercel CLI
npm i -g vercel

# 登录 Vercel
vercel login

# 在项目目录中部署
vercel --prod

# 按提示配置：
# - 项目名称：ema-atr-trading-analyzer
# - 部署目录：当前目录
# - 构建命令：留空
# - 输出目录：留空
```

### 方法三：通过 Git 部署

```bash
# 初始化 git（如果尚未初始化）
git init
git add .
git commit -m "Initial commit"

# 推送到 GitHub
# 1. 在 GitHub 创建新仓库
# 2. 添加远程仓库
git remote add origin https://github.com/yourusername/ema-atr-trading-analyzer.git

# 3. 推送代码
git push -u origin main

# 4. 在 Vercel 网站导入该仓库
```

## 📋 部署配置说明

### vercel.json 配置
```json
{
  "rewrites": [
    { "source": "/api/(.*)", "destination": "/api/$1" },
    { "source": "/(.*)", "destination": "/$1" }
  ],
  "public": true,
  "builds": [
    {
      "src": "server.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/api/coins",
      "dest": "server.js"
    },
    {
      "src": "/(.*)",
      "dest": "server.js"
    }
  ]
}
```

### package.json 配置
```json
{
  "name": "ema-atr-trading-analyzer",
  "version": "1.0.0",
  "description": "EMA-ATR 交易策略数据分析与可视化工具",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "node server.js"
  },
  "engines": {
    "node": ">=14.0.0"
  }
}
```

## 🎯 部署后验证

### 1. 检查部署状态
- 访问 Vercel 控制台查看构建日志
- 确认没有错误信息
- 检查生成的域名

### 2. 功能测试
- 访问部署的网址
- 测试币种切换功能
- 验证数据加载是否正常
- 检查图表显示

### 3. 性能检查
- 页面加载速度
- 数据响应时间
- 移动端适配

## 🔧 常见问题解决

### 问题1：构建失败
```
Error: Cannot find module 'xxx'
```
**解决**：确保 package.json 中包含了所有依赖

### 问题2：API 路由不工作
```
404 - API Not Found
```
**解决**：检查 vercel.json 中的路由配置

### 问题3：静态资源加载失败
```
Failed to load resource
```
**解决**：确认文件路径正确，使用相对路径

## 🌟 部署成功标志

✅ **成功指标**：
- 页面正常加载
- 币种列表显示完整
- 图表正确渲染
- 数据切换流畅
- 移动端适配良好

✅ **性能指标**：
- 首屏加载 < 3秒
- 数据切换 < 1秒
- 图表渲染 < 500ms

## 📱 移动端优化

部署后，项目将自动获得：
- 响应式布局
- 触摸优化
- 快速加载
- 离线缓存

## 🔗 访问地址

部署成功后，您将获得类似：
```
https://ema-atr-trading-analyzer.vercel.app
```

## 🎉 恭喜！

您的 EMA-ATR 交易策略分析工具已成功部署！
现在可以通过互联网访问，随时随地分析交易数据。