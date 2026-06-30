---
title: Startup and Debugging
sidebar_position: 2
---

# Startup and Debugging

## Table of Contents

1. [Start the Teleoperation System](#1-start-the-teleoperation-system)
2. [Host Software Operation](#2-host-software-operation)
3. [Common Configuration](#3-common-configuration)
4. [Installation and Update](#4-installation-and-update)
5. [Troubleshooting and Safety Notes](#5-troubleshooting-and-safety-notes)
6. [ROS Topics Reference](#6-ros-topics-reference)

---

## 1. Start the Teleoperation System

### 1.1 SSH into Orin and Start the Backend

Before using the robot, log in to the Orin controller through SSH and run the system initialization script:

```bash
ssh marvin@192.168.10.123
# Password: 1234
cd /opt/kernelmind/apex
./bringup_RM.sh
```

![SSH login and start robot backend](/img/pro/quick-start/launch_backend_terminal.png)

> When connecting through MobaXterm over SSH, disable `X11-Forwarding`; otherwise camera acquisition may time out or the VR view may become white.

### 1.2 Open KernelMind Apex Teleoperation Software

Select the corresponding installer for the PC teleoperation software based on the operating system:

| System | Package |
|---|---|
| Ubuntu | `KernelMind-Apex-<version>_amd64.AppImage` |
| Windows | `React ROS App <version>.exe` |
| Mac | `React ROS App-<version>-arm64.dmg` |

Connection steps:

1. Enter Orin IP: `192.168.10.123`.
2. Click `Confirm`.
3. Click `Start Robot` to start the robot.
4. Click the frontend `Home` button, shown as `Home`, `家`, or `复位` depending on language/version, to move the robot into the teleoperation-ready pose.
5. Click `Impedance Mode` to enter joint impedance mode.
6. Speed mode can be `Slow` / `Fast`; it can only be set in reset or standby state.

![KernelMind Apex teleoperation software connection](/img/pro/quick-start/launch_apex_teleop_app.png)

Headset operation manuals:

- [Meta Quest Headset Manual](../../../xr-teleop/meta)
- [Pico Headset Manual](../../../xr-teleop/pico)

## 2. Host Software Operation

### 2.1 Control Modes

After robot startup, three control modes can be selected:

| Mode | Purpose |
|---|---|
| Standby Mode | Initialization and error recovery; recommended when not teleoperating |
| Position Mode | Precise position control |
| Impedance Mode | Force-control interaction, drag teaching, and teleoperation control; used during teleoperation |

After connection and robot startup, click the frontend `Home` button, shown as `Home`, `家`, or `复位`, to move the robot into the teleoperation-ready pose before entering impedance mode or starting teleoperation.

![Teleoperation software control modes](/img/pro/software/control_modes.png)

### 2.2 Speed Adjustment

- `Slow`: slower motion speed
- `Fast`: faster motion speed

Speed can only be switched in **Standby Mode**.

![Speed adjustment](/img/pro/software/speed_control.png)

### 2.3 Data Recording

1. Insert a USB drive labeled `BAG_STORAGE`.
2. Click **Data Recording** on the main panel.
3. Click **Start Recording**.
4. Click the red **Stop Recording** button again to stop.

Data is saved to the `BAG_STORAGE` USB drive. Directory format: `my_bag-year-month-day-hour-minute-second`.

- `data/`: ROS bag data
- `video/`: MP4 video

![Data recording function](/img/pro/software/data_recording.png)

### 2.4 Reset and Real-Machine Playback

**Reset**: after teleoperation or real-machine playback, click **Reset** to return the arms to the default Home position.

![Reset function](/img/pro/software/reset.png)

**Real-machine playback**:

1. Click the **Real-Machine Playback** card on the main panel.
2. Click **Select File** in the upper-right corner.
3. Select an available bag file.
4. Click **Play**. The arms execute the motion recorded in the data.

> Playback is not allowed during teleoperation, and teleoperation is not allowed during playback.

![Real-machine playback function](/img/pro/software/playback.png)

### 2.5 Gripper Restart and Logs

After gripper disconnection or hot-plugging, click **Gripper Restart** to restore gripper status.

![Gripper restart function](/img/pro/software/gripper_restart.png)

Logs are saved on Orin by default:

```text
~/.ros/log
```

![Operation log location](/img/pro/software/log_location.png)

## 3. Common Configuration

### 3.1 Disable the Official Camera or Gripper

Enter the launch file directory and make the target file writable:

```bash
cd /opt/kernelmind/apex/install/node_manager/share/node_manager/launch
sudo chmod 666 bringup_all_dm_m6.launch.py
```

Comment out the `dm_gripper` (gripper) and `quadcam` (deserializer board) related lines according to the actual configuration.

![Disable official camera and gripper](/img/pro/quick-start/config_disable_camera_gripper.png)

### 3.2 Modify Robot IP / Payload and Other Parameters

Common configuration file paths:

```text
/opt/kernelmind/apex/install/marvin_ros_control/share/marvin_ros_control/config
/opt/kernelmind/apex/install/marvin_teleop/share/marvin_teleop/config
```

If the file is read-only, run:

```bash
sudo chmod 666 <file-name>
```

The default robot IP is `192.168.10.190`. Other parameters should be confirmed with technical support before modification.

![Modify configuration parameters](/img/pro/quick-start/config_parameters.png)

### 3.3 Modify the Dual-Arm IP Used by Orin

Modify the following file:

```text
/opt/kernelmind/apex/install/marvin_ros_control/share/marvin_ros_control/config/robot_param_m6.yaml
```

Field: `robot_ip`; default value: `192.168.10.190`. This IP is the configuration IP used by Orin to connect to the dual-arm controller and must match the dual-arm controller IP.

![Modify Orin dual-arm IP](/img/pro/quick-start/config_orin_robot_ip.png)

### 3.4 Modify the Headset Apex Connection IP

After powering on the headset, open the Apex app under Unknown Sources and press the menu button on the left controller to open the configuration screen:

- First input field: height, used for virtual controller alignment height. For example, `1.65` means 165 cm.
- Second input field: IP address of Orin, usually `192.168.10.123`.

![Modify headset Apex connection IP](/img/pro/quick-start/config_headset_ip.png)

### 3.5 Modify TCP Position

The current TCP default is an offset of `50 mm` along the `Z+` direction from the arm flange end. Normally no modification is required. If modification is needed, edit:

```text
/opt/kernelmind/apex/install/marvin_teleop/share/marvin_teleop/config/mjcf/marvin_pro_mink.xml
```

Fields to modify:

- Left arm: around line 86, `tool` offset `0 0 0.05`.
- Right arm: around line 138, `tool` offset `0 0 0.05`.

![TCP configuration file location](/img/pro/quick-start/config_tcp_file.png)

### 3.6 Modify Home Position

The Home position is the robot reset position and can also be understood as the teleoperation initial position. Home position must be modified in two places:

```text
/opt/kernelmind/apex/install/marvin_teleop/share/marvin_teleop/config/mjcf/marvin_pro_mink.xml
/opt/kernelmind/apex/install/marvin_teleop/share/marvin_teleop/config/robot_param_m6.yaml
```

Both files contain 14 parameters: the first 7 are for the left arm Home position, and the last 7 are for the right arm Home position. The unit is radians.

![Home position MJCF location](/img/pro/quick-start/config_home_xml.png)

![Home position YAML location](/img/pro/quick-start/config_home_yaml.png)

> Before modifying IP, payload, stiffness, damping, Home position, or TCP offset, back up the original configuration files.

### 3.7 Foot Pedal Installation and Configuration

Orin must have network access to download dependencies:

```bash
sudo apt-get install libhidapi-dev
cd ~
git clone https://github.com/rgerganov/footswitch.git
cd footswitch
make
sudo make install
footswitch -1 -m shift -k left -3 -m shift -k right
```

If `cannot find footswitch` appears, check whether the foot pedal USB is inserted into Orin, then unplug and reconnect it.

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

### 3.8 Incremental Teleoperation Mode

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

## 4. Installation and Update

### 4.1 Install Headset APK

Orin must connect to Wi-Fi to download ADB tools:

```bash
sudo apt update
sudo apt install android-tools-adb -y
adb version
```

Connect the headset:

1. Use a Type-C data cable to connect the headset and Orin.
2. Wear the headset and allow USB debugging in the headset.
3. Run `adb devices` on Orin.
4. If `device` is displayed, the connection is successful.

```bash
adb devices
adb shell pm list packages | grep Apex
adb uninstall <old-package-name>
adb install -r KernelMind_Apex_meta_260410.apk
```

![Install Meta headset APK](/img/pro/quick-start/install_headset_apk_terminal.png)

### 4.2 Install the Orin KernelMind System

Copy the deb package to Jetson, for example to `~/Downloads`.

```bash
sudo apt remove kernelmind_apex
cd ~/Downloads
sudo apt install ./kernelmind-apex_<version>_arm64.deb
```

After installation, log in again or manually load the environment:

```bash
source /etc/profile.d/kernelmind_apex.sh
ros2 pkg list | grep -E 'marvin|gmsl|node_manager'
```

![Install Orin KernelMind system](/img/pro/quick-start/install_deb_terminal.png)

### 4.3 Configure Network Parameters

The following example uses `eth0` and `192.168.10.123/24`. Replace them according to the on-site subnet:

```bash
nmcli device status
sudo nmcli con add type ethernet ifname eth0 con-name apex-robot-net \
  ipv4.method manual ipv4.addresses 192.168.10.123/24
sudo nmcli con up apex-robot-net
```

If a connection profile already exists, modify it directly:

```bash
sudo nmcli con mod apex-robot-net ipv4.method manual ipv4.addresses 192.168.10.123/24
sudo nmcli con up apex-robot-net
```

If an independent router exists in the LAN, default `192.168.10.1`, DHCP `option routers` should be set to the router address. Only when Orin acts as a software router and directly provides DHCP should the Orin address be used.

If changing to another subnet, such as `6.6.7.x`, also confirm that Orin's own network adapter has been set to a static IP on the same subnet, for example `6.6.7.123`; otherwise the DHCP service may fail to listen on that interface.

### 4.4 Modify QuickView / Camera Parameters

The QuickView camera configuration file is installed at:

```text
/opt/kernelmind/apex/install/gmsl_quadcam/share/gmsl_quadcam/config/quad_csi_quickview.yaml
```

Common fields:

```yaml
quad_csi_quickview:
  ros__parameters:
    signal_url: "ws://192.168.10.123:8554"
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

## 5. Troubleshooting and Safety Notes

### 5.1 Common Issues

| Symptom | Check items |
|---|---|
| VR headset view is white | Check whether `X11-Forwarding` is disabled in MobaXterm; check camera service and signaling address |
| Startup error | Check whether parameters such as `K` and `D` in `robot_param_m6.yaml` keep floating-point format, for example `6.0` |
| No camera view | Check `/dev/video*`, camera harness, deserializer power, sensor-id, and `quad_csi_quickview.yaml` |
| VR or host PC cannot connect to signaling | Check whether `signal_url` is the Orin control-network IP, for example `ws://192.168.10.123:8554` |
| Robot does not respond to control | Check emergency stop, power control, drive status, ROS nodes, and whether target pose is updating normally |
| deb installation fails | Run `sudo apt update` and `sudo apt install -f`, then install again |

Common check commands:

```bash
ip addr
ip route
ping 192.168.10.123
ros2 node list
ros2 topic list
ros2 service list
ls /dev/video*
journalctl -xe
ls ~/.ros/log
```

### 5.2 Safety Notes

1. Before teleoperation, confirm that the emergency stop button, controller power, communication Ethernet cable, USB drive, and headset battery are normal.
2. Switch to standby mode when not teleoperating to avoid accidental side-button or foot-pedal input.
3. Although incremental mode does not require red/blue controller alignment, the hand position should still roughly match the current gripper position before entering teleoperation.
4. When using the foot pedal, do not press the right controller menu button while stepping on the enable pedal.
5. Before modifying IP, payload, stiffness, damping, Home position, or TCP offset, back up the original configuration files.
6. If the headset battery is depleted, power is cut abnormally, or the headset shuts down, stop teleoperation immediately.

## 6. ROS Topics Reference

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
