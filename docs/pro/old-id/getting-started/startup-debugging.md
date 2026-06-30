---
title: 启动与调试
sidebar_position: 2
---

# 启动与调试

## 目录

1. [启动遥操系统](#1-启动遥操系统)
2. [上位机软件操作](#2-上位机软件操作)
3. [常见配置](#3-常见配置)
4. [安装与更新](#4-安装与更新)
5. [故障排查与安全注意事项](#5-故障排查与安全注意事项)
6. [ROS Topics 参考](#6-ros-topics-参考)

---

## 1. 启动遥操系统

### 1.1 SSH 登录 Orin 并启动后端

在使用机器人前，通过 SSH 登录 Orin 控制器并执行系统初始化脚本：

```bash
ssh marvin@192.168.10.123
# 密码：1234
cd /opt/kernelmind/apex
./bringup_RM.sh
```

![SSH 登录并启动机器人后端](/img/pro/quick-start/launch_backend_terminal.png)

> 使用 MobaXterm 通过 SSH 连接时，需取消勾选 `X11-Forwarding`，否则可能导致相机采集超时或 VR 视野白屏。

### 1.2 打开 KernelMind Apex 遥操软件

电脑端遥操软件按操作系统选择对应安装包：

| 系统 | 安装包 |
|---|---|
| Ubuntu | `KernelMind-Apex-<version>_amd64.AppImage` |
| Windows | `React ROS App <version>.exe` |
| Mac | `React ROS App-<version>-arm64.dmg` |

连接步骤：

1. 输入 Orin IP：`192.168.10.123`。
2. 点击 `Confirm`。
3. 点击 `Start Robot` 启动机器人。
4. 点击前端 `Home`（中文界面可能显示为“家”或“复位”）按钮，使机器人进入遥操姿态。
5. 点击 `Impedance Mode` 进入关节阻抗模式。
6. 速度模式可选 `Slow` / `Fast`，只能在复位或待机状态下设置。

![KernelMind Apex 遥操软件连接](/img/pro/quick-start/launch_apex_teleop_app.png)

头显操作说明：

- [Meta Quest 头显操作说明](/xr-teleop/meta)
- [Pico 头显操作说明](/xr-teleop/pico)

## 2. 上位机软件操作

### 2.1 控制模式

机器人启动后可切换三种控制模式：

| 模式 | 用途 |
|---|---|
| 待机模式 | 初始化、错误恢复，不遥操时建议切换到该模式 |
| 位置模式 | 精确位置控制 |
| 阻抗模式 | 力控交互、拖动示教、遥操控制（遥操时使用） |

连接并启动机器人后，需先点击前端 `Home`（或“家”“复位”）按钮，使机器人进入遥操姿态，再进入阻抗模式或开始遥操。

![遥操软件控制模式](/img/pro/software/control_modes.png)

### 2.2 速度调节

- `Slow`：较慢移动速度
- `Fast`：较快移动速度

速度只允许在**待机模式**下切换。

![速度调节](/img/pro/software/speed_control.png)

### 2.3 数据录制

1. 插入标签为 `BAG_STORAGE` 的 U 盘。
2. 点击主面板 **数据录制**。
3. 点击 **开始录制**。
4. 再次点击变为红色的 **停止录制** 按钮停止。

数据保存到 `BAG_STORAGE` U 盘，目录格式为 `my_bag-年-月-日-时-分-秒`：

- `data/`：ROS bag 数据
- `video/`：MP4 视频

![数据录制功能](/img/pro/software/data_recording.png)

### 2.4 复位与实机回放

**复位**：遥操或实机回放后点击 **复位**，机械臂回到默认 Home 点。

![复位功能](/img/pro/software/reset.png)

**实机回放**：

1. 点击主面板 **实机回放** 卡片。
2. 点击右上角 **选择文件**。
3. 选择可用 bag 文件。
4. 点击 **播放**，机械臂执行录制数据中的动作。

> 遥操时不能回放，回放时不能遥操。

![实机回放功能](/img/pro/software/playback.png)

### 2.5 夹爪重启与日志

夹爪断连或热插拔后，点击 **夹爪重启** 恢复夹爪状态。

![夹爪重启功能](/img/pro/software/gripper_restart.png)

日志默认保存在 Orin 上：

```text
~/.ros/log
```

![操作日志位置](/img/pro/software/log_location.png)

## 3. 常见配置

### 3.1 不使用官方摄像头或夹爪

进入 launch 文件目录，并给目标文件添加写权限：

```bash
cd /opt/kernelmind/apex/install/node_manager/share/node_manager/launch
sudo chmod 666 bringup_all_dm_m6.launch.py
```

根据实际选配情况，选择性注释掉 `dm_gripper`（夹爪）和 `quadcam`（解串板）相关行。

![不使用官方摄像头和夹爪](/img/pro/quick-start/config_disable_camera_gripper.png)

### 3.2 修改机器人 IP / 负载等参数

常见配置文件路径：

```text
/opt/kernelmind/apex/install/marvin_ros_control/share/marvin_ros_control/config
/opt/kernelmind/apex/install/marvin_teleop/share/marvin_teleop/config
```

如文件只读，先执行：

```bash
sudo chmod 666 <文件名>
```

机器人 IP 默认出厂值为 `192.168.10.190`。其他参数需结合实际使用情况，与技术支持人员确认后再修改。

![修改配置参数](/img/pro/quick-start/config_parameters.png)

### 3.3 修改 Orin 连接双臂 IP

修改以下文件：

```text
/opt/kernelmind/apex/install/marvin_ros_control/share/marvin_ros_control/config/robot_param_m6.yaml
```

字段：`robot_ip`，默认值 `192.168.10.190`。这个 IP 是 Orin 连接双臂控制板使用的配置类 IP，需与双臂控制板 IP 一致。

![修改 Orin 连接双臂 IP](/img/pro/quick-start/config_orin_robot_ip.png)

### 3.4 修改头显 Apex 连接 IP

头显开机后，打开未知来源中的 Apex 软件，按左手柄菜单键唤出配置界面：

- 第 1 个输入项：身高，影响虚拟手柄对齐高度，例如 `1.65` 表示 165 cm。
- 第 2 个输入项：连接 Orin 的 IP，一般为 `192.168.10.123`。

![修改头显 Apex 连接 IP](/img/pro/quick-start/config_headset_ip.png)

### 3.5 修改 TCP 位置

当前 TCP 默认为手臂法兰盘末端沿 `Z+` 方向偏移 `50 mm`。正常情况下无需修改，如需修改，编辑：

```text
/opt/kernelmind/apex/install/marvin_teleop/share/marvin_teleop/config/mjcf/marvin_pro_mink.xml
```

需要修改的字段：

- 左臂：约第 86 行，`tool` 偏移 `0 0 0.05`。
- 右臂：约第 138 行，`tool` 偏移 `0 0 0.05`。

![TCP 配置文件位置](/img/pro/quick-start/config_tcp_file.png)

### 3.6 修改 Home 点

Home 点是机器人复位点，也可以理解为遥操初始位置。Home 点需要同时修改两处：

```text
/opt/kernelmind/apex/install/marvin_teleop/share/marvin_teleop/config/mjcf/marvin_pro_mink.xml
/opt/kernelmind/apex/install/marvin_teleop/share/marvin_teleop/config/robot_param_m6.yaml
```

两个文件均为 14 个参数：前 7 个为左臂 Home 点，后 7 个为右臂 Home 点，单位为弧度。

![Home 点 MJCF 修改位置](/img/pro/quick-start/config_home_xml.png)

![Home 点 YAML 修改位置](/img/pro/quick-start/config_home_yaml.png)

> 修改 IP、负载、刚度、阻尼、Home 点、TCP 偏移前，建议先备份原始配置文件。

### 3.7 脚踏板安装与配置

Orin 需联网下载依赖：

```bash
sudo apt-get install libhidapi-dev
cd ~
git clone https://github.com/rgerganov/footswitch.git
cd footswitch
make
sudo make install
footswitch -1 -m shift -k left -3 -m shift -k right
```

若提示 `cannot find footswitch`，检查脚踏板 USB 是否已插入 Orin，重新插拔后再试。

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

### 3.8 增量遥操模式

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

## 4. 安装与更新

### 4.1 安装头显 APK

Orin 需连接 WiFi 以下载 ADB 工具：

```bash
sudo apt update
sudo apt install android-tools-adb -y
adb version
```

连接头显：

1. 使用 Type-C 数据线连接头显和 Orin。
2. 佩戴头显，在头显内允许 USB 调试。
3. 在 Orin 执行 `adb devices`。
4. 若显示 `device`，表示连接成功。

```bash
adb devices
adb shell pm list packages | grep Apex
adb uninstall <旧包名>
adb install -r KernelMind_Apex_meta_260410.apk
```

![安装 Meta 头显 APK](/img/pro/quick-start/install_headset_apk_terminal.png)

### 4.2 安装 Orin KernelMind 系统

将 deb 包拷贝到 Jetson，例如放到 `~/Downloads`。

```bash
sudo apt remove kernelmind_apex
cd ~/Downloads
sudo apt install ./kernelmind-apex_<version>_arm64.deb
```

安装完成后重新登录，或手动加载环境：

```bash
source /etc/profile.d/kernelmind_apex.sh
ros2 pkg list | grep -E 'marvin|gmsl|node_manager'
```

![安装 Orin KernelMind 系统](/img/pro/quick-start/install_deb_terminal.png)

### 4.3 配置网络参数

下面以 `eth0` 和 `192.168.10.123/24` 为例，按现场网段替换：

```bash
nmcli device status
sudo nmcli con add type ethernet ifname eth0 con-name apex-robot-net \
  ipv4.method manual ipv4.addresses 192.168.10.123/24
sudo nmcli con up apex-robot-net
```

如果已有连接配置，直接修改：

```bash
sudo nmcli con mod apex-robot-net ipv4.method manual ipv4.addresses 192.168.10.123/24
sudo nmcli con up apex-robot-net
```

如果局域网内有独立路由器（默认 `192.168.10.1`），DHCP 的 `option routers` 应填写路由器地址。只有在 Orin 充当软路由并直接提供 DHCP 时，才填写 Orin 地址。

若改为其他网段，例如 `6.6.7.x`，需同时确认 Orin 自身网卡已设置为同网段静态 IP，例如 `6.6.7.123`，否则 DHCP 服务可能无法监听该网卡。

### 4.4 修改 QuickView / 相机参数

QuickView 相机配置文件安装在：

```text
/opt/kernelmind/apex/install/gmsl_quadcam/share/gmsl_quadcam/config/quad_csi_quickview.yaml
```

常见字段：

```yaml
quad_csi_quickview:
  ros__parameters:
    signal_url: "ws://192.168.10.123:8554"
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

## 5. 故障排查与安全注意事项

### 5.1 常见问题

| 现象 | 检查项 |
|---|---|
| VR 头显画面白屏 | 检查 MobaXterm 是否关闭 `X11-Forwarding`，检查相机服务和信令地址 |
| 启动时报错 | 检查 `robot_param_m6.yaml` 中 `K`、`D` 等参数是否保留浮点格式，例如 `6.0` |
| 相机没有画面 | 检查 `/dev/video*`、相机线束、解串板供电、sensor-id 和 `quad_csi_quickview.yaml` |
| VR 或上位机连不上信令 | 检查 `signal_url` 是否为 Orin 控制网 IP，例如 `ws://192.168.10.123:8554` |
| 机器人不响应控制 | 检查急停、电控电源、驱动器状态、ROS 节点和 target pose 是否正常更新 |
| deb 安装失败 | 执行 `sudo apt update`、`sudo apt install -f` 后重新安装 |

常用检查命令：

```bash
ip addr
ip route
ping 192.168.10.123
ros2 node list
ros2 topic list
ros2 service list
ls /dev/video*
journalctl -xe
ls ~/.ros/log
```

### 5.2 安全注意事项

1. 遥操前确认急停按钮、控制器供电、通信网线、U 盘、头显电量均正常。
2. 不遥操时切换待机模式，避免误触侧键或脚踏板导致机器人运动。
3. 增量模式下虽不需要红蓝手柄对齐，但进入遥操前手的位置仍应与机械臂夹爪当前位置大致一致。
4. 使用脚踏板时，禁止踩住使能的同时按右手摇杆菜单键。
5. 修改 IP、负载、刚度、阻尼、Home 点、TCP 偏移前，应备份原始配置文件。
6. 头显没电、异常断电或关机后，应立即停止遥操操作。

## 6. ROS Topics 参考

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
