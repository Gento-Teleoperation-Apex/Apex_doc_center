---
title: Product Overview
sidebar_position: 1
---

# Marvin Pro Product Overview

## Product Positioning

KernelMind Apex is a ready-to-use teleoperation kit for robotic operation scenarios. It provides the operator with an immersive first-person view through a VR headset and maps the operator's motion to the robot in real time.

The PRO version supports dual-arm robot teleoperation and works with a Meta Quest VR headset and NVIDIA Jetson Orin main controller.

Optional accessories: Manus data gloves + Wuji Hand, used for finger motion capture and fine manipulation.

## System Components

The Marvin Pro teleoperation system mainly consists of the robot body, robot controller, Orin main controller, camera deserializer board, VR headset, router, and data recording media.

| Category | Device | Description |
| --- | --- | --- |
| Robot side | Dual-arm robot body | Executes teleoperation commands |
| Robot side | Robot controller | Receives commands from Orin and the control system |
| Power and safety | 48 V main power supply | 220 V to 48 V switching power supply |
| Power and safety | 12 V controller power supply | Powers the controller and related peripherals |
| Power and safety | Emergency stop box | Provides on-site safety protection and emergency stop |
| Main control and perception | NVIDIA Jetson Orin main controller | Runs KernelMind Apex and ROS 2 nodes |
| Main control and perception | Camera deserializer board | Supports up to four GMSL camera inputs |
| Operator side | VR headset (Meta Quest) and controllers | Provides first-person view and operator input |
| Network and data | Router and Ethernet cables | Connects the robot controller, Orin, and VR headset adapter |
| Network and data | USB drive | Used for data recording; volume label must be `BAG_STORAGE` |

![PRO equipment list](/img/pro/pro_overview_equipment.png)

## Standard Accessories

| Accessory | Qty | Description |
|---|---:|---|
| VR headset (Meta Quest) | 1 | Provides immersive first-person operation view |
| Controllers (left/right) | 1 each | Control arm motion and gripper opening/closing |
| Router | 1 | LAN core connecting Orin, controller, and headset |
| Ethernet cables | Several | Wired connection for stable low-latency transmission |
| USB drive (label `BAG_STORAGE`) | 1 | Stores ROS bag and MP4 recording data |
| Type-C data cable | 1 | Used for ADB debugging or headset APK installation |
| Type-C Ethernet adapter | 1 | Connects the headset to the wired LAN |

## Optional Accessories

| Accessory | Description |
|---|---|
| Manus data gloves | Capture fine finger motion; used with Wuji Hand |
| Wuji Hand | Dexterous hand end effector that receives glove motion commands |
| Foot pedal (three-key) | Maps controller enable actions to foot input; used for motion-capture glove / dexterous hand teleoperation scenarios |

Foot pedal key functions:

| Key | Function |
|---|---|
| Key 1 (left key) | Enables both left and right controllers together |
| Key 3 (right key) | Moves both arms back to the Home position |

![Foot pedal connection example](/img/pro/pro_accessories_foot_pedal.png)

## Software Components

| Software module | Installation location | Description |
|---|---|---|
| KernelMind Apex Orin-side package | Orin main controller | `kernelmind-apex_<version>_arm64.deb`; provides ROS 2 nodes, motion control, camera, and recording services |
| KernelMind Apex headset app | Meta Quest | `KernelMind_Apex_meta_<version>.apk`; provides the VR teleoperation interface |
| Host teleoperation software | PC | Connects to Orin, starts the robot, switches modes, records data, and replays data |

## Default Network and Runtime Environment

| Item | Default / Description |
|---|---|
| Dual-arm controller IP | `192.168.10.190` |
| Orin network adapter IP | `192.168.10.123` |
| Orin dual-arm connection IP | `192.168.10.190`; must match the dual-arm controller IP |
| Router IP | `192.168.10.1` |
| Headset Apex app connection IP | `192.168.10.123`; must match the Orin IP |
| SSH login to Orin | `ssh marvin@192.168.10.123` |
| Login credentials | Use the credentials supplied with the device; they are not published here |

| Item | Specification |
|---|---|
| Operating system (Orin) | Ubuntu 22.04 ARM64 |
| Operating system (host development PC) | Ubuntu 22.04 AMD64 |
| Robot framework | ROS 2 Humble |
| Main control hardware | NVIDIA Jetson Orin |
| Headset | Meta Quest (VR-side APK) |
| Package format | `kernelmind-apex_<version>_arm64.deb` |

## Core Capabilities

- Low-latency VR video streaming, supporting GMSL multi-channel cameras (left eye, right eye, left wrist, right wrist)
- Millimeter-level spatial tracking with real-time motion mapping to the robot arms
- Multiple control modes, including impedance mode, position mode, and standby mode
- Built-in ROS bag recording and real-machine playback
- Foot pedal extension and incremental teleoperation mode support, enabled by factory default

## Typical Application Scenarios

- Remote teleoperation of dual-arm robots
- Robot-assisted operation in hazardous environments
- Robot demonstration data collection
- Factory intelligent production assistance
