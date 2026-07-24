---
title: Software and Firmware Update
sidebar_position: 5
---

# Software and Firmware Update

Record the Tianzhun 003 controller, Teleop service, Apex frontend, and Pico client versions before updating. Back up network, model, camera, and tracking configuration and safely stop the robot.

```bash
sudo apt install ./<controller-package>.deb
```

Skye/Luna requires a matching Gento controller package marked with `g` or `gento`. Do not install an unmarked Marvin Pro package.

The controller, Teleop service, Apex frontend, and Pico packages must come from the same delivery release. The current documentation baseline is Teleop service `1.0.18` and Gento frontend `1.0.6.81g`. After updating, verify Robot, 3D pose, cameras, Pico, and Home. Then verify small arm/BODY/LIFT motions on Skye or arm/BODY motions on Luna.

See the [Pico headset guide](/xr-teleop/pico) for installation and developer mode. Do not update robot-controller, servo, or tracker firmware across versions without technical support approval.
