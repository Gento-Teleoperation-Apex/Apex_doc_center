---
title: Topic Whitelist Configuration and Diagnostics
sidebar_position: 2
---

# Apex Topic Whitelist Configuration and Diagnostics

Updated: August 20, 2026
Applies to: Marvin Pro, Gento Skye, and Gento Luna
Audience: customer developers, testers, and technical-support engineers

## 1. Purpose

Apex uses several independent topic whitelists. They determine:

- which topics can be written to customer recordings;
- which topics can be loaded and published during playback;
- which topics can be forwarded to the frontend through WebSocket;
- which topics can be written to rolling diagnostic logs.

A topic appearing in `ros2 topic list` does not mean that it is automatically recorded, replayed, sent to the frontend, or included in a diagnostic bag.

This page has been updated for the current `/tj` interface rules as of August 20, 2026. Always verify the installed release and runtime parameters on the target controller. See the [Marvin Pro ROS Topic List](./ros-topic-list) for the consolidated reference.

:::warning Scope and safety

- Topic, parameter, and runtime-state queries are read-only.
- Confirm the installed version and back up the original file before changing a whitelist, an installed file, or a systemd service.
- Contact Gento Teleoperation Apex technical support when a release requires changes to a Python hard-coded whitelist. Customers should not edit installed Python files without confirmation.
- Restarting services or replaying command topics can interrupt control or move the physical robot. Stop the robot, clear the workspace, and keep the emergency stop accessible.

:::

## 2. Core Concepts

### 2.1 A whitelist does not create a topic

Adding a topic name only permits processing. It does not create a publisher or generate data. Processing normally requires all of the following:

1. The topic name matches exactly, including case, leading slash, and namespace.
2. The terminal, node, and publisher use the same ROS environment and `ROS_DOMAIN_ID`.
3. The topic exists and continues publishing while recording or forwarding.
4. The node can import the message type.
5. Publisher and subscriber QoS settings are compatible.
6. The topic is also selected for the current recording task.
7. The storage path is writable and both the recorder and rosbag writer are healthy.

### 2.2 Whitelist versus selection list

```text
白名单：系统允许处理的最大范围
选择列表：本次任务从白名单中实际选择的子集
```

The whitelist defines the maximum permitted set. A task selection is a subset and cannot bypass the whitelist.

### 2.3 Topic names must match exactly

```text
/joint_states
/tj/joint_states
joint_states
/Joint_States
```

When `APEX_ROS_NAMESPACE=tj` is enabled, some relative names resolve under `/tj/...`. Some releases also contain absolute names or hard-coded sets, so inspect the actual target controller first:

```bash
source /etc/apex/apex_ros_env.sh
echo "ROS_DOMAIN_ID=${ROS_DOMAIN_ID:-未设置}"
echo "APEX_ROS_NAMESPACE=${APEX_ROS_NAMESPACE:-未设置}"
ros2 topic list -t | sort
```

## 3. Four Independent Whitelists

| Whitelist | Purpose | Typical node | Current implementation | Typical service |
|---|---|---|---|---|
| Recording | Limits topics written to customer recordings | `data_bag_recorder` | Python hard-coded set in the reviewed release | `apex-teleop.service` |
| Playback | Limits topics loaded and published from a bag | `playback_node` | ROS parameter `topic_whitelist` | `apex-teleop.service` |
| WebSocket | Limits ROS topics forwarded to the web frontend | `topic_websocket_server` | ROS parameter with Python defaults | Backend/WebSocket module |
| Rolling diagnostics | Limits topics written to black-box diagnostic bags | `all_topic_log_recorder` | Python hard-coded set in the reviewed release | Normally starts with Robot |

Service ownership may change between releases. Use `systemctl cat`, node lists, and process inspection before restarting anything.

## 4. Recording Whitelist

### 4.1 Purpose and typical configuration

The recording whitelist defines the maximum topic set shown to the frontend and accepted by the MCAP recorder.

Typical installed configuration path:

```text
/opt/kernelmind/apex/install/recording_playback_nodes_py/share/recording_playback_nodes_py/config/recording_playback.yaml
```

Typical configuration:

```yaml
data_bag_recorder:
  ros__parameters:
    allowed_topics:
      - "/tj/joint_states"
      - "/tj/info/gripper_feedback_L"
      - "/tj/info/gripper_feedback_R"
      - "/tj/info/eef_left"
      - "/tj/info/eef_right"
      - "/tj/control/joint_cmd_A"
      - "/tj/control/joint_cmd_B"
      - "/hand_left/joint_commands"
      - "/hand_left/joint_states"
      - "/hand_right/joint_commands"
      - "/hand_right/joint_states"
```

### 4.2 Important limitation in the reviewed release

The reviewed `bag_recorder_data.py` checks a Python `ALLOWED_TOPICS` constant and does not read `allowed_topics` from this YAML file:

```text
只修改 recording_playback.yaml 中的 allowed_topics，不会让新 Topic 真正通过录制白名单。
```

Determine which implementation is installed:

```bash
source /etc/apex/apex_ros_env.sh

NODE=$(ros2 node list | grep '/data_bag_recorder$' | head -n 1)
echo "Recorder node: ${NODE:-未找到}"

if [ -n "$NODE" ]; then
    ros2 param list "$NODE" | sort
    ros2 param dump "$NODE"
fi
```

If `allowed_topics` appears, the release may support the YAML or ROS parameter. If it is absent, the recorder probably still uses a hard-coded set.

Locate the actual installed module:

```bash
find /opt/kernelmind/apex/install -type f -name 'bag_recorder_data.py' -print
```

Package names may include:

```text
recording_playback_nodes_py
bag_recorder_nodes_py
```

### 4.3 Query topics currently accepted by the recorder

Prefer the product recorder interface instead of reading YAML alone:

```bash
source /etc/apex/apex_ros_env.sh
ros2 service list -t | grep '/tj/recorder/control'
```

When the service type is `marvin_msgs/srv/JsonCommand`, query it directly:

```bash
source /etc/apex/apex_ros_env.sh

SERVICE=$(ros2 service list | grep '/tj/recorder/control$' | head -n 1)
echo "Recorder service: ${SERVICE:-未找到}"

if [ -n "$SERVICE" ]; then
    ros2 service call "$SERVICE" marvin_msgs/srv/JsonCommand \
      '{command_json: "{\"action\":\"get_topics\"}"}'
fi
```

The returned list contains topics that are currently visible, have an importable type, and pass the whitelist. It is not the complete ROS graph.

### 4.4 Selection for the current recording

The `start` request can supply a topic list. The recorder intersects that list with the whitelist. Topics outside the whitelist are ignored.

Prefer starting recordings from the frontend. Direct service calls are intended for diagnostics.

Example selection:

```bash
source /etc/apex/apex_ros_env.sh

SERVICE=$(ros2 service list | grep '/tj/recorder/control$' | head -n 1)
ros2 service call "$SERVICE" marvin_msgs/srv/JsonCommand \
  '{command_json: "{\"action\":\"start\",\"topics\":[\"/tj/joint_states\",\"/tj/info/gripper_feedback_L\",\"/tj/info/gripper_feedback_R\"]}"}'
```

Stop the recording:

```bash
source /etc/apex/apex_ros_env.sh

SERVICE=$(ros2 service list | grep '/tj/recorder/control$' | head -n 1)
ros2 service call "$SERVICE" marvin_msgs/srv/JsonCommand \
  '{command_json: "{\"action\":\"stop\"}"}'
```

### 4.5 Recommended change method

The preferred product implementation is:

```text
声明 allowed_topics 参数
-> 读取参数为集合
-> 所有白名单判断使用该集合
-> 在 recording_playback.yaml 维护具体列表
```

This keeps the actual list in YAML and avoids editing installed Python packages.

If Gento Teleoperation Apex technical support confirms that a temporary hard-coded change is required:

1. Record the installed package version.
2. Back up the target Python file.
3. Add only verified topic names.
4. Restart the service that owns the recorder.
5. Query `get_topics` and create a short validation recording.
6. Move the change into a formal package because reinstalling or upgrading overwrites the patch.

:::danger Do not experiment on installed Python files

Editing `site-packages` is not a normal customer configuration method. An incorrect change can prevent the recorder from starting and will be lost after a reinstall or upgrade.

:::

## 5. Playback Whitelist

### 5.1 Purpose

The playback whitelist controls which topics are loaded from a bag. A topic can exist in the bag but still be excluded from playback.

Typical configuration:

```yaml
playback_node:
  ros__parameters:
    topic_whitelist:
      - "/tj/joint_states"
      - "/tj/info/gripper_feedback_L"
      - "/tj/info/gripper_feedback_R"
      - "/hand_left/joint_commands"
      - "/hand_right/joint_commands"
```

The reviewed playback node declares and reads `topic_whitelist`, so YAML takes effect when the launch file loads the intended configuration.

### 5.2 Inspect the runtime value

```bash
source /etc/apex/apex_ros_env.sh

NODE=$(ros2 node list | grep -E '/(bag_)?playback_node$' | head -n 1)
echo "Playback node: ${NODE:-未找到}"

if [ -n "$NODE" ]; then
    ros2 param get "$NODE" topic_whitelist
fi
```

### 5.3 Notes

- In the reviewed release, an empty whitelist permits every topic. Do not set it empty casually.
- Reload the bag after changing the whitelist.
- The whitelist controls loading and publication; it does not switch the physical robot control source to Replay.
- Replaying command topics can move the robot. Verify the control source, Ready state, workspace, and emergency stop.

## 6. WebSocket Frontend Whitelist

### 6.1 Purpose

`topic_websocket_server` serializes ROS messages to JSON and sends them to the web frontend. The main default set in the reviewed source is:

```text
/tj/control/input_mode
/tj/info/arm_state
/tj/info/robot_state
/tj/info/vr_connected
/tj/joint_states
```

`/tj/info/robot_info` uses a separate subscription path and is not fully governed by the main set.

The default forwarding limit is approximately:

```text
ROS Topic 为 200 Hz，不代表 Web 前端也会收到 200 Hz。
```

A 200 Hz ROS source therefore does not imply 200 Hz in the frontend.

### 6.2 Inspect runtime parameters

```bash
source /etc/apex/apex_ros_env.sh

NODE=$(ros2 node list | grep '/topic_websocket_server$' | head -n 1)
echo "WebSocket node: ${NODE:-未找到}"

if [ -n "$NODE" ]; then
    ros2 param get "$NODE" topic_whitelist
    ros2 param get "$NODE" default_topic_fps
    ros2 param get "$NODE" path
fi
```

### 6.3 Typical symptoms

| Symptom | Check first |
|---|---|
| `ros2 topic echo` has data but the frontend does not | WebSocket whitelist, path, and client subscription |
| Frontend rate is much lower than ROS | `default_topic_fps` or per-topic limiting |
| `Whitelist topic not discovered yet` | Exact name, node startup, ROS Domain, and namespace |
| WebSocket connects but only robot information appears | Main whitelist topics are missing or silent |

Evaluate JSON serialization, CPU, network, and browser load before adding high-rate or large messages. Images and point clouds should not be added to the generic WebSocket whitelist merely because the frontend cannot see them.

## 7. Rolling Diagnostic Log Whitelist

### 7.1 Purpose

`all_topic_log_recorder` continuously records troubleshooting data as a rolling black box. It is separate from customer-initiated recording.

The reviewed default set is:

```text
/tj/joint_states
/tj/info/gripper_feedback_L
/tj/info/gripper_feedback_R
/tj/info/eef_left
/tj/info/eef_right
/tj/control/eef_cmd_A
/tj/control/eef_cmd_B
/tj/control/enableL
/tj/control/enableR
/tj/control/gripperValueL
/tj/control/gripperValueR
/tj/control/ik_cmd_A
/tj/control/ik_cmd_B
/tj/control/ik_request
/tj/control/ik_result
/tj/control/joint_cmd_A
/tj/control/joint_cmd_B
/tj/control/joint_cmd_plan_A
/tj/control/joint_cmd_plan_B
/tj/control/qp_controller/joint_cmd_A
/tj/control/qp_controller/joint_cmd_B
/tj/control/playback_control
/tj/control/target_poseL
/tj/control/target_poseR
/hand_left/joint_commands
/hand_left/joint_states
/hand_right/joint_commands
/hand_right/joint_states
```

The list is also hard-coded in the reviewed Python source. Configurable parameters are:

```text
log_storage_dir
max_log_bags
scan_interval_sec
```

Default log root:

```text
~/.ros/log/topic_log-*
```

The default retention is ten SQLite3 log directories.

### 7.2 Inspect state

```bash
source /etc/apex/apex_ros_env.sh

NODE=$(ros2 node list | grep '/all_topic_log_recorder$' | head -n 1)
echo "Log recorder node: ${NODE:-未找到}"

if [ -n "$NODE" ]; then
    ros2 param dump "$NODE"
    ros2 node info "$NODE"
fi

find "$HOME/.ros/log" -maxdepth 1 -type d -name 'topic_log-*' -printf '%TY-%Tm-%Td %TH:%TM  %p\n' 2>/dev/null | sort
```

Do not add every system topic. High-rate feedback, images, point clouds, and verbose diagnostics can create substantial disk and system load.

## 8. Product-Line Differences

### 8.1 Common Marvin Pro data

```text
/tj/joint_states
/tj/info/joint_feedback
/tj/info/eef_left
/tj/info/eef_right
/tj/info/gripper_feedback_L
/tj/info/gripper_feedback_R
/tj/control/joint_cmd_A
/tj/control/joint_cmd_B
/tj/control/gripperValueL
/tj/control/gripperValueR
```

### 8.2 Possible Gento Skye/Luna additions

Gento may include body, head, waist, lift, or leg data in addition to both arms. Candidate names include:

```text
/tj/control/joint_cmd_body
/tj/control/joint_cmd_head
/tj/control/qp_controller/joint_cmd_body
/tj/control/qp_controller/joint_cmd_head
/tj/info/robot_cmd_state
/tj/control/teleop/ik_request
```

These are candidates, not guaranteed interfaces. Inspect the target controller before adding anything:

```bash
source /etc/apex/apex_ros_env.sh
ros2 topic list -t | grep -E 'body|head|lift|robot_cmd_state|ik_request'
```

Skye and Luna have different body structures. Do not copy one body-topic set to the other without confirming type, meaning, and joint count.

## 9. Recommended On-Site Change Process

### 9.1 Capture the current environment

```bash
source /etc/apex/apex_ros_env.sh

echo '=== 系统与 ROS ==='
echo "ROS_DISTRO=${ROS_DISTRO:-未设置}"
echo "ROS_DOMAIN_ID=${ROS_DOMAIN_ID:-未设置}"
echo "APEX_ROS_NAMESPACE=${APEX_ROS_NAMESPACE:-未设置}"

echo '=== Apex 包版本 ==='
dpkg-query -W -f='${Package}\t${Version}\n' 2>/dev/null | \
  grep -E '^(kernelmind-apex|apexteleop|kernelmind-apex-tool)' || true

echo '=== 白名单相关节点 ==='
ros2 node list | grep -E 'data_bag_recorder|playback_node|topic_websocket_server|all_topic_log_recorder' || true
```

### 9.2 Back up the configuration

```bash
CFG=/opt/kernelmind/apex/install/recording_playback_nodes_py/share/recording_playback_nodes_py/config/recording_playback.yaml
sudo cp "$CFG" "$CFG.bak.$(date +%Y%m%d_%H%M%S)"
```

If the path differs, locate it first:

```bash
find /opt/kernelmind/apex/install -path '*/config/recording_playback.yaml' -print
```

### 9.3 Confirm whether the node reads the setting

```bash
source /etc/apex/apex_ros_env.sh

for suffix in data_bag_recorder playback_node topic_websocket_server all_topic_log_recorder; do
    NODE=$(ros2 node list | grep "/${suffix}$" | head -n 1)
    echo
    echo "=== ${suffix}: ${NODE:-未运行} ==="
    if [ -n "$NODE" ]; then
        ros2 param list "$NODE" | sort
    fi
done
```

If the corresponding whitelist parameter is absent, do not assume that YAML controls the installed implementation.

### 9.4 Restart the actual owning service

:::warning Service restart interrupts the current task

Stop teleoperation, recording, and playback before restarting a service. Do not run the following commands while the robot is moving.

:::

Recording and playback normally start with Teleop:

```bash
sudo systemctl restart apex-teleop.service
systemctl --no-pager --full status apex-teleop.service
```

Rolling diagnostic recording normally starts with Robot:

```bash
sudo systemctl restart apex-robot.service
systemctl --no-pager --full status apex-robot.service
```

Confirm WebSocket ownership on the target release:

```bash
systemctl list-units --type=service --all | grep -E 'apex-(backend|web|teleop)'
pgrep -af 'topic_websocket_server'
```

## 10. Validation After a Change

### 10.1 Validate the source topic

Replace `TOPIC` with the topic under test:

```bash
source /etc/apex/apex_ros_env.sh
TOPIC=/tj/info/eef_left

ros2 topic info "$TOPIC" -v
timeout 5 ros2 topic echo "$TOPIC" --once
timeout 8 ros2 topic hz "$TOPIC"
```

Expected result: publisher count is greater than zero, one message can be received, and the observed rate is reasonable.

### 10.2 Confirm that the recorder lists the topic

```bash
source /etc/apex/apex_ros_env.sh

SERVICE=$(ros2 service list | grep '/tj/recorder/control$' | head -n 1)
ros2 service call "$SERVICE" marvin_msgs/srv/JsonCommand \
  '{command_json: "{\"action\":\"get_topics\"}"}'
```

### 10.3 Create a short recording and inspect the bag

Use the frontend to record for 10 to 20 seconds while the target data changes. Locate the newest bag:

```bash
ROOT=${BAG_STORAGE_ROOT:-/media/$USER/BAG_STORAGE}
find "$ROOT" -type f -name metadata.yaml -printf '%T@ %h\n' 2>/dev/null | \
  sort -nr | head
```

Inspect the selected bag:

```bash
ros2 bag info /实际/bag/data/目录
```

Verify the topic name, type, and message count. A listed topic with zero messages is not a successful recording.

### 10.4 Validate the playback whitelist

:::danger Physical robot playback

Command-topic playback can move the physical robot. Prefer a no-motion environment for whitelist validation. Physical playback must follow the formal safety procedure with the emergency stop accessible.

:::

```bash
source /etc/apex/apex_ros_env.sh

NODE=$(ros2 node list | grep -E '/(bag_)?playback_node$' | head -n 1)
ros2 param get "$NODE" topic_whitelist
```

Reload the bag before checking playback logs and output topics.

## 11. Quick Troubleshooting

| Symptom | Likely cause | Action |
|---|---|---|
| Topic exists in ROS but not in the recording list | Recording whitelist, namespace mismatch, or unsupported type | Query `get_topics`, exact names, and recorder logs |
| YAML change has no effect | Hard-coded recorder, wrong installed path, or launch did not load the YAML | Inspect runtime parameters and installed implementation |
| Topic is selectable but absent from the bag | Not selected, no data during recording, QoS mismatch, or write failure | Check status, `echo`, `hz`, logs, and `ros2 bag info` |
| Topic is in the bag but absent during playback | Playback whitelist or bag was not reloaded | Inspect `topic_whitelist` and reload |
| ROS has data but frontend does not | WebSocket whitelist, path mismatch, or client filtering | Inspect WebSocket parameters and logs |
| Frontend rate is near 30 Hz | WebSocket rate limit | Check `default_topic_fps` |
| `/joint_states` works but `/tj/joint_states` does not | Whitelist and resolved name differ | Use the exact target topic name |
| CPU or disk load rises after adding a topic | High rate, large messages, or duplicate recording | Reduce scope and duration |
| Image topics make bags unexpectedly large | Image payload or separate MP4/WebRTC path | Use the product camera-recording path instead of adding every image topic |

## 12. Configuration Principles

1. Add only topics required by the task.
2. Prefer final feedback and final commands; add intermediate debug topics only when needed.
3. Evaluate bandwidth and storage separately for images, point clouds, and high-rate arrays.
4. Maintain separate Pro, Skye, and Luna sets.
5. Validate the source topic, recorder interface, and actual bag after every change.
6. Move field patches into a formal package before reinstalling or upgrading.
7. A whitelist is a software filtering boundary, not a real-time performance guarantee.

## 13. Reviewed Source Conclusions

As of the review baseline:

- `data_bag_recorder`: recording whitelist is the `ALLOWED_TOPICS` constant in `bag_recorder_data.py`; the reviewed implementation does not read YAML `allowed_topics`.
- `playback_node`: playback whitelist is read from the ROS parameter `topic_whitelist`.
- `topic_websocket_server`: frontend whitelist is read from `topic_whitelist`, with a default forwarding limit of approximately 30 Hz.
- `all_topic_log_recorder`: diagnostic whitelist is a Python `ALLOWED_TOPICS` constant.

Update this page whenever the implementation becomes parameterized, and retain the software version, product line, validation device, and validation date.
