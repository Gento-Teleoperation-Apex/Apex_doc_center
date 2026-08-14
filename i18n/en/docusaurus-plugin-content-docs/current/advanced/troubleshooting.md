---
title: FAQ and Quick Reference
sidebar_position: 3
---

# Apex Teleoperation FAQ and Quick Reference

Updated: August 6, 2026  
Products: Marvin Pro, Gento Skye, and Gento Luna  
Controllers: Orin, Tianzhun, and Lingjing Thor  
End effectors: DM/OmniGripper, ZY gripper, and Wuji dexterous hand  
Purpose: customer troubleshooting, technical-support training, and on-site quick reference

## 1. Before Troubleshooting

### Q1: Why must the complete machine configuration be recorded first?

Pro and Gento use different control chains, while Ubuntu 22.04/Humble and Ubuntu 24.04/Jazzy require different packages. Record at least:

```text
Product line: Marvin Pro / Gento
Robot: Pro / Skye / Luna
Arms: M6 696 / M6 Lite / M3 / Gento configuration
Controller: Orin / Tianzhun / Lingjing Thor
OS and ROS: Ubuntu 22.04 + Humble / Ubuntu 24.04 + Jazzy
End effector: DM / ZY / Wuji / none
Software: kernelmind-apex, kernelmind-apex-tool, Apex-Teleop, SDK, headset APK
Network: controller IP, robot IP, headset Host IP, ROS_DOMAIN_ID
```

On the target machine:

```bash
dpkg --print-architecture
lsb_release -a
echo "$ROS_DISTRO"
dpkg-query -W -f='${Package} ${Version} ${Architecture}\n' \
  | grep -Ei 'kernelmind|apex|teleop|marvin|gento|ros-(humble|jazzy)'
```

| Controller | Ubuntu | ROS 2 | Architecture |
|---|---|---|---|
| Orin | 22.04 | Humble | arm64 |
| Tianzhun | 22.04 | Humble | arm64 |
| Lingjing Thor | 24.04 | Jazzy | arm64 |

### Q2: What general checks should be run first?

```bash
source /etc/apex/apex_ros_env.sh 2>/dev/null || \
  source /opt/kernelmind/apex/install/setup.bash
systemctl --no-pager --failed
ros2 node list
ros2 topic list
ros2 service list
```

Check the five core services:

```bash
systemctl status apex-backend.service --no-pager
systemctl status apex-robot.service --no-pager
systemctl status apex-camera.service --no-pager
systemctl status apex-teleop.service --no-pager
systemctl status apex-tool.service --no-pager
```

Older releases may not have a separate `apex-tool.service`. Before testing motion, clear the workspace, reduce the motion range, and confirm that no second command source is active.

## 2. Startup, Frontend, and Services

### Q3: What is the standard startup order?

```text
Check network and machine configuration
-> start Backend
-> verify GMSL/Argus
-> Start Robot in ApexApp
-> Start Camera
-> Start Teleop
-> start Tool for the installed end effector
-> connect the headset and perform a small-motion test
-> start recording last
```

Start Backend with:

```bash
sudo systemctl start apex-backend.service
```

### Q4: When should Backend be restarted?

Inspect it first:

```bash
systemctl status apex-backend.service --no-pager
curl -sS -o /dev/null -w 'HTTP %{http_code}\n' http://127.0.0.1:8080/docs
journalctl -u apex-backend.service -n 100 --no-pager
```

Restart it when the frontend cannot reach the local API, port `8080` is unresponsive because Backend is stuck, `/etc/apex/apex.env` was changed, or Backend itself is repeatedly failing:

```bash
sudo systemctl restart apex-backend.service
```

Camera timeouts, robot disconnects, and gripper faults should be handled in their own modules. Restarting Backend is not a universal repair.

### Q5: Which service corresponds to each module?

| Symptom | First service or component |
|---|---|
| Frontend API, module buttons, or port 8080 | `apex-backend.service` |
| Robot connection, robot IP, or SDK state | `apex-robot.service` |
| Camera black screen, configuration, or video process | `apex-camera.service` |
| Headset input, IK/QP, or teleoperation mode | `apex-teleop.service` |
| DM/ZY/Wuji end-effector node | `apex-tool.service` or the manually launched node |
| Argus has no frames or image-buffer timeout | `nvargus-daemon`, then Camera |

```bash
journalctl -u apex-robot.service -n 100 --no-pager
journalctl -u apex-camera.service -n 100 --no-pager
journalctl -u apex-teleop.service -n 100 --no-pager
journalctl -u apex-tool.service -n 100 --no-pager
```

### Q6: Should Teleop mode be `controller` or `dexhand`?

```bash
grep -E 'APEX_TELEOP_MODE|APEX_TOOL_TYPE' /etc/apex/apex.env
```

- Standard controllers with DM/ZY grippers usually use `APEX_TELEOP_MODE=controller`.
- Gloves or dexterous hands use `APEX_TELEOP_MODE=dexhand`.
- Some releases automatically select glove mode for `APEX_TOOL_TYPE=wuji` or `wujihand`.
- End-effector values are generally `dm`, `zy`, `wuji`, or `none`.

After editing, restart Teleop and Tool:

```bash
sudoedit /etc/apex/apex.env
sudo systemctl restart apex-teleop.service
sudo systemctl restart apex-tool.service
```

### Q7: What should be checked when the launch terminal shows red errors?

Find the earliest specific error before a summary such as `process has died`. Common signatures include missing shared libraries, missing files, symbol lookup errors, exit code `127`, version mismatch, and robot connection loss.

```bash
ldd <executable-path-from-the-error> | grep 'not found'
```

Confirm Ubuntu, ROS distribution, arm64 architecture, and release compatibility before installing a dependency. Do not link unrelated `.so` versions together.

### Q8: What if `/etc/apex/apex_ros_env.sh` does not exist?

```bash
ls -l /etc/apex
ls -l /opt/kernelmind/apex/install/setup.bash
```

For a temporary shell:

```bash
source /opt/ros/<humble-or-jazzy>/setup.bash
source /opt/kernelmind/apex/install/setup.bash
```

Do not mix Humble and Jazzy. If the Apex setup file is also absent, verify that `kernelmind-apex` is installed correctly.

### Q9: What if the installed environment references a build-machine path?

A message such as `not found: /home/marvin/test_apex_ws/install/local_setup.bash` indicates a leaked build prefix. Locate it with:

```bash
grep -Rns '/home/marvin/test_apex_ws/install' /opt/kernelmind/apex/install 2>/dev/null
```

Back up the affected text environment file and relocate the prefix to `/opt/kernelmind/apex/install`. Do not create a fake build-workspace directory to hide the error.

## 3. Camera, Argus, H264, and WebRTC

### Q10: Where are camera IDs and `camera_sources` configured?

```text
/opt/kernelmind/apex/install/gmsl_quadcam/share/gmsl_quadcam/config
```

```bash
systemctl cat apex-camera.service
grep -Rns 'camera_sources' \
  /opt/kernelmind/apex/install/gmsl_quadcam/share/gmsl_quadcam/config
```

Common files are `quad_csi_quickview.yaml` and `sh5_quad_csi_quickview.yaml`.

| Controller | Common CSI IDs |
|---|---|
| Lingjing Thor | `0/1/2/3` |
| Tianzhun | `0/1/4/5` |
| Orin DK | `0/6/7/8` |

Actual IDs must be verified on the target hardware. Restart Camera after changing them.

### Q11: How should unused camera inputs be configured?

Set missing cameras to `none`:

```yaml
camera_sources:
  head_left: "csi://0"
  head_right: "csi://1"
  hand_left: "none"
  hand_right: "none"
```

### Q12: How is an upside-down composite corrected?

```yaml
flip_180: true
```

Restart Camera after changing it. This option rotates the whole composite by 180 degrees; per-camera rotation or mirroring may not be supported by the installed release.

### Q13: How should image-buffer timeout or `rendering black` be handled?

Stop Camera, test each real sensor ID with the delivered Argus utility, restart Argus if wiring and configuration are correct, and then restart Camera:

```bash
sudo systemctl stop apex-camera.service
command -v argus_camera
argus_camera -d 0
sudo systemctl restart nvargus-daemon
sudo systemctl restart apex-camera.service
```

### Q14: How can GMSL hardware and drivers be checked?

```bash
systemctl --type=service --all | grep -Ei 'gmsl|camera|argus'
dmesg | grep -Ei 'gmsl|csi|argus' | tail -n 100
v4l2-ctl --list-devices
```

If each camera works in the low-level test, inspect Apex sources, encoding dependencies, and service parameters. If it does not, inspect power, cables, the deserializer, connectors, and sensor IDs.

### Q15: Why might `/usb_cam_0/image_raw` be absent?

That USB-camera topic does not apply to every GMSL release. Inspect actual image topics:

```bash
ros2 topic list | grep -Ei 'image|camera|quad|compressed'
ros2 topic info /quad_tile/compressed -v
```

GMSL versions may expose only `/quad_tile/compressed`. If no image topics exist, verify ROS Domain, Camera service, Argus frames, `camera_sources`, and the `quad_csi_quickview` dependencies.

### Q16: How is a missing WebRTC video stream diagnosed on Windows or in a browser?

Open `edge://webrtc-internals` or `chrome://webrtc-internals`.

- No PeerConnection or `createOffer`: inspect frontend initialization, release, codec configuration, and playback conditions.
- PeerConnection with no video: inspect the video track, H264 profile, decoder, bitrate, packet loss, and signaling logs.
- No camera frames: repair GMSL/Argus first.

### Q17: What if Thor reports `libnppicc.so.13 => not found`?

Verify arm64 and the Jetson repository before installing NPP:

```bash
dpkg --print-architecture
apt-cache policy libnpp-13-0 libnpp-dev-13-0
apt-cache show libnpp-13-0 | grep -E 'Architecture|Version'
sudo apt install libnpp-13-0 libnpp-dev-13-0
sudo ldconfig
ldd /opt/kernelmind/apex/install/gmsl_quadcam/lib/gmsl_quadcam/quad_csi_quickview \
  | grep 'not found'
```

Never use an `ubuntu2404/x86_64` CUDA repository on an arm64 Thor.

## 4. Robot Connection and Teleoperation

### Q18-Q21: Robot IP, disconnects, and version mismatch

`robot_ip` must equal the real robot-controller IP. The host interface must be on a reachable subnet but must not use the same address.

```bash
grep -Rns 'robot_ip' /opt/kernelmind/apex/install/*/share/*/config 2>/dev/null
ip -br address
ip route get <ROBOT_IP>
ping -c 4 <ROBOT_IP>
```

After changing the active YAML, restart Robot and Teleop. Persistent `Robot connection lost` is not normal even if it later reconnects; inspect packet loss, power and cabling, competing SDK clients, and SDK/firmware compatibility. A controller version of zero or `Version mismatch` requires a matched host, SDK, and controller firmware release.

### Q22-Q24: The headset connects but one or both arms do not move

Find the last topic in the command chain that still has data:

```bash
ros2 topic echo /info/vr_connected --once
ros2 topic echo /control/target_poseL --once
ros2 topic echo /control/enableL --once
ros2 topic echo /control/teleop/ik_request --once
ros2 topic echo /control/ik_request --once
ros2 topic echo /control/qp_controller/joint_cmd_A --once
ros2 topic echo /control/input_mode --once
ros2 topic echo /control/joint_cmd_A --once
ros2 topic echo /info/robot_state --once
```

Some Pro releases do not expose `/control/teleop/ik_request`; use the target `ros2 topic list`. A working gripper does not prove that arm IK/QP, Ready, or final commands are healthy. For a one-sided fault, compare L/R targets, enables, QP output, final commands, feedback, power, cabling, and SDK error codes.

### Q25-Q27: Headset network and system prompts

For `controller_udp connect failed`, verify the Host IP, routes, firewall, matching APK, and the TCP `9010` session.

| Port | Protocol | Purpose |
|---:|---|---|
| 9000/9001 | UDP | Left/right controller input |
| 9002/9003 | UDP | Left/right end-effector feedback |
| 9004 | UDP | Body or auxiliary data |
| 9010 | TCP | Session and heartbeat |
| 8888 | UDP | Host discovery |

```bash
ss -lntup | grep -E ':8888|:9000|:9001|:9002|:9003|:9004|:9010'
```

A DHCP offer only means that the server attempted an assignment. Check the headset's actual IP, configured Host IP, controller interface IP, TCP and UDP traffic, APK version, and permissions. Complete headset boundary, safety, privacy, camera, and storage prompts before starting Apex.

### Q28-Q29: Arm Kp/Kd and oscillation

Common Pro parameter files are under:

```text
/opt/kernelmind/apex/install/marvin_ros_control/share/marvin_ros_control/config
```

Locate `left_kd` and `right_kd`, back up the active file, preserve array lengths and floating-point formatting, change values only slightly, restart Robot then Teleop, and validate unloaded single-arm motion first. If oscillation begins, stop immediately and restore the backup. Arm gains, QP task weights, and gripper MIT gains are different settings.

### Q30: Gento shakes or stops while leaning forward with arms extended

This is a known issue in affected releases. Avoid repeatedly reaching the problematic limit and update to a Teleop release that supports the newer Gento SDK, then validate leaning, extension, loaded holding, and recovery.

### Q31: How should a soft stop be cleared?

Confirm safety, inspect the fault and stop reason, clear the fault, perform ServoReset/controller reset if required, restore the mode, and set Ready again. Query the actual target services before calling them:

```bash
ros2 service list | grep control
ros2 service type <service-name>
```

## 5. DM, ZY, and Wuji End Effectors

### Q32-Q33: Duplicate Tool nodes and missing gripper commands

Never run a systemd Tool node and a manual node against the same device:

```bash
systemctl status apex-tool.service --no-pager
ros2 node list | grep -Ei 'gripper|tool|hand'
ros2 topic info /control/gripperValueL -v
```

For missing `/control/gripperValueL/R`, verify `ROS_DOMAIN_ID`, `APEX_TELEOP_MODE`, `APEX_TOOL_TYPE`, publishers, and a compatible headset APK. All nodes and terminals must use the same Domain.

### Q34: How is a DM gripper started, reset, and tested once?

```bash
source /etc/apex/apex_ros_env.sh
source /opt/kernelmind/apex_tool/install/setup.bash 2>/dev/null || true
ros2 launch dm_gripper_py dm_gripper.launch.py
ros2 service call /control/reset_grippers std_srvs/srv/Trigger '{}'
ros2 topic pub --once /control/gripperValueL std_msgs/msg/Float32 '{data: 0.2}'
ros2 topic pub --once /control/gripperValueR std_msgs/msg/Float32 '{data: 0.2}'
```

Command direction and scaling depend on the delivered launch. Do not mix raw motor positions with normalized ROS values.

### Q35-Q37: Missing vCAN, one-sided enable failure, or no elasticity

```bash
ip -details link show vcan0
ip -details link show vcan1
ros2 topic echo /info/gripper_feedback_L --once
ros2 topic echo /info/gripper_feedback_R --once
ros2 topic echo /info/gripper_feedback_L_err --once
ros2 topic echo /info/gripper_feedback_R_err --once
```

Creating an empty vCAN interface does not bridge data to physical hardware. Check Robot's end-effector bridge, power, terminal board, fuses, cables, IDs, CAN channels, initialization logs, and error codes. Reset the grippers before changing MIT gains.

### Q38-Q40: DM gains, two-gripper interference, and small position error

Locate the active `DM_gripper.py` and `controlMIT` calls before modifying Kp/Kd:

```bash
find /opt/kernelmind -path '*dm_gripper_py*' -name 'DM_gripper.py' 2>/dev/null
grep -Rns 'controlMIT' /opt/kernelmind/apex*/install 2>/dev/null
```

When both grippers interfere, first eliminate duplicate nodes and command publishers, then inspect motor IDs, left/right channels, vCAN traffic, power drop, command rate, and smoothing. Small feedback error may be normal mechanical clearance or load; investigate growing error, failure to reach the target, oscillation, or error codes.

### Q41: What if ZY reports `executable 'zy_gripper_node' not found`?

```bash
ros2 pkg prefix zy_gripper_py
ls /opt/kernelmind/apex*/install/zy_gripper_py/lib/zy_gripper_py
ls /opt/kernelmind/apex*/install/zy_gripper_py/share/zy_gripper_py/launch
```

Install the complete colcon package output, not only `share/launch`, or rebuild it in the correct ROS environment.

### Q42-Q43: Wuji topics or unstable tracking

```bash
echo "$ROS_DOMAIN_ID"
grep -E 'ROS_DOMAIN_ID|APEX_TELEOP_MODE|APEX_TOOL_TYPE' /etc/apex/apex.env
ros2 topic list | grep -Ei 'hand|glove|footkey'
```

Wuji generally requires `APEX_TOOL_TYPE=wuji` and dexhand/glove mode. Expected topics include hand commands, hand states, and `/control/footkey`. If topics are healthy but motion is unstable, keep the controller/tracker visible to the headset and verify glove, pedal enable, side mapping, commands, and feedback.

## 6. ROS Domain, Topics, and Command Sources

### Q44: Nodes run but cannot see each other's topics after an update

```bash
echo "$ROS_DOMAIN_ID"
echo "$ROS_LOCALHOST_ONLY"
grep -E 'ROS_DOMAIN_ID|ROS_LOCALHOST_ONLY' /etc/apex/apex.env
```

All participants must use the same Domain. Cross-machine DDS generally requires `ROS_LOCALHOST_ONLY=0`. Restart affected services and open a fresh terminal after changing the environment.

### Q45: How can input, QP, and final-source failures be separated?

```bash
ros2 topic echo /control/teleop/ik_request --once
ros2 topic echo /control/ik_request --once
ros2 topic echo /control/qp_controller/joint_cmd_A --once
ros2 topic echo /control/input_mode --once
ros2 topic echo /control/joint_cmd_A --once
```

| Last healthy stage | Next area to inspect |
|---|---|
| No Teleop IK | Headset, enable, `controller_udp` |
| Teleop IK but no selected IK | IK source/mux |
| IK but no QP | QP, model, robot state, libraries |
| QP but no final command | `input_mode` and `joint_cmd_mux` |
| Final command but no motion | Ready, SDK, network, hardware |

### Q46: Is the Jazzy `ROS_LOCALHOST_ONLY` warning itself a fault?

Not necessarily, but a value of `1` still restricts cross-machine discovery. Check its actual effect rather than ignoring it because the message is only a warning.

## 7. Libraries, Releases, and Dependencies

### Q47-Q49: Missing Pinocchio, eiquadprog, MarvinSDK, or incomplete packages

```bash
ldd /opt/kernelmind/apex/install/marvin_teleop/lib/marvin_teleop/teleop_manager | grep 'not found'
ldd /opt/kernelmind/apex/install/marvin_qp_controller/lib/marvin_qp_controller/qp_controller | grep 'not found'
find /usr/local /usr /opt -name '*MarvinSDK*.so*' 2>/dev/null
ldconfig -p | grep -i marvin
sudo dpkg --audit
```

On Jazzy, matching packages may include `ros-jazzy-pinocchio` and `ros-jazzy-eiquadprog`. A specific missing SONAME means ABI mismatch; install the build-time version or rebuild on the target instead of creating a false symlink. In `dpkg -l`, only `ii` means fully configured.

### Q50: What if apt reports `amd64 does not match system arm64`?

Stop immediately and do not run `apt autoremove`. Disable the incorrect x86 CUDA source, clean apt, restore the correct Jetson arm64 repository, and simulate repair first:

```bash
sudo dpkg --configure -a
sudo apt clean
sudo apt update
sudo apt --fix-broken install -s
```

Do not proceed if the simulation removes JetPack, L4T, CUDA, TensorRT, or ROS core packages.

### Q51: How are Apex Python dependency conflicts checked?

```bash
/opt/kernelmind/venv/bin/pip check
```

Repair only the Apex virtual environment, not system Python. A healthy result is `No broken requirements found.`

### Q52: How is release compatibility confirmed?

Record `kernelmind-apex`, `kernelmind-apex-tool`, Apex-Teleop, SDK, controller firmware, headset APK, Ubuntu, ROS, and architecture. Simulate package installation first:

```bash
sudo apt-get -s install ./<package>.deb
```

## 8. Recording, Storage, and Rates

### Q53-Q54: Damaged MCAP, missing metadata, or unavailable storage

Check recorder exit, disk disconnect/read-only/full state, stop/flush completion, and the actual recorder package:

```bash
mount | grep BAG_STORAGE
df -h | grep BAG_STORAGE
ros2 pkg prefix recording_playback_nodes_py
ros2 pkg prefix bag_recorder_nodes_py
grep -n 'BAG_STORAGE_ROOT' /etc/apex/apex.env
```

The common location is `/media/<user>/BAG_STORAGE/recorded_bags`. Perform a short recording and confirm both MCAP and `metadata.yaml` before a long test.

### Q55: How should EEF, gripper, and joint rates be measured?

```bash
ros2 topic hz /info/eef_left
ros2 topic hz /info/eef_right
ros2 topic hz /info/gripper_feedback_L
ros2 topic hz /info/gripper_feedback_R
ros2 topic hz /info/joint_feedback
ros2 topic hz /joint_states
```

Record warm-up, duration, motion load, publisher count, sample count, mean, standard deviation, P95/P99, maximum period, and dropouts. Historical 120-second full-load measurements were approximately 939 Hz for EEF, 198 Hz for grippers, 200 Hz for joint feedback, and 100 Hz for `/joint_states`; these are references, not hard real-time guarantees.

## 9. Licensing and Other Issues

### Q56: What do `UID directory not found` and `Not licensed for this machine` mean?

The target registration material is missing and `teleop_manager` exits. Follow the authorized UID deployment process. Do not bypass licensing with empty or fabricated files.

### Q57: Does an offline ToDesk or NoMachine session mean Apex failed?

No. Remote-desktop connectivity and Apex services are separate systems and must be diagnosed separately.

### Q58: What does `Address already in use` mean?

Another process already listens on the frontend port:

```bash
ss -ltnp | grep ':<PORT>'
ps -ef | grep '[a]pp.py'
```

Use the existing service or stop the identified old process. Do not repeatedly launch duplicate frontends.

### Q59: Why can Tool packages be absent while main Apex is installed?

Newer releases may deliver `kernelmind-apex-tool` as a separate package under `/opt/kernelmind/apex_tool/install`:

```bash
dpkg-query -W -f='${Package} ${Version} ${Architecture}\n' \
  | grep -Ei 'kernelmind-apex-tool|kernelmind-apex'
source /etc/apex/apex_ros_env.sh
source /opt/kernelmind/apex_tool/install/setup.bash
ros2 pkg prefix apex_tool
ros2 pkg prefix dm_gripper_py
ros2 pkg prefix zy_gripper_py
```

Source main Apex first and the Tool overlay second.

## 10. Symptom Quick Reference

| Symptom | First check | Direction |
|---|---|---|
| ApexApp cannot manage modules | Backend/API and `8080/docs` | Inspect and restart Backend if required |
| Camera buffer timeout | Low-level Argus test | Restart Argus, then Camera |
| Wrong/missing camera | `camera_sources` | Use actual CSI IDs; set absent inputs to `none` |
| Upside-down image | `flip_180` | Change YAML and restart Camera |
| Missing USB image topic | Actual image topics | GMSL may use `/quad_tile/compressed` |
| No WebRTC PeerConnection | Frontend and codec | Inspect browser WebRTC internals |
| Robot cannot connect | IP and subnet | Correct active YAML; restart Robot and Teleop |
| Gripper works but arms do not | IK/QP/Ready chain | Find the first topic without data |
| `controller_udp connect failed` | Host IP and ports | Verify APK, routes, firewall, TCP session |
| Topics disappear after update | ROS Domain | Unify `ROS_DOMAIN_ID` |
| Exit code 127 | Shared libraries | Run `ldd` and install matching dependencies |
| amd64 package on arm64 | Repository architecture | Stop and repair repositories safely |
| DM `No such device` | vCAN and bridge | Verify interface, Robot bridge, and physical CAN |
| Two grippers oscillate | Duplicate publishers | Keep one source, then inspect power and CAN |
| ZY executable missing | Incomplete install | Install full colcon output |
| MCAP damaged, no YAML | Recorder and storage | Verify mount, flush, and active package |
| UID directory missing | License registration | Deploy authorized UID material |

## 11. Common Paths

| Purpose | Path |
|---|---|
| Apex root | `/opt/kernelmind/apex` |
| Main install | `/opt/kernelmind/apex/install` |
| Tool overlay | `/opt/kernelmind/apex_tool/install` |
| Environment configuration | `/etc/apex/apex.env` |
| ROS environment script | `/etc/apex/apex_ros_env.sh` |
| Robot configuration | `/opt/kernelmind/apex/install/marvin_ros_control/share/marvin_ros_control/config` |
| New Robot configuration candidate | `/opt/kernelmind/apex/install/marvin_ros2_control/share/marvin_ros2_control/config` |
| Teleop configuration | `/opt/kernelmind/apex/install/marvin_teleop/share/marvin_teleop/config` |
| QP configuration | `/opt/kernelmind/apex/install/marvin_qp_controller/share/marvin_qp_controller/config` |
| Camera configuration | `/opt/kernelmind/apex/install/gmsl_quadcam/share/gmsl_quadcam/config` |
| Apex ROS logs | `/var/log/apex/ros` |
| User ROS logs | `~/.ros/log` |
| Recording directory | `/media/<user>/BAG_STORAGE/recorded_bags` |
| Gento IK playback | `~/gento_replay_bags` |

## 12. Information to Return to Support

```text
1. Robot, arms, controller, and end-effector configuration
2. Ubuntu, ROS, and CPU architecture
3. kernelmind-apex, Apex-Teleop, Tool, SDK, and APK versions
4. Operation immediately before the failure
5. Complete error output, especially the first and final errors
6. Service status and latest 100 journal lines
7. ROS_DOMAIN_ID and ROS_LOCALHOST_ONLY
8. Relevant topic info/echo output
9. Reproducibility and which restart temporarily recovers it
10. Modified configuration files with before/after values
```

Separate confirmed facts, verified experience, and unverified hypotheses. Do not label a terminal board, collision, network, or motor as the final cause without logs or a controlled swap test.
