---
title: Wuji 二代灵巧手
sidebar_position: 3
---

# Wuji 二代灵巧手直连使用说明

适用 **Gento ApexTool 1.0.7.86dex**、ARM64 Orin / 天准、Ubuntu 22.04 和 ROS 2 Humble。其他版本的接口与安装方式应以对应交付包为准。

Wuji 二代手通过以太网和 Wuji SDK 直接连接主机上的 ApexTool，不经过机器人末端板、CAN/vCAN、MarvinSDK 或 GentoSDK。单独控制灵巧手无需启动机械臂、Robot 服务或头显。支持左手、右手和双手，每侧 20 个关节，位置单位为 rad。

本包**不包含**手套采集、骨架到关节角的重定向、F7 按键程序或前端换档功能。使用手套时，配套程序需发布 ROS 关节目标，不得同时通过 SDK 直驱同一只手。

## 1. 安全与连接

1. 按硬件说明给手供电，通过网线直连主机或接入同一交换机。检查主机网卡与手的 IP、掩码和路由；安装包不会自动修改网络地址。
2. 清空手部工作区，移走夹持物，确认急停或硬件断能可用，并保持唯一控制源。
3. 停止其他直连驱动前，先按其流程下使能并确认安全。不要为排查手部通信而启动整套机器人或执行机械臂 Home。

## 2. 安装与配置

使用**完整离线包**，不要只安装其中的 DEB；它还包含 Wuji SDK 与运行依赖：

```text
gento-apex-tool_1.0.7.86dex_humble_arm64_wuji_bundle.tar.gz
```

在压缩包所在目录执行预检查，确认无依赖错误或非预期变更后再安装：

```bash
tar -xzf gento-apex-tool_1.0.7.86dex_humble_arm64_wuji_bundle.tar.gz
cd gento-apex-tool_1.0.7.86dex_humble_arm64_wuji_bundle
bash install.sh --check
bash install.sh
dpkg-query -W gento-apex-tool
```

安装器中选择 `2) Direct host` 和 `4) Wuji2 (Ethernet, no glove)`。期望包版本为 `1.0.7.86dex`。安装不会自动启动 Tool；不要在系统 Python 或 Conda 中另装 SDK。此包不适用于 x86、Windows 或 Ubuntu 24.04 / ROS 2 Jazzy。

| 用途 | 路径 |
|---|---|
| 通信方式及末端类型 | `/etc/apex/apex.env` |
| 二代手参数 | `/opt/kernelmind/apex_tool/install/share/apex_tool/config/wuji2.yaml` |
| Home 姿态 | `/opt/kernelmind/apex_tool/install/share/apex_tool/config/wuji2_home_pose.json` |
| SDK 独立 Python 环境 | `/opt/kernelmind/apex_tool/wuji2_venv` |

检查 `/etc/apex/apex.env`：

```ini
APEX_TOOL_TRANSPORT=direct
APEX_TOOL_TYPE=wuji2
```

手动切换前，先将原末端安全下使能并停止 Tool，再备份并编辑现有文件，不要覆盖其他配置或添加重复项：

```bash
sudo systemctl stop apex-tool.service
sudo cp -a /etc/apex/apex.env "/etc/apex/apex.env.bak.$(date +%Y%m%d_%H%M%S)"
sudoedit /etc/apex/apex.env
```

`wuji` 是一代 USB 手，`wuji2` 是二代以太网手，不能混用。在 `wuji2.yaml` 中按需设置：

```yaml
side: both  # left、right 或 both
left_serial_number: ""
right_serial_number: ""
```

默认 `both`；只连接一侧时仅创建已识别侧的接口。序列号留空会根据设备自身左右属性自动识别；多只同侧设备必须指定 SN。配置仅在启动时读取，本版本不自动热插拔重连或重新使能。

## 3. 启动与反馈

确认接线和现场安全后，只启动 Tool：

```bash
sudo systemctl start apex-tool.service
journalctl -u apex-tool.service -n 60 --no-pager
```

启动会发现设备并接收数据，但**不会自动使能或发送运动目标**。若设备此前被其他程序使能，启动本节点不代表硬件已下使能。

每个新终端先加载环境，再检查反馈：

```bash
source /etc/apex/apex_ros_env.sh
source /opt/kernelmind/apex_tool/install/setup.bash
ros2 topic echo /tj/hand_left2/joint_states --qos-reliability best_effort
```

左手反馈应包含每帧 20 个关节的 `position`、`velocity` 和 `effort`。右手使用 `/tj/hand_right2/joint_states`。`Ctrl+C` 仅停止显示，不会停止 Tool。可用 `ros2 topic hz /tj/hand_left2/joint_states` 测量；默认反馈轮询为 50 Hz，实际值取决于设备与主机调度，也应核对时间戳及位置变化。

## 4. 使能、模式与动作

**以下操作可能使手产生力。** 再次确认工作区安全、控制源唯一和硬件停止方式可用。

先进入模式 0，再请求使能左手，等待 `enabled` 实际变为 `true`：

```bash
ros2 topic pub --once /tj/control/footkey2 std_msgs/msg/Int32 '{data: 0}'
ros2 service call /tj/hand_left2/set_enabled std_srvs/srv/SetBool '{data: true}'
ros2 topic echo /tj/hand_left2/enabled
```

服务返回 `success: true` 仅表示请求受理。右手使用对应的 `/tj/hand_right2/...` 接口；双手要分别使能并分别确认。使能依赖完整、新鲜的关节反馈，诊断确认超时会请求下使能，不应绕过。

| `/tj/control/footkey2` 数值 | 模式 | 输入 / 行为 |
|---:|---|---|
| `0` | 待机 / 保持 | 未使能不发目标；已使能保持最近实际发送的滤波目标 |
| `1` | 遥操 | `/tj/hand_left2/joint_commands`、`/tj/hand_right2/joint_commands` |
| `2` | Home | 已使能且未锁定的所有二代手使用 Home 文件 |
| `3` | 用户控制 | `/tj/hand_left_user`、`/tj/hand_right_user` |
| `4` | 回放 | `/tj/hand_left_replay`、`/tj/hand_right_replay`，需外部播放器 |

模式 Topic 的类型是 `std_msgs/msg/Int32`，不是 Bool。左右手共用模式，但独立使能。模式 0 **不是下使能或急停**；换档不会自动使能，也不联动上位机 Hold、Go Home 或机械臂回零。

确认目标流已经准备、对应手已使能后，可进入遥操或用户控制模式：

```bash
# 手套 ROS 目标流
ros2 topic pub --once /tj/control/footkey2 std_msgs/msg/Int32 '{data: 1}'

# 客户程序目标流，按需单独执行
ros2 topic pub --once /tj/control/footkey2 std_msgs/msg/Int32 '{data: 3}'
```

模式 1 还兼容 `/tj/hand_left_cmd` 和 `/tj/hand_right_cmd`，但每侧只选一个输入接口与一个发布者。模式 3 初始目标应与当前反馈姿态一致，后续保持连续、低速、小幅轨迹。

Home 前核对 `wuji2_home_pose.json` 中 `home_qpos` 的 20 个 rad 角度、机械限位与周围空间：

```bash
ros2 topic pub --once /tj/control/footkey2 std_msgs/msg/Int32 '{data: 2}'
```

这会影响**所有已使能、未锁定**的二代手。只需单侧 Home 时仅使能目标侧。Home 文件缺失或数据无效时驱动会拒绝，不会自动以全零角替代。

## 5. ROS 2 接口与数据

以下以左手为例；右手将 `left` 替换为 `right`。仅已识别的手创建对应接口，全部接口位于 `/tj` 下。

| 接口 | 类型 | 用途 |
|---|---|---|
| `/tj/control/footkey2` | `std_msgs/msg/Int32` | 双手共享模式 0～4 |
| `/tj/hand_left2/set_enabled` | `std_srvs/srv/SetBool` | 上 / 下使能请求 |
| `/tj/hand_left2/enabled` | `std_msgs/msg/Bool` | 驱动确认的使能状态 |
| `/tj/hand_left2/joint_commands` | `sensor_msgs/msg/JointState` | 模式 1 目标 |
| `/tj/hand_left_cmd` | `sensor_msgs/msg/JointState` | 模式 1 兼容目标，与上一接口二选一 |
| `/tj/hand_left_user` | `sensor_msgs/msg/JointState` | 模式 3 目标 |
| `/tj/hand_left_replay` | `sensor_msgs/msg/JointState` | 模式 4 目标 |
| `/tj/hand_left2/joint_states` | `sensor_msgs/msg/JointState` | 20 关节位置、速度及 effort 反馈 |
| `/tj/hand_left2/tactile` | `std_msgs/msg/Float32MultiArray` | 五指触觉汇总，设备支持且回传时提供 |
| `/tj/hand_left2/tactile/thumb` | `std_msgs/msg/Float32MultiArray` | 拇指触点；其他名称为 `index`、`middle`、`ring`、`pinky` |

目标 `position` 必须恰好包含 20 个有限数值，单位 rad，不能有 NaN/Inf。顺序为拇指、食指、中指、无名指、小指，每指 4 关节。`name` 留空或按序填 `j0`～`j19`；驱动不会按名称重排。输入 `velocity`、`effort` 不作为控制目标。**不要把全零目标当成通用安全张开姿态。**

反馈只在收到新的完整有效帧时发布，不补零或重复旧帧；`effort` 不等于指尖夹持力。触觉汇总每指 6 项 `[fx, fy, fz, temperature, contacts, max_force]`，共 30 项。某指缺数据时对应值为 NaN，全部缺失时不发布；物理单位及标定以设备说明为准。`enabled` 不能代替硬件急停。

## 6. 参数、停止与恢复

`wuji2.yaml` 是普通 YAML，**不添加** `ros__parameters`。修改前停止手及 Tool，保存后重启生效。

| 参数 | 默认值 | 说明 |
|---|---:|---|
| `side` | `both` | `left` / `right` / `both` |
| `state_rate_hz` | `50.0` | 反馈轮询，允许 1～200 Hz |
| `kp` / `kd` | `5.0` / `0.15` | MIT 参数，分别允许 0～5 / 0～0.15 |
| `effort_limit` | `1.5` | SDK 电机 effort 限制，不是指尖力 |
| `position_ema` | `0.35` | 目标滤波系数，不是安全限位 |
| `command_timeout_sec` | `0.5` | 有效目标流开始后的超时阈值 |
| `feedback_timeout_sec` | `0.5` | 完整关节反馈超时阈值 |
| `enable_tactile` | `true` | 是否接收触觉，不自动校准 |

首次使用保留默认参数，不靠提高增益或放宽超时掩盖故障。

正常停止时，先支撑负载并进入待机，再逐侧下使能并确认 `enabled=false`，最后停止 Tool：

```bash
ros2 topic pub --once /tj/control/footkey2 std_msgs/msg/Int32 '{data: 0}'
ros2 service call /tj/hand_left2/set_enabled std_srvs/srv/SetBool '{data: false}'
ros2 topic echo /tj/hand_left2/enabled
```

看到 `data: false` 后按 `Ctrl+C` 结束监听；双手运行时也对右手执行下使能并确认。最后执行：

```bash
sudo systemctl stop apex-tool.service
```

目标流开始后超过 `command_timeout_sec` 未收到目标会锁定保持，迟到的指令不会自动恢复。关节反馈超过 `feedback_timeout_sec` 未更新时会请求下使能，恢复反馈也不会自动上使能。排除断流后，重新进入模式 0，显式下使能、上使能，确认状态后再进入目标模式。进程被强制终止或通信故障时，软件不能保证下使能命令到达硬件；危险时使用硬件急停或断能。

## 7. 故障排查

| 现象 | 检查内容 |
|---|---|
| 找不到某侧 Topic | 供电、网线、IP / 掩码、发现报文、`side`、SN 和 Tool 日志；只接一侧时另一侧缺失正常 |
| 有反馈但不动作 | `enabled`、模式、输入 Topic、目标格式、超时锁定 |
| 使能失败或状态未变 | 模式 0、20 关节完整新鲜反馈和诊断日志；不要绕过使能检查 |
| 手套有数据但不跟随 | 手套是否发布 ROS 20 关节角、模式是否为 1，是否与 SDK 直驱冲突 |
| 没有触觉数据 | 硬件传感器、`enable_tactile` 以及设备是否上报 |
| Home 无效 | 文件路径、rad 单位、20 个有效角度及锁定状态 |

联系支持时提供接线、左右手型号 / SN、系统及包版本、首条完整报错和只读检查输出；发送前隐去无关敏感信息：

```bash
dpkg-query -W gento-apex-tool
systemctl status apex-tool.service --no-pager
journalctl -u apex-tool.service -n 120 --no-pager
ros2 topic list
ros2 topic info /tj/hand_left2/joint_states -v
```
