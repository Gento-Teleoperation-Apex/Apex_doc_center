---
title: 故障排查
sidebar_position: 4
---

# 故障排查

| 现象 | 优先检查 |
|---|---|
| 无法连接 Orin | 路由器、Orin IP、上位机网段和网线 |
| DHCP 服务启动失败 | Orin 网卡是否有对应网段静态 IP、DHCP 配置网段是否一致 |
| Robot 启动失败 | 急停、供电、双臂控制板网络和 Robot 日志 |
| Teleop 不可用 | Robot 是否运行并 Ready |
| 头显无连接 | 头显连接目标、路由器、网络服务和适配器 |
| 相机黑屏 | Camera、相机线束、外置解串板和日志 |
| 遥操无动作 | Impedance Mode、Home 和头显状态 |

详细界面操作见[经典版 Apex Teleop](/software/apex-teleop/classic)。发生异常运动或机械干涉时立即按下急停。
