---
title: Product Overview
sidebar_position: 1
---

# Skye/Luna Product Overview

## Product Positioning

Gento Skye/Luna refers to robot models that support teleoperation. The Tianzhun 003 control unit and teleoperation-related hardware are integrated before shipment. Through the teleoperation system, VR headset, and motion-capture components, the operator's body motion is mapped to the robot in real time, allowing dual-arm robot control without handheld controllers.

## System Components

| Component | Description |
|---|---|
| VR headset | Worn by the operator for first-person view; default IP `6.6.7.100` |
| Control arms (left/right) | Worn on the arms to capture arm motion |
| Waist sensor | Worn on the back to capture torso pose |
| Ankle sensor | Worn on the front of the ankle to capture gait information |

![Skye/Luna standard devices and accessories](/img/gento/skye-luna/device-overview.jpg)

## Wearing Instructions

- **VR headset**: long-press for 2 seconds to power on; long-press for 5 seconds to power off
- **Waist / ankle sensors**: long-press for 2 seconds to power on; long-press for 5 seconds to power off
- **Waist sensor**: worn on the back
- **Ankle sensor**: worn on the front

## Network Configuration

| Item | Default |
|---|---|
| Skye VR headset IP | `6.6.7.100` |
| Tianzhun 003 DHCP subnet | `6.6.7.x` |

Set the VR headset IP address to `6.6.7.100`.

## Standard Accessories

| Accessory | Qty | Description |
|---|---:|---|
| VR headset | 1 | Dedicated VR device for Skye/Luna |
| Control arms (left/right) | 1 each | Wearable motion-capture arms |
| Waist sensor | 1 | Captures torso pose |
| Ankle sensor | 1 | Worn on the front of the ankle |
| Ethernet cables | Several | Connects the robot, router / switch, host PC, and headset Ethernet adapter |
| Type-C Ethernet adapter | 1 | Used to connect the headset to the wired LAN |

## Configuration File List

| Upload location | File | Description |
|---|---|---|
| Tianzhun side | `kernelmind-apex_0.1.1g_arm64.deb` | Version package |
| Tianzhun side | `dhcp_service.md` | DHCP file |
| Tianzhun side | `install_van.sh` | Install file |
| VR headset | `0508ZJ_apex_MJPEG_wb(2).apk.1` | VR-side APK |

When updating the version, remove the old version first:

```bash
sudo apt remove kernelmind_apex
```

Open a terminal in the downloaded package directory and install the new version:

```bash
sudo apt install ./<package-name>
```
