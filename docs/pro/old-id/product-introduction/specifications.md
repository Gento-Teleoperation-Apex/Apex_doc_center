---
title: 技术规格
sidebar_position: 2
---

# 技术规格

## 关键网络配置

部署前先确认以下地址，后续配置会用到：

| 项目 | 默认值 / 说明 |
|---|---|
| 双臂控制板 IP | `192.168.10.190` |
| Orin 网络适配器 IP | `192.168.10.123` |
| Orin 连接双臂配置 IP | `192.168.10.190`（需与双臂控制板 IP 一致） |
| 路由器 IP | `192.168.10.1` |
| 头显 Apex 软件连接 IP | `192.168.10.123`（需与 Orin IP 一致） |
| SSH 登录 Orin | `ssh marvin@192.168.10.123` |
| Orin 用户密码 | `1234` |
| 路由器 / WiFi 密码 | `12345678` |

![Marvin Pro IP 修改总览](/img/pro_p43.png)

## 软件运行环境

| 项目 | 规格 |
|---|---|
| 操作系统（Orin） | Ubuntu 22.04 ARM64 |
| 操作系统（上位机开发） | Ubuntu 22.04 AMD64 |
| 机器人框架 | ROS 2 Humble |
| 主控硬件 | NVIDIA Jetson Orin |
| 头显 | Meta Quest（VR 端 APK） |
| 安装包格式 | `kernelmind-apex_<version>_arm64.deb` |

## ROS Topics

| Topic | 功能 | Type |
|---|---|---|
| `/control/target_poseL` | 左手 TCP 目标点 | `geometry_msgs/msg/PoseStamped` |
| `/control/target_poseR` | 右手 TCP 目标点 | `geometry_msgs/msg/PoseStamped` |
| `/control/gripperValueL` | 左手夹爪开闭 value | `std_msgs/msg/Float32` |
| `/control/gripperValueR` | 右手夹爪开闭 value | `std_msgs/msg/Float32` |
| `/control/gripL` | 左手侧键使能 | `std_msgs/msg/Bool` |
| `/control/gripR` | 右手侧键使能 | `std_msgs/msg/Bool` |
| `/info/eef_left` | 左臂法兰位姿 | `geometry_msgs/msg/PoseStamped` |
| `/info/eef_right` | 右臂法兰位姿 | `geometry_msgs/msg/PoseStamped` |
| `/info/joint_feedback` | 双臂 14 轴关节反馈，约 250 Hz | `marvin_msgs/msg/Jointfeedback` |
| `/joint_states` | 双臂 14 轴关节状态，约 50 Hz | `std_msgs/msg/JointState` |
| `/robot_description` | URDF 可视化 | `std_msgs/msg/String` |
| `/usb_cam_0/image_raw` | 双目相机视频流 | `sensor_msgs/msg/Image` |
| `/gripper/feedback_L_err` | 左手夹爪错误码 | `std_msgs/msg/Int32MultiArray` |
| `/gripper/feedback_R_err` | 右手夹爪错误码 | `std_msgs/msg/Int32MultiArray` |
| `/info/arm_state` | 机械臂状态 | `std_msgs/msg/Int16MultiArray` |
| `/info/collision_marker` | 末端轨迹预测 | `visualization_msgs/msg/MarkerArray` |
| `/info/collision_statusA` | 左臂末端轨迹碰撞判断 | `std_msgs/msg/Bool` |
| `/info/collision_statusB` | 右臂末端轨迹碰撞判断 | `std_msgs/msg/Bool` |

![ROS Topic 说明（第一页）](/img/pro_p35.png)

![ROS Topic 说明（第二页）](/img/pro_p36.png)
