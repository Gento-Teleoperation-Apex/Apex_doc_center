---
title: 故障排查与安全注意事项
sidebar_position: 5
---

# 故障排查与安全注意事项

## 故障排查

### 1. VR 头显相关

- 不建议 VR 头显通过 WiFi 接入路由器，WiFi 容易断连、传输慢，可能导致数据中断。
- 保持 VR 头显电量充足。
- 插入名为 `BAG_STORAGE` 的 U 盘后才有透传 / 录制功能。
- 不遥操时切换待机模式，避免误触发。
- 头显异常、断电或关机后，应立即停止遥操操作。

![VR 头显常见问题](/img/pro_p38.png)

### 2. 启动时报错

检查是否修改过 `robot_param_m6.yaml`。`K`、`D` 等参数需保留浮点格式，例如：

- ✅ `6.0`（正确）
- ❌ `6`（可能导致启动异常）

![启动报错与遥操注意事项](/img/pro_p39.png)

### 3. MobaXterm SSH 后相机白屏 / WARN

原因：MobaXterm 默认勾选了 `X11-Forwarding`，会改变远端显示环境，导致相机采集超时或 VR 视野白屏。

解决方法：取消勾选 `X11-Forwarding` 后重新 SSH 连接。

![MobaXterm 取消 X11 Forwarding](/img/pro_p40.png)

### 4. deb 安装失败

```bash
sudo apt update
sudo apt install -f
sudo apt install ./kernelmind-apex_<version>_arm64.deb
```

确认系统为 Ubuntu 22.04 ARM64，并已安装 ROS 2 Humble 基础包。

### 5. 网络不通

检查网卡和路由：

```bash
ip addr
ip route
ping <设备IP>
```

如果启用了 ISC DHCP，确认 `INTERFACESv4` 是正确网卡，且 Jetson 静态 IP 与 DHCP subnet 在同一网段。

### 6. 相机没有画面

```bash
ls /dev/video*
ros2 launch gmsl_quadcam quad_csi_quickview.launch.py
```

如果日志出现 `No cameras available`，通常是相机线束、驱动、sensor-id 或相机服务未就绪。确认 `quad_csi_quickview.yaml` 中的 `camera_sources` 与实际接线一致。

### 7. VR 或上位机连不上信令

确认 `signal_url` 使用 Jetson 在控制网络中的 IP：

```yaml
signal_url: "ws://192.168.10.123:8554"
```

在上位机上测试端口：

```bash
ping 192.168.10.123
nc -vz 192.168.10.123 8554
```

### 8. 机器人不响应控制

1. 检查急停、电控电源和驱动器状态。
2. 检查 ROS 节点是否都已启动（`ros2 node list`）。
3. 检查 VR/headset target pose 是否正常更新。
4. 如果控制被安全逻辑 disable，先排除连接问题，再重新 enable。

---

## 安全注意事项

1. 遥操前确认急停按钮、控制器供电、通信网线、U 盘、头显电量均正常。
2. 不遥操时切换待机模式，避免误触侧键或脚踏板导致机器人运动。
3. 增量模式下虽不需要红蓝手柄对齐，但进入遥操前手的位置仍应与机械臂夹爪当前位置**大致一致**。
4. 使用脚踏板时，**禁止**踩住使能的同时按右手摇杆菜单键。
5. 修改 IP、负载、刚度、阻尼、Home 点、TCP 偏移前，应**备份原始配置文件**。
