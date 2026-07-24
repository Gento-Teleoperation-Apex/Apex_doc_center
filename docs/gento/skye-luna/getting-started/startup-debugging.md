---
title: 启动与调试
sidebar_position: 3
---

# Skye/Luna 启动与调试

本页提供 Skye/Luna 从上电到首次全身遥操的必要步骤。完整按钮、录制、回放和日志说明见 [经典版 Apex Teleop](/software/apex-teleop/classic)。

## 1. 启动前检查

- 按[硬件接线](./hardware-wiring)完成机器人、上位机、交换设备和 Pico 头显连接。
- 急停已释放，机器人周围无人和障碍物。
- 上位机与天准003控制单元处于同一网段。
- Pico 头显、腰部传感器和腿部传感器电量充足、佩戴正确。

## 2. 连接天准003控制单元

以下以默认 IP `6.6.7.100` 为例；现场修改过 IP 时以交付配置为准。

```bash
ping 6.6.7.100
ssh nvidia@6.6.7.100
```

启动 Apex 后端服务：

```bash
sudo systemctl start apex-backend.service
sudo systemctl status apex-backend.service --no-pager
```

## 3. 启动经典版 Apex Teleop

1. 打开 Apex Teleop。
2. 输入天准003控制单元 IP，按 **Enter** 连接。
3. 启动 **Robot**，确认 3D 模型姿态与实体机器人一致。
4. 启动 **Teleop** 和网络模块；Camera 按需启动。
5. 点击机器人启动入口，使机器人 Ready。
6. 进入 **Impedance Mode**，再执行 **Home**。
7. 确认机器人双臂和实体当前姿态正常；Skye 继续检查躯干与升降机构，Luna 继续检查躯干与膝式主体结构。

## 4. 连接 Pico 并遥操

Skye/Luna 使用 Pico 头显及腰部、腿部追踪组件完成全身遥操。按 [Pico 头显操作说明](/xr-teleop/pico) 完成开发者模式、网络和 Apex 客户端设置。

头显连接成功后，先进行小幅双臂动作，再逐步检查追踪映射。Skye 检查躯干与升降动作，Luna 检查躯干与腿部动作；确认所有方向正确后再扩大动作范围。

## 5. 快速检查

| 现象 | 检查项 |
|---|---|
| 无法连接天准003 | IP、上位机网段和网线 |
| 3D 模型与实体不一致 | Robot 模块、机型配置和启动日志 |
| Teleop 不可用 | Robot 是否运行并 Ready |
| Pico 无法连接 | 网络模块、头显 IP、网线和客户端设置 |
| 手臂正常但 BODY/LIFT 或下肢不跟随 | 机型配置、腰部/腿部传感器电量、佩戴位置和追踪状态 |
| 相机黑屏 | Camera 模块和相机连接 |
| 遥操无动作 | Impedance Mode、Home 和头显连接状态 |
