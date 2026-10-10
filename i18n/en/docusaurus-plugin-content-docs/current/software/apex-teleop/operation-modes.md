---
title: Teleoperation Modes and Input Sources
sidebar_position: 4
---

# Teleoperation Modes and Input Sources

This page explains the relationship between Input Mode, the IK source, and the teleoperation motion range. It also provides standard procedures for full-body, dual-arm, and mobile-base teleoperation. Controls may differ slightly by delivery release. If an option is absent from the UI, first verify that the service listed here exists on the target device.

## 1. Prerequisites

Before changing an input source:

1. Clear the workspace and keep the emergency stop within reach.
2. Start **Robot** and **Teleop** in Apex, and confirm that the robot is Ready.
3. On first unpacking, use drag mode to move the arms to the standard zero pose before selecting **Impedance Mode** and executing **Home**.
4. Release both headset-controller enable buttons before changing the teleoperation motion range.

Load the environment before running terminal commands:

```bash
source /etc/apex/apex_ros_env.sh
```

## 2. Input Mode

Input Mode selects the final joint-command source. Publishing a topic does not move the robot unless the corresponding Input Mode is active.

| UI option | Value | Purpose |
|---|---:|---|
| **None** | `0` | Do not forward external joint commands; use while changing sources, ending a test, or troubleshooting |
| **Teleop** | `1` | Use Teleop/QP output; required for both headset teleoperation and VLA Cartesian control |
| **Custom** | `3` | Use joint targets from a customer application; not for VLA Cartesian control |

`Planner=2` and `Replay=4` are used by planning, Home, or playback workflows. The current UI normally does not expose them as general manual controls.

Use the service to switch modes and the status topic to verify the result:

```bash
# None
ros2 service call /tj/control/set_input marvin_msgs/srv/Int "{data: 0}"

# Teleop / QP
ros2 service call /tj/control/set_input marvin_msgs/srv/Int "{data: 1}"

# Custom / User joint command
ros2 service call /tj/control/set_input marvin_msgs/srv/Int "{data: 3}"

ros2 topic echo /tj/control/input_mode --once
```

:::warning None is not an emergency stop
`None` only stops forwarding external motion input. It does not stop the Robot service and cannot replace the physical emergency stop.
:::

## 3. IK Source

The IK source selects the Cartesian request used by Teleop/QP. `/tj/info/ik_request_mux/active_source` is a read-only status topic; publishing to it cannot change the source.

Current Marvin Pro releases use `/tj/control/set_ik_input`:

| Value | IK source | Purpose |
|---:|---|---|
| `0` | Idle | Do not forward IK requests |
| `1` | VR | Headset Cartesian targets |
| `2` | VLA | VLA or customer Cartesian targets |
| `3` | Replay | IKRequest playback; normally selected and restored automatically by Playback |

```bash
# Check whether the device provides this interface
ros2 service type /tj/control/set_ik_input

# Select a source, for example VR
ros2 service call /tj/control/set_ik_input marvin_msgs/srv/Int "{data: 1}"

# Verify the active source
ros2 topic echo /tj/info/ik_request_mux/active_source --once
```

Use the following order to prevent stale IK output from being forwarded briefly:

| Scenario | Order |
|---|---|
| Headset teleoperation | First `set_ik_input=1`, then `set_input=1` |
| VLA/customer Cartesian target | First `set_ik_input=2`, then `set_input=1` |
| Customer joint target | First `set_input=3`, then `set_ik_input=0` |
| Stop external control | First `set_input=0`, then `set_ik_input=0` |

:::note Product difference
`set_ik_input` is a customer-facing interface on current Marvin Pro releases. If it is absent on a Skye/Luna or historical release, use the matched UI and delivery workflow. Do not call an internal mux interface unless instructed by support.
:::

## 4. Teleoperation Motion Range

Supported Skye/Luna releases provide these motion ranges:

| Mode | Value | Motion |
|---|---:|---|
| `full_body` | `0` | Arms, head, and body |
| `arms_only` | `1` | Arms only; body and head locked |
| `arms_head` | `2` | Arms and head; body locked |

```bash
# Full body
ros2 service call /tj/control/set_teleop_motion_mode \
  marvin_msgs/srv/Int "{data: 0}"

# Arms only
ros2 service call /tj/control/set_teleop_motion_mode \
  marvin_msgs/srv/Int "{data: 1}"

# Arms and head
ros2 service call /tj/control/set_teleop_motion_mode \
  marvin_msgs/srv/Int "{data: 2}"

ros2 topic echo /tj/info/teleop_motion_mode --once
```

The mode can change only while both headset-controller enable buttons are released. A request made while either button is held is rejected and the previous mode remains active. Marvin Pro is a dual-arm product and follows the dual-arm procedure without selecting a Gento full-body range.

## 5. Teleoperation Procedures

### 5.1 Skye/Luna full-body teleoperation

1. Start Robot, Teleop, and the headset network module. Complete Ready, Impedance Mode, and Home.
2. Release both enable buttons and select `full_body=0`.
3. When the base is not required, verify `no_base=0`.
4. Select **Teleop** as Input Mode in the matched Apex UI. Do not copy the Marvin Pro `set_ik_input=1` command to Skye/Luna; the native IK source values differ between the product lines.
5. Connect Pico and the waist and leg trackers, and verify the VR state.
6. Test small arm motions first, then verify the head, torso, lift, or leg mapping in sequence.

### 5.2 Dual-arm teleoperation

Use this procedure directly for Marvin Pro. On Skye/Luna, select `arms_only=1` first when only the arms should follow.

1. Start Robot and Teleop. Complete Ready, Impedance Mode, and Home.
2. On Skye/Luna, release both enable buttons and select `arms_only=1`. Skip this step on Marvin Pro.
3. Verify `no_base=0`.
4. On Marvin Pro, select IK source `VR=1` first and then Input Mode `Teleop=1`. On Skye/Luna, select **Teleop** in the matched UI and do not call the Pro `set_ik_input` service.
5. Connect the headset and test small left- and right-arm motions separately before increasing the range.

### 5.3 Teleoperation with a mobile base

This procedure applies only to systems delivered with a configured base-teleoperation module. Base mode and upper-body motion range are independent settings.

| Base mode | Value | Description |
|---|---:|---|
| `no_base` | `0` | Do not control the base |
| `joystick` | `1` | Drive the base with the controller joystick |
| `whole_body` | `2` | Include the base in whole-body mapping |

1. Clear the area around the base and keep the robot stationary.
2. Select the upper-body range, such as `full_body` or `arms_only`.
3. Select base mode `1` for joystick driving or `2` for whole-body mapping.
4. Verify the expected value on `/info/base_teleop/active_mode`.
5. Select sources according to the product: on Marvin Pro, select the VR IK source before Teleop; on Skye/Luna, select Teleop in the matched UI. Begin at low speed with small motions.
6. To finish, set base mode to `0` before setting Input Mode and the IK source to `0`.

```bash
# Joystick base teleoperation
ros2 service call /control/base_teleop/set_mode \
  marvin_msgs/srv/Int "{data: 1}"

# Whole-body base mapping
ros2 service call /control/base_teleop/set_mode \
  marvin_msgs/srv/Int "{data: 2}"

# Stop base teleoperation
ros2 service call /control/base_teleop/set_mode \
  marvin_msgs/srv/Int "{data: 0}"

ros2 topic echo /info/base_teleop/active_mode --once
```

## 6. Quick Troubleshooting

| Symptom | Check first |
|---|---|
| Headset connected but no robot motion | Robot Ready, Impedance Mode, Home, and Input Mode=`Teleop`; on Marvin Pro also verify IK=`VR` |
| Customer joint topic has data but no motion | Input Mode=`Custom`, valid timestamps, and complete joint arrays |
| VLA Cartesian topic has data but no motion | Do not select Custom; use IK=`VLA` and Input Mode=`Teleop` |
| Full-body/dual-arm mode cannot change | Both enable buttons released and service available |
| Base does not move | Base module installed, active mode `1/2`, base emergency stop, and drive state |
| UI options differ from this page | Verify that the UI, Teleop service, and controller belong to the same delivery release |

For complete definitions, see [Marvin Pro Customer Integration Interfaces](./customer-interfaces) and [Gento (Skye/Luna) ROS 2 Interfaces](./gento-interfaces).
