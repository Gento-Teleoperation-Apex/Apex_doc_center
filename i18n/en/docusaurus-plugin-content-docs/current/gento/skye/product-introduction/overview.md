---
title: Product Overview
sidebar_position: 1
---

# Skye Product Overview

## Positioning

Gento Skye is a wearable motion-capture teleoperation system. Once the operator puts on the Skye kit, their body movements are mapped to the robot in real time — no handheld controllers required.

## System Components

| Component | Description |
|---|---|
| VR headset | Worn by the operator for first-person view; default IP `6.6.7.100` |
| Control arms (left/right) | Worn on the arms to capture arm motion |
| Waist sensor | Worn on the back to capture torso pose |
| Ankle sensor | Worn on the front of the ankle to capture gait |

![Skye component hardware](/img/skye/components.png)

## Wearing Instructions

- **VR headset**: long-press for 2 seconds to power on; long-press for 5 seconds to power off
- **Waist/ankle sensors**: long-press for 2 seconds to power on; long-press for 5 seconds to power off
- **Waist sensor**: worn on the back
- **Ankle sensor**: worn on the front of the ankle

## Network Configuration

| Item | Default |
|---|---|
| Skye VR headset IP | `6.6.7.100` |
| Orin DHCP subnet | `6.6.7.x` |

Set the VR headset IP address to `6.6.7.100`.

## Standard Accessories

| Item | Qty | Description |
|---|---|---|
| VR headset | 1 | Skye dedicated VR device |
| Control arms (left/right) | 1 each | Wearable motion-capture arms |
| Waist sensor | 1 | Captures torso pose |
| Ankle sensor | 1 | Worn on the front of the ankle |

## Configuration Files

| Destination | File | Description |
|---|---|---|
| Tianji side | `kernelmind-apex_0.1.1g_arm64.deb` | Version package |
| Tianji side | `dhcp_service.md` | DHCP file |
| Tianji side | `install_van.sh` | Install file |
| VR headset | `0508ZJ_apex_MJPEG_wb(2).apk.1` | VR APK |

When updating the version, remove the old package first:

```bash
sudo apt remove kernelmind_apex
```

Then open a terminal in the downloaded package directory and install the new package:

```bash
sudo apt install ./<package-name>
```
