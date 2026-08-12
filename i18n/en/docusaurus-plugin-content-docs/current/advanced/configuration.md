---
title: Configuration Changes
sidebar_position: 1
---

# Apex Teleoperation Configuration Changes

This page covers customer-accessible configuration for delivered Marvin Pro, Gento Skye, and Gento Luna systems. Package layouts, controllers, and end effectors may differ between releases. Always use the delivery checklist and installed version as the source of truth.

:::warning Before making changes

- Stop teleoperation and recording, and place the robot in a safe state.
- Back up the original file, change one category at a time, and perform no-motion checks first.
- Do not replace the current configuration with a complete file from another model or delivery batch.
- Control gains, QP parameters, collision models, and calibration data are not customer settings and must not be changed without technical support.

:::

## 1. Identify the Active Configuration

Configuration files may exist in both source and installation directories. Running services normally use the installation directory, so confirm the active service and package paths first.

```bash
source /etc/apex/apex_ros_env.sh

ros2 pkg prefix marvin_ros_control
ros2 pkg prefix marvin_teleop
ros2 pkg prefix marvin_qp_controller

systemctl cat apex-robot.service
systemctl cat apex-teleop.service
systemctl cat apex-camera.service
```

Inspect the global configuration:

```bash
grep -Ev '^\s*(#|$)' /etc/apex/apex.env
```

If a package or service is absent, follow the names used on that delivered system. Do not create a replacement service with the example name.

## 2. Back Up and Edit a File

Replace `CONFIG_FILE` with the confirmed path:

```bash
CONFIG_FILE=/actual/path/config.yaml
sudo cp "$CONFIG_FILE" "${CONFIG_FILE}.bak.$(date +%Y%m%d_%H%M%S)"
sudoedit "$CONFIG_FILE"
```

Use spaces, not tabs, in YAML files. Do not edit the generated `/etc/apex/dnsmasq.conf` or manually change `/etc/apex/apex_ros_env.sh`.

## 3. Customer-Accessible Settings

### 3.1 Global Environment

The global configuration file is `/etc/apex/apex.env`.

| Setting | Purpose | Requirement |
|---|---|---|
| `ROS_DOMAIN_ID` | ROS 2 communication domain | Must match on every controller, workstation, and development computer that communicates with the system |
| `ROS_LOCALHOST_ONLY` | Restricts ROS 2 to the local host | Set to `0` for communication between devices |
| `APEX_DNSMASQ_INTERFACE` | Interface used by the headset/control network | Must be an interface that exists on the system |
| `APEX_DNSMASQ_HOST_IP` | Host address of the DHCP interface | Must match the static IP assigned to that interface |
| `BAG_STORAGE_ROOT` | Recording destination | The directory or mounted drive must exist and be writable |
| `APEX_TOOL_TYPE` | End-effector type | Common values are `dm`, `zy`, and `none`; it must match the installed hardware and package |
| `APEX_TELEOP_MODE` | Teleoperation input mode | Common values are `controller` and `dexhand`; use the delivered configuration |
| `APEX_GLOVE_MODE` | Glove mode | Enable only when the matching glove and software are installed |
| `APEX_USE_RVIZ` | Starts RViz with the service | Normally remains `false` on delivered systems |

Customers may inspect the following product-identification values, but should contact technical support before changing them:

- `APEX_ROBOT_PLATFORM`: product platform, such as `pro` or `gento`.
- `APEX_COMPUTE_PLATFORM`: compute platform; supported values depend on the release.
- `APEX_ROBOT_MODEL`: robot model. Skye and Luna configurations are not interchangeable.
- `APEX_ROS_SETUP` and `APEX_WS_SETUP`: ROS and workspace setup paths; do not change during normal operation.

### 3.2 Robot Address

Robot-control configuration is normally stored under:

```text
/opt/kernelmind/apex/install/marvin_ros_control/share/marvin_ros_control/config/
```

The `robot_ip` value must match the robot controller's actual address. Addresses can differ between products and delivery batches, so do not reuse an example IP from another system. Verify network reachability before restarting Robot and then Teleop.

Customers must not change the control rate, joint order, feed-forward settings, Kp/Kd values, or end-effector dynamics.

### 3.3 Headset and ROS 2 Network

Check all of the following when changing network settings:

1. The headset, controller, and workstation use the planned subnet.
2. `APEX_DNSMASQ_INTERFACE` is the physical port connected to the headset network.
3. `APEX_DNSMASQ_HOST_IP` matches the static address on that port.
4. All communicating devices use the same `ROS_DOMAIN_ID`.
5. `ROS_LOCALHOST_ONLY=0` for communication between devices.

Changing only the DHCP pool without assigning a static address from the same subnet to the selected interface prevents the DHCP service from listening on that interface. Use the delivered wiring guide and network table for addresses.

### 3.4 Camera Channels

Camera configuration is normally stored under:

```text
/opt/kernelmind/apex/install/gmsl_quadcam/share/gmsl_quadcam/config/
```

Identify the file loaded by the camera service:

```bash
systemctl cat apex-camera.service
grep -Rns 'camera_sources' /opt/kernelmind/apex/install/gmsl_quadcam/share/gmsl_quadcam/config/
```

After technical support confirms the channel IDs, customers may change:

- `camera_sources.head_left`, `head_right`, `hand_left`, and `hand_right`: camera sources; use `none` for a channel that is not installed.
- `flip_180_option` (or `flip_180` in older releases): image orientation.
- `enable_compressed_pub`: compressed-image publication.

CSI numbering can differ between controllers. Use a single-camera test instead of assuming a channel map. Camera intrinsics, exposure, trigger mode, and hardware synchronization are calibration settings and must not be changed by customers.

### 3.5 Recording Directory

Use `BAG_STORAGE_ROOT` in `/etc/apex/apex.env` to select an existing, mounted recording directory. Verify that it exists, is writable, and has sufficient space:

```bash
test -d "$BAG_STORAGE_ROOT" && test -w "$BAG_STORAGE_ROOT" && echo writable
df -h "$BAG_STORAGE_ROOT"
```

Recording and playback configuration is normally stored at:

```text
/opt/kernelmind/apex/install/recording_playback_nodes_py/share/recording_playback_nodes_py/config/recording_playback.yaml
```

Only change topic allowlists and playback lists after confirming message-type and downstream compatibility. Gento replay may use a different chain from the standard recorder; do not mix the two configurations.

### 3.6 End-Effector Type

Use `APEX_TOOL_TYPE` to select the installed end effector. Confirm that its driver is installed and that only one end-effector control node is running. Do not run a manually started node while its service is active.

Motor IDs, position ranges, current limits, and end-effector Kp/Kd values must match the hardware and calibration data. Technical support must make those changes.

## 4. Apply Changes

Run `systemctl list-unit-files 'apex-*'` to verify the services installed on the device, then restart the services affected by the change:

| Change | Services normally restarted |
|---|---|
| Product, model, or ROS domain | Robot and Teleop; also Camera or Tool when affected |
| Robot IP | Robot, followed by Teleop |
| Teleoperation or network settings | Teleop; also the release-specific network service when DHCP changes |
| Camera channels | Camera |
| Recording path or topic list | The service hosting recording, normally Teleop |
| End-effector type | Tool/end-effector service and Teleop |

Common examples:

```bash
sudo systemctl restart apex-robot.service
sudo systemctl restart apex-teleop.service
sudo systemctl restart apex-camera.service
```

If the delivered system uses different service names, use the names found with `systemctl cat`. Do not create services from these examples.

## 5. Validate the Change

### 5.1 No-Motion Checks

```bash
source /etc/apex/apex_ros_env.sh

systemctl --no-pager --full status apex-robot.service apex-teleop.service
ros2 node list
ros2 topic echo /info/robot_info --once
ros2 topic echo /info/arm_state --once
ros2 topic echo /info/robot_state --once
ros2 topic echo /joint_states --once
ros2 topic hz /joint_states
```

Check cameras and the end effector using the interfaces available on the delivered system:

```bash
systemctl --no-pager --full status apex-camera.service
ros2 topic echo /quad_tile/compressed --once
ros2 topic echo /info/gripper_feedback_L --once
```

Some topics exist only on specific products or end-effector configurations.

### 5.2 Low-Risk Motion Checks

1. Clear the robot workspace and keep the emergency stop accessible.
2. Confirm that the UI, camera stream, and status feedback are normal.
3. Run Ready/Home and watch for errors or unexpected motion.
4. Begin with small single-arm motion, then test both arms. Test torso motion last on Gento.
5. Verify stop, restart, and disconnect recovery.

## 6. Settings Customers Must Not Change

The following items affect stability, safety limits, or calibration and may only be changed by trained engineers:

- Arm, torso, and gripper Kp/Kd, PD, feed-forward, and current limits.
- QP task weights, velocity limits, collision thresholds, collision pairs, and CoM/ZMP settings.
- Joint order, SDK mode enumeration, and control cycle.
- MJCF, SRDF, URDF, MvKDCfg, and other robot model files.
- Camera intrinsics, extrinsics, exposure, trigger, and hardware synchronization.
- systemd service definitions, launch files, and automatic-start scripts.

For these changes, provide technical support with the product model, controller, end-effector type, software versions, intended change, service logs, and a backup of the original configuration.

For startup, network, or device-detection issues, see [FAQ and Quick Reference](/advanced/troubleshooting).
