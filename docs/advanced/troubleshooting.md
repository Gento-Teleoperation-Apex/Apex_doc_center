---
title: 常见问题与速查
sidebar_position: 4
---

# Apex 遥操系统常见问题 Q&A 与速查手册

更新时间：2026-08-06  
适用范围：Marvin Pro、Gento Skye、Gento Luna  
控制器：Orin、天准、灵境 Thor  
末端：DM/OmniGripper、ZY 夹爪、Wuji 灵巧手  
文档用途：客户自助排障、技术支持培训和现场问题速查

## 1. 使用前先确认什么？

### Q1：为什么排障前必须先确认整机配置？

因为 Pro 与 Gento 使用不同控制链路，Ubuntu 22.04/Humble 与 Ubuntu 24.04/Jazzy 的依赖包也不同。至少记录以下信息：

```text
产品线：Marvin Pro / Gento
本体：Pro / Skye / Luna
机械臂：M6 696 / M6 Lite / M3 / Gento 整机配置
控制器：Orin / 天准 / 灵境 Thor
系统与 ROS：Ubuntu 22.04 + Humble / Ubuntu 24.04 + Jazzy
末端：DM / ZY / Wuji / none
软件：kernelmind-apex、kernelmind-apex-tool、Apex-Teleop、SDK、头显 APK
网络：控制器 IP、机器人 IP、头显 Host IP、ROS_DOMAIN_ID
```

目标机执行：

```bash
dpkg --print-architecture
lsb_release -a
echo "$ROS_DISTRO"
dpkg-query -W -f='${Package} ${Version} ${Architecture}\n' \
  | grep -Ei 'kernelmind|apex|teleop|marvin|gento|ros-(humble|jazzy)'
```

平台对应关系：

| 控制器 | Ubuntu | ROS 2 | 架构 |
| --- | --- | --- | --- |
| Orin | 22.04 | Humble | arm64 |
| 天准 | 22.04 | Humble | arm64 |
| 灵境 Thor | 24.04 | Jazzy | arm64 |

### Q2：开始排障前有哪些通用检查？

```bash
source /etc/apex/apex_ros_env.sh 2>/dev/null || \
  source /opt/kernelmind/apex/install/setup.bash
systemctl --no-pager --failed
ros2 node list
ros2 topic list
ros2 service list
```

再查看五个核心服务：

```bash
systemctl status apex-backend.service --no-pager
systemctl status apex-robot.service --no-pager
systemctl status apex-camera.service --no-pager
systemctl status apex-teleop.service --no-pager
systemctl status apex-tool.service --no-pager
```

旧版本可能没有独立的 `apex-tool.service`，出现 `Unit could not be found` 时应核对版本和 Tool 安装方式，不表示其他四个模块也异常。

机械臂或夹爪测试前必须清空周边、降低动作幅度并确认没有第二个控制源。

## 2. 启动、前端与服务

### Q3：Apex 标准启动顺序是什么？

```text
检查网络和整机配置
-> 启动 Backend
-> 确认 GMSL/Argus
-> ApexApp Start Robot
-> Start Camera
-> Start Teleop
-> 按末端类型启动 Tool
-> 连接头显并做小幅测试
-> 最后再开始录制
```

Backend 首次启动：

```bash
sudo systemctl start apex-backend.service
```

### Q4：什么时候需要重启 `apex-backend.service`？

先检查：

```bash
systemctl status apex-backend.service --no-pager
curl -sS -o /dev/null -w 'HTTP %{http_code}\n' http://127.0.0.1:8080/docs
journalctl -u apex-backend.service -n 100 --no-pager
```

以下情况可以重启 Backend：

- ApexApp 无法连接本机后端或页面模块控制失效。
- `127.0.0.1:8080/docs` 无响应，且 Backend 已异常退出或卡住。
- 修改了 Backend 启动时读取的 `/etc/apex/apex.env` 配置。
- Backend 日志持续报错，确认不是 Robot、Camera、Teleop 或 Tool 自己的问题。

```bash
sudo systemctl restart apex-backend.service
```

相机采集超时只重启 Camera/Argus，机器人连接断开只处理 Robot，夹爪异常只处理 Tool/夹爪节点。不要把“重启 Backend”当作所有问题的统一处理方式。

### Q5：各模块出现问题时应该重启哪个服务？

| 现象 | 优先处理 |
| --- | --- |
| 前端 API、模块按钮、8080 端口异常 | `apex-backend.service` |
| Robot 连接、机器人 IP、SDK 状态异常 | `apex-robot.service` |
| 相机黑屏、配置修改、视频进程异常 | `apex-camera.service` |
| 头显输入、IK/QP、遥操模式修改 | `apex-teleop.service` |
| DM/ZY/Wuji 末端配置或节点异常 | `apex-tool.service` 或对应手动节点 |
| Argus 无图、等待 image buffer 超时 | `nvargus-daemon`，随后重启 Camera |

常用日志：

```bash
journalctl -u apex-robot.service -n 100 --no-pager
journalctl -u apex-camera.service -n 100 --no-pager
journalctl -u apex-teleop.service -n 100 --no-pager
journalctl -u apex-tool.service -n 100 --no-pager
```

### Q6：遥操模式应该配置为 `controller` 还是 `dexhand`？

查看：

```bash
grep -E 'APEX_TELEOP_MODE|APEX_TOOL_TYPE' /etc/apex/apex.env
```

- 普通手柄遥操、DM/ZY 夹爪：通常使用 `APEX_TELEOP_MODE=controller`。
- 手套或灵巧手遥操：使用 `APEX_TELEOP_MODE=dexhand`。
- `APEX_TOOL_TYPE=wuji` 或 `wujihand` 的版本可能自动进入 glove 模式。
- 末端类型使用 `APEX_TOOL_TYPE=dm|zy|wuji|none`。

修改：

```bash
sudoedit /etc/apex/apex.env
sudo systemctl restart apex-teleop.service
sudo systemctl restart apex-tool.service
```

修改前保留原值。若模式错误，常见表现为普通夹爪没有控制值、灵巧手命令 Topic 不出现、脚踏使能逻辑不生效。

### Q7：前端启动后终端出现红字，应先看什么？

先找该节点退出前最早出现的具体错误，不要只看汇总性的 `process has died`。常见关键字：

```text
error while loading shared libraries
No such file or directory
symbol lookup error
exit code 127
Version mismatch
Robot connection lost
```

如果是 `error while loading shared libraries`，从红字复制可执行文件路径并执行：

```bash
ldd <红字中的可执行文件路径> | grep 'not found'
```

缺库时先确认 Ubuntu、ROS、ARM64 和软件版本，再安装对应依赖。不要先查 Topic，也不要随意把不同版本 `.so` 软链接到一起。

### Q8：`source /etc/apex/apex_ros_env.sh` 提示文件不存在怎么办？

先确认是否为旧版本或安装不完整：

```bash
ls -l /etc/apex
ls -l /opt/kernelmind/apex/install/setup.bash
```

临时加载：

```bash
source /opt/ros/<humble或jazzy>/setup.bash
source /opt/kernelmind/apex/install/setup.bash
```

Humble 与 Jazzy 不能混用。若 `/opt/kernelmind/apex/install/setup.bash` 也不存在，应重新检查 `kernelmind-apex` 是否安装成功，而不是手工创建空环境文件。

### Q9：加载环境时仍提示构建机路径不存在怎么办？

典型报错：

```text
not found: /home/marvin/test_apex_ws/install/local_setup.bash
```

这是安装包环境文件残留构建机绝对路径。先定位：

```bash
grep -Rns '/home/marvin/test_apex_ws/install' /opt/kernelmind/apex/install 2>/dev/null
```

需要备份命中的文本环境文件，再将构建前缀重定位为 `/opt/kernelmind/apex/install`。修改后重新加载环境，并对核心可执行文件运行 `ldd`。不要在目标机创建假的 `/home/marvin/test_apex_ws` 目录掩盖问题。

## 3. 相机、Argus、H264 与 WebRTC

### Q10：相机编号和 `camera_sources` 在哪里修改？

配置目录：

```text
/opt/kernelmind/apex/install/gmsl_quadcam/share/gmsl_quadcam/config
```

先确定当前版本实际使用的文件：

```bash
systemctl cat apex-camera.service
grep -Rns 'camera_sources' \
  /opt/kernelmind/apex/install/gmsl_quadcam/share/gmsl_quadcam/config
```

常见文件为：

```text
quad_csi_quickview.yaml
sh5_quad_csi_quickview.yaml
```

经验编号：

| 控制器 | 常见 CSI 编号 |
| --- | --- |
| 灵境 Thor | `0/1/2/3` |
| 天准 | `0/1/4/5` |
| Orin DK | `0/6/7/8` |

实际编号以目标硬件枚举和单路测试为准。修改后：

```bash
sudo systemctl restart apex-camera.service
```

### Q11：机器只有两路相机，另外两路怎么配置？

不存在的相机必须写 `none`，避免程序一直等待不存在的传感器：

```yaml
camera_sources:
  head_left: "csi://0"
  head_right: "csi://1"
  hand_left: "none"
  hand_right: "none"
```

### Q12：相机画面上下颠倒，怎么翻转？

当前已确认配置项位于相机 YAML：

```yaml
flip_180: true
```

- `true`：整体旋转 180 度。
- `false`：不进行 180 度翻转。

修改后重启 Camera。当前已知能力是整体上下翻转；不要默认支持单路独立翻转或左右镜像。若客户需要每个相机分别翻转，应先确认当前 release 是否已支持，否则记录为功能需求。

### Q13：相机报 `timeout waiting for the next image buffer`、`rendering black` 怎么办？

这表示上层等待不到相机帧，先区分硬件/Argus 与 Apex 配置。

1. 停止 Camera，避免占用相机。
2. 用 `argus_camera` 单测实际相机编号。
3. 配置和接线正确但仍无帧时重启 Argus。
4. 再启动 Camera。

```bash
sudo systemctl stop apex-camera.service
command -v argus_camera
argus_camera -d 0
sudo systemctl restart nvargus-daemon
sudo systemctl restart apex-camera.service
```

其他编号逐路测试。`argus_camera` 不存在时，使用当前交付提供的相机测试工具，不要凭空安装不匹配的程序。

### Q14：如何判断 GMSL 驱动或相机硬件是否正常？

```bash
systemctl --type=service --all | grep -Ei 'gmsl|camera|argus'
dmesg | grep -Ei 'gmsl|csi|argus' | tail -n 100
v4l2-ctl --list-devices
```

逐路 `argus_camera` 有图，说明硬件、驱动和 Argus 基本可用；此时再查 Apex 的 `camera_sources`、编码依赖和服务参数。逐路测试也无图时，优先检查相机供电、线束、GMSL 解串板、接头和 sensor ID。

### Q15：Camera 已启动，但找不到 `/usb_cam_0/image_raw` 怎么办？

教程中的 USB Camera Topic 不一定适用于 GMSL 版本。先查实际 Topic：

```bash
ros2 topic list | grep -Ei 'image|camera|quad|compressed'
ros2 topic info /quad_tile/compressed -v
```

GMSL 版本可能只提供 `/quad_tile/compressed` 等拼接压缩图像。若所有相机 Topic 都没有，按以下顺序检查：

```text
ROS_DOMAIN_ID
-> apex-camera.service
-> GMSL/Argus 是否有图
-> camera_sources
-> quad_csi_quickview 动态库
```

### Q16：Windows 或浏览器收不到 WebRTC 视频，怎么定位？

在 Edge/Chrome 打开：

```text
edge://webrtc-internals
chrome://webrtc-internals
```

- 没有任何 PeerConnection，且 `RTCPeerConnection/createOffer` 未调用：问题在前端初始化、前端版本、codec 配置或播放启动条件，还没有进入 ICE 排查。
- PeerConnection 已建立但无视频：检查 video track、H264 profile、解码器、码率、丢包和 WebRTC 信令日志。
- 相机采集本身无帧：先处理 GMSL/Argus，不要从 WebRTC 开始查。

历史上出现过 Windows 客户端缺少 codec/解码配置，更新软件后恢复。具体修复版本需按当前 release 确认。

### Q17：灵境 Thor 相机报 `libnppicc.so.13 => not found` 怎么办？

先确认 ARM64 和 Jetson 软件源：

```bash
dpkg --print-architecture
apt-cache policy libnpp-13-0 libnpp-dev-13-0
apt-cache show libnpp-13-0 | grep -E 'Architecture|Version'
```

确认候选包来自 Jetson ARM64/R38.4 后：

```bash
sudo apt install libnpp-13-0 libnpp-dev-13-0
sudo ldconfig
ldd /opt/kernelmind/apex/install/gmsl_quadcam/lib/gmsl_quadcam/quad_csi_quickview \
  | grep 'not found'
```

禁止使用 `ubuntu2404/x86_64` CUDA 源给 ARM64 Thor 安装 amd64 包。

## 4. 机器人连接与遥操控制

### Q18：机器人连不上，IP 应该和什么一致？

`robot_ip` 必须等于机器人控制器的实际 IP；Apex 主机网卡 IP 与机器人 IP 应位于可达网段，但不能设置成相同地址。

先定位当前版本的配置：

```bash
grep -Rns 'robot_ip' \
  /opt/kernelmind/apex/install/*/share/*/config 2>/dev/null
```

常见路径：

```text
/opt/kernelmind/apex/install/marvin_ros_control/share/marvin_ros_control/config
/opt/kernelmind/apex/install/marvin_ros2_control/share/marvin_ros2_control/config
```

检查网络：

```bash
ip -br address
ip route get <机器人IP>
ping -c 4 <机器人IP>
```

若 ping 不通，先检查网段、掩码、路由、网线、机器人电源和左右臂接线，不要继续改遥操 Topic。

### Q19：修改 `robot_ip` 后为什么还是连不上？

常见原因：

- 修改的不是当前 launch 实际加载的 YAML。
- 只重启了前端，没有重启 Robot。
- Robot 和 Teleop 仍保留旧状态。
- 主机网卡与机器人不在同一可达网段。
- 另一个 SDK 客户端占用控制连接。

修改后执行：

```bash
sudo systemctl restart apex-robot.service
sudo systemctl restart apex-teleop.service
```

也可在 ApexApp 中 Reset/Restart Robot 后重新 Start Teleop。

### Q20：日志持续出现 `Robot connection lost`，但后来又能遥操，算正常吗？

不算正常。它表示一段时间内 Robot Node 没有收到有效反馈，并撤销 ready 或回到 mode 0。自动恢复只说明连接重新建立。

检查：

```text
机器人 IP 和网络丢包
控制器电源和线束
是否同时运行第二个 SDK 客户端
SDK 与控制器固件版本
断开与恢复的准确时间
```

### Q21：控制器版本显示 0 或报 `Version mismatch` 怎么办？

若 MarvinUpdateTool 能读到控制器版本，但 MarvinPlatform/Apex 显示 0，通常要核对上位机、SDK 和控制器固件的协议兼容性。

1. 记录控制器真实版本。
2. 查询当前 MarvinSDK、Apex 和上位机版本。
3. 使用同一正式 release 的 SDK 与固件。
4. 固件升级前确认机械臂型号和回退包。

没有正式 `.MV_SYS_UPDATE` 文件时，不使用来源不明的升级包。

### Q22：头显已连接，但机械臂不动，怎么逐级排查？

按控制链逐级找“最后一个有数据的 Topic”：

```bash
source /etc/apex/apex_ros_env.sh
ros2 topic echo /tj/info/vr_connected --once
ros2 topic echo /tj/control/target_poseL --once
ros2 topic echo /tj/control/enableL --once
ros2 topic echo /tj/control/teleop/ik_request --once
ros2 topic echo /tj/control/ik_request --once
ros2 topic echo /tj/control/qp_controller/joint_cmd_A --once
ros2 topic echo /tj/control/input_mode --once
ros2 topic echo /tj/control/joint_cmd_A --once
ros2 topic echo /tj/info/robot_state --once
```

Pro 使用 `/tj/control/ik_request/vr`，Gento 使用 `/tj/control/teleop/ik_request`。不同版本可能使用不同状态 Topic，以目标机 `ros2 topic list` 为准。

日志出现：

```text
Arm A/B idle (no msg ...)
```

说明最终命令链没有持续收到消息，应继续查 target pose、enable、IK、QP、input mode 和 ready，而不是查相机。

### Q23：夹爪能动，但机械臂不动，说明什么？

夹爪和机械臂不是同一控制链。夹爪能动只能证明头显或测试程序发出了夹爪值，以及末端链路可能正常；不能证明 IK/QP、机械臂 ready 或最终关节指令正常。

重点检查：

```text
/control/target_poseL/R
/control/enableL/R
/control/ik_request
/control/qp_controller/joint_cmd_A/B
/control/input_mode
/control/joint_cmd_A/B
/info/robot_state 或 /info/arm_state
```

### Q24：只有一侧机械臂不动，怎么检查？

左右分别比较：

```bash
ros2 topic echo /tj/control/target_poseL --once
ros2 topic echo /tj/control/target_poseR --once
ros2 topic echo /tj/control/enableL --once
ros2 topic echo /tj/control/enableR --once
ros2 topic echo /tj/control/qp_controller/joint_cmd_A --once
ros2 topic echo /tj/control/qp_controller/joint_cmd_B --once
ros2 topic echo /tj/control/joint_cmd_A --once
ros2 topic echo /tj/control/joint_cmd_B --once
```

若两侧指令都有而一侧无反馈，再查该侧机械臂电源、线束、控制器状态和 SDK 错误码。

### Q25：`controller_udp connect failed` 怎么办？

检查：

- Host IP 是否属于本机正确网卡。
- 头显和控制器是否在同一可达网络。
- 端口是否占用或被防火墙阻断。
- 头显 APK 与 Apex 的协议和端口是否配套。
- TCP 9010 会话是否建立。

常用端口：

| 端口 | 协议 | 作用 |
| ---: | --- | --- |
| 9000/9001 | UDP | 左右手柄输入 |
| 9002/9003 | UDP | 左右末端反馈 |
| 9004 | UDP | 身体/辅助数据 |
| 9010 | TCP | 会话和心跳 |
| 8888 | UDP | 主机发现 |

检查监听：

```bash
ss -lntup | grep -E ':8888|:9000|:9001|:9002|:9003|:9004|:9010'
```

历史旧 APK 可能使用 `29001-29004`，需要更新或改为与当前 Apex 配套的端口。

### Q26：DHCP 日志有 DHCPOFFER，但头显仍然 offline，为什么？

`DHCPOFFER` 只证明服务器曾尝试分配地址，不证明头显已正常获取地址，也不证明 UDP/TCP 遥操会话建立。

继续检查：

```text
头显实际 IP
头显中配置的 Host IP
控制器网卡 IP
9010 TCP 会话
9000~9004 UDP
APK 版本与权限
```

### Q27：头显进入应用前卡在边界、权限或隐私界面怎么办？

先在头显中完成系统边界、安全、隐私、相机和存储权限确认，再进入 Apex。系统弹窗未完成时，Apex 网络和遥操链路可能根本没有启动。

### Q28：机械臂 Kp/Kd 在哪里修改？

Pro 常见配置：

```text
/opt/kernelmind/apex/install/marvin_ros_control/share/marvin_ros_control/config/robot_param_m6.yaml
/opt/kernelmind/apex/install/marvin_ros_control/share/marvin_ros_control/config/robot_param_m3.yaml
```

字段：

```yaml
left_kd:
  k: [...]
  d: [...]
right_kd:
  k: [...]
  d: [...]
```

不同版本和 Gento 机型先查实际文件：

```bash
grep -Rns -E 'left_kd|right_kd' \
  /opt/kernelmind/apex/install/*/share/*/config 2>/dev/null
```

修改要求：

1. 备份当前生效文件。
2. 确认数组长度与关节数一致。
3. 保留浮点格式，例如 `6.0`。
4. 每次只做小幅调整。
5. 重启 Robot，再重启 Teleop。
6. 空载、小幅、单臂验证后再做双臂测试。

机械臂 Kp/Kd、QP 任务权重和夹爪 MIT Kp/Kd 是三类不同参数，不要混改。

### Q29：修改机械臂 Kp/Kd 后出现抖动怎么办？

立即停止运动并恢复备份参数。再检查：

- 修改的是不是当前生效机型文件。
- 左右数组是否错位、长度错误或单位错误。
- 控制频率和反馈是否稳定。
- 机械臂是否接近奇异位形、限位或碰撞区域。
- SDK/Teleop 版本是否匹配。

不要在机器人已经持续振荡时继续尝试更大的 Kp/Kd。

### Q30：Gento 身体前倾、双臂前伸时偶发抖动或停住怎么办？

这是当前已知问题。现场表现为前倾和前伸到一定程度时偶发抖动或停住，回退后恢复。后续使用支持新版 Gento SDK 的 Teleop 版本解决。

更新前不要反复顶到极限姿态；更新后重点验证身体前倾、双臂前伸、负载夹持和回退过程。

### Q31：机器人进入 soft stop 怎么处理？

通常不需要直接断电。优先按以下顺序处理：

```text
确认现场安全
-> 查看故障与 stop 原因
-> clear fault/解除 stop
-> ServoReset 或控制器复位
-> 恢复模式
-> 重新 ready/使能
```

具体 Service 或 SDK API 以目标版本为准，不确定时先执行 `ros2 service list | grep control` 和 `ros2 service type`。

## 5. DM、ZY 夹爪与 Wuji 灵巧手

### Q32：Tool 服务和手动 `ros2 launch` 可以同时启动吗？

不可以让两个节点同时控制同一末端。手动启动前先检查：

```bash
systemctl status apex-tool.service --no-pager
ros2 node list | grep -Ei 'gripper|tool|hand'
ros2 topic info /tj/control/gripperValueL -v
```

若准备手动启动夹爪节点，先停止已运行的 Tool 服务：

```bash
sudo systemctl stop apex-tool.service
```

重复节点或双发布者会导致抖动、指令互相覆盖和反馈异常。

### Q33：头显操作夹爪，但 `/control/gripperValueL/R` 没有输出怎么办？

检查：

```bash
echo "$ROS_DOMAIN_ID"
grep -E 'ROS_DOMAIN_ID|APEX_TELEOP_MODE|APEX_TOOL_TYPE' /etc/apex/apex.env
ros2 topic info /tj/control/gripperValueL -v
ros2 topic info /tj/control/gripperValueR -v
```

普通夹爪应确认遥操模式为 `controller`，头显 APK 与当前 Teleop 配套。若版本更新后 Domain 从 20 变成 23，头显、Teleop、Tool 和调试终端必须全部使用同一 Domain。

### Q34：DM 夹爪如何启动、重置和做单次测试？

启动：

```bash
source /etc/apex/apex_ros_env.sh
source /opt/kernelmind/apex_tool/install/setup.bash 2>/dev/null || true
ros2 launch dm_gripper_py dm_gripper.launch.py
```

重置：

```bash
ros2 service call /tj/control/reset_grippers std_srvs/srv/Trigger '{}'
```

低风险单次测试：

```bash
ros2 topic pub --once /tj/control/gripperValueL \
  std_msgs/msg/Float32 '{data: 0.2}'
ros2 topic pub --once /tj/control/gripperValueR \
  std_msgs/msg/Float32 '{data: 0.2}'
```

命令方向和映射范围以目标版本 launch 为准；不要把原始电机位置值与归一化 Topic 值混用。

### Q35：DM 程序在 `sock.bind(('vcan0',))` 报 `No such device` 怎么办？

说明程序要求的 CAN 接口不存在或名称不一致：

```bash
ip -details link show vcan0
ip -details link show vcan1
```

完整 Apex 系统还需要 Robot Node 的末端通道桥接。只创建一个空 vcan 接口只能消除 bind 报错，不能让数据自动到达真实夹爪。客户未购买 Apex 遥操系统时，必须确认其物理 CAN 控制器和桥接方式。

### Q36：一侧夹爪通电但不上使能，另一侧未上电，怎么排查？

优先检查：

```text
左右末端供电
末端板和保险
左右线束与接头
电机 ID
单侧 CAN 收发
夹爪初始化日志和错误码
```

可通过交换左右通道、线束或夹爪区分电机本体、末端板和软件通道。没有交换验证前，不直接认定为某一个硬件损坏。

### Q37：夹爪能动但没有弹性，怎么处理？

1. 确认只有一个夹爪控制节点。
2. 调用 `/tj/control/reset_grippers`。
3. 查看左右反馈和 `_err` Topic。
4. 检查启动时左右电机 enable/MIT 初始化是否成功。
5. 重启后仍异常，再检查 MIT Kp/Kd、末端板和电机。

```bash
source /etc/apex/apex_ros_env.sh
ros2 topic echo /tj/info/gripper_feedback_L --once
ros2 topic echo /tj/info/gripper_feedback_R --once
ros2 topic echo /tj/info/gripper_feedback_L_err --once
ros2 topic echo /tj/info/gripper_feedback_R_err --once
```

### Q38：DM 夹爪 Kp/Kd 在哪里修改？

它不在机械臂 `robot_param` 的 `left_kd/right_kd` 中。先定位实际运行文件：

```bash
find /opt/kernelmind -path '*dm_gripper_py*' -name 'DM_gripper.py' 2>/dev/null
grep -Rns 'controlMIT' /opt/kernelmind/apex*/install 2>/dev/null
```

已确认的控制位置：

```python
MotorControl1.controlMIT(Motor1, 3.0, 0.12, ...)
MotorControl1.controlMIT(Motor2, 3.0, 0.12, ...)
```

第二、第三个参数分别为 Kp、Kd。修改前确认使用的是源码、主 Apex 安装目录还是独立 `apex_tool` overlay；修改后重启实际运行的夹爪节点。稳定版本默认不主动修改，先排除初始化、CAN、供电和重复节点。

### Q39：左右夹爪单独正常，同时动作却抖动或互相干扰怎么办？

按以下顺序检查：

```text
重复节点/双命令源
-> 左右电机 ID 与通道
-> vcan0/vcan1 收发
-> 通信对象并发和反馈完整性
-> 供电压降
-> 控制频率和目标平滑
```

检查发布者数量：

```bash
ros2 topic info /tj/control/gripperValueL -v
ros2 topic info /tj/control/gripperValueR -v
```

不要同时运行头显控制和正弦波测试脚本。当前 DM 夹爪经过 120 秒满负载验证的稳定工程配置约为 200 Hz，不是硬实时承诺。

### Q40：夹爪设置值和反馈值有少量偏差，是故障吗？

位置控制存在机械间隙、摩擦、负载和控制误差，小偏差不一定是故障。需要比较左右误差是否持续扩大、是否到达目标、是否伴随抖动或错误码。

一套 DM 夹爪历史实测：

```text
全开反馈约 0
末端接触约 1.17
完全闭合反馈约 1.41
原始闭合命令可给约 1.5 留出夹持余量
```

部分 ROS launch 使用归一化 `0~1` 再映射到电机范围，不能直接把上述原始值发到所有版本的 `/control/gripperValueL/R`。

### Q41：ZY 启动时报 `executable 'zy_gripper_node' not found` 怎么办？

通常是只复制了 `share/launch`，没有复制完整安装产物。检查：

```bash
ros2 pkg prefix zy_gripper_py
ls /opt/kernelmind/apex*/install/zy_gripper_py/lib/zy_gripper_py
ls /opt/kernelmind/apex*/install/zy_gripper_py/share/zy_gripper_py/launch
```

需要完整的 colcon `install/zy_gripper_py` 目录，或在目标 ROS 环境重新构建并 source 对应 `setup.bash`。

### Q42：使用 Wuji 灵巧手时 Topic 不见了，怎么检查 Domain 和模式？

```bash
echo "$ROS_DOMAIN_ID"
grep -E 'ROS_DOMAIN_ID|APEX_TELEOP_MODE|APEX_TOOL_TYPE' /etc/apex/apex.env
ros2 topic list | grep -Ei 'hand|glove|footkey'
```

常见 Topic：

```text
/hand_left/joint_commands
/hand_right/joint_commands
/hand_left/joint_states
/hand_right/joint_states
/control/footkey
```

Wuji 通常要求 `APEX_TOOL_TYPE=wuji`，并使用 `dexhand/glove` 遥操模式。修改 Domain 或模式后重启 Teleop 和 Tool。所有发布端、接收端及调试终端必须使用相同 `ROS_DOMAIN_ID`。

### Q43：灵巧手动作不稳定，但 Topic 和 Domain 正常怎么办？

检查手柄/追踪器是否持续处于头显可视范围。现场经验是将手柄固定在手背或拇指附近，手柄头朝手腕。再检查手套、脚踏使能、左右映射、手部命令 Topic 和灵巧手反馈，不要先认定为手指电机故障。

## 6. ROS Domain、Topic 与控制源

### Q44：版本更新后节点能启动，但互相看不到 Topic，最常见原因是什么？

优先检查 Domain：

```bash
echo "$ROS_DOMAIN_ID"
grep -n 'ROS_DOMAIN_ID' /etc/apex/apex.env
```

还要检查：

```bash
echo "$ROS_LOCALHOST_ONLY"
grep -n 'ROS_LOCALHOST_ONLY' /etc/apex/apex.env
```

跨机通信时通常需要 `ROS_LOCALHOST_ONLY=0`。Jazzy 虽然提示该变量弃用，但已设置时仍可能生效。修改后重启相关服务并重新打开调试终端。

### Q45：如何判断是输入没有数据、QP 没输出，还是最终控制源没切对？

```bash
ros2 topic echo /tj/control/teleop/ik_request --once
ros2 topic echo /tj/control/ik_request --once
ros2 topic echo /tj/control/qp_controller/joint_cmd_A --once
ros2 topic echo /tj/control/input_mode --once
ros2 topic echo /tj/control/joint_cmd_A --once
```

判断：

```text
Teleop IK 无数据：查头显、enable 和 controller_udp
Teleop IK 有、mux 输出无：查 IK source/mux
IK 有、QP 无：查 QP、模型、状态和动态库
QP 有、最终 joint_cmd 无：查 input_mode/joint_cmd_mux
最终命令有、机器人不动：查 Robot ready、SDK、网络和硬件
```

### Q46：`ROS_LOCALHOST_ONLY` 的 Jazzy 黄色警告是故障吗？

警告本身不一定导致节点退出，但 `ROS_LOCALHOST_ONLY=1` 会限制跨机发现。若头显、灵巧手或其他电脑需要通过 DDS 通信，应检查 `/etc/apex/apex.env`，不要因为只是黄色警告就忽略其实际配置影响。

## 7. 动态库、版本与安装依赖

### Q47：灵境 Thor Teleop 缺 `libpinocchio` 或 `libeiquadprog.so` 怎么办？

先检查：

```bash
ldd /opt/kernelmind/apex/install/marvin_teleop/lib/marvin_teleop/teleop_manager \
  | grep 'not found'
ldd /opt/kernelmind/apex/install/marvin_qp_controller/lib/marvin_qp_controller/qp_controller \
  | grep 'not found'
```

Jazzy 常见依赖：

```bash
sudo apt install ros-jazzy-pinocchio
sudo apt install ros-jazzy-eiquadprog
```

如果程序仍要求特定 SONAME，例如 `libpinocchio_default.so.3.9.0`，而系统安装的是其他版本，说明二进制 ABI 与依赖版本不一致。应安装构建时固定版本或在目标系统重新编译，不能随意软链接冒充版本。

### Q48：报 `MarvinSDK.so not found` 怎么办？

```bash
find /usr/local /usr /opt -name '*MarvinSDK*.so*' 2>/dev/null
ldconfig -p | grep -i marvin
```

确认目标系统和架构后，获取当前 release 配套的 MarvinSDK deb：

```bash
sudo apt install ./<marvin-sdk-arm64-对应系统版本>.deb
sudo ldconfig
```

安装后重新执行 `ldd`。不要用其他 Ubuntu 版本或其他架构的 SDK 包。

### Q49：包名和版本正确，为什么仍然缺库？

包版本正确不等于所有依赖已配置完成。检查 dpkg 状态：

```bash
sudo dpkg --audit
dpkg -l | grep -Ei 'pinocchio|eiquadprog|kernelmind|apex'
```

只有 `ii` 表示已安装并配置；`iU` 只是已解包。Humble Pinocchio 4.0 现场曾因缺少 `coal`、`eigenpy`、`hpp-fcl` 停在 `iU`，需补齐同一 Humble/ARM64 依赖。

### Q50：安装依赖时出现 `amd64 does not match system arm64` 怎么办？

立即停止继续安装，不执行 `apt autoremove`。这说明 ARM64 Jetson 混入了 x86_64 软件源或包。

处理原则：

1. 禁用错误的 `ubuntu2404/x86_64` CUDA 源。
2. `sudo apt clean`。
3. `sudo dpkg --configure -a`。
4. 恢复正确 Jetson ARM64 源并 `sudo apt update`。
5. 先执行模拟修复：

```bash
sudo apt --fix-broken install -s
```

若模拟结果要删除 JetPack、L4T、CUDA、TensorRT 或 NVIDIA 关键包，停止执行并先恢复正确源和候选包。

### Q51：Apex Python 环境报依赖冲突怎么办？

```bash
/opt/kernelmind/venv/bin/pip check
```

已出现过 `setuptools >=80` 与 `colcon-core` 要求 `<80` 冲突。若确认只有该问题，应只在 `/opt/kernelmind/venv` 内修复，不修改系统 Python。修复后要求 `pip check` 输出：

```text
No broken requirements found.
```

### Q52：如何确认安装包组合是否配套？

同时记录：

```text
kernelmind-apex
kernelmind-apex-tool
Apex-Teleop
MarvinSDK 或 Gento SDK
控制器固件
头显 APK
Ubuntu/ROS/架构
```

安装前先模拟：

```bash
sudo apt-get -s install ./<package>.deb
```

若模拟会删除 JetPack、L4T、CUDA、TensorRT 或 ROS 核心包，不执行安装。

## 8. 录包、存储与频率

### Q53：录制后没有 `metadata.yaml`，MCAP 也损坏怎么办？

优先检查：

```text
录制进程是否异常退出
存储盘是否掉线、只读或空间不足
停止录制后是否完成 flush
Recorder 版本是否配套
实际运行的是哪一个 recorder 包
```

```bash
mount | grep BAG_STORAGE
df -h | grep BAG_STORAGE
ros2 pkg prefix recording_playback_nodes_py
ros2 pkg prefix bag_recorder_nodes_py
```

若安装树里同时存在两份 `bag_recorder_data.py`，必须通过 launch、进程命令行或 `ros2 pkg prefix` 确认实际运行哪一份，不能两个都替换。先做短录制，确认同时生成 MCAP 和 `metadata.yaml`，再进行长时间录制。

### Q54：提示 `Storage disk not found` 或录包目录不可写怎么办？

常见目录：

```text
/media/<user>/BAG_STORAGE/recorded_bags
```

检查：

```bash
mount | grep BAG_STORAGE
df -h | grep BAG_STORAGE
grep -n 'BAG_STORAGE_ROOT' /etc/apex/apex.env
```

确认 U 盘卷标、挂载目录、剩余空间和读写权限。不要只设置当前终端的临时环境变量后就认为 systemd 服务也会继承。

### Q55：客户要求 EEF、夹爪和关节反馈有稳定频率，怎么测？

快速查看：

```bash
source /etc/apex/apex_ros_env.sh
ros2 topic hz /tj/info/eef_left
ros2 topic hz /tj/info/eef_right
ros2 topic hz /tj/info/gripper_feedback_L
ros2 topic hz /tj/info/gripper_feedback_R
ros2 topic hz /tj/info/joint_feedback
ros2 topic hz /tj/joint_states
```

正式测试至少记录测试时长、预热、动作负载、发布者数量、样本数、平均 Hz、标准差、P95/P99、最大周期和数据中断。

历史 120 秒满负载实测参考：

| Topic | 频率参考 |
| --- | ---: |
| `/tj/info/eef_left/right` | 约 939 Hz |
| `/tj/info/gripper_feedback_L/R` | 约 198 Hz |
| `/tj/info/joint_feedback` | 约 200 Hz |
| `/tj/joint_states` | 约 100 Hz |

这些是 Marvin Pro 的单次现场实测，不是所有设备的硬实时承诺，也不能直接作为 Skye/Luna 的验收值。各产品当前设计频率见 [Marvin Pro ROS Topic 列表](/advanced/ros-topic-list) 和 [Gento ROS 2 接口](/software/apex-teleop/gento-interfaces)。训练数据建议保留各 Topic 原始时间戳，录制后统一重采样，不要为了频率一致同时修改所有底层控制环。

## 9. 授权与其他常见问题

### Q56：Teleop 报 `UID directory not found` 或 `Not licensed for this machine` 怎么办？

这是目标机授权/注册材料缺失，`teleop_manager` 会退出：

```text
Not licensed for this machine: UID directory not found: /etc/myapp/uid
```

需要按内部授权流程生成并部署 UID。不能通过创建空目录或伪造文件绕过授权。

### Q57：ToDesk/NoMachine 离线，是否说明 Apex 有故障？

不一定。远程桌面离线属于远程支持工具、网络或账号问题；Apex 服务、ROS Topic 和机器人控制可能仍然正常。应分别检查远程工具和 Apex，不要混为同一个故障。

### Q58：前端端口提示 `Address already in use` 怎么办？

说明该端口已有进程监听，常见于服务已经启动又重复运行：

```bash
ss -ltnp | grep ':<端口>'
ps -ef | grep '[a]pp.py'
```

使用现有服务或停止明确的旧进程，不要连续重复启动多个前端实例。

### Q59：为什么主 Apex 已安装，但找不到 DM/ZY/Tool 包？

新版拆包中，`kernelmind-apex-tool` 可能是独立 deb，并安装到单独 overlay：

```text
/opt/kernelmind/apex_tool/install
```

检查：

```bash
dpkg-query -W -f='${Package} ${Version} ${Architecture}\n' \
  | grep -Ei 'kernelmind-apex-tool|kernelmind-apex'
source /etc/apex/apex_ros_env.sh
source /opt/kernelmind/apex_tool/install/setup.bash
ros2 pkg prefix apex_tool
ros2 pkg prefix dm_gripper_py
ros2 pkg prefix zy_gripper_py
```

加载顺序必须是主 Apex 在前、Tool overlay 在后。旧版本可能把 Tool 包放在主 `/opt/kernelmind/apex/install` 中，应以目标机 `ros2 pkg prefix` 为准。

## 10. 故障速查表

| 客户现象/关键红字 | 第一检查项 | 首选命令或位置 | 处理方向 |
| --- | --- | --- | --- |
| ApexApp 无法管理模块 | Backend/API | `systemctl status apex-backend`、访问 8080/docs | 查 Backend 日志，必要时重启 Backend |
| Camera 黑屏、等待 buffer 超时 | Argus/硬件 | `argus_camera -d <编号>` | 重启 Argus，再重启 Camera |
| 相机顺序错误或缺一路 | `camera_sources` | `gmsl_quadcam/.../config/*.yaml` | 按实际 CSI 编号修改，缺少写 `none` |
| 相机上下颠倒 | `flip_180` | 相机 YAML | 修改整体 180 度翻转并重启 Camera |
| 找不到 `/usb_cam_0/image_raw` | 实际相机 Topic | `ros2 topic list | grep -Ei 'image|quad'` | GMSL 可能使用 `/quad_tile/compressed` |
| WebRTC 没有 PeerConnection | 前端初始化/codec | `edge://webrtc-internals` | 更新前端或核对 codec 配置 |
| `libnppicc.so.13 not found` | Thor NPP | `ldd quad_csi_quickview` | 安装 Jetson ARM64 NPP 13 |
| Robot 连不上 | Robot IP/网段 | `grep robot_ip`、`ping` | 改实际 IP，重启 Robot 和 Teleop |
| `Robot connection lost` 后恢复 | SDK/网络波动 | Robot 日志 | 查丢包、第二 SDK 客户端、版本 |
| 夹爪动、机械臂不动 | IK/QP/ready | 从 target pose 查到 final joint_cmd | 找第一个无数据环节 |
| `Arm A/B idle (no msg)` | 最终命令链 | `/control/joint_cmd_A/B` | 查 enable、IK、QP、input_mode |
| `controller_udp connect failed` | Host IP/端口 | 9000~9004、9010、8888 | 查 APK、网卡、防火墙和 TCP 会话 |
| 更新后 Topic 消失 | ROS Domain | `/etc/apex/apex.env` | 统一 `ROS_DOMAIN_ID` |
| 灵巧手命令 Topic 不见 | Domain/模式 | `APEX_TELEOP_MODE`、`APEX_TOOL_TYPE` | 使用 dexhand + wuji 并重启 Teleop/Tool |
| 前端红字 `exit code 127` | 动态库 | `ldd <可执行文件>` | 按系统/ROS/架构补兼容库 |
| `libpinocchio...not found` | Pinocchio ABI | `ldd teleop_manager` | 固定构建版本，禁止错误软链接 |
| `libeiquadprog.so not found` | QP 依赖 | `ldd qp_controller` | Jazzy 安装对应 ROS 包 |
| `MarvinSDK.so not found` | SDK 安装 | `find`、`ldconfig -p` | 安装当前 release 对应 SDK deb |
| `amd64 does not match arm64` | 软件源架构错误 | `dpkg --print-architecture` | 停止安装，禁用 x86 CUDA 源 |
| DM 报 `No such device` | vcan | `ip link show vcan0/vcan1` | 查接口、Robot Node 末端桥和物理 CAN |
| 单侧夹爪不上使能 | 供电/CAN/末端板 | 反馈和 `_err` Topic | 交换通道区分硬件与软件 |
| 夹爪能动但无弹性 | 初始化/Kp/Kd | `/control/reset_grippers` | 先 reset 和查反馈，再查 MIT 参数 |
| 双爪同时抖动 | 双节点/双发布者 | `ros2 topic info ... -v` | 只保留一个控制源，再查供电和 CAN |
| ZY launch 找不到 executable | 安装不完整 | `ros2 pkg prefix zy_gripper_py` | 复制完整 install 产物或重新构建 |
| 主 Apex 有但找不到 Tool 包 | 独立 Tool overlay | `/opt/kernelmind/apex_tool/install` | 安装 `kernelmind-apex-tool` 并按顺序 source |
| MCAP 损坏且无 YAML | Recorder/存储 | mount、df、实际包前缀 | 短录验证，确认 stop/flush 和运行包 |
| `UID directory not found` | 授权 | `/etc/myapp/uid` | 按内部授权流程部署 UID |

## 11. 常用路径速查

| 用途 | 路径 |
| --- | --- |
| Apex 根目录 | `/opt/kernelmind/apex` |
| 主安装目录 | `/opt/kernelmind/apex/install` |
| Tool 独立 overlay | `/opt/kernelmind/apex_tool/install` |
| 环境配置 | `/etc/apex/apex.env` |
| ROS 环境脚本 | `/etc/apex/apex_ros_env.sh` |
| Robot 配置 | `/opt/kernelmind/apex/install/marvin_ros_control/share/marvin_ros_control/config` |
| 新版 Robot 配置候选 | `/opt/kernelmind/apex/install/marvin_ros2_control/share/marvin_ros2_control/config` |
| Teleop 配置 | `/opt/kernelmind/apex/install/marvin_teleop/share/marvin_teleop/config` |
| QP 配置 | `/opt/kernelmind/apex/install/marvin_qp_controller/share/marvin_qp_controller/config` |
| 相机配置 | `/opt/kernelmind/apex/install/gmsl_quadcam/share/gmsl_quadcam/config` |
| Apex ROS 日志 | `/var/log/apex/ros` |
| 用户 ROS 日志 | `~/.ros/log` |
| 常用录制目录 | `/media/<user>/BAG_STORAGE/recorded_bags` |
| Gento IK 回放目录 | `~/gento_replay_bags` |

## 12. 现场信息回传模板

问题仍未解决时，请一次性回传：

```text
1. 产品配置：本体、机械臂、控制器、末端
2. Ubuntu、ROS、CPU 架构
3. kernelmind-apex、Apex-Teleop、Tool、SDK、APK 版本
4. 问题发生前执行的操作
5. 完整红字，尤其是第一条 error 和最底部错误
6. 对应服务 status 和最近 100 行 journalctl
7. ROS_DOMAIN_ID、ROS_LOCALHOST_ONLY
8. 相关 Topic 的 info/echo 结果
9. 是否稳定复现，重启哪个模块后能否恢复
10. 修改过的配置文件及修改前后内容
```

排障结论应区分：已确认事实、已验证经验和待验证推断。没有日志或交换测试时，不把“可能是末端板、自碰撞、网络或电机”直接写成最终原因。
