---
title: Skye/Luna Modular Diagnostics
sidebar_position: 5
---

# Gento Skye/Luna Direct-Paste Communication Diagnostics

> Applies to Gento Skye and Gento Luna.
>
> Every Bash block on this page is self-contained and can be pasted into a new controller terminal. No downloaded diagnostic script or local test file is required. Gento and Marvin Pro use separate control stacks, so their pipeline assumptions must not be mixed.

## 1. Operating Rules

1. Each Bash block creates or updates its own result files.
2. All checks are read-only except the active gripper test.
3. Confirm the current robot is Skye or Luna before evaluating joint counts and body behavior.
4. Stop immediately if the robot moves unexpectedly.

Default result directory:

```text
~/apex_direct_gento_check/
```

| Marker | Meaning |
|---|---|
| `[MISSING]` | The topic is absent |
| `[DATA]` | At least one message was received |
| `[NO_DATA]` | The topic exists but no message arrived |
| Publisher count greater than 0 | A publisher exists; this does not prove data flow |
| Subscription count greater than 0 | A subscriber exists |

## 2. Skye and Luna Differences

| Item | Skye | Luna |
|---|---|---|
| Body | Vertical movement | Multi-joint body structure |
| Low-level SDK | Gento Skye L1 SDK | Gento Luna L1 SDK |
| Body command | Lift/body axis | Multiple body joints |
| Typical Teleop setting | `enable_tcp=false` | `enable_tcp=true` |
| Expected model identity | Gento Skye | Gento Luna |

## 3. Recommended Startup Order

1. **Robot -> Start**
2. Confirm the frontend model is Skye or Luna
3. **Teleop -> Start**
4. **Tool -> Start**, selecting the installed end effector
5. **Camera -> Start** only for camera tests
6. Connect the headset and enter teleoperation

## 4. System, Versions, Model, ROS Domain, and Network

No business service is required:

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

Confirm the architecture, ROS distribution, `APEX_ROBOT_PLATFORM=gento`, the correct Skye/Luna model, package versions, ROS Domain, network interfaces, routes, and robot reachability.

## 5. Services and Key Processes

Paste the complete block:

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

Required services must be active and the matching processes must remain running.

## 6. ROS Graph Inventory

Start Robot, and start Teleop, Tool, and Camera when checking the complete graph:

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

Typical feedback interfaces:

```text
/info/robot_info
/info/robot_state
/info/robot_cmd_state
/info/joint_feedback
/joint_states
```

Typical control and body interfaces:

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

Use the installed model and configuration as the source of truth for optional body and head topics.

## 7. Gento Robot Node and Feedback

Requirement: Robot is started:

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

Healthy results include robot information, arm state, joint feedback, joint states, and model-specific body feedback. If all feedback is missing, inspect Gento Robot Node, the L1 SDK, DDS, robot IP, and physical networking.

## 8. Headset, Controllers, and End-Effector Targets

Requirements: Robot and Teleop are started, and the headset is connected. Move both controllers and operate enable and gripper inputs while this block runs:

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

Targets, enable states, gripper values, joystick data, and model-specific body input should change with operator input.

## 9. Complete Gento Control Pipeline

Requirements: Robot and Teleop are started. Use small, low-speed movements only:

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

Expected data order:

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

The last healthy layer identifies whether the fault is in the headset/network, Teleop mapping, IK, QP, command mux, Gento Robot Node, L1 SDK, or robot controller.

## 10. Passive DM/ZY Gripper Communication

Start Tool with the correct end-effector type. This module listens only:

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

Operate both headset gripper inputs slowly. Target values, feedback, vCAN interfaces, and CAN frames should all be present.

## 11. Active Gripper Function Test

:::danger Motion test

This block moves both physical grippers. Keep both arms stationary, clear the gripper workspace, and stop headset gripper input before running it.

:::

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

The expected sequence is open -> half closed -> nearly closed -> half closed -> open.

## 12. Wuji Dexterous Hands

Select Wuji in Tool, start Teleop, and paste the block:

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

Perform open, close, and individual-finger input. Missing Wuji interfaces are normal when Wuji is not installed.

## 13. Camera, Argus, H264, and WebRTC

Start Camera after confirming the camera driver and Argus service:

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

Check all configured images in the frontend or headset. Production streaming may use Argus, H264, and WebRTC without exposing raw ROS image topics.

## 14. Recording, Playback, and Storage

Start Teleop, mount the data disk read-write, and start every source that must be recorded:

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

Create a short recording with arm, body, and end-effector movement appropriate for the model. Verify the storage root, `metadata.yaml`, MCAP output, and playback.

## 15. Error Logs

Paste the block:

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

Separate current faults from historical log entries. Record the first recurring error and its upstream service.

## 16. Minimum Diagnostic Combinations

- Robot or arm does not move: Services -> Robot feedback -> Headset input -> Complete pipeline -> Logs.
- Gripper does not move: Services -> Headset input -> Passive gripper -> Logs.
- Camera has no image: Services -> Camera -> Logs.
- Unknown fault: run every read-only module in order.

## 17. Package Results

Paste the block after completing the required modules:

```bash
cd ~
tar -czf apex_direct_gento_check.tar.gz apex_direct_gento_check
echo "结果文件：$HOME/apex_direct_gento_check.tar.gz"
```

Before sending the archive externally, remove customer IP addresses, hostnames, customer names, and sensitive paths. Include the exact Skye/Luna model, controller, end effector, software versions, reproduction steps, frontend screenshot, and motion video.

:::note Validation baseline

Before using these checks as formal acceptance criteria, capture known-good results separately on a healthy Skye and a healthy Luna for each supported release.

:::
