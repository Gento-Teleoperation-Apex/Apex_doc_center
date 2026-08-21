---
title: Marvin Pro 接口
sidebar_position: 4
---

# Marvin Pro 客户二次开发接口

本文列出当前 Marvin Pro 面向客户开放的 ROS 2 Topic、Service、控制源和网络端口，适用于状态读取、数据采集、客户算法接入和故障诊断。

本文对应 Apex Humble `v1.0.7.74o` / Jazzy `v1.0.7.74t`（2026-08-17）及之后采用相同接口契约的版本。目标设备实际安装的软件仍是最终依据。Skye/Luna 的全身关节结构和消息定义不同，请使用 [Gento（Skye/Luna）ROS 2 接口](./gento-interfaces)。

## 1. 命名空间与兼容性

当前 Marvin Pro 的 Robot、Teleop、QP、Planner、VLA、Recorder 和 Playback 默认位于 `tj` 命名空间。源码中的相对名称 `control/joint_cmd_A` 在运行时解析为 `/tj/control/joint_cmd_A`。

```bash
source /etc/apex/apex_ros_env.sh
echo "APEX_ROS_NAMESPACE=${APEX_ROS_NAMESPACE:-tj}"
ros2 topic list | grep '^/tj/' | sort
ros2 service list | grep '^/tj/' | sort
```

:::warning 旧接口不兼容

当前夹爪及核心控制接口已经迁移到 `/tj`。外部程序继续使用旧路径 `/control/...` 或 `/info/...` 时，可能出现 Topic 不存在、夹爪不动或收不到反馈。升级后应逐项修改为本文列出的完整路径。

:::

以下接口保持全局路径，不添加 `/tj`：

- `/hand_left/*`、`/hand_right/*`：Wuji 灵巧手；
- `/quad_tile/jpeg/compressed`：相机拼接 JPEG 图像；
- `/recorder/set_recording`：相机录像控制；
- `/info/apex_package_info`：Apex 软件包版本信息；
- `/tf`、`/tf_static`、`/rosout`、`/parameter_events`：ROS 系统接口。

## 2. 安全要求

- 外部控制前，先在 Apex 前端启动 Robot，并确认机器人 Ready、模式正确且已进入安全初始姿态。
- 出厂打包姿态禁止直接 Home。应先通过 Planner 和 `/tj/control/movej` 将双臂安全移到 14 关节全零位。
- 客户关节直发前，将 Joint Input 切换为 `Custom/User`（`set_input=3`）。
- 客户末端 IK 输入还需要设置 IK Input（`set_ik_input=2`），并保持 Joint Input 为 `Teleop/QP`（`set_input=1`）。
- 首次测试应清空工作空间、降低动作幅度，并保持急停可触及。
- 客户程序必须持续发送平滑、时间连续且满足关节限制的目标。
- 停止客户程序前，先把对应输入源切回 `Idle`，再停止发布。
- 本文标记为“只读”的 Topic 仅用于订阅、记录和排查，不得由客户程序发布。
- 消息字段以设备中安装的 `marvin_msgs` 为准，接入前使用 `ros2 interface show` 核对。

## 3. 当前控制源

当前版本包含两层输入仲裁，仅发布输入 Topic 不会自动驱动机器人。

### 3.1 IK 输入源

| 编号 | 来源 | 输入 Topic |
|---:|---|---|
| `0` | Idle | 不转发 IK 请求 |
| `1` | VR | `/tj/control/ik_request/vr` |
| `2` | VLA / 客户末端控制 | `/tj/control/ik_request/vla` |

切换 Service：`/tj/control/set_ik_input`。当前来源：`/tj/info/ik_request_mux/active_source`。

### 3.2 Joint 输入源

| 编号 | 来源 | 输入 Topic |
|---:|---|---|
| `0` | Idle | 不转发关节命令 |
| `1` | Teleop / QP | `/tj/control/qp_controller/joint_cmd_A/B` |
| `2` | Planner | `/tj/control/joint_cmd_plan_A/B` |
| `3` | Custom / User | `/tj/control/user/joint_cmd_A/B` |
| `4` | Replay | `/tj/control/replay/joint_cmd_A/B` |

切换 Service：`/tj/control/set_input`。当前来源：`/tj/control/input_mode`。

## 4. 状态与反馈 Topic

Marvin Pro 双臂数据顺序固定为左臂 7 关节在前、右臂 7 关节在后。

| Topic | 类型 | 权限 | 说明 |
|---|---|---|---|
| `/tj/joint_states` | `sensor_msgs/msg/JointState` | 只读 | 标准关节状态，默认约 100 Hz |
| `/tj/info/joint_feedback` | `marvin_msgs/msg/Jointfeedback` | 只读 | 双臂、主体和头部位置/速度/力矩反馈，默认约 200 Hz |
| `/tj/info/arm_state` | `std_msgs/msg/Int16MultiArray` | 只读 | 双臂状态码 |
| `/tj/info/robot_state` | `std_msgs/msg/Int16MultiArray` | 只读 | 控制链使用的整机状态 |
| `/tj/info/robot_info` | `marvin_msgs/msg/RobotInfo` | 只读 | 机器人型号和控制器版本 |
| `/tj/info/eef_left` | `geometry_msgs/msg/PoseStamped` | 只读 | 左末端实际位姿 |
| `/tj/info/eef_right` | `geometry_msgs/msg/PoseStamped` | 只读 | 右末端实际位姿 |
| `/tj/info/wrench_left` | `geometry_msgs/msg/WrenchStamped` | 只读 | 左末端力/力矩反馈 |
| `/tj/info/wrench_right` | `geometry_msgs/msg/WrenchStamped` | 只读 | 右末端力/力矩反馈 |
| `/tj/info/vr_connected` | `std_msgs/msg/Bool` | 只读 | 头显链路连接状态 |
| `/tj/info/go_home_status` | `std_msgs/msg/String` | 只读 | Home / Planner 状态 |
| `/info/apex_package_info` | `std_msgs/msg/String` | 只读，全局 | Apex 安装包和版本信息 |

```bash
ros2 topic echo /tj/info/robot_info --once
ros2 topic echo /tj/info/arm_state --once
ros2 topic echo /tj/joint_states --once
ros2 topic hz /tj/info/joint_feedback
```

## 5. 客户控制输入

### 5.1 关节目标

| Topic | 类型 | 说明 |
|---|---|---|
| `/tj/control/user/joint_cmd_A` | `marvin_msgs/msg/JointcmdArm` | 左臂 7 关节目标，单位 rad；需 `set_input=3` |
| `/tj/control/user/joint_cmd_B` | `marvin_msgs/msg/JointcmdArm` | 右臂 7 关节目标，单位 rad；需 `set_input=3` |

### 5.2 末端 IK 目标

| Topic | 类型 | 说明 |
|---|---|---|
| `/tj/control/ik_request/vla` | `marvin_msgs/msg/IKRequest` | 客户/VLA 末端目标；需 `set_ik_input=2` 和 `set_input=1` |

### 5.3 夹爪与可选输入

| Topic | 类型 | 说明 |
|---|---|---|
| `/tj/control/gripperValueL` | `std_msgs/msg/Float32` | 左夹爪目标值 |
| `/tj/control/gripperValueR` | `std_msgs/msg/Float32` | 右夹爪目标值 |
| `/tj/control/footkey` | `std_msgs/msg/Bool` | 可选脚踏/手套门控，仅 `glove_mode=true` 时存在 |

```bash
ros2 interface show marvin_msgs/msg/JointcmdArm
ros2 interface show marvin_msgs/msg/IKRequest
ros2 topic info /tj/control/user/joint_cmd_A -v
ros2 topic info /tj/control/ik_request/vla -v
```

## 6. 机器人控制 Service

| Service | 类型 | 作用 |
|---|---|---|
| `/tj/control/set_ready` | `std_srvs/srv/Trigger` | 机器人进入 Ready 状态 |
| `/tj/control/set_mode` | `marvin_msgs/srv/Int` | 设置机器人模式 |
| `/tj/control/set_drag` | `marvin_msgs/srv/Int` | 设置拖动/示教状态 |
| `/tj/control/set_vel_ratio` | `marvin_msgs/srv/Int` | 设置规划速度比例 |
| `/tj/control/clear_fault` | `std_srvs/srv/Trigger` | 清除故障 |
| `/tj/control/get_motor_err_code` | `marvin_msgs/srv/MotorErrCode` | 获取电机错误码 |
| `/tj/control/set_ik_input` | `marvin_msgs/srv/Int` | 切换 IK 输入源：`0/1/2` |
| `/tj/control/set_input` | `marvin_msgs/srv/Int` | 切换 Joint 输入源：`0/1/2/3/4` |
| `/tj/control/movej` | `marvin_msgs/srv/MoveJ` | 双臂 14 关节点到点规划 |
| `/tj/control/go_home` | `std_srvs/srv/Trigger` | 双臂规划回 Home |
| `/tj/control/reset_grippers` | `std_srvs/srv/Trigger` | 复位/使能 DM 或 ZY 夹爪；Tool 启动后存在 |

切换为客户关节输入：

```bash
ros2 service call /tj/control/set_input marvin_msgs/srv/Int "{data: 3}"
```

切换为客户末端 IK：

```bash
ros2 service call /tj/control/set_ik_input marvin_msgs/srv/Int "{data: 2}"
ros2 service call /tj/control/set_input marvin_msgs/srv/Int "{data: 1}"
```

停止所有关节命令转发：

```bash
ros2 service call /tj/control/set_input marvin_msgs/srv/Int "{data: 0}"
```

## 7. 遥操与控制链只读 Topic

| Topic | 类型 | 说明 |
|---|---|---|
| `/tj/control/target_poseL` | `geometry_msgs/msg/PoseStamped` | VR 左手柄目标位姿 |
| `/tj/control/target_poseR` | `geometry_msgs/msg/PoseStamped` | VR 右手柄目标位姿 |
| `/tj/control/enableL` | `std_msgs/msg/Bool` | 左臂遥操使能 |
| `/tj/control/enableR` | `std_msgs/msg/Bool` | 右臂遥操使能 |
| `/tj/control/vr_joy_L` | `sensor_msgs/msg/Joy` | 左手柄原始输入 |
| `/tj/control/vr_joy_R` | `sensor_msgs/msg/Joy` | 右手柄原始输入 |
| `/tj/control/Elbow_left` | `geometry_msgs/msg/PoseStamped` | 左肘目标/跟踪位姿 |
| `/tj/control/Elbow_right` | `geometry_msgs/msg/PoseStamped` | 右肘目标/跟踪位姿 |
| `/tj/control/eef_cmd_A` | `geometry_msgs/msg/PoseStamped` | 左末端映射目标 |
| `/tj/control/eef_cmd_B` | `geometry_msgs/msg/PoseStamped` | 右末端映射目标 |
| `/tj/control/ik_request/vr` | `marvin_msgs/msg/IKRequest` | VR 来源 IK 请求 |
| `/tj/control/ik_request` | `marvin_msgs/msg/IKRequest` | 仲裁后的 QP IK 输入 |
| `/tj/control/ik_cmd_A` | `marvin_msgs/msg/Jointcmd` | 左臂兼容 IK 调试输出，不是当前主下发链 |
| `/tj/control/ik_cmd_B` | `marvin_msgs/msg/Jointcmd` | 右臂兼容 IK 调试输出，不是当前主下发链 |
| `/tj/info/ik_request_mux/active_source` | `std_msgs/msg/Int32` | 当前 IK 来源 |
| `/tj/control/ik_result` | `marvin_msgs/msg/IKResult` | IK 求解结果 |
| `/tj/joint_state_cmd` | `sensor_msgs/msg/JointState` | QP 全模型关节目标 |
| `/tj/control/qp_controller/joint_cmd_A` | `marvin_msgs/msg/JointcmdArm` | QP 左臂输出 |
| `/tj/control/qp_controller/joint_cmd_B` | `marvin_msgs/msg/JointcmdArm` | QP 右臂输出 |
| `/tj/control/joint_cmd_plan_A` | `marvin_msgs/msg/Jointcmd` | Planner 左臂输出 |
| `/tj/control/joint_cmd_plan_B` | `marvin_msgs/msg/Jointcmd` | Planner 右臂输出 |
| `/tj/control/replay/joint_cmd_A` | `marvin_msgs/msg/JointcmdArm` | Playback 左臂输出 |
| `/tj/control/replay/joint_cmd_B` | `marvin_msgs/msg/JointcmdArm` | Playback 右臂输出 |
| `/tj/control/joint_cmd_A` | `marvin_msgs/msg/JointcmdArm` | 仲裁后的左臂最终命令 |
| `/tj/control/joint_cmd_B` | `marvin_msgs/msg/JointcmdArm` | 仲裁后的右臂最终命令 |
| `/tj/control/input_mode` | `std_msgs/msg/Int32` | 当前 Joint 输入源 |

遥操有输入但机器人不动时，按顺序检查：

```bash
ros2 topic echo /tj/info/vr_connected --once
ros2 topic echo /tj/control/target_poseL --once
ros2 topic echo /tj/control/enableL --once
ros2 topic echo /tj/control/ik_request --once
ros2 topic echo /tj/control/qp_controller/joint_cmd_A --once
ros2 topic echo /tj/control/input_mode --once
ros2 topic echo /tj/control/joint_cmd_A --once
ros2 topic echo /tj/info/arm_state --once
```

## 8. 末端执行器 Topic

### 8.1 DM / ZY 夹爪

| Topic | 类型 | 权限 | 说明 |
|---|---|---|---|
| `/tj/control/gripperValueL` | `std_msgs/msg/Float32` | 客户输入 | 左夹爪目标 |
| `/tj/control/gripperValueR` | `std_msgs/msg/Float32` | 客户输入 | 右夹爪目标 |
| `/tj/info/gripper_feedback_L` | `std_msgs/msg/Float32MultiArray` | 只读 | 左夹爪位置、速度、力矩和温度反馈 |
| `/tj/info/gripper_feedback_R` | `std_msgs/msg/Float32MultiArray` | 只读 | 右夹爪位置、速度、力矩和温度反馈 |
| `/tj/info/gripper_feedback_L_err` | `std_msgs/msg/Int32MultiArray` | 只读 | 左夹爪错误码 |
| `/tj/info/gripper_feedback_R_err` | `std_msgs/msg/Int32MultiArray` | 只读 | 右夹爪错误码 |

反馈数组字段和物理单位应以目标设备安装的 Tool 版本为准。

### 8.2 Wuji 灵巧手（全局）

| Topic | 类型 | 权限 | 说明 |
|---|---|---|---|
| `/hand_left/joint_commands` | `sensor_msgs/msg/JointState` | 客户输入 | 左手控制命令 |
| `/hand_left/joint_states` | `sensor_msgs/msg/JointState` | 只读 | 左手状态 |
| `/hand_right/joint_commands` | `sensor_msgs/msg/JointState` | 客户输入 | 右手控制命令 |
| `/hand_right/joint_states` | `sensor_msgs/msg/JointState` | 只读 | 右手状态 |
| `/hand_left/joint_commands_playback` | `sensor_msgs/msg/JointState` | 只读 | 回放模块左手输出 |
| `/hand_right/joint_commands_playback` | `sensor_msgs/msg/JointState` | 只读 | 回放模块右手输出 |

## 9. 录制、回放与相机接口

| Topic / Service | 类型 | 说明 |
|---|---|---|
| `/tj/recorder/status` | `std_msgs/msg/Int32` | 录制状态 Topic |
| `/tj/recorder/control` | `marvin_msgs/srv/JsonCommand` | 开始、停止、查询和配置录制 |
| `/tj/control/replay/joint_cmd_A/B` | `marvin_msgs/msg/JointcmdArm` | 回放双臂输出，需 `set_input=4` |
| `/tj/control/playback_control` | `std_msgs/msg/String` | 兼容回放控制 Topic |
| `/tj/playback/control` | `marvin_msgs/srv/JsonCommand` | 回放控制主 Service |
| `/tj/playback_status` | `std_msgs/msg/String` | 回放状态 Topic |
| `/tj/playback_key` | `std_msgs/msg/Bool` | 回放按键/状态 Topic |
| `/quad_tile/jpeg/compressed` | `sensor_msgs/msg/CompressedImage` | 全局四宫格 JPEG 图像，当前约 640×360 |
| `/recorder/set_recording` | `marvin_msgs/srv/VideoCapture` | 全局相机视频录制控制 |

录制白名单、回放白名单和 WebSocket 白名单互相独立，详见 [Topic 白名单配置与排查](/advanced/topic-whitelist)。

## 10. 可选 VLA 接口

集成版 `vlahost` 读取 `/tj/info/joint_feedback`、末端位姿、夹爪反馈和 `/quad_tile/jpeg/compressed`，并向客户控制输入 Topic 发布动作。默认还提供：

| 接口 | 作用 |
|---|---|
| `GET /health` | 服务健康检查 |
| `GET /state` | 获取当前观测 |
| `WS /ws/state?rate_hz=30` | 连续接收状态 |
| `GET /stream/quad.mjpg` | 四宫格 MJPEG 流 |
| `POST /action` | 提交一次动作 |
| `WS /ws/action` | 连续提交动作 |

默认端口为 TCP `8000`。关节动作发布到 `/tj/control/user/joint_cmd_A/B`；末端动作发布到 `/tj/control/ik_request/vla`；夹爪动作发布到 `/tj/control/gripperValueL/R`。

## 11. 网络端口

| 端口 | 协议 | 方向 | 作用 |
|---:|---|---|---|
| `9000` | UDP | 头显 → 控制器 | 左侧遥操数据 |
| `9001` | UDP | 头显 → 控制器 | 右侧遥操数据 |
| `9002` | UDP | 控制器 → 头显 | 左末端反馈 |
| `9003` | UDP | 控制器 → 头显 | 右末端反馈 |
| `9004` | UDP | 头显 → 控制器 | 辅助追踪数据 |
| `9010` | TCP | 双向 | 连接、心跳和协议握手 |
| `8888` | UDP | 广播 | 上位机与头显发现 |
| `8000` | TCP | 双向 | 可选 VLA HTTP/WebSocket |

## 12. 最小验证

```bash
source /etc/apex/apex_ros_env.sh

ros2 topic list | grep -E '^/tj/(joint_states|info/joint_feedback|control/joint_cmd_A|control/gripperValueL|info/gripper_feedback_L)$'
ros2 service list | grep -E '^/tj/control/(set_ready|set_input|set_ik_input|reset_grippers)$'
```

Tool 未启动时看不到夹爪反馈和 `reset_grippers` 属正常现象；相机未启动时看不到 `/quad_tile/jpeg/compressed` 也属正常现象。完整速查表参见 [Marvin Pro ROS Topic 列表](/advanced/ros-topic-list)。
