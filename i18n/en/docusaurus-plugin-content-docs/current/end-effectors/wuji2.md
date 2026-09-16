---
title: Wuji Second-Generation Dexterous Hand
sidebar_position: 3
---

# Wuji Second-Generation Dexterous Hand: Direct Connection

Applies to **Gento ApexTool 1.0.7.86dex** on ARM64 Orin/Tianzhun, Ubuntu 22.04, and ROS 2 Humble. Other releases may have different interfaces.

The hand connects directly to the host ApexTool via Ethernet and the Wuji SDK. It does **not** use the robot end-effector board, CAN/vCAN, MarvinSDK, or GentoSDK. Hand-only operation requires neither the Robot service nor an arm or headset. Left, right, and dual-hand setups are supported; each hand has 20 joints, with positions in radians.

The bundle does **not** include glove capture, skeleton-to-joint retargeting, F7-key handling, or frontend mode switching. A glove application must publish ROS joint targets, and must not also drive the same hand directly through the SDK.

## 1. Safety and connection

Power the hand according to its hardware guide and connect it to the host directly or through a switch. Verify host NIC, hand IP, subnet mask, and route; installation does not change network addresses. Clear the work area, remove held objects, keep a hardware stop available, and use only one control source. Safely disable any other direct driver before stopping it. Do not run arm Home to diagnose hand communication.

## 2. Install and configure

Use the **complete offline bundle**, which includes the Wuji SDK and runtime dependencies, not its DEB alone:

```text
gento-apex-tool_1.0.7.86dex_humble_arm64_wuji_bundle.tar.gz
```

From the archive directory, review the installation plan before installing:

```bash
tar -xzf gento-apex-tool_1.0.7.86dex_humble_arm64_wuji_bundle.tar.gz
cd gento-apex-tool_1.0.7.86dex_humble_arm64_wuji_bundle
bash install.sh --check
bash install.sh
dpkg-query -W gento-apex-tool
```

Select `2) Direct host` and `4) Wuji2 (Ethernet, no glove)`. Expect version `1.0.7.86dex`. Installation does not start Tool. Do not separately install the SDK into system Python or Conda. This bundle is not for x86, Windows, or Ubuntu 24.04 / ROS 2 Jazzy.

| Purpose | Path |
|---|---|
| Transport and end-effector type | `/etc/apex/apex.env` |
| Hand configuration | `/opt/kernelmind/apex_tool/install/share/apex_tool/config/wuji2.yaml` |
| Home pose | `/opt/kernelmind/apex_tool/install/share/apex_tool/config/wuji2_home_pose.json` |
| Isolated SDK Python environment | `/opt/kernelmind/apex_tool/wuji2_venv` |

Verify `/etc/apex/apex.env`:

```ini
APEX_TOOL_TRANSPORT=direct
APEX_TOOL_TYPE=wuji2
```

To change it manually, safely disable the previous end effector, stop Tool, and back up the existing file. Edit only these settings; do not overwrite unrelated keys or create duplicates:

```bash
sudo systemctl stop apex-tool.service
sudo cp -a /etc/apex/apex.env "/etc/apex/apex.env.bak.$(date +%Y%m%d_%H%M%S)"
sudoedit /etc/apex/apex.env
```

`wuji` is the first-generation USB hand; `wuji2` is the second-generation Ethernet hand. In `wuji2.yaml` set:

```yaml
side: both  # left, right, or both
left_serial_number: ""
right_serial_number: ""
```

With default `both`, only detected hands get ROS interfaces. Blank serial numbers identify sides from the devices, not cable order; specify a serial number when multiple devices report the same side. Configuration is loaded only at startup. This release does not reconnect or re-enable automatically after hot plugging.

## 3. Start and inspect feedback

After checking the connection and safety conditions, start Tool alone:

```bash
sudo systemctl start apex-tool.service
journalctl -u apex-tool.service -n 60 --no-pager
```

Startup discovers devices and reads feedback, but **does not automatically enable or move the hand**. A hand enabled by another program may remain enabled; verify its state through that program.

In each new terminal, load the environments and inspect feedback:

```bash
source /etc/apex/apex_ros_env.sh
source /opt/kernelmind/apex_tool/install/setup.bash
ros2 topic echo /tj/hand_left2/joint_states --qos-reliability best_effort
```

Expect 20 `position`, `velocity`, and `effort` values per complete frame. Use `/tj/hand_right2/joint_states` for the right side. `Ctrl+C` stops display only. Measure with `ros2 topic hz /tj/hand_left2/joint_states`. Feedback polling defaults to 50 Hz; also check timestamps and changing positions.

## 4. Enable, choose mode, and control

**These commands may produce force.** Recheck the work area, sole control source, and hardware stop. Select mode 0, then request left-hand enablement and wait for the `enabled` topic to report `true`:

```bash
ros2 topic pub --once /tj/control/footkey2 std_msgs/msg/Int32 '{data: 0}'
ros2 service call /tj/hand_left2/set_enabled std_srvs/srv/SetBool '{data: true}'
ros2 topic echo /tj/hand_left2/enabled
```

Service `success: true` only acknowledges the request. Enable and verify the right hand separately with `/tj/hand_right2/...`. Recent complete 20-joint feedback is required; do not bypass a diagnostic timeout.

| `/tj/control/footkey2` | Mode | Input / behavior |
|---:|---|---|
| `0` | Standby / hold | No target while disabled; holds the last sent filtered target while enabled |
| `1` | Teleoperation | `/tj/hand_left2/joint_commands`, `/tj/hand_right2/joint_commands` |
| `2` | Home | Home pose for **all enabled, unlocked** second-generation hands |
| `3` | User control | `/tj/hand_left_user`, `/tj/hand_right_user` |
| `4` | Replay | `/tj/hand_left_replay`, `/tj/hand_right_replay`; external player required |

The mode topic is `std_msgs/msg/Int32`, not Bool. Both hands share a mode but have independent enablement. Mode 0 is **not** disablement or an emergency stop. Mode changes do not automatically enable hands or call frontend Hold, Go Home, or arm Home.

After the target stream is ready and the hand is enabled, select one mode as needed:

```bash
# Compatible glove ROS target stream
ros2 topic pub --once /tj/control/footkey2 std_msgs/msg/Int32 '{data: 1}'

# Customer-generated target stream; run separately when needed
ros2 topic pub --once /tj/control/footkey2 std_msgs/msg/Int32 '{data: 3}'
```

Mode 1 also accepts `/tj/hand_left_cmd` and `/tj/hand_right_cmd`, but use only one input and publisher per side. In mode 3, begin at the current feedback pose and use continuous, slow, small movements.

Before Home, verify that `home_qpos` in `wuji2_home_pose.json` has 20 appropriate radian angles, joint limits, and clear movement space:

```bash
ros2 topic pub --once /tj/control/footkey2 std_msgs/msg/Int32 '{data: 2}'
```

Home affects **all enabled, unlocked** hands. For one side, enable only that side. Missing or invalid Home data is rejected; zero angles are not substituted.

## 5. ROS 2 interfaces and data

Left-side examples follow; replace `left` with `right` for the other hand. Only detected hands create interfaces. All use `/tj`.

| Interface | Type | Purpose |
|---|---|---|
| `/tj/control/footkey2` | `std_msgs/msg/Int32` | Shared mode 0-4 |
| `/tj/hand_left2/set_enabled` | `std_srvs/srv/SetBool` | Enable/disable request |
| `/tj/hand_left2/enabled` | `std_msgs/msg/Bool` | Driver-confirmed enable state |
| `/tj/hand_left2/joint_commands` | `sensor_msgs/msg/JointState` | Mode 1 target |
| `/tj/hand_left_cmd` | `sensor_msgs/msg/JointState` | Alternative mode 1 target; choose one |
| `/tj/hand_left_user` | `sensor_msgs/msg/JointState` | Mode 3 target |
| `/tj/hand_left_replay` | `sensor_msgs/msg/JointState` | Mode 4 target |
| `/tj/hand_left2/joint_states` | `sensor_msgs/msg/JointState` | 20-joint position, velocity, effort feedback |
| `/tj/hand_left2/tactile` | `std_msgs/msg/Float32MultiArray` | Five-finger summary if supported and received |
| `/tj/hand_left2/tactile/thumb` | `std_msgs/msg/Float32MultiArray` | Thumb contacts; other names: `index`, `middle`, `ring`, `pinky` |

Target `position` must contain exactly 20 finite radians, no NaN/Inf, ordered thumb, index, middle, ring, pinky with four joints per finger. Leave `name` empty or use ordered `j0` through `j19`; names do not trigger reordering. Input `velocity` and `effort` are not targets. **Never assume all-zero angles are a safe open pose.**

Feedback only publishes new, complete valid frames; missing joints are not zero-filled or old frames repeated. SDK `effort` is not fingertip grip force. Tactile summary has six values per finger, `[fx, fy, fz, temperature, contacts, max_force]`, 30 values total. A missing finger has NaN entries; no summary is published if all are missing. Device documentation defines units and calibration. `enabled` cannot replace a hardware stop.

## 6. Parameters, shutdown, and recovery

`wuji2.yaml` is plain YAML: **do not add** `ros__parameters`. Stop the hand and Tool before changes, then restart to apply them.

| Parameter | Default | Description |
|---|---:|---|
| `side` | `both` | `left`, `right`, or `both` |
| `state_rate_hz` | `50.0` | Feedback polling, allowed 1-200 Hz |
| `kp` / `kd` | `5.0` / `0.15` | MIT settings, allowed 0-5 / 0-0.15 |
| `effort_limit` | `1.5` | SDK motor effort limit, not fingertip force |
| `position_ema` | `0.35` | Target filter, not a safety limit |
| `command_timeout_sec` | `0.5` | Timeout after valid target stream begins |
| `feedback_timeout_sec` | `0.5` | Complete feedback timeout |
| `enable_tactile` | `true` | Receive tactile data; does not calibrate |

Keep defaults initially. Do not mask communication faults by increasing gains or widening timeouts. For normal shutdown, support any held load, select standby, disable each hand, verify `enabled=false`, and stop Tool:

```bash
ros2 topic pub --once /tj/control/footkey2 std_msgs/msg/Int32 '{data: 0}'
ros2 service call /tj/hand_left2/set_enabled std_srvs/srv/SetBool '{data: false}'
ros2 topic echo /tj/hand_left2/enabled
```

After `data: false` appears, press `Ctrl+C` to stop listening. Also disable and verify the right hand if used. Finally run:

```bash
sudo systemctl stop apex-tool.service
```

After valid targets begin, exceeding `command_timeout_sec` locks the hand in hold; late commands do not resume motion. Exceeding `feedback_timeout_sec` requests disablement; restored feedback does not re-enable automatically. Investigate the cause, select mode 0, explicitly disable and re-enable, verify state, then select the target mode. Forced termination or communication faults cannot guarantee disablement reaches hardware; use the hardware stop when necessary.

## 7. Troubleshooting

| Symptom | Check |
|---|---|
| A side's topics are missing | Power, cable, IP/mask, discovery packets, `side`, serial number, Tool logs; an unconnected side is normally absent |
| Feedback but no motion | `enabled`, mode, input topic, target format, timeout lock |
| Enable fails or stays false | Mode 0, fresh complete 20-joint feedback, diagnostics; do not bypass checks |
| Glove data does not move hand | ROS 20-joint angles, mode 1, enable state, direct SDK conflict |
| No tactile data | Sensors, `enable_tactile`, device reports |
| Home rejected | File path, radians, 20 valid angles, lock state |

For support, provide wiring, side/model/serial number, OS and package version, first full error, and these read-only results. Redact unrelated sensitive information:

```bash
dpkg-query -W gento-apex-tool
systemctl status apex-tool.service --no-pager
journalctl -u apex-tool.service -n 120 --no-pager
ros2 topic list
ros2 topic info /tj/hand_left2/joint_states -v
```
