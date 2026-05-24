---
title: 启动与调试
sidebar_position: 2
---

# Skye 启动与调试

## 1. 启动 Skye 仿真界面

```bash
cd /opt/kernelmind/apex
source install/setup.bash
ros2 launch marvin_teleop teleop_skye.launch.py
```

检查仿真界面中机器人模型是否与机器人本体姿态一致。

![打开 Skye 仿真界面](/img/skye_p15.png)

## 2. 启动 Skye RViz

```bash
cd /opt/kernelmind/apex
source install/setup.bash
ros2 launch marvin_ros_control bringup_control_gento_sky.launch.py
```

![打开 Skye RViz](/img/skye_p16.png)

## 3. 通过 rqt 切换服务状态

```bash
cd /opt/kernelmind/apex
source install/setup.bash
rqt
```

在 rqt 中：

1. 刷新 Service 列表。
2. 调用 `/control/set_ready`。
3. 调用 `/control/set_mode`。
4. 在 Request 的 Expression 中将 `0` 改为 `3`，进入阻抗模式。

![rqt 服务调用](/img/skye_p17.png)
