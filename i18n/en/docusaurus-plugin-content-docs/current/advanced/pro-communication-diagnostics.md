---
title: Marvin Pro Modular Diagnostics
sidebar_position: 5
---

# Marvin Pro Direct-Paste Communication Diagnostics

> Applies to Marvin Pro with M6 696, M6 Lite, M3, and related arm configurations.
>
> Every Bash block on this page is self-contained and can be pasted into a new controller terminal. No downloaded diagnostic script or local test file is required.

## 1. Operating Rules

1. Each Bash block creates or updates its own result files.
2. All checks are read-only except the active gripper test.
3. Start only the services required by the selected module.
4. When `APEX_ROS_NAMESPACE=tj` is configured, the commands resolve the namespace automatically.
5. Stop immediately if the robot moves unexpectedly.

Default result directory:

```text
~/apex_direct_pro_check/
```

Result markers:

| Marker | Meaning |
|---|---|
| `[MISSING]` | The topic is absent |
| `[DATA]` | At least one message was received |
| `[NO_DATA]` | The topic exists but no message arrived |
| Publisher count greater than 0 | A publisher exists; this does not prove data flow |
| Subscription count greater than 0 | A subscriber exists |

## 2. Recommended Startup Order

In Tianji M Apex, start the modules needed by the test:

1. **Robot -> Start**
2. **Teleop -> Start**
3. **Tool -> Start**, selecting the installed end effector
4. **Camera -> Start** only for camera tests
5. Connect the headset and enter teleoperation

## 3. System, Versions, ROS Domain, and Network

No business service is required. Paste the complete block:

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

Confirm the controller architecture, ROS distribution, product model, package versions, ROS Domain, network interfaces, routes, and robot reachability.

## 4. Services and Processes

Paste the complete block:

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

A required service must be `active`, and its process must remain running. A green service state alone does not prove that business topics carry data.

## 5. ROS Graph Inventory

Start Robot, and start Teleop, Tool, and Camera when checking the complete graph:

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

The generated node, topic, and service lists provide the baseline for the remaining checks.

Typical feedback and command interfaces include:

```text
/tj/info/robot_state
/tj/info/joint_feedback
/tj/joint_states
/tj/control/joint_cmd_A
/tj/control/joint_cmd_B
```

## 6. Robot Connection and Feedback

Requirement: Robot is started. Paste the complete block:

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

Healthy results include continuous robot information, arm state, joint feedback, joint states, and end-effector poses. If all feedback is missing, check Robot Node, SDK communication, DDS, the robot IP, and the physical network.

## 7. Headset and Controller Input

Requirements: Robot and Teleop are started, and the headset is connected. Paste the block, then move both controllers slightly and operate the enable and gripper inputs:

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

Target poses, enable states, gripper values, and joystick data should arrive and change with input. If the gripper command changes but the gripper does not move, continue with the passive gripper check.

## 8. Pro Dual-Arm Control Pipeline

Requirements: Robot and Teleop are started. Use only small, low-speed movements:

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

Expected data order:

```text
target_pose
  -> ik_request
  -> qp_controller/joint_cmd_A、B
  -> joint_cmd_A、B
  -> Marvin SDK
  -> joint_feedback
```

The last healthy layer identifies the likely fault boundary: headset/network, Teleop mapping, IK, QP, command mux, Robot Node, SDK, or robot controller.

## 9. Passive DM/ZY Gripper Communication

Start Tool with the correct end-effector type. This module only listens and does not publish motion commands:

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

Operate both headset gripper inputs slowly. Target values, feedback, vCAN interfaces, and CAN frames should all be present. A one-sided failure usually points to that side of the vCAN mapping, terminal bridge, power, CAN ID, or wiring.

## 10. Active Gripper Function Test

:::danger Motion test

This block moves both physical grippers. Keep both arms stationary, clear the gripper workspace, and stop headset gripper input before running it.

:::

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

Expected sequence:

```text
打开 -> 半闭合 -> 接近闭合 -> 半闭合 -> 打开
```

## 11. Wuji Dexterous Hands

Select Wuji in Tool, start Teleop, and paste the block:

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

Perform open, close, and individual-finger input. Missing Wuji interfaces are normal when Wuji is not installed.

## 12. Camera, Argus, H264, and WebRTC

Start Camera after confirming the GMSL driver and Argus service:

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

Check all configured images in the frontend or headset. A missing raw ROS image topic alone does not prove failure because production streaming may use Argus, H264, and WebRTC directly.

## 13. Recording, Playback, and Storage

Start Teleop, mount the data disk read-write, and start every source that must be recorded:

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

Create a short recording with small arm and end-effector movements. Verify the storage root, `metadata.yaml`, MCAP output, and playback.

## 14. Error Logs

Paste the block:

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

Separate current faults from historical log entries. Record the first recurring error and its upstream service.

## 15. Minimum Diagnostic Combinations

- Arm does not move: Services -> Robot feedback -> Headset input -> Dual-arm pipeline -> Logs.
- Gripper does not move: Services -> Headset input -> Passive gripper -> Logs.
- Camera has no image: Services -> Camera -> Logs.
- Unknown fault: run every read-only module in order.

## 16. Package Results

Paste the block after completing the required modules:

```bash
cd ~
tar -czf apex_direct_pro_check.tar.gz apex_direct_pro_check
echo "结果文件：$HOME/apex_direct_pro_check.tar.gz"
```

Before sending the archive externally, remove customer IP addresses, hostnames, customer names, and sensitive paths. Include the robot model, controller, end effector, software versions, reproduction steps, frontend screenshot, and motion video.
