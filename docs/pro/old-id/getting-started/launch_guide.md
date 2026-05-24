---
title: 启动遥操系统
sidebar_position: 3
---

# 启动遥操系统

## 1. SSH 登录 Orin 并启动后端

```bash
ssh marvin@192.168.10.123
# 密码：1234
cd /opt/kernelmind/apex
./bringup_RM.sh
```

> **注意**：使用 MobaXterm 通过 SSH 连接时，需取消勾选 `X11-Forwarding`，否则可能导致相机采集超时或 VR 视野白屏。

![SSH 登录并启动机器人后端](/img/pro_p18.png)

## 2. 打开 KernelMind Apex 遥操软件

在电脑端打开遥操软件：

1. 输入 Orin IP：`192.168.10.123`。
2. 点击 `confirm`。
3. 点击 `startrobot` 启动机器人。
4. 点击 `Impedance Mode` 进入关节阻抗模式。
5. 速度模式可选 `Slow` / `Fast`，只能在复位（待机）状态下设置。

![KernelMind Apex 遥操软件连接](/img/pro_p19.png)
