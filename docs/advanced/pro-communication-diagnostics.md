---
title: Marvin Pro 模块化通讯排查
sidebar_position: 5
---

# Marvin Pro 终端直贴式通讯排查手册

> 适用：Marvin Pro，M6 696、M6 Lite、M3 等机械臂构型。
>
> 本文所有排查代码均可整段粘贴到控制器终端运行，不需要复制或调用外部排查脚本。

## 1. 使用规则

1. 每个代码块都是独立命令，可在新终端直接粘贴。
2. 默认命令只读取状态，不控制机器人。
3. 输出同时保存在：

```text
~/apex_direct_pro_check/
```

4. `gripper-active` 一节会真实控制夹爪，必须单独确认安全。
5. 配置了 `APEX_ROS_NAMESPACE=tj` 时，代码会自动把 `/info/...`、`/control/...` 解析为 `/tj/info/...`、`/tj/control/...`；夹爪根 Topic 仍会优先按原名检查。

结果标记：

| 标记 | 含义 |
|---|---|
| `[MISSING]` | Topic 不存在 |
| `[DATA]` | 在等待时间内收到一帧数据 |
| `[NO_DATA]` | Topic 存在，但没有收到数据 |
| Publisher count 大于 0 | ROS 图中发现发布端，不等同于正在发布数据 |
| Subscription count 大于 0 | ROS 图中发现订阅端 |

## 2. 推荐启动顺序

在 Tianji M Apex 前端按测试需要启动：

1. `Robot -> Start`
2. `Teleop -> Start`
3. `Tool -> Start`，选择实际末端类型
4. `Camera -> Start`，仅相机测试需要
5. 连接头显并进入遥操

模块与前置进程：

| 模块 | 必需服务/进程 |
|---|---|
| 系统和版本 | 无 |
| 机器人反馈 | `apex-robot.service`、`marvin_robot_node` |
| 头显输入 | `apex-teleop.service`、`controller_udp.py`、`teleop_manager` |
| 控制链 | Robot、Teleop、`qp_controller`、`joint_cmd_mux` |
| DM/ZY 夹爪 | `apex-tool.service`、对应夹爪节点 |
| 相机 | `apex-camera.service`、`nvargus-daemon.service` |
| 录制/回放 | `apex-teleop.service`、录制和回放节点 |

## 3. 模块一：系统、版本、Domain 和网络

### 3.1 进程要求

无。

### 3.2 直接粘贴运行

```bash
source /etc/apex/apex_ros_env.sh 2>/dev/null || source /opt/ros/humble/setup.bash
source /etc/apex/apex.env 2>/dev/null || true
OUT="$HOME/apex_direct_pro_check"
mkdir -p "$OUT"

{
  echo "===== 时间和系统 ====="
  date --iso-8601=seconds
  hostnamectl 2>/dev/null || true
  uname -a
  grep -E '^(PRETTY_NAME|VERSION_ID)=' /etc/os-release

  echo
  echo "===== Apex / ROS 环境 ====="
  printf 'ROS_DISTRO=%s\n' "${ROS_DISTRO:-}"
  printf 'ROS_DOMAIN_ID=%s\n' "${ROS_DOMAIN_ID:-}"
  printf 'ROS_LOCALHOST_ONLY=%s\n' "${ROS_LOCALHOST_ONLY:-}"
  printf 'RMW_IMPLEMENTATION=%s\n' "${RMW_IMPLEMENTATION:-}"
  grep -E '^(APEX_|ROS_|RMW_|BAG_STORAGE_ROOT)' /etc/apex/apex.env 2>/dev/null || true

  echo
  echo "===== 安装版本 ====="
  dpkg-query -W -f='${binary:Package}\t${Version}\t${Architecture}\n' 2>/dev/null \
    | grep -Ei 'kernelmind|apexteleop|apex-teleop|marvin-sdk' || true

  echo
  echo "===== 网络 ====="
  ip -brief address
  ip route

  echo
  echo "===== 机器人连通性 ====="
  if [[ -n "${APEX_ROBOT_IP:-}" ]]; then
    ping -c 3 -W 1 "$APEX_ROBOT_IP" || true
  else
    echo "APEX_ROBOT_IP 未设置"
  fi
} 2>&1 | tee "$OUT/01_env.txt"
```

### 3.3 预期输入

无人工动作。

### 3.4 正常结果

1. 天准/Orin 通常为 Ubuntu 22.04、ROS 2 Humble；灵境 Thor 为 Ubuntu 24.04、ROS 2 Jazzy。
2. `APEX_ROBOT_PLATFORM=pro`。
3. `APEX_ROBOT_MODEL` 与实际机械臂构型一致。
4. `APEX_ROBOT_IP` 与机器人控制器 IP 一致且能 ping 通。
5. `ROS_DOMAIN_ID` 与 Apex 服务配置一致。
6. 能查询到 Apex、Teleop、Tool 和 Marvin SDK 版本。

## 4. 模块二：服务和进程状态

### 4.1 进程要求

无。该模块用于判断哪些进程已经启动。

### 4.2 直接粘贴运行

```bash
OUT="$HOME/apex_direct_pro_check"
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

  echo
  echo "===== 关键进程 ====="
  pgrep -af 'marvin_robot_node|teleop_manager|motion_node|qp_controller|controller_udp|VR_reader|planner_joint|joint_cmd_mux|dm_motor|zy_gripper|wuji|quad_csi|webrtc' || true

  echo
  echo "===== 失败服务 ====="
  systemctl --failed --no-pager || true
} 2>&1 | tee "$OUT/02_services.txt"
```

### 4.3 预期输入

无人工动作。

### 4.4 结果判断

- 测机器人时 Robot 必须为 `active`。
- 测头显和控制链时 Robot、Teleop 必须为 `active`。
- 测夹爪时 Tool 必须为 `active`。
- 测相机时 Camera 和 Argus 必须为 `active`。
- 服务为 active 仅说明进程在运行，仍需后续 Topic 数据验证。

## 5. 模块三：ROS 图总表

### 5.1 进程要求

启动需要检查的业务模块。

### 5.2 直接粘贴运行

```bash
source /etc/apex/apex_ros_env.sh 2>/dev/null || source /opt/ros/humble/setup.bash
OUT="$HOME/apex_direct_pro_check"
mkdir -p "$OUT"

echo "===== Node =====" | tee "$OUT/03_graph.txt"
timeout 10 ros2 node list 2>&1 | tee -a "$OUT/03_graph.txt"
echo "===== Topic =====" | tee -a "$OUT/03_graph.txt"
timeout 10 ros2 topic list -t 2>&1 | tee -a "$OUT/03_graph.txt"
echo "===== Service =====" | tee -a "$OUT/03_graph.txt"
timeout 10 ros2 service list -t 2>&1 | tee -a "$OUT/03_graph.txt"
```

### 5.3 预期输入

无人工动作。

### 5.4 正常结果

Pro 至少应能看到机器人状态、关节反馈、关节状态和双臂命令。配置 `tj` 命名空间时通常表现为：

```text
/tj/info/robot_state
/tj/info/joint_feedback
/tj/joint_states
/tj/control/joint_cmd_A
/tj/control/joint_cmd_B
```

如果 `ros2 node list` 偶发为空，但 Topic 仍有端点，应继续用 `topic info -v` 和 `topic echo` 判断，不能只依赖节点列表。

## 6. 模块四：机器人连接和反馈

### 6.1 进程要求

`Robot -> Start`，确认 `apex-robot.service=active`。

### 6.2 直接粘贴运行

```bash
source /etc/apex/apex_ros_env.sh 2>/dev/null || source /opt/ros/humble/setup.bash
source /etc/apex/apex.env 2>/dev/null || true
OUT="$HOME/apex_direct_pro_check"
mkdir -p "$OUT"

resolve_topic() {
  local logical="$1" ns candidate list
  list="$(ros2 topic list 2>/dev/null)"
  if grep -Fxq "$logical" <<<"$list"; then echo "$logical"; return; fi
  ns="${APEX_ROS_NAMESPACE:-}"
  ns="${ns#/}"; ns="${ns%/}"
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
  for topic in /info/robot_info /info/robot_state /info/arm_state \
               /info/joint_feedback /joint_states /info/eef_left /info/eef_right; do
    check_topic "$topic"
  done

  echo; echo "===== 关节反馈频率，观察约10秒 ====="
  timeout 12 ros2 topic hz "$(resolve_topic /info/joint_feedback)" || true
} 2>&1 | tee "$OUT/04_robot.txt"
```

### 6.3 预期输入动作

保持机器人连接。允许时低速、小幅运动一侧机械臂，使关节数据发生变化。

### 6.4 结果判断

- `/info/joint_feedback`、`/joint_states` 应为 `[DATA]`。
- `/info/robot_info` 可能只在 Robot Node 启动阶段发布；晚启动监听得到 `[NO_DATA]` 时，若发布端存在且 Robot 日志已经打印正确型号，不单独判为故障。
- Robot active 但反馈 `[NO_DATA]`：检查 Robot Node、SDK 数据线程和 DDS 通讯。
- 日志反复 `Robot connection lost`：检查机器人 IP、网线、网卡和 SDK 连接。
- `/info/joint_feedback` 有数据但 `/joint_states` 无数据：Robot Node 内部转换或发布异常。
- 机器人静止时数值不变化正常；实际运动时不变化异常。

## 7. 模块五：头显和手柄输入

### 7.1 进程要求

Robot、Teleop 已 Start，头显已连接并进入遥操。

### 7.2 直接粘贴运行

```bash
source /etc/apex/apex_ros_env.sh 2>/dev/null || source /opt/ros/humble/setup.bash
source /etc/apex/apex.env 2>/dev/null || true
OUT="$HOME/apex_direct_pro_check"
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
  echo "请在每个 Topic 的监听窗口内操作对应手柄。"
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

### 7.3 测试人员输入动作

按终端正在检查的 Topic，依次移动左右手柄、操作左右使能、开合左右末端。脚踏和身体控制未配置时可跳过。

### 7.4 结果判断

- `target_poseL/R` 有变化：头显位姿已进入 ROS。
- `enableL/R` 有变化：使能映射正常。
- `gripperValueL/R` 有变化：头显夹爪输入正常。
- 夹爪目标有数据但夹爪不动：继续排查 Tool、vCAN 和电机，不再归因于头显。
- 全部无数据：检查 Teleop、VR 连接、ROS Domain 和网络端口。

## 8. 模块六：Pro 双臂完整控制链

### 8.1 进程要求

Robot、Teleop active，头显已连接，机器人处于 ready，现场允许低速遥操。

### 8.2 直接粘贴运行

```bash
source /etc/apex/apex_ros_env.sh 2>/dev/null || source /opt/ros/humble/setup.bash
source /etc/apex/apex.env 2>/dev/null || true
OUT="$HOME/apex_direct_pro_check"
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
  echo "每个 Topic 最多监听7秒，请持续做小幅左右臂动作。"
  for logical in /control/target_poseL /control/target_poseR \
                 /control/enableL /control/enableR \
                 /control/ik_request \
                 /control/qp_controller/joint_cmd_A \
                 /control/qp_controller/joint_cmd_B \
                 /info/joint_cmd_mux/active_source \
                 /control/input_mode \
                 /control/joint_cmd_A /control/joint_cmd_B \
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

### 8.3 测试人员输入动作

在整个检查期间持续、小幅、低速移动左右手柄，并明确触发对应使能。

### 8.4 数据顺序和判断

```text
target_pose
  -> ik_request
  -> qp_controller/joint_cmd_A、B
  -> joint_cmd_A、B
  -> Marvin SDK
  -> joint_feedback
```

- `target_pose` 无：头显或 controller_udp 层。
- `target_pose` 有、`ik_request` 无：Teleop Manager、使能或坐标映射。
- `ik_request` 有、QP 无：QP、模型或 Pinocchio/eiquadprog 动态库。
- QP 有、最终关节命令无：joint_cmd_mux 或输入源选择。
- 最终命令有、反馈无：Robot Node、SDK 或机器人连接。

## 9. 模块七：DM/ZY 夹爪被动通讯

### 9.1 进程要求

Tool 已 Start 并选择正确夹爪。验证头显命令时还需 Teleop 和头显。

### 9.2 直接粘贴运行

```bash
source /etc/apex/apex_ros_env.sh 2>/dev/null || source /opt/ros/humble/setup.bash
OUT="$HOME/apex_direct_pro_check"
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

  echo; echo "===== vCAN 接口 ====="
  ip -details -statistics link show vcan0 2>&1 || true
  ip -details -statistics link show vcan1 2>&1 || true

  echo; echo "===== CAN 帧，监听10秒 ====="
  if command -v candump >/dev/null 2>&1; then
    timeout 10 candump -L any,0:0 || true
  else
    echo "未安装 can-utils，无法执行 candump"
  fi
} 2>&1 | tee "$OUT/07_gripper.txt"
```

### 9.3 测试人员输入动作

在 Topic/CAN 检查期间缓慢开合左右夹爪。该代码本身不发送夹爪指令。

### 9.4 结果判断

- 目标 Topic 有数据、反馈有数据、左右 vCAN 有收发帧：完整通讯正常。
- 目标无、反馈有：Tool 和硬件在线，头显/Teleop 未下发目标。
- 目标有、vCAN 无：Tool 驱动或接口映射异常。
- vCAN 有发帧但无反馈：末端板、供电、接线、CAN ID 或电机问题。
- CAN 有帧但 ROS 反馈无数据：CAN 层工作，ROS 发布层异常。

## 10. 模块八：夹爪主动功能测试

### 10.1 进程和安全要求

1. Tool active，夹爪类型正确。
2. 机械臂静止，夹爪周围无人、无物体。
3. 测试期间无人操作头显。
4. 先确认命令 Topic 存在且有订阅者。

### 10.2 直接粘贴运行

```bash
source /etc/apex/apex_ros_env.sh 2>/dev/null || source /opt/ros/humble/setup.bash

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

### 10.3 预期结果

左右夹爪同步执行：

```text
打开 -> 半闭合 -> 接近闭合 -> 半闭合 -> 打开
```

一侧异常时记录实际动作视频，并执行上一节的反馈与 CAN 检查。

## 11. 模块九：Wuji 灵巧手

### 11.1 进程要求

Tool 选择 Wuji，Teleop active，头显已连接。

### 11.2 直接粘贴运行

```bash
source /etc/apex/apex_ros_env.sh 2>/dev/null || source /opt/ros/humble/setup.bash
OUT="$HOME/apex_direct_pro_check"
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

### 11.3 输入和预期

分别做握拳、张开和单指动作。命令应变化，状态应持续返回。未安装 Wuji 时 Topic 缺失属于正常。

## 12. 模块十：相机、Argus、H264 和 WebRTC

### 12.1 进程要求

GMSL 驱动已加载，Camera 已 Start。

### 12.2 直接粘贴运行

```bash
source /etc/apex/apex_ros_env.sh 2>/dev/null || source /opt/ros/humble/setup.bash
OUT="$HOME/apex_direct_pro_check"
mkdir -p "$OUT"

{
  echo "===== 服务 ====="
  systemctl status apex-camera.service --no-pager -l | tail -40
  systemctl status nvargus-daemon.service --no-pager -l | tail -40

  echo; echo "===== 视频设备 ====="
  ls -l /dev/video* 2>/dev/null || true
  command -v v4l2-ctl >/dev/null 2>&1 && v4l2-ctl --list-devices || true

  echo; echo "===== 进程和端口 ====="
  pgrep -af 'quad_csi|webrtc|argus|gmsl|camera' || true
  ss -lunpt 2>/dev/null | grep -E ':(8554|8888)\b' || true

  echo; echo "===== 相机相关 ROS Topic ====="
  ros2 topic list -t 2>/dev/null | grep -Ei 'camera|image|compressed|quad|usb_cam' || true

  echo; echo "===== Camera 最近日志 ====="
  journalctl -u apex-camera.service -n 180 --no-pager

  echo; echo "===== Argus 最近日志 ====="
  journalctl -u nvargus-daemon.service -n 120 --no-pager
} 2>&1 | tee "$OUT/09_camera.txt"
```

### 12.3 测试人员输入动作

在前端和头显逐路观察已配置相机，记录具体失败编号、黑屏、花屏、卡顿或方向错误。

### 12.4 结果判断

- Argus、Camera 服务和采集/WebRTC 进程正常，实际画面连续：正常。
- `Capture timeout`、`rendering black` 持续出现：Argus、GMSL、相机连接或采集异常。
- `error while loading shared libraries`：安装包与控制器系统依赖不匹配。
- WebRTC 进程退出：信令、编码器或依赖问题。
- 相机可能不发布 ROS 原始图像 Topic，不能只凭 `/usb_cam_0/image_raw` 缺失判故障。

## 13. 模块十一：录制、回放和存储

### 13.1 进程要求

Teleop active，数据盘已挂载，待录制模块均已启动。

### 13.2 直接粘贴运行

```bash
source /etc/apex/apex_ros_env.sh 2>/dev/null || source /opt/ros/humble/setup.bash
source /etc/apex/apex.env 2>/dev/null || true
OUT="$HOME/apex_direct_pro_check"
mkdir -p "$OUT"

{
  echo "===== Recorder / Playback 接口 ====="
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

### 13.3 测试人员输入动作

通过正常界面开始短录制，执行双臂和末端动作，再正常停止。不要在本排查命令中猜测未知 Service 类型并直接调用。

### 13.4 正常结果

- 数据盘挂载参数包含 `rw`，空间充足。
- 录制结束后生成 `metadata.yaml` 和有效 MCAP。
- 无 YAML 或 MCAP 损坏时，重点检查磁盘写入、录制进程异常退出和停止流程。

## 14. 模块十二：错误日志汇总

### 14.1 进程要求

先复现一次问题，再运行。

### 14.2 直接粘贴运行

```bash
OUT="$HOME/apex_direct_pro_check"
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

### 14.3 重点区分

- `KeyboardInterrupt`、`SIGINT`、`exit code -2` 后紧跟 `Stopped ... successfully`：通常是手动停止或重启，不是崩溃。
- `exit code 127` 和 `error while loading shared libraries`：动态库缺失或版本不匹配。
- 持续 `Robot connection lost`：机器人网络或 SDK 连接。
- 持续 Capture timeout：相机采集链。

## 15. 最短执行组合

机械臂不动：依次执行第 4、6、7、8、14 节。

夹爪不动：依次执行第 4、7、9 节；确认安全后再执行第 10 节。

相机无画面：依次执行第 4、12、14 节。

问题不明确：从第 3 节开始依次执行到第 14 节，跳过不适用末端和主动动作。

## 16. 结果打包

```bash
cd ~
tar -czf apex_direct_pro_check.tar.gz apex_direct_pro_check
echo "结果文件：$HOME/apex_direct_pro_check.tar.gz"
```

发送前检查并脱敏客户 IP、主机名和客户信息。
