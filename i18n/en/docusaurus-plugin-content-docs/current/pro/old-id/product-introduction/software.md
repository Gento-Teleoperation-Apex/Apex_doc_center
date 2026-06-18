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

Click **Standby**, **Position**, or **Impedance** to switch modes.

![Teleoperation software control modes](/img/pro/software/control_modes.png)

## Speed Control

- `Slow`: reduced movement speed
- `Fast`: higher movement speed

Speed can only be changed while in **Standby mode**.

> **Note**
>
> * Start the robot before switching modes.
> * If startup fails, check the IP address, backend service, and robot driver status.
> * Robot startup may fail if the USB drive is not inserted.

![Speed control](/img/pro/software/speed_control.png)

## Data Recording

1. Click **Data Recording** on the main panel.
2. Click **Start Recording**.
3. Click the red **Stop Recording** button to stop.
4. Data is saved to the USB drive labeled `BAG_STORAGE` in the folder `my_bag-YYYY-MM-DD-HH-mm-ss`:
   - `data/` — ROS bag data
   - `video/` — MP4 video

> Recording is only available when the USB drive is inserted.

![Data recording feature](/img/pro/software/data_recording.png)

## Reset & Hardware Replay

**Reset**: after teleoperation or hardware replay, click **Reset** to return the robot arms to the default Home position.

![Reset feature](/img/pro/software/reset.png)

**Hardware Replay**: select a recorded bag file and press play.

Steps:

1. Click the **Playback** card on the main panel.
2. Click **Select File** in the side panel.
3. Select an available bag file in the dialog; the file details will be shown after loading.
4. Click **Play** to replay the recorded robot motion.

> Note: teleoperation and replay cannot be active at the same time.

![Hardware replay feature](/img/pro/software/playback.png)

## Gripper Restart

If a gripper disconnects or is hot-plugged, click **Gripper Restart** to restore its state.

![Gripper restart feature](/img/pro/software/gripper_restart.png)

## Operation Logs

Logs are saved on Orin at:

```text
~/.ros/log
```

Export this folder when logs are needed for troubleshooting.

![Operation log location](/img/pro/software/log_location.png)
