---
title: Product Overview
sidebar_position: 1
---

# Skye/Luna Product Overview

## Product positioning

Skye and Luna are robot models that support full-body teleoperation; they are not the name of the teleoperation system. Each delivered robot integrates a Tianzhun 003 control unit, four cameras, and the hardware required for teleoperation. The operator wears a Pico headset, arm units, one waist tracker, and two leg trackers. Skye maps motion to both arms, BODY, and LIFT, while Luna maps motion to both arms, BODY, and legs.

## System components

| Component | Description |
|---|---|
| Skye robot | Executes dual-arm, 2-DOF BODY, and 1-DOF LIFT teleoperation; it has no knee joints |
| Luna robot | Executes dual-arm and 6-DOF BODY teleoperation with a knee-style body structure |
| Tianzhun 003 control unit | Runs KernelMind Apex and ROS 2 control services |
| Four cameras | Provide a four-tile first-person and environment view |
| Pico headset | Displays video and provides head tracking |
| Wearable arm units (left/right) | Capture operator arm motion |
| Waist tracker | Captures torso pose |
| Leg trackers | Two trackers capture lower-body motion for Skye BODY/LIFT or Luna leg mapping |
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
- **Leg trackers**: install both trackers at the specified positions for full-body tracking. Skye still requires the leg trackers even though the robot has no knee joints.
- Check battery, connection, and tracking state before use.

## Standard accessories

| Accessory | Qty | Description |
|---|---:|---|
| Pico headset | 1 | Headset used for Skye/Luna full-body teleoperation |
| Wearable arm units (left/right) | 1 each | Capture arm motion |
| Waist tracker | 1 | Captures torso pose |
| Leg trackers | 2 | Capture lower-body motion for Skye BODY/LIFT or Luna leg mapping |
| Ethernet cables | Several | Connect the robot, host PC, network device, and headset adapter |
| Type-C Ethernet adapter | 1 | Connects Pico to the wired LAN |

## Software

| Software | Location | Description |
|---|---|---|
| KernelMind Apex controller software | Tianzhun 003 | Matching robot control, camera, and teleoperation services |
| Teleop service | Host PC | Current matching baseline is `1.0.18`; processes teleoperation data |
| Apex frontend | Host PC | Current Gento documentation baseline is `1.0.6.81g`; connects the robot, switches modes, records, plays back, and displays logs |
| Apex Pico client | Pico headset | Network connection, video display, and full-body teleoperation input |

## Network

| Item | Description |
|---|---|
| Tianzhun 003 | Default examples use `6.6.7.100`; use the actual site address if changed |
| Host PC | Same subnet as Tianzhun 003, with no address conflict |
| Pico headset | Receives another address on the same subnet and connects to the actual Tianzhun 003 IP |

Do not assign the Pico headset the same IP address as Tianzhun 003.

## Product differences

- Skye has a 2-DOF BODY and 1-DOF LIFT with no knee joints. Luna has a 6-DOF knee-style body structure.
- Both Skye and Luna use one waist tracker and two leg trackers for full-body mapping. Marvin Pro primarily supports dual-arm teleoperation.
- Skye/Luna uses Pico waist and leg tracking and does not use Meta Quest as the standard full-body headset.
- Skye/Luna currently uses the [classic Apex Teleop interface](/software/apex-teleop/classic).
