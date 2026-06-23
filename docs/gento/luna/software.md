---
title: 快速入门
sidebar_position: 2
---

# 快速入门

## 目录

1. [系统概述](#1-系统概述)
2. [快速开始](#2-快速开始)
3. [界面布局](#3-界面布局)
4. [功能操作](#4-功能操作)
5. [常见问题](#5-常见问题)

---

## 1. 系统概述

Apex Teleop 是机器人遥操作控制台，支持实时 3D 可视化、运动控制、摄像头画面、数据录制与回放。

**支持的机器人型号：** Marvin 系列、Gento 系列（Skye/Luna 等）

**通信架构：** 前端通过统一后端 API（端口 8080）与 ROS 2 控制节点通信。

---

## 2. 快速开始

### 2.1 启动后端服务

在机器人控制器（如 NVIDIA Jetson Orin）上确保以下服务已启动：

| 服务 | systemd 单元 | 说明 |
|------|-------------|------|
| 后端 API | `apex-backend.service` | 统一 HTTP/WebSocket 入口 |
| 摄像头 | `apex-camera.service` | GMSL 四路摄像头 |
| 机器人控制 | `apex-robot.service` | ROS 控制与状态发布 |
| 遥操作 | `apex-teleop.service` | IK、规划、指令多路复用 |

```bash
# 检查服务状态
sudo systemctl status apex-backend.service
sudo systemctl status apex-camera.service
sudo systemctl status apex-robot.service
sudo systemctl status apex-teleop.service
```

### 2.2 启动前端应用

### 2.3 配置机器人 IP

1. 点击顶部状态栏右侧的 IP 地址区域
2. 输入机器人控制器的 IP 地址（如 `192.168.20.123`）
3. 按 Enter 或点击「确认」按钮
4. 页面自动刷新连接到新地址

> **注意：** 必须与机器人在同一局域网内，且 IP 在同一网段。

---

## 3. 界面布局

![Apex Teleop 新版界面总览](/img/pro/software/apex_teleop_overview.jpg)

### 3.1 顶部状态栏

| 指示灯 | 含义 |
|--------|------|
| Robot | 绿色=机器人控制服务运行中 |
| Camera | 绿色=摄像头服务运行中 |
| Teleop | 绿色=遥操作服务运行中 |
| Net | 绿色=DHCP 网络服务运行中 |
| VR | 绿色=VR 控制器已连接 |
| Healthy | 绿色=所有模块正常，红色=存在错误 |

![顶部状态栏](/img/pro/software/apex_teleop_status_bar.jpg)

右侧连接状态条显示机器人连接、VR 状态以及各控制模块状态码。

![连接状态条](/img/pro/software/apex_teleop_connection_status.jpg)

### 3.2 3D 机器人查看器

- 实时展示机器人各关节角度
- 支持鼠标旋转、缩放、平移视角
- 蓝色球体：左臂目标位姿
- 红色球体：右臂目标位姿
- 左侧显示 Robot/VR 连接状态及手臂状态码

![3D 机器人查看器](/img/pro/software/apex_teleop_3d_viewer.jpg)

### 3.3 模块控制条

| 模块 | Start | Stop | Restart |
|------|-------|------|---------|
| Camera | 启动摄像头 | 停止摄像头 | 重启摄像头 |
| Robot | 启动机器人控制 | 停止机器人控制 | 重启机器人控制 |
| Teleop | 启动遥操作 | 停止遥操作 | 重启遥操作 |

> Teleop 启动需要 Robot Control 已处于运行状态，否则按钮显示 Locked。

![模块控制条](/img/pro/software/apex_teleop_module_control.jpg)

### 3.4 摄像头画面

- 显示 GMSL 四合一摄像头画面（`quad_tile` 主题）
- Camera 模块未启动时显示提示文字
- 底部显示码率、丢包数和 FPS 等实时状态

![WebRTC 摄像头画面](/img/pro/software/apex_teleop_webrtc.jpg)

---

## 4. 功能操作

### 4.1 Robot Mode 状态卡片

![Robot Mode 控制卡片](/img/pro/software/apex_teleop_robot_mode.jpg)

当前版本的 `Robot Mode` 卡片用于查看机器人控制入口状态，并保留控制模式状态显示和夹爪重启入口。

| 区域 | 说明 |
|------|------|
| `Service Off` / 启动入口 | 显示机器人控制服务是否可用 |
| `Standby Mode` / `Position Mode` / `Impedance Mode` | 显示或切换机器人控制模式，服务未就绪时不可用 |
| 提示文本 | 显示当前操作前置条件，例如需要先启动机器人 |
| `Restart (Gripper)` | 重启夹爪控制器 |

### 4.2 数据录制

![Data Record 数据录制卡片](/img/pro/software/apex_teleop_data_record.jpg)

1. 在 **Record Name** 中输入录制名称
2. 点击 **Start Recording** 开始录制
3. 录制中按钮会显示录制状态
4. 点击 **Stop Recording** 停止并保存

> 录制文件保存在机器人控制器的指定目录中。

### 4.3 数据回放

![Data Playback 数据回放卡片](/img/pro/software/apex_teleop_data_playback.jpg)

1. 从 **Select playback file** 列表中选择要回放的 bag 文件
2. 点击 **Play** 开始回放
3. 点击 **Stop** 停止回放
4. 如需循环播放，切换 **Loop Playback**
5. 3D 查看器会同步显示回放的关节数据

**回放控制：**

| 控件 | 功能 |
|------|------|
| Play | 播放 |
| Stop | 停止回放 |
| Select playback file | 选择回放文件 |
| Loop Playback | 循环回放开关 |

### 4.4 日志查看

1. 点击左侧导航栏切换到 **Log** 页面
2. 顶部下拉选择要查看的模块（Robot/Teleop/Camera/DNSMasq/System）
3. **LIVE** 指示灯绿色表示实时接收日志
4. 实时日志模式下自动滚动到底部（Follow）
5. 手动滚动日志会锁定位置（Locked），点击恢复跟随

**快捷键：**
- `Ctrl + A`：选中所有日志文本
- `Clear`：清空当前日志
- `Fetch`（System 模式）：获取系统错误日志

### 4.5 多语言切换

点击顶部右侧地球图标，选择语言：
- English（英文）
- 中文（简体中文）
- 日本語（日文）

---

## 5. 常见问题

### 5.1 连接不上机器人

| 现象 | 可能原因 | 解决方法 |
|------|---------|---------|
| "Robot断开" 显示红色 | WebSocket 端口 8080 不通 | 检查机器人 IP 是否正确、网线是否插好、是否同网段 |
| 所有模块指示灯灰色 | 后端 API 连接失败 | 检查 `apex-backend.service` 是否运行 |
| 页面加载但 3D 不更新 | ROS topic 无数据 | 确认后端 WebSocket `/ws/v1/topics` 已连接 |
| 摄像头黑屏 | Camera 模块未启动 | 在模块控制条点击 Camera 的 Start |

### 5.2 模式切换失败

- **"Switch failed: Service returned error_code=0"**：ROS 服务调用返回异常，实际可能已切换成功，等待 2 秒自动刷新状态
- **Start 成功但立即恢复未启动**：ROS 控制节点未真正进入 ready 状态，检查机器人硬件连接
- **模式按钮不可点击**：需确认 Robot 服务已启动，且机器人未处于错误状态

### 5.3 模块管理

```bash
# 手动启动/停止模块（在机器人上执行）
sudo systemctl start apex-robot.service
sudo systemctl stop apex-robot.service
sudo systemctl restart apex-teleop.service
sudo systemctl status apex-camera.service

# 查看模块日志
journalctl -u apex-robot.service -f -n 100
```

### 5.4 URL 参考

| 功能 | 地址 |
|------|------|
| Swagger API 文档 | `http://<robot-ip>:8080/docs` |
| OpenAPI JSON | `http://<robot-ip>:8080/openapi.json` |
| 健康检查 | `http://<robot-ip>:8080/api/v1/system/health` |
| 系统错误 | `http://<robot-ip>:8080/api/v1/system/errors?lines=100` |
