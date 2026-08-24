---
title: 配置修改
sidebar_position: 1
---

# Apex 遥操系统配置修改

本文介绍 Marvin Pro、Gento Skye 和 Gento Luna 交付系统中允许客户查看或修改的常用配置。不同批次的软件包、控制器和末端配置可能不同，实际参数以设备交付清单和当前安装版本为准。

:::warning 修改前须知

- 停止遥操和数据录制，并确保机器人处于安全状态。
- 一次只修改一类参数，修改前备份原文件，修改后先进行无动作验证。
- 不要使用其他机型或其他交付批次的配置文件整体覆盖当前配置。
- 控制增益、QP 参数、碰撞模型和标定参数不属于客户常规配置，禁止自行修改。

:::

## 控制器默认登录凭据

| 控制器 | 默认 IP | 用户名 | 默认密码 |
|---|---|---|---|
| 天准 | `6.6.7.100` | `nvidia` | `nvidia` |
| 灵境 Thor | `6.6.7.100` | `user` | `1` |

以上仅为出厂默认值。现场修改过网络或账号时，以设备交付配置为准。不要将控制器 SSH 端口直接暴露到公网；修改默认密码前应确认不会影响自动部署、远程维护或交付脚本。

## 1. 确认当前生效配置

配置文件可能同时存在于源码目录和安装目录中。运行中的服务通常读取安装目录，修改前应先确认服务和软件包实际使用的路径。

```bash
source /etc/apex/apex_ros_env.sh

ros2 pkg prefix marvin_ros_control
ros2 pkg prefix marvin_teleop
ros2 pkg prefix marvin_qp_controller

systemctl cat apex-robot.service
systemctl cat apex-teleop.service
systemctl cat apex-camera.service
```

查看当前全局配置：

```bash
grep -Ev '^\s*(#|$)' /etc/apex/apex.env
```

如某个软件包或服务不存在，应以当前设备中的服务名称和交付说明为准，不要新建同名服务代替。

## 2. 修改与备份方法

将 `CONFIG_FILE` 替换为已确认的实际配置文件路径：

```bash
CONFIG_FILE=/实际路径/配置文件.yaml
sudo cp "$CONFIG_FILE" "${CONFIG_FILE}.bak.$(date +%Y%m%d_%H%M%S)"
sudoedit "$CONFIG_FILE"
```

编辑 YAML 文件时只使用空格缩进，不要使用 Tab。不要手动修改自动生成的 `/etc/apex/dnsmasq.conf`，也不要直接编辑 `/etc/apex/apex_ros_env.sh`。

## 3. 客户可配置项目

### 3.1 全局环境配置

全局配置文件为 `/etc/apex/apex.env`。

| 参数 | 用途 | 修改要求 |
|---|---|---|
| `ROS_DOMAIN_ID` | ROS 2 通信域 | 需要通信的控制器、上位机和开发机必须保持一致 |
| `ROS_LOCALHOST_ONLY` | 是否仅允许本机通信 | 跨设备通信时应为 `0` |
| `APEX_DNSMASQ_INTERFACE` | 头显/控制网络使用的网卡 | 必须填写系统中真实存在的网卡名 |
| `APEX_DNSMASQ_HOST_IP` | DHCP 服务所在网卡的主机地址 | 必须与该网卡实际静态 IP 一致 |
| `BAG_STORAGE_ROOT` | 数据录制保存目录 | 目录及挂载设备必须存在且可写 |
| `APEX_TOOL_TYPE` | 末端类型 | 常用值为 `dm`、`zy` 或 `none`，必须与实物及安装包一致 |
| `APEX_TELEOP_MODE` | 遥操输入模式 | 常用值为 `controller` 或 `dexhand`，按交付配置选择 |
| `APEX_GLOVE_MODE` | 手套模式 | 仅在配套手套和软件已安装时启用 |
| `APEX_USE_RVIZ` | 是否随服务启动 RViz | 交付环境通常保持 `false` |

以下参数用于识别产品和计算平台，客户可以查看，但修改前应联系技术支持确认当前版本支持的取值：

- `APEX_ROBOT_PLATFORM`：产品平台，例如 `pro` 或 `gento`。
- `APEX_COMPUTE_PLATFORM`：计算平台，取值随交付版本变化。
- `APEX_ROBOT_MODEL`：具体机器人型号；Skye 与 Luna 的配置不可互换。
- `APEX_ROS_SETUP`、`APEX_WS_SETUP`：ROS 和工作空间环境路径，不应在常规使用中修改。

### 3.2 机器人地址

机器人控制配置通常位于：

```text
/opt/kernelmind/apex/install/marvin_ros_control/share/marvin_ros_control/config/
```

其中 `robot_ip` 必须与机器人控制器的实际地址一致。不同产品和交付批次的地址可能不同，不应直接套用其他设备的示例 IP。修改后先确认网络可达，再重启机器人控制服务和 Teleop 服务。

控制周期、关节顺序、前馈参数、Kp/Kd 和末端动力学参数不得由客户自行修改。

### 3.3 头显与 ROS 2 网络

修改网络参数时同时检查以下项目：

1. 头显、控制器和上位机位于约定网段。
2. `APEX_DNSMASQ_INTERFACE` 对应头显实际连接的网口。
3. `APEX_DNSMASQ_HOST_IP` 与该网口的静态 IP 一致。
4. 参与通信的设备使用相同的 `ROS_DOMAIN_ID`。
5. 跨设备通信时 `ROS_LOCALHOST_ONLY=0`。

只修改 DHCP 地址池而未给对应网卡配置同网段静态 IP，会导致 DHCP 服务无法在该接口上监听。网络地址应按设备接线说明和交付网络表填写。

### 3.4 相机通道

相机配置通常位于：

```text
/opt/kernelmind/apex/install/gmsl_quadcam/share/gmsl_quadcam/config/
```

先确认相机服务实际加载的文件：

```bash
systemctl cat apex-camera.service
grep -Rns 'camera_sources' /opt/kernelmind/apex/install/gmsl_quadcam/share/gmsl_quadcam/config/
```

客户可在技术支持确认通道编号后修改以下项目：

- `camera_sources.head_left`、`head_right`、`hand_left`、`hand_right`：相机来源；未安装的通道设置为 `none`。
- `flip_180_option`（旧版本可能为 `flip_180`）：画面旋转方向。
- `enable_compressed_pub`：是否发布压缩图像。

不同控制器的 CSI 编号不一定相同，应以单相机测试结果为准。相机内参、曝光、触发方式和硬件同步参数属于标定配置，不应自行修改。

### 3.5 数据录制目录

优先通过 `/etc/apex/apex.env` 中的 `BAG_STORAGE_ROOT` 修改录制目录。修改后检查目录是否存在、可写且剩余空间充足：

```bash
test -d "$BAG_STORAGE_ROOT" && test -w "$BAG_STORAGE_ROOT" && echo writable
df -h "$BAG_STORAGE_ROOT"
```

录制与回放配置通常位于：

```text
/opt/kernelmind/apex/install/recording_playback_nodes_py/share/recording_playback_nodes_py/config/recording_playback.yaml
```

Topic 白名单和回放列表只有在确认消息类型及上下游兼容性后才能修改。Gento 回放链路与标准录制节点可能不同，不要混用两套配置。

### 3.6 末端类型

通过 `APEX_TOOL_TYPE` 选择已安装的末端类型。配置修改后，应确认对应驱动已安装且只启动一个末端控制节点，避免服务启动和手动启动同时占用设备。

电机 ID、位置范围、电流限制以及末端 Kp/Kd 参数需要与实物和标定数据一致，应由技术支持修改。

## 4. 重启生效

先使用 `systemctl list-unit-files 'apex-*'` 确认设备中存在的服务，再按修改内容重启：

| 修改内容 | 通常需要重启 |
|---|---|
| 产品、型号、ROS 域 | Robot、Teleop；相机或末端受影响时一并重启 |
| 机器人 IP | Robot，然后重启 Teleop |
| 遥操与网络参数 | Teleop；涉及 DHCP 时同时重启交付版本对应的网络服务 |
| 相机通道 | Camera |
| 录制目录或 Topic 列表 | 承载录制功能的服务，通常为 Teleop |
| 末端类型 | Tool/末端服务和 Teleop |

常用命令示例：

```bash
sudo systemctl restart apex-robot.service
sudo systemctl restart apex-teleop.service
sudo systemctl restart apex-camera.service
```

如果当前设备使用不同服务名称，应使用 `systemctl cat` 查询到的实际服务，不要照搬示例创建服务。

## 5. 修改后验证

### 5.1 无动作验证

```bash
source /etc/apex/apex_ros_env.sh

systemctl --no-pager --full status apex-robot.service apex-teleop.service
ros2 node list
ros2 topic echo /tj/info/robot_info --once
ros2 topic echo /tj/info/arm_state --once
ros2 topic echo /tj/info/robot_state --once
ros2 topic echo /tj/joint_states --once
ros2 topic hz /tj/joint_states
```

相机和末端按设备实际接口验证：

```bash
systemctl --no-pager --full status apex-camera.service
ros2 topic list -t | grep '^/quad_tile/'
ros2 topic echo /quad_tile/jpeg/compressed --once
ros2 topic echo /tj/info/gripper_feedback_L --once
```

部分 Topic 只存在于特定产品或末端配置中，以当前设备发布结果为准。

### 5.2 低风险动作验证

1. 清空机器人工作空间，确保急停可立即操作。
2. 检查上位机、相机和状态反馈均正常。
3. 依次执行 Ready/Home，并观察是否出现错误或异常运动。
4. 从小幅度、单臂动作开始，再验证双臂；Gento 最后验证躯干动作。
5. 测试停止、重启和断线恢复。

## 6. 禁止自行修改的配置

以下配置影响机器人稳定性、安全边界或标定结果，仅允许经过培训的工程人员修改：

- 机械臂、躯干和夹爪的 Kp/Kd、PD、前馈和电流限制。
- QP 任务权重、速度限制、碰撞阈值、碰撞对、CoM/ZMP 参数。
- 关节顺序、SDK 模式枚举和控制周期。
- MJCF、SRDF、URDF、MvKDCfg 等机器人模型文件。
- 相机内参、外参、曝光、触发和硬件同步配置。
- systemd 服务定义、launch 文件和自动启动脚本。

需要修改上述项目时，请向技术支持提供产品型号、控制器、末端类型、软件版本、目标配置、服务日志和原配置备份。

遇到启动、网络或设备识别问题，可继续查看[常见问题与速查](/advanced/troubleshooting)。
