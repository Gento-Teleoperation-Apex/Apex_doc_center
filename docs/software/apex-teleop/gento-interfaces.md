---
title: Gento（Skye/Luna）ROS 2 接口
sidebar_position: 5
---

# Gento（Skye/Luna）ROS 2 接口

本章面向需要读取 Gento 状态、采集遥操数据或通过 `Custom` 模式接入自有算法的客户。接口按 2026-08-21 最新 Gento 源码契约整理。

| 项目 | 说明 |
|---|---|
| 适用产品 | Gento Skye、Gento Luna |
| 接口基线 | 2026-08-21 Gento 源码 |
| 参考环境 | Ubuntu 22.04、ROS 2 Humble |
| 默认命名空间 | `/tj` |

不同交付版本、末端配置和启动模块会影响可见接口。最终应以目标设备执行 `ros2 topic list -t`、`ros2 service list -t` 和 `ros2 interface show` 的结果为准。

## 1. 加载 ROS 2 环境

优先使用设备提供的统一环境文件：

```bash
source /etc/apex/apex_ros_env.sh
ros2 topic list -t | sort
ros2 service list -t | sort
```

如果统一环境文件不存在：

```bash
source /opt/ros/humble/setup.bash
source /opt/kernelmind/apex/install/setup.bash
ros2 topic list -t | sort
```

保存现场接口清单：

```bash
mkdir -p ~/gento_ros_check
ros2 topic list -t | sort | tee ~/gento_ros_check/topic_list.txt
ros2 node list | sort | tee ~/gento_ros_check/node_list.txt
ros2 service list -t | sort | tee ~/gento_ros_check/service_list.txt
```

Topic 未出现时，先确认对应的 Robot、Teleop、Camera 或 Tool 模块已经启动，并检查 `ROS_DOMAIN_ID` 是否一致。

### 1.1 命名空间规则

Gento Robot、Teleop、QP 和两级输入仲裁节点默认读取 `APEX_ROS_NAMESPACE=tj`，因此核心接口通常以 `/tj` 开头。例如源码相对名 `info/joint_feedback` 在运行时解析为 `/tj/info/joint_feedback`。

以下接口通常保持在根命名空间：

- `/hand_left/*`、`/hand_right/*`：Wuji 灵巧手；
- `/controller/odom`、`/move/*`、`/control/base_*`、`/info/base_*`：独立移动底盘节点；
- `/quad_tile/*`、`/recorder/set_recording`：独立相机包；
- `/tf`、`/tf_static`、`/rosout`：ROS 系统接口。

如果底盘节点被上层 Launch 放入 `/tj`，现场也可能出现 `/tj/info/base_*`。不要仅凭文档猜测路径，应同时搜索根路径和 `/tj` 路径。

## 2. Skye 与 Luna 的关节差异

| 项目 | Skye | Luna |
|---|---|---|
| `robot_type` | `Gento_Skye` | `Gento_Luna` |
| 左臂 | 7 关节 | 7 关节 |
| 右臂 | 7 关节 | 7 关节 |
| BODY | LIFT 1 + BODY 2 | BODY 6 |
| HEAD | 2 关节 | 2 关节 |
| QP 默认频率 | 250 Hz | 500 Hz |
| Controller UDP TCP 门控 | 默认关闭 | 默认开启，需建立 TCP 9010 会话 |

先确认机型：

```bash
ros2 topic echo /tj/info/robot_info --once
```

Skye 与 Luna 使用相同的 BODY Topic 名，但数组含义不同：

- **Skye**：`positions[0]` 为 LIFT，`positions[1:3]` 为两个 BODY 关节，其余位置不作为当前机型有效关节。
- **Luna**：`positions[0:6]` 对应六个 BODY 关节。
- `JointcmdHead.positions` 定义长度为 3，但当前两种机型只使用前两个 HEAD 关节值。

客户程序必须先根据 `/tj/info/robot_info` 判断机型，不能在 Skye 与 Luna 之间直接复用 BODY 数组。

## 3. 机器人状态 Topic

启动 Robot 模块后，可读取：

| Topic | 消息类型 | 频率 / 发布方式 | 说明 |
|---|---|---|---|
| `/tj/joint_states` | `sensor_msgs/msg/JointState` | 通常约 100 Hz | ROS 标准整机关节名称、位置、速度和力矩 |
| `/tj/info/joint_feedback` | `marvin_msgs/msg/Jointfeedback` | SDK 返回驱动，目标约 500 Hz | Gento 整机实时关节反馈，实际频率以现场测量为准 |
| `/tj/info/robot_state` | `std_msgs/msg/Int16MultiArray` | 通常约 100 Hz | ARM、HEAD、BODY、LIFT 当前控制状态 |
| `/tj/info/robot_info` | `marvin_msgs/msg/RobotInfo` | 启动时立即发布，之后约 0.2 Hz | 机器人型号和控制器版本 |
| `/tj/info/imu0` | `sensor_msgs/msg/Imu` | 跟随关节反馈 | 主体 IMU 数据 |

```bash
ros2 topic echo /tj/info/robot_info --once
ros2 topic echo /tj/info/robot_state --once
ros2 topic echo /tj/info/joint_feedback --once
ros2 topic echo /tj/joint_states --once
```

`Jointfeedback` 的双臂顺序固定为左臂 7 关节在前、右臂 7 关节在后。BODY 有效范围按上一节区分机型。

> 当前版本虽然创建了 `/tj/info/robot_cmd_state` Publisher，但源码中没有实际发布，不应作为客户可用接口。

## 4. 头显与遥操数据 Topic

启动 Teleop 模块后，可观察：

| Topic | 消息类型 | 频率 / 发布方式 | 说明 |
|---|---|---|---|
| `/tj/control/target_poseL` | `geometry_msgs/msg/PoseStamped` | 跟随头显输入 | 左手柄映射后的左臂末端目标 |
| `/tj/control/target_poseR` | `geometry_msgs/msg/PoseStamped` | 跟随头显输入 | 右手柄映射后的右臂末端目标 |
| `/tj/control/enableL` | `std_msgs/msg/Bool` | 跟随头显输入；手套模式约 10 Hz | 左臂遥操使能 |
| `/tj/control/enableR` | `std_msgs/msg/Bool` | 跟随头显输入；手套模式约 10 Hz | 右臂遥操使能 |
| `/tj/control/vr_joy_L` | `sensor_msgs/msg/Joy` | 跟随头显输入 | 左手柄按键和摇杆 |
| `/tj/control/vr_joy_R` | `sensor_msgs/msg/Joy` | 跟随头显输入 | 右手柄按键和摇杆 |
| `/tj/control/vr_body` | `marvin_msgs/msg/VrBody` | 跟随头显输入 | 躯干、头、肘、腿等全身追踪数据 |
| `/tj/info/vr_connected` | `std_msgs/msg/Bool` | 1 Hz | 头显连接状态 |
| `/tj/info/eef_left` | `geometry_msgs/msg/PoseStamped` | 目标 1000 Hz | 左臂当前末端位姿，实际频率受系统负载影响 |
| `/tj/info/eef_right` | `geometry_msgs/msg/PoseStamped` | 目标 1000 Hz | 右臂当前末端位姿，实际频率受系统负载影响 |
| `/tj/info/teleop_motion_mode` | `std_msgs/msg/Int32` | 事件触发 | `0=全身，1=仅双臂，2=双臂加头部` |
| `/tj/info/body_pose_mode` | `std_msgs/msg/Int32` | 事件触发 | `0=skeleton，1=neck_head_pose` |

`VrBody` 中包含左右肘、躯干、头、骨盆、左右脚和左右膝位姿，以及对应的 `available` 标志。某项 `available=false` 时，不应把对应位姿作为有效数据。

```bash
ros2 topic echo /tj/info/vr_connected --once
ros2 topic echo /tj/control/target_poseL --once
ros2 topic echo /tj/control/target_poseR --once
ros2 topic echo /tj/control/vr_body --once
ros2 topic echo /tj/info/eef_left --once
ros2 topic echo /tj/info/eef_right --once
```

Skye 当前版本可能不使用 TCP 连接状态作为遥操门控，因此不能只依据 `/tj/info/vr_connected` 判断 Skye 遥操是否正常，还应检查目标位姿和使能 Topic 是否持续更新。

> 当前版本虽然创建了 `/tj/control/eef_cmd_A`、`/tj/control/eef_cmd_B`、`/tj/info/collision_statusA` 和 `/tj/info/collision_statusB` Publisher，但源码中没有实际发布，不应作为客户可用接口。

### 4.1 控制链观测接口

以下 Topic 可用于确认 Teleop、IK/QP 和最终下发链路停在哪一层。客户程序不要直接向 QP 输出或最终命令 Topic 发布。

| Topic | 类型 | 频率 / 发布方式 | 说明 |
|---|---|---|---|
| `/tj/control/teleop/ik_request` | `marvin_msgs/msg/IKRequest` | 目标 1000 Hz | Teleop 生成的全身 IK 请求 |
| `/tj/control/replay/ik_request` | `marvin_msgs/msg/IKRequest` | 跟随录制时间戳 | Replay 生成的 IK 请求 |
| `/tj/control/ik_request` | `marvin_msgs/msg/IKRequest` | 跟随当前输入源 | IK Mux 选出的当前请求 |
| `/tj/control/qp_controller/joint_cmd_A` | `marvin_msgs/msg/JointcmdArm` | Skye 250 Hz；Luna 500 Hz | QP 左臂输出 |
| `/tj/control/qp_controller/joint_cmd_B` | `marvin_msgs/msg/JointcmdArm` | Skye 250 Hz；Luna 500 Hz | QP 右臂输出 |
| `/tj/control/qp_controller/joint_cmd_body` | `marvin_msgs/msg/JointcmdBody` | Skye 250 Hz；Luna 500 Hz | QP 主体输出 |
| `/tj/control/qp_controller/joint_cmd_head` | `marvin_msgs/msg/JointcmdHead` | Skye 250 Hz；Luna 500 Hz | QP 头部输出 |
| `/tj/control/joint_cmd_A` | `marvin_msgs/msg/JointcmdArm` | 稳态 Skye 250 Hz、Luna 500 Hz；切换时约 100 Hz | Joint Mux 最终左臂命令 |
| `/tj/control/joint_cmd_B` | `marvin_msgs/msg/JointcmdArm` | 稳态 Skye 250 Hz、Luna 500 Hz；切换时约 100 Hz | Joint Mux 最终右臂命令 |
| `/tj/control/joint_cmd_body` | `marvin_msgs/msg/JointcmdBody` | 稳态 Skye 250 Hz、Luna 500 Hz；切换时约 100 Hz | Joint Mux 最终主体命令 |
| `/tj/control/joint_cmd_head` | `marvin_msgs/msg/JointcmdHead` | 稳态 Skye 250 Hz、Luna 500 Hz；切换时约 100 Hz | Joint Mux 最终头部命令 |

## 5. Custom 全身控制接口

客户算法通过以下 `user` Topic 输入关节目标：

| Topic | 消息类型 | 频率 / 发布方式 | 说明 |
|---|---|---|---|
| `/tj/control/user/joint_cmd_A` | `marvin_msgs/msg/JointcmdArm` | 由客户程序决定 | 左臂 7 关节目标，单位 rad |
| `/tj/control/user/joint_cmd_B` | `marvin_msgs/msg/JointcmdArm` | 由客户程序决定 | 右臂 7 关节目标，单位 rad |
| `/tj/control/user/joint_cmd_body` | `marvin_msgs/msg/JointcmdBody` | 由客户程序决定 | Skye 的 LIFT+BODY 或 Luna 的 BODY 目标 |
| `/tj/control/user/joint_cmd_head` | `marvin_msgs/msg/JointcmdHead` | 由客户程序决定 | HEAD 目标，当前使用前两个值 |

消息结构：

```text
JointcmdArm:  std_msgs/Header header + float64[7] positions
JointcmdBody: std_msgs/Header header + float64[6] positions
JointcmdHead: std_msgs/Header header + float64[3] positions
```

在目标设备确认定义：

```bash
ros2 interface show marvin_msgs/msg/JointcmdArm
ros2 interface show marvin_msgs/msg/JointcmdBody
ros2 interface show marvin_msgs/msg/JointcmdHead
```

### 5.1 启用顺序

1. 清空机器人工作空间，保持急停可触及。
2. 在 Apex Teleop 中启动 Robot，使机器人 Ready。
3. 进入阻抗模式并执行 Home。
4. 将 Input Mode 切换为 **Custom**，或调用：

```bash
ros2 service call /tj/control/set_input \
  marvin_msgs/srv/Int "{data: 3}"
```

5. 持续发布与目标机型一致的左臂、右臂、BODY 和 HEAD 完整目标。
6. 结束前先切回 **None**：

```bash
ros2 service call /tj/control/set_input \
  marvin_msgs/srv/Int "{data: 0}"
```

刚切换控制源时，系统会进行平滑过渡。首帧反馈尚未建立、消息时间戳过期或目标数据不完整时，控制命令可能不会输出。

### 5.2 安全约束

- 首次测试使用小幅、低速、连续目标，不发送跳变数据。
- 每条命令使用当前时间戳，过期命令可能被拒绝。
- 必须遵守各关节位置、速度和机械限位。
- 不要直接向 `/tj/control/joint_cmd_A/B/body/head` 等最终下发 Topic 发布。
- 不要调用内部 Mux 原生选择接口；客户统一使用 `/tj/control/set_input`。
- 客户进程异常退出时，应立即切回 None 或触发安全停止。

## 6. 客户可用 Service

| Service | 类型 | 说明 |
|---|---|---|
| `/tj/control/set_ready` | `std_srvs/srv/Trigger` | 允许机器人接收实时控制命令 |
| `/tj/control/set_mode` | `marvin_msgs/srv/Int` | 切换整机控制模式 |
| `/tj/control/go_home` | `std_srvs/srv/Trigger` | 按机型配置回到 Home |
| `/tj/control/clear_fault` | `std_srvs/srv/Trigger` | 清除控制器故障 |
| `/tj/control/set_input` | `marvin_msgs/srv/Int` | 兼容索引：`0=None, 1=Teleop, 2=Planner, 3=Custom, 4=Replay` |
| `/tj/control/set_teleop_motion_mode` | `marvin_msgs/srv/Int` | `0=全身，1=仅双臂，2=双臂加头部` |
| `/tj/control/set_body_pose_mode` | `marvin_msgs/srv/Int` | `0=skeleton，1=neck_head_pose` |
| `/tj/control/reset_grippers` | `std_srvs/srv/Trigger` | 复位并重新使能已配置的 DM/ZY 夹爪 |

常用调用：

```bash
ros2 service call /tj/control/clear_fault std_srvs/srv/Trigger "{}"
ros2 service call /tj/control/set_ready std_srvs/srv/Trigger "{}"
ros2 service call /tj/control/set_mode marvin_msgs/srv/Int "{data: 3}"
ros2 service call /tj/control/go_home std_srvs/srv/Trigger "{}"
```

`set_mode` 会根据 Skye 或 Luna 的机型配置同时管理 ARM、HEAD、BODY 和 LIFT，客户不应将其简单理解为仅切换双臂模式。正常使用优先通过 Apex Teleop 完成 Ready、模式和 Home 操作。

## 7. 末端执行器

末端 Topic 只在相应驱动和硬件已配置时出现。

### DM / ZY 夹爪

| Topic | 消息类型 | 频率 / 发布方式 | 说明 |
|---|---|---|---|
| `/tj/control/gripperValueL` | `std_msgs/msg/Float32` | 跟随控制输入 | 左夹爪开合目标 |
| `/tj/control/gripperValueR` | `std_msgs/msg/Float32` | 跟随控制输入 | 右夹爪开合目标 |
| `/tj/info/gripper_feedback_L` | `std_msgs/msg/Float32MultiArray` | 200 Hz | 左夹爪反馈 |
| `/tj/info/gripper_feedback_R` | `std_msgs/msg/Float32MultiArray` | 200 Hz | 右夹爪反馈 |
| `/tj/info/gripper_feedback_L_err` | `std_msgs/msg/Int32MultiArray` | 200 Hz | 左夹爪错误码 |
| `/tj/info/gripper_feedback_R_err` | `std_msgs/msg/Int32MultiArray` | 200 Hz | 右夹爪错误码 |

### Wuji 灵巧手

| Topic | 消息类型 | 频率 / 发布方式 | 说明 |
|---|---|---|---|
| `/hand_left/joint_commands` | `sensor_msgs/msg/JointState` | 跟随控制输入 | 左手关节目标 |
| `/hand_right/joint_commands` | `sensor_msgs/msg/JointState` | 跟随控制输入 | 右手关节目标 |
| `/hand_left/joint_states` | 以目标机为准 | 由驱动配置决定 | 左手关节反馈 |
| `/hand_right/joint_states` | 以目标机为准 | 由驱动配置决定 | 右手关节反馈 |

```bash
ros2 topic list -t | grep -E "gripper|hand"
```

## 8. 相机 Topic

Gento 视频通常通过 H.264/WebRTC 传输。当前相机组件默认以 30 Hz 生成四路 Mosaic，ROS 图像接口多为按订阅启停，实际频率以现场配置和测量为准。

| Topic | 消息类型 | 格式 | 频率 / 发布方式 | 说明 |
|---|---|---|---|---|
| `/quad_tile/compressed` | `sensor_msgs/msg/CompressedImage` | `h264` | 有订阅者时发布，默认上限 30 Hz | 原始四路 Mosaic |
| `/quad_tile/compressed_undistorted` | `sensor_msgs/msg/CompressedImage` | `h264` | 有订阅者时发布，默认上限 30 Hz | 按各槽位标定配置处理后的 Mosaic |
| `/quad_tile/jpeg/compressed` | `sensor_msgs/msg/CompressedImage` | `jpeg` | 有订阅者时发布，默认上限 30 Hz | 处理后的 JPEG Mosaic，默认 640×360 |
| `/camera/<name>/depth/image_raw` | `sensor_msgs/msg/Image` | `16UC1` | 启用深度和原始发布时 | D405 原始深度图 |
| `/camera/<name>/depth/image_raw/compressed` | `sensor_msgs/msg/CompressedImage` | `h264` | 启用深度且有订阅者时 | D405 灰度映射深度码流 |

单路 NV12、槽位配置、录像服务和故障检查参见 [相机配置与 ROS 接口](/advanced/camera-configuration-and-interfaces)。ROS 图像 Topic 不存在时，WebRTC 仍可能正常工作。

```bash
ros2 topic list -t | grep -Ei "camera|image|compressed|quad|usb_cam"
```

## 9. 输入仲裁、Replay 与底盘

### 9.1 两级输入仲裁

Gento 使用两级仲裁，客户程序通常只需通过 `/tj/control/set_input` 选择最终关节命令来源：

| Topic | 类型 | 频率 / 发布方式 | 说明 |
|---|---|---|---|
| `/tj/info/ik_request_mux/active_source` | `std_msgs/msg/Int32` | 事件触发并保留最新值 | IK 来源：`0=Teleop, 1=Replay` |
| `/tj/info/joint_cmd_mux/active_source` | `std_msgs/msg/Int32` | 事件触发并保留最新值 | 原生来源索引：`-1..3` |
| `/tj/control/input_mode` | `std_msgs/msg/Int32` | 事件触发并保留最新值 | 兼容索引：`0=None, 1=Teleop, 2=Planner, 3=Custom, 4=Replay` |
| `/tj/info/joint_cmd_mux/latest_joint_cmd` | `sensor_msgs/msg/JointState` | 跟随最终关节命令 | 最近一次完整关节命令快照 |

切换来源时系统会从当前关节反馈开始平滑过渡。只向 `user` Topic 发布而没有选择 Custom 输入，机器人不会使用该命令。

### 9.2 Gento Replay

| 接口 | 类型 | 频率 / 调用方式 | 说明 |
|---|---|---|---|
| `/tj/info/gento_replay/status` | `std_msgs/msg/String` | 约 2 Hz | Replay JSON 状态 |
| `/tj/control/gento_replay/record` | `marvin_msgs/srv/Int` | 按请求调用 | `data=1` 开始录制，`data=0` 停止 |
| `/tj/control/gento_replay/playback` | `marvin_msgs/srv/Int` | 按请求调用 | `data=1` 开始回放，`data=0` 停止 |
| `/tj/control/gento_replay/record_named` | `marvin_msgs/srv/GentoReplay` | 按请求调用 | 按指定名称开始或停止录制 |
| `/tj/control/gento_replay/playback_named` | `marvin_msgs/srv/GentoReplay` | 按请求调用 | 按指定名称开始或停止回放 |

新版 Gento 优先使用 `gento_replay`。旧 `/recorder/*` 和 `/playback_*` 接口属于历史兼容链路，不建议新客户程序依赖。

### 9.3 移动底盘

底盘节点通常独立运行并保持根命名空间：

| Topic / Service | 类型 | 频率 / 调用方式 | 说明 |
|---|---|---|---|
| `/controller/odom` | `nav_msgs/msg/Odometry` | 由底盘驱动决定 | 底盘里程计 |
| `/move/State` | `move/msg/State` | 由底盘驱动决定 | 底盘状态 |
| `/move/ManualMoveCmd` | `geometry_msgs/msg/TwistStamped` | 对应模式启用时 100 Hz | 手动速度命令 |
| `/info/base_local_state` | `move/msg/State` | 跟随 `/move/State` | 基于重置原点的本地状态 |
| `/info/base_teleop/active_mode` | `std_msgs/msg/Int32` | 事件触发并保留最新值 | `0=off, 1=joy, 2=wholebody` |
| `/control/base_local_reset` | `std_srvs/srv/Trigger` | 按请求调用 | 重置底盘本地坐标原点 |
| `/control/base_teleop/set_mode` | `marvin_msgs/srv/Int` | 按请求调用 | 切换底盘遥操模式 |

若接口不存在，请同时检查 `/tj/info/base_*` 和 `/tj/control/base_*`，确认现场 Launch 是否为底盘节点增加了命名空间。

## 10. Topic 频率参考

Gento 的控制循环和 Topic 频率与 Marvin Pro 不同。下表为当前 Skye/Luna 源码及默认参数的设计值，不是硬实时承诺。

| Topic / 链路 | Skye | Luna | 说明 |
|---|---:|---:|---|
| `/tj/info/eef_left/right` | 1000 Hz | 1000 Hz | Motion 定时器目标，实际值受负载影响 |
| `/tj/control/teleop/ik_request` | 1000 Hz | 1000 Hz | Teleop 正常运行 |
| `/tj/control/qp_controller/joint_cmd_*` | 250 Hz | 500 Hz | Ready、Home 和 IK 数据均正常 |
| `/tj/control/joint_cmd_*` | 通常 250 Hz | 通常 500 Hz | Mux 稳态直通；来源切换期间约 100 Hz |
| `/tj/info/joint_feedback` | 目标约 500 Hz | 目标约 500 Hz | SDK 返回驱动，实际频率以现场测量为准 |
| `/tj/joint_states`、`/tj/info/robot_state` | 通常约 100 Hz | 通常约 100 Hz | 每 5 次成功的关节反馈发布一次；实际值随反馈频率变化 |
| `/tj/info/gripper_feedback_L/R` 及错误码 | 200 Hz | 200 Hz | DM/ZY Tool 默认配置 |
| `/tj/info/gento_replay/status` | 2 Hz | 2 Hz | Replay 启动后每 500 ms 发布 |
| `/move/ManualMoveCmd`、`/target_pose` | 100 Hz | 100 Hz | 对应底盘模式有效时 |

头显输入 Topic 跟随实际 UDP 数据包；相机 Topic 跟随相机配置；模式、来源和静态 TF 等事件 Topic 没有连续频率要求。夹爪内部 CAN 控制循环为 1000 Hz，不代表 ROS 反馈也是 1000 Hz。

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

刚启动或切换控制源后，应等待约 2 秒的 Mux 平滑过程结束再测最终关节命令。测量前还应检查 Publisher 数量，正式满负载测试建议持续至少 120 秒。

## 11. 建议采集的数据

| 数据类别 | 建议 Topic |
|---|---|
| 整机关节反馈 | `/tj/joint_states`、`/tj/info/joint_feedback` |
| 机器人状态 | `/tj/info/robot_state`、`/tj/info/robot_info` |
| 末端位姿 | `/tj/info/eef_left`、`/tj/info/eef_right` |
| 头显目标与使能 | `/tj/control/target_poseL/R`、`/tj/control/enableL/R`、`/tj/control/vr_body` |
| 客户控制输入 | `/tj/control/user/joint_cmd_A/B/body/head` |
| 夹爪或灵巧手 | 按实际末端配置选择 |
| 视频 | `/quad_tile/jpeg/compressed`，仅在现场已启用时 |

录制前使用 `ros2 topic info -v`、`ros2 topic echo --once` 和 `ros2 topic hz` 确认 Topic 实际存在且有有效数据。

如需将新的身体、头部或末端 Topic 纳入录制、回放或前端转发，参见 [Topic 白名单配置与排查](/advanced/topic-whitelist)。

## 12. 最小诊断清单

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

| 现象 | 优先检查 |
|---|---|
| 没有 `/tj/info/robot_info` | Robot 未启动、ROS 环境、命名空间或 `ROS_DOMAIN_ID` 不一致 |
| 有 RobotInfo，没有关节反馈 | Robot 与控制器通信异常 |
| 头显目标没有数据 | Teleop、头显连接、网络地址和遥操使能 |
| Custom Topic 有发布方但机器人不动 | Ready、阻抗模式、Home、Input Mode、时间戳和完整目标 |
| 双臂正常，BODY 不动 | 机型判断、Skye/Luna BODY 数组顺序和状态 |
| 有夹爪目标但夹爪不动 | Tool、末端驱动、供电和硬件连接 |
| 没有压缩图 Topic | 先确认现场是否启用了 ROS 压缩图发布，视频可能仍经 WebRTC 正常工作 |

判断链路时应逐层确认状态反馈、客户输入、当前 Input Mode 和机器人动作，不能只根据某一个 Topic 是否存在得出结论。
