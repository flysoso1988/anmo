# AGENTS.md - 项目开发指南

## 语言要求

**强制规则**：所有文档、回复和思考过程必须使用简体中文。

## 强制规则

### 1. 数据库操作必须使用 vk 框架的方法

- 通用 CRUD 一律用 `vk.baseDao.*`：`add` `adds` `findById` `findByWhereJson` `select` `selects`（连表/聚合/分组统计）`count` `update` `updateById` `updateAndReturn` `setById` `deleteById` `del` `getTableData` `sum` `max` `min` `avg`
- 项目专用表优先用 `vk.daoCenter.<xxx>Dao.*`（如 `vk.daoCenter.userDao.findById(id)`），实现在 `router/dao/modules/*Dao.js`，继承 `router/dao/base.js` 的 BaseDao
- 新增数据表：先在 `router/dao/config.js` 注册表名（业务表前缀 `vk-`），再在 `uniCloud-alipay/database/` 加 `<表名>.schema.json`（和 `.index.json`）；需要定制方法时新建 `router/dao/modules/xxxDao.js`
- 表名永不硬编码：`const dbName = require('../../dao/config.js')`
- **任何情况都禁止**使用原生 `db.collection()`（含聚合统计）；分组统计、求和求平均等一律用 `vk.baseDao.selects`（本身支持连表、聚合、分组统计，见 `selects.md` 场景 7/8/10/13）配合原生数据库操作符与运算方法实现：`_ = db.command`、`$ = _.aggregate`（`$.sum` `$.avg` `$.if` 等）
- 已知历史遗留：`service/admin/system_uni/pay-orders/sys/getStat.js` 里仍有原生 `db.collection().aggregate()` 写法，**不要照抄**，需要改动时改成 `selects`
- `router/dao/base.js` 里的 `this.db.collection` 是 vk dao 层自身的实现（封装 `vk.baseDao`），属框架代码，业务里不要引用也不要修改
- 文档：`E:\Works\uniapp\vk-unicloud-docs\docs\client\uniCloud\db\` 下的 `api.md`（baseDao）、`selects.md`（连表）、`transaction.md`（事务）

### 2. 页面 UI 优先使用 wot-ui

- 组件库为 `uni_modules/wot-ui`（wot-ui v2.3.2，**仅支持 Vue3**，本项目 `manifest.json` 的 `vueVersion` = 3）
- 组件标签形如 `wd-button`、`wd-cell`、`wd-form`，靠 uni_modules 的 easycom 自动扫描解析：`pages.json` 里**没有也不需要** easycom 配置，不要新增
- 每个组件自带样式（内部 `@use './index.scss'`），无需在 `App.vue`/`uni.scss` 全局引入
- 页面模板中的结构与控件用 `wd-*`；全局提示/跳转仍按下方「VK 框架优先原则」用 `vk.alert`、`vk.navigateTo`

### 3. 查 wot-ui 文档用 `wot` 命令

- CLI 为 `@wot-ui/cli`，本机已全局安装（`C:\nvm4w\nodejs\wot.ps1`）；未安装则 `npm install -g @wot-ui/cli`
- 常用：`wot list`、`wot info Button`、`wot demo Button basic`、`wot doc Button`、`wot token Button`，均支持 `--format json`
- 使用说明：https://wot-ui.cn/guide/open-wot.html
- 已知噪音：`wot doctor|usage|lint` 会报 `No @wot-ui/ui dependency detected` 等 FAIL——因为 wot-ui 是以 uni_modules 源码引入、`package.json` 依赖为空，**属预期情况，不要为此改 package.json**

## 环境与运行

- uni-app（Vue3）+ HBuilderX 工程：**没有**可用的 npm build/test/lint 脚本（`package.json` 的 test 是占位符），运行、上传云函数、发行都在 HBuilderX 里操作；无 CI、无 eslint 配置
- 格式规范以 `prettier.config.js` 为准（无本地 prettier 依赖，需要时用 `npx prettier`）
- 后端目录 `uniCloud-alipay` 是**支付宝云**，不是阿里云
- 云函数依赖用 `file:` 指向 `uni_modules/*/uniCloud/cloudfunctions/common/*`；`router/node_modules` 不存在，改依赖后需在 `uniCloud-alipay/cloudfunctions/router` 执行 `npm install`（HBuilderX 上传时也会自动装）
- 源文件均为 UTF-8 无 BOM；在 PowerShell 里用 `Get-Content` 读取必须加 `-Encoding UTF8`，否则中文乱码
- 提交信息风格：`feat: xxx` / `fix: xxx` + 简体中文描述

## 关键路径

- 后端根目录：`uniCloud-alipay/cloudfunctions/router`
- 云函数入口：`.../router/index.js`（**勿修改**）
- 业务逻辑：`.../router/service/`
- 数据表名配置：`.../router/dao/config.js`；dao 模块：`.../router/dao/modules/`；数据库 schema：`uniCloud-alipay/database/`
- 前端全局配置：`app.config.js`（登录页、首页、`checkTokenPages`、主云函数名 `router`）
- 云函数模板：`.../router/service/muban.js`（路由函数）、`muban_easy.js`、`muban_object.js`（云对象）
- 数据库接口模板：`.../router/service/template/pub.db.js`、`sys.table.js`

## 变量命名规范

- 普通变量：驼峰命名法（如 `userInfo`）
- 数据库字段：全小写蛇形（如 `user_id`）
- 数据库表名：kebab-case（如 `uni-id-users`、`vk-room`）

## 云函数 service 目录约定

```
service/
├── admin/     # 管理端接口
├── client/    # 客户端接口（H5、小程序、APP）
├── user/      # 统一用户中心
├── plugs/     # 插件业务
├── crontab/   # 定时任务
└── template/  # 数据库接口模板
```

每个业务目录下的子目录决定权限（**必须**按此放置，写错会导致鉴权失效）：

- `kh/`：需登录才能访问，`userInfo` / `uid` 可信
- `pub/`：公开接口，无需登录
- `sys/`：后台管理人员才能访问
- `util/`：该业务专用工具包

前端调用的 `url` 就是 service 下的相对路径：

```javascript
this.vk.callFunction({
  url: 'client/user.getMyInfo',
  data: {},
  success(data) {},
  fail(err) {},
});
```

## 开发工作流

### 新建页面

1. 复制 `pages_template/kong/kong.vue` 作为模板
2. 放到 `pages/` 对应子目录，并在 `pages.json` 注册路由
3. 新页面若需登录拦截，确认其匹配 `app.config.js` 的 `checkTokenPages.list`（mode=2 表示 list 内免登录）

### 新建接口

1. 路由函数：复制 `service/muban.js`；云对象：复制 `service/muban_object.js`，放到对应业务的 `client/admin/user` 子目录（并选对 `kh/pub/sys`）
2. 云对象文件需保留 `isCloudObject: true`

## 代码风格（Prettier）

- 单行最大 180 字符、缩进 2 空格、分号、单引号、ES5 尾逗号、LF
- 例外：`**/config.js` 和 `uni-config-center/**/*.js` 用双引号
- `prettier.config.js` 里还有 `vueIndentScriptAndStyle: true`、`arrowParens: 'always'` 等，改动前先读该文件

## 文档查询

- vk 框架文档优先查本地 `E:\Works\uniapp\vk-unicloud-docs\docs`（已配置为 opencode reference `vk-docs`，可跨目录读取）：
  - `client/`：前端框架（`client/uniCloud/db/` 为数据库 API）
  - `admin/`：管理端；`vk-redis/`、`vk-uni-pay/`、`vk-lucky-draw/`、`db-migration/`
- wot-ui 文档用 `wot` 命令（见「强制规则 3」）

## 重要配置文件

| 文件                                     | 用途                                       |
| ---------------------------------------- | ------------------------------------------ |
| `app.config.js`                          | 前端全局配置（登录页、首页、token 检查等） |
| `router/dao/config.js`                   | 数据库表名常量（新表必须在此注册）         |
| `uni_modules/uni-config-center/uniCloud/cloudfunctions/common/uni-config-center/vk-unicloud/index.js` | 后端服务配置（加密、短信、邮箱等） |
| 同上目录下的 `uni-id/config.json`         | uni-id 用户体系配置（改后需重传公共模块与 router） |
| `manifest.json`                          | uni-app 应用配置（含 `vueVersion`）        |
| `pages.json`                             | 页面路由配置                               |

## VK 框架优先原则

- 方法调用：优先用 VK 提供的 JS API，VK 没有的功能再自行实现
- 弹窗：`alert`、`confirm`、`toast`、`showLoading` 优先用 VK 的弹窗方法
- 页面跳转：优先用 VK 的跳转方法

## 注意事项

- `router/index.js` 是云函数入口，**不要修改**
- 云函数返回成功必须 `code: 0`，失败返回 `code: -1` 或其他非零值
- `userInfo` 和 `uid` 仅在 `kh/` 目录下的函数中可信任
- 使用 `vk.navigateTo` 代替 `uni.navigateTo`，否则 `checkTokenPages` 登录拦截不生效
- `store/index.js` 通过 `import.meta.glob('./modules/**/*.js')` 加载模块，新增 Vuex 模块放 `store/modules/`
