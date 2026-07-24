---
title: Troubleshooting
sidebar_position: 4
---

# Troubleshooting

| Symptom | Check first |
|---|---|
| Cannot connect to Tianzhun 003 | IP, host subnet, and cable |
| Robot fails to start | E-stop, robot power, and Robot log |
| 3D and physical poses differ | Model configuration, Robot state, and joint feedback |
| Pico cannot connect | Pico address, target IP, network module, and Ethernet adapter |
| Skye arms move but BODY/LIFT does not | Model configuration and waist/leg tracker placement, charge, and tracking state |
| Luna arms move but torso/legs do not | Model configuration and waist/leg tracker placement, charge, and tracking state |
| Skye does not show VR Connected | Current Skye releases must not be diagnosed from this state alone; also verify continuous target-pose and enable data |
| Luna receives data but cannot teleoperate | Headset-to-controller TCP session, target IP, client version, and network state |
| Motion direction is wrong | Left/right units, tracker orientation, and Home pose |
| No camera image | Camera module, four-camera wiring, and log |
| No teleoperation motion | Robot Ready, Impedance Mode, Home, and headset connection |

Press the emergency stop immediately for abnormal motion, instability, or interference. For support, provide the model, versions, fault time, logs, and tracker-wearing photos.
