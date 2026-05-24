---
title: 常见配置
sidebar_position: 4
---

# 常见配置

## 1. 不使用官方摄像头或夹爪

修改 launch 文件：

```bash
cd /opt/kernelmind/apex/install/node_manager/share/node_manager/launch
sudo chmod 666 bringup_all_dm_m6.launch.py
```

根据实际选配，注释掉 `dm_gripper` 和 `quadcam` 相关行。

![不使用官方摄像头和夹爪](/img/pro_p22.png)

## 2. 修改机器人 IP / 负载等参数

常见配置文件路径：

```text
/opt/kernelmind/apex/install/marvin_ros_control/share/marvin_ros_control/config
/opt/kernelmind/apex/install/marvin_teleop/share/marvin_teleop/config
```

如文件只读，先执行：

```bash
sudo chmod 666 <文件名>
```

![修改配置参数](/img/pro_p23.png)

## 3. 修改 Orin 连接双臂 IP

修改：

```text
/opt/kernelmind/apex/install/marvin_ros_control/share/marvin_ros_control/config/robot_param_m6.yaml
```

字段：`robot_ip`，默认值 `192.168.10.190`。

![修改 Orin 连接双臂 IP](/img/pro_p48.png)

## 4. 修改头显 Apex 连接 IP

头显开机后，打开未知来源中的 Apex 软件，按左手柄菜单键唤出配置界面：

- **第 1 项**：身高，影响虚拟手柄对齐高度。
- **第 2 项**：连接 Orin 的 IP，一般为 `192.168.10.123`。

![修改头显 Apex 连接 IP](/img/pro_p52.png)

## 5. 修改 TCP 位置

当前 TCP 默认为法兰盘沿 `Z+` 偏移 `50 mm`。如需修改，编辑：

```text
/opt/kernelmind/apex/install/marvin_teleop/share/marvin_teleop/config/mjcf/marvin_pro_mink.xml
```

- 左臂：约第 86 行，`tool` 偏移 `0 0 0.05`
- 右臂：约第 138 行，`tool` 偏移 `0 0 0.05`

![修改 TCP 位置说明](/img/pro_p75.png)

![TCP 偏移 XML 修改位置](/img/pro_p76.png)

## 6. 修改 Home 点

Home 点是机器人复位点与遥操初始位置，需同时修改两处：

```text
/opt/kernelmind/apex/install/marvin_teleop/share/marvin_teleop/config/mjcf/marvin_pro_mink.xml
/opt/kernelmind/apex/install/marvin_teleop/share/marvin_teleop/config/robot_param_m6.yaml
```

参数共 14 个：前 7 个为左臂，后 7 个为右臂，单位为**弧度**。

![Home 点说明](/img/pro_p78.png)

![Home 点 MJCF 修改位置](/img/pro_p79.png)

![Home 点 YAML 修改位置](/img/pro_p80.png)

> **注意**：修改 IP、负载、刚度、阻尼、Home 点、TCP 偏移前，建议先备份原始配置文件。

## 7. 脚踏板安装与配置

### 7.1 安装依赖与 SDK

Orin 需联网下载依赖：

```bash
sudo apt-get install libhidapi-dev
cd ~
git clone https://github.com/rgerganov/footswitch.git
cd footswitch
make
sudo make install
```

![安装 libhidapi](/img/pro_p56.png)

![下载 footswitch SDK](/img/pro_p57.png)

![编译并安装 footswitch](/img/pro_p58.png)

### 7.2 映射脚踏板按键

```bash
footswitch -1 -m shift -k left -3 -m shift -k right
```

若提示 `cannot find footswitch`，检查脚踏板 USB 是否已插入 Orin。

脚踏板模式启动建议使用：

```bash
cd /opt/kernelmind/apex
./bringup_RM_glove.sh
```

![脚踏板按键映射](/img/pro_p59.png)

### 7.3 脚踏板遥操注意事项

- 左右手柄使能键在脚踏板模式下无效，仅脚踏板可使能。
- 按键 1：左右手柄一起使能。
- 按键 3：两个手臂回到 Home 点。
- **禁止**在踩着使能键时按下右手摇杆菜单键，否则可能导致手臂下坠撞击。
- 不遥操时务必松脚。

![脚踏板注意事项](/img/pro_p63.png)

## 8. 增量遥操模式

遥操支持两种位置模式：

| 模式 | 说明 |
|---|---|
| 绝对位置模式 | 需要实际手柄与头显内红蓝手柄对齐，否则使能后可能导致机械臂快速运动 |
| 增量位置模式 | 进入使能时以当前手柄位置为零位，仅将后续平移和角度变化作为增量下发（出厂默认） |

切换方式：修改：

```text
/opt/kernelmind/apex/install/marvin_teleop/share/marvin_teleop/config/robot_param_m6.yaml
```

字段：

```yaml
use_incremental_control: true   # 增量模式（默认）
use_incremental_control: false  # 绝对位置模式
```

![遥操增量运动说明](/img/pro_p65.png)

![use_incremental_control 配置](/img/pro_p66.png)
