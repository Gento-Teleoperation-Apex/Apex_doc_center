---
title: Startup and Debugging
sidebar_position: 2
---

# Startup and Debugging

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Quick Start](#2-quick-start)
3. [Interface Layout](#3-interface-layout)
4. [Functional Operations](#4-functional-operations)
5. [FAQ](#5-faq)

---

## 1. System Overview

Apex Teleop is a robot teleoperation console that supports real-time 3D visualization, motion control, camera view, data recording, and playback.

**Supported robot models:** Marvin series and Gento series, including Skye/Luna.

**Communication architecture:** The frontend communicates with ROS 2 control nodes through the unified backend API on port 8080.

---

## 2. Quick Start

### 2.1 Remotely Connect to the Tianzhun 003 Control Unit

After the host PC and robot are connected to the same LAN, test the network connection to the Tianzhun 003 control unit first. The default example IP is `6.6.7.100`; if the on-site IP has been changed, use the actual address.

```bash
ping 6.6.7.100
```

Log in to the Tianzhun 003 control unit through SSH:

```bash
ssh nvidia@6.6.7.100
# Password: nvidia
```

### 2.2 Start the Backend Program

Enter the Apex directory and run the startup script:

```bash
cd /opt/kernelmind/apex
./bringup_RM.sh
```

After pressing Enter, the system starts the teleoperation services. Open the frontend after startup is complete.

### 2.3 Check Backend Services

On the robot controller, such as the built-in Tianzhun 003 control unit, make sure the following services are running:

| Service | systemd unit | Description |
|------|-------------|------|
| Backend API | `apex-backend.service` | Unified HTTP/WebSocket entry |
| Camera | `apex-camera.service` | GMSL four-camera service |
| Robot control | `apex-robot.service` | ROS control and state publishing |
| Teleoperation | `apex-teleop.service` | IK, planning, and command multiplexing |

```bash
# Check service status
sudo systemctl status apex-backend.service
sudo systemctl status apex-camera.service
sudo systemctl status apex-robot.service
sudo systemctl status apex-teleop.service
```

### 2.4 Open the Frontend Application

Open the Apex Teleop frontend on the host PC.

### 2.5 Configure the Robot IP

1. Click the IP address area on the right side of the top status bar.
2. Enter the robot controller / Tianzhun 003 control unit IP address. The default example is `6.6.7.100`; if the on-site configuration uses `192.168.20.xxx`, use the actual address.
3. Press Enter or click Confirm.
4. The page refreshes automatically and connects to the new address.
5. After starting the Robot module, click the frontend `Home` button, shown as `Home`, `家`, or `复位` depending on language/version, to move the robot into the teleoperation-ready pose before starting Teleop or operating the robot.

> **Note:** The host PC must be on the same LAN and same subnet as the robot.

---

## 3. Interface Layout

![Apex Teleop annotated overview](/img/gento/luna/apex_teleop_overview_annotated.jpg)

| Step | Area | Description |
|------|------|-------------|
| 1 | IP address input | Enter robot IP, for example `192.168.20.123`, then press Enter |
| 2 | Module control bar | Start backend modules such as Camera, Robot, and Teleop as needed |
| 2.1 (optional) | WebRTC view | After the Camera module starts, the WebRTC connection button appears; click it to view camera images |
| 3 / 4 | Robot Mode | Start robot control, click Home to enter the teleoperation-ready pose, and switch Standby, Position, and Impedance modes |
| 5 (optional) | 3D viewer | Displays the robot model and joint angles in real time |
| 6 (optional) | Data Record | Records teleoperation data |
| 7 (optional) | Data Playback | Selects a bag file and plays it back on the real robot |
| 8 (optional) | Left navigation bar | Opens the log page to view module logs |

### 3.1 Top Status Bar

| Indicator | Meaning |
|--------|------|
| Robot | Green = robot control service is running |
| Camera | Green = camera service is running |
| Teleop | Green = teleoperation service is running |
| Net | Green = DHCP network service is running |
| VR | Green = VR controller is connected |
| Healthy | Green = all modules normal; red = error exists |

![Top status bar](/img/pro/software/apex_teleop_status_bar.jpg)

The right-side connection status bar displays robot connection, VR status, and control module status codes.

![Connection status bar](/img/pro/software/apex_teleop_connection_status.jpg)

### 3.2 3D Robot Viewer

- Displays robot joint angles in real time
- Supports mouse rotation, zoom, and pan
- Blue sphere: left arm target pose
- Red sphere: right arm target pose
- Displays Robot/VR connection status and arm status codes on the left side

![3D robot viewer](/img/pro/software/apex_teleop_3d_viewer.jpg)

### 3.3 Module Control Bar

| Module | Start | Stop | Restart |
|------|-------|------|---------|
| Camera | Start camera | Stop camera | Restart camera |
| Robot | Start robot control | Stop robot control | Restart robot control |
| Teleop | Start teleoperation | Stop teleoperation | Restart teleoperation |

> Teleop requires Robot Control to be running first; otherwise the button shows Locked.

![Module control bar](/img/pro/software/apex_teleop_module_control.jpg)

### 3.4 Camera View

- Displays the GMSL four-in-one camera view using the `quad_tile` theme
- Shows a prompt when the Camera module has not started
- Displays bitrate, packet loss, FPS, and other real-time status at the bottom

![WebRTC camera view](/img/pro/software/apex_teleop_webrtc.jpg)

---

## 4. Functional Operations

### 4.1 Robot Mode Card

![Robot Mode control card](/img/pro/software/apex_teleop_robot_mode.jpg)

The current `Robot Mode` card is used to view robot control entry status and keeps control mode display and gripper restart entry.

| Area | Description |
|------|-------------|
| `Service Off` / start entry | Shows whether the robot control service is available |
| `Standby Mode` / `Position Mode` / `Impedance Mode` | Shows or switches robot control mode; unavailable before the service is ready |
| Prompt text | Shows prerequisites, for example starting the robot first |
| `Home` / `家` / `复位` | After connection and robot startup, click this button to move the robot into the teleoperation-ready pose |
| `Restart (Gripper)` | Restarts the gripper controller |

### 4.2 Data Recording

![Data Record card](/img/pro/software/apex_teleop_data_record.jpg)

1. Enter the recording name in **Record Name**.
2. Click **Start Recording**.
3. The button displays recording status during recording.
4. Click **Stop Recording** to stop and save.

> Recording files are saved in the specified directory on the robot controller.

### 4.3 Data Playback

![Data Playback card](/img/pro/software/apex_teleop_data_playback.jpg)

1. Select a bag file from **Select playback file**.
2. Click **Play** to start playback.
3. Click **Stop** to stop playback.
4. Enable **Loop Playback** if loop playback is needed.
5. The 3D viewer synchronizes and displays joint data during playback.

**Playback controls:**

| Control | Function |
|------|------|
| Play | Play |
| Stop | Stop playback |
| Select playback file | Select playback file |
| Loop Playback | Loop playback switch |

### 4.4 Log View

1. Click the left navigation bar to switch to the **Log** page.
2. Use the top dropdown to select the module to view: Robot/Teleop/Camera/DNSMasq/System.
3. A green **LIVE** indicator means real-time logs are being received.
4. In live log mode, the view automatically scrolls to the bottom (Follow).
5. Manually scrolling the log locks the position (Locked); click to resume following.

**Shortcuts:**

- `Ctrl + A`: select all log text
- `Clear`: clear the current log
- `Fetch` (System mode): fetch system error logs

### 4.5 Language Switching

Click the globe icon in the upper-right area and select a language:

- English
- Chinese (Simplified)
- Japanese

---

## 5. FAQ

### 5.1 Cannot Connect to the Robot

| Symptom | Possible cause | Solution |
|------|---------|---------|
| "Robot disconnected" is shown in red | WebSocket port 8080 is unreachable | Check whether the robot IP is correct, the Ethernet cable is connected, and both sides are on the same subnet |
| All module indicators are gray | Backend API connection failed | Check whether `apex-backend.service` is running |
| Page loads but 3D does not update | No ROS topic data | Confirm that backend WebSocket `/ws/v1/topics` is connected |
| Camera view is black | Camera module is not started | Click Camera Start in the module control bar |

### 5.2 Mode Switching Fails

- **"Switch failed: Service returned error_code=0"**: ROS service call returned an exception; the mode may have switched successfully. Wait 2 seconds for automatic status refresh.
- **Start succeeds but immediately returns to not started**: the ROS control node did not actually enter ready state. Check robot hardware connection.
- **Mode buttons are not clickable**: confirm that Robot service is started and the robot is not in an error state.

### 5.3 Module Management

```bash
# Manually start/stop modules on the robot
sudo systemctl start apex-robot.service
sudo systemctl stop apex-robot.service
sudo systemctl restart apex-teleop.service
sudo systemctl status apex-camera.service

# View module logs
journalctl -u apex-robot.service -f -n 100
```

### 5.4 URL Reference

| Function | URL |
|------|------|
| Swagger API docs | `http://<robot-ip>:8080/docs` |
| OpenAPI JSON | `http://<robot-ip>:8080/openapi.json` |
| Health check | `http://<robot-ip>:8080/api/v1/system/health` |
| System errors | `http://<robot-ip>:8080/api/v1/system/errors?lines=100` |
