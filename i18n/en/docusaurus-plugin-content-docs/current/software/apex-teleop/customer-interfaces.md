---
title: Marvin Pro Interfaces
sidebar_position: 4
---

# Marvin Pro Customer Integration Interfaces

This page lists Marvin Pro customer-facing ROS 2 state topics and external command inputs. It intentionally excludes internal control-chain interfaces.

Skye/Luna has a different whole-body joint layout and message structure. See [Gento (Skye/Luna) ROS 2 Interfaces](./gento-interfaces).

## Safety requirements

- In Apex Teleop, complete **Start Robot → Impedance Mode → Home** before sending external commands.
- Set **Input Mode** to **Custom** to accept customer application commands.
- Use small motions and conservative rates during initial testing, with the emergency stop within reach.
- Switch Input Mode back to **None** before stopping the command process.
- Message fields are defined by the installed `marvin_msgs` package. Inspect them with `ros2 interface show`.

## State topics

| Topic | Type | Description |
|---|---|---|
| `/joint_states` | `sensor_msgs/msg/JointState` | Dual-arm joint positions, velocities, and efforts |
| `/info/arm_state` | `std_msgs/msg/Int16MultiArray` | Left and right arm runtime state |
| `/info/robot_info` | `marvin_msgs/msg/RobotInfo` | Robot model and controller information |
| `/info/eef_left` | `geometry_msgs/msg/PoseStamped` | Left end-effector pose |
| `/info/eef_right` | `geometry_msgs/msg/PoseStamped` | Right end-effector pose |
| `/info/gripper_feedback_L` | `std_msgs/msg/Float32MultiArray` | Left gripper feedback when configured |
| `/info/gripper_feedback_R` | `std_msgs/msg/Float32MultiArray` | Right gripper feedback when configured |
| `/quad_tile/compressed` | `sensor_msgs/msg/CompressedImage` | Four-tile compressed camera image when Camera is running |

## Custom command inputs

| Topic | Type | Description |
|---|---|---|
| `/control/user/joint_cmd_A` | `marvin_msgs/msg/JointcmdArm` | Left-arm seven-joint target in radians |
| `/control/user/joint_cmd_B` | `marvin_msgs/msg/JointcmdArm` | Right-arm seven-joint target in radians |
| `/control/gripperValueL` | `std_msgs/msg/Float32` | Left gripper command when configured |
| `/control/gripperValueR` | `std_msgs/msg/Float32` | Right gripper command when configured |

Inspect the installed message definition:

```bash
ros2 interface show marvin_msgs/msg/JointcmdArm
```

Verify that the input topics are available:

```bash
ros2 topic info /control/user/joint_cmd_A -v
ros2 topic info /control/user/joint_cmd_B -v
```

Publish smooth, time-continuous targets that stay within robot joint limits. Do not publish directly to internal final-command topics.

## Diagnostics

```bash
ros2 topic echo /info/arm_state --once
ros2 topic echo /joint_states --once
ros2 topic hz /control/user/joint_cmd_A
```

If Custom input produces no motion, verify that Robot is running, the robot is Ready, Impedance Mode is active, Home has completed, Input Mode is Custom, and the message type and joint order are correct.

The VLA section demonstrates capabilities and workflow only. Contact the KernelMind VLA team for a reproducible solution matched to your device release.
