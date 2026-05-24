---
title: 故障排查
sidebar_position: 3
---

# Skye 故障排查

### 1. 虚拟手柄位置不准确

1. 检查连接 VR 的线束是否正常。
2. 长按右手柄圆圈按钮重置。

![Skye 虚拟手柄位置不准确](/img/skye_p19.png)

### 2. RViz 不出图

在 RViz 中点击 `Fixed Frame`，选择 `base link`。

![RViz Fixed Frame 设置](/img/skye_p20.png)

### 3. DHCP 服务启动失败

确认以下步骤：
- 已停止 `dnsmasq`（`sudo systemctl stop dnsmasq`）
- `isc-dhcp-server` 的 `INTERFACESv4` 设置为正确网卡（通常是 `eth0`）
- `dhcpd.conf` 中的网段已改为 `6.6.7.x`

### 4. VR 眼镜无法获取 IP

检查 Orin 上 ISC DHCP 服务状态：

```bash
sudo systemctl status isc-dhcp-server
sudo journalctl -u isc-dhcp-server -f
```

确认 VR 眼镜通过有线连接到 Orin，而非 WiFi。
