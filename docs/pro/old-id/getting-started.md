---
title: 快速入门
sidebar_position: 2
---

# 快速入门

本文将 PRO 的硬件接线、遥操系统启动、常见配置、故障排查与安装使用流程合并在一起，适合现场部署和首次调试时按顺序检查。

## 目录

- [1. 硬件接线](#1-硬件接线)
- [2. 启动遥操系统](#2-启动遥操系统)
- [3. 常见配置](#3-常见配置)
- [4. 故障排查与安全注意事项](#4-故障排查与安全注意事项)
- [5. 安装使用教程](#5-安装使用教程)

## 1. 硬件接线

本节介绍 Marvin Pro 双臂机器人系统的供电接线、通信网络连接、初始姿态设置，以及 Orin 与相机解串板的安装步骤。

> 接线前务必断开总电源。

### 1.1 双臂供电与通信接线

在断开总电源的情况下完成以下接线：

1. 将双臂机器人 `48V+` / `48V-` 接入 `220V-48V` 开关电源的直流输出正负极。
2. 将泄放模块 `48V+` / `48V-` 并接至同一 48V 电源正负极。
3. 将急停按钮盒串联接入机器人急停控制回路。
4. 将左臂、右臂 `EthCart` 网口分别连接至机器人控制器对应网口。
5. 将 `12V` 电源连接至机器人控制器电源输入端。
6. 将上行网线（1号网线）连接至机器人控制器网络接口。

实物接口参考：

![机器人接线实物对照图](/img/pro/hardware_wiring_interfaces.png)

> **注意**
>
> * 接线前请确认总电源已断开。
> * `48V+` 与 `48V-` 极性必须对应正确，严禁反接。
> * 所有接线完成后，再接通电源进行检查。
> * 网线接口及电源接口应插接牢固，避免接触不良。
> * 上电时应先接通 `220V-48V` 开关电源，再接通机器人控制器 `12V` 电源。
> * 首次使用或更换控制器后，请确认机器人控制器 IP 地址为 `192.168.10.190`。
> * 若控制器 IP 地址不正确，可能导致上位机无法与机器人正常通信。

### 1.2 调整至初始端平姿态

使用 [`fxstation`](/files/FxStation.exe) 或 `MarvinPlatform` 软件，将双臂调整至初始端平姿态后，再进行后续操作。下图以左臂为例展示操作界面，右臂操作步骤完全相同。

![初始端平姿态设置](/img/pro/hardware_initial_pose_ui.png)

1. **连接机器人**：输入机器人 IP 地址（默认：`192.168.10.190`），连接机器人。
2. **模式切换**：在软件中，将机械臂切换至 **位置模式**。
3. **进入跟随模式**：切换至 **关节跟随** 模式。
4. **写入点位**：在关节跟随模式下，先回零位，按以下目标角度值写入点位：
   * **左臂**：`[0, 0, 0, 0, 0, 0, 0]` -> `[90, -90, -90, -90, 0, 0, 0]`
   * **右臂**：`[0, 0, 0, 0, 0, 0, 0]` -> `[-90, -90, 90, -90, 0, 0, 0]`
5. **添加与运行**：点击 **加点** 按钮，将当前点位添加至轨迹列表，然后点击 **运行**，默认速度为 **20%**，使机械臂运动至目标姿态。
6. **退出软件**：运动完成后退出软件。

> **注意：**
>
> * 运行前请确认机械臂运动范围内无人员、设备或其他障碍物。

### 1.3 Orin 与相机解串板安装

开始安装前，请确认设备及附件齐全。

#### 主要设备

<table>
<tr>
<td width="75%">

| 设备 | 图片 | 数量 | 说明 |
|------|------|------|------|
| Meta Quest 3S | ![](/img/product_lists/quest3s.png) | 1 | 参考 Meta 官方网址 |
| Orin 主控 | ![](/img/product_lists/orin.png) | 1 | 参考 NVIDIA 官方网址 |
| 解串板 | ![](/img/product_lists/jiechuanban.png) | 1 | 相机接入 |
| 路由器 | ![](/img/product_lists/TPLINK.png) | 1 | 网络通信 |
| Type-C 转网口转换器 | ![](/img/product_lists/hub.png) | 1 | 网络通信 |
| U盘 | ![](/img/product_lists/Upan.png) | 1 | 遥操数据存储 |

</td>

<td width="25%" valign="top">

#### 附件

- 解串板电源转接线 x 1
- 万兆网线 x 3
- Orin 电源 x 1
- 解串板电源 x 1
- 路由器电源 x 1
- VR 充电器 x 1
- 安装螺丝 x 若干

</td>
</tr>
</table>

#### 网络连接

将以下设备通过网线连接至同一路由器：

* 网线 1：连接机器人控制器
* 网线 2：连接 Orin
* 网线 3：连接 VR 显示适配器

![网络连接实物参考](/img/pro/pro_overview_network.png)

#### 安装解串板

![主要设备](/img/pro_p12.png)

1. 拆卸 Orin 底座。
2. 安装解串板支撑柱与解串板。
3. 安装完成后复位底座螺丝。

#### 连接相机与外设

将相机线束插入解串板对应接口，并连接：

* U 盘
* 网线 2
* 解串板电源
* Orin 电源

相机接口对应关系如下：

| 解串板接口编号 | 对应相机 |
| ------- | ---- |
| 8       | 左目相机 |
| 6       | 左腕相机 |
| 7       | 右腕相机 |
| 0       | 右目相机 |

#### 上电顺序

1. 先接通解串板电源。
2. 等待约 10 秒。
3. 再接通 Orin 电源。
4. 等待约 1 分钟，Orin 完成启动。
5. 确认四个相机对应指示灯均为常亮状态。

> **注意：**
>
> * 请严格按照“解串板 -> Orin”的顺序上电。
> * 若相机指示灯未全部点亮，请检查相机线束及解串板接口连接是否正确。
> * 安装过程中注意防静电，避免触碰主板元器件。

## 2. 启动遥操系统

### 2.1 SSH 登录 Orin 并启动后端

在使用机器人前，需要通过 SSH 登录 Orin 控制器并执行系统初始化脚本。

```bash
ssh marvin@192.168.10.123
# 密码：1234
cd /opt/kernelmind/apex
./bringup_RM.sh
```

![SSH 登录并启动机器人后端](/img/pro/quick-start/launch_backend_terminal.png)

> **注意**：使用 MobaXterm 通过 SSH 连接时，需取消勾选 `X11-Forwarding`，否则可能导致相机采集超时或 VR 视野白屏。

### 2.2 打开 KernelMind Apex 遥操软件

电脑端遥操软件按操作系统选择对应安装包：

| 系统 | 安装包 |
|---|---|
| Ubuntu | `KernelMind-Apex-<version>_amd64.AppImage` |
| Windows | `React ROS App <version>.exe` |
| Mac | `React ROS App-<version>-arm64.dmg` |

打开遥操软件后按以下步骤连接：

1. 输入 Orin IP：`192.168.10.123`。
2. 点击 `Confirm`。
3. 点击 `Start Robot` 启动机器人。
4. 点击 `Impedance Mode` 进入关节阻抗模式。
5. 速度模式可选 `Slow` / `Fast`，只能在复位或待机状态下设置。

![KernelMind Apex 遥操软件连接](/img/pro/quick-start/launch_apex_teleop_app.png)

后续头显相关操作可查看同文件夹中的 VR 教学视频，例如 `MarvinPro_VR教学视频_260320.mp4`。

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

机器人 IP 默认出厂值为 `192.168.10.190`。其他项目的具体数值需结合实际使用情况，与技术支持人员确认后再修改。

![修改配置参数](/img/pro/quick-start/config_parameters.png)

### 3.3 修改 Orin 连接双臂 IP

修改以下文件：

```text
/opt/kernelmind/apex/install/marvin_ros_control/share/marvin_ros_control/config/robot_param_m6.yaml
```

字段：`robot_ip`，默认值 `192.168.10.190`。这个 IP 是 Orin 连接双臂控制板使用的配置类 IP，不是某个独立硬件 IP。

![修改 Orin 连接双臂 IP](/img/pro/quick-start/config_orin_robot_ip.png)

### 3.4 修改头显 Apex 连接 IP

头显开机后，打开未知来源中的 Apex 软件，按左手柄菜单键唤出配置界面：

- **第 1 个输入项**：身高，影响虚拟手柄对齐高度，例如 `1.65` 表示 165 cm。
- **第 2 个输入项**：连接 Orin 的 IP，一般为 `192.168.10.123`。

![修改头显 Apex 连接 IP](/img/pro/quick-start/config_headset_ip.png)

### 3.5 修改 TCP 位置

当前 TCP 默认为手臂法兰盘末端沿 `Z+` 方向偏移 `50 mm`。正常情况下无需修改，如需修改，编辑：

```text
/opt/kernelmind/apex/install/marvin_teleop/share/marvin_teleop/config/mjcf/marvin_pro_mink.xml
```

![TCP 配置文件位置](/img/pro/quick-start/config_tcp_file.png)

需要修改的字段：

- 左臂：约第 86 行，`tool` 偏移 `0 0 0.05`，即 XYZ 方向偏移，默认沿 `Z+` 方向偏移 50 mm。
- 右臂：约第 138 行，`tool` 偏移 `0 0 0.05`，即 XYZ 方向偏移，默认沿 `Z+` 方向偏移 50 mm。

![TCP 偏移 XML 修改位置](/img/pro/quick-start/config_tcp_xml.png)

### 3.6 修改 Home 点

Home 点是机器人复位点，也可以理解为遥操初始位置。在遥操软件中点击 `Home` 后，手臂会自动回到遥操初始位置。使用脚踏板扩展时，踩下第 3 个脚踏板，手臂也会自动回到遥操初始位置。

Home 点需要同时修改两处：

```text
/opt/kernelmind/apex/install/marvin_teleop/share/marvin_teleop/config/mjcf/marvin_pro_mink.xml
/opt/kernelmind/apex/install/marvin_teleop/share/marvin_teleop/config/robot_param_m6.yaml
```

第一处为 `marvin_pro_mink.xml`，约第 154 行，共 14 个参数：前 7 个为左臂 Home 点，后 7 个为右臂 Home 点，单位为弧度。

![Home 点 MJCF 修改位置](/img/pro/quick-start/config_home_xml.png)

第二处为 `robot_param_m6.yaml`，约第 11 行，同样共 14 个参数：前 7 个为左臂 Home 点，后 7 个为右臂 Home 点，单位为弧度。

![Home 点 YAML 修改位置](/img/pro/quick-start/config_home_yaml.png)

> **注意**：修改 IP、负载、刚度、阻尼、Home 点、TCP 偏移前，建议先备份原始配置文件。

### 3.7 脚踏板安装与配置

Orin 需联网下载依赖：

```bash
sudo apt-get install libhidapi-dev
```

![安装 libhidapi](/img/pro/quick-start/footswitch_hidapi_install.png)

下载并进入 footswitch SDK：

```bash
cd ~
git clone https://github.com/rgerganov/footswitch.git
cd footswitch
```

![下载 footswitch SDK](/img/pro/quick-start/footswitch_clone_sdk.png)

编译并安装：

```bash
make
sudo make install
```

![编译并安装 footswitch](/img/pro/quick-start/footswitch_make_install.png)

映射脚踏板按键：

```bash
footswitch -1 -m shift -k left -3 -m shift -k right
```

若提示 `cannot find footswitch`，检查脚踏板 USB 是否已插入 Orin，重新插拔脚踏板 USB 后再试。

脚踏板模式启动建议使用：

```bash
cd /opt/kernelmind/apex
./bringup_RM_glove.sh
```

![脚踏板按键映射](/img/pro/quick-start/footswitch_mapping_start.png)

脚踏板遥操注意事项：

- 后续遥操时，左右手柄的使能键无效，仅脚踏板可以使能。
- 按键 1：左右手柄一起使能。
- 按键 3：两个手臂回到 Home 点。
- Home 点有默认值，和遥操软件中的 Home 一致；如需修改，参考 [3.6 修改 Home 点](#36-修改-home-点)。
- **禁止**在踩着使能键时按下右手摇杆菜单键，否则可能导致手臂下坠撞击。
- 不遥操时务必松脚。

![脚踏板注意事项](/img/pro/quick-start/footswitch_safety.png)

### 3.8 增量遥操模式

遥操时，把手柄位置传给手臂有两种方式：绝对位置模式和增量位置模式。

| 模式 | 说明 |
|---|---|
| 绝对位置模式 | 需要实际手柄与头显内红蓝手柄对齐，否则使能后可能导致机械臂快速运动，甚至撞击 |
| 增量位置模式 | 进入使能时以当前手柄位置为零位，仅将后续平移和角度变化作为增量下发，不要求对齐虚拟红蓝手柄 |

出厂默认方式为增量位置运动。如需切换运动方式，修改：

```text
/opt/kernelmind/apex/install/marvin_teleop/share/marvin_teleop/config/robot_param_m6.yaml
```

字段：

```yaml
use_incremental_control: true   # 增量模式（默认）
use_incremental_control: false  # 绝对位置模式
```

文件只读时，参考前面修改 IP 的方法，用 `sudo chmod 666` 修改权限后再编辑。

![use_incremental_control 配置](/img/pro/quick-start/incremental_control_config.png)

## 4. 故障排查与安全注意事项

### 4.1 VR 头显相关

- 不建议 VR 头显通过 WiFi 接入路由器，WiFi 容易断连、传输慢，可能导致数据中断。
- 保持 VR 头显电量充足。
- 插入名为 `BAG_STORAGE` 的 U 盘后才有透传 / 录制功能。
- WiFi 密码：`12345678`。
- 工控机密码：`1234`。请不要随意改动工控机中的代码，以免出现无法预测的问题。
- 不遥操时切换待机模式，避免误触发。
- 头显异常、断电或关机后，应立即停止遥操操作。

### 4.2 启动时报错

检查是否修改过 `robot_param_m6.yaml`。`K`、`D` 等参数需保留浮点格式，例如：

- `6.0`：正确
- `6`：可能导致启动异常

### 4.3 相对控制使用注意事项

改成相对控制后，每次使用前不需要对齐红点，但仍需注意手的位置要与机械臂夹爪当前位置保持一致，再进入遥操。当前为相对控制模式时，若初始位置不一致，可能导致控制异常。

### 4.4 MobaXterm SSH 后相机白屏 / WARN

原因：MobaXterm 默认勾选了 `X11-Forwarding`，会改变远端显示环境，导致相机采集超时或 VR 视野白屏。

解决方法：取消勾选 `X11-Forwarding` 后重新 SSH 连接。

![MobaXterm 取消 X11 Forwarding](/img/pro/quick-start/troubleshooting_mobaxterm_x11.png)

### 4.5 deb 安装失败

```bash
sudo apt update
sudo apt install -f
sudo apt install ./kernelmind-apex_<version>_arm64.deb
```

确认系统为 Ubuntu 22.04 ARM64，并已安装 ROS 2 Humble 基础包。

### 4.6 网络不通

检查网卡和路由：

```bash
ip addr
ip route
ping <设备IP>
```

如果启用了 ISC DHCP，确认 `INTERFACESv4` 是正确网卡，且 Jetson 静态 IP 与 DHCP subnet 在同一网段。

### 4.7 相机没有画面

```bash
ls /dev/video*
ros2 launch gmsl_quadcam quad_csi_quickview.launch.py
```

如果日志出现 `No cameras available`，通常是相机线束、驱动、sensor-id 或相机服务未就绪。确认 `quad_csi_quickview.yaml` 中的 `camera_sources` 与实际接线一致。

### 4.8 VR 或上位机连不上信令

确认 `signal_url` 使用 Jetson 在控制网络中的 IP：

```yaml
signal_url: "ws://192.168.10.123:8554"
```

在上位机上测试端口：

```bash
ping 192.168.10.123
nc -vz 192.168.10.123 8554
```

### 4.9 机器人不响应控制

1. 检查急停、电控电源和驱动器状态。
2. 检查 ROS 节点是否都已启动（`ros2 node list`）。
3. 检查 VR/headset target pose 是否正常更新。
4. 如果控制被安全逻辑 disable，先排除连接问题，再重新 enable。

### 4.10 安全注意事项

1. 遥操前确认急停按钮、控制器供电、通信网线、U 盘、头显电量均正常。
2. 不遥操时切换待机模式，避免误触侧键或脚踏板导致机器人运动。
3. 增量模式下虽不需要红蓝手柄对齐，但进入遥操前手的位置仍应与机械臂夹爪当前位置大致一致。
4. 使用脚踏板时，**禁止**踩住使能的同时按右手摇杆菜单键。
5. 修改 IP、负载、刚度、阻尼、Home 点、TCP 偏移前，应备份原始配置文件。
6. 头显没电、异常断电或关机后，可能仍会持续发送地面信号，导致机械臂下坠，应立即停止遥操操作。

## 5. 安装使用教程

本节用于现场部署 KernelMind Apex 机器人软件，包含设备连接、deb 安装、网络参数配置、可选 ISC DHCP 配置、启动检查和卸载流程。

### 5.1 准备清单

主机与系统：

- NVIDIA Jetson，Ubuntu 22.04，ROS 2 Humble。
- 机器人本体、控制柜或电控箱、机械臂、夹爪、相机、VR 头显或上位机。
- 已发布的安装包，例如：

```bash
kernelmind-apex_1.0.31_arm64.deb
```

部署前先确认以下网络地址：

| 项目 | 示例值 | 说明 |
|---|---:|---|
| Jetson 有线网卡 | `eth0` | 连接机器人控制网络 |
| Jetson 静态 IP | `192.168.10.123/24` | 机器人侧固定地址 |
| DHCP 地址池 | `192.168.10.50-192.168.10.150` | 需要 Jetson 分配地址时使用 |
| QuickView / WebSocket 信令地址 | `ws://192.168.10.123:8554` | 按实际网络修改 |
| VR / 上位机 IP | `192.168.10.x` | 与 Jetson 同网段 |

通电后在 Jetson 上检查基础设备：

```bash
ip addr
ls /dev/video*
sudo dmesg --follow
```

如果相机设备没有出现，先检查线束、转接板供电、相机驱动和 Jetson 相机服务。

### 5.2 安装头显 APK（ADB 方式）

以下步骤用于在 Meta Quest 头显上安装或更新 KernelMind Apex APK。

Orin 需连接 WiFi 以下载 ADB 工具：

```bash
sudo apt update
sudo apt install android-tools-adb -y
adb version
```

显示 ADB 版本号表示安装成功。

![安装 ADB](/img/pro/quick-start/install_adb_terminal.png)

连接头显：

1. 使用 Type-C 数据线连接头显和 Orin。
2. 佩戴头显，在头显内允许 USB 调试。
3. 在 Orin 执行 `adb devices`。
4. 若显示 `device`，表示连接成功。

```bash
adb devices
```

![连接头显并检查 adb devices](/img/pro/quick-start/connect_headset_adb.png)

将头显 APK 与 Orin `.deb` 安装包上传到 Orin 的 `~/Downloads` 目录，例如：

- `KernalMind_Apex_meta_260410.apk`
- `kernelmind-apex_1.0.5.7_arm64.deb`

![上传 APK 和 deb 安装包](/img/pro/quick-start/upload_packages_terminal.png)

先卸载旧版头显程序，再安装新版：

```bash
adb devices
adb shell pm list packages | grep Apex
adb uninstall <旧包名>
adb install -r KernalMind_Apex_meta_260410.apk
```

![安装 Meta 头显 APK](/img/pro/quick-start/install_headset_apk_terminal.png)

### 5.3 安装 Orin KernelMind 系统

将 deb 包拷贝到 Jetson，例如放到 `~/Downloads`。

更新时建议先卸载旧版本：

```bash
sudo apt remove kernelmind-apex
```

再安装新版本：

```bash
cd ~/Downloads
sudo apt install ./kernelmind-apex_<version>_arm64.deb
```

如果当前目录下安装失败，可明确使用 `./` 指定本地 deb 文件。

![安装 Orin KernelMind 系统](/img/pro/quick-start/install_deb_terminal.png)

安装完成后重新登录，或手动加载环境：

```bash
source /etc/profile.d/kernelmind_apex.sh
```

确认 ROS 包可见：

```bash
ros2 pkg list | grep -E 'marvin|gmsl|node_manager'
```

安装后的主要路径：

| 路径 | 用途 |
|---|---|
| `/opt/kernelmind/apex/install` | ROS 2 workspace install 目录 |
| `/opt/kernelmind/apex/bringup_RM.sh` | 标准启动脚本 |
| `/opt/kernelmind/apex/bringup_RM_glove.sh` | 外设版本启动脚本 |
| `/etc/profile.d/kernelmind_apex.sh` | ROS 环境加载脚本 |
| `/etc/kernelmind/marvin_teleop/config` | teleop 配置软链接 |
| `/etc/kernelmind/marvin_ros_control/config` | control 配置软链接 |

### 5.4 配置网络参数

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

检查结果：

```bash
ip addr show eth0
ping 192.168.10.50
```

如果 VR、上位机或其它设备需要从 Jetson 获取 IP，可安装 ISC DHCP Server：

```bash
sudo apt update
sudo apt install isc-dhcp-server
```

编辑 `/etc/default/isc-dhcp-server`，指定网卡：

```bash
sudo nano /etc/default/isc-dhcp-server
```

示例：

```conf
INTERFACESv4="eth0"
```

编辑 `/etc/dhcp/dhcpd.conf`：

```bash
sudo nano /etc/dhcp/dhcpd.conf
```

示例配置：

```conf
default-lease-time 600;
max-lease-time 7200;
authoritative;

subnet 192.168.10.0 netmask 255.255.255.0 {
  range 192.168.10.50 192.168.10.150;
  option routers 192.168.10.123;
  option subnet-mask 255.255.255.0;
  option domain-name-servers 8.8.8.8, 1.1.1.1;
}
```

启动并设为开机自启：

```bash
sudo systemctl enable isc-dhcp-server
sudo systemctl restart isc-dhcp-server
sudo systemctl status isc-dhcp-server --no-pager
```

查看租约：

```bash
sudo journalctl -u isc-dhcp-server -f
cat /var/lib/dhcp/dhcpd.leases
```

### 5.5 修改 QuickView / 相机参数

QuickView 相机配置文件安装在：

```bash
/opt/kernelmind/apex/install/gmsl_quadcam/share/gmsl_quadcam/config/quad_csi_quickview.yaml
```

常见需要修改的字段：

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

如果某个相机暂时不用，写 `"none"`，对应画面会留空：

```yaml
hand_left: "none"
```

修改后重新启动 launch 生效。

### 5.6 启动系统与检查

标准 M6 启动：

```bash
source /etc/profile.d/kernelmind_apex.sh
/opt/kernelmind/apex/bringup_RM.sh
```

外设版本启动：

```bash
source /etc/profile.d/kernelmind_apex.sh
/opt/kernelmind/apex/bringup_RM_glove.sh
```

不启动 RViz：

```bash
/opt/kernelmind/apex/bringup_RM.sh use_rviz:=false
```

指定其它 launch：

```bash
LAUNCH_PKG=node_manager LAUNCH_FILE=bringup_all_dm_m6_no_rviz.launch.py \
  /opt/kernelmind/apex/bringup_RM.sh
```

单独测试 QuickView 相机：

```bash
ros2 launch gmsl_quadcam quad_csi_quickview.launch.py
```

启动后检查节点、话题、服务和日志：

```bash
ros2 node list
ros2 topic list
ros2 topic hz /quad_tile/compressed
ros2 service list
journalctl -xe
ls ~/.ros/log
```

QuickView 页面或客户端应能看到 VR view 和 quad view。

### 5.7 卸载

```bash
sudo apt remove kernelmind-apex
```

如需完全清理运行日志和本地配置，请先备份数据，再手动删除相关目录。
