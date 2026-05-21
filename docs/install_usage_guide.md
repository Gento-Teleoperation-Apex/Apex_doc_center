---
id: install_usage_guide
slug: /install-usage-guide
title: 安装使用教程
---

# KernelMind Apex 安装使用教程

本文用于现场部署 KernelMind Apex 机器人软件，包含设备连接、deb 安装、网络参数配置、可选 ISC DHCP 配置、启动检查和常见问题排查。

> 图片占位说明：文中的图片路径先保留为 placeholder，后续可替换为现场实拍图。

## 1. 准备清单

### 1.1 主机与系统

- NVIDIA Jetson，Ubuntu 22.04，ROS 2 Humble。
- 机器人本体、控制柜或电控箱、机械臂、夹爪、相机、VR 头显或上位机。
- 已发布的安装包，例如：

```bash
kernelmind-apex_1.0.31_arm64.deb
```

### 1.2 网络规划

部署前先确认这几个地址，后续配置会用到：

| 项目 | 示例值 | 说明 |
|---|---:|---|
| Jetson 有线网卡 | `eth0` | 连接机器人控制网络 |
| Jetson 静态 IP | `192.168.10.123/24` | 机器人侧固定地址 |
| DHCP 地址池 | `192.168.10.50-192.168.10.150` | 需要 Jetson 分配地址时使用 |
| QuickView / WebSocket 信令地址 | `ws://192.168.10.123:8554` | 按实际网络修改 |
| VR / 上位机 IP | `192.168.10.x` | 与 Jetson 同网段 |

![网络拓扑占位图](images/network_topology_placeholder.png)

## 2. 连接设备

1. 断电状态下连接机器人本体、电控箱、Jetson、相机和外设。
2. 连接 Jetson 到机器人控制网络，推荐使用有线网口。
3. 连接 GMSL/CSI 相机线束，确认各路相机插口与配置中的 `head_left`、`head_right`、`hand_left`、`hand_right` 对应。
4. 连接 VR 头显或上位机到同一网络。
5. 接通电源，先启动 Jetson，再启动机器人电控。

![设备接线占位图](images/device_wiring_placeholder.png)

通电后在 Jetson 上检查基础设备：

```bash
ip addr
ls /dev/video*
sudo dmesg --follow
```

如果相机设备没有出现，先检查线束、转接板供电、相机驱动和 Jetson 相机服务。

## 3. 安装 deb

将 deb 包拷贝到 Jetson，例如放到 `~/Downloads`：

```bash
cd ~/Downloads
sudo apt install ./kernelmind-apex_<version>_arm64.deb
```

安装完成后重新登录，或手动加载环境：

```bash
source /etc/profile.d/kernelmind_apex.sh
```

确认 ROS 包可见：

```bash
ros2 pkg list | grep -E 'marvin|gmsl|node_manager'
```

安装后的主要路径：

| 路径 | 用途 |
|---|---|
| `/opt/kernelmind/apex/install` | ROS 2 workspace install 目录 |
| `/opt/kernelmind/apex/bringup_RM.sh` | 标准启动脚本 |
| `/opt/kernelmind/apex/bringup_RM_glove.sh` | 外设版本启动脚本 |
| `/etc/profile.d/kernelmind_apex.sh` | ROS 环境加载脚本 |
| `/etc/kernelmind/marvin_teleop/config` | teleop 配置软链接 |
| `/etc/kernelmind/marvin_ros_control/config` | control 配置软链接 |

## 4. 配置网络参数

### 4.1 设置 Jetson 静态 IP

下面以 `eth0` 和 `192.168.10.123/24` 为例，按现场网段替换：

```bash
nmcli device status
sudo nmcli con add type ethernet ifname eth0 con-name apex-robot-net \
  ipv4.method manual ipv4.addresses 192.168.10.123/24
sudo nmcli con up apex-robot-net
```

如果已有连接配置，直接修改：

```bash
sudo nmcli con mod apex-robot-net ipv4.method manual ipv4.addresses 192.168.10.123/24
sudo nmcli con up apex-robot-net
```

检查结果：

```bash
ip addr show eth0
ping 192.168.10.50
```

### 4.2 配置 ISC DHCP（需要 Jetson 给设备分配 IP 时）

如果 VR、上位机或其它设备需要从 Jetson 获取 IP，可安装 ISC DHCP Server：

```bash
sudo apt update
sudo apt install isc-dhcp-server
```

编辑 `/etc/default/isc-dhcp-server`，指定网卡：

```bash
sudo nano /etc/default/isc-dhcp-server
```

示例：

```conf
INTERFACESv4="eth0"
```

编辑 `/etc/dhcp/dhcpd.conf`：

```bash
sudo nano /etc/dhcp/dhcpd.conf
```

示例配置：

```conf
default-lease-time 600;
max-lease-time 7200;
authoritative;

subnet 192.168.10.0 netmask 255.255.255.0 {
  range 192.168.10.50 192.168.10.150;
  option routers 192.168.10.123;
  option subnet-mask 255.255.255.0;
  option domain-name-servers 8.8.8.8, 1.1.1.1;
}
```

启动并设为开机自启：

```bash
sudo systemctl enable isc-dhcp-server
sudo systemctl restart isc-dhcp-server
sudo systemctl status isc-dhcp-server --no-pager
```

查看租约：

```bash
sudo journalctl -u isc-dhcp-server -f
cat /var/lib/dhcp/dhcpd.leases
```

![DHCP 配置占位图](images/dhcp_config_placeholder.png)

### 4.3 修改 QuickView / 相机参数

QuickView 相机配置文件安装在：

```bash
/opt/kernelmind/apex/install/gmsl_quadcam/share/gmsl_quadcam/config/quad_csi_quickview.yaml
```

常见需要修改的字段：

```yaml
quad_csi_quickview:
  ros__parameters:
    signal_url: "ws://192.168.10.123:8554"
    vr_room_id: "10"
    quad_room_id: "11"

    camera_config:
      camera_sources:
        head_left: "csi://0"
        head_right: "csi://1"
        hand_left: "csi://4"
        hand_right: "csi://5"
```

如果某个相机暂时不用，写 `"none"`，对应画面会留空：

```yaml
hand_left: "none"
```

修改后重新启动 launch 生效。

## 5. 启动系统

标准 M6 启动：

```bash
source /etc/profile.d/kernelmind_apex.sh
/opt/kernelmind/apex/bringup_RM.sh
```

外设版本启动：

```bash
source /etc/profile.d/kernelmind_apex.sh
/opt/kernelmind/apex/bringup_RM_glove.sh
```

不启动 RViz：

```bash
/opt/kernelmind/apex/bringup_RM.sh use_rviz:=false
```

指定其它 launch：

```bash
LAUNCH_PKG=node_manager LAUNCH_FILE=bringup_all_dm_m6_no_rviz.launch.py \
  /opt/kernelmind/apex/bringup_RM.sh
```

单独测试 QuickView 相机：

```bash
ros2 launch gmsl_quadcam quad_csi_quickview.launch.py
```

## 6. 启动后检查

检查节点：

```bash
ros2 node list
```

检查话题：

```bash
ros2 topic list
ros2 topic hz /quad_tile/compressed
```

检查控制服务：

```bash
ros2 service list
```

查看日志：

```bash
journalctl -xe
ls ~/.ros/log
```

QuickView 页面或客户端应能看到 VR view 和 quad view。若使用图片记录验收，可替换下面占位图：

![QuickView 画面占位图](images/quickview_output_placeholder.png)

## 7. 常见问题

### 7.1 deb 安装失败

```bash
sudo apt update
sudo apt install -f
sudo apt install ./kernelmind-apex_<version>_arm64.deb
```

确认系统是 Ubuntu 22.04 ARM64，并已安装 ROS 2 Humble 基础包。

### 7.2 网络不通

检查网卡和路由：

```bash
ip addr
ip route
ping <设备IP>
```

如果启用了 ISC DHCP，确认 `INTERFACESv4` 是正确网卡，且 Jetson 静态 IP 与 DHCP subnet 在同一网段。

### 7.3 相机没有画面

```bash
ls /dev/video*
ros2 launch gmsl_quadcam quad_csi_quickview.launch.py
```

如果日志出现 `No cameras available`，通常是相机线束、驱动、sensor-id 或相机服务未就绪。先确认 `quad_csi_quickview.yaml` 里的 `camera_sources` 与实际接线一致。

### 7.4 VR 或上位机连不上信令

确认 `signal_url` 使用 Jetson 在控制网络中的 IP：

```yaml
signal_url: "ws://192.168.10.123:8554"
```

在上位机上测试端口：

```bash
ping 192.168.10.123
nc -vz 192.168.10.123 8554
```

### 7.5 机器人不响应控制

1. 检查急停、电控电源和驱动器状态。
2. 检查 ROS 节点是否都启动。
3. 检查 VR/headset target pose 是否正常更新。
4. 如果控制被安全逻辑 disable，先排除连接问题，再重新 enable。

## 8. 卸载

```bash
sudo apt remove kernelmind-apex
```

如需完全清理运行日志和本地配置，请先备份数据，再手动删除相关目录。
