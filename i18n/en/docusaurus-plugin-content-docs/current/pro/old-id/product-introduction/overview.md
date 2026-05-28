---
title: Product Overview
sidebar_position: 1
---

# Product Overview

## Positioning

KernelMind Apex is a plug-and-play teleoperation kit for robotic systems. It gives operators an immersive first-person view through a VR headset and maps their movements to the robot in real time.

The Marvin Pro (Old ID) variant supports dual-arm robot teleoperation with a Meta Quest VR headset and an NVIDIA Jetson Orin controller.

Optional accessories: Manus data glove + Wuji Hand for fine finger-motion capture.

## System Components

The Marvin Pro teleoperation system includes:

- Dual-arm robot body
- Robot controller
- 48 V main power supply (220 V → 48 V switching PSU)
- 12 V controller power supply
- Emergency-stop button box
- NVIDIA Jetson Orin main controller
- Camera deserializer board (supports 4× GMSL cameras)
- VR headset (Meta Quest) with controllers
- Router and Ethernet cables
- USB drive for data recording (label must be `BAG_STORAGE`)

![Orin and VR kit components](/img/pro_p10.png)

Recommended network setup: connect the robot controller, Orin, and VR headset adapter to the same router via Ethernet.

![Network connection overview](/img/pro_p11.png)

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
