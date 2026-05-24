---
title: 环境配置
sidebar_position: 1
---

# Skye 环境配置

## 1. DHCP 服务配置

Skye VR 眼镜通过有线连接到 Orin，Orin 需运行 DHCP 服务为其分配 IP（网段 `6.6.7.x`）。

### 1.1 处理 dnsmasq 冲突

若安装 ISC DHCP 后与 `dnsmasq` 冲突，先关闭：

```bash
sudo systemctl stop dnsmasq
sudo systemctl disable dnsmasq
```

![关闭 dnsmasq 冲突服务](/img/skye_p08.png)

### 1.2 查看网卡

```bash
ifconfig
```

记录当前 `eth0` 地址。

![查看 eth0 网卡地址](/img/skye_p09.png)

### 1.3 修改监听接口

```bash
cd /etc/default
sudo chmod 666 isc-dhcp-server
```

将 `INTERFACESv4=""` 改为：

```text
INTERFACESv4="eth0"
```

![配置 DHCP 监听接口](/img/skye_p10.png)

### 1.4 修改 dhcpd.conf

```bash
cd /etc/dhcp
sudo chmod 666 dhcpd.conf
```

按 Skye 配套 DHCP 文件，将相关网段从 `192.168.10` 改为 `6.6.7`。

![配置 dhcpd.conf](/img/skye_p11.png)

## 2. 可视化与 RViz 环境

```bash
cd /opt/kernelmind/apex
source install/setup.bash
ros2 run marvin_teleop.bash
ros2 run marvin_teleop mink_ik_node.py
```

若提示缺少 Mink：

```bash
pip install mink
```

![Skye 可视化和 RViz 环境](/img/skye_p12.png)
