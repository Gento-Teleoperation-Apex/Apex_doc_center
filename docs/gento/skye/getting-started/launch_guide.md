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

![打开 Skye 仿真界面](/img/skye/simulation_interface.png)

## 2. 启动 Skye RViz

```bash
cd /opt/kernelmind/apex
source install/setup.bash
ros2 launch marvin_ros_control bringup_control_gento_sky.launch.py
```

检查 RViz 中机器人模型是否与机器人本体姿态一致。

![打开 Skye RViz](/img/skye/rviz_launch.png)

## 3. 通过 rqt 切换服务状态

```bash
cd /opt/kernelmind/apex
source install/setup.bash
rqt
```

在 rqt 中：

1. 刷新 Service 列表。
2. 在 Service 中选择 `/control/set_ready`，点击 Call。
3. 在 Service 中选择 `/control/set_mode`。
4. 在 Request 的 Expression 中将 `0` 改为 `3`，进入阻抗模式。

![rqt 服务调用](/img/skye/rqt_service_call.png)
