---
title: 启动与调试
sidebar_position: 2
---

# 启动与调试

## 目录

1. [系统概述](#1-系统概述)
2. [快速开始](#2-快速开始)
3. [界面布局](#3-界面布局)
4. [功能操作](#4-功能操作)
5. [常见配置](#5-常见配置)
6. [安装与更新](#6-安装与更新)
7. [故障排查与安全注意事项](#7-故障排查与安全注意事项)
8. [ROS Topics 参考](#8-ros-topics-参考)

---

## 1. 系统概述

Apex Teleop 是机器人遥操作控制台，支持实时 3D 可视化、运动控制、摄像头画面、数据录制与回放。

**支持的机器人型号：** Marvin Pro、Gento 系列（Skye/Luna 等）

**通信架构：** 前端通过统一后端 API（端口 8080）与 ROS 2 控制节点通信。

---

## 2. 快速开始

### 2.1 登录天准电箱

上位机与电箱接入同一网段后，先将上位机有线网卡 IP 设置为 `6.6.7.xxx` 网段，例如 `6.6.7.165`，再测试电箱网络：

```bash
ping 6.6.7.100
```

通过 SSH 登录天准电箱：

```bash
ssh nvidia@6.6.7.100
# 密码：nvidia
```

如需直接查看控制器界面，也可以使用 HDMI 高清线将显示器直接连接至电箱，并接入键盘、鼠标进行本地操作。

### 2.2 初始化相机

每次电箱重新上电后，需要先初始化相机：

```bash
cd ~/cam_geac
./rb_camera.sh
```

等待约 20 秒，相机初始化完成后再启动遥操系统。

### 2.3 启动遥操系统

进入 Apex 目录并执行启动脚本：

```bash
cd /opt/kernelmind/apex
./bringup_RM.sh
```

按回车键后，系统将自动启动遥操相关服务，待启动完成后即可进行机器人操作。

> 使用 MobaXterm 通过 SSH 连接时，需取消勾选 `X11-Forwarding`，否则可能导致相机采集超时或 VR 视野白屏。

### 2.4 启动前端应用

打开新版 Apex Teleop 前端，确保上位机与天准核心控制器处于同一局域网内。

### 2.5 配置机器人 IP

1. 点击顶部状态栏右侧的 IP 地址区域。
2. 输入天准核心控制器 IP 地址：`6.6.7.100`。
3. 按 Enter 或点击「确认」按钮。
4. 页面自动刷新并连接到新地址。
5. 启动 Robot 模块后，点击前端 `Home`（中文界面可能显示为“家”或“复位”）按钮，使机器人进入遥操姿态，再继续启动 Teleop 或进入遥操操作。

> **注意：** 上位机、天准核心控制器、机器人控制器和头显必须处于同一局域网内，且 IP 在同一网段。

头显操作说明：

- [Meta Quest 头显操作说明](/xr-teleop/meta)
- [Pico 头显操作说明](/xr-teleop/pico)

---

## 3. 界面布局

![Marvin Pro Apex Teleop 界面总览](/img/pro/new-id/apex-teleop-pro-overview.png)

> 截图中的 IP 仅为界面示例。Marvin Pro 现场配置以天准核心控制器 IP `6.6.7.100` 为准。

| 操作步骤 | 操作区域 | 说明 |
|------|----------|------|
| 1 | IP 地址输入框 | 输入天准核心控制器 IP：`6.6.7.100`，按 Enter 确认 |
| 2 | 模块控制条 | 按需启动 Camera、Robot、Teleop、dnsmasq 等后端模块 |
| 2.1（可选） | 摄像头画面 | Camera 模块启动后显示相机画面，未启动时显示“Camera 模块未启动” |
| 3 / 4 | 机器人模式 | 启动机器人控制，点击 Home 进入遥操姿态，并切换待机模式、位置模式、阻抗模式 |
| 5（可选） | 3D 查看器 | 实时显示机器人模型和各关节角度 |
| 6（可选） | 数据录制 | 录制遥操作数据 |
| 7（可选） | 实机回放 | 选择数据包并执行实机回放 |
| 8（可选） | 左侧导航栏 | 在主界面与日志页面之间切换 |

### 3.1 顶部状态栏

| 指示灯 | 含义 |
|--------|------|
| Robot | 绿色=机器人控制服务运行中 |
| Camera | 绿色=摄像头服务运行中 |
| Teleop | 绿色=遥操作服务运行中 |
| Net | 绿色=DHCP 网络服务运行中 |
| VR | 绿色=VR 控制器已连接 |

右上角提供刷新、语言切换和 IP 地址输入框。右侧连接状态条显示机器人连接、VR 状态以及相关模块状态。

### 3.2 3D 机器人查看器

- 实时展示机器人各关节角度
- 支持鼠标旋转、缩放、平移视角
- 用于确认机器人当前姿态、关节角度和遥操前初始状态

### 3.3 模块控制条

| 模块 | 功能 | 说明 |
|------|------|------|
| Camera | 启动摄像头 | 启动后右侧显示相机画面 |
| Robot | 启动机器人控制 | 启动后可进入机器人控制模式 |
| Teleop | 启动遥操作 | Robot 未就绪时可能显示 Locked |
| dnsmasq | 启动网络服务 | 用于头显等设备的网络地址分配，按现场配置启动 |

> Teleop 启动需要 Robot 已处于运行状态，否则按钮显示 Locked。

### 3.4 摄像头画面

- 显示 GMSL 四合一摄像头画面（`quad_tile` 主题）
- Camera 模块未启动时显示提示文字
- 底部显示码率、丢包数和 FPS 等实时状态

---

## 4. 功能操作

### 4.1 机器人模式状态卡片

`机器人模式` 卡片用于查看机器人控制入口状态，并保留控制模式状态显示和夹爪重启入口。

| 区域 | 说明 |
|------|------|
| `Service Off` / 启动入口 | 显示机器人控制服务是否可用 |
| `待机模式` / `位置模式` / `阻抗模式` | 显示或切换机器人控制模式，服务未就绪时不可用 |
| 提示文本 | 显示当前操作前置条件，例如需要先启动机器人 |
| `Home` / `家` / `复位` | 连接并启动机器人后，点击该按钮使机器人进入遥操姿态 |
| `重启（夹爪）` | 重启夹爪控制器 |

### 4.2 数据录制

1. 在录制名称输入框中填写本次录制名称。
2. 点击 **开始录制** 开始录制。
3. 录制中按钮会显示录制状态。
4. 点击 **停止录制** 停止并保存。

> 录制文件保存在天准核心控制器的指定目录中。

### 4.3 数据回放

1. 点击 **选择文件**，选择要回放的数据包。
2. 点击 **播放** 开始回放。
3. 点击 **暂停** 暂停当前回放。
4. 点击 **停止** 停止回放。
5. 如需调整回放速度，使用速度下拉框选择倍速。
6. 3D 查看器会同步显示回放的关节数据。

**回放控制：**

| 控件 | 功能 |
|------|------|
| 选择文件 | 选择回放数据包 |
| 播放 | 开始回放 |
| 暂停 | 暂停当前回放 |
| 停止 | 停止回放 |
| 速度 | 调整回放倍速 |

### 4.4 日志查看

1. 点击左侧导航栏切换到 **Log** 页面。
2. 顶部下拉选择要查看的模块（Robot/Teleop/Camera/DNSMasq/System）。
3. **LIVE** 指示灯绿色表示实时接收日志。
4. 实时日志模式下自动滚动到底部（Follow）。
5. 手动滚动日志会锁定位置（Locked），点击恢复跟随。

**快捷键：**

- `Ctrl + A`：选中所有日志文本
- `Clear`：清空当前日志
- `Fetch`（System 模式）：获取系统错误日志

### 4.5 多语言切换

点击顶部右侧地球图标，选择语言：

- English（英文）
- 中文（简体中文）
- 日本語（日文）

## 5. 常见配置

### 5.1 不使用官方摄像头或夹爪

进入 launch 文件目录，并给目标文件添加写权限：

```bash
cd /opt/kernelmind/apex/install/node_manager/share/node_manager/launch
sudo chmod 666 bringup_all_dm_m6.launch.py
```

根据实际选配情况，选择性注释掉 `dm_gripper`（夹爪）或 `quadcam`（相机）相关行。

![不使用官方摄像头和夹爪](/img/pro/quick-start/config_disable_camera_gripper.png)

### 5.2 修改机器人 IP / 负载等参数

常见配置文件路径：

```text
/opt/kernelmind/apex/install/marvin_ros_control/share/marvin_ros_control/config
/opt/kernelmind/apex/install/marvin_teleop/share/marvin_teleop/config
```

如文件只读，先执行：

```bash
sudo chmod 666 <文件名>
```

机器人 IP 默认出厂值为 `6.6.7.190`。其他参数需结合实际使用情况，与技术支持人员确认后再修改。

![修改配置参数](/img/pro/quick-start/config_parameters.png)

### 5.3 修改天准控制器连接双臂 IP

修改以下文件：

```text
/opt/kernelmind/apex/install/marvin_ros_control/share/marvin_ros_control/config/robot_param_m6.yaml
```

字段：`robot_ip`，默认值 `6.6.7.190`。这个 IP 是天准控制器连接双臂控制板使用的配置类 IP，需与双臂控制板 IP 一致。

![修改天准控制器连接双臂 IP](/img/pro/quick-start/config_orin_robot_ip.png)

### 5.4 修改头显 Apex 连接 IP

头显开机后，打开未知来源中的 Apex 软件，按左手柄菜单键唤出配置界面：

- 第 1 个输入项：身高，影响虚拟手柄对齐高度，例如 `1.65` 表示 165 cm。
- 第 2 个输入项：连接天准控制器的 IP，一般为 `6.6.7.100`。

![修改头显 Apex 连接 IP](/img/pro/quick-start/config_headset_ip.png)

### 5.5 修改 TCP 位置

当前 TCP 默认为手臂法兰盘末端沿 `Z+` 方向偏移 `50 mm`。正常情况下无需修改，如需修改，编辑：

```text
/opt/kernelmind/apex/install/marvin_teleop/share/marvin_teleop/config/mjcf/marvin_pro_mink.xml
```

需要修改的字段：

- 左臂：约第 86 行，`tool` 偏移 `0 0 0.05`。
- 右臂：约第 138 行，`tool` 偏移 `0 0 0.05`。

![TCP 配置文件位置](/img/pro/quick-start/config_tcp_file.png)

### 5.6 修改 Home 点

Home 点是机器人复位点，也可以理解为遥操初始位置。Home 点需要同时修改两处：

```text
/opt/kernelmind/apex/install/marvin_teleop/share/marvin_teleop/config/mjcf/marvin_pro_mink.xml
/opt/kernelmind/apex/install/marvin_teleop/share/marvin_teleop/config/robot_param_m6.yaml
```

两个文件均为 14 个参数：前 7 个为左臂 Home 点，后 7 个为右臂 Home 点，单位为弧度。

![Home 点 MJCF 修改位置](/img/pro/quick-start/config_home_xml.png)

![Home 点 YAML 修改位置](/img/pro/quick-start/config_home_yaml.png)

> 修改 IP、负载、刚度、阻尼、Home 点、TCP 偏移前，建议先备份原始配置文件。

### 5.7 脚踏板安装与配置

脚踏板为非标配扩展件，仅在选配动捕手套、灵巧手或脚踏使能方案时配置。

天准控制器需联网下载依赖：

```bash
sudo apt-get install libhidapi-dev
cd ~
git clone https://github.com/rgerganov/footswitch.git
cd footswitch
make
sudo make install
footswitch -1 -m shift -k left -3 -m shift -k right
```

若提示 `cannot find footswitch`，检查脚踏板 USB 是否已插入天准控制器，重新插拔后再试。

脚踏板模式启动建议使用：

```bash
cd /opt/kernelmind/apex
./bringup_RM_glove.sh
```

![脚踏板按键映射](/img/pro/quick-start/footswitch_mapping_start.png)

脚踏板遥操注意事项：

- 左右手柄的使能键无效，仅脚踏板可以使能。
- 按键 1：左右手柄一起使能。
- 按键 3：两个手臂回到 Home 点。
- 禁止在踩着使能键时按下右手摇杆菜单键，否则可能导致手臂下坠撞击。
- 不遥操时务必松脚。

### 5.8 增量遥操模式

出厂默认方式为增量位置运动。增量模式进入使能时以当前手柄位置为零位，仅将后续平移和角度变化作为增量下发，不要求对齐虚拟红蓝手柄。

如需切换运动方式，修改：

```text
/opt/kernelmind/apex/install/marvin_teleop/share/marvin_teleop/config/robot_param_m6.yaml
```

字段：

```yaml
use_incremental_control: true   # 增量模式（默认）
use_incremental_control: false  # 绝对位置模式
```

![use_incremental_control 配置](/img/pro/quick-start/incremental_control_config.png)

## 6. 安装与更新

### 6.1 安装头显 APK

天准控制器需连接 WiFi 以下载 ADB 工具：

```bash
sudo apt update
sudo apt install android-tools-adb -y
adb version
```

连接头显：

1. 使用 Type-C 数据线连接头显和天准控制器。
2. 佩戴头显，在头显内允许 USB 调试。
3. 在天准控制器执行 `adb devices`。
4. 若显示 `device`，表示连接成功。

```bash
adb devices
adb shell pm list packages | grep Apex
adb uninstall <旧包名>
adb install -r KernelMind_Apex_meta_260410.apk
```

![安装 Meta 头显 APK](/img/pro/quick-start/install_headset_apk_terminal.png)

### 6.2 安装天准控制器 KernelMind 系统

将 deb 包拷贝到天准控制器，例如放到 `~/Downloads`。

```bash
sudo apt remove kernelmind_apex
cd ~/Downloads
sudo apt install ./kernelmind_apex_<version>_<arch>.deb
```

安装完成后重新登录，或手动加载环境：

```bash
source /etc/profile.d/kernelmind_apex.sh
ros2 pkg list | grep -E 'marvin|gmsl|node_manager'
```

![安装天准控制器 KernelMind 系统](/img/pro/quick-start/install_deb_terminal.png)

### 6.3 配置网络参数

下面以 `eth0` 和 `6.6.7.100/24` 为例，按现场网段替换：

```bash
nmcli device status
sudo nmcli con add type ethernet ifname eth0 con-name apex-robot-net \
  ipv4.method manual ipv4.addresses 6.6.7.100/24
sudo nmcli con up apex-robot-net
```

如果已有连接配置，直接修改：

```bash
sudo nmcli con mod apex-robot-net ipv4.method manual ipv4.addresses 6.6.7.100/24
sudo nmcli con up apex-robot-net
```

上位机电脑网卡需设置为同网段地址，例如 `6.6.7.165`。

如果局域网内有独立路由器，DHCP 的 `option routers` 应填写路由器地址。只有在天准控制器充当软路由并直接提供 DHCP 时，才填写天准控制器地址。

### 6.4 修改 QuickView / 相机参数

QuickView 相机配置文件安装在：

```text
/opt/kernelmind/apex/install/gmsl_quadcam/share/gmsl_quadcam/config/quad_csi_quickview.yaml
```

常见字段：

```yaml
quad_csi_quickview:
  ros__parameters:
    signal_url: "ws://6.6.7.100:8554"
    vr_room_id: "10"
    quad_room_id: "11"
    camera_config:
      camera_sources:
        head_left: "csi://0"
        head_right: "csi://1"
        hand_left: "csi://4"
        hand_right: "csi://5"
```

如果某个相机暂时不用，写 `"none"`，对应画面会留空。

## 7. 故障排查与安全注意事项

### 7.1 常见问题

| 现象 | 检查项 |
|---|---|
| VR 头显画面白屏 | 检查 MobaXterm 是否关闭 `X11-Forwarding`，检查相机服务和信令地址 |
| 启动时报错 | 检查 `robot_param_m6.yaml` 中 `K`、`D` 等参数是否保留浮点格式，例如 `6.0` |
| 相机没有画面 | 检查 `/dev/video*`、森云相机端接头、手臂外露线束、sensor-id 和 `quad_csi_quickview.yaml` |
| VR 或上位机连不上信令 | 检查 `signal_url` 是否为天准控制器控制网 IP，例如 `ws://6.6.7.100:8554` |
| 机器人不响应控制 | 检查急停、电控电源、驱动器状态、ROS 节点和 target pose 是否正常更新 |
| deb 安装失败 | 执行 `sudo apt update`、`sudo apt install -f` 后重新安装 |

常用检查命令：

```bash
ip addr
ip route
ping 6.6.7.100
ros2 node list
ros2 topic list
ros2 service list
ls /dev/video*
journalctl -xe
ls ~/.ros/log
```

### 7.2 安全注意事项

1. 遥操前确认急停按钮、控制器供电、通信网线、U 盘、头显电量均正常。
2. 不遥操时切换待机模式，避免误触侧键；选配脚踏板时，也要避免误踩导致机器人运动。
3. 增量模式下虽不需要红蓝手柄对齐，但进入遥操前手的位置仍应与机械臂夹爪当前位置大致一致。
4. 使用脚踏板时，禁止踩住使能的同时按右手摇杆菜单键。
5. 修改 IP、负载、刚度、阻尼、Home 点、TCP 偏移前，应备份原始配置文件。
6. 头显没电、异常断电或关机后，应立即停止遥操操作。

## 8. ROS Topics 参考

| Topic | 功能 | Type |
|---|---|---|
| `/control/target_poseL` | 遥操时左手TCP目标点 | `geometry_msgs/msg/PoseStamped` |
| `/control/target_poseR` | 遥操时右手TCP目标点 | `geometry_msgs/msg/PoseStamped` |
| `/control/gripperValueL` | 遥操时左手柄前键value值，用于控制左手夹爪开闭 | `std_msgs/msg/Float32` |
| `/control/gripperValueR` | 遥操时右手柄前键value值，用于控制右手夹爪开闭 | `std_msgs/msg/Float32` |
| `/control/gripL` | 遥操时左手柄侧键bool值，用于在与小球对齐后，按住侧键进入遥操 | `std_msgs/msg/Bool` |
| `/control/gripR` | 遥操时右手柄侧键bool值，用于在与小球对齐后，按住侧键进入遥操 | `std_msgs/msg/Bool` |
| `/info/eef_left` | 正向运动学计算出的左臂法兰位姿 | `geometry_msgs/msg/PoseStamped` |
| `/info/eef_right` | 正向运动学计算出的右臂法兰位姿 | `geometry_msgs/msg/PoseStamped` |
| `/info/joint_feedback` | 机械臂关节反馈，左手轴1-轴7，右手轴1-轴7，频率250hz | `marvin_msgs/msg/Jointfeedback` |
| `/joint_states` | 机械臂关节位置，左手轴1-轴7，右手轴1-轴7，频率50hz | `std_msgs/msg/JointState` |
| `/robot_description` | 机械臂URDF可视化 | `std_msgs/msg/String` |
| `/usb_cam_0/image_raw` | 双目相机视频流 | `sensor_msgs/msg/Image` |
| `/gripper/feedback_L_err` | 左手夹爪错误码，用于监测夹爪状态 | `std_msgs/msg/Int32MultiArray` |
| `/gripper/feedback_R_err` | 右手夹爪错误码，用于监测夹爪状态 | `std_msgs/msg/Int32MultiArray` |
| `/info/arm_state` | 机械臂状态信息 | `std_msgs/msg/Int16MultiArray` |
| `/info/collision_marker` | 机械臂末端轨迹预测 | `visualization_msgs/msg/MarkerArray` |
| `/info/collision_statusA` | 左臂末端轨迹碰撞判断bool值 | `std_msgs/msg/Bool` |
| `/info/collision_statusB` | 右臂末端轨迹碰撞判断bool值 | `std_msgs/msg/Bool` |
