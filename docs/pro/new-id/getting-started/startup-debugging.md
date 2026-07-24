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

## 2. 连接天准控制器

以下以默认 IP `6.6.7.100` 为例；现场修改过 IP 时以交付配置为准。

```bash
ping 6.6.7.100
ssh nvidia@6.6.7.100
```

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

## 3. 启动 Apex Teleop

1. 打开 Apex Teleop。
2. 在右上角填写天准控制器 IP，按 **Enter** 连接。
3. 启动 **Robot** 模块。
4. 确认左侧 URDF 模型姿态与实体机器人当前姿态一致。
5. 启动 **Teleop** 和 **dnsmasq**。
6. 需要视频时启动 **Camera**；配置了末端执行器时再启动 **Tool**。
7. 在左下角点击 **Start Robot**。
8. 点击 **Impedance Mode**。
9. 点击 **Home**，等待机器人到达遥操初始位。
10. 将 **Input Mode** 切换为 **Teleop**。

![Marvin Pro 当前版 Apex Teleop](/img/software/apex-teleop/pro-main.png)

## 4. 连接头显并遥操

Marvin Pro 支持 Pico 和 Meta Quest：

- [Pico 头显操作说明](/xr-teleop/pico)
- [Meta Quest 头显操作说明](/xr-teleop/meta)

连接头显网线，打开 Apex 头显客户端并连接控制器。确认前端 VR 状态正常后，在安全区域内以小幅动作开始遥操。

## 5. 快速检查

| 现象 | 检查项 |
|---|---|
| 右上角无法连接 | IP、网段、网线和控制器网络 |
| Robot 无法启动 | 急停、机器人供电、控制器连接和 Robot 日志 |
| URDF 不随实体更新 | Robot 模块是否运行、机器人型号配置是否正确 |
| Teleop 不可用 | Robot 是否运行并已 Ready |
| 头显无法连接 | dnsmasq、头显网线、头显连接 IP 和 VR 状态 |
| 相机黑屏 | Camera 是否启动、相机初始化和 `camera_sources` 配置 |
| 遥操无动作 | 是否进入 Impedance Mode、完成 Home、Input Mode 是否为 Teleop |

需要进一步排查时，请查看 [Apex Teleop 日志说明](/software/apex-teleop/pro-current#日志查看)。
