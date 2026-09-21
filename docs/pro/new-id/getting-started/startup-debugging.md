---
title: 启动与调试
sidebar_position: 3
---

# Marvin Pro 启动与调试

本页适用于当前天准控制器版本，提供从上电到首次遥操的必要步骤。按钮、录制、回放和日志的完整说明见 [Marvin Pro 当前版 Apex Teleop](/software/apex-teleop/pro-current)。

## 1. 启动前检查

- 机器人、电箱、上位机和头显已按[硬件接线](./hardware-wiring)连接。
- 急停已释放，机器人工作空间内无人和障碍物。
- 上位机与天准控制器处于同一网段。
- 头显已接入同一局域网。
- 确认机器人是否仍处于出厂打包姿态。**打包姿态下禁止直接点击 Home，否则腕部相机可能与中间立柱碰撞。**

## 2. 连接控制器

根据设备使用的控制器选择对应地址和账号。以下为出厂默认值；现场修改过 IP、用户名或密码时，以设备交付配置为准。

| 控制器 | 默认 IP | 用户名 | 默认密码 |
|---|---|---|---|
| 天准 | `6.6.7.100` | `nvidia` | `nvidia` |
| 灵境 Thor | `6.6.7.100` | `user` | `1` |

天准控制器：

```bash
ping 6.6.7.100
ssh nvidia@6.6.7.100
```

灵境 Thor 控制器：

```bash
ping 6.6.7.100
ssh user@6.6.7.100
```

首次 SSH 连接时输入对应默认密码。若交付设备已经修改密码，请勿尝试恢复默认密码。

控制器重新上电后，如交付系统包含 `~/cam_geac`，按交付配置初始化相机：

```bash
cd ~/cam_geac
./rb_camera.sh init
```

启动 Apex 后端服务：

```bash
sudo systemctl start apex-backend.service
sudo systemctl status apex-backend.service --no-pager
```

> 使用 MobaXterm 时关闭 `X11-Forwarding`，避免相机采集超时或头显画面异常。

## 3. 启动 Apex Teleop 和机器人

1. 打开 Apex Teleop。
2. 在右上角填写天准控制器 IP，按 **Enter** 连接。
3. 启动 **Robot** 模块。
4. 确认左侧 URDF 模型姿态与实体机器人当前姿态一致。
5. 启动 **Teleop** 和 **dnsmasq**。
6. 需要视频时启动 **Camera**；配置了末端执行器时再启动 **Tool**。
7. 在左下角点击 **Start Robot**。

![Marvin Pro 当前版 Apex Teleop](/img/software/apex-teleop/pro-main.png)

## 4. 首次拆箱：先退出打包姿态

:::danger 打包姿态禁止直接 Home
机器人以双臂垂直靠近中间立柱的打包姿态交付。此姿态直接执行 Home 时，腕部相机存在碰撞立柱的风险。首次拆箱或每次人工恢复到打包姿态后，必须先开启拖动模式，手动将双臂移到下图所示的标准零位姿态。
:::

![Marvin Pro 标准零位姿态](/img/pro/new-id-standard-zero-pose.png)

1. 确认 **Robot** 模块为绿色，并且已经点击 **Start Robot**。只有机器人进入 Ready 状态后才能开启拖动模式。
2. 打开终端，执行以下命令开启拖动模式：

```bash
source /etc/apex/apex_ros_env.sh
ros2 service call /tj/control/set_drag \
  marvin_msgs/srv/Int "{data: 1}"
```

终端应返回 `success: true`。如果服务不存在或返回失败，不要移动机械臂，先检查 Robot 模块、机器人连接和 Ready 状态。

3. 缓慢拖动左右机械臂离开中间立柱，并将双臂调整到上图所示的标准零位姿态。移动过程中持续确认腕部相机、机械臂与中间立柱之间保留安全距离。
4. 调整完成后立即执行以下命令关闭拖动模式：

```bash
ros2 service call /tj/control/set_drag \
  marvin_msgs/srv/Int "{data: 0}"
```

确认终端返回 `success: true` 后再继续下一节。操作期间保持急停可触及；已经离开打包姿态且 Home 路径确认安全时，不需要重复执行本节。

## 5. 进入遥操姿态

1. 确认机器人已经离开打包姿态，双臂处于标准零位姿态，并且拖动模式已经关闭。
2. 点击 **Impedance Mode**。
3. 点击 **Home**，等待前端显示完成且机器人稳定到达遥操初始位。通过 ROS Service 调用 Home 时，成功响应只表示轨迹已经启动，必须继续确认 `/tj/info/go_home_status` 为 `succeeded`。
4. 将 **Input Mode** 切换为 **Teleop**。

## 6. 连接头显并遥操

Marvin Pro 支持 Pico 和 Meta Quest：

- [Pico 头显操作说明](/xr-teleop/pico)
- [Meta Quest 头显操作说明](/xr-teleop/meta)

连接头显网线，打开 Apex 头显客户端并连接控制器。确认前端 VR 状态正常后，在安全区域内以小幅动作开始遥操。

## 7. 快速检查

| 现象 | 检查项 |
|---|---|
| 右上角无法连接 | IP、网段、网线和控制器网络 |
| Robot 无法启动 | 急停、机器人供电、控制器连接和 Robot 日志 |
| URDF 不随实体更新 | Robot 模块是否运行、机器人型号配置是否正确 |
| Teleop 不可用 | Robot 是否运行并已 Ready |
| 头显无法连接 | dnsmasq、头显网线、头显连接 IP 和 VR 状态 |
| 相机黑屏 | Camera 是否启动、相机初始化和 `camera_sources` 配置 |
| 遥操无动作 | 是否进入 Impedance Mode、完成 Home、Input Mode 是否为 Teleop |
| 打包姿态准备首次启动 | 禁止直接 Home；Robot Ready 后开启拖动模式，手动将双臂移到标准零位姿态，再关闭拖动模式 |
| 无法开启拖动模式 | 检查 Robot 模块是否运行、是否已点击 Start Robot，以及 `/tj/control/set_drag` 是否返回成功 |
| Home 路径接近立柱 | 立即停止并按需急停，检查是否已退出打包姿态、关闭拖动模式并确认安全起始姿态 |

需要进一步排查时，请查看 [Apex Teleop 日志说明](/software/apex-teleop/pro-current#日志查看)。
