---
title: Software
sidebar_position: 5
---

# Software

## KernelMind Apex

KernelMind Apex is the robot teleoperation software installed on the Orin controller. It has two components:

- **Orin side**: `kernelmind-apex_<version>_arm64.deb` — ROS 2 nodes and motion control logic
- **Headset side**: `KernalMind_Apex_meta_<version>.apk` — runs on Meta Quest VR headset, provides the immersive operator interface

### System Requirements

| Item | Requirement |
|---|---|
| OS (Orin) | Ubuntu 22.04 ARM64 |
| Robot framework | ROS 2 Humble |
| Headset | Meta Quest (APK installed via ADB) |

## Control Modes

Three control modes are available after the robot starts:

| Mode | Purpose |
|---|---|
| Standby | Initialization and error recovery; switch here when not teleoperating |
| Position | Precise position control |
| Impedance | Force-controlled interaction, drag teaching, teleoperation (use this for teleop) |

![Teleoperation software control modes](/img/pro_p28.png)

## Speed Control

- `Slow`: reduced movement speed
- `Fast`: higher movement speed

Speed can only be changed while in **Standby mode**.

![Speed control](/img/pro_p29.png)

## Data Recording

1. Click **Data Recording** on the main panel.
2. Click **Start Recording**.
3. Click the red **Stop Recording** button to stop.
4. Data is saved to the USB drive labeled `BAG_STORAGE` in the folder `my_bag-YYYY-MM-DD-HH-mm-ss`:
   - `data/` — ROS bag data
   - `video/` — MP4 video

> Recording is only available when the USB drive is inserted.

![Data recording feature](/img/pro_p30.png)

## Reset & Hardware Replay

**Reset**: after teleoperation or hardware replay, click **Reset** to return the robot arms to the default Home position.

![Reset feature](/img/pro_p31.png)

**Hardware Replay**: select a recorded bag file and press play.

> Note: teleoperation and replay cannot be active at the same time.

![Hardware replay feature](/img/pro_p32.png)

## Gripper Restart

If a gripper disconnects or is hot-plugged, click **Gripper Restart** to restore its state.

![Gripper restart feature](/img/pro_p33.png)

## Operation Logs

Logs are saved on Orin at:

```text
~/.ros/log
```

![Operation log location](/img/pro_p20.png)
