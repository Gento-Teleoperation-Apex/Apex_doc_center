---
title: Software and Firmware Update
sidebar_position: 5
---

# Software and Firmware Update

## Before updating

1. Record the robot controller / MarvinSDK, Teleop service, Apex frontend, and headset client versions.
2. Back up network, robot, camera, and end-effector configuration.
3. Stop Robot, Teleop, Camera, and Tool and leave the robot safe.
4. Use matching packages from one delivery release.

## Controller

Copy the controller package to Tianzhun and run:

```bash
sudo apt install ./<controller-package>.deb
```

## Host PC

Install the Teleop service and Apex frontend from the same delivery release. The current documentation baseline is Teleop service `1.0.18` and Marvin Pro frontend `1.0.7.6o`:

```bash
sudo apt install ./<apex-teleop-package>.deb
```

For split-package releases `1.0.7.6` and later, install the matching `kernelmind-apex-tool` package when the delivery includes a gripper or another end effector. Installing only the controller package may leave Robot, Camera, and Teleop available while the Tool module and its gripper components are absent.

For headset installation and developer mode, see [Apex XR Headset Client](/xr-teleop/).

## Validation

Restart the controller and host application, verify network/model/camera/tool configuration, start Robot, confirm the URDF pose, then test Impedance Mode, Home, and small motions in a clear workspace. Also verify recording, video, and logs.

Do not update the robot controller, servo, or camera firmware across versions without a package and procedure confirmed by technical support.
