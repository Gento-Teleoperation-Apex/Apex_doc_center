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

涉及的 IP 内容总共5项，以下提供的是出厂原始值

1.双臂控制板IP， <span style={{color: '#ff0000'}}>192.168.10.190</span><br/>
2.Orin网络适配器IP， <span style={{color: '#00b050'}}>192.168.10.123</span><br/>
3.Orin连接双臂的连接IP， <span style={{color: '#ff0000'}}>192.168.10.190</span><br/>
4.路由器IP， 192.168.10.1<br/>
5.头显内， apex软件连接orin的连接IP， <span style={{color: '#00b050'}}>192.168.10.123</span>

第3项是orin启动遥操后，去连接双臂控制板，控制手臂的。所以连接IP应当和第1项一致，否则orin拿到遥操数据后，无法下发位置给双臂。

第5项是头显连接orin，接收相机图像，传递tcp位置的。所以连接IP应当与第2项一致，否则头显中的相机图像将是4个白框，同时手柄无法控制手臂，进行遥操

第1， 2项，分别是两个控制器硬件的IP地址

第4项是路由器交换机的地址， 1.2.5项通过路由器连接进行数据交换

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
| `/control/target_poseL` | 遥操时左手TCP目标点 | `geometry_msgs/msg/PoseStamped` |
| `/control/target_poseR` | 遥操时右手TCP目标点 | `geometry_msgs/msg/PoseStamped` |
| `/control/gripperValueL` | 遥操时左手柄前键value值，用于控制左手夹爪开闭 | `std_msgs/msg/Float32` |
| `/control/gripperValueR` | 遥操时右手柄前键value值，用于控制右手夹爪开闭 | `std_msgs/msg/Float32` |
| `/control/gripL` | 遥操时左手柄侧键bool值，用于在与小球对齐后，按住侧键进入遥操 | `std_msgs/msg/Bool` |
| `/control/gripR` | 遥操时右手柄侧键bool值，用于在与小球对齐后，按住侧键进入遥操 | `std_msgs/msg/Bool` |
| `/info/collision_statusB` | 右臂末端轨迹碰撞判断bool值 | `std_msgs/msg/Bool` |
| `/info/eef_left` | 正向运动学计算出的左臂法兰位姿 | `geometry_msgs/msg/PoseStamped` |
| `/info/eef_right` | 正向运动学计算出的右臂法兰位姿 | `geometry_msgs/msg/PoseStamped` |
| `/info/joint_feedback` | 机械臂关节反馈，左手轴1-轴7，右手轴1-轴7，频率250hz | `marvin_msgs/msg/Jointfeedback` |
| `/joint_states` | 机械臂关节位置，左手轴1-轴7，右手轴1-轴7，频率50hz | `std_msgs/msg/JointState` |
| `/robot_description` | 机械臂URDF可视化 | `std_msgs/msg/String` |
| `/usb_cam_0/image_raw` | 双目相机视频流 | `sensor_msgs/msg/Image` |
| `/gripper/feedback_L_err` | 左手夹爪错误码，用于监测夹爪状态 | `std_msgs/msg/Int32MultiArray` |
| `/gripper/feedback_R_err` | 右手夹爪错误码，用于监测夹爪状态 | `std_msgs/msg/Int32MultiArray` |
| `/info/arm_state` | 机械臂状态信息 | `std_msgs/msg/Int16MultiArray` |
| `/info/collision_marker` | 机械臂末端轨迹预测 | `std_msgs/msg/MarkerArray` |
| `/info/collision_statusA` | 左臂末端轨迹碰撞判断bool值 | `std_msgs/msg/Bool` |
| `/info/collision_statusB` | 右臂末端轨迹碰撞判断bool值 | `std_msgs/msg/Bool` |
