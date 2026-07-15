---
title: Software and Firmware Update
sidebar_position: 5
---

# Software and Firmware Update

Historical Orin systems require packages matched to their hardware and ROS 2 environment. Back up network, robot, camera, Home, and end-effector configuration and record all current versions before updating.

```bash
sudo apt install ./<orin-controller-package>.deb
```

Use host and headset packages from the same delivery release. After updating, verify Robot, URDF, camera, and logs, then test Home and small teleoperation motions in a clear workspace.

Do not install current Tianzhun packages on an Orin system. Confirm compatibility with technical support before robot-controller or servo firmware updates.
