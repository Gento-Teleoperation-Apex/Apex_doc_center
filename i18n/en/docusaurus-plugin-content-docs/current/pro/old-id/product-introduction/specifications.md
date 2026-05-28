---
title: Specifications
sidebar_position: 2
---

# Specifications

## Key Network Configuration

Confirm the following addresses before deployment:

| Item | Default / Notes |
|---|---|
| Dual-arm controller IP | `192.168.10.190` |
| Orin network adapter IP | `192.168.10.123` |
| Orin → dual-arm config IP | `192.168.10.190` (must match controller IP) |
| Router IP | `192.168.10.1` |
| Headset Apex app IP | `192.168.10.123` (must match Orin IP) |
| SSH login | `ssh marvin@192.168.10.123` |
| Orin user password | `1234` |
| Router / Wi-Fi password | `12345678` |

![Marvin Pro IP configuration overview](/img/pro_p43.png)

## Software Environment

| Item | Specification |
|---|---|
| OS (Orin) | Ubuntu 22.04 ARM64 |
| OS (host development) | Ubuntu 22.04 AMD64 |
| Robot framework | ROS 2 Humble |
| Main controller hardware | NVIDIA Jetson Orin |
| Headset | Meta Quest (APK installed via ADB) |
| Package format | `kernelmind-apex_<version>_arm64.deb` |

## ROS Topics

| Topic | Function | Type |
|---|---|---|
| `/control/target_poseL` | Left TCP target pose | `geometry_msgs/msg/PoseStamped` |
| `/control/target_poseR` | Right TCP target pose | `geometry_msgs/msg/PoseStamped` |
| `/control/gripperValueL` | Left gripper open/close value | `std_msgs/msg/Float32` |
| `/control/gripperValueR` | Right gripper open/close value | `std_msgs/msg/Float32` |
| `/control/gripL` | Left side-button enable | `std_msgs/msg/Bool` |
| `/control/gripR` | Right side-button enable | `std_msgs/msg/Bool` |
| `/info/eef_left` | Left arm flange pose | `geometry_msgs/msg/PoseStamped` |
| `/info/eef_right` | Right arm flange pose | `geometry_msgs/msg/PoseStamped` |
| `/info/joint_feedback` | 14-axis joint feedback ~250 Hz | `marvin_msgs/msg/Jointfeedback` |
| `/joint_states` | 14-axis joint states ~50 Hz | `std_msgs/msg/JointState` |
| `/robot_description` | URDF visualization | `std_msgs/msg/String` |
| `/usb_cam_0/image_raw` | Stereo camera video stream | `sensor_msgs/msg/Image` |
| `/gripper/feedback_L_err` | Left gripper error codes | `std_msgs/msg/Int32MultiArray` |
| `/gripper/feedback_R_err` | Right gripper error codes | `std_msgs/msg/Int32MultiArray` |
| `/info/arm_state` | Robot arm state | `std_msgs/msg/Int16MultiArray` |
| `/info/collision_marker` | End-effector trajectory prediction | `visualization_msgs/msg/MarkerArray` |
| `/info/collision_statusA` | Left arm trajectory collision flag | `std_msgs/msg/Bool` |
| `/info/collision_statusB` | Right arm trajectory collision flag | `std_msgs/msg/Bool` |

![ROS Topic reference (page 1)](/img/pro_p35.png)

![ROS Topic reference (page 2)](/img/pro_p36.png)
