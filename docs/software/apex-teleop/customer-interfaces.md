---
title: Marvin Pro 接口
sidebar_position: 4
---

# Marvin Pro 客户二次开发接口

本页列出 Marvin Pro 面向客户开放的 ROS 2 状态接口和外部控制入口。接口用于状态读取、数据采集和客户算法接入，不包含产品内部控制链路。

Skye/Luna 的全身关节结构和消息定义不同，请使用 [Gento（Skye/Luna）ROS 2 接口](./gento-interfaces)。

## 安全要求

- 外部控制前，先在 Apex Teleop 中完成 **Start Robot → Impedance Mode → Home**。
- 将 **Input Mode** 切换为 **Custom** 后，机器人会接收客户程序的控制输入。
- 首次测试应降低动作幅度和发送速度，并保持急停可触及。
- 控制程序停止前，应先将输入模式切回 **None**。
- 消息类型和字段以设备中安装的 `marvin_msgs` 为准，可用 `ros2 interface show` 查询。

## 状态读取

| Topic | 类型 | 说明 |
|---|---|---|
| `/joint_states` | `sensor_msgs/msg/JointState` | 双臂关节位置、速度和力矩状态 |
| `/info/arm_state` | `std_msgs/msg/Int16MultiArray` | 左右机械臂运行状态 |
| `/info/robot_info` | `marvin_msgs/msg/RobotInfo` | 机器人型号和控制器信息 |
| `/info/eef_left` | `geometry_msgs/msg/PoseStamped` | 左臂末端位姿 |
| `/info/eef_right` | `geometry_msgs/msg/PoseStamped` | 右臂末端位姿 |
| `/info/gripper_feedback_L` | `std_msgs/msg/Float32MultiArray` | 左夹爪反馈，未配置夹爪时可能不存在 |
| `/info/gripper_feedback_R` | `std_msgs/msg/Float32MultiArray` | 右夹爪反馈，未配置夹爪时可能不存在 |
| `/quad_tile/compressed` | `sensor_msgs/msg/CompressedImage` | 四宫格相机压缩图像，Camera 未启动时不存在 |

## Custom 控制输入

| Topic | 类型 | 说明 |
|---|---|---|
| `/control/user/joint_cmd_A` | `marvin_msgs/msg/JointcmdArm` | 左臂 7 关节目标，单位为 rad |
| `/control/user/joint_cmd_B` | `marvin_msgs/msg/JointcmdArm` | 右臂 7 关节目标，单位为 rad |
| `/control/gripperValueL` | `std_msgs/msg/Float32` | 左夹爪开合指令，适用于已配置夹爪 |
| `/control/gripperValueR` | `std_msgs/msg/Float32` | 右夹爪开合指令，适用于已配置夹爪 |

先确认消息定义：

```bash
ros2 interface show marvin_msgs/msg/JointcmdArm
```

确认接口存在：

```bash
ros2 topic info /control/user/joint_cmd_A -v
ros2 topic info /control/user/joint_cmd_B -v
```

客户程序应持续发布平滑、时间连续且满足机器人关节限制的目标。不要直接向产品内部的最终控制 topic 发布数据。

## 调试建议

```bash
ros2 topic echo /info/arm_state --once
ros2 topic echo /joint_states --once
ros2 topic hz /control/user/joint_cmd_A
```

当 Custom 输入没有产生运动时，依次确认：Robot 已运行、机器人已 Ready、当前为 Impedance Mode、已执行 Home、Input Mode 为 Custom、消息类型与关节顺序正确。

VLA 页面仅用于能力和流程展示。需要复现完整 VLA 方案时，请联系 KernelMind VLA 研发团队获取与设备版本配套的支持。
