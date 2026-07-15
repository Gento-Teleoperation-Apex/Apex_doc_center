---
title: 软件与固件升级
sidebar_position: 5
---

# 软件与固件升级

历史 Orin 设备应使用与原交付硬件和 ROS 2 环境匹配的安装包。升级前备份网络、机器人、相机、Home 点和末端配置，并记录当前版本。

```bash
sudo apt install ./<orin-controller-package>.deb
```

上位机和头显端应同步使用同一交付批次的配套版本。升级后先验证 Robot、URDF、相机和日志，再在空载环境完成 Home 与小幅遥操测试。

不要将当前天准版本安装包直接安装到历史 Orin 设备。机器人控制器及伺服固件升级前必须联系技术支持确认兼容性。
