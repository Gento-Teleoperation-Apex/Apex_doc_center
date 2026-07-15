---
title: 启动与调试
sidebar_position: 3
---

# Marvin Pro 历史版本启动与调试

本页适用于采用 NVIDIA Jetson Orin 的已出货 Marvin Pro。详细按钮、录制、回放和日志说明见 [经典版 Apex Teleop](/software/apex-teleop/classic)。

## 1. 启动前检查

- 按[硬件接线](./hardware-wiring)完成机器人、Orin、路由器、上位机和头显连接。
- 急停已释放，机器人工作空间内无人和障碍物。
- 上位机、Orin 和头显位于同一局域网。

## 2. 启动 Orin 后端

以下以历史默认 IP `192.168.10.123` 为例；现场配置不同时以交付记录为准。

```bash
ping 192.168.10.123
ssh marvin@192.168.10.123
cd /opt/kernelmind/apex
./bringup_RM.sh
```

> 使用 MobaXterm 时关闭 `X11-Forwarding`，避免相机采集超时或头显画面异常。

## 3. 启动经典版 Apex Teleop

1. 打开与该设备配套的 Apex Teleop。
2. 输入 Orin IP 并确认连接。
3. 启动 Robot，确认 3D 模型与实体机器人姿态一致。
4. 启动 Teleop 和交付配置要求的网络模块；Camera 按需启动。
5. 点击机器人启动入口，使机器人 Ready。
6. 进入 **Impedance Mode**，再执行 **Home**。
7. 连接头显并开始遥操。

## 4. 头显

历史交付可能使用 Meta Quest 或 Pico，请按设备实际配置查看：

- [Meta Quest 头显操作说明](/xr-teleop/meta)
- [Pico 头显操作说明](/xr-teleop/pico)

## 5. 快速检查

| 现象 | 检查项 |
|---|---|
| 无法连接 Orin | IP、路由器、网线和上位机网段 |
| Robot 无法启动 | 急停、供电、Robot 日志和机器人控制板连接 |
| Teleop 不可用 | Robot 是否运行并 Ready |
| 头显无连接 | 头显连接 IP、网络服务和网线 |
| 相机无画面 | Camera 模块、相机线束和历史解串板连接 |
| 遥操无动作 | Impedance Mode、Home 和头显连接状态 |
