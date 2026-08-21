---
title: Skye/Luna 模块化通讯排查
sidebar_position: 6
---

# Gento Skye / Luna 终端直贴式通讯排查手册

> 适用：Gento 系列 Skye、Luna。
>
> 本文所有排查代码均可整段粘贴到控制器终端运行，不调用外部排查脚本。Gento 与 Marvin Pro 是并列源码体系，控制链判断不能混用。

## 1. 使用规则

1. 每个代码块独立可运行。
2. 默认命令只读取状态，不控制机器人。
3. 结果保存到：

```text
~/apex_direct_gento_check/
```

4. `gripper-active` 会真实控制夹爪，必须单独确认安全。
5. 代码自动兼容 Apex ROS namespace。

结果标记：

| 标记 | 含义 |
|---|---|
| `[MISSING]` | Topic 不存在 |
| `[DATA]` | 收到数据 |
| `[NO_DATA]` | Topic 存在但没有收到数据 |
| Publisher count 大于 0 | 仅表示发现发布端 |
| Subscription count 大于 0 | 仅表示发现订阅端 |

## 2. Skye 和 Luna 区别

| 项目 | Skye | Luna |
|---|---|---|
| 本体 | 可上下移动 | 带类似膝盖的多关节身体结构 |
| 底层对象 | Gento Skye L1 SDK | Gento Luna L1 SDK |
| 身体命令 | 升降/身体轴 | 多关节身体轴 |
| Teleop 参数 | 通常 `enable_tcp=false` | 通常 `enable_tcp=true` |
| 型号状态 | 应识别为 Gento Skye | 应识别为 Gento Luna |

测试前必须明确当前是 Skye 还是 Luna，并核对关节数量和身体控制行为。

## 3. 推荐启动顺序和进程要求

1. `Robot -> Start`
2. 确认前端机型为 Skye 或 Luna
3. `Teleop -> Start`
4. `Tool -> Start`
5. `Camera -> Start`，仅相机测试需要
6. 连接头显进入遥操

| 模块 | 必需服务/进程 |
|---|---|
| Robot | `apex-robot.service`、Gento Robot Node、L1 SDK 通讯 |
| 头显 | `apex-teleop.service`、`controller_udp.py` / VR reader |
| IK | `teleop_manager_v2`、`ik_request_mux` |
| QP 和命令选择 | `qp_controller`、`joint_cmd_mux` |
| 坐标 | `tracking_base_tf` 等 TF 进程 |
| 末端 | `apex-tool.service`、对应末端节点 |
| 相机 | `apex-camera.service`、Argus/GMSL/WebRTC 进程 |

## 4. 模块一：系统、版本、机型、Domain 和网络

### 4.1 进程要求

无。

### 4.2 直接粘贴运行

```bash
source /etc/apex/apex_ros_env.sh 2>/dev/null || \
  { source /opt/ros/jazzy/setup.bash 2>/dev/null || source /opt/ros/humble/setup.bash; }
source /etc/apex/apex.env 2>/dev/null || true
OUT="$HOME/apex_direct_gento_check"
mkdir -p "$OUT"

{
  echo "===== 时间和系统 ====="
  date --iso-8601=seconds
  hostnamectl 2>/dev/null || true
  uname -a
  grep -E '^(PRETTY_NAME|VERSION_ID)=' /etc/os-release

  echo; echo "===== Apex / ROS 环境 ====="
  printf 'ROS_DISTRO=%s\n' "${ROS_DISTRO:-}"
  printf 'ROS_DOMAIN_ID=%s\n' "${ROS_DOMAIN_ID:-}"
  printf 'ROS_LOCALHOST_ONLY=%s\n' "${ROS_LOCALHOST_ONLY:-}"
  grep -E '^(APEX_|ROS_|RMW_|BAG_STORAGE_ROOT)' /etc/apex/apex.env 2>/dev/null || true

  echo; echo "===== 安装版本 ====="
  dpkg-query -W -f='${binary:Package}\t${Version}\t${Architecture}\n' 2>/dev/null \
    | grep -Ei 'kernelmind|apexteleop|apex-teleop|gento|marvin-sdk' || true

  echo; echo "===== 网络 ====="
  ip -brief address
  ip route

  echo; echo "===== 机器人连通性 ====="
  if [[ -n "${APEX_ROBOT_IP:-}" ]]; then
    ping -c 3 -W 1 "$APEX_ROBOT_IP" || true
  else
    echo "APEX_ROBOT_IP 未设置"
  fi
} 2>&1 | tee "$OUT/01_env.txt"
```

### 4.3 预期输入

无人工动作。

### 4.4 正常结果

1. `APEX_ROBOT_PLATFORM` 或 `APEX_ROBOT_MODEL` 能识别 Gento、Skye 或 Luna。
2. 22.04 对应 Humble，24.04 对应 Jazzy。
3. 机器人 IP 可达。
4. ROS Domain、namespace 和软件版本完整。
5. 当前机型与实际结构一致。

## 5. 模块二：服务和关键进程

### 5.1 进程要求

无。

### 5.2 直接粘贴运行

```bash
OUT="$HOME/apex_direct_gento_check"
mkdir -p "$OUT"

{
  echo "===== systemd 服务 ====="
  for unit in apex-backend.service apex-robot.service apex-teleop.service \
              apex-tool.service apex-camera.service apex-replay.service; do
    if systemctl cat "$unit" >/dev/null 2>&1; then
      printf '%-26s active=%-10s enabled=%s\n' \
        "$unit" \
        "$(systemctl is-active "$unit" 2>/dev/null || true)" \
        "$(systemctl is-enabled "$unit" 2>/dev/null || true)"
    else
      printf '%-26s NOT_INSTALLED\n' "$unit"
    fi
  done

  echo; echo "===== Gento 关键进程 ====="
  pgrep -af 'marvin_robot_node|gento|teleop_manager|motion_node|ik_request_mux|qp_controller|joint_cmd_mux|controller_udp|VR_reader|tracking_base_tf|dm_motor|zy_gripper|wuji|quad_csi|webrtc' || true

  echo; echo "===== 失败服务 ====="
  systemctl --failed --no-pager || true
} 2>&1 | tee "$OUT/02_services.txt"
```

### 5.3 预期输入

无人工动作。

### 5.4 结果判断

- Robot 测试要求 Robot active。
- 控制链测试要求 Robot、Teleop active，且 IK Mux、QP、Joint Mux 进程都存在。
- 末端和相机测试要求对应服务 active。
- 服务 active 不能替代 Topic 数据检查。

## 6. 模块三：ROS 图总表

### 6.1 进程要求

启动需要检查的业务模块。

### 6.2 直接粘贴运行

```bash
source /etc/apex/apex_ros_env.sh 2>/dev/null || \
  { source /opt/ros/jazzy/setup.bash 2>/dev/null || source /opt/ros/humble/setup.bash; }
OUT="$HOME/apex_direct_gento_check"
mkdir -p "$OUT"

echo "===== Node =====" | tee "$OUT/03_graph.txt"
timeout 10 ros2 node list 2>&1 | tee -a "$OUT/03_graph.txt"
echo "===== Topic =====" | tee -a "$OUT/03_graph.txt"
timeout 10 ros2 topic list -t 2>&1 | tee -a "$OUT/03_graph.txt"
echo "===== Service =====" | tee -a "$OUT/03_graph.txt"
timeout 10 ros2 service list -t 2>&1 | tee -a "$OUT/03_graph.txt"
```

### 6.3 正常结果

基础反馈通常包括：

```text
/info/robot_info
/info/robot_state
/info/robot_cmd_state
/info/joint_feedback
/joint_states
```

控制链通常包括：

```text
/control/target_poseL
/control/target_poseR
/control/teleop/ik_request
/control/ik_request
/control/qp_controller/joint_cmd_A
/control/qp_controller/joint_cmd_B
/control/joint_cmd_A
/control/joint_cmd_B
```

Skye/Luna 按配置还应具有身体和头部命令 Topic。

## 7. 模块四：Gento Robot Node 和反馈

### 7.1 进程要求

Robot 已 Start，L1 SDK 已连接机器人主控。

### 7.2 直接粘贴运行

```bash
source /etc/apex/apex_ros_env.sh 2>/dev/null || \
  { source /opt/ros/jazzy/setup.bash 2>/dev/null || source /opt/ros/humble/setup.bash; }
source /etc/apex/apex.env 2>/dev/null || true
OUT="$HOME/apex_direct_gento_check"
mkdir -p "$OUT"

resolve_topic() {
  local logical="$1" ns candidate list
  list="$(ros2 topic list 2>/dev/null)"
  if grep -Fxq "$logical" <<<"$list"; then echo "$logical"; return; fi
  ns="${APEX_ROS_NAMESPACE:-}"; ns="${ns#/}"; ns="${ns%/}"
  candidate="/${ns}${logical}"
  if [[ -n "$ns" ]] && grep -Fxq "$candidate" <<<"$list"; then echo "$candidate"; return; fi
  echo "$logical"
}

check_topic() {
  local logical="$1" actual output
  actual="$(resolve_topic "$logical")"
  echo; echo "===== $logical -> $actual ====="
  if ! ros2 topic list 2>/dev/null | grep -Fxq "$actual"; then
    echo "[MISSING] $actual"; return
  fi
  ros2 topic info "$actual" -v 2>&1 | sed -n '1,80p'
  if output="$(timeout 6 ros2 topic echo "$actual" --once 2>&1)"; then
    echo "[DATA] $actual"
    printf '%s\n' "$output" | sed -n '1,35p'
  else
    echo "[NO_DATA] $actual：6秒内没有收到数据"
  fi
}

{
  for topic in /info/robot_info /info/robot_state /info/robot_cmd_state \
               /info/joint_feedback /joint_states /info/eef_left /info/eef_right; do
    check_topic "$topic"
  done

  echo; echo "===== 关节反馈频率 ====="
  timeout 12 ros2 topic hz "$(resolve_topic /info/joint_feedback)" || true
} 2>&1 | tee "$OUT/04_robot.txt"
```

### 7.3 测试人员输入动作

允许时小幅操作双臂；Skye 做一次低速升降；Luna 做一次小幅身体动作。

### 7.4 结果判断

- `robot_info` 的机型必须与 Skye/Luna 实物一致。
- `robot_info` 可能只在 Robot Node 启动阶段发布；晚启动监听为 `[NO_DATA]` 时，应结合发布端和 Robot 启动日志确认机型，不能单凭这一项判故障。
- `joint_feedback` 和 `joint_states` 应持续有数据。
- 服务 active 但全部 `[NO_DATA]`：检查 L1 SDK 数据线程、Robot Node 和 DDS。
- 双臂有反馈但身体轴无变化：检查机型参数和身体控制开关。
- 关节数量不符：检查加载的模型、URDF 和 byconfig 配置。

## 8. 模块五：头显、手柄和末端目标

### 8.1 进程要求

Robot、Teleop active，头显已连接。

### 8.2 直接粘贴运行

```bash
source /etc/apex/apex_ros_env.sh 2>/dev/null || \
  { source /opt/ros/jazzy/setup.bash 2>/dev/null || source /opt/ros/humble/setup.bash; }
source /etc/apex/apex.env 2>/dev/null || true
OUT="$HOME/apex_direct_gento_check"
mkdir -p "$OUT"

resolve_topic() {
  local logical="$1" ns candidate list
  list="$(ros2 topic list 2>/dev/null)"
  if grep -Fxq "$logical" <<<"$list"; then echo "$logical"; return; fi
  ns="${APEX_ROS_NAMESPACE:-}"; ns="${ns#/}"; ns="${ns%/}"
  candidate="/${ns}${logical}"
  if [[ -n "$ns" ]] && grep -Fxq "$candidate" <<<"$list"; then echo "$candidate"; return; fi
  echo "$logical"
}

{
  echo "请按终端当前 Topic 操作对应手柄。"
  for logical in /info/vr_connected /control/target_poseL /control/target_poseR \
                 /control/enableL /control/enableR \
                 /control/gripperValueL /control/gripperValueR \
                 /control/vr_joy_L /control/vr_joy_R /control/vr_body /control/footkey; do
    actual="$(resolve_topic "$logical")"
    echo; echo "===== $logical -> $actual ====="
    if ros2 topic list 2>/dev/null | grep -Fxq "$actual"; then
      ros2 topic info "$actual" 2>&1
      timeout 7 ros2 topic echo "$actual" --once 2>&1 || echo "[NO_DATA] 7秒内无数据"
    else
      echo "[MISSING] $actual"
    fi
  done
} 2>&1 | tee "$OUT/05_teleop.txt"
```

### 8.3 测试人员输入动作

依次移动左右手柄、操作左右使能、开合末端，并执行一次当前机型的身体控制输入。

### 8.4 结果判断

- `target_poseL/R` 随手柄变化：VR 位姿输入正常。
- `enableL/R` 随使能变化：使能映射正常。
- `vr_body` 随身体输入变化：本体遥操输入正常。
- 全部无数据：检查 Teleop、controller_udp、VR 网络、Domain。

## 9. 模块六：Gento 完整控制链

### 9.1 进程要求

Robot、Teleop active；IK Request Mux、QP、Joint Cmd Mux 均在运行；头显已连接。

### 9.2 直接粘贴运行

```bash
source /etc/apex/apex_ros_env.sh 2>/dev/null || \
  { source /opt/ros/jazzy/setup.bash 2>/dev/null || source /opt/ros/humble/setup.bash; }
source /etc/apex/apex.env 2>/dev/null || true
OUT="$HOME/apex_direct_gento_check"
mkdir -p "$OUT"

resolve_topic() {
  local logical="$1" ns candidate list
  list="$(ros2 topic list 2>/dev/null)"
  if grep -Fxq "$logical" <<<"$list"; then echo "$logical"; return; fi
  ns="${APEX_ROS_NAMESPACE:-}"; ns="${ns#/}"; ns="${ns%/}"
  candidate="/${ns}${logical}"
  if [[ -n "$ns" ]] && grep -Fxq "$candidate" <<<"$list"; then echo "$candidate"; return; fi
  echo "$logical"
}

{
  echo "每个 Topic 最多监听7秒，请持续做小幅双臂和身体动作。"
  for logical in /control/target_poseL /control/target_poseR \
                 /control/enableL /control/enableR \
                 /control/teleop/ik_request \
                 /control/ik_request \
                 /info/ik_request_mux/active_source \
                 /control/qp_controller/joint_cmd_A \
                 /control/qp_controller/joint_cmd_B \
                 /control/qp_controller/joint_cmd_body \
                 /control/qp_controller/joint_cmd_head \
                 /info/joint_cmd_mux/active_source \
                 /control/input_mode \
                 /control/joint_cmd_A /control/joint_cmd_B \
                 /control/joint_cmd_body /control/joint_cmd_head \
                 /info/joint_feedback; do
    actual="$(resolve_topic "$logical")"
    echo; echo "===== $logical -> $actual ====="
    if ros2 topic list 2>/dev/null | grep -Fxq "$actual"; then
      ros2 topic info "$actual" 2>&1
      timeout 7 ros2 topic echo "$actual" --once 2>&1 || echo "[NO_DATA] 7秒内无数据"
    else
      echo "[MISSING] $actual"
    fi
  done
} 2>&1 | tee "$OUT/06_pipeline.txt"
```

### 9.3 测试人员输入动作

持续、小幅、低速操作双臂。Skye 执行低速升降输入，Luna 执行小幅身体/膝部输入；有头部控制时再操作一次头部。

### 9.4 数据顺序

```text
target_pose / enable
  -> teleop/ik_request
  -> ik_request_mux
  -> ik_request
  -> qp_controller/joint_cmd_A、B、body、head
  -> joint_cmd_mux
  -> joint_cmd_A、B、body、head
  -> Gento Robot Node
  -> Gento L1 SDK
  -> joint_feedback
```

### 9.5 故障判断

- `target_pose` 无：VR/controller_udp。
- `target_pose` 有、`teleop/ik_request` 无：Teleop Manager、使能或 TF。
- `teleop/ik_request` 有、`ik_request` 无：IK Request Mux 输入源。
- `ik_request` 有、QP 无：QP、模型或动态库。
- QP 有、最终命令无：Joint Cmd Mux 输入源。
- 双臂命令有、身体命令无：机型参数、身体输入或身体 QP 输出。
- 最终命令有、反馈无：Robot Node、L1 SDK 或主控网络。

## 10. 模块七：DM/ZY 夹爪被动通讯

### 10.1 进程要求

Tool 已 Start 并选对类型。检查头显输入时还需 Teleop active。

### 10.2 直接粘贴运行

```bash
source /etc/apex/apex_ros_env.sh 2>/dev/null || \
  { source /opt/ros/jazzy/setup.bash 2>/dev/null || source /opt/ros/humble/setup.bash; }
OUT="$HOME/apex_direct_gento_check"
mkdir -p "$OUT"

{
  echo "===== Tool 服务和进程 ====="
  systemctl status apex-tool.service --no-pager -l | tail -35
  pgrep -af 'dm_motor|zy_gripper' || true

  echo; echo "===== 夹爪 Topic ====="
  for topic in /control/gripperValueL /control/gripperValueR \
               /info/gripper_feedback_L /info/gripper_feedback_R \
               /info/gripper_feedback_L_err /info/gripper_feedback_R_err; do
    echo; echo "===== $topic ====="
    if ros2 topic list 2>/dev/null | grep -Fxq "$topic"; then
      ros2 topic info "$topic" -v 2>&1 | sed -n '1,70p'
      timeout 7 ros2 topic echo "$topic" --once 2>&1 || echo "[NO_DATA] 7秒内无数据"
    else
      echo "[MISSING] $topic"
    fi
  done

  echo; echo "===== Gento vCAN 末端桥 ====="
  ip -details -statistics link show vcan0 2>&1 || true
  ip -details -statistics link show vcan1 2>&1 || true
  if command -v candump >/dev/null 2>&1; then
    timeout 10 candump -L any,0:0 || true
  else
    echo "未安装 can-utils"
  fi
} 2>&1 | tee "$OUT/07_gripper.txt"
```

### 10.3 测试人员输入动作

缓慢开合左右夹爪。代码本身不发送指令。

### 10.4 结果判断

- 目标、反馈和左右 CAN 帧均存在：完整链正常。
- 目标有、vCAN 无：Tool 驱动、接口或 Gento Robot Node 末端桥接。
- vCAN 有发帧无反馈：末端板、供电、CAN ID、接线或夹爪电机。
- 一侧异常：重点检查对应侧通道、末端板和供电。
- vCAN 在 Gento 中承载真实末端通讯，不是可忽略的纯模拟接口。

## 11. 模块八：夹爪主动功能测试

### 11.1 进程和安全要求

Tool active，机械臂静止，夹爪周围无人、无物体，无人操作头显。

### 11.2 直接粘贴运行

```bash
source /etc/apex/apex_ros_env.sh 2>/dev/null || \
  { source /opt/ros/jazzy/setup.bash 2>/dev/null || source /opt/ros/humble/setup.bash; }

for topic in /control/gripperValueL /control/gripperValueR; do
  count="$(ros2 topic info "$topic" 2>/dev/null | awk '/Subscription count:/{print $3}')"
  if [[ "${count:-0}" == "0" ]]; then
    echo "拒绝测试：$topic 没有订阅者"
    return 1 2>/dev/null || exit 1
  fi
done

echo "即将执行：打开 -> 半闭合 -> 接近闭合 -> 半闭合 -> 打开"
for value in 0.0 0.5 0.9 0.5 0.0; do
  echo "发送左右夹爪值：$value"
  ros2 topic pub --once /control/gripperValueL std_msgs/msg/Float32 "{data: $value}"
  ros2 topic pub --once /control/gripperValueR std_msgs/msg/Float32 "{data: $value}"
  sleep 3
done
echo "测试完成，最终目标为0.0"
```

### 11.3 预期结果

左右夹爪同步执行打开、半闭合、接近闭合、半闭合、打开。

## 12. 模块九：Wuji 灵巧手

### 12.1 进程要求

Tool 选择 Wuji，Teleop active，头显已连接。

### 12.2 直接粘贴运行

```bash
source /etc/apex/apex_ros_env.sh 2>/dev/null || \
  { source /opt/ros/jazzy/setup.bash 2>/dev/null || source /opt/ros/humble/setup.bash; }
OUT="$HOME/apex_direct_gento_check"
mkdir -p "$OUT"

{
  for topic in /hand_left/joint_commands /hand_right/joint_commands \
               /hand_left/joint_states /hand_right/joint_states; do
    echo; echo "===== $topic ====="
    if ros2 topic list 2>/dev/null | grep -Fxq "$topic"; then
      ros2 topic info "$topic" -v 2>&1 | sed -n '1,70p'
      timeout 8 ros2 topic echo "$topic" --once 2>&1 || echo "[NO_DATA]"
    else
      echo "[MISSING]"
    fi
  done
} 2>&1 | tee "$OUT/08_hand.txt"
```

### 12.3 输入和预期

分别做握拳、张开和单指动作。命令应变化、状态应返回。未安装 Wuji 时 Topic 缺失正常。

## 13. 模块十：相机、Argus、H264 和 WebRTC

### 13.1 进程要求

GMSL 驱动已加载，Camera 已 Start。

### 13.2 直接粘贴运行

```bash
source /etc/apex/apex_ros_env.sh 2>/dev/null || \
  { source /opt/ros/jazzy/setup.bash 2>/dev/null || source /opt/ros/humble/setup.bash; }
OUT="$HOME/apex_direct_gento_check"
mkdir -p "$OUT"

{
  echo "===== 服务 ====="
  systemctl status apex-camera.service --no-pager -l | tail -40
  systemctl status nvargus-daemon.service --no-pager -l | tail -40

  echo; echo "===== 视频设备和进程 ====="
  ls -l /dev/video* 2>/dev/null || true
  command -v v4l2-ctl >/dev/null 2>&1 && v4l2-ctl --list-devices || true
  pgrep -af 'quad_csi|webrtc|argus|gmsl|camera' || true
  ss -lunpt 2>/dev/null | grep -E ':(8554|8888)\b' || true

  echo; echo "===== 相机 Topic ====="
  ros2 topic list -t 2>/dev/null | grep -Ei 'camera|image|compressed|quad|usb_cam' || true

  echo; echo "===== Camera 日志 ====="
  journalctl -u apex-camera.service -n 180 --no-pager
  echo; echo "===== Argus 日志 ====="
  journalctl -u nvargus-daemon.service -n 120 --no-pager
} 2>&1 | tee "$OUT/09_camera.txt"
```

### 13.3 输入和预期

逐路观察已配置相机。Argus、Camera、采集和 WebRTC 进程应正常，画面应连续。持续 Capture timeout、rendering black、核心转储或动态库缺失均为异常。

相机可能直接走 Argus/GMSL、H264、WebRTC，不一定发布原始 ROS 图像 Topic。

## 14. 模块十一：录制、回放和存储

### 14.1 进程要求

Teleop active，数据盘挂载可写，需要录制的模块均已运行。

### 14.2 直接粘贴运行

```bash
source /etc/apex/apex_ros_env.sh 2>/dev/null || \
  { source /opt/ros/jazzy/setup.bash 2>/dev/null || source /opt/ros/humble/setup.bash; }
source /etc/apex/apex.env 2>/dev/null || true
OUT="$HOME/apex_direct_gento_check"
mkdir -p "$OUT"

{
  echo "===== Recorder / Playback / Gento Replay ====="
  ros2 service list -t 2>/dev/null | grep -Ei 'record|playback|replay' || true
  ros2 topic list -t 2>/dev/null | grep -Ei 'record|playback|replay' || true

  echo; echo "===== 存储 ====="
  printf 'BAG_STORAGE_ROOT=%s\n' "${BAG_STORAGE_ROOT:-}"
  grep -E '^BAG_STORAGE_ROOT=' /etc/apex/apex.env 2>/dev/null || true
  mount | grep -Ei '/media/|BAG_STORAGE' || true
  df -h

  echo; echo "===== 最近录包 ====="
  find /media "$HOME" -maxdepth 5 -name metadata.yaml \
    -printf '%TY-%Tm-%Td %TH:%TM %h\n' 2>/dev/null | sort | tail -30
} 2>&1 | tee "$OUT/10_recording.txt"
```

### 14.3 测试人员输入动作

通过正常界面短录制双臂、身体和末端动作并正常结束。需要回放时再检查 Gento Replay 的输入源切换和恢复。

### 14.4 正常结果

- 数据盘可写、空间充足。
- 录制目录包含 `metadata.yaml` 和有效 MCAP。
- Replay 状态和实际动作一致，结束后可恢复 teleop 输入源。

## 15. 模块十二：错误日志汇总

### 15.1 进程要求

先复现问题。

### 15.2 直接粘贴运行

```bash
OUT="$HOME/apex_direct_gento_check"
mkdir -p "$OUT"

{
  for unit in apex-backend.service apex-robot.service apex-teleop.service \
              apex-tool.service apex-camera.service; do
    echo; echo "===== $unit ====="
    journalctl -u "$unit" -n 250 --no-pager 2>&1 || true
  done
} 2>&1 | tee "$OUT/11_all_journals.txt"

grep -niE 'error|failed|exception|traceback|timeout|not found|no such|mismatch|died' \
  "$OUT/11_all_journals.txt" | tail -200 | tee "$OUT/12_error_summary.txt"
```

### 15.3 重点区分

- 手动 Stop/Restart 导致的 `SIGINT`、`KeyboardInterrupt`、`exit code -2` 通常不是崩溃。
- `exit code 127` 通常是动态库缺失。
- `ik_request` 链断开优先查 Mux、QP、模型和 TF。
- L1 SDK 反馈中断优先查机器人主控网络和 Robot Node。

## 16. 最短执行组合

双臂或身体不动：依次执行第 5、7、8、9、15 节。

夹爪不动：依次执行第 5、8、10 节；确认安全后再执行第 11 节。

相机无画面：依次执行第 5、13、15 节。

问题不明确：从第 4 节开始顺序执行，跳过不适用末端和主动动作。

## 17. 结果打包

```bash
cd ~
tar -czf apex_direct_gento_check.tar.gz apex_direct_gento_check
echo "结果文件：$HOME/apex_direct_gento_check.tar.gz"
```

回传时同时说明：Skye/Luna、机械臂构型、控制器、末端类型、软件版本、复现步骤和故障概率。发送前脱敏客户信息。
