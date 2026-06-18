---
title: Product Overview
sidebar_position: 1
---

# Product Overview

## Positioning

KernelMind Apex is a plug-and-play teleoperation kit for robotic systems. It gives operators an immersive first-person view through a VR headset and maps their movements to the robot in real time.

The PRO variant supports dual-arm robot teleoperation with a Meta Quest VR headset and an NVIDIA Jetson Orin controller.

Optional accessories: Manus data glove + Wuji Hand for fine finger-motion capture.

## System Components

The Marvin Pro teleoperation system consists of the robot body, control cabinet, Orin controller, VR headset, network devices, and data-recording media. Before on-site deployment, check the equipment list below.

| Category | Device | Description |
| --- | --- | --- |
| Robot side | Dual-arm robot body | Executes teleoperation motions |
| Robot side | Robot controller | Receives commands from Orin and the control system |
| Power and safety | 48 V main power supply | 220 V to 48 V switching power supply |
| Power and safety | 12 V controller power supply | Powers the controller and related peripherals |
| Power and safety | Emergency-stop button box | Provides on-site emergency stop protection |
| Control and sensing | NVIDIA Jetson Orin controller | Runs KernelMind Apex and ROS 2 nodes |
| Control and sensing | Camera deserializer board | Supports 4-channel GMSL camera input |
| Operator side | VR headset (Meta Quest) with controllers | Provides first-person view and operator input |
| Network and data | Router and Ethernet cables | Connects the robot controller, Orin, and VR headset adapter |
| Network and data | USB drive | Used for data recording; label must be `BAG_STORAGE` |

![PRO equipment list](/img/pro/pro_overview_equipment.png)

## Network Connection

Recommended network setup: connect the robot controller, Orin, and VR headset adapter to the same router via Ethernet so that all devices are on the same LAN.

| Cable | Target |
| --- | --- |
| Ethernet cable 1 | Robot controller |
| Ethernet cable 2 | Orin |
| Ethernet cable 3 | VR headset adapter |

After connecting the cables, confirm that the router is powered on, then check the network status of the robot controller, Orin, and VR headset side.

![PRO network connection diagram](/img/pro/pro_overview_network.png)

## Core Capabilities

- Low-latency VR video streaming with multi-channel GMSL cameras (left-eye, right-eye, left-wrist, right-wrist)
- Millimeter-level spatial tracking with real-time motion mapping to robot arms
- Impedance mode, position mode, and standby mode
- Built-in ROS bag recording and hardware replay
- Foot-pedal extension and incremental teleoperation mode (factory default)

## Typical Use Cases

- Remote dual-arm robot teleoperation
- Robot-assisted work in hazardous environments
- Robot demonstration data collection
- Smart factory production assistance
