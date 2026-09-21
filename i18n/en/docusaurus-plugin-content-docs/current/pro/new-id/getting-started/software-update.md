---
title: Software and Firmware Update
sidebar_position: 5
---

# Software and Firmware Update

## Before updating

1. Record the installed `gento-apex`, Gento SDK, Teleop service, Apex frontend, and headset client versions.
2. Back up network, robot, camera, and end-effector configuration.
3. Stop Robot, Teleop, Camera, and Tool and leave the robot safe.
4. Use matching packages from one delivery release.

## Controller

The current Pro source-review target is `gento-apex 1.1.7.1` with Gento SDK `4.7.1`; the source still marks this target as unreleased. Only when the delivery manifest or technical support explicitly specifies this version should you copy packages from the same release to the Tianzhun controller, install the SDK first, and then install Apex:

```bash
sudo apt install ./gento-sdk_4.7.1_arm64_ubuntu22.04.deb
sudo apt install ./pro-Teleoperation-apex_v1.1.7.1o_humble_arm64.deb
```

The artifact filename uses `pro-Teleoperation-apex`; the installed Debian package name remains `gento-apex`. The command above shows the target naming convention for `1.1.7.1` and does not mean that the version has been formally released. Files with a `_testN` suffix are test artifacts and must only be used when technical support explicitly requests them.

## Host PC

Install the Teleop service and Apex frontend from the same delivery release:

```bash
sudo apt install ./<apex-teleop-package>.deb
```

When the delivery includes a gripper or another end effector, install the Tool package specified in the delivery manifest. In the current Pro source, the controller companion package `gento-apex-tool` strictly depends on the same version of `gento-apex` and must not be mixed across versions. Separately delivered end-effector drivers may use their own release line; follow the corresponding end-effector delivery guide. Installing only the controller package may leave Robot, Camera, and Teleop available while Tool and its end-effector components are absent.

For headset installation and developer mode, see [Apex XR Headset Client](/xr-teleop/).

## Validation

Restart the controller and host application, verify network/model/camera/tool configuration, start Robot, and confirm the URDF pose. Then test Impedance Mode, Home, and small motions in a clear workspace. If the robot is in the factory packing pose, wait until Robot is Ready, enable drag mode, manually move both arms to the standard zero pose, and disable drag mode; never Home directly. Also verify recording, video, and logs.

Do not update the robot controller, servo, or camera firmware across versions without a package and procedure confirmed by technical support.
