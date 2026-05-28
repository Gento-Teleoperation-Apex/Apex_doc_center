---
title: Components
sidebar_position: 3
---

# Components

## Controller & Power

| Component | Description |
|---|---|
| NVIDIA Jetson Orin | Main compute unit running KernelMind Apex |
| 220 V → 48 V switching PSU | Main power supply for dual-arm robot |
| 12 V controller PSU | Powers the robot controller |
| Emergency-stop button box | Wired into the robot's e-stop circuit |
| Discharge module | Connected in parallel to the 48 V bus for circuit protection |

## Camera Deserializer Board

The deserializer board is mounted under the Orin and supports up to 4 GMSL cameras. Port-to-camera mapping:

| Port number | Camera |
|---|---|
| 8 | Left-eye camera |
| 6 | Left-wrist camera |
| 7 | Right-wrist camera |
| 0 | Right-eye camera |

Power-on sequence: **power the deserializer board first**, wait ~10 seconds, **then power Orin**, wait ~1 minute and confirm all four indicator LEDs are solid on.

![Deserializer board ports and power-on procedure](/img/pro_p16.png)

## Communication Network

Connect all devices to the same router via Ethernet:

| Device | Default IP |
|---|---|
| Robot controller | `192.168.10.190` |
| Orin main controller | `192.168.10.123` |
| VR headset adapter | Assigned by router (DHCP) |
