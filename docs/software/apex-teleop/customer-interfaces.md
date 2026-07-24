---
title: Marvin Pro 接口
sidebar_position: 4
---

# Marvin Pro 客户二次开发接口

本页列出当前 Marvin Pro 面向客户开放的 ROS 2 Topic、Service、控制源和网络端口，适用于状态读取、数据采集、客户算法接入与故障诊断。Skye/Luna 的全身关节结构和消息定义不同，请使用 [Gento（Skye/Luna）ROS 2 接口](./gento-interfaces)。

接口以目标设备实际安装的软件为准。开始开发前，应在控制器上加载运行环境并核对接口：

```bash
source /etc/apex/apex_ros_env.sh
ros2 topic list
ros2 service list
ros2 interface list | grep marvin_msgs
```

## 1. 安全要求

- 外部控制前，优先在 Apex 前端完成 **Start Robot → Impedance Mode → Home**。
- 将 **Input Mode** 切换为 **Custom** 后，机器人会接收客户程序的关节指令。
- 首次测试应清空工作空间、降低动作幅度，并保持急停可触及。
- 客户程序必须持续发送平滑、时间连续且满足关节限制的目标。
- 停止客户程序前，先将输入模式切回 **None**，再停止指令发布。
- 不要向本文标记为“只读诊断”的 QP 输出、规划输出或最终控制 Topic 发布数据。
- 消息字段以设备中安装的 `marvin_msgs` 为准，使用 `ros2 interface show` 核对后再编写程序。

## 2. 关节顺序与运行状态

Marvin Pro 双臂数据固定为左臂 7 关节在前、右臂 7 关节在后：

```text
Joint1_L ... Joint7_L, Joint1_R ... Joint7_R
```

`/info/arm_state` 和 `/info/robot_state` 均用于表示双臂状态。当前基线中，两臂状态均为 `2` 时，QP 控制链认为机器人可运动；设备版本不同时应以实际状态定义为准。

## 3. 状态与反馈 Topic

| Topic | 类型 | 说明 |
|---|---|---|
| `/joint_states` | `sensor_msgs/msg/JointState` | 双臂 14 关节位置、速度和力矩，适合可视化、录制和低频状态读取 |
| `/info/joint_feedback` | `marvin_msgs/msg/Jointfeedback` | 双臂高频关节反馈，供低延迟算法读取 |
| `/info/arm_state` | `std_msgs/msg/Int16MultiArray` | `[stateA, stateB]`；机器人未 Ready 时可能为 `-1` |
| `/info/robot_state` | `std_msgs/msg/Int16MultiArray` | 控制链使用的双臂可运动状态 |
| `/info/robot_info` | `marvin_msgs/msg/RobotInfo` | 机器人型号、控制器和版本信息 |
| `/info/eef_left` | `geometry_msgs/msg/PoseStamped` | 左臂末端正解位姿 |
| `/info/eef_right` | `geometry_msgs/msg/PoseStamped` | 右臂末端正解位姿 |
| `/info/wrench_left` | `geometry_msgs/msg/WrenchStamped` | 左臂末端估计力 |
| `/info/wrench_right` | `geometry_msgs/msg/WrenchStamped` | 右臂末端估计力 |
| `/info/vr_connected` | `std_msgs/msg/Bool` | 头显 TCP 心跳和连接状态 |
| `/info/apex_package_info` | `std_msgs/msg/String` | 控制端安装包版本和安装状态 |
| `/info/gripper_feedback_L` | `std_msgs/msg/Float32MultiArray` | 左夹爪反馈；未安装对应 Tool 包时可能不存在 |
| `/info/gripper_feedback_R` | `std_msgs/msg/Float32MultiArray` | 右夹爪反馈；未安装对应 Tool 包时可能不存在 |
| `/quad_tile/compressed` | `sensor_msgs/msg/CompressedImage` | 四宫格相机压缩图像；Camera 未启动时不存在 |

常用检查：

```bash
ros2 topic echo /info/robot_info --once
ros2 topic echo /info/arm_state --once
ros2 topic echo /joint_states --once
ros2 topic hz /info/joint_feedback
```

## 4. 控制源与 Input Mode

`/control/set_input` 用于选择当前关节指令来源，`/control/input_mode` 发布当前选择结果。

| 编号 | 前端含义 | 指令来源 |
|---:|---|---|
| `0` | None / Idle | 不接受外部运动指令 |
| `1` | Teleop | 遥操 QP 输出 `/control/qp_controller/joint_cmd_A/B` |
| `2` | Planner | Home、MoveJ 等规划输出 `/control/joint_cmd_plan_A/B` |
| `3` | Custom / User | 客户输入 `/control/user/joint_cmd_A/B` |
| `4` | Replay | 回放输入 `/control/replay/joint_cmd_A/B` |

切换到 Custom：

```bash
ros2 service call /control/set_input marvin_msgs/srv/Int "{data: 3}"
ros2 topic echo /control/input_mode --once
```

退出 Custom：

```bash
ros2 service call /control/set_input marvin_msgs/srv/Int "{data: 0}"
```

正常操作优先使用 Apex 前端切换输入模式。命令行调用适用于二次开发联调。

## 5. Custom 控制输入

| Topic | 类型 | 说明 |
|---|---|---|
| `/control/user/joint_cmd_A` | `marvin_msgs/msg/JointcmdArm` | 左臂 7 关节目标，单位为 rad |
| `/control/user/joint_cmd_B` | `marvin_msgs/msg/JointcmdArm` | 右臂 7 关节目标，单位为 rad |
| `/control/gripperValueL` | `std_msgs/msg/Float32` | 左夹爪开合目标；仅适用于已配置的末端执行器 |
| `/control/gripperValueR` | `std_msgs/msg/Float32` | 右夹爪开合目标；仅适用于已配置的末端执行器 |

先核对消息字段和 Topic 的订阅关系：

```bash
ros2 interface show marvin_msgs/msg/JointcmdArm
ros2 topic info /control/user/joint_cmd_A -v
ros2 topic info /control/user/joint_cmd_B -v
```

客户程序应同时维护左右臂目标时间连续性。最终关节命令过期时，机器人控制链会拒绝旧指令；不要采用低频、间歇式单次发布来驱动连续运动。

## 6. 机器人控制 Service

| Service | 类型 | 作用 |
|---|---|---|
| `/control/set_input` | `marvin_msgs/srv/Int` | 选择 None、Teleop、Planner、Custom 或 Replay 输入 |
| `/control/set_mode` | `marvin_msgs/srv/Int` | `0` Idle、`1` 位置模式、`3` 关节阻抗模式 |
| `/control/set_ready` | `std_srvs/srv/Trigger` | 设置机器人 Ready；Ready 后才允许下发实时关节命令 |
| `/control/set_drag` | `marvin_msgs/srv/Int` | `0` 退出关节拖动，`1` 进入关节拖动 |
| `/control/set_vel_ratio` | `marvin_msgs/srv/Int` | 设置规划速度/加速度比例，支持 `30`、`50`、`80`、`100` |
| `/control/clear_fault` | `std_srvs/srv/Trigger` | 清除控制器或伺服错误 |
| `/control/get_motor_err_code` | `marvin_msgs/srv/MotorErrCode` | 读取双臂 14 个关节的伺服错误码 |
| `/control/go_home` | `std_srvs/srv/Trigger` | 按配置中的 Home 关节值规划回初始位 |
| `/control/movej` | `marvin_msgs/srv/MoveJ` | 执行双臂 14 关节点到点规划 |
| `/control/reset_grippers` | `std_srvs/srv/Trigger` | 复位已配置的 DM/ZY 夹爪；未安装 Tool 包时可能不存在 |

查询实际请求字段：

```bash
ros2 interface show marvin_msgs/srv/Int
ros2 interface show marvin_msgs/srv/MoveJ
ros2 interface show marvin_msgs/srv/MotorErrCode
```

设置 Ready 和阻抗模式的命令如下。常规客户操作仍建议通过 Apex 前端完成：

```bash
ros2 service call /control/set_ready std_srvs/srv/Trigger "{}"
ros2 service call /control/set_mode marvin_msgs/srv/Int "{data: 3}"
```

## 7. 遥操链路诊断 Topic

以下 Topic 用于观察遥操、QP、规划和最终下发链路。除本文明确列出的 Custom/夹爪输入外，客户程序不应向这些 Topic 发布数据。

| Topic | 类型 | 说明 |
|---|---|---|
| `/control/target_poseL` | `geometry_msgs/msg/PoseStamped` | 左手柄映射出的左臂末端目标 |
| `/control/target_poseR` | `geometry_msgs/msg/PoseStamped` | 右手柄映射出的右臂末端目标 |
| `/control/enableL` | `std_msgs/msg/Bool` | 左臂遥操使能状态 |
| `/control/enableR` | `std_msgs/msg/Bool` | 右臂遥操使能状态 |
| `/control/ik_request` | `marvin_msgs/msg/IKRequest` | 末端目标、有效标志和关节种子 |
| `/control/ik_result` | `marvin_msgs/msg/IKResult` | QP 求解结果 |
| `/control/qp_controller/joint_cmd_A` | `marvin_msgs/msg/JointcmdArm` | 遥操 QP 左臂输出，只读诊断 |
| `/control/qp_controller/joint_cmd_B` | `marvin_msgs/msg/JointcmdArm` | 遥操 QP 右臂输出，只读诊断 |
| `/control/joint_cmd_plan_A` | `marvin_msgs/msg/Jointcmd` | Planner 左臂输出，只读诊断 |
| `/control/joint_cmd_plan_B` | `marvin_msgs/msg/Jointcmd` | Planner 右臂输出，只读诊断 |
| `/control/replay/joint_cmd_A` | `marvin_msgs/msg/JointcmdArm` | 回放左臂输出，只读诊断 |
| `/control/replay/joint_cmd_B` | `marvin_msgs/msg/JointcmdArm` | 回放右臂输出，只读诊断 |
| `/control/joint_cmd_A` | `marvin_msgs/msg/JointcmdArm` | 当前选中的左臂最终命令，只读诊断 |
| `/control/joint_cmd_B` | `marvin_msgs/msg/JointcmdArm` | 当前选中的右臂最终命令，只读诊断 |
| `/control/input_mode` | `std_msgs/msg/Int32` | 当前输入源编号 |

遥操有输入但机器人不动时，按顺序检查：

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

## 8. 数据录制与回放接口

| Service | 类型 | 作用 |
|---|---|---|
| `/recorder/control` | `marvin_msgs/srv/JsonCommand` | 录制 `start`、`stop`、`status`、`get_topics` 和 `storage_status` |
| `/playback/control` | `marvin_msgs/srv/JsonCommand` | 回放 `load`、`play`、`pause`、`stop`、`seek` 和 `set_rate` |
| `/recorder/set_recording` | `marvin_msgs/srv/VideoCapture` | 联动开始或停止相机视频落盘 |

使用前查询目标版本的 JSON 和视频请求字段：

```bash
ros2 interface show marvin_msgs/srv/JsonCommand
ros2 interface show marvin_msgs/srv/VideoCapture
```

当前录制内容重点包括：

| Topic | 用途 |
|---|---|
| `/joint_states` | 双臂运动和回放核心数据 |
| `/info/eef_left`、`/info/eef_right` | 双臂末端位姿 |
| `/control/joint_cmd_A`、`/control/joint_cmd_B` | 双臂最终控制命令 |
| `/info/gripper_feedback_L`、`/info/gripper_feedback_R` | 夹爪反馈 |
| `/hand_left/joint_commands`、`/hand_right/joint_commands` | 灵巧手/手套命令，配置后存在 |
| `/hand_left/joint_states`、`/hand_right/joint_states` | 灵巧手状态，配置后存在 |

录制数据默认保存在卷标为 `BAG_STORAGE` 的 U 盘：

```text
/media/<user>/BAG_STORAGE/recorded_bags
```

## 9. 相机接口

| Topic / Service | 类型 | 作用 |
|---|---|---|
| `/quad_tile/compressed` | `sensor_msgs/msg/CompressedImage` | 四路相机拼接后的压缩图像，供预览、录制和客户算法读取 |
| `/recorder/set_recording` | `marvin_msgs/srv/VideoCapture` | 控制相机视频开始或停止落盘 |

```bash
ros2 topic info /quad_tile/compressed -v
ros2 topic hz /quad_tile/compressed
```

## 10. 网络端口

现场防火墙或跨网段部署时，应允许下列头显遥操端口：

| 端口 | 协议 | 方向 | 作用 |
|---:|---|---|---|
| `9000` | UDP | 头显 → 控制器 | 左侧遥操位姿与按键数据 |
| `9001` | UDP | 头显 → 控制器 | 右侧遥操位姿与按键数据 |
| `9002` | UDP | 控制器 → 头显 | 左臂末端反馈 |
| `9003` | UDP | 控制器 → 头显 | 右臂末端反馈 |
| `9004` | UDP | 头显 → 控制器 | 辅助追踪数据 |
| `9010` | TCP | 双向 | 头显连接、心跳和协议握手 |
| `8888` | UDP | 广播/发现 | 上位机与头显设备发现 |

目标版本启用 TCP 门控时，只有 UDP 数据到达并不代表遥操链路已经建立，还应检查 `/info/vr_connected`。

## 11. Custom 输入排查

```bash
ros2 topic echo /info/robot_info --once
ros2 topic echo /info/robot_state --once
ros2 topic echo /control/input_mode --once
ros2 topic info /control/user/joint_cmd_A -v
ros2 topic info /control/user/joint_cmd_B -v
ros2 topic hz /control/user/joint_cmd_A
ros2 topic hz /control/user/joint_cmd_B
```

当 Custom 输入没有产生运动时，依次确认：

1. Robot 模块已运行，URDF 与实体姿态一致。
2. 机器人已 Ready，并处于 Impedance Mode。
3. 已执行 Home，实体机器人没有报警。
4. `/control/input_mode` 为 `3`。
5. `JointcmdArm` 字段、左右臂顺序、时间戳和单位正确。
6. 客户程序持续发布，不存在长时间断流。

VLA 页面仅用于能力和流程展示。需要复现完整 VLA 方案时，请联系 KernelMind VLA 研发团队获取与设备版本配套的支持。
