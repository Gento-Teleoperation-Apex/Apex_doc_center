# Gento Teleoperation Apex 文档中心导读

> 更新时间：2026-08-21
> 线上地址：https://gento-teleoperation-apex.github.io/Apex_doc_center/
> GitHub 仓库：https://github.com/Gento-Teleoperation-Apex/Apex_doc_center

## 1. 文档中心概述

Gento Teleoperation Apex 文档中心是 Marvin Pro、Gento Skye/Luna 及其遥操软件、头显客户端、末端夹爪和 VLA 功能的统一客户文档站点。

当前文档中心主要面向以下人员：

- 首次安装、接线和启动机器人的客户。
- 使用 Apex Teleop 进行 VR 遥操、录制和回放的操作人员。
- 对接 ROS 2 Topic、Service、相机和末端接口的开发人员。
- 使用数据转换、VLA 训练和真机推理功能的算法工程师。
- 负责现场升级、故障排查和技术支持的工程人员。

当前源码包含：

| 内容 | 数量 |
|---|---:|
| 中文 Markdown/MDX 页面 | 43 |
| 英文 Markdown/MDX 页面 | 43 |
| 已纳入 Git 管理的 `static/img` 图片资源 | 151 |
| 支持语言 | 中文、English |

中文是默认语言，英文页面位于 `/en/` 路径下。中文和英文使用同一套导航结构。

## 2. 按需求快速查找

如果不熟悉网站结构，可以先按当前任务选择入口：

| 需求 | 建议先看 | 所在栏目 |
|---|---|---|
| 第一次认识产品、核对配件 | 对应机型的“产品概述” | 产品文档 |
| 新设备拆箱、供电和接线 | 对应机型的“硬件接线” | 产品文档 → 快速入门 |
| 配置控制器、头显和网络 | 对应机型的“环境配置” | 产品文档 → 快速入门 |
| 第一次启动和进入遥操 | 对应机型的“启动与调试” | 产品文档 → 快速入门 |
| 查机器人不能启动、相机无画面等问题 | 对应机型“故障排查”或“常见问题与速查” | 产品文档 / 进阶配置及检测 |
| 学习 Apex Teleop 按钮、录制和回放 | “Marvin Pro 当前版”或“经典版界面” | 软件使用说明 |
| 安装和使用 Pico / Meta Quest | 对应头显用户手册 | 软件使用说明 → Apex XR 头显客户端 |
| 开发 Marvin Pro ROS 2 程序 | “Marvin Pro 接口” | 软件使用说明 → Apex Teleop 上位机 |
| 快速查询 Marvin Pro Topic 名称和类型 | “Marvin Pro ROS Topic 列表” | 进阶配置及检测 |
| 开发 Skye/Luna ROS 2 程序 | “Gento（Skye/Luna）ROS 2 接口” | 软件使用说明 → Apex Teleop 上位机 |
| 修改网络、相机、存储和产品配置 | “配置修改” | 进阶配置及检测 |
| 修改或排查录制、回放 Topic 范围 | “Topic 白名单配置与排查” | 进阶配置及检测 |
| 分模块检测机器人、头显、相机和末端链路 | 对应产品的“模块化通讯排查” | 进阶配置及检测 |
| 使用或二次开发 DM/ZY 夹爪 | “ApexTool 使用与二次开发” | 末端夹爪 |
| 查询 DM 夹爪 CAN 报文 | “DM 夹爪 CAN 协议” | 末端夹爪 |
| 转换遥操数据 | “Data-Processing-Tool” | 软件使用说明 |
| 训练和部署 VLA | 从“VLA 概述”按顺序阅读 | VLA 入门 |

版本选择原则：

- 当前 Marvin Pro 天准控制器使用“当前版本（天准）”。
- 已出货的 Jetson Orin 控制器使用“历史版本（Orin）”。
- Skye 和 Luna 使用统一的“Skye/Luna”栏目，并在具体页面中核对机型差异。

## 3. 网站一级结构

网站左侧导航当前分为六个主要板块：

1. **首页**
2. **产品文档**
3. **软件使用说明**
4. **进阶配置及检测**
5. **末端夹爪**
6. **VLA 入门**

其中产品文档按机器人型号区分，软件使用说明提供基础操作和接口资料；进阶配置及检测用于参数调整、现场排障和模块验证；末端夹爪和 VLA 提供面向开发和集成的独立说明。

## 4. 首页

### 页面作用

首页用于介绍 Apex 文档中心支持的产品和能力，并提供三个主要入口：

- Marvin Pro 当前版快速入门。
- Skye/Luna 快速入门。
- Apex Teleop 软件使用说明。

首页同时概括：

- VR 沉浸式遥操作。
- Marvin Pro、Skye 和 Luna 多机型支持。
- ROS 2、数据手套和灵巧手等开放扩展能力。

### 文件与路由

| 项目 | 内容 |
|---|---|
| 中文源文件 | `docs/index.mdx` |
| 英文源文件 | `i18n/en/docusaurus-plugin-content-docs/current/index.mdx` |
| 中文路由 | `/` |
| 英文路由 | `/en/` |

## 5. 产品文档

产品文档分为 **Marvin Pro** 和 **Skye/Luna** 两个产品入口。

### 5.1 Marvin Pro

Marvin Pro 下保留两套文档，以兼容不同出货批次：

- **当前版本（天准）**：当前 Marvin Pro 天准控制器版本。
- **历史版本（Orin）**：已经出货的 NVIDIA Jetson Orin 版本。

两套文档的结构一致，但控制器、接口、接线、网络和启动方式不同，不能混用。

#### 当前版本（天准）

目录：`docs/pro/new-id/`

| 页面 | 主要内容 | 中文路由 |
|---|---|---|
| 产品概述 | 产品定位、系统组成、标准/可选配件、软件组成、默认网络、核心能力和应用场景 | `/pro/new-id/product-introduction/overview` |
| 硬件接线 | 电箱供电、急停、U 盘、首次拆箱姿态、天准电箱接口、网络接线和上电检查 | `/pro/new-id/getting-started/hardware-wiring` |
| 环境配置 | 网络、软件配套、相机和头显准备 | `/pro/new-id/getting-started/environment-configuration` |
| 启动与调试 | 连接天准控制器、启动 Apex Teleop、退出打包姿态、Home、连接头显和首次遥操 | `/pro/new-id/getting-started/startup-debugging` |
| 故障排查 | 当前版本常见启动和使用问题 | `/pro/new-id/getting-started/troubleshooting` |
| 软件与固件升级 | 升级前准备、控制器端与上位机端升级、升级后验证 | `/pro/new-id/getting-started/software-update` |

#### 历史版本（Orin）

目录：`docs/pro/old-id/`

| 页面 | 主要内容 | 中文路由 |
|---|---|---|
| 产品概述 | 历史 Marvin Pro 的组成、配件、软件、网络、核心能力和应用场景 | `/pro/old-id/product-introduction/overview` |
| 硬件接线 | 双臂供电与通信、初始姿态、Orin 与相机解串板、网络接线和上电检查 | `/pro/old-id/getting-started/hardware-wiring` |
| 环境配置 | Orin 版本网络、软件和头显环境 | `/pro/old-id/getting-started/environment-configuration` |
| 启动与调试 | 启动 Orin 后端、经典版 Apex Teleop、头显连接和快速检查 | `/pro/old-id/getting-started/startup-debugging` |
| 故障排查 | 历史版本常见故障 | `/pro/old-id/getting-started/troubleshooting` |
| 软件与固件升级 | 历史版本升级入口 | `/pro/old-id/getting-started/software-update` |

### 5.2 Skye/Luna

Skye 和 Luna 归入同一产品栏目。产品介绍以 Skye/Luna 系列为对象，快速入门采用当前统一的天准 003 控制与 Apex Teleop 流程，同时保留两种机器人背部接口和机型差异。

目录：`docs/gento/skye-luna/`

| 页面 | 主要内容 | 中文路由 |
|---|---|---|
| 产品概述 | 产品定位、系统组成、机器人接口、穿戴、标准配件、软件、网络和 Skye/Luna 差异 | `/gento/skye-luna/product-introduction/overview` |
| 硬件接线 | 设备与配件、Skye/Luna 背部接口、网络接线、网口要求和接线检查 | `/gento/skye-luna/getting-started/hardware-wiring` |
| 环境配置 | 网络、Pico 穿戴与追踪、软件准备 | `/gento/skye-luna/getting-started/environment-configuration` |
| 启动与调试 | 连接天准 003、启动 Apex Teleop、进入 Home、连接 Pico 和开启遥操 | `/gento/skye-luna/getting-started/startup-debugging` |
| 故障排查 | Skye/Luna 常见问题 | `/gento/skye-luna/getting-started/troubleshooting` |
| 软件与固件升级 | Skye/Luna 升级入口 | `/gento/skye-luna/getting-started/software-update` |

## 6. 软件使用说明

软件使用说明由 Apex Teleop 上位机、数据转换工具和 Apex XR 头显客户端组成。

### 6.1 Apex Teleop 上位机

目录：`docs/software/apex-teleop/`

| 页面 | 主要内容 | 中文路由 |
|---|---|---|
| 使用说明 | 软件层级、当前文档版本基线、产品适用界面和入口导航 | `/software/apex-teleop/` |
| Marvin Pro 当前版 | 当前 Pro 界面总览、首次遥操、打包姿态、Robot Mode、输入模式、相机、录制、回放和日志 | `/software/apex-teleop/pro-current` |
| 经典版界面 | 历史 Pro 和当前 Skye/Luna 经典界面的连接、主要区域、录制回放和日志 | `/software/apex-teleop/classic` |
| Marvin Pro 接口 | 客户二次开发使用的状态、反馈、控制、录制、相机、VLA、端口及诊断接口 | `/software/apex-teleop/customer-interfaces` |
| Gento ROS 2 接口 | Skye/Luna 关节差异、状态、遥操、全身控制、Service、末端、相机和采集 Topic | `/software/apex-teleop/gento-interfaces` |

#### 配置和接口的边界

- 产品快速入门回答“设备如何接线和启动”。
- 上位机界面说明回答“按钮和模块如何使用”。
- ROS 2 接口回答“客户程序可以读取或控制什么”。
- 进阶配置及检测回答“哪些参数允许调整、出现异常时如何定位，以及如何分段验证链路”。

控制增益、QP 参数、碰撞模型、机器人模型和相机标定不属于客户常规配置。

### 6.2 Data-Processing-Tool

目录：`docs/data-converter/`

主要页面：`docs/data-converter/README.zh-CN.md`

内容包括：

- Windows EXE 安装包下载、安装和启动。
- 双 MCAP 原始数据目录结构要求。
- 转换前数据质量检查。
- 输入路径、视频映射和末端执行器设置。
- LeRobot Schema 配置。
- 数据转换、输出目录和 Rerun 可视化。
- 与 VLA 数据流程相关的项目参考。

### 6.3 Apex XR 头显客户端

目录：`docs/xr-teleop/`

| 页面 | 主要内容 | 中文路由 |
|---|---|---|
| 遥操作客户端手册 | XR 客户端总入口和支持平台 | `/xr-teleop/` |
| PICO 用户手册 | 电量、网络、追踪、边界、末端配置、主机连接、遥操、开发者模式和按键 | `/xr-teleop/pico` |
| META QUEST 用户手册 | 网络、边界、末端配置、主机连接、遥操、开发者模式和按键 | `/xr-teleop/meta` |

产品支持关系：

- Marvin Pro 支持 Pico 和 Meta Quest，具体以交付版本为准。
- Skye/Luna 全身遥操使用 Pico，并包含腰部和腿部追踪组件。

## 7. 进阶配置及检测

目录：`docs/advanced/`

该一级栏目独立于基础产品和软件使用说明，用于客户工程师、测试人员和技术支持进行配置调整、现场排障和链路验证。

| 页面 | 主要内容 | 中文路由 |
|---|---|---|
| 配置修改 | 客户可修改的网络、机器人地址、相机、录制目录和末端配置，以及备份、重启和验证方法 | `/advanced/configuration` |
| Topic 白名单配置与排查 | 录制、回放、WebSocket 和滚动诊断日志四类白名单的配置边界、运行值检查和验证流程 | `/advanced/topic-whitelist` |
| Marvin Pro ROS Topic 列表 | 当前 `/tj` 命名空间下客户可见 Topic、消息类型、读写权限、启用条件和全局接口速查 | `/advanced/ros-topic-list` |
| 常见问题与速查 | 启动、网络、相机、WebRTC、遥操、末端、ROS、依赖、录制、授权等现场问题 | `/advanced/troubleshooting` |
| Marvin Pro 模块化通讯排查 | Pro 环境、ROS 图、机器人、头显、双臂、末端、相机、录制和日志的分层诊断 | `/advanced/pro-communication-diagnostics` |
| Skye/Luna 模块化通讯排查 | Gento L1 SDK、双臂、身体、头部、末端、相机和录制链路的分层诊断 | `/advanced/gento-communication-diagnostics` |

六个页面按“先配置、确认数据边界、查询接口、查看已知问题、最后按产品分段验证”的思路组织。两份模块化通讯排查手册中的每个 Bash 代码块都可在控制器终端独立整段粘贴，不依赖外部脚本，并会自动保存对应模块的排查结果；Gento 手册在形成正式验收标准前仍需分别在健康 Skye 和 Luna 上建立实机基线。

接口相关页面的分工：

- “Marvin Pro 接口”解释接口如何使用、控制源如何切换以及安全边界。
- “Marvin Pro ROS Topic 列表”用于快速查找 Topic、消息类型和读写权限。
- “Topic 白名单配置与排查”说明哪些 Topic 可以被录制、回放、转发或写入诊断日志。

## 8. 末端夹爪

目录：`docs/end-effectors/`

当前包含两个页面：

| 页面 | 主要内容 | 中文路由 |
|---|---|---|
| ApexTool 使用与二次开发 | 末端配置、服务、ROS 2 接口、DM/ZY 驱动、客户输入、独立例程、测试和排障 | `/end-effectors/apex-tool` |
| DM 夹爪 CAN 协议 | DM4310 MIT 帧、SocketCAN、反馈解析、状态码、抓帧、通信检查和安全边界 | `/end-effectors/dm-can-protocol` |

`docs/end-effectors/apex-tool.md` 是 ApexTool 末端执行器的完整使用和二次开发手册，包含：

- ApexTool 的模块定位和接入边界。
- 完整 Apex 系统、独立夹爪和开发例程的接入路线选择。
- 安装、版本确认、末端类型配置和服务启动。
- 命令 Topic、反馈 Topic、复位 Service 和通信链路。
- DM/OmniGripper 与 ZY 夹爪驱动说明。
- 客户自定义 ROS 输入和最小 Python 发布示例。
- USB、Marvin SDK、ROS 2 等独立控制例程。
- 并发控制、资源占用和控制所有权要求。
- 安全测试、自检命令、常见故障和交付清单。

该页面内容较深入，既用于客户集成，也可作为现场技术支持的参考手册。

`docs/end-effectors/dm-can-protocol.md` 面向需要理解 DM4310 底层链路的开发人员。它以标准 ROS 2 接口为推荐控制方式，同时提供当前生产版本的 MIT 帧格式、常用帧表和反馈协议。直接发帧、设置零位及电机参数写入均按高风险操作限制。


## 9. VLA 入门

目录：`docs/vla/`

VLA 板块覆盖从遥操数据到 LeRobot 数据集、模型训练和真机部署的完整流程。

| 页面 | 主要内容 | 中文路由 |
|---|---|---|
| VLA 概述 | VLA 场景、端到端流程、观测/动作格式、环境要求和快速导航 | `/vla/` |
| 数据集转换 | LeRobot v3.0 到 v2.1 的转换、本地转换、Hub 下载和常见问题 | `/vla/dataset-conversion` |
| 数据集样例 | 四路相机布局、样例预览、目录结构和训练配置对应关系 | `/vla/dataset-sample` |
| 模型训练 | PI0/PI05 环境、单/多 GPU 训练、归一化、Checkpoint 和断点续训 | `/vla/training` |
| 真机部署 | vlahost、策略服务器、推理客户端、网络接口、启动顺序和联调 | `/vla/deployment` |
| VLA Host 客户手册 | 控制链路、输入切换、WebSocket/HTTP、ROS Topic、频率和安全限制 | `/vla/vla-host` |

### 源码中存在但未加入 VLA 侧栏的页面

`docs/vla/environment.md` 提供 OpenPI 环境、GPU、Docker、vlahost 和网络准备说明，但当前 `sidebars.js` 没有把它加入 VLA 导航。该文件可以通过直接路由访问，但普通用户不会在左侧菜单中看到它。

后续可根据内容去重结果决定：

- 将其加入“数据集样例”和“模型训练”之间；或
- 把其中不重复的环境准备内容合并到“模型训练”和“真机部署”。

## 10. 推荐阅读路径

### 10.1 首次使用 Marvin Pro 当前版本

1. 产品概述。
2. 硬件接线。
3. 环境配置。
4. 启动与调试。
5. Marvin Pro 当前版上位机说明。
6. Pico 或 Meta Quest 头显说明。
7. 故障排查与软件升级。

### 10.2 首次使用 Skye/Luna

1. Skye/Luna 产品概述。
2. 硬件接线并确认机器人、头显和 Thor/其他设备使用正确网口。
3. 环境配置和 Pico 穿戴。
4. 启动与调试。
5. 经典版 Apex Teleop 说明。
6. Pico 用户手册。
7. 故障排查与软件升级。

### 10.3 客户 ROS 2 二次开发

1. 阅读对应产品的启动与安全要求。
2. Marvin Pro 使用“Marvin Pro 接口”。
3. 需要快速查询 Marvin Pro Topic 时使用“Marvin Pro ROS Topic 列表”。
4. Skye/Luna 使用“Gento ROS 2 接口”。
5. 末端开发使用“ApexTool 使用与二次开发”。
6. 修改网络、相机或存储路径时使用“配置修改”。
7. 使用最小幅度、单模块测试验证后再联调整机。

### 10.4 VLA 数据闭环

1. 使用 Apex Teleop 录制遥操数据。
2. 使用 Data-Processing-Tool 整理并检查双 MCAP 数据。
3. 转换为训练要求的 LeRobot 格式。
4. 对照数据集样例检查相机、状态和动作字段。
5. 训练 PI0/PI05 模型。
6. 部署 vlahost、策略服务器和推理客户端。
7. 先无动作验证反馈，再进行低速真机测试。

## 11. 中英文文件对应关系

中文页面位于：

```text
docs/
```

英文页面位于：

```text
i18n/en/docusaurus-plugin-content-docs/current/
```

例如：

```text
docs/advanced/configuration.md
i18n/en/docusaurus-plugin-content-docs/current/advanced/configuration.md

docs/advanced/topic-whitelist.md
i18n/en/docusaurus-plugin-content-docs/current/advanced/topic-whitelist.md

docs/advanced/ros-topic-list.md
i18n/en/docusaurus-plugin-content-docs/current/advanced/ros-topic-list.md
```

后续修改客户文档时应同步修改中英文页面，并保持：

- 相同的相对目录和文件名。
- 相同的 `sidebar_position`。
- 相同的章节结构、命令、Topic、Service 和参数名。
- 中文站使用 `/...`，英文站由 Docusaurus 自动添加 `/en/` 前缀。

## 12. 图片与静态资源

客户页面使用的图片统一放在：

```text
static/img/
```

当前主要资源目录：

| 目录 | 用途 |
|---|---|
| `static/img/pro/` | Marvin Pro 产品、接线、软件和快速入门图片 |
| `static/img/gento/` | Skye/Luna 产品、接口和接线图片 |
| `static/img/skye/` | 历史 Skye 素材和配置图片 |
| `static/img/software/apex-teleop/` | Apex Teleop 界面和功能截图 |
| `static/img/vla/` | VLA 数据集和流程图片 |
| `static/img/product_lists/` | 产品清单、网络和结构示意资源 |

Markdown 中引用静态图片时使用站点绝对路径，例如：

```md
![说明文字](/img/pro/example.png)
```

图片中的操作说明应尽量转写为 Markdown 正文，图片主要保留设备、接口、接线位置和界面状态，便于后续搜索、翻译和维护。

## 13. 导航和页面排序

主导航由根目录的 `sidebars.js` 控制。

导航方式分为两种：

- 产品、软件、数据转换和末端目录主要使用自动生成导航。
- XR 和 VLA 使用显式页面列表控制顺序。

自动生成目录中的页面顺序由以下字段控制：

```yaml
sidebar_position: 1
```

目录名称、折叠状态和目录顺序由 `_category_.json` 控制。

新增页面时需要同时检查：

1. 文件是否位于正确模块目录。
2. 是否设置唯一且正确的 `sidebar_position`。
3. 显式导航模块是否已在 `sidebars.js` 添加页面。
4. 中英文文件是否同步存在。
5. 页面内链接是否同时适用于中文和英文站点。

## 14. 本地预览与构建

安装依赖：

```bash
npm ci
```

启动开发服务器：

```bash
npm run start
```

默认预览地址：

```text
http://localhost:3000/Apex_doc_center/
```

构建中文和英文静态网站：

```bash
npm run build
```

构建完成后本地预览生产版本：

```bash
npm run serve
```

项目要求 Node.js 18 或更高版本，GitHub Actions 当前使用 Node.js 22。

## 15. 发布方式

发布工作流：

```text
.github/workflows/deploy.yml
```

发布流程如下：

1. 修改提交到 `main` 分支。
2. 推送到 GitHub。
3. GitHub Actions 执行 `npm ci`。
4. 执行 `npm run build`，同时构建中文和英文站点。
5. 将 `build/` 发布到 `gh-pages` 分支。
6. GitHub Pages 更新线上网站。

推送命令：

```bash
git push origin main
```

线上更新通常需要等待 GitHub Actions 构建和 Pages 缓存刷新。若网站未立即变化，应先检查仓库 Actions 页面中的 Deploy 工作流是否成功。

## 16. 维护原则

### 内容维护

- 当前版本与历史版本必须明确区分，不能直接删除仍有客户使用的旧版本。
- 产品名称统一使用 Marvin Pro、Skye、Luna 和 Gento Teleoperation Apex。
- 同一条命令、IP、Topic 或安装包名称在不同页面中应保持一致。
- 现场不确定的硬件参数不得根据其他机型推断，应先向产品或研发确认。
- 客户页面只公开经过确认的接口和可修改参数。

### 安全边界

- 遥操前必须保留急停、Home、低幅度测试和工作空间检查。
- 高风险参数修改需要技术支持确认，并保留原配置备份。
- 控制源切换、VLA 控制和自定义 ROS 输入应先进行无动作验证。
- 同一硬件接口不得由 systemd 服务和手动进程同时占用。

### 提交前检查

```bash
git diff --check
npm run build
git status --short
```

提交时只添加本次修改涉及的文件，避免把临时图片、备份目录、安装包或本地测试文件一并提交。

## 17. 当前内容状态摘要

当前文档中心已经具备以下完整链路：

- 三个机器人型号的产品说明、接线、配置、启动、排障和升级入口。
- 当前版和历史版 Marvin Pro 的独立维护。
- 当前版与经典版 Apex Teleop 界面说明。
- Marvin Pro 与 Gento 的客户 ROS 2 接口说明，以及 Marvin Pro `/tj` Topic 独立速查表。
- 面向客户的配置修改和大型现场 QA 速查手册。
- Pico 和 Meta Quest 头显操作说明。
- DM/OmniGripper、ZY 等末端夹爪使用和二次开发说明。
- 遥操数据转换、LeRobot 数据集、PI0/PI05 训练和 VLA 真机部署流程。
- 中文和英文双语页面。
- GitHub Actions 自动构建和 GitHub Pages 发布。

当前最明确的结构性待确认项是 `docs/vla/environment.md` 尚未进入 VLA 左侧导航；其余主要页面均已纳入当前文档结构。
