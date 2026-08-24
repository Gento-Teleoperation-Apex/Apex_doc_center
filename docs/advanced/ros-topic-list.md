---
title: Marvin Pro ROS Topic 列表
sidebar_position: 3
---

# Marvin Pro ROS Topic 列表

本文是当前 Marvin Pro 客户可见 ROS 2 Topic 的集中速查表，对应 Apex Humble `v1.0.7.74o` / Jazzy `v1.0.7.74t`（2026-08-17）及之后采用相同接口契约的版本。详细的控制源、安全要求和 Service 用法参见 [Marvin Pro 客户二次开发接口](/software/apex-teleop/customer-interfaces)。

:::warning 使用边界

- **客户输入**：可由客户程序发布，但必须满足对应模式、仲裁源和安全要求。
- **只读**：只允许订阅、记录和诊断，不应由客户程序发布。
- **可选**：只在对应 Tool、Camera、Recorder、Playback、VLA 或手套模块启动后出现。
- 目标设备中 `ros2 topic list -t` 的结果始终优先于本文。

:::

## 1. 命名空间

Marvin Pro 核心接口默认使用 `/tj`。旧路径 `/control/...`、`/info/...` 和 `/joint_states` 不等价于当前 `/tj/...` 接口。

```bash
source /etc/apex/apex_ros_env.sh
ros2 topic list -t | grep -E '^/tj/|^/hand_|^/quad_tile/|^/info/apex_package_info' | sort
```

## 2. 机器人状态与反馈

| Topic | 类型 | 权限 | 说明 |
|---|---|---|---|
| `/tj/joint_states` | `sensor_msgs/msg/JointState` | 只读 | 标准关节状态 |
| `/tj/info/joint_feedback` | `marvin_msgs/msg/Jointfeedback` | 只读 | 高频关节位置、速度和力矩反馈 |
| `/tj/info/arm_state` | `std_msgs/msg/Int16MultiArray` | 只读 | 双臂状态码 |
| `/tj/info/robot_state` | `std_msgs/msg/Int16MultiArray` | 只读 | 整机控制状态 |
| `/tj/info/robot_info` | `marvin_msgs/msg/RobotInfo` | 只读 | 机器人型号和控制器版本 |
| `/tj/info/eef_left` | `geometry_msgs/msg/PoseStamped` | 只读 | 左末端实际位姿 |
| `/tj/info/eef_right` | `geometry_msgs/msg/PoseStamped` | 只读 | 右末端实际位姿 |
| `/tj/info/wrench_left` | `geometry_msgs/msg/WrenchStamped` | 只读 | 左末端力/力矩 |
| `/tj/info/wrench_right` | `geometry_msgs/msg/WrenchStamped` | 只读 | 右末端力/力矩 |
| `/tj/info/go_home_status` | `std_msgs/msg/String` | 只读 | Planner / Home 状态 |
| `/info/apex_package_info` | `std_msgs/msg/String` | 只读，全局 | Apex 软件包版本信息 |

## 3. 头显与遥操输入

| Topic | 类型 | 权限 | 说明 |
|---|---|---|---|
| `/tj/control/target_poseL` | `geometry_msgs/msg/PoseStamped` | 只读 | VR 左手目标位姿 |
| `/tj/control/target_poseR` | `geometry_msgs/msg/PoseStamped` | 只读 | VR 右手目标位姿 |
| `/tj/control/enableL` | `std_msgs/msg/Bool` | 只读 | 左臂遥操使能 |
| `/tj/control/enableR` | `std_msgs/msg/Bool` | 只读 | 右臂遥操使能 |
| `/tj/control/vr_joy_L` | `sensor_msgs/msg/Joy` | 只读 | 左手柄摇杆和按键 |
| `/tj/control/vr_joy_R` | `sensor_msgs/msg/Joy` | 只读 | 右手柄摇杆和按键 |
| `/tj/control/Elbow_left` | `geometry_msgs/msg/PoseStamped` | 只读 | 左肘目标/跟踪位姿 |
| `/tj/control/Elbow_right` | `geometry_msgs/msg/PoseStamped` | 只读 | 右肘目标/跟踪位姿 |
| `/tj/info/vr_connected` | `std_msgs/msg/Bool` | 只读 | 头显链路连接状态 |
| `/tj/control/footkey` | `std_msgs/msg/Bool` | 客户输入，可选 | 手套模式脚踏门控 |

## 4. 客户控制输入

| Topic | 类型 | 权限 | 启用条件 |
|---|---|---|---|
| `/tj/control/user/joint_cmd_A` | `marvin_msgs/msg/JointcmdArm` | 客户输入 | Joint Input = `3` |
| `/tj/control/user/joint_cmd_B` | `marvin_msgs/msg/JointcmdArm` | 客户输入 | Joint Input = `3` |
| `/tj/control/ik_request/vla` | `marvin_msgs/msg/IKRequest` | 客户输入 | IK Input = `2`，Joint Input = `1` |
| `/tj/control/gripperValueL` | `std_msgs/msg/Float32` | 客户输入 | 左 Tool 已启动 |
| `/tj/control/gripperValueR` | `std_msgs/msg/Float32` | 客户输入 | 右 Tool 已启动 |

## 5. Teleop、IK 与 QP 链路

| Topic | 类型 | 权限 | 说明 |
|---|---|---|---|
| `/tj/control/eef_cmd_A` | `geometry_msgs/msg/PoseStamped` | 只读 | 映射后的左末端目标 |
| `/tj/control/eef_cmd_B` | `geometry_msgs/msg/PoseStamped` | 只读 | 映射后的右末端目标 |
| `/tj/control/ik_request/vr` | `marvin_msgs/msg/IKRequest` | 只读 | VR 来源 IK 请求 |
| `/tj/control/ik_request` | `marvin_msgs/msg/IKRequest` | 只读 | 仲裁后的 QP IK 请求 |
| `/tj/control/ik_cmd_A` | `marvin_msgs/msg/Jointcmd` | 只读 | 左臂兼容 IK 调试输出，不是当前主控制链 |
| `/tj/control/ik_cmd_B` | `marvin_msgs/msg/Jointcmd` | 只读 | 右臂兼容 IK 调试输出，不是当前主控制链 |
| `/tj/info/ik_request_mux/active_source` | `std_msgs/msg/Int32` | 只读 | IK 来源：`0=idle, 1=VR, 2=VLA` |
| `/tj/control/ik_result` | `marvin_msgs/msg/IKResult` | 只读 | IK 求解结果 |
| `/tj/joint_state_cmd` | `sensor_msgs/msg/JointState` | 只读 | QP 全模型关节目标 |
| `/tj/control/qp_controller/joint_cmd_A` | `marvin_msgs/msg/JointcmdArm` | 只读 | QP 左臂输出 |
| `/tj/control/qp_controller/joint_cmd_B` | `marvin_msgs/msg/JointcmdArm` | 只读 | QP 右臂输出 |

## 6. Planner、回放与最终命令

| Topic | 类型 | 权限 | 说明 |
|---|---|---|---|
| `/tj/control/joint_cmd_plan_A` | `marvin_msgs/msg/Jointcmd` | 只读 | Planner 左臂输出 |
| `/tj/control/joint_cmd_plan_B` | `marvin_msgs/msg/Jointcmd` | 只读 | Planner 右臂输出 |
| `/tj/control/replay/joint_cmd_A` | `marvin_msgs/msg/JointcmdArm` | 只读 | Playback 左臂输出 |
| `/tj/control/replay/joint_cmd_B` | `marvin_msgs/msg/JointcmdArm` | 只读 | Playback 右臂输出 |
| `/tj/control/joint_cmd_A` | `marvin_msgs/msg/JointcmdArm` | 只读 | 仲裁后的左臂最终命令 |
| `/tj/control/joint_cmd_B` | `marvin_msgs/msg/JointcmdArm` | 只读 | 仲裁后的右臂最终命令 |
| `/tj/control/input_mode` | `std_msgs/msg/Int32` | 只读 | Joint 来源：`0=idle, 1=teleop, 2=planner, 3=user, 4=replay` |

## 7. DM / ZY 夹爪

| Topic | 类型 | 权限 | 说明 |
|---|---|---|---|
| `/tj/control/gripperValueL` | `std_msgs/msg/Float32` | 客户输入，可选 | 左夹爪目标 |
| `/tj/control/gripperValueR` | `std_msgs/msg/Float32` | 客户输入，可选 | 右夹爪目标 |
| `/tj/info/gripper_feedback_L` | `std_msgs/msg/Float32MultiArray` | 只读，可选 | 左夹爪状态反馈 |
| `/tj/info/gripper_feedback_R` | `std_msgs/msg/Float32MultiArray` | 只读，可选 | 右夹爪状态反馈 |
| `/tj/info/gripper_feedback_L_err` | `std_msgs/msg/Int32MultiArray` | 只读，可选 | 左夹爪错误码 |
| `/tj/info/gripper_feedback_R_err` | `std_msgs/msg/Int32MultiArray` | 只读，可选 | 右夹爪错误码 |

## 8. Wuji 灵巧手

Wuji Topic 保持全局路径，不添加 `/tj`。

| Topic | 类型 | 权限 | 说明 |
|---|---|---|---|
| `/hand_left/joint_commands` | `sensor_msgs/msg/JointState` | 客户输入，可选 | 左手控制命令 |
| `/hand_left/joint_states` | `sensor_msgs/msg/JointState` | 只读，可选 | 左手状态 |
| `/hand_right/joint_commands` | `sensor_msgs/msg/JointState` | 客户输入，可选 | 右手控制命令 |
| `/hand_right/joint_states` | `sensor_msgs/msg/JointState` | 只读，可选 | 右手状态 |
| `/hand_left/joint_commands_playback` | `sensor_msgs/msg/JointState` | 只读，可选 | 回放左手命令 |
| `/hand_right/joint_commands_playback` | `sensor_msgs/msg/JointState` | 只读，可选 | 回放右手命令 |

## 9. Recorder、Playback 与相机

| Topic | 类型 | 权限 | 说明 |
|---|---|---|---|
| `/tj/recorder/status` | `std_msgs/msg/Int32` | 只读，可选 | 录制状态 |
| `/tj/control/playback_control` | `std_msgs/msg/String` | 兼容输入，可选 | JSON 回放控制；优先使用 Service |
| `/tj/playback_status` | `std_msgs/msg/String` | 只读，可选 | 回放状态 |
| `/tj/playback_key` | `std_msgs/msg/Bool` | 只读，可选 | 回放按键/状态 |
| `/quad_tile/jpeg/compressed` | `sensor_msgs/msg/CompressedImage` | 只读，可选，全局 | 四宫格 JPEG 图像 |

## 10. ROS 系统 Topic

| Topic | 类型 | 权限 | 说明 |
|---|---|---|---|
| `/tf` | `tf2_msgs/msg/TFMessage` | 只读 | 动态坐标变换 |
| `/tf_static` | `tf2_msgs/msg/TFMessage` | 只读 | 静态坐标变换 |
| `/rosout` | `rcl_interfaces/msg/Log` | 只读 | ROS 日志 |
| `/parameter_events` | `rcl_interfaces/msg/ParameterEvent` | 只读 | 参数变更事件 |

## 11. 快速核对

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

Topic 只在对应模块启动后出现。列表存在但没有消息时，应继续检查 Publisher、QoS、`ROS_DOMAIN_ID`、`APEX_ROS_NAMESPACE` 和模块运行状态。

## 12. Topic 频率参考

下表是当前 Marvin Pro 源码与默认参数中的设计值。定时器、SDK/CAN 控制循环、ROS Topic 和前端 WebSocket 的频率不是同一个概念；这些数值也不是 Linux、DDS 和网络环境下的硬实时承诺。

| Topic / 链路 | 设计或预期频率 | 生效条件 |
|---|---:|---|
| `/tj/info/eef_left/right` | 1000 Hz | Teleop 正常运行；实际值受计算负载影响 |
| `/tj/control/ik_request/vr` | 1000 Hz | Teleop 正常运行且 VR 来源有效 |
| `/tj/control/qp_controller/joint_cmd_A/B` | 最高 500 Hz | Robot Ready、目标有效、QP 正常 |
| `/tj/control/joint_cmd_A/B` | Teleop 时通常 500 Hz | Joint 来源为 Teleop；该 Topic 跟随当前来源 |
| `/tj/info/joint_feedback` | 200 Hz | Robot 与 MarvinSDK 正常连接 |
| `/tj/info/arm_state`、`/tj/info/robot_state` | 200 Hz | Robot 正常连接 |
| `/tj/joint_states` | 100 Hz | Robot 正常连接 |
| `/tj/info/gripper_feedback_L/R` 及错误码 | 200 Hz | DM/ZY Tool 正常运行 |
| `/tj/recorder/status` | 1 Hz | Recorder 已启动 |
| `/tj/playback_status` | 10 Hz | Playback 已启动 |
| `/tj/info/robot_info` | 0.2 Hz | 默认每 5 秒发布，启动时立即发布一次 |
| `/quad_tile/jpeg/compressed` | 相机配置决定 | 不应按前端 30 FPS 限速反推 ROS 原始频率 |

头显目标、使能和夹爪控制 Topic 跟随实际 UDP 数据包或上游客户程序，不具有统一固定频率。Planner、Replay、事件状态和静态 TF 也不应套用持续发布频率。

现场测量前先确认发布者数量，避免把多个发布者的合并流量误判为单节点频率：

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

正式稳定性测试建议在机械臂、夹爪、相机和录包同时运行时持续至少 120 秒，并记录平均 Hz、周期标准差、P95/P99、最大间隔、断流次数、Publisher 数量和 CPU 负载。
