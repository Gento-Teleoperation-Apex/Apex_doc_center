---
title: Marvin Pro Interfaces
sidebar_position: 4
---

# Marvin Pro Customer Integration Interfaces

This page documents the customer-facing ROS 2 topics, services, input sources, and network ports for the current Marvin Pro. It covers state access, data acquisition, customer control integration, and diagnostics. The content has been checked against the KernelMind Apex `1.0.7.6` development baseline, but the software installed on the delivered device remains authoritative. Skye/Luna has a different whole-body joint layout and message structure. See [Gento (Skye/Luna) ROS 2 Interfaces](./gento-interfaces).

The interfaces installed on the target device are authoritative. Load the controller environment and inspect them before development:

```bash
source /etc/apex/apex_ros_env.sh
ros2 topic list
ros2 service list
ros2 interface list | grep marvin_msgs
```

## 1. Safety Requirements

- In the Apex frontend, complete **Start Robot → Impedance Mode → Home** before external control. However, never call Home directly from the factory packing pose. First use Planner and `/control/movej` to move all 14 arm joints to zero.
- Set **Input Mode** to **Custom** before the robot accepts customer joint commands.
- Clear the workspace, begin with small motions, and keep the emergency stop within reach.
- Publish smooth, time-continuous targets that stay within the robot joint limits.
- Switch Input Mode back to **None** before stopping the command process.
- Do not publish to QP, planner, replay, or final-command topics marked as read-only diagnostics.
- Message fields are defined by the installed `marvin_msgs` package. Inspect them with `ros2 interface show` before writing an application.

Interfaces are classified by purpose: **customer input** interfaces may be published or called by customer applications; **read-only** and **read-only diagnostic** interfaces are for subscription, recording, and troubleshooting only; **optional** interfaces appear only when the corresponding Camera, Tool, Recorder, Playback, or VLA module is running.

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
| `/info/joint_feedback` | `marvin_msgs/msg/Jointfeedback` | High-rate dual-arm feedback, with seven left-arm joints followed by seven right-arm joints |
| `/info/arm_state` | `std_msgs/msg/Int16MultiArray` | `[stateA, stateB]`; values may be `-1` before Ready |
| `/info/robot_state` | `std_msgs/msg/Int16MultiArray` | Dual-arm movable state used by the control chain |
| `/info/robot_info` | `marvin_msgs/msg/RobotInfo` | Robot model, controller, and software-version text |
| `/info/eef_left` | `geometry_msgs/msg/PoseStamped` | Left end-effector forward-kinematics pose |
| `/info/eef_right` | `geometry_msgs/msg/PoseStamped` | Right end-effector forward-kinematics pose |
| `/info/wrench_left` | `geometry_msgs/msg/WrenchStamped` | Estimated left end-effector wrench |
| `/info/wrench_right` | `geometry_msgs/msg/WrenchStamped` | Estimated right end-effector wrench |
| `/info/vr_connected` | `std_msgs/msg/Bool` | Headset TCP heartbeat and connection state |
| `/info/apex_package_info` | `std_msgs/msg/String` | Installed controller package version and package state |
| `/info/gripper_feedback_L` | `std_msgs/msg/Float32MultiArray` | Left gripper feedback; fields vary with the Tool release; optional |
| `/info/gripper_feedback_R` | `std_msgs/msg/Float32MultiArray` | Right gripper feedback; fields vary with the Tool release; optional |
| `/info/gripper_feedback_L_err` | `std_msgs/msg/Int32MultiArray` | Left gripper error codes provided by the Tool module; optional |
| `/info/gripper_feedback_R_err` | `std_msgs/msg/Int32MultiArray` | Right gripper error codes provided by the Tool module; optional |
| `/quad_tile/compressed` | `sensor_msgs/msg/CompressedImage` | Optional four-tile JPEG; it may be absent when ROS image output is disabled even if WebRTC video works |

Common checks:

```bash
ros2 topic echo /info/robot_info --once
ros2 topic echo /info/arm_state --once
ros2 topic echo /joint_states --once
ros2 topic hz /info/joint_feedback
```

High-rate feedback and target topics generally use Sensor Data QoS (Best Effort). Mode and state topics may use Reliable with Transient Local durability. If a subscriber receives no data, run `ros2 topic info <topic> -v` and match the publisher QoS on the delivered release.

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
| `/control/footkey` | `std_msgs/msg/Bool` | Optional foot-pedal or glove-mode gate; use only when enabled in the delivered configuration |

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
| `/control/set_vel_ratio` | `marvin_msgs/srv/Int` | Request level `0/1/2/3`, corresponding to approximately `30/50/80/100%` planner velocity/acceleration; it may not affect streaming PD/feed-forward control |
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

In the factory packing pose, the wrist cameras are close to the center column. Do not call `/control/go_home` directly. Start Robot and Teleop, set the robot Ready, select Position Mode and Planner input, then move all 14 joints to zero:

```bash
ros2 service call /control/set_mode marvin_msgs/srv/Int "{data: 1}"
ros2 service call /control/set_input marvin_msgs/srv/Int "{data: 2}"
ros2 service call /control/movej marvin_msgs/srv/MoveJ "{joint_values: [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0]}"
```

Enter Impedance Mode and call Home only after both arms reach all zeros and the path is clear. RQt Service Caller is recommended for the first operation so that the service, field, and values can be checked visually.

## 7. Teleoperation Chain Diagnostic Topics

The following topics expose the teleoperation, QP, planner, replay, and final command chain. Except for the documented Custom and gripper inputs, customer applications must not publish to these topics.

| Topic | Type | Description |
|---|---|---|
| `/control/target_poseL` | `geometry_msgs/msg/PoseStamped` | Left-arm end-effector target mapped from the left controller |
| `/control/target_poseR` | `geometry_msgs/msg/PoseStamped` | Right-arm end-effector target mapped from the right controller |
| `/control/vr_joy_L` | `sensor_msgs/msg/Joy` | Raw left-controller axes and buttons; read-only diagnostics |
| `/control/vr_joy_R` | `sensor_msgs/msg/Joy` | Raw right-controller axes and buttons; read-only diagnostics |
| `/control/Elbow_left` | `geometry_msgs/msg/PoseStamped` | Left-elbow input/debug pose; may be disabled in the current configuration |
| `/control/Elbow_right` | `geometry_msgs/msg/PoseStamped` | Right-elbow input/debug pose; may be disabled in the current configuration |
| `/control/enableL` | `std_msgs/msg/Bool` | Left-arm teleoperation enable state |
| `/control/enableR` | `std_msgs/msg/Bool` | Right-arm teleoperation enable state |
| `/control/ik_request` | `marvin_msgs/msg/IKRequest` | End-effector targets, validity flags, and joint seed |
| `/control/ik_result` | `marvin_msgs/msg/IKResult` | QP solve result |
| `/control/eef_cmd_A` | `geometry_msgs/msg/PoseStamped` | Internal left-arm end-effector target; read-only diagnostics |
| `/control/eef_cmd_B` | `geometry_msgs/msg/PoseStamped` | Internal right-arm end-effector target; read-only diagnostics |
| `/control/ik_cmd_A` | `marvin_msgs/msg/Jointcmd` | Legacy-compatible left IK output outside the current primary command chain; read-only diagnostics |
| `/control/ik_cmd_B` | `marvin_msgs/msg/Jointcmd` | Legacy-compatible right IK output outside the current primary command chain; read-only diagnostics |
| `/joint_state_cmd` | `sensor_msgs/msg/JointState` | Full QP joint solution; read-only diagnostics |
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
| `/recorder/control` | `marvin_msgs/srv/JsonCommand` | Recording `start`, `stop`, `status`, `get_topics`, `storage_status`, and `clear_storage_error` |
| `/playback/control` | `marvin_msgs/srv/JsonCommand` | Playback `load`, `play`, `pause`, `stop`, `seek`, and `set_rate` |
| `/recorder/set_recording` | `marvin_msgs/srv/VideoCapture` | Start or stop camera video recording with the data recorder |

The recording and playback modules also publish these read-only status topics:

| Topic | Type | Purpose |
|---|---|---|
| `/recorder/status` | `std_msgs/msg/Int32` | Recording state, published at approximately 1 Hz |
| `/playback_status` | `std_msgs/msg/String` | Playback state encoded as JSON |
| `/playback_key` | `std_msgs/msg/Bool` | Playback key/state using latched or Transient Local semantics |

Some compatibility releases also subscribe to `/control/playback_control` (`std_msgs/msg/String`, JSON). Prefer the `/playback/control` service for customer integration, and verify availability with `ros2 topic list` on the target device.

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

## 10. Optional VLA Interfaces

When the integrated `vlahost` service is running, customer applications can read robot observations and submit VLA actions over HTTP or WebSocket. The module consumes these ROS inputs:

| ROS input | Purpose |
|---|---|
| `/info/joint_feedback` | Dual-arm joint state |
| `/info/eef_left`, `/info/eef_right` | End-effector poses |
| `/info/gripper_feedback_L`, `/info/gripper_feedback_R` | Gripper state |
| `/info/gripper_feedback_L_err`, `/info/gripper_feedback_R_err` | Gripper error codes |
| `/quad_tile/compressed` | Optional four-tile camera image |

The default service port is `8000`:

| Interface | Purpose |
|---|---|
| `GET /health` | Service health check |
| `GET /state` | Read one current observation |
| `WS /ws/state?rate_hz=30` | Stream state at the requested rate |
| `GET /stream/quad.mjpg` | Read the four-tile MJPEG stream when the ROS image topic is available |
| `POST /action` | Submit one action |
| `WS /ws/action` | Submit a continuous action stream |

The integrated action schema uses separate seven-joint arrays for the two arms, in radians:

```json
{
  "jointcmd_left": [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0],
  "jointcmd_right": [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0],
  "gripper_left": 0.0,
  "gripper_right": 0.0
}
```

`vlahost` publishes arm actions to `/control/user/joint_cmd_A/B` and gripper actions to `/control/gripperValueL/R`. The robot must be Ready and movable, with Input Mode set to Custom (`data: 3` on `/control/set_input`). Standalone `openpi-kmd`, standalone `vlahost`, and the integrated delivered release may use different fields. Always verify the API shipped on the target device.

## 11. Network Ports

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
| `8000` | TCP | Client ↔ controller | Optional VLA HTTP/WebSocket service; open only while `vlahost` is running |

When TCP gating is enabled on the target release, receiving UDP packets alone does not mean that the teleoperation link is established. Also check `/info/vr_connected`.

## 12. Custom Input Troubleshooting

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

For a reproducible VLA setup, ensure that the delivered `vlahost`, model service, and interface versions match. JSON fields from different repositories or releases are not interchangeable.
