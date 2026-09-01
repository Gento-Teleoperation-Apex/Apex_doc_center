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

| Topic | Type | Rate / Publication | Description |
|---|---|---|---|
| `/tj/joint_states` | `sensor_msgs/msg/JointState` | Normally about 100 Hz | Standard whole-robot joint names, positions, velocities, and efforts |
| `/tj/info/joint_feedback` | `marvin_msgs/msg/Jointfeedback` | SDK-return driven; target about 500 Hz | Real-time Gento whole-robot joint feedback; verify the actual rate on the target |
| `/tj/info/robot_state` | `std_msgs/msg/Int16MultiArray` | Normally about 100 Hz | Current ARM, HEAD, BODY, and LIFT states |
| `/tj/info/robot_info` | `marvin_msgs/msg/RobotInfo` | Immediately at startup, then about 0.2 Hz | Robot model and controller version |
| `/tj/info/imu0` | `sensor_msgs/msg/Imu` | Follows joint feedback | Body IMU data |

```bash
ros2 topic echo /tj/info/robot_info --once
ros2 topic echo /tj/info/robot_state --once
ros2 topic echo /tj/info/joint_feedback --once
ros2 topic echo /tj/joint_states --once
```

In `Jointfeedback`, the 14 arm entries are ordered as left seven followed by right seven. Interpret BODY values according to the model rules above.

> The current release creates a publisher for `/tj/info/robot_cmd_state`, but the source does not publish messages through it. Do not treat it as a customer-facing interface.

## 4. Headset and teleoperation topics

After Teleop starts:

| Topic | Type | Rate / Publication | Description |
|---|---|---|---|
| `/tj/control/target_poseL` | `geometry_msgs/msg/PoseStamped` | Follows headset input | Left-arm target mapped from the left controller |
| `/tj/control/target_poseR` | `geometry_msgs/msg/PoseStamped` | Follows headset input | Right-arm target mapped from the right controller |
| `/tj/control/enableL` | `std_msgs/msg/Bool` | Follows headset input; about 10 Hz in glove mode | Left-arm teleoperation enable |
| `/tj/control/enableR` | `std_msgs/msg/Bool` | Follows headset input; about 10 Hz in glove mode | Right-arm teleoperation enable |
| `/tj/control/vr_joy_L` | `sensor_msgs/msg/Joy` | Follows headset input | Left-controller buttons and joystick |
| `/tj/control/vr_joy_R` | `sensor_msgs/msg/Joy` | Follows headset input | Right-controller buttons and joystick |
| `/tj/control/vr_body` | `marvin_msgs/msg/VrBody` | Follows headset input | Torso, head, elbow, leg, and other full-body tracking data |
| `/tj/info/vr_connected` | `std_msgs/msg/Bool` | 1 Hz | Headset connection state |
| `/tj/info/eef_left` | `geometry_msgs/msg/PoseStamped` | Target 1000 Hz | Current left end-effector pose; actual rate depends on system load |
| `/tj/info/eef_right` | `geometry_msgs/msg/PoseStamped` | Target 1000 Hz | Current right end-effector pose; actual rate depends on system load |
| `/tj/info/teleop_motion_mode` | `std_msgs/msg/Int32` | Event-driven | `0=full body, 1=arms only, 2=arms and head` |
| `/tj/info/body_pose_mode` | `std_msgs/msg/Int32` | Event-driven | `0=skeleton, 1=neck_head_pose` |

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

> The current release creates publishers for `/tj/control/eef_cmd_A`, `/tj/control/eef_cmd_B`, `/tj/info/collision_statusA`, and `/tj/info/collision_statusB`, but the source does not publish messages through them. Do not treat them as customer-facing interfaces.

### 4.1 Control-Chain Observation Interfaces

Use these topics to identify whether a fault is in Teleop, IK/QP, or final command output. Customer programs must not publish directly to QP outputs or final command topics.

| Topic | Type | Rate / Publication | Description |
|---|---|---|---|
| `/tj/control/teleop/ik_request` | `marvin_msgs/msg/IKRequest` | Target 1000 Hz | Whole-body IK request generated by Teleop |
| `/tj/control/replay/ik_request` | `marvin_msgs/msg/IKRequest` | Follows recorded timestamps | IK request generated by Replay |
| `/tj/control/ik_request` | `marvin_msgs/msg/IKRequest` | Follows the active source | Request selected by the IK Mux |
| `/tj/control/qp_controller/joint_cmd_A` | `marvin_msgs/msg/JointcmdArm` | Skye 250 Hz; Luna 500 Hz | QP left-arm output |
| `/tj/control/qp_controller/joint_cmd_B` | `marvin_msgs/msg/JointcmdArm` | Skye 250 Hz; Luna 500 Hz | QP right-arm output |
| `/tj/control/qp_controller/joint_cmd_body` | `marvin_msgs/msg/JointcmdBody` | Skye 250 Hz; Luna 500 Hz | QP body output |
| `/tj/control/qp_controller/joint_cmd_head` | `marvin_msgs/msg/JointcmdHead` | Skye 250 Hz; Luna 500 Hz | QP head output |
| `/tj/control/joint_cmd_A` | `marvin_msgs/msg/JointcmdArm` | Steady state: Skye 250 Hz, Luna 500 Hz; about 100 Hz while switching | Final left-arm command selected by Joint Mux |
| `/tj/control/joint_cmd_B` | `marvin_msgs/msg/JointcmdArm` | Steady state: Skye 250 Hz, Luna 500 Hz; about 100 Hz while switching | Final right-arm command selected by Joint Mux |
| `/tj/control/joint_cmd_body` | `marvin_msgs/msg/JointcmdBody` | Steady state: Skye 250 Hz, Luna 500 Hz; about 100 Hz while switching | Final body command selected by Joint Mux |
| `/tj/control/joint_cmd_head` | `marvin_msgs/msg/JointcmdHead` | Steady state: Skye 250 Hz, Luna 500 Hz; about 100 Hz while switching | Final head command selected by Joint Mux |

## 5. Custom whole-body command interfaces

Customer algorithms publish to the `user` topics:

| Topic | Type | Rate / Publication | Description |
|---|---|---|---|
| `/tj/control/user/joint_cmd_A` | `marvin_msgs/msg/JointcmdArm` | Defined by the customer program | Seven left-arm joint targets in radians |
| `/tj/control/user/joint_cmd_B` | `marvin_msgs/msg/JointcmdArm` | Defined by the customer program | Seven right-arm joint targets in radians |
| `/tj/control/user/joint_cmd_body` | `marvin_msgs/msg/JointcmdBody` | Defined by the customer program | Skye LIFT+BODY or Luna BODY targets |
| `/tj/control/user/joint_cmd_head` | `marvin_msgs/msg/JointcmdHead` | Defined by the customer program | HEAD targets; current models use the first two values |

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

| Topic | Type | Rate / Publication | Description |
|---|---|---|---|
| `/tj/control/gripperValueL` | `std_msgs/msg/Float32` | Follows control input | Left gripper target |
| `/tj/control/gripperValueR` | `std_msgs/msg/Float32` | Follows control input | Right gripper target |
| `/tj/info/gripper_feedback_L` | `std_msgs/msg/Float32MultiArray` | 200 Hz | Left gripper feedback |
| `/tj/info/gripper_feedback_R` | `std_msgs/msg/Float32MultiArray` | 200 Hz | Right gripper feedback |
| `/tj/info/gripper_feedback_L_err` | `std_msgs/msg/Int32MultiArray` | 200 Hz | Left gripper error codes |
| `/tj/info/gripper_feedback_R_err` | `std_msgs/msg/Int32MultiArray` | 200 Hz | Right gripper error codes |

### Wuji dexterous hand

| Topic | Type | Rate / Publication | Description |
|---|---|---|---|
| `/hand_left/joint_commands` | `sensor_msgs/msg/JointState` | Follows control input | Left-hand joint target |
| `/hand_right/joint_commands` | `sensor_msgs/msg/JointState` | Follows control input | Right-hand joint target |
| `/hand_left/joint_states` | Verify on target | Defined by driver configuration | Left-hand joint feedback |
| `/hand_right/joint_states` | Verify on target | Defined by driver configuration | Right-hand joint feedback |

```bash
ros2 topic list -t | grep -E "gripper|hand"
```

## 8. Camera topic

Gento video is normally carried over H.264/WebRTC. The current camera component generates the four-camera mosaic at 30 Hz by default, while most ROS image topics publish on demand. Verify the actual rate from the deployed configuration and target system.

| Topic | Type | Format | Rate / Publication | Description |
|---|---|---|---|---|
| `/quad_tile/compressed` | `sensor_msgs/msg/CompressedImage` | `h264` | Published when subscribed; default maximum 30 Hz | Raw four-camera mosaic |
| `/quad_tile/compressed_undistorted` | `sensor_msgs/msg/CompressedImage` | `h264` | Published when subscribed; default maximum 30 Hz | Mosaic processed according to each slot's calibration |
| `/quad_tile/jpeg/compressed` | `sensor_msgs/msg/CompressedImage` | `jpeg` | Published when subscribed; default maximum 30 Hz | Processed JPEG mosaic, default 640x360 |
| `/camera/<name>/depth/image_raw` | `sensor_msgs/msg/Image` | `16UC1` | Depth and raw publication enabled | Raw D405 depth image |
| `/camera/<name>/depth/image_raw/compressed` | `sensor_msgs/msg/CompressedImage` | `h264` | Depth enabled and a subscriber exists | D405 grayscale-mapped depth stream |

For per-camera NV12 topics, slot configuration, recording services, and diagnostics, see [Camera Configuration and ROS Interfaces](/advanced/camera-configuration-and-interfaces). WebRTC may still work when ROS image topics are absent.

```bash
ros2 topic list -t | grep -Ei "camera|image|compressed|quad|usb_cam"
```

## 9. Input Mux, Replay, and Mobile Base

### 9.1 Two-Level Input Mux

Gento uses two input-mux layers. Customer programs normally select the final joint-command source through `/tj/control/set_input`:

| Topic | Type | Rate / Publication | Description |
|---|---|---|---|
| `/tj/info/ik_request_mux/active_source` | `std_msgs/msg/Int32` | Event-driven and latched | IK source: `0=Teleop, 1=Replay` |
| `/tj/info/joint_cmd_mux/active_source` | `std_msgs/msg/Int32` | Event-driven and latched | Native source index: `-1..3` |
| `/tj/control/input_mode` | `std_msgs/msg/Int32` | Event-driven and latched | Compatibility index: `0=None, 1=Teleop, 2=Planner, 3=Custom, 4=Replay` |
| `/tj/info/joint_cmd_mux/latest_joint_cmd` | `sensor_msgs/msg/JointState` | Follows final joint commands | Latest complete joint-command snapshot |

The controller transitions smoothly from current joint feedback when the source changes. Publishing to `user` topics without selecting Custom does not activate those commands.

### 9.2 Gento Replay

| Interface | Type | Rate / Invocation | Description |
|---|---|---|---|
| `/tj/info/gento_replay/status` | `std_msgs/msg/String` | About 2 Hz | Replay JSON status |
| `/tj/control/gento_replay/record` | `marvin_msgs/srv/Int` | Called on demand | `data=1` starts recording; `data=0` stops |
| `/tj/control/gento_replay/playback` | `marvin_msgs/srv/Int` | Called on demand | `data=1` starts playback; `data=0` stops |
| `/tj/control/gento_replay/record_named` | `marvin_msgs/srv/GentoReplay` | Called on demand | Starts or stops a named recording |
| `/tj/control/gento_replay/playback_named` | `marvin_msgs/srv/GentoReplay` | Called on demand | Starts or stops named playback |

New Gento integrations should use `gento_replay`. The old `/recorder/*` and `/playback_*` topics belong to the compatibility path and are not recommended for new customer applications.

### 9.3 Mobile Base

Mobile-base nodes are normally launched independently in the root namespace:

| Topic / Service | Type | Rate / Invocation | Description |
|---|---|---|---|
| `/controller/odom` | `nav_msgs/msg/Odometry` | Defined by the base driver | Base odometry |
| `/move/State` | `move/msg/State` | Defined by the base driver | Base state |
| `/move/ManualMoveCmd` | `geometry_msgs/msg/TwistStamped` | 100 Hz while the corresponding mode is active | Manual velocity command |
| `/info/base_local_state` | `move/msg/State` | Follows `/move/State` | State relative to the reset origin |
| `/info/base_teleop/active_mode` | `std_msgs/msg/Int32` | Event-driven and latched | `0=off, 1=joy, 2=wholebody` |
| `/control/base_local_reset` | `std_srvs/srv/Trigger` | Called on demand | Resets the local base origin |
| `/control/base_teleop/set_mode` | `marvin_msgs/srv/Int` | Called on demand | Selects the base teleoperation mode |

If these interfaces are absent, also check `/tj/info/base_*` and `/tj/control/base_*` in case the delivered launch applies the robot namespace to the base nodes.

## 10. Topic Rate Reference

Gento control-loop and topic rates differ from Marvin Pro. The following values come from the current Skye/Luna source and default parameters and are not hard real-time guarantees.

| Topic / chain | Skye | Luna | Notes |
|---|---:|---:|---|
| `/tj/info/eef_left/right` | 1000 Hz | 1000 Hz | Motion timer target; actual rate depends on load |
| `/tj/control/teleop/ik_request` | 1000 Hz | 1000 Hz | Teleop running |
| `/tj/control/qp_controller/joint_cmd_*` | 250 Hz | 500 Hz | Ready, Home, and IK data are valid |
| `/tj/control/joint_cmd_*` | Normally 250 Hz | Normally 500 Hz | Mux steady-state pass-through; about 100 Hz during source transition |
| `/tj/info/joint_feedback` | Target about 500 Hz | Target about 500 Hz | SDK-return driven; verify the actual rate on the target |
| `/tj/joint_states`, `/tj/info/robot_state` | Normally about 100 Hz | Normally about 100 Hz | Published every fifth successful joint-feedback cycle; actual rate follows feedback |
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
| Robot state | `/tj/info/robot_state`, `/tj/info/robot_info` |
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
