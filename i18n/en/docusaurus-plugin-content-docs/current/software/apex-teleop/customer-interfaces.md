---
title: Marvin Pro Interfaces
sidebar_position: 4
---

# Marvin Pro Customer Integration Interfaces

This page documents the customer-facing ROS 2 topics, services, input sources, and network ports for the current Marvin Pro. It covers state access, data acquisition, customer control integration, and diagnostics. Skye/Luna has a different whole-body joint layout and message structure. See [Gento (Skye/Luna) ROS 2 Interfaces](./gento-interfaces).

The interfaces installed on the target device are authoritative. Load the controller environment and inspect them before development:

```bash
source /etc/apex/apex_ros_env.sh
ros2 topic list
ros2 service list
ros2 interface list | grep marvin_msgs
```

## 1. Safety Requirements

- In the Apex frontend, complete **Start Robot → Impedance Mode → Home** before external control.
- Set **Input Mode** to **Custom** before the robot accepts customer joint commands.
- Clear the workspace, begin with small motions, and keep the emergency stop within reach.
- Publish smooth, time-continuous targets that stay within the robot joint limits.
- Switch Input Mode back to **None** before stopping the command process.
- Do not publish to QP, planner, replay, or final-command topics marked as read-only diagnostics.
- Message fields are defined by the installed `marvin_msgs` package. Inspect them with `ros2 interface show` before writing an application.

## 2. Joint Order and Runtime State

Marvin Pro dual-arm arrays always place the seven left-arm joints before the seven right-arm joints:

```text
Joint1_L ... Joint7_L, Joint1_R ... Joint7_R
```

Both `/info/arm_state` and `/info/robot_state` describe arm state. In the current baseline, the QP chain considers the robot movable when both arm state entries are `2`. Confirm the state definition on the delivered release.

## 3. State and Feedback Topics

| Topic | Type | Description |
|---|---|---|
| `/joint_states` | `sensor_msgs/msg/JointState` | Positions, velocities, and efforts for all 14 arm joints; suitable for visualization, recording, and lower-rate state access |
| `/info/joint_feedback` | `marvin_msgs/msg/Jointfeedback` | High-rate dual-arm feedback for low-latency algorithms |
| `/info/arm_state` | `std_msgs/msg/Int16MultiArray` | `[stateA, stateB]`; values may be `-1` before Ready |
| `/info/robot_state` | `std_msgs/msg/Int16MultiArray` | Dual-arm movable state used by the control chain |
| `/info/robot_info` | `marvin_msgs/msg/RobotInfo` | Robot model, controller, and version information |
| `/info/eef_left` | `geometry_msgs/msg/PoseStamped` | Left end-effector forward-kinematics pose |
| `/info/eef_right` | `geometry_msgs/msg/PoseStamped` | Right end-effector forward-kinematics pose |
| `/info/wrench_left` | `geometry_msgs/msg/WrenchStamped` | Estimated left end-effector wrench |
| `/info/wrench_right` | `geometry_msgs/msg/WrenchStamped` | Estimated right end-effector wrench |
| `/info/vr_connected` | `std_msgs/msg/Bool` | Headset TCP heartbeat and connection state |
| `/info/apex_package_info` | `std_msgs/msg/String` | Installed controller package version and package state |
| `/info/gripper_feedback_L` | `std_msgs/msg/Float32MultiArray` | Left gripper feedback; may be absent without the matching Tool package |
| `/info/gripper_feedback_R` | `std_msgs/msg/Float32MultiArray` | Right gripper feedback; may be absent without the matching Tool package |
| `/quad_tile/compressed` | `sensor_msgs/msg/CompressedImage` | Compressed four-tile camera image; absent when Camera is not running |

Common checks:

```bash
ros2 topic echo /info/robot_info --once
ros2 topic echo /info/arm_state --once
ros2 topic echo /joint_states --once
ros2 topic hz /info/joint_feedback
```

## 4. Input Sources and Input Mode

`/control/set_input` selects the active joint-command source. `/control/input_mode` publishes the current selection.

| Value | Frontend meaning | Command source |
|---:|---|---|
| `0` | None / Idle | No external motion command |
| `1` | Teleop | Teleoperation QP output `/control/qp_controller/joint_cmd_A/B` |
| `2` | Planner | Home and MoveJ planner output `/control/joint_cmd_plan_A/B` |
| `3` | Custom / User | Customer input `/control/user/joint_cmd_A/B` |
| `4` | Replay | Playback input `/control/replay/joint_cmd_A/B` |

Switch to Custom:

```bash
ros2 service call /control/set_input marvin_msgs/srv/Int "{data: 3}"
ros2 topic echo /control/input_mode --once
```

Exit Custom:

```bash
ros2 service call /control/set_input marvin_msgs/srv/Int "{data: 0}"
```

Use the Apex frontend for normal input-mode switching. Command-line calls are intended for integration testing.

## 5. Custom Command Inputs

| Topic | Type | Description |
|---|---|---|
| `/control/user/joint_cmd_A` | `marvin_msgs/msg/JointcmdArm` | Seven left-arm joint targets in radians |
| `/control/user/joint_cmd_B` | `marvin_msgs/msg/JointcmdArm` | Seven right-arm joint targets in radians |
| `/control/gripperValueL` | `std_msgs/msg/Float32` | Left gripper target when a supported end effector is configured |
| `/control/gripperValueR` | `std_msgs/msg/Float32` | Right gripper target when a supported end effector is configured |

Inspect message fields and topic subscriptions first:

```bash
ros2 interface show marvin_msgs/msg/JointcmdArm
ros2 topic info /control/user/joint_cmd_A -v
ros2 topic info /control/user/joint_cmd_B -v
```

Maintain time-continuous targets for both arms. The robot control chain rejects stale final joint commands, so do not use low-rate, intermittent one-shot publication for continuous motion.

## 6. Robot Control Services

| Service | Type | Purpose |
|---|---|---|
| `/control/set_input` | `marvin_msgs/srv/Int` | Select None, Teleop, Planner, Custom, or Replay input |
| `/control/set_mode` | `marvin_msgs/srv/Int` | `0` Idle, `1` position mode, `3` joint impedance mode |
| `/control/set_ready` | `std_srvs/srv/Trigger` | Set Ready; live joint commands are accepted only after Ready |
| `/control/set_drag` | `marvin_msgs/srv/Int` | `0` exit joint drag, `1` enter joint drag |
| `/control/set_vel_ratio` | `marvin_msgs/srv/Int` | Set planner velocity/acceleration ratio to `30`, `50`, `80`, or `100` |
| `/control/clear_fault` | `std_srvs/srv/Trigger` | Clear controller or servo faults |
| `/control/get_motor_err_code` | `marvin_msgs/srv/MotorErrCode` | Read servo error codes for all 14 arm joints |
| `/control/go_home` | `std_srvs/srv/Trigger` | Plan to the configured Home joint values |
| `/control/movej` | `marvin_msgs/srv/MoveJ` | Execute a point-to-point plan for 14 arm joints |
| `/control/reset_grippers` | `std_srvs/srv/Trigger` | Reset configured DM/ZY grippers; may be absent without the Tool package |

Inspect request fields on the target release:

```bash
ros2 interface show marvin_msgs/srv/Int
ros2 interface show marvin_msgs/srv/MoveJ
ros2 interface show marvin_msgs/srv/MotorErrCode
```

The following calls set Ready and joint impedance mode. Use the Apex frontend for routine customer operation:

```bash
ros2 service call /control/set_ready std_srvs/srv/Trigger "{}"
ros2 service call /control/set_mode marvin_msgs/srv/Int "{data: 3}"
```

## 7. Teleoperation Chain Diagnostic Topics

The following topics expose the teleoperation, QP, planner, replay, and final command chain. Except for the documented Custom and gripper inputs, customer applications must not publish to these topics.

| Topic | Type | Description |
|---|---|---|
| `/control/target_poseL` | `geometry_msgs/msg/PoseStamped` | Left-arm end-effector target mapped from the left controller |
| `/control/target_poseR` | `geometry_msgs/msg/PoseStamped` | Right-arm end-effector target mapped from the right controller |
| `/control/enableL` | `std_msgs/msg/Bool` | Left-arm teleoperation enable state |
| `/control/enableR` | `std_msgs/msg/Bool` | Right-arm teleoperation enable state |
| `/control/ik_request` | `marvin_msgs/msg/IKRequest` | End-effector targets, validity flags, and joint seed |
| `/control/ik_result` | `marvin_msgs/msg/IKResult` | QP solve result |
| `/control/qp_controller/joint_cmd_A` | `marvin_msgs/msg/JointcmdArm` | Left teleoperation QP output; read-only diagnostics |
| `/control/qp_controller/joint_cmd_B` | `marvin_msgs/msg/JointcmdArm` | Right teleoperation QP output; read-only diagnostics |
| `/control/joint_cmd_plan_A` | `marvin_msgs/msg/Jointcmd` | Left planner output; read-only diagnostics |
| `/control/joint_cmd_plan_B` | `marvin_msgs/msg/Jointcmd` | Right planner output; read-only diagnostics |
| `/control/replay/joint_cmd_A` | `marvin_msgs/msg/JointcmdArm` | Left playback output; read-only diagnostics |
| `/control/replay/joint_cmd_B` | `marvin_msgs/msg/JointcmdArm` | Right playback output; read-only diagnostics |
| `/control/joint_cmd_A` | `marvin_msgs/msg/JointcmdArm` | Selected final left-arm command; read-only diagnostics |
| `/control/joint_cmd_B` | `marvin_msgs/msg/JointcmdArm` | Selected final right-arm command; read-only diagnostics |
| `/control/input_mode` | `std_msgs/msg/Int32` | Current input-source value |

If headset input is present but the robot does not move, inspect the chain in this order:

```bash
ros2 topic echo /info/vr_connected --once
ros2 topic echo /control/target_poseL --once
ros2 topic echo /control/enableL --once
ros2 topic echo /control/ik_request --once
ros2 topic echo /control/qp_controller/joint_cmd_A --once
ros2 topic echo /control/input_mode --once
ros2 topic echo /control/joint_cmd_A --once
ros2 topic echo /info/arm_state --once
```

## 8. Recording and Playback Interfaces

| Service | Type | Purpose |
|---|---|---|
| `/recorder/control` | `marvin_msgs/srv/JsonCommand` | Recording `start`, `stop`, `status`, `get_topics`, and `storage_status` |
| `/playback/control` | `marvin_msgs/srv/JsonCommand` | Playback `load`, `play`, `pause`, `stop`, `seek`, and `set_rate` |
| `/recorder/set_recording` | `marvin_msgs/srv/VideoCapture` | Start or stop camera video recording with the data recorder |

Inspect the JSON and video request fields on the target release:

```bash
ros2 interface show marvin_msgs/srv/JsonCommand
ros2 interface show marvin_msgs/srv/VideoCapture
```

The current recording set includes these key topics:

| Topic | Purpose |
|---|---|
| `/joint_states` | Core dual-arm motion and playback data |
| `/info/eef_left`, `/info/eef_right` | End-effector poses |
| `/control/joint_cmd_A`, `/control/joint_cmd_B` | Final dual-arm commands |
| `/info/gripper_feedback_L`, `/info/gripper_feedback_R` | Gripper feedback |
| `/hand_left/joint_commands`, `/hand_right/joint_commands` | Dexterous-hand or glove commands when configured |
| `/hand_left/joint_states`, `/hand_right/joint_states` | Dexterous-hand state when configured |

Recordings are stored by default on the USB drive labeled `BAG_STORAGE`:

```text
/media/<user>/BAG_STORAGE/recorded_bags
```

## 9. Camera Interfaces

| Topic / Service | Type | Purpose |
|---|---|---|
| `/quad_tile/compressed` | `sensor_msgs/msg/CompressedImage` | Compressed four-camera composite for preview, recording, and customer algorithms |
| `/recorder/set_recording` | `marvin_msgs/srv/VideoCapture` | Start or stop camera video recording |

```bash
ros2 topic info /quad_tile/compressed -v
ros2 topic hz /quad_tile/compressed
```

## 10. Network Ports

Allow the following headset teleoperation ports when a firewall or routed network is used:

| Port | Protocol | Direction | Purpose |
|---:|---|---|---|
| `9000` | UDP | Headset → controller | Left teleoperation pose and button data |
| `9001` | UDP | Headset → controller | Right teleoperation pose and button data |
| `9002` | UDP | Controller → headset | Left end-effector feedback |
| `9003` | UDP | Controller → headset | Right end-effector feedback |
| `9004` | UDP | Headset → controller | Auxiliary tracking data |
| `9010` | TCP | Bidirectional | Headset connection, heartbeat, and protocol handshake |
| `8888` | UDP | Broadcast/discovery | Host and headset discovery |

When TCP gating is enabled on the target release, receiving UDP packets alone does not mean that the teleoperation link is established. Also check `/info/vr_connected`.

## 11. Custom Input Troubleshooting

```bash
ros2 topic echo /info/robot_info --once
ros2 topic echo /info/robot_state --once
ros2 topic echo /control/input_mode --once
ros2 topic info /control/user/joint_cmd_A -v
ros2 topic info /control/user/joint_cmd_B -v
ros2 topic hz /control/user/joint_cmd_A
ros2 topic hz /control/user/joint_cmd_B
```

If Custom input produces no motion, verify:

1. Robot is running and the URDF pose matches the physical robot.
2. The robot is Ready and in Impedance Mode.
3. Home has completed and the robot has no active fault.
4. `/control/input_mode` is `3`.
5. `JointcmdArm` fields, arm order, timestamps, and units are correct.
6. The customer application publishes continuously without long gaps.

The VLA section demonstrates capabilities and workflow only. Contact the KernelMind VLA team for a reproducible solution matched to your device release.
