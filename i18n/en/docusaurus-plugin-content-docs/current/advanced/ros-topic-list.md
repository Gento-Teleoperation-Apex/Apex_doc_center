---
title: Marvin Pro ROS Topic List
sidebar_position: 3
---

# Marvin Pro ROS Topic List

This is the consolidated customer-visible ROS 2 topic reference for Apex Humble `v1.0.7.74o` / Jazzy `v1.0.7.74t` (2026-08-17) and later releases using the same interface contract. For safety, source arbitration, and service usage, see [Marvin Pro Customer Integration Interfaces](/software/apex-teleop/customer-interfaces).

:::warning Access rules

- **Customer input** topics may be published only when the required mode and arbitration source are active.
- **Read-only** topics are for subscription, recording, and diagnostics only.
- **Optional** topics appear only when the matching Tool, Camera, Recorder, Playback, VLA, or glove module is running.
- The target device's `ros2 topic list -t` output is authoritative.

:::

## 1. Namespace

Current Marvin Pro core interfaces use `/tj`. Legacy `/control/...`, `/info/...`, and `/joint_states` paths are not equivalent to their `/tj/...` replacements.

```bash
source /etc/apex/apex_ros_env.sh
ros2 topic list -t | grep -E '^/tj/|^/hand_|^/quad_tile/|^/info/apex_package_info' | sort
```

## 2. Robot State and Feedback

| Topic | Type | Access | Description |
|---|---|---|---|
| `/tj/joint_states` | `sensor_msgs/msg/JointState` | Read-only | Standard joint state |
| `/tj/info/joint_feedback` | `marvin_msgs/msg/Jointfeedback` | Read-only | High-rate position, velocity, and torque feedback |
| `/tj/info/arm_state` | `std_msgs/msg/Int16MultiArray` | Read-only | Dual-arm state codes |
| `/tj/info/robot_state` | `std_msgs/msg/Int16MultiArray` | Read-only | Whole-robot control state |
| `/tj/info/robot_info` | `marvin_msgs/msg/RobotInfo` | Read-only | Robot and controller information |
| `/tj/info/eef_left` | `geometry_msgs/msg/PoseStamped` | Read-only | Left end-effector pose |
| `/tj/info/eef_right` | `geometry_msgs/msg/PoseStamped` | Read-only | Right end-effector pose |
| `/tj/info/wrench_left` | `geometry_msgs/msg/WrenchStamped` | Read-only | Left end-effector wrench |
| `/tj/info/wrench_right` | `geometry_msgs/msg/WrenchStamped` | Read-only | Right end-effector wrench |
| `/tj/info/go_home_status` | `std_msgs/msg/String` | Read-only | Planner / Home state |
| `/info/apex_package_info` | `std_msgs/msg/String` | Read-only, global | Apex package version |

## 3. Headset and Teleoperation Input

| Topic | Type | Access | Description |
|---|---|---|---|
| `/tj/control/target_poseL` | `geometry_msgs/msg/PoseStamped` | Read-only | VR left target pose |
| `/tj/control/target_poseR` | `geometry_msgs/msg/PoseStamped` | Read-only | VR right target pose |
| `/tj/control/enableL` | `std_msgs/msg/Bool` | Read-only | Left teleoperation enable |
| `/tj/control/enableR` | `std_msgs/msg/Bool` | Read-only | Right teleoperation enable |
| `/tj/control/vr_joy_L` | `sensor_msgs/msg/Joy` | Read-only | Raw left controller input |
| `/tj/control/vr_joy_R` | `sensor_msgs/msg/Joy` | Read-only | Raw right controller input |
| `/tj/control/Elbow_left` | `geometry_msgs/msg/PoseStamped` | Read-only | Left elbow tracking pose |
| `/tj/control/Elbow_right` | `geometry_msgs/msg/PoseStamped` | Read-only | Right elbow tracking pose |
| `/tj/info/vr_connected` | `std_msgs/msg/Bool` | Read-only | Headset connection state |
| `/tj/control/footkey` | `std_msgs/msg/Bool` | Customer input, optional | Glove-mode foot pedal |

## 4. Customer Control Inputs

| Topic | Type | Requirement |
|---|---|---|
| `/tj/control/user/joint_cmd_A` | `marvin_msgs/msg/JointcmdArm` | Joint Input = `3` |
| `/tj/control/user/joint_cmd_B` | `marvin_msgs/msg/JointcmdArm` | Joint Input = `3` |
| `/tj/control/ik_request/vla` | `marvin_msgs/msg/IKRequest` | IK Input = `2`, Joint Input = `1` |
| `/tj/control/gripperValueL` | `std_msgs/msg/Float32` | Left Tool running |
| `/tj/control/gripperValueR` | `std_msgs/msg/Float32` | Right Tool running |

## 5. Teleop, IK, and QP Chain

| Topic | Type | Access | Description |
|---|---|---|---|
| `/tj/control/eef_cmd_A` | `geometry_msgs/msg/PoseStamped` | Read-only | Mapped left Cartesian target |
| `/tj/control/eef_cmd_B` | `geometry_msgs/msg/PoseStamped` | Read-only | Mapped right Cartesian target |
| `/tj/control/ik_request/vr` | `marvin_msgs/msg/IKRequest` | Read-only | VR IK request |
| `/tj/control/ik_request` | `marvin_msgs/msg/IKRequest` | Read-only | Arbitrated QP IK request |
| `/tj/control/ik_cmd_A` | `marvin_msgs/msg/Jointcmd` | Read-only | Compatibility left IK diagnostic output; not in the primary chain |
| `/tj/control/ik_cmd_B` | `marvin_msgs/msg/Jointcmd` | Read-only | Compatibility right IK diagnostic output; not in the primary chain |
| `/tj/info/ik_request_mux/active_source` | `std_msgs/msg/Int32` | Read-only | IK source: `0=idle, 1=VR, 2=VLA` |
| `/tj/control/ik_result` | `marvin_msgs/msg/IKResult` | Read-only | IK result |
| `/tj/joint_state_cmd` | `sensor_msgs/msg/JointState` | Read-only | Full-model QP target |
| `/tj/control/qp_controller/joint_cmd_A` | `marvin_msgs/msg/JointcmdArm` | Read-only | QP left output |
| `/tj/control/qp_controller/joint_cmd_B` | `marvin_msgs/msg/JointcmdArm` | Read-only | QP right output |

## 6. Planner, Playback, and Final Commands

| Topic | Type | Access | Description |
|---|---|---|---|
| `/tj/control/joint_cmd_plan_A` | `marvin_msgs/msg/Jointcmd` | Read-only | Planner left output |
| `/tj/control/joint_cmd_plan_B` | `marvin_msgs/msg/Jointcmd` | Read-only | Planner right output |
| `/tj/control/replay/joint_cmd_A` | `marvin_msgs/msg/JointcmdArm` | Read-only | Playback left output |
| `/tj/control/replay/joint_cmd_B` | `marvin_msgs/msg/JointcmdArm` | Read-only | Playback right output |
| `/tj/control/joint_cmd_A` | `marvin_msgs/msg/JointcmdArm` | Read-only | Final left command |
| `/tj/control/joint_cmd_B` | `marvin_msgs/msg/JointcmdArm` | Read-only | Final right command |
| `/tj/control/input_mode` | `std_msgs/msg/Int32` | Read-only | Joint source: `0=idle, 1=teleop, 2=planner, 3=user, 4=replay` |

## 7. DM / ZY Grippers

| Topic | Type | Access |
|---|---|---|
| `/tj/control/gripperValueL` | `std_msgs/msg/Float32` | Customer input, optional |
| `/tj/control/gripperValueR` | `std_msgs/msg/Float32` | Customer input, optional |
| `/tj/info/gripper_feedback_L` | `std_msgs/msg/Float32MultiArray` | Read-only, optional |
| `/tj/info/gripper_feedback_R` | `std_msgs/msg/Float32MultiArray` | Read-only, optional |
| `/tj/info/gripper_feedback_L_err` | `std_msgs/msg/Int32MultiArray` | Read-only, optional |
| `/tj/info/gripper_feedback_R_err` | `std_msgs/msg/Int32MultiArray` | Read-only, optional |

## 8. Wuji Hands

Wuji topics remain global and do not use `/tj`.

| Topic | Type | Access |
|---|---|---|
| `/hand_left/joint_commands` | `sensor_msgs/msg/JointState` | Customer input, optional |
| `/hand_left/joint_states` | `sensor_msgs/msg/JointState` | Read-only, optional |
| `/hand_right/joint_commands` | `sensor_msgs/msg/JointState` | Customer input, optional |
| `/hand_right/joint_states` | `sensor_msgs/msg/JointState` | Read-only, optional |
| `/hand_left/joint_commands_playback` | `sensor_msgs/msg/JointState` | Read-only, optional |
| `/hand_right/joint_commands_playback` | `sensor_msgs/msg/JointState` | Read-only, optional |

## 9. Recorder, Playback, and Camera

| Topic | Type | Access | Description |
|---|---|---|---|
| `/tj/recorder/status` | `std_msgs/msg/Int32` | Read-only, optional | Recording state |
| `/tj/control/playback_control` | `std_msgs/msg/String` | Compatibility input, optional | JSON playback control; prefer the service |
| `/tj/playback_status` | `std_msgs/msg/String` | Read-only, optional | Playback state |
| `/tj/playback_key` | `std_msgs/msg/Bool` | Read-only, optional | Playback key/state |
| `/quad_tile/jpeg/compressed` | `sensor_msgs/msg/CompressedImage` | Read-only, optional, global | Tiled JPEG image |

## 10. ROS System Topics

| Topic | Type | Access |
|---|---|---|
| `/tf` | `tf2_msgs/msg/TFMessage` | Read-only |
| `/tf_static` | `tf2_msgs/msg/TFMessage` | Read-only |
| `/rosout` | `rcl_interfaces/msg/Log` | Read-only |
| `/parameter_events` | `rcl_interfaces/msg/ParameterEvent` | Read-only |

## 11. Quick Verification

```bash
source /etc/apex/apex_ros_env.sh

echo '=== /tj topics ==='
ros2 topic list -t | grep '^/tj/' | sort

echo '=== global product topics ==='
ros2 topic list -t | grep -E '^/hand_|^/quad_tile/|^/info/apex_package_info$' | sort

echo '=== customer input endpoints ==='
ros2 topic info /tj/control/user/joint_cmd_A -v
ros2 topic info /tj/control/ik_request/vla -v
ros2 topic info /tj/control/gripperValueL -v
```

Topics appear only while their modules are running. If a topic exists but carries no messages, check its publishers, QoS, `ROS_DOMAIN_ID`, `APEX_ROS_NAMESPACE`, and module state.

## 12. Topic Rate Reference

The following values come from the current Marvin Pro source and default parameters. Timer, SDK/CAN control-loop, ROS topic, and frontend WebSocket rates are different concepts. These values are not hard real-time guarantees under Linux, DDS, or network load.

| Topic / chain | Design or expected rate | Condition |
|---|---:|---|
| `/tj/info/eef_left/right` | 1000 Hz | Teleop running; actual rate depends on compute load |
| `/tj/control/ik_request/vr` | 1000 Hz | Teleop running with a valid VR source |
| `/tj/control/qp_controller/joint_cmd_A/B` | Up to 500 Hz | Robot Ready, valid target, and healthy QP |
| `/tj/control/joint_cmd_A/B` | Normally 500 Hz in Teleop | Joint source is Teleop; follows the active source |
| `/tj/info/joint_feedback` | 200 Hz | Robot connected to MarvinSDK |
| `/tj/info/arm_state`, `/tj/info/robot_state` | 200 Hz | Robot connected |
| `/tj/joint_states` | 100 Hz | Robot connected |
| `/tj/info/gripper_feedback_L/R` and error topics | 200 Hz | DM/ZY Tool running |
| `/tj/recorder/status` | 1 Hz | Recorder running |
| `/tj/playback_status` | 10 Hz | Playback running |
| `/tj/info/robot_info` | 0.2 Hz | Every 5 seconds by default, plus one message at startup |
| `/quad_tile/jpeg/compressed` | Camera configuration | Do not infer the ROS source rate from the frontend 30 FPS limit |

Headset targets, enable states, and gripper commands follow actual UDP packets or an upstream customer program and have no universal fixed rate. Planner, Replay, event-state topics, and static TF should not be evaluated as continuous streams.

Check publisher count before measuring so merged traffic from multiple publishers is not mistaken for a single-node rate:

```bash
source /etc/apex/apex_ros_env.sh

ros2 topic info -v /tj/info/joint_feedback --no-daemon
ros2 topic info -v /tj/joint_states --no-daemon
ros2 topic info -v /tj/info/gripper_feedback_L --no-daemon

ros2 topic hz /tj/info/eef_left
ros2 topic hz /tj/control/qp_controller/joint_cmd_A
ros2 topic hz /tj/control/joint_cmd_A
ros2 topic hz /tj/info/joint_feedback
ros2 topic hz /tj/joint_states
ros2 topic hz /tj/info/gripper_feedback_L
```

For a formal stability test, run the arms, grippers, cameras, and recording concurrently for at least 120 seconds. Record mean Hz, period standard deviation, P95/P99, maximum gap, stream interruptions, publisher count, and CPU load.
