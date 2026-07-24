# AGENTS.md - 项目开发指南

## 语言要求

**强制规则**：所有文档、回复和思考过程必须使用简体中文。

## 环境变量

- `uniCloud目录`：`E:\Works\uniapp\足疗\uniCloud-alipay`
- `router主函数名`：`router`
- `文档根目录`：`E:\Works\uniapp\vk-unicloud-docs\docs`

## 关键路径

- 后端代码根目录：`${uniCloud目录}/cloudfunctions/${router主函数名}`（即 `E:\Works\uniapp\足疗\uniCloud-alipay\cloudfunctions\router`）
- 前端配置文件：`app.config.js`
- 数据库表名配置：`${uniCloud目录}/cloudfunctions/${router主函数名}/dao/config.js`
- 云函数入口：`${uniCloud目录}/cloudfunctions/${router主函数名}/index.js`（勿修改）
- 业务逻辑层：`${uniCloud目录}/cloudfunctions/${router主函数名}/service/`
- 云函数模板：`${uniCloud目录}/cloudfunctions/${router主函数名}/service/muban.js`

## 变量命名规范

- 普通变量：驼峰命名法（如 `userInfo`）
- 数据库字段：全小写蛇形（如 `user_id`）
- 数据库表名：kebab-case（如 `uni-id-users`）

## UI 框架

项目使用 **Wot Design Uni**（Wot UI）作为 UI 组件库。

- 文档路径：`docs/llms-full.txt`（包含完整的 Wot UI 组件说明）
- 官方文档：https://wot-design-uni.pages.dev/

## 项目结构

```
├── uniCloud-alipay/           # uniCloud 后端（阿里云）
│   └── cloudfunctions/
│       └── router/            # 主云函数（路由入口）
│           ├── index.js       # 入口文件（勿修改）
│           ├── config.js      # 云函数配置
│           ├── dao/           # 数据访问层
│           ├── service/       # 业务逻辑层
│           │   ├── client/    # 客户端接口
│           │   ├── admin/     # 管理端接口
│           │   ├── user/      # 用户中心
│           │   └── template/  # 模板示例
│           ├── middleware/    # 中间件/过滤器
│           └── util/          # 工具函数
├── pages/                     # 主包页面
├── pages_template/            # 分包页面（模板）
├── uni_modules/               # uni-app 插件
│   ├── vk-unicloud/           # vk 核心库
│   ├── uni-id/                # 用户身份系统
│   └── uni-config-center/     # 配置中心
├── static/                    # 静态资源
├── store/                     # Vuex 状态管理
└── common/                    # 公共函数
```

## 开发工作流

### 新建页面

1. 复制 `pages_template/kong/kong.vue` 作为模板
2. 放置到 `pages/` 对应子目录

### 新建云函数

1. 复制 `service/muban.js` 或 `service/muban_easy.js`
2. 放置到 `service/` 对应子目录（client/admin/user 等）
3. 前端通过 `vk.callFunction({ url: '目录/文件名' })` 调用

### 新建云对象

1. 复制 `service/muban_object.js` 作为模板
2. 放置到 `service/` 对应子目录（client/admin/user 等）

### 云函数目录约定

- `kh/`：需要登录才能访问的接口
- `pub/`：公开接口，无需登录
- `sys/`：后台管理人员才能访问的接口
- `util/`：专用工具包

### 前端调用示例

```javascript
this.vk.callFunction({
  url: 'client/user.getMyInfo',
  data: {},
  success(data) {},
  fail(err) {},
});
```

## 代码风格（Prettier）

- 单行最大字符：180
- 缩进：2 空格
- 分号：是
- 引号：单引号（config.js 和 uni-config-center 下使用双引号）
- 尾逗号：ES5 兼容
- 换行符：LF

## 文档查询

需要查看文档时，优先在 `文档根目录`（`E:\Works\uniapp\vk-unicloud-docs\docs`）下查找：

- `client/`：前端框架文档
- `admin/`：管理端文档
- `vk-redis/`：Redis 文档
- `vk-uni-pay/`：支付文档

需要查看 Wot UI 组件文档时，查看 `docs/llms-full.txt`。

## 重要配置文件

| 文件                                     | 用途                                       |
| ---------------------------------------- | ------------------------------------------ |
| `app.config.js`                          | 前端全局配置（登录页、首页、token 检查等） |
| `uni-config-center/vk-unicloud/index.js` | 后端服务配置（加密、短信、邮箱等）         |
| `uni-config-center/uni-id/config.json`   | uni-id 用户体系配置                        |
| `manifest.json`                          | uni-app 应用配置                           |
| `pages.json`                             | 页面路由配置                               |

## VK 框架优先原则

### 方法调用

优先使用 VK 框架提供的 JS API，如果 VK 的 JS API 中没有需要的功能再自行新建方法。

### 弹窗方法

`alert`、`confirm`、`toast`、`showLoading` 等弹窗优先使用 VK 的弹窗方法。

### 页面跳转

页面跳转优先使用 VK 的页面跳转方法。

## 注意事项

- `index.js` 是云函数入口，**不要修改**
- 云函数返回成功必须 `code: 0`，失败返回 `code: -1` 或其他非零值
- `userInfo` 和 `uid` 仅在 `kh/` 目录下的函数中可信任
- 使用 `vk.navigateTo` 代替 `uni.navigateTo` 以支持登录拦截
