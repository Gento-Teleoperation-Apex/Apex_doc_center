---
title: Current Marvin Pro
sidebar_position: 2
---

# Current Marvin Pro Apex Teleop

This page applies to the current Marvin Pro with a Tianzhun controller. The screenshots show the interface paired with Apex Teleop `1.0.7.6o`.

## Interface overview

![Current Marvin Pro Apex Teleop interface](/img/software/apex-teleop/pro-main.png)

| Area | Purpose |
|---|---|
| Top status bar | Robot, Camera, Teleop, Net, VR, and Healthy states |
| Controller IP | Enter the Tianzhun controller IP and press Enter |
| 3D view | URDF model and live robot pose |
| Module controls | Camera, Robot, Teleop, Tool, and dnsmasq controls |
| Robot Mode | Set Ready, robot mode, input mode, Home, and gripper restart |
| Data Record | Robot and camera data recording |
| Data Playback | Recorded data selection and playback |
| WebRTC | Four-tile camera stream |
| Side navigation | Main, log, and settings pages |

## First teleoperation sequence

1. Enter the Tianzhun controller IP in the upper-right field and press **Enter**.
2. Start **Robot**.
3. Confirm that the URDF pose matches the physical robot.
4. Start **Teleop** and **dnsmasq**.
5. Start **Camera** when video is required. Start **Tool** only when an end effector is configured.
6. Click **Start Robot** to set the robot Ready.
7. Select **Impedance Mode**.
8. Click **Home** to move to the teleoperation initial pose.
9. Set **Input Mode** to **Teleop**.
10. Connect the headset, open the Apex headset client, connect, and begin teleoperation.

> Keep the robot workspace clear and the emergency stop within reach. Watch the physical robot during mode changes and Homing.

## Module controls

| Module | Required | Description |
|---|---|---|
| Robot | Yes | Connects the robot and publishes robot state |
| Teleop | Yes | Starts the teleoperation chain |
| dnsmasq | Yes | Provides network service for a wired headset |
| Camera | Optional | Starts four-camera streaming and WebRTC |
| Tool | Optional | Controls a configured gripper or end effector |

Green indicates that a module is running. Dependent controls may remain unavailable until Robot is running and the robot is Ready.

## Robot Mode

### Robot control modes

| Control | Description |
|---|---|
| Start Robot | Sets the robot Ready |
| Standby Mode | Does not execute external motion commands |
| Position Mode | Position control mode |
| Impedance Mode | Compliant mode used for teleoperation |
| Home | Moves to the configured teleoperation initial pose |
| Restart (Gripper) | Restarts a configured gripper |

### Input modes

| Mode | Description |
|---|---|
| None | No external motion input |
| Teleop | Headset teleoperation input |
| Custom | Customer application or VLA input |

Read [Customer integration interfaces](./customer-interfaces) before using Custom mode.

## Camera view

![Four-tile camera view](/img/software/apex-teleop/pro-camera.png)

The camera panel always uses a four-tile layout. In the example, `camera_sources: [0, 1, none, none]` enables two cameras, so the lower two tiles are black by design. This does not indicate a camera fault. Bitrate, packet loss, and FPS are shown at the bottom.

## Recording

1. Connect the data drive and apply the required volume label.
2. Click **Start Recording**.
3. Keep Robot, Teleop, and any required Camera module running.
4. Stop recording and wait for writing to finish before removing the drive.

## Playback

1. Click **Select File** and choose a recording.
2. Use **Play**, **Pause**, and **Stop**.
3. Select the playback rate from **Speed**.

Before physical playback, clear the workspace, verify the initial pose, and keep the emergency stop within reach.

## Logs

Open the log page from the left navigation and select a module from the upper-right list.

![Robot module log](/img/software/apex-teleop/pro-log-robot.png)

![Teleop module log](/img/software/apex-teleop/pro-log-teleop.png)

| Control | Description |
|---|---|
| Module list | Switches between Robot, Teleop, and other module logs |
| Locked | Holds the current scroll position |
| Clear | Clears the currently displayed log |

Record the fault time and inspect both Robot and Teleop logs. Do not diagnose a fault from status indicators alone.
