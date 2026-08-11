---
title: User Guide
sidebar_position: 1
---

# Apex Teleop User Guide

The Apex host software connects to the robot controller, manages teleoperation modules and control modes, displays camera streams, records and plays back data, and provides runtime logs. A delivered software set includes the robot controller layer, the Teleop service, and the frontend. Their version numbers refer to different components.

| Software layer | Current documentation baseline | Purpose |
|---|---|---|
| Robot controller / MarvinSDK | `100343001` | Establishes the robot control link |
| Teleop service | `1.0.18` | Processes teleoperation data and the control chain |
| Marvin Pro frontend | `1.0.7.6o` | Host user interface |
| Gento frontend | `1.0.6.81g` | Skye/Luna host user interface; versions marked with `g` belong to the Gento product line |

Versions continue to evolve. These numbers identify the current documentation baseline; always use matching software from one delivery release.

## Compatibility

| Product | Interface | Notes |
|---|---|---|
| Marvin Pro (current Tianzhun version) | [Current interface](/software/apex-teleop/pro-current) | Screenshots use frontend `1.0.7.6o` |
| Marvin Pro (historical Orin version) | [Classic interface](/software/apex-teleop/classic) | For previously delivered systems |
| Skye / Luna | [Classic interface](/software/apex-teleop/classic) | Current documentation baseline is Gento frontend `1.0.6.81g` |

## Guides

- [Current Marvin Pro interface](/software/apex-teleop/pro-current)
- [Classic interface for historical Marvin Pro and Skye/Luna](/software/apex-teleop/classic)
- [Marvin Pro customer integration interfaces](/software/apex-teleop/customer-interfaces)
- [Gento (Skye/Luna) ROS 2 interfaces](/software/apex-teleop/gento-interfaces)
- [Configuration changes](/software/apex-teleop/configuration)
- [FAQ and quick reference](/software/apex-teleop/troubleshooting)
- [Pico headset guide](/xr-teleop/pico)
- [Meta Quest headset guide](/xr-teleop/meta)

> Marvin Pro supports Pico and Meta Quest. Skye/Luna full-body teleoperation uses Pico with waist and leg trackers.
