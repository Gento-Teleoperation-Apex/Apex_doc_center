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

![关闭 dnsmasq 冲突服务](/img/skye/dnsmasq_stop.png)

### 1.2 查看网卡

```bash
ifconfig
```

记录当前 `eth0` 地址。

![查看 eth0 网卡地址](/img/skye/eth0_ifconfig.png)

### 1.3 修改监听接口

在机器人系统中找到 `/etc/default/isc-dhcp-server`，在该目录打开终端后执行：

```bash
cd /etc/default
sudo chmod 666 isc-dhcp-server
```

如需输入密码，使用 `nvidia`。

将 `INTERFACESv4=""` 改为：

```text
INTERFACESv4="eth0"
```

![配置 DHCP 监听接口](/img/skye/dhcp_interface.png)

### 1.4 修改 dhcpd.conf

在机器人系统中找到 `/etc/dhcp/dhcpd.conf`，在该目录打开终端后执行：

```bash
cd /etc/dhcp
sudo chmod 666 dhcpd.conf
```

如需输入密码，使用 `nvidia`。

按 Skye 配套 DHCP 文件修改配置：

1. 打开下载的 `dhcp_service.md` 文件，复制第 178-191 行内容。
2. 打开 `/etc/dhcp/dhcpd.conf`，注释原文件第 10-14 行。
3. 将复制内容粘贴到第 15 行附近。
4. 将其中所有 `192.168.10` 修改为 `6.6.7`。

![配置 dhcpd.conf](/img/skye/dhcp_conf.png)

## 2. 可视化与 RViz 环境

进入 `/opt/kernelmind/apex` 目录，打开终端：

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

![Skye 可视化和 RViz 环境](/img/skye/visualization_rviz_env.png)
