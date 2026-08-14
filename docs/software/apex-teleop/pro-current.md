---
title: Marvin Pro 当前版
sidebar_position: 2
---

# Marvin Pro 当前版 Apex Teleop

本页适用于 Marvin Pro 当前天准控制器版本，以前端 `1.0.7.6o` 界面为例。当前配套基线中，机器人控制端 / MarvinSDK 为 `100343001`，Teleop 遥操服务为 `1.0.18`；现场版本应以同一交付批次为准。

## 界面总览

![Marvin Pro 当前版 Apex Teleop 主界面](/img/software/apex-teleop/pro-main.png)

| 区域 | 作用 |
|---|---|
| 顶部状态栏 | 显示 Robot、Camera、Teleop、Net、VR 和 Healthy 状态 |
| 右上角 IP | 填写天准控制器 IP，按 Enter 建立连接 |
| 左侧 3D 视图 | 显示 URDF 模型与机器人实时姿态 |
| 右上模块控制 | 启停 Camera、Robot、Teleop、Tool 和 dnsmasq |
| 左下 Robot Mode | Set Ready、控制模式、输入模式、Home 和夹爪重启 |
| Data Record | 录制机器人与相机数据 |
| Data Playback | 选择并回放已录制数据 |
| WebRTC | 显示四宫格相机画面 |
| 左侧导航 | 在主界面、日志和设置页面之间切换 |

## 首次遥操顺序

1. 在右上角输入天准控制器 IP，按 **Enter** 连接。
2. 启动 **Robot** 模块。
3. 确认左侧 URDF 姿态与实体机器人当前姿态一致。
4. 启动 **Teleop** 和 **dnsmasq**。
5. 根据需要启动 **Camera**；仅配置了末端执行器时启动 **Tool**。
6. 在左下角点击 **Start Robot**，使机器人进入 Ready 状态。

:::danger 出厂打包姿态禁止直接 Home
如果机器人双臂垂直靠近中间立柱，说明设备仍处于出厂打包姿态。此时直接 Home 可能使腕部相机碰撞立柱，必须先按下方步骤将双臂 14 个关节移动到全零位。
:::

### 打包姿态全零位操作

确保 **Robot**、**Teleop** 已启动且机器人 Ready，在已加载 Apex ROS 环境的桌面终端启动 RQt：

```bash
source /etc/apex/apex_ros_env.sh
rqt
```

打开 **Plugins → Services → Service Caller**，依次执行：

1. `/control/set_mode`：`data = 1`，切换到 Position Mode。
2. `/control/set_input`：`data = 2`，切换到 Planner 输入。
3. `/control/movej`：将 `joint_values` 设置为 14 个零并点击 **Call**。

```text
[0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0]
```

确认双臂均到达全零位后，继续执行：

1. 点击 **Impedance Mode**，进入阻抗模式。
2. 点击 **Home**，让机器人回到遥操初始位。
3. 将 **Input Mode** 切换为 **Teleop**。
4. 连接头显，在 Apex 头显客户端中建立连接并开始遥操。

已经离开打包姿态且路径确认安全时，可以直接执行上述遥操模式步骤。操作期间应持续观察实体机器人和腕部相机，保持急停可触及。

## 模块控制

| 模块 | 是否必需 | 说明 |
|---|---|---|
| Robot | 必需 | 连接机器人并发布机器人状态 |
| Teleop | 必需 | 启动遥操链路 |
| dnsmasq | 必需 | 为有线连接的头显提供网络服务 |
| Camera | 可选 | 启动四路相机与 WebRTC 画面 |
| Tool | 可选 | 控制已配置的夹爪或其他末端执行器 |

模块变为绿色表示已运行。Robot 未运行或机器人未 Ready 时，依赖项可能处于不可操作状态。

## Robot Mode

### 机器人控制模式

| 按钮 | 说明 |
|---|---|
| Start Robot | 设置机器人 Ready，允许后续模式操作 |
| Standby Mode | 待机，不执行外部运动指令 |
| Position Mode | 位置控制模式 |
| Impedance Mode | 遥操使用的阻抗控制模式 |
| Home | 回到配置的遥操初始位；出厂打包姿态必须先通过 MoveJ 到全零位，禁止直接点击 |
| Restart (Gripper) | 重启已配置的夹爪 |

### 输入模式

| 模式 | 说明 |
|---|---|
| None | 不接受外部运动输入 |
| Teleop | 接受头显遥操输入，正常遥操时选择此项 |
| Custom | 接受客户程序或 VLA 的外部控制输入 |

使用 `Custom` 前请先阅读[客户二次开发接口](./customer-interfaces)。

## 相机画面

![四宫格相机画面](/img/software/apex-teleop/pro-camera.png)

相机区域固定显示四宫格。示例配置 `camera_sources: [0, 1, none, none]` 只启用两路相机，因此上方两格有画面、下方两格为黑色；这不代表相机模块故障。底部可查看码率、丢包和 FPS。

## 数据录制

1. 确认 U 盘已正确连接，卷标为 `BAG_STORAGE`，并已挂载到 `/media/<user>/BAG_STORAGE`。
2. 点击 **Start Recording** 开始录制。
3. 录制期间保持 Robot、Teleop 及所需 Camera 模块运行。
4. 点击停止录制，等待文件写入完成后再移除数据盘。

录制数据默认保存在：

```text
/media/<user>/BAG_STORAGE/recorded_bags
```

每个 `my_bag-*` 任务目录至少应包含 `data/*.mcap`、`data/metadata.yaml` 和 `video/cameras.mp4`。文件缺失或 MCAP 无法读取时，应先检查录制是否异常中断以及 U 盘是否可写。

需要确认某个 Topic 是否允许录制、回放或发送到前端时，参见 [Topic 白名单配置与排查](/advanced/topic-whitelist)。

## 数据回放

1. 点击 **Select File** 选择录制文件。
2. 使用 **Play**、**Pause** 和 **Stop** 控制回放。
3. 通过 **Speed** 选择回放速度。

实机回放前必须清空机器人工作空间，确认起始姿态和记录数据匹配，并保持急停可触及。

## 日志查看

点击左侧日志图标进入日志页，通过右上角下拉框选择模块。

![Robot 模块日志](/img/software/apex-teleop/pro-log-robot.png)

![Teleop 模块日志](/img/software/apex-teleop/pro-log-teleop.png)

| 控件 | 说明 |
|---|---|
| 模块下拉框 | 在 Robot、Teleop 等模块日志间切换 |
| Locked | 当前滚动位置已锁定，便于查看历史内容 |
| Clear | 清空当前页面显示的日志 |

排查时先记录故障发生时间，再分别查看 Robot 和 Teleop 日志。不要只依据状态灯判断故障原因。
