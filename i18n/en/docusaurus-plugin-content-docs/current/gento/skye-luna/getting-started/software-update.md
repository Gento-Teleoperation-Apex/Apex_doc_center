---
title: Software and Firmware Update
sidebar_position: 5
---

# Software and Firmware Update

Record Tianzhun 003, classic Apex Teleop, and Pico client versions before updating. Back up network, model, camera, and tracking configuration and safely stop the robot.

```bash
sudo apt install ./<controller-package>.deb
```

The controller, host, and Pico packages must come from the same delivery release. After updating, verify Robot, 3D pose, cameras, Pico, Home, and small arm and knee motions.

See the [Pico headset guide](/xr-teleop/pico) for installation and developer mode. Do not update robot-controller, servo, or tracker firmware across versions without technical support approval.
