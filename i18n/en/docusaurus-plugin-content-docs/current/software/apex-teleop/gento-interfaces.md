---
title: Gento (Skye/Luna) ROS 2 Interfaces
sidebar_position: 5
---

# Gento (Skye/Luna) ROS 2 Interfaces

This chapter is for customers who need to read Gento state, collect teleoperation data, or connect their own algorithms through `Custom` mode. The interface contract is based on the latest Gento source as of August 21, 2026.

| Item | Description |
|---|---|
| Products | Gento Skye and Gento Luna |
| Interface baseline | Gento source, August 21, 2026 |
| Reference environment | Ubuntu 22.04 and ROS 2 Humble |
| Default namespace | `/tj` |

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

### 1.1 Namespace Rules

Gento Robot, Teleop, QP, and both input-mux nodes use `APEX_ROS_NAMESPACE=tj` by default. A relative source name such as `info/joint_feedback` therefore resolves to `/tj/info/joint_feedback` at runtime.

The following interfaces normally remain in the root namespace:

- `/hand_left/*` and `/hand_right/*`: Wuji dexterous hands;
- `/controller/odom`, `/move/*`, `/control/base_*`, and `/info/base_*`: independently launched mobile-base nodes;
- `/quad_tile/*` and `/recorder/set_recording`: independent camera package;
- `/tf`, `/tf_static`, and `/rosout`: ROS system interfaces.

If an upper-level launch applies `/tj` to the base nodes, `/tj/info/base_*` may also appear. Search both root and `/tj` paths on the target system.

## 2. Skye and Luna joint differences

| Item | Skye | Luna |
|---|---|---|
| `robot_type` | `Gento_Skye` | `Gento_Luna` |
| Left arm | 7 joints | 7 joints |
| Right arm | 7 joints | 7 joints |
| BODY | LIFT 1 + BODY 2 | BODY 6 |
| HEAD | 2 joints | 2 joints |
| Default QP rate | 250 Hz | 500 Hz |
| Controller UDP TCP gate | Disabled by default | Enabled by default; requires a TCP 9010 session |

Identify the model first:

```bash
ros2 topic echo /tj/info/robot_info --once
```

The BODY topic names are shared, but their arrays differ:

- **Skye:** `positions[0]` is LIFT and `positions[1:3]` are the two BODY joints. Remaining values are unused for this model.
- **Luna:** `positions[0:6]` are the six BODY joints.
- `JointcmdHead.positions` has a fixed length of 3, while both current models use the first two values.

Customer software must identify the model from `/tj/info/robot_info`. Do not reuse a BODY array between Skye and Luna.

## 3. Robot state topics

After Robot starts:

| Topic | Type | Description |
|---|---|---|
| `/tj/joint_states` | `sensor_msgs/msg/JointState` | Standard whole-robot joint names, positions, velocities, and efforts |
| `/tj/info/joint_feedback` | `marvin_msgs/msg/Jointfeedback` | Real-time Gento whole-robot joint feedback |
| `/tj/info/robot_state` | `std_msgs/msg/Int16MultiArray` | Current ARM, HEAD, BODY, and LIFT states |
| `/tj/info/robot_cmd_state` | `std_msgs/msg/Int16MultiArray` | Target state of each component |
| `/tj/info/robot_info` | `marvin_msgs/msg/RobotInfo` | Robot model and controller version |
| `/tj/info/imu0` | `sensor_msgs/msg/Imu` | Body IMU data |

```bash
ros2 topic echo /tj/info/robot_info --once
ros2 topic echo /tj/info/robot_state --once
ros2 topic echo /tj/info/joint_feedback --once
ros2 topic echo /tj/joint_states --once
```

In `Jointfeedback`, the 14 arm entries are ordered as left seven followed by right seven. Interpret BODY values according to the model rules above.

## 4. Headset and teleoperation topics

After Teleop starts:

| Topic | Type | Description |
|---|---|---|
| `/tj/control/target_poseL` | `geometry_msgs/msg/PoseStamped` | Left-arm target mapped from the left controller |
| `/tj/control/target_poseR` | `geometry_msgs/msg/PoseStamped` | Right-arm target mapped from the right controller |
| `/tj/control/enableL` | `std_msgs/msg/Bool` | Left-arm teleoperation enable |
| `/tj/control/enableR` | `std_msgs/msg/Bool` | Right-arm teleoperation enable |
| `/tj/control/vr_joy_L` | `sensor_msgs/msg/Joy` | Left-controller buttons and joystick |
| `/tj/control/vr_joy_R` | `sensor_msgs/msg/Joy` | Right-controller buttons and joystick |
| `/tj/control/vr_body` | `marvin_msgs/msg/VrBody` | Torso, head, elbow, leg, and other full-body tracking data |
| `/tj/info/vr_connected` | `std_msgs/msg/Bool` | Headset connection state |
| `/tj/control/eef_cmd_A` | `geometry_msgs/msg/PoseStamped` | Mapped left end-effector target |
| `/tj/control/eef_cmd_B` | `geometry_msgs/msg/PoseStamped` | Mapped right end-effector target |
| `/tj/info/eef_left` | `geometry_msgs/msg/PoseStamped` | Current left end-effector pose |
| `/tj/info/eef_right` | `geometry_msgs/msg/PoseStamped` | Current right end-effector pose |
| `/tj/info/collision_statusA` | `std_msgs/msg/Bool` | Left collision state |
| `/tj/info/collision_statusB` | `std_msgs/msg/Bool` | Right collision state |
| `/tj/info/teleop_motion_mode` | `std_msgs/msg/Int32` | `0=full body, 1=arms only, 2=arms and head` |
| `/tj/info/body_pose_mode` | `std_msgs/msg/Int32` | `0=skeleton, 1=neck_head_pose` |

`VrBody` contains left/right elbow, torso, head, pelvis, left/right foot, and left/right knee poses with matching `available` flags. A pose must not be treated as valid when its flag is `false`.

```bash
ros2 topic echo /tj/info/vr_connected --once
ros2 topic echo /tj/control/target_poseL --once
ros2 topic echo /tj/control/target_poseR --once
ros2 topic echo /tj/control/vr_body --once
ros2 topic echo /tj/info/eef_left --once
ros2 topic echo /tj/info/eef_right --once
```

Current Skye releases may not use the TCP connection state as the teleoperation gate. Do not diagnose Skye from `/tj/info/vr_connected` alone; also verify target-pose and enable updates.

### 4.1 Control-Chain Observation Interfaces

Use these topics to identify whether a fault is in Teleop, IK/QP, or final command output. Customer programs must not publish directly to QP outputs or final command topics.

| Topic | Type | Description |
|---|---|---|
| `/tj/control/teleop/ik_request` | `marvin_msgs/msg/IKRequest` | Whole-body IK request generated by Teleop |
| `/tj/control/replay/ik_request` | `marvin_msgs/msg/IKRequest` | IK request generated by Replay |
| `/tj/control/ik_request` | `marvin_msgs/msg/IKRequest` | Request selected by the IK Mux |
| `/tj/control/qp_controller/joint_cmd_A` | `marvin_msgs/msg/JointcmdArm` | QP left-arm output |
| `/tj/control/qp_controller/joint_cmd_B` | `marvin_msgs/msg/JointcmdArm` | QP right-arm output |
| `/tj/control/qp_controller/joint_cmd_body` | `marvin_msgs/msg/JointcmdBody` | QP body output |
| `/tj/control/qp_controller/joint_cmd_head` | `marvin_msgs/msg/JointcmdHead` | QP head output |
| `/tj/control/joint_cmd_A` | `marvin_msgs/msg/JointcmdArm` | Final left-arm command selected by Joint Mux |
| `/tj/control/joint_cmd_B` | `marvin_msgs/msg/JointcmdArm` | Final right-arm command selected by Joint Mux |
| `/tj/control/joint_cmd_body` | `marvin_msgs/msg/JointcmdBody` | Final body command selected by Joint Mux |
| `/tj/control/joint_cmd_head` | `marvin_msgs/msg/JointcmdHead` | Final head command selected by Joint Mux |

## 5. Custom whole-body command interfaces

Customer algorithms publish to the `user` topics:

| Topic | Type | Description |
|---|---|---|
| `/tj/control/user/joint_cmd_A` | `marvin_msgs/msg/JointcmdArm` | Seven left-arm joint targets in radians |
| `/tj/control/user/joint_cmd_B` | `marvin_msgs/msg/JointcmdArm` | Seven right-arm joint targets in radians |
| `/tj/control/user/joint_cmd_body` | `marvin_msgs/msg/JointcmdBody` | Skye LIFT+BODY or Luna BODY targets |
| `/tj/control/user/joint_cmd_head` | `marvin_msgs/msg/JointcmdHead` | HEAD targets; current models use the first two values |

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
ros2 service call /tj/control/set_input \
  marvin_msgs/srv/Int "{data: 3}"
```

5. Continuously publish complete left-arm, right-arm, BODY, and HEAD targets for the identified model.
6. Switch back to **None** before stopping:

```bash
ros2 service call /tj/control/set_input \
  marvin_msgs/srv/Int "{data: 0}"
```

The system performs a smooth transition when the source changes. Output may remain inactive until initial feedback is available and all required targets have valid timestamps.

### 5.2 Safety constraints

- Start with small, slow, continuous targets and avoid steps.
- Use current timestamps; stale commands may be rejected.
- Respect position, velocity, and mechanical limits.
- Do not publish directly to final `/tj/control/joint_cmd_A/B/body/head` topics.
- Do not call internal native mux selectors; customers should use `/tj/control/set_input`.
- If the customer process exits unexpectedly, immediately switch to None or trigger a safe stop.

## 6. Customer-facing services

| Service | Type | Description |
|---|---|---|
| `/tj/control/set_ready` | `std_srvs/srv/Trigger` | Allows real-time robot commands |
| `/tj/control/set_mode` | `marvin_msgs/srv/Int` | Changes whole-robot control mode |
| `/tj/control/go_home` | `std_srvs/srv/Trigger` | Moves to the model-specific Home pose |
| `/tj/control/clear_fault` | `std_srvs/srv/Trigger` | Clears controller faults |
| `/tj/control/set_input` | `marvin_msgs/srv/Int` | Compatibility index: `0=None, 1=Teleop, 2=Planner, 3=Custom, 4=Replay` |
| `/tj/control/set_teleop_motion_mode` | `marvin_msgs/srv/Int` | `0=full body, 1=arms only, 2=arms and head` |
| `/tj/control/set_body_pose_mode` | `marvin_msgs/srv/Int` | `0=skeleton, 1=neck_head_pose` |
| `/tj/control/reset_grippers` | `std_srvs/srv/Trigger` | Resets and re-enables the configured DM/ZY grippers |

```bash
ros2 service call /tj/control/clear_fault std_srvs/srv/Trigger "{}"
ros2 service call /tj/control/set_ready std_srvs/srv/Trigger "{}"
ros2 service call /tj/control/set_mode marvin_msgs/srv/Int "{data: 3}"
ros2 service call /tj/control/go_home std_srvs/srv/Trigger "{}"
```

`set_mode` manages ARM, HEAD, BODY, and LIFT according to the Skye or Luna configuration. Prefer Apex Teleop for Ready, mode, and Home operations during normal use.

## 7. End effectors

End-effector topics appear only when the matching hardware and driver are configured.

### DM / ZY gripper

| Topic | Type | Description |
|---|---|---|
| `/tj/control/gripperValueL` | `std_msgs/msg/Float32` | Left gripper target |
| `/tj/control/gripperValueR` | `std_msgs/msg/Float32` | Right gripper target |
| `/tj/info/gripper_feedback_L` | `std_msgs/msg/Float32MultiArray` | Left gripper feedback |
| `/tj/info/gripper_feedback_R` | `std_msgs/msg/Float32MultiArray` | Right gripper feedback |
| `/tj/info/gripper_feedback_L_err` | `std_msgs/msg/Int32MultiArray` | Left gripper error codes |
| `/tj/info/gripper_feedback_R_err` | `std_msgs/msg/Int32MultiArray` | Right gripper error codes |

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
| `/quad_tile/jpeg/compressed` | `sensor_msgs/msg/CompressedImage` | Current common multi-camera tiled JPEG image |
| `/quad_tile/compressed` | `sensor_msgs/msg/CompressedImage` | Compatibility path used by older camera packages |

This topic depends on the camera module version and compressed-image publication setting. WebRTC may still work when it is absent.

```bash
ros2 topic list -t | grep -Ei "camera|image|compressed|quad|usb_cam"
```

## 9. Input Mux, Replay, and Mobile Base

### 9.1 Two-Level Input Mux

Gento uses two input-mux layers. Customer programs normally select the final joint-command source through `/tj/control/set_input`:

| Topic | Type | Description |
|---|---|---|
| `/tj/info/ik_request_mux/active_source` | `std_msgs/msg/Int32` | IK source: `0=Teleop, 1=Replay` |
| `/tj/info/joint_cmd_mux/active_source` | `std_msgs/msg/Int32` | Native source index: `-1..3` |
| `/tj/control/input_mode` | `std_msgs/msg/Int32` | Compatibility index: `0=None, 1=Teleop, 2=Planner, 3=Custom, 4=Replay` |
| `/tj/info/joint_cmd_mux/latest_joint_cmd` | `sensor_msgs/msg/JointState` | Latest complete joint-command snapshot |

The controller transitions smoothly from current joint feedback when the source changes. Publishing to `user` topics without selecting Custom does not activate those commands.

### 9.2 Gento Replay

| Interface | Type | Description |
|---|---|---|
| `/tj/info/gento_replay/status` | `std_msgs/msg/String` | Replay JSON status, normally about 2 Hz |
| `/tj/control/gento_replay/record` | `marvin_msgs/srv/Int` | `data=1` starts recording; `data=0` stops |
| `/tj/control/gento_replay/playback` | `marvin_msgs/srv/Int` | `data=1` starts playback; `data=0` stops |
| `/tj/control/gento_replay/record_named` | `marvin_msgs/srv/GentoReplay` | Starts or stops a named recording |
| `/tj/control/gento_replay/playback_named` | `marvin_msgs/srv/GentoReplay` | Starts or stops named playback |

New Gento integrations should use `gento_replay`. The old `/recorder/*` and `/playback_*` topics belong to the compatibility path and are not recommended for new customer applications.

### 9.3 Mobile Base

Mobile-base nodes are normally launched independently in the root namespace:

| Topic / Service | Type | Description |
|---|---|---|
| `/controller/odom` | `nav_msgs/msg/Odometry` | Base odometry |
| `/move/State` | `move/msg/State` | Base state |
| `/move/ManualMoveCmd` | `geometry_msgs/msg/TwistStamped` | Manual velocity command |
| `/info/base_local_state` | `move/msg/State` | State relative to the reset origin |
| `/info/base_teleop/active_mode` | `std_msgs/msg/Int32` | `0=off, 1=joy, 2=wholebody` |
| `/control/base_local_reset` | `std_srvs/srv/Trigger` | Resets the local base origin |
| `/control/base_teleop/set_mode` | `marvin_msgs/srv/Int` | Selects the base teleoperation mode |

If these interfaces are absent, also check `/tj/info/base_*` and `/tj/control/base_*` in case the delivered launch applies the robot namespace to the base nodes.

## 10. Topic Rate Reference

Gento control-loop and topic rates differ from Marvin Pro. The following values come from the current Skye/Luna source and default parameters and are not hard real-time guarantees.

| Topic / chain | Skye | Luna | Notes |
|---|---:|---:|---|
| `/tj/info/eef_left/right` | 1000 Hz | 1000 Hz | Motion timer target; actual rate depends on load |
| `/tj/control/teleop/ik_request` | 1000 Hz | 1000 Hz | Teleop running |
| `/tj/control/qp_controller/joint_cmd_*` | 250 Hz | 500 Hz | Ready, Home, and IK data are valid |
| `/tj/control/joint_cmd_*` | Normally 250 Hz | Normally 500 Hz | Mux steady-state pass-through; about 100 Hz during source transition |
| `/tj/info/joint_feedback` | Up to about 1000 Hz | Up to about 1000 Hz | Published after each successful Gento SDK state read |
| `/tj/joint_states`, `/tj/info/robot_state` | About 200 Hz | About 200 Hz | Current source publishes every fifth Robot poll |
| `/tj/info/gripper_feedback_L/R` and error topics | 200 Hz | 200 Hz | Default DM/ZY Tool configuration |
| `/tj/info/gento_replay/status` | 2 Hz | 2 Hz | Every 500 ms while Replay is running |
| `/move/ManualMoveCmd`, `/target_pose` | 100 Hz | 100 Hz | While the corresponding base mode is active |

Headset topics follow actual UDP packets, camera topics follow camera configuration, and event topics such as mode, source, and static TF have no continuous-rate requirement. The 1000 Hz internal gripper CAN loop does not mean the ROS feedback topics run at 1000 Hz.

```bash
source /etc/apex/apex_ros_env.sh

ros2 topic info -v /tj/info/joint_feedback --no-daemon
ros2 topic info -v /tj/joint_states --no-daemon

ros2 topic hz /tj/info/eef_left
ros2 topic hz /tj/control/teleop/ik_request
ros2 topic hz /tj/control/qp_controller/joint_cmd_A
ros2 topic hz /tj/control/joint_cmd_A
ros2 topic hz /tj/info/joint_feedback
ros2 topic hz /tj/joint_states
ros2 topic hz /tj/info/gripper_feedback_L
```

After startup or a control-source change, wait for the roughly two-second Mux transition before measuring final joint commands. Check publisher count first, and run formal full-load tests for at least 120 seconds.

## 11. Recommended Data Collection

| Category | Recommended topics |
|---|---|
| Whole-robot joint feedback | `/tj/joint_states`, `/tj/info/joint_feedback` |
| Robot state | `/tj/info/robot_state`, `/tj/info/robot_cmd_state`, `/tj/info/robot_info` |
| End-effector pose | `/tj/info/eef_left`, `/tj/info/eef_right` |
| Headset targets and enable | `/tj/control/target_poseL/R`, `/tj/control/enableL/R`, `/tj/control/vr_body` |
| Customer command input | `/tj/control/user/joint_cmd_A/B/body/head` |
| Gripper or dexterous hand | Select according to the installed end effector |
| Video | `/quad_tile/jpeg/compressed` only when enabled on the target |

Before recording, use `ros2 topic info -v`, `ros2 topic echo --once`, and `ros2 topic hz` to verify that each topic exists and carries valid data.

To add body, head, or end-effector topics to recording, playback, or frontend forwarding, see [Topic whitelist configuration and diagnostics](/advanced/topic-whitelist).

## 12. Minimum Diagnostic Set

```bash
source /etc/apex/apex_ros_env.sh
echo "ROS_DOMAIN_ID=${ROS_DOMAIN_ID}"
ros2 topic echo /tj/info/robot_info --once
ros2 topic echo /tj/info/robot_state --once
ros2 topic echo /tj/info/joint_feedback --once
ros2 topic echo /tj/info/vr_connected --once
ros2 topic info /tj/control/target_poseL -v
ros2 topic info /tj/control/user/joint_cmd_A -v
ros2 topic echo /tj/control/input_mode --once
```

| Symptom | Check first |
|---|---|
| No `/tj/info/robot_info` | Robot is not running, or the ROS environment, namespace, or domain differs |
| RobotInfo exists but no joint feedback | Robot-controller communication |
| No headset target updates | Teleop, headset connection, network, and enable state |
| Custom topics have publishers but no motion | Ready, Impedance Mode, Home, Input Mode, timestamps, and complete targets |
| Arms work but BODY does not | Model identification, BODY ordering, and component state |
| Gripper target exists but no motion | Tool, driver, power, and hardware connection |
| No compressed image topic | Verify whether ROS compressed publication is enabled; WebRTC may still work |

Trace state feedback, customer input, active Input Mode, and robot motion in sequence. The existence of one topic alone does not prove that the entire chain is healthy.
