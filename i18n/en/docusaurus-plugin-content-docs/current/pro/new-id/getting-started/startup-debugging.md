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
5. [Common Configuration](#5-common-configuration)
6. [Installation and Update](#6-installation-and-update)
7. [Troubleshooting and Safety Notes](#7-troubleshooting-and-safety-notes)
8. [ROS Topics Reference](#8-ros-topics-reference)

---

## 1. System Overview

Apex Teleop is a robot teleoperation console that supports real-time 3D visualization, motion control, camera view, data recording, and playback.

**Supported robot models:** Marvin Pro Tianzhun Edition and Gento series robots, including Skye/Luna.

**Communication architecture:** The frontend communicates with ROS 2 control nodes through the unified backend API on port 8080.

---

## 2. Quick Start

### 2.1 Log in to the Tianzhun Electric Cabinet

After connecting the host PC and electric cabinet to the same subnet, set the wired network adapter of the host PC to the `6.6.7.xxx` subnet, for example `6.6.7.165`, and then test the cabinet network:

```bash
ping 6.6.7.100
```

Log in to the Tianzhun electric cabinet through SSH:

```bash
ssh nvidia@6.6.7.100
# Password: nvidia
```

If you need to view the controller desktop directly, connect a monitor to the cabinet through HDMI and connect a keyboard and mouse for local operation.

### 2.2 Initialize the Camera

Each time the electric cabinet is powered on again, initialize the camera first:

```bash
cd ~/cam_geac
./rb_camera.sh
```

Wait about 20 seconds. After camera initialization is complete, start the teleoperation system.

### 2.3 Start the Teleoperation System

Enter the Apex directory and run the startup script:

```bash
cd /opt/kernelmind/apex
./bringup_RM.sh
```

After pressing Enter, the system automatically starts the teleoperation services. Once startup is complete, robot operation can begin.

> When connecting through MobaXterm over SSH, disable `X11-Forwarding`; otherwise camera acquisition may time out or the VR view may become white.

### 2.4 Open the Frontend Application

Open the new Apex Teleop frontend and make sure the host PC and Tianzhun core controller are on the same LAN.

### 2.5 Configure the Robot IP

1. Click the IP address area on the right side of the top status bar.
2. Enter the Tianzhun core controller IP address: `6.6.7.100`.
3. Press Enter or click Confirm.
4. The page refreshes automatically and connects to the new address.
5. After starting the Robot module, click the frontend `Home` button, shown as `Home`, `家`, or `复位` depending on language/version, to move the robot into the teleoperation-ready pose before starting Teleop or operating the robot.

> **Note:** The host PC, Tianzhun core controller, robot controller, and headset must be on the same LAN and in the same subnet.

Headset operation manuals:

- [Meta Quest Headset Manual](../../../xr-teleop/meta)
- [Pico Headset Manual](../../../xr-teleop/pico)

---

## 3. Interface Layout

![Marvin Pro Tianzhun Edition Apex Teleop overview](/img/pro/new-id/apex-teleop-pro-overview.png)

> The IP address in the screenshot is only an interface example. For Marvin Pro Tianzhun Edition, use the Tianzhun core controller IP `6.6.7.100` on site.

| Step | Area | Description |
|------|------|-------------|
| 1 | IP address input | Enter the Tianzhun core controller IP `6.6.7.100`, then press Enter |
| 2 | Module control bar | Start backend modules such as Camera, Robot, Teleop, and dnsmasq as needed |
| 2.1 (optional) | Camera view | After the Camera module starts, the camera view is displayed; before startup it shows “Camera module not started” |
| 3 / 4 | Robot mode | Start robot control, click Home to enter the teleoperation-ready pose, and switch between Standby, Position, and Impedance modes |
| 5 (optional) | 3D viewer | Displays the robot model and joint angles in real time |
| 6 (optional) | Data recording | Records teleoperation data |
| 7 (optional) | Real-machine playback | Selects a data package and plays it back on the real robot |
| 8 (optional) | Left navigation bar | Switches between the main page and log page |

### 3.1 Top Status Bar

| Indicator | Meaning |
|-----------|---------|
| Robot | Green = robot control service is running |
| Camera | Green = camera service is running |
| Teleop | Green = teleoperation service is running |
| Net | Green = DHCP network service is running |
| VR | Green = VR controller is connected |

The upper-right area provides refresh, language selection, and IP address input. The right-side connection status bar displays robot connection, VR status, and related module status.

### 3.2 3D Robot Viewer

- Displays robot joint angles in real time
- Supports mouse rotation, zoom, and pan
- Used to confirm the current robot pose, joint angles, and initial state before teleoperation

### 3.3 Module Control Bar

| Module | Function | Description |
|--------|----------|-------------|
| Camera | Start camera | Displays the camera view on the right after startup |
| Robot | Start robot control | Enables robot control mode after startup |
| Teleop | Start teleoperation | May show Locked if Robot is not ready |
| dnsmasq | Start network service | Used for network address allocation for devices such as the headset; start according to on-site configuration |

> Teleop requires Robot to be running first; otherwise the button shows Locked.

### 3.4 Camera View

- Displays the GMSL four-in-one camera view using the `quad_tile` theme
- Shows a prompt when the Camera module has not started
- Displays real-time bitrate, packet loss, FPS, and other status values at the bottom

---

## 4. Functional Operations

### 4.1 Robot Mode Card

The Robot Mode card shows the robot control entry status and provides control mode status and gripper restart entry.

| Area | Description |
|------|-------------|
| `Service Off` / start entry | Shows whether the robot control service is available |
| `Standby Mode` / `Position Mode` / `Impedance Mode` | Shows or switches the robot control mode; unavailable before the service is ready |
| Prompt text | Shows current prerequisites, for example starting the robot first |
| `Home` / `家` / `复位` | After connection and robot startup, click this button to move the robot into the teleoperation-ready pose |
| `Restart (Gripper)` | Restarts the gripper controller |

### 4.2 Data Recording

1. Enter the recording name in the record name input field.
2. Click **Start Recording** to start recording.
3. The button displays the recording status while recording.
4. Click **Stop Recording** to stop and save.

> Recording files are saved in the specified directory on the Tianzhun core controller.

### 4.3 Data Playback

1. Click **Select File** and choose the data package to play back.
2. Click **Play** to start playback.
3. Click **Pause** to pause current playback.
4. Click **Stop** to stop playback.
5. Use the speed dropdown to adjust playback speed if needed.
6. The 3D viewer synchronizes and displays joint data during playback.

**Playback controls:**

| Control | Function |
|---------|----------|
| Select File | Selects the playback data package |
| Play | Starts playback |
| Pause | Pauses current playback |
| Stop | Stops playback |
| Speed | Adjusts playback speed |

### 4.4 Log View

1. Click the left navigation bar to switch to the **Log** page.
2. Use the top dropdown to select the module to view: Robot/Teleop/Camera/DNSMasq/System.
3. A green **LIVE** indicator means logs are being received in real time.
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

## 5. Common Configuration

### 5.1 Disable the Official Camera or Gripper

Enter the launch file directory and make the target file writable:

```bash
cd /opt/kernelmind/apex/install/node_manager/share/node_manager/launch
sudo chmod 666 bringup_all_dm_m6.launch.py
```

Comment out the `dm_gripper` (gripper) or `quadcam` (camera) related lines according to the actual configuration.

![Disable official camera and gripper](/img/pro/quick-start/config_disable_camera_gripper.png)

### 5.2 Modify Robot IP / Payload and Other Parameters

Common configuration file paths:

```text
/opt/kernelmind/apex/install/marvin_ros_control/share/marvin_ros_control/config
/opt/kernelmind/apex/install/marvin_teleop/share/marvin_teleop/config
```

If the file is read-only, run:

```bash
sudo chmod 666 <file-name>
```

The default robot IP is `6.6.7.190`. Other parameters should be confirmed with technical support before modification.

![Modify configuration parameters](/img/pro/quick-start/config_parameters.png)

### 5.3 Modify the Dual-Arm IP Used by the Tianzhun Controller

Modify the following file:

```text
/opt/kernelmind/apex/install/marvin_ros_control/share/marvin_ros_control/config/robot_param_m6.yaml
```

Field: `robot_ip`; default value: `6.6.7.190`. This IP is the configuration IP used by the Tianzhun controller to connect to the dual-arm controller and must match the dual-arm controller IP.

![Modify dual-arm IP for the Tianzhun controller](/img/pro/quick-start/config_orin_robot_ip.png)

### 5.4 Modify the Headset Apex Connection IP

After powering on the headset, open the Apex app under Unknown Sources and press the menu button on the left controller to open the configuration screen:

- First input field: height, used for virtual controller alignment height. For example, `1.65` means 165 cm.
- Second input field: IP address of the Tianzhun controller, usually `6.6.7.100`.

![Modify headset Apex connection IP](/img/pro/quick-start/config_headset_ip.png)

### 5.5 Modify TCP Position

The current TCP default is an offset of `50 mm` along the `Z+` direction from the arm flange end. Normally no modification is required. If modification is needed, edit:

```text
/opt/kernelmind/apex/install/marvin_teleop/share/marvin_teleop/config/mjcf/marvin_pro_mink.xml
```

Fields to modify:

- Left arm: around line 86, `tool` offset `0 0 0.05`.
- Right arm: around line 138, `tool` offset `0 0 0.05`.

![TCP configuration file location](/img/pro/quick-start/config_tcp_file.png)

### 5.6 Modify Home Position

The Home position is the robot reset position and can also be understood as the teleoperation initial position. Home position must be modified in two places:

```text
/opt/kernelmind/apex/install/marvin_teleop/share/marvin_teleop/config/mjcf/marvin_pro_mink.xml
/opt/kernelmind/apex/install/marvin_teleop/share/marvin_teleop/config/robot_param_m6.yaml
```

Both files contain 14 parameters: the first 7 are for the left arm Home position, and the last 7 are for the right arm Home position. The unit is radians.

![Home position MJCF location](/img/pro/quick-start/config_home_xml.png)

![Home position YAML location](/img/pro/quick-start/config_home_yaml.png)

> Before modifying IP, payload, stiffness, damping, Home position, or TCP offset, back up the original configuration files.

### 5.7 Foot Pedal Installation and Configuration

The foot pedal is a non-standard extension. Configure it only when motion-capture gloves, dexterous hands, or foot-pedal enable operation is selected.

The Tianzhun controller must have network access to download dependencies:

```bash
sudo apt-get install libhidapi-dev
cd ~
git clone https://github.com/rgerganov/footswitch.git
cd footswitch
make
sudo make install
footswitch -1 -m shift -k left -3 -m shift -k right
```

If `cannot find footswitch` appears, check whether the foot pedal USB is inserted into the Tianzhun controller, then unplug and reconnect it.

Recommended startup for foot pedal mode:

```bash
cd /opt/kernelmind/apex
./bringup_RM_glove.sh
```

![Foot pedal key mapping](/img/pro/quick-start/footswitch_mapping_start.png)

Foot pedal teleoperation notes:

- The left and right controller enable buttons are disabled; only the foot pedal can enable teleoperation.
- Key 1: enables both controllers together.
- Key 3: moves both arms back to the Home position.
- Do not press the right controller menu button while stepping on the enable pedal. Otherwise, the arms may drop and collide.
- Release the pedal whenever not teleoperating.

### 5.8 Incremental Teleoperation Mode

The factory default motion mode is incremental position motion. When entering enable state in incremental mode, the current controller position is treated as the zero point, and only subsequent translation and rotation changes are sent as increments. Alignment with the virtual red/blue controllers is not required.

To switch the motion mode, modify:

```text
/opt/kernelmind/apex/install/marvin_teleop/share/marvin_teleop/config/robot_param_m6.yaml
```

Fields:

```yaml
use_incremental_control: true   # Incremental mode (default)
use_incremental_control: false  # Absolute position mode
```

![use_incremental_control configuration](/img/pro/quick-start/incremental_control_config.png)

## 6. Installation and Update

### 6.1 Install Headset APK

The Tianzhun controller must connect to Wi-Fi to download ADB tools:

```bash
sudo apt update
sudo apt install android-tools-adb -y
adb version
```

Connect the headset:

1. Use a Type-C data cable to connect the headset and Tianzhun controller.
2. Wear the headset and allow USB debugging in the headset.
3. Run `adb devices` on the Tianzhun controller.
4. If `device` is displayed, the connection is successful.

```bash
adb devices
adb shell pm list packages | grep Apex
adb uninstall <old-package-name>
adb install -r KernelMind_Apex_meta_260410.apk
```

![Install Meta headset APK](/img/pro/quick-start/install_headset_apk_terminal.png)

### 6.2 Install the Tianzhun Controller KernelMind System

Copy the deb package to the Tianzhun controller, for example to `~/Downloads`.

```bash
sudo apt remove kernelmind_apex
cd ~/Downloads
sudo apt install ./kernelmind_apex_<version>_<arch>.deb
```

After installation, log in again or manually load the environment:

```bash
source /etc/profile.d/kernelmind_apex.sh
ros2 pkg list | grep -E 'marvin|gmsl|node_manager'
```

![Install Tianzhun controller KernelMind system](/img/pro/quick-start/install_deb_terminal.png)

### 6.3 Configure Network Parameters

The following example uses `eth0` and `6.6.7.100/24`. Replace them according to the on-site subnet:

```bash
nmcli device status
sudo nmcli con add type ethernet ifname eth0 con-name apex-robot-net \
  ipv4.method manual ipv4.addresses 6.6.7.100/24
sudo nmcli con up apex-robot-net
```

If a connection profile already exists, modify it directly:

```bash
sudo nmcli con mod apex-robot-net ipv4.method manual ipv4.addresses 6.6.7.100/24
sudo nmcli con up apex-robot-net
```

Set the host PC network adapter to the same subnet, for example `6.6.7.165`.

If an independent router exists in the LAN, the DHCP `option routers` value should be the router address. Only when the Tianzhun controller acts as a software router and directly provides DHCP should the Tianzhun controller address be used.

### 6.4 Modify QuickView / Camera Parameters

The QuickView camera configuration file is installed at:

```text
/opt/kernelmind/apex/install/gmsl_quadcam/share/gmsl_quadcam/config/quad_csi_quickview.yaml
```

Common fields:

```yaml
quad_csi_quickview:
  ros__parameters:
    signal_url: "ws://6.6.7.100:8554"
    vr_room_id: "10"
    quad_room_id: "11"
    camera_config:
      camera_sources:
        head_left: "csi://0"
        head_right: "csi://1"
        hand_left: "csi://4"
        hand_right: "csi://5"
```

If a camera is temporarily unused, set it to `"none"`; the corresponding view will be blank.

## 7. Troubleshooting and Safety Notes

### 7.1 Common Issues

| Symptom | Check items |
|---|---|
| VR headset view is white | Check whether `X11-Forwarding` is disabled in MobaXterm; check camera service and signaling address |
| Startup error | Check whether parameters such as `K` and `D` in `robot_param_m6.yaml` keep floating-point format, for example `6.0` |
| No camera view | Check `/dev/video*`, Senyun camera-end connector, exposed arm cable, sensor-id, and `quad_csi_quickview.yaml` |
| VR or host PC cannot connect to signaling | Check whether `signal_url` is the Tianzhun controller control-network IP, for example `ws://6.6.7.100:8554` |
| Robot does not respond to control | Check emergency stop, power control, drive status, ROS nodes, and whether target pose is updating normally |
| deb installation fails | Run `sudo apt update` and `sudo apt install -f`, then install again |

Common check commands:

```bash
ip addr
ip route
ping 6.6.7.100
ros2 node list
ros2 topic list
ros2 service list
ls /dev/video*
journalctl -xe
ls ~/.ros/log
```

### 7.2 Safety Notes

1. Before teleoperation, confirm that the emergency stop button, controller power, communication Ethernet cable, USB drive, and headset battery are normal.
2. Switch to standby mode when not teleoperating to avoid accidental side-button input. If a foot pedal is selected, also avoid accidental stepping.
3. Although incremental mode does not require red/blue controller alignment, the hand position should still roughly match the current gripper position before entering teleoperation.
4. When using the foot pedal, do not press the right controller menu button while stepping on the enable pedal.
5. Before modifying IP, payload, stiffness, damping, Home position, or TCP offset, back up the original configuration files.
6. If the headset battery is depleted, power is cut abnormally, or the headset shuts down, stop teleoperation immediately.

## 8. ROS Topics Reference

| Topic | Function | Type |
|---|---|---|
| `/control/target_poseL` | Left-hand TCP target point during teleoperation | `geometry_msgs/msg/PoseStamped` |
| `/control/target_poseR` | Right-hand TCP target point during teleoperation | `geometry_msgs/msg/PoseStamped` |
| `/control/gripperValueL` | Left controller front trigger value during teleoperation; used to control left gripper opening/closing | `std_msgs/msg/Float32` |
| `/control/gripperValueR` | Right controller front trigger value during teleoperation; used to control right gripper opening/closing | `std_msgs/msg/Float32` |
| `/control/gripL` | Left controller side-button bool value; after alignment with the target sphere, hold the side button to enter teleoperation | `std_msgs/msg/Bool` |
| `/control/gripR` | Right controller side-button bool value; after alignment with the target sphere, hold the side button to enter teleoperation | `std_msgs/msg/Bool` |
| `/info/eef_left` | Left arm flange pose computed by forward kinematics | `geometry_msgs/msg/PoseStamped` |
| `/info/eef_right` | Right arm flange pose computed by forward kinematics | `geometry_msgs/msg/PoseStamped` |
| `/info/joint_feedback` | Robot joint feedback: left arm joints 1-7 and right arm joints 1-7, 250 Hz | `marvin_msgs/msg/Jointfeedback` |
| `/joint_states` | Robot joint positions: left arm joints 1-7 and right arm joints 1-7, 50 Hz | `std_msgs/msg/JointState` |
| `/robot_description` | Robot URDF visualization | `std_msgs/msg/String` |
| `/usb_cam_0/image_raw` | Binocular camera video stream | `sensor_msgs/msg/Image` |
| `/gripper/feedback_L_err` | Left gripper error code for monitoring gripper status | `std_msgs/msg/Int32MultiArray` |
| `/gripper/feedback_R_err` | Right gripper error code for monitoring gripper status | `std_msgs/msg/Int32MultiArray` |
| `/info/arm_state` | Robot arm status information | `std_msgs/msg/Int16MultiArray` |
| `/info/collision_marker` | Robot end-effector trajectory prediction | `visualization_msgs/msg/MarkerArray` |
| `/info/collision_statusA` | Left arm end-effector trajectory collision bool value | `std_msgs/msg/Bool` |
| `/info/collision_statusB` | Right arm end-effector trajectory collision bool value | `std_msgs/msg/Bool` |
