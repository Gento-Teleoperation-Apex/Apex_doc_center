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

### Wiring Checklist

When connecting cameras and peripherals, connect each camera cable to the corresponding numbered port first, then connect the USB drive, Ethernet cable, deserializer-board power, and Orin power.

| Item | Connection |
| --- | --- |
| Camera cables | Connect to the matching deserializer-board ports and confirm the port-to-camera mapping |
| USB drive | Connect to Orin for data recording; label must be `BAG_STORAGE` |
| Ethernet cable 2 | Connect to Orin, keeping it on the same router network as the robot controller and VR headset adapter |
| Deserializer-board power | Connect to the deserializer-board power input |
| Orin power | Connect to the Orin controller power input |

### Power-On Check

| Step | Action | Checkpoint |
| --- | --- | --- |
| 1 | Power the deserializer board first | Wait about 10 seconds and confirm stable board power |
| 2 | Power Orin next | Wait about 1 minute and confirm Orin has booted |
| 3 | Check indicators | Confirm all four camera-port indicator LEDs are solid on |

![Deserializer board wiring diagram](/img/pro/pro_components_deserializer_wiring.png)

## Communication Network

Connect all devices to the same router via Ethernet:

| Device | Default IP |
|---|---|
| Robot controller | `192.168.10.190` |
| Orin main controller | `192.168.10.123` |
| VR headset adapter | Assigned by router (DHCP) |
