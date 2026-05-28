---
title: Launch & Debug
sidebar_position: 2
---

# Skye Launch & Debug

## 1. Start the Skye Simulation Interface

```bash
cd /opt/kernelmind/apex
source install/setup.bash
ros2 launch marvin_teleop teleop_skye.launch.py
```

Verify that the robot model in the simulation interface matches the actual robot pose.

![Open Skye simulation interface](/img/skye_p15.png)

## 2. Start Skye RViz

```bash
cd /opt/kernelmind/apex
source install/setup.bash
ros2 launch marvin_ros_control bringup_control_gento_sky.launch.py
```

![Open Skye RViz](/img/skye_p16.png)

## 3. Switch Service States via rqt

```bash
cd /opt/kernelmind/apex
source install/setup.bash
rqt
```

In rqt:

1. Refresh the Service list.
2. Call `/control/set_ready`.
3. Call `/control/set_mode`.
4. In the Request Expression field, change `0` to `3` to enter impedance mode.

![rqt service call](/img/skye_p17.png)
