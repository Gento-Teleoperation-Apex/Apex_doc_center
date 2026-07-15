---
title: Product Overview
sidebar_position: 1
---

# Skye/Luna Product Overview

## Product positioning

Skye and Luna are robot models that support full-body teleoperation; they are not the name of the teleoperation system. Each delivered robot integrates a Tianzhun 003 control unit, four cameras, and the hardware required for teleoperation. With a Pico headset, wearable arm units, a waist tracker, and leg trackers, the operator's motion can be mapped to the robot arms, torso, and knee joints.

## System components

| Component | Description |
|---|---|
| Skye or Luna robot | Executes dual-arm and full-body teleoperation, including knee joints |
| Tianzhun 003 control unit | Runs KernelMind Apex and ROS 2 control services |
| Four cameras | Provide a four-tile first-person and environment view |
| Pico headset | Displays video and provides head tracking |
| Wearable arm units (left/right) | Capture operator arm motion |
| Waist tracker | Captures torso pose |
| Leg trackers | Capture leg and knee motion |
| Host PC | Runs the classic Apex Teleop interface |

![Skye/Luna standard devices and accessories](/img/gento/skye-luna/device-overview.jpg)

## Robot interfaces

![Skye rear interfaces](/img/gento/skye-luna/skye-rear-ports.jpg)

![Luna rear interfaces](/img/gento/skye-luna/luna-rear-ports.jpg)

Interface locations differ by model. Follow [Hardware Wiring](../getting-started/hardware-wiring) and the labels on the delivered system.

## Wearing instructions

- **Pico headset**: adjust for a clear view and secure fit.
- **Wearable arm units**: distinguish left and right and keep elbow motion unobstructed.
- **Waist tracker**: wear it on the back in the specified orientation.
- **Leg trackers**: install them at the specified positions for leg and knee mapping.
- Check battery, connection, and tracking state before use.

## Standard accessories

| Accessory | Qty | Description |
|---|---:|---|
| Pico headset | 1 | Headset used for Skye/Luna full-body teleoperation |
| Wearable arm units (left/right) | 1 each | Capture arm motion |
| Waist tracker | 1 | Captures torso pose |
| Leg trackers | Per delivery | Capture leg and knee motion |
| Ethernet cables | Several | Connect the robot, host PC, network device, and headset adapter |
| Type-C Ethernet adapter | 1 | Connects Pico to the wired LAN |

## Software

| Software | Location | Description |
|---|---|---|
| KernelMind Apex controller software | Tianzhun 003 | Matching robot control, camera, and teleoperation services |
| Classic Apex Teleop | Host PC | Connects the robot, switches modes, records, plays back, and displays logs |
| Apex Pico client | Pico headset | Network connection, video display, and full-body teleoperation input |

## Network

| Item | Description |
|---|---|
| Tianzhun 003 | Default examples use `6.6.7.100`; use the actual site address if changed |
| Host PC | Same subnet as Tianzhun 003, with no address conflict |
| Pico headset | Receives another address on the same subnet and connects to the actual Tianzhun 003 IP |

Do not assign the Pico headset the same IP address as Tianzhun 003.

## Product differences

- Skye/Luna includes knee joints and full-body mapping; Marvin Pro is dual-arm teleoperation only.
- Skye/Luna uses Pico waist and leg tracking and does not use Meta Quest as the standard full-body headset.
- Skye/Luna currently uses the [classic Apex Teleop interface](/software/apex-teleop/classic).
