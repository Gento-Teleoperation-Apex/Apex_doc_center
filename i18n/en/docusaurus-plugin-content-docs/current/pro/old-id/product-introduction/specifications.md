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

Network configuration checklist:

| Check | Requirement |
| --- | --- |
| Orin IP | Must match the IP entered in the headset Apex app |
| Dual-arm controller IP | Must match the Orin dual-arm configuration IP |
| Router subnet | Must place Orin and the robot controller on the same subnet |
| SSH login | Orin should be reachable via `ssh marvin@192.168.10.123` |
| VR headset connection | The headset should connect to the Apex service after entering the Orin IP |

:::info Image placeholder: network configuration overview

Replace this block later with an IP configuration overview for Orin, robot controller, router, and the headset Apex app.

:::

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

Topic check suggestions:

| Check | Notes |
| --- | --- |
| Control input | Check `/control/target_poseL`, `/control/target_poseR`, `/control/gripL`, and `/control/gripR` |
| Robot feedback | Check `/info/eef_left`, `/info/eef_right`, `/info/joint_feedback`, and `/joint_states` |
| Video input | Check whether `/usb_cam_0/image_raw` publishes stable image data |
| Gripper feedback | Check `/gripper/feedback_L_err` and `/gripper/feedback_R_err` for abnormal error codes |
| Safety state | Check `/info/arm_state`, `/info/collision_statusA`, and `/info/collision_statusB` |

:::info Image placeholder: ROS Topic overview

Replace this block later with a ROS Topic communication diagram or rqt graph screenshot showing control input, robot feedback, video input, and safety state relationships.

:::
