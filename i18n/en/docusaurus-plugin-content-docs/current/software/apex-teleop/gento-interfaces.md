---
title: Gento (Skye/Luna) ROS 2 Interfaces
sidebar_position: 5
---

# Gento (Skye/Luna) ROS 2 Interfaces

This chapter is for customers who need to read Gento state, collect teleoperation data, or connect their own algorithms through `Custom` mode.

| Item | Description |
|---|---|
| Products | Gento Skye and Gento Luna |
| Reference software | Gento Apex `1.0.6.81g` |
| Reference environment | Ubuntu 22.04 and ROS 2 Humble |

Available interfaces depend on the delivered release, end-effector configuration, and running modules. Always verify the target system with `ros2 topic list -t`, `ros2 service list -t`, and `ros2 interface show`.

## 1. Load the ROS 2 environment

Use the unified environment file when available:

```bash
source /etc/apex/apex_ros_env.sh
ros2 topic list -t | sort
ros2 service list -t | sort
```

If the unified environment file is unavailable:

```bash
source /opt/ros/humble/setup.bash
source /opt/kernelmind/apex/install/setup.bash
ros2 topic list -t | sort
```

Save an interface inventory:

```bash
mkdir -p ~/gento_ros_check
ros2 topic list -t | sort | tee ~/gento_ros_check/topic_list.txt
ros2 node list | sort | tee ~/gento_ros_check/node_list.txt
ros2 service list -t | sort | tee ~/gento_ros_check/service_list.txt
```

If a topic is missing, first verify that the required Robot, Teleop, Camera, or Tool module is running and that `ROS_DOMAIN_ID` matches.

## 2. Skye and Luna joint differences

| Item | Skye | Luna |
|---|---|---|
| `robot_type` | `Gento_Skye` | `Gento_Luna` |
| Left arm | 7 joints | 7 joints |
| Right arm | 7 joints | 7 joints |
| BODY | LIFT 1 + BODY 2 | BODY 6 |
| HEAD | 2 joints | 2 joints |

Identify the model first:

```bash
ros2 topic echo /info/robot_info --once
```

The BODY topic names are shared, but their arrays differ:

- **Skye:** `positions[0]` is LIFT and `positions[1:3]` are the two BODY joints. Remaining values are unused for this model.
- **Luna:** `positions[0:6]` are the six BODY joints.
- `JointcmdHead.positions` has a fixed length of 3, while both current models use the first two values.

Customer software must identify the model from `/info/robot_info`. Do not reuse a BODY array between Skye and Luna.

## 3. Robot state topics

After Robot starts:

| Topic | Type | Description |
|---|---|---|
| `/joint_states` | `sensor_msgs/msg/JointState` | Standard whole-robot joint names, positions, velocities, and efforts |
| `/info/joint_feedback` | `marvin_msgs/msg/Jointfeedback` | Real-time Gento whole-robot joint feedback |
| `/info/robot_state` | `std_msgs/msg/Int16MultiArray` | Current ARM, HEAD, BODY, and LIFT states |
| `/info/robot_cmd_state` | `std_msgs/msg/Int16MultiArray` | Target state of each component |
| `/info/robot_info` | `marvin_msgs/msg/RobotInfo` | Robot model and controller version |
| `/info/imu0` | `sensor_msgs/msg/Imu` | IMU 0 data |
| `/info/imu1` | `sensor_msgs/msg/Imu` | IMU 1 data |

```bash
ros2 topic echo /info/robot_info --once
ros2 topic echo /info/robot_state --once
ros2 topic echo /info/joint_feedback --once
ros2 topic echo /joint_states --once
```

In `Jointfeedback`, the 14 arm entries are ordered as left seven followed by right seven. Interpret BODY values according to the model rules above.

## 4. Headset and teleoperation topics

After Teleop starts:

| Topic | Type | Description |
|---|---|---|
| `/control/target_poseL` | `geometry_msgs/msg/PoseStamped` | Left-arm target mapped from the left controller |
| `/control/target_poseR` | `geometry_msgs/msg/PoseStamped` | Right-arm target mapped from the right controller |
| `/control/enableL` | `std_msgs/msg/Bool` | Left-arm teleoperation enable |
| `/control/enableR` | `std_msgs/msg/Bool` | Right-arm teleoperation enable |
| `/control/vr_joy_L` | `sensor_msgs/msg/Joy` | Left-controller buttons and joystick |
| `/control/vr_joy_R` | `sensor_msgs/msg/Joy` | Right-controller buttons and joystick |
| `/control/vr_body` | `marvin_msgs/msg/VrBody` | Torso, head, elbow, leg, and other full-body tracking data |
| `/info/vr_connected` | `std_msgs/msg/Bool` | Headset connection state |
| `/info/eef_left` | `geometry_msgs/msg/PoseStamped` | Current left end-effector pose |
| `/info/eef_right` | `geometry_msgs/msg/PoseStamped` | Current right end-effector pose |
| `/info/collision_statusA` | `std_msgs/msg/Bool` | Left collision state |
| `/info/collision_statusB` | `std_msgs/msg/Bool` | Right collision state |

`VrBody` contains left/right elbow, torso, head, pelvis, left/right foot, and left/right knee poses with matching `available` flags. A pose must not be treated as valid when its flag is `false`.

```bash
ros2 topic echo /info/vr_connected --once
ros2 topic echo /control/target_poseL --once
ros2 topic echo /control/target_poseR --once
ros2 topic echo /control/vr_body --once
ros2 topic echo /info/eef_left --once
ros2 topic echo /info/eef_right --once
```

Current Skye releases may not use the TCP connection state as the teleoperation gate. Do not diagnose Skye from `/info/vr_connected` alone; also verify target-pose and enable updates.

## 5. Custom whole-body command interfaces

Customer algorithms publish to the `user` topics:

| Topic | Type | Description |
|---|---|---|
| `/control/user/joint_cmd_A` | `marvin_msgs/msg/JointcmdArm` | Seven left-arm joint targets in radians |
| `/control/user/joint_cmd_B` | `marvin_msgs/msg/JointcmdArm` | Seven right-arm joint targets in radians |
| `/control/user/joint_cmd_body` | `marvin_msgs/msg/JointcmdBody` | Skye LIFT+BODY or Luna BODY targets |
| `/control/user/joint_cmd_head` | `marvin_msgs/msg/JointcmdHead` | HEAD targets; current models use the first two values |

Message layouts:

```text
JointcmdArm:  std_msgs/Header header + float64[7] positions
JointcmdBody: std_msgs/Header header + float64[6] positions
JointcmdHead: std_msgs/Header header + float64[3] positions
```

Verify the installed definitions:

```bash
ros2 interface show marvin_msgs/msg/JointcmdArm
ros2 interface show marvin_msgs/msg/JointcmdBody
ros2 interface show marvin_msgs/msg/JointcmdHead
```

### 5.1 Enable sequence

1. Clear the robot workspace and keep the emergency stop within reach.
2. Start Robot in Apex Teleop and set the robot Ready.
3. Select Impedance Mode and execute Home.
4. Set Input Mode to **Custom**, or call:

```bash
ros2 service call /control/set_input \
  marvin_msgs/srv/Int "{data: 3}"
```

5. Continuously publish complete left-arm, right-arm, BODY, and HEAD targets for the identified model.
6. Switch back to **None** before stopping:

```bash
ros2 service call /control/set_input \
  marvin_msgs/srv/Int "{data: 0}"
```

The system performs a smooth transition when the source changes. Output may remain inactive until initial feedback is available and all required targets have valid timestamps.

### 5.2 Safety constraints

- Start with small, slow, continuous targets and avoid steps.
- Use current timestamps; stale commands may be rejected.
- Respect position, velocity, and mechanical limits.
- Do not publish directly to final `/control/joint_cmd_A/B/body/head` topics.
- Do not call internal native mux selectors; customers should use `/control/set_input`.
- If the customer process exits unexpectedly, immediately switch to None or trigger a safe stop.

## 6. Customer-facing services

| Service | Type | Description |
|---|---|---|
| `/control/set_ready` | `std_srvs/srv/Trigger` | Allows real-time robot commands |
| `/control/set_mode` | `marvin_msgs/srv/Int` | Changes whole-robot control mode |
| `/control/go_home` | `std_srvs/srv/Trigger` | Moves to the model-specific Home pose |
| `/control/clear_fault` | `std_srvs/srv/Trigger` | Clears controller faults |
| `/control/set_input` | `marvin_msgs/srv/Int` | Selects None, Teleop, Planner, Custom, or Replay |

```bash
ros2 service call /control/clear_fault std_srvs/srv/Trigger "{}"
ros2 service call /control/set_ready std_srvs/srv/Trigger "{}"
ros2 service call /control/set_mode marvin_msgs/srv/Int "{data: 3}"
ros2 service call /control/go_home std_srvs/srv/Trigger "{}"
```

`set_mode` manages ARM, HEAD, BODY, and LIFT according to the Skye or Luna configuration. Prefer Apex Teleop for Ready, mode, and Home operations during normal use.

## 7. End effectors

End-effector topics appear only when the matching hardware and driver are configured.

### DM / ZY gripper

| Topic | Type | Description |
|---|---|---|
| `/control/gripperValueL` | `std_msgs/msg/Float32` | Left gripper target |
| `/control/gripperValueR` | `std_msgs/msg/Float32` | Right gripper target |
| `/info/gripper_feedback_L` | `std_msgs/msg/Float32MultiArray` | Left gripper feedback |
| `/info/gripper_feedback_R` | `std_msgs/msg/Float32MultiArray` | Right gripper feedback |

### Wuji dexterous hand

| Topic | Type | Description |
|---|---|---|
| `/hand_left/joint_commands` | `sensor_msgs/msg/JointState` | Left-hand joint target |
| `/hand_right/joint_commands` | `sensor_msgs/msg/JointState` | Right-hand joint target |
| `/hand_left/joint_states` | Verify on target | Left-hand joint feedback |
| `/hand_right/joint_states` | Verify on target | Right-hand joint feedback |

```bash
ros2 topic list -t | grep -E "gripper|hand"
```

## 8. Camera topic

Gento video is normally carried over H264/WebRTC. Individual cameras do not need to publish raw ROS image topics.

| Topic | Type | Description |
|---|---|---|
| `/quad_tile/compressed` | `sensor_msgs/msg/CompressedImage` | Optional multi-camera tiled JPEG image |

This topic depends on the camera module version and compressed-image publication setting. WebRTC may still work when it is absent.

```bash
ros2 topic list -t | grep -Ei "camera|image|compressed|quad|usb_cam"
```

## 9. Recommended data collection

| Category | Recommended topics |
|---|---|
| Whole-robot joint feedback | `/joint_states`, `/info/joint_feedback` |
| Robot state | `/info/robot_state`, `/info/robot_cmd_state`, `/info/robot_info` |
| End-effector pose | `/info/eef_left`, `/info/eef_right` |
| Headset targets and enable | `/control/target_poseL/R`, `/control/enableL/R`, `/control/vr_body` |
| Customer command input | `/control/user/joint_cmd_A/B/body/head` |
| Gripper or dexterous hand | Select according to the installed end effector |
| Video | `/quad_tile/compressed` only when enabled on the target |

Before recording, use `ros2 topic info -v`, `ros2 topic echo --once`, and `ros2 topic hz` to verify that each topic exists and carries valid data.

## 10. Minimum diagnostic set

```bash
source /etc/apex/apex_ros_env.sh
echo "ROS_DOMAIN_ID=${ROS_DOMAIN_ID}"
ros2 topic echo /info/robot_info --once
ros2 topic echo /info/robot_state --once
ros2 topic echo /info/joint_feedback --once
ros2 topic echo /info/vr_connected --once
ros2 topic info /control/target_poseL -v
ros2 topic info /control/user/joint_cmd_A -v
ros2 topic echo /control/input_mode --once
```

| Symptom | Check first |
|---|---|
| No `/info/robot_info` | Robot is not running, or the ROS environment/domain differs |
| RobotInfo exists but no joint feedback | Robot-controller communication |
| No headset target updates | Teleop, headset connection, network, and enable state |
| Custom topics have publishers but no motion | Ready, Impedance Mode, Home, Input Mode, timestamps, and complete targets |
| Arms work but BODY does not | Model identification, BODY ordering, and component state |
| Gripper target exists but no motion | Tool, driver, power, and hardware connection |
| No compressed image topic | Verify whether ROS compressed publication is enabled; WebRTC may still work |

Trace state feedback, customer input, active Input Mode, and robot motion in sequence. The existence of one topic alone does not prove that the entire chain is healthy.
