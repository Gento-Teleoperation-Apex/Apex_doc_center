---
title: Gento（Skye/Luna）ROS 2 接口
sidebar_position: 5
---

# Gento（Skye/Luna）ROS 2 接口

本章面向需要读取 Gento 状态、采集遥操数据或通过 `Custom` 模式接入自有算法的客户。

| 项目 | 说明 |
|---|---|
| 适用产品 | Gento Skye、Gento Luna |
| 参考软件基线 | Gento Apex `1.0.6.81g` |
| 参考环境 | Ubuntu 22.04、ROS 2 Humble |

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

## 2. Skye 与 Luna 的关节差异

| 项目 | Skye | Luna |
|---|---|---|
| `robot_type` | `Gento_Skye` | `Gento_Luna` |
| 左臂 | 7 关节 | 7 关节 |
| 右臂 | 7 关节 | 7 关节 |
| BODY | LIFT 1 + BODY 2 | BODY 6 |
| HEAD | 2 关节 | 2 关节 |

先确认机型：

```bash
ros2 topic echo /info/robot_info --once
```

Skye 与 Luna 使用相同的 BODY Topic 名，但数组含义不同：

- **Skye**：`positions[0]` 为 LIFT，`positions[1:3]` 为两个 BODY 关节，其余位置不作为当前机型有效关节。
- **Luna**：`positions[0:6]` 对应六个 BODY 关节。
- `JointcmdHead.positions` 定义长度为 3，但当前两种机型只使用前两个 HEAD 关节值。

客户程序必须先根据 `/info/robot_info` 判断机型，不能在 Skye 与 Luna 之间直接复用 BODY 数组。

## 3. 机器人状态 Topic

启动 Robot 模块后，可读取：

| Topic | 消息类型 | 说明 |
|---|---|---|
| `/joint_states` | `sensor_msgs/msg/JointState` | ROS 标准整机关节名称、位置、速度和力矩 |
| `/info/joint_feedback` | `marvin_msgs/msg/Jointfeedback` | Gento 整机实时关节反馈 |
| `/info/robot_state` | `std_msgs/msg/Int16MultiArray` | ARM、HEAD、BODY、LIFT 当前控制状态 |
| `/info/robot_cmd_state` | `std_msgs/msg/Int16MultiArray` | 各组件目标控制状态 |
| `/info/robot_info` | `marvin_msgs/msg/RobotInfo` | 机器人型号和控制器版本 |
| `/info/imu0` | `sensor_msgs/msg/Imu` | IMU 0 数据 |
| `/info/imu1` | `sensor_msgs/msg/Imu` | IMU 1 数据 |

```bash
ros2 topic echo /info/robot_info --once
ros2 topic echo /info/robot_state --once
ros2 topic echo /info/joint_feedback --once
ros2 topic echo /joint_states --once
```

`Jointfeedback` 的双臂顺序固定为左臂 7 关节在前、右臂 7 关节在后。BODY 有效范围按上一节区分机型。

## 4. 头显与遥操数据 Topic

启动 Teleop 模块后，可观察：

| Topic | 消息类型 | 说明 |
|---|---|---|
| `/control/target_poseL` | `geometry_msgs/msg/PoseStamped` | 左手柄映射后的左臂末端目标 |
| `/control/target_poseR` | `geometry_msgs/msg/PoseStamped` | 右手柄映射后的右臂末端目标 |
| `/control/enableL` | `std_msgs/msg/Bool` | 左臂遥操使能 |
| `/control/enableR` | `std_msgs/msg/Bool` | 右臂遥操使能 |
| `/control/vr_joy_L` | `sensor_msgs/msg/Joy` | 左手柄按键和摇杆 |
| `/control/vr_joy_R` | `sensor_msgs/msg/Joy` | 右手柄按键和摇杆 |
| `/control/vr_body` | `marvin_msgs/msg/VrBody` | 躯干、头、肘、腿等全身追踪数据 |
| `/info/vr_connected` | `std_msgs/msg/Bool` | 头显连接状态 |
| `/info/eef_left` | `geometry_msgs/msg/PoseStamped` | 左臂当前末端位姿 |
| `/info/eef_right` | `geometry_msgs/msg/PoseStamped` | 右臂当前末端位姿 |
| `/info/collision_statusA` | `std_msgs/msg/Bool` | 左侧碰撞检测状态 |
| `/info/collision_statusB` | `std_msgs/msg/Bool` | 右侧碰撞检测状态 |

`VrBody` 中包含左右肘、躯干、头、骨盆、左右脚和左右膝位姿，以及对应的 `available` 标志。某项 `available=false` 时，不应把对应位姿作为有效数据。

```bash
ros2 topic echo /info/vr_connected --once
ros2 topic echo /control/target_poseL --once
ros2 topic echo /control/target_poseR --once
ros2 topic echo /control/vr_body --once
ros2 topic echo /info/eef_left --once
ros2 topic echo /info/eef_right --once
```

Skye 当前版本可能不使用 TCP 连接状态作为遥操门控，因此不能只依据 `/info/vr_connected` 判断 Skye 遥操是否正常，还应检查目标位姿和使能 Topic 是否持续更新。

## 5. Custom 全身控制接口

客户算法通过以下 `user` Topic 输入关节目标：

| Topic | 消息类型 | 说明 |
|---|---|---|
| `/control/user/joint_cmd_A` | `marvin_msgs/msg/JointcmdArm` | 左臂 7 关节目标，单位 rad |
| `/control/user/joint_cmd_B` | `marvin_msgs/msg/JointcmdArm` | 右臂 7 关节目标，单位 rad |
| `/control/user/joint_cmd_body` | `marvin_msgs/msg/JointcmdBody` | Skye 的 LIFT+BODY 或 Luna 的 BODY 目标 |
| `/control/user/joint_cmd_head` | `marvin_msgs/msg/JointcmdHead` | HEAD 目标，当前使用前两个值 |

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
ros2 service call /control/set_input \
  marvin_msgs/srv/Int "{data: 3}"
```

5. 持续发布与目标机型一致的左臂、右臂、BODY 和 HEAD 完整目标。
6. 结束前先切回 **None**：

```bash
ros2 service call /control/set_input \
  marvin_msgs/srv/Int "{data: 0}"
```

刚切换控制源时，系统会进行平滑过渡。首帧反馈尚未建立、消息时间戳过期或目标数据不完整时，控制命令可能不会输出。

### 5.2 安全约束

- 首次测试使用小幅、低速、连续目标，不发送跳变数据。
- 每条命令使用当前时间戳，过期命令可能被拒绝。
- 必须遵守各关节位置、速度和机械限位。
- 不要直接向 `/control/joint_cmd_A/B/body/head` 等最终下发 Topic 发布。
- 不要调用内部 Mux 原生选择接口；客户统一使用 `/control/set_input`。
- 客户进程异常退出时，应立即切回 None 或触发安全停止。

## 6. 客户可用 Service

| Service | 类型 | 说明 |
|---|---|---|
| `/control/set_ready` | `std_srvs/srv/Trigger` | 允许机器人接收实时控制命令 |
| `/control/set_mode` | `marvin_msgs/srv/Int` | 切换整机控制模式 |
| `/control/go_home` | `std_srvs/srv/Trigger` | 按机型配置回到 Home |
| `/control/clear_fault` | `std_srvs/srv/Trigger` | 清除控制器故障 |
| `/control/set_input` | `marvin_msgs/srv/Int` | 选择 None、Teleop、Planner、Custom 或 Replay 输入 |

常用调用：

```bash
ros2 service call /control/clear_fault std_srvs/srv/Trigger "{}"
ros2 service call /control/set_ready std_srvs/srv/Trigger "{}"
ros2 service call /control/set_mode marvin_msgs/srv/Int "{data: 3}"
ros2 service call /control/go_home std_srvs/srv/Trigger "{}"
```

`set_mode` 会根据 Skye 或 Luna 的机型配置同时管理 ARM、HEAD、BODY 和 LIFT，客户不应将其简单理解为仅切换双臂模式。正常使用优先通过 Apex Teleop 完成 Ready、模式和 Home 操作。

## 7. 末端执行器

末端 Topic 只在相应驱动和硬件已配置时出现。

### DM / ZY 夹爪

| Topic | 消息类型 | 说明 |
|---|---|---|
| `/control/gripperValueL` | `std_msgs/msg/Float32` | 左夹爪开合目标 |
| `/control/gripperValueR` | `std_msgs/msg/Float32` | 右夹爪开合目标 |
| `/info/gripper_feedback_L` | `std_msgs/msg/Float32MultiArray` | 左夹爪反馈 |
| `/info/gripper_feedback_R` | `std_msgs/msg/Float32MultiArray` | 右夹爪反馈 |

### Wuji 灵巧手

| Topic | 消息类型 | 说明 |
|---|---|---|
| `/hand_left/joint_commands` | `sensor_msgs/msg/JointState` | 左手关节目标 |
| `/hand_right/joint_commands` | `sensor_msgs/msg/JointState` | 右手关节目标 |
| `/hand_left/joint_states` | 以目标机为准 | 左手关节反馈 |
| `/hand_right/joint_states` | 以目标机为准 | 右手关节反馈 |

```bash
ros2 topic list -t | grep -E "gripper|hand"
```

## 8. 相机 Topic

Gento 视频通常通过 H264/WebRTC 传输，不要求每路相机都发布 ROS 原始图像。

| Topic | 消息类型 | 说明 |
|---|---|---|
| `/quad_tile/compressed` | `sensor_msgs/msg/CompressedImage` | 可选的多相机拼接 JPEG 图像 |

该 Topic 取决于相机模块版本和压缩图发布参数。它不存在时，WebRTC 仍可能正常工作。

```bash
ros2 topic list -t | grep -Ei "camera|image|compressed|quad|usb_cam"
```

## 9. 建议采集的数据

| 数据类别 | 建议 Topic |
|---|---|
| 整机关节反馈 | `/joint_states`、`/info/joint_feedback` |
| 机器人状态 | `/info/robot_state`、`/info/robot_cmd_state`、`/info/robot_info` |
| 末端位姿 | `/info/eef_left`、`/info/eef_right` |
| 头显目标与使能 | `/control/target_poseL/R`、`/control/enableL/R`、`/control/vr_body` |
| 客户控制输入 | `/control/user/joint_cmd_A/B/body/head` |
| 夹爪或灵巧手 | 按实际末端配置选择 |
| 视频 | `/quad_tile/compressed`，仅在现场已启用时 |

录制前使用 `ros2 topic info -v`、`ros2 topic echo --once` 和 `ros2 topic hz` 确认 Topic 实际存在且有有效数据。

## 10. 最小诊断清单

```bash
source /etc/apex/apex_ros_env.sh
echo "ROS_DOMAIN_ID=${ROS_DOMAIN_ID}"
ros2 topic echo /info/robot_info --once
ros2 topic echo /info/robot_state --once
ros2 topic echo /info/joint_feedback --once
ros2 topic echo /info/vr_connected --once
ros2 topic info /control/target_poseL -v
ros2 topic info /control/user/joint_cmd_A -v
ros2 topic echo /control/input_mode --once
```

| 现象 | 优先检查 |
|---|---|
| 没有 `/info/robot_info` | Robot 未启动、ROS 环境或 `ROS_DOMAIN_ID` 不一致 |
| 有 RobotInfo，没有关节反馈 | Robot 与控制器通信异常 |
| 头显目标没有数据 | Teleop、头显连接、网络地址和遥操使能 |
| Custom Topic 有发布方但机器人不动 | Ready、阻抗模式、Home、Input Mode、时间戳和完整目标 |
| 双臂正常，BODY 不动 | 机型判断、Skye/Luna BODY 数组顺序和状态 |
| 有夹爪目标但夹爪不动 | Tool、末端驱动、供电和硬件连接 |
| 没有压缩图 Topic | 先确认现场是否启用了 ROS 压缩图发布，视频可能仍经 WebRTC 正常工作 |

判断链路时应逐层确认状态反馈、客户输入、当前 Input Mode 和机器人动作，不能只根据某一个 Topic 是否存在得出结论。
