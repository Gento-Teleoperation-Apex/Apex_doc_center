---
title: Marvin Pro Interfaces
sidebar_position: 4
---

# Marvin Pro Customer Integration Interfaces

This page documents the customer-facing ROS 2 topics, services, input sources, and network ports for the current Marvin Pro. It applies to Apex Humble `v1.0.7.74o` / Jazzy `v1.0.7.74t` (2026-08-17) and later releases using the same interface contract. The software installed on the delivered device remains authoritative. For Skye/Luna, see [Gento (Skye/Luna) ROS 2 Interfaces](./gento-interfaces).

## 1. Namespace and Compatibility

Robot, Teleop, QP, Planner, VLA, Recorder, and Playback run in the `tj` namespace by default. For example, the relative name `control/joint_cmd_A` resolves to `/tj/control/joint_cmd_A`.

```bash
source /etc/apex/apex_ros_env.sh
echo "APEX_ROS_NAMESPACE=${APEX_ROS_NAMESPACE:-tj}"
ros2 topic list | grep '^/tj/' | sort
ros2 service list | grep '^/tj/' | sort
```

:::warning Legacy paths are not compatible

Core control and gripper interfaces have moved to `/tj`. Applications that still use `/control/...` or `/info/...` may fail to find topics, command the gripper, or receive feedback.

:::

The following interfaces remain global:

- `/hand_left/*` and `/hand_right/*`: Wuji hands;
- `/quad_tile/jpeg/compressed`: tiled JPEG camera image;
- `/recorder/set_recording`: camera recording service;
- `/info/apex_package_info`: Apex package version;
- `/tf`, `/tf_static`, `/rosout`, and `/parameter_events`: ROS system interfaces.

## 2. Safety Requirements

- Start Robot in Apex and verify Ready state, operating mode, and a safe initial pose before external control.
- Never call Home directly from the factory packing pose. Use Planner and `/tj/control/movej` to move all 14 arm joints safely to zero first.
- For direct joint commands, select `Custom/User` (`set_input=3`).
- For Cartesian IK commands, select the VLA IK source (`set_ik_input=2`) and keep Joint Input on Teleop/QP (`set_input=1`).
- Clear the workspace, start with small motions, and keep the emergency stop within reach.
- Publish smooth, time-continuous targets within joint limits.
- Switch the relevant source to Idle before stopping the publisher.
- Never publish to topics marked **read-only**.
- Inspect the installed `marvin_msgs` definitions with `ros2 interface show` before integration.

## 3. Input Arbitration

The current release has two arbitration layers. Publishing an input topic alone does not command the robot.

### 3.1 IK source

| Value | Source | Input topic |
|---:|---|---|
| `0` | Idle | No IK forwarding |
| `1` | VR | `/tj/control/ik_request/vr` |
| `2` | VLA / customer Cartesian input | `/tj/control/ik_request/vla` |

Switch with `/tj/control/set_ik_input`. Read the current source from `/tj/info/ik_request_mux/active_source`.

### 3.2 Joint source

| Value | Source | Input topic |
|---:|---|---|
| `0` | Idle | No joint forwarding |
| `1` | Teleop / QP | `/tj/control/qp_controller/joint_cmd_A/B` |
| `2` | Planner | `/tj/control/joint_cmd_plan_A/B` |
| `3` | Custom / User | `/tj/control/user/joint_cmd_A/B` |
| `4` | Replay | `/tj/control/replay/joint_cmd_A/B` |

Switch with `/tj/control/set_input`. Read the current source from `/tj/control/input_mode`.

## 4. State and Feedback Topics

Marvin Pro arrays place the seven left-arm joints before the seven right-arm joints.

| Topic | Type | Access | Description |
|---|---|---|---|
| `/tj/joint_states` | `sensor_msgs/msg/JointState` | Read-only | Standard joint state, approximately 100 Hz by default |
| `/tj/info/joint_feedback` | `marvin_msgs/msg/Jointfeedback` | Read-only | High-rate position, velocity, and torque feedback |
| `/tj/info/arm_state` | `std_msgs/msg/Int16MultiArray` | Read-only | Dual-arm state codes |
| `/tj/info/robot_state` | `std_msgs/msg/Int16MultiArray` | Read-only | Whole-robot control state |
| `/tj/info/robot_info` | `marvin_msgs/msg/RobotInfo` | Read-only | Robot model and controller version |
| `/tj/info/eef_left` | `geometry_msgs/msg/PoseStamped` | Read-only | Left end-effector pose |
| `/tj/info/eef_right` | `geometry_msgs/msg/PoseStamped` | Read-only | Right end-effector pose |
| `/tj/info/wrench_left` | `geometry_msgs/msg/WrenchStamped` | Read-only | Left end-effector wrench |
| `/tj/info/wrench_right` | `geometry_msgs/msg/WrenchStamped` | Read-only | Right end-effector wrench |
| `/tj/info/vr_connected` | `std_msgs/msg/Bool` | Read-only | Headset connection state |
| `/tj/info/go_home_status` | `std_msgs/msg/String` | Read-only | Home / Planner state |
| `/info/apex_package_info` | `std_msgs/msg/String` | Read-only, global | Apex package information |

## 5. Customer Control Inputs

| Topic | Type | Requirement |
|---|---|---|
| `/tj/control/user/joint_cmd_A` | `marvin_msgs/msg/JointcmdArm` | Left seven-joint target in rad; `set_input=3` |
| `/tj/control/user/joint_cmd_B` | `marvin_msgs/msg/JointcmdArm` | Right seven-joint target in rad; `set_input=3` |
| `/tj/control/ik_request/vla` | `marvin_msgs/msg/IKRequest` | Cartesian target; `set_ik_input=2`, `set_input=1` |
| `/tj/control/gripperValueL` | `std_msgs/msg/Float32` | Left Tool running |
| `/tj/control/gripperValueR` | `std_msgs/msg/Float32` | Right Tool running |
| `/tj/control/footkey` | `std_msgs/msg/Bool` | Optional; only when `glove_mode=true` |

```bash
ros2 interface show marvin_msgs/msg/JointcmdArm
ros2 interface show marvin_msgs/msg/IKRequest
ros2 topic info /tj/control/user/joint_cmd_A -v
ros2 topic info /tj/control/ik_request/vla -v
```

## 6. Robot Control Services

| Service | Type | Purpose |
|---|---|---|
| `/tj/control/set_ready` | `std_srvs/srv/Trigger` | Enter Ready state |
| `/tj/control/set_mode` | `marvin_msgs/srv/Int` | Set robot mode |
| `/tj/control/set_drag` | `marvin_msgs/srv/Int` | Set drag/teaching mode |
| `/tj/control/set_vel_ratio` | `marvin_msgs/srv/Int` | Set planner velocity ratio |
| `/tj/control/clear_fault` | `std_srvs/srv/Trigger` | Clear faults |
| `/tj/control/get_motor_err_code` | `marvin_msgs/srv/MotorErrCode` | Read motor error codes |
| `/tj/control/set_ik_input` | `marvin_msgs/srv/Int` | Select IK source `0/1/2` |
| `/tj/control/set_input` | `marvin_msgs/srv/Int` | Select joint source `0/1/2/3/4` |
| `/tj/control/movej` | `marvin_msgs/srv/MoveJ` | Plan a 14-joint point-to-point move |
| `/tj/control/go_home` | `std_srvs/srv/Trigger` | Plan both arms to Home |
| `/tj/control/reset_grippers` | `std_srvs/srv/Trigger` | Reset/enable DM or ZY grippers when Tool is running |

```bash
# Customer joint input
ros2 service call /tj/control/set_input marvin_msgs/srv/Int "{data: 3}"

# Customer Cartesian IK input
ros2 service call /tj/control/set_ik_input marvin_msgs/srv/Int "{data: 2}"
ros2 service call /tj/control/set_input marvin_msgs/srv/Int "{data: 1}"

# Stop joint forwarding
ros2 service call /tj/control/set_input marvin_msgs/srv/Int "{data: 0}"
```

## 7. Read-Only Teleop and Control-Chain Topics

| Topic | Type | Description |
|---|---|---|
| `/tj/control/target_poseL` | `geometry_msgs/msg/PoseStamped` | VR left target pose |
| `/tj/control/target_poseR` | `geometry_msgs/msg/PoseStamped` | VR right target pose |
| `/tj/control/enableL` | `std_msgs/msg/Bool` | Left teleoperation enable |
| `/tj/control/enableR` | `std_msgs/msg/Bool` | Right teleoperation enable |
| `/tj/control/vr_joy_L` | `sensor_msgs/msg/Joy` | Raw left controller input |
| `/tj/control/vr_joy_R` | `sensor_msgs/msg/Joy` | Raw right controller input |
| `/tj/control/Elbow_left` | `geometry_msgs/msg/PoseStamped` | Left elbow tracking pose |
| `/tj/control/Elbow_right` | `geometry_msgs/msg/PoseStamped` | Right elbow tracking pose |
| `/tj/control/eef_cmd_A` | `geometry_msgs/msg/PoseStamped` | Mapped left Cartesian target |
| `/tj/control/eef_cmd_B` | `geometry_msgs/msg/PoseStamped` | Mapped right Cartesian target |
| `/tj/control/ik_request/vr` | `marvin_msgs/msg/IKRequest` | VR IK request |
| `/tj/control/ik_request` | `marvin_msgs/msg/IKRequest` | Arbitrated QP IK request |
| `/tj/control/ik_cmd_A` | `marvin_msgs/msg/Jointcmd` | Compatibility left IK diagnostic output; not in the primary command path |
| `/tj/control/ik_cmd_B` | `marvin_msgs/msg/Jointcmd` | Compatibility right IK diagnostic output; not in the primary command path |
| `/tj/info/ik_request_mux/active_source` | `std_msgs/msg/Int32` | Active IK source |
| `/tj/control/ik_result` | `marvin_msgs/msg/IKResult` | IK result |
| `/tj/joint_state_cmd` | `sensor_msgs/msg/JointState` | Full-model QP target |
| `/tj/control/qp_controller/joint_cmd_A` | `marvin_msgs/msg/JointcmdArm` | QP left output |
| `/tj/control/qp_controller/joint_cmd_B` | `marvin_msgs/msg/JointcmdArm` | QP right output |
| `/tj/control/joint_cmd_plan_A` | `marvin_msgs/msg/Jointcmd` | Planner left output |
| `/tj/control/joint_cmd_plan_B` | `marvin_msgs/msg/Jointcmd` | Planner right output |
| `/tj/control/replay/joint_cmd_A` | `marvin_msgs/msg/JointcmdArm` | Playback left output |
| `/tj/control/replay/joint_cmd_B` | `marvin_msgs/msg/JointcmdArm` | Playback right output |
| `/tj/control/joint_cmd_A` | `marvin_msgs/msg/JointcmdArm` | Final left command |
| `/tj/control/joint_cmd_B` | `marvin_msgs/msg/JointcmdArm` | Final right command |
| `/tj/control/input_mode` | `std_msgs/msg/Int32` | Active joint source |

## 8. End-Effector Topics

### 8.1 DM / ZY grippers

| Topic | Type | Access |
|---|---|---|
| `/tj/control/gripperValueL` | `std_msgs/msg/Float32` | Customer input |
| `/tj/control/gripperValueR` | `std_msgs/msg/Float32` | Customer input |
| `/tj/info/gripper_feedback_L` | `std_msgs/msg/Float32MultiArray` | Read-only |
| `/tj/info/gripper_feedback_R` | `std_msgs/msg/Float32MultiArray` | Read-only |
| `/tj/info/gripper_feedback_L_err` | `std_msgs/msg/Int32MultiArray` | Read-only |
| `/tj/info/gripper_feedback_R_err` | `std_msgs/msg/Int32MultiArray` | Read-only |

### 8.2 Wuji hands (global)

| Topic | Type | Access |
|---|---|---|
| `/hand_left/joint_commands` | `sensor_msgs/msg/JointState` | Customer input |
| `/hand_left/joint_states` | `sensor_msgs/msg/JointState` | Read-only |
| `/hand_right/joint_commands` | `sensor_msgs/msg/JointState` | Customer input |
| `/hand_right/joint_states` | `sensor_msgs/msg/JointState` | Read-only |
| `/hand_left/joint_commands_playback` | `sensor_msgs/msg/JointState` | Read-only |
| `/hand_right/joint_commands_playback` | `sensor_msgs/msg/JointState` | Read-only |

## 9. Recorder, Playback, and Camera

| Topic / Service | Type | Purpose |
|---|---|---|
| `/tj/recorder/status` | `std_msgs/msg/Int32` | Recording state topic |
| `/tj/recorder/control` | `marvin_msgs/srv/JsonCommand` | Recording control service |
| `/tj/control/playback_control` | `std_msgs/msg/String` | Compatibility playback topic |
| `/tj/playback/control` | `marvin_msgs/srv/JsonCommand` | Main playback service |
| `/tj/playback_status` | `std_msgs/msg/String` | Playback state topic |
| `/tj/playback_key` | `std_msgs/msg/Bool` | Playback key/state topic |
| `/quad_tile/jpeg/compressed` | `sensor_msgs/msg/CompressedImage` | Global tiled JPEG image |
| `/recorder/set_recording` | `marvin_msgs/srv/VideoCapture` | Global camera recording service |

See [Topic Whitelist Configuration and Troubleshooting](/advanced/topic-whitelist) for recording, playback, WebSocket, and diagnostic-log allowlists.

## 10. Optional VLA API

Integrated `vlahost` consumes robot state, end-effector poses, gripper feedback, and `/quad_tile/jpeg/compressed`. It publishes actions through the customer input topics above and exposes `GET /health`, `GET /state`, `WS /ws/state`, `POST /action`, `WS /ws/action`, and `GET /stream/quad.mjpg` on TCP port `8000` by default.

## 11. Network Ports

| Port | Protocol | Direction | Purpose |
|---:|---|---|---|
| `9000` | UDP | Headset → controller | Left teleoperation data |
| `9001` | UDP | Headset → controller | Right teleoperation data |
| `9002` | UDP | Controller → headset | Left end-effector feedback |
| `9003` | UDP | Controller → headset | Right end-effector feedback |
| `9004` | UDP | Headset → controller | Auxiliary tracking data |
| `9010` | TCP | Bidirectional | Connection, heartbeat, and handshake |
| `8888` | UDP | Broadcast | Host/headset discovery |
| `8000` | TCP | Bidirectional | Optional VLA HTTP/WebSocket |

## 12. Minimum Verification

```bash
source /etc/apex/apex_ros_env.sh
ros2 topic list | grep -E '^/tj/(joint_states|info/joint_feedback|control/joint_cmd_A|control/gripperValueL|info/gripper_feedback_L)$'
ros2 service list | grep -E '^/tj/control/(set_ready|set_input|set_ik_input|reset_grippers)$'
```

Gripper topics and `reset_grippers` are absent when Tool is stopped. `/quad_tile/jpeg/compressed` is absent when Camera is stopped. See the [Marvin Pro ROS Topic List](/advanced/ros-topic-list) for the consolidated reference.
