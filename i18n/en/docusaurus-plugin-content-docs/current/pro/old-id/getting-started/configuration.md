---
title: Common Configuration
sidebar_position: 4
---

# Common Configuration

## 1. Disable Official Camera or Gripper

Modify the launch file:

```bash
cd /opt/kernelmind/apex/install/node_manager/share/node_manager/launch
sudo chmod 666 bringup_all_dm_m6.launch.py
```

Comment out `dm_gripper` and `quadcam` related lines according to your actual configuration.

![Disable official camera and gripper](/img/pro_p22.png)

## 2. Change Robot IP / Payload / Other Parameters

Common config file paths:

```text
/opt/kernelmind/apex/install/marvin_ros_control/share/marvin_ros_control/config
/opt/kernelmind/apex/install/marvin_teleop/share/marvin_teleop/config
```

If a file is read-only, run first:

```bash
sudo chmod 666 <filename>
```

![Modify configuration parameters](/img/pro_p23.png)

## 3. Change Orin → Dual-Arm IP

Edit:

```text
/opt/kernelmind/apex/install/marvin_ros_control/share/marvin_ros_control/config/robot_param_m6.yaml
```

Field: `robot_ip`, default value `192.168.10.190`.

![Change Orin dual-arm IP](/img/pro_p48.png)

## 4. Change Headset Apex App IP

After the headset boots, open the Apex app from Unknown Sources. Press the left controller Menu button to bring up the config interface:

- **Item 1**: operator height — affects virtual controller alignment height.
- **Item 2**: IP to connect to Orin, typically `192.168.10.123`.

![Change headset Apex app IP](/img/pro_p52.png)

## 5. Change TCP Position

The default TCP is offset 50 mm along `Z+` from the flange. To modify, edit:

```text
/opt/kernelmind/apex/install/marvin_teleop/share/marvin_teleop/config/mjcf/marvin_pro_mink.xml
```

- Left arm: ~line 86, `tool` offset `0 0 0.05`
- Right arm: ~line 138, `tool` offset `0 0 0.05`

![TCP position notes](/img/pro_p75.png)

![TCP offset XML location](/img/pro_p76.png)

## 6. Change Home Position

The Home position is the robot reset point and teleop starting position. Modify both files:

```text
/opt/kernelmind/apex/install/marvin_teleop/share/marvin_teleop/config/mjcf/marvin_pro_mink.xml
/opt/kernelmind/apex/install/marvin_teleop/share/marvin_teleop/config/robot_param_m6.yaml
```

14 parameters total: the first 7 are for the left arm, the last 7 for the right arm, in **radians**.

![Home position notes](/img/pro_p78.png)

![Home position MJCF location](/img/pro_p79.png)

![Home position YAML location](/img/pro_p80.png)

> **Note**: Back up the original config files before modifying IP, payload, stiffness, damping, Home position, or TCP offset.

## 7. Foot Pedal Installation & Configuration

### 7.1 Install Dependencies & SDK

Orin must be connected to the internet:

```bash
sudo apt-get install libhidapi-dev
cd ~
git clone https://github.com/rgerganov/footswitch.git
cd footswitch
make
sudo make install
```

![Install libhidapi](/img/pro_p56.png)

![Download footswitch SDK](/img/pro_p57.png)

![Build and install footswitch](/img/pro_p58.png)

### 7.2 Map Foot Pedal Buttons

```bash
footswitch -1 -m shift -k left -3 -m shift -k right
```

If `cannot find footswitch` appears, verify the pedal USB is plugged into Orin.

Start in foot-pedal mode with:

```bash
cd /opt/kernelmind/apex
./bringup_RM_glove.sh
```

![Foot pedal button mapping](/img/pro_p59.png)

### 7.3 Foot Pedal Teleoperation Notes

- The controller side-button enable is inactive in foot-pedal mode; only the pedal can enable.
- Button 1: enable both left and right arms simultaneously.
- Button 3: return both arms to Home position.
- **Never** press the right joystick Menu button while holding down the enable pedal — doing so may cause the arms to drop and collide.
- Always release the pedal when not teleoperating.

![Foot pedal safety notes](/img/pro_p63.png)

## 8. Incremental Teleoperation Mode

Two position modes are supported:

| Mode | Description |
|---|---|
| Absolute position | Requires physical controller alignment with the headset's virtual blue/red controllers; misalignment can cause rapid arm motion on enable |
| Incremental position | Uses the controller position at enable time as zero; only subsequent translation and rotation deltas are sent as increments (factory default) |

To switch, edit:

```text
/opt/kernelmind/apex/install/marvin_teleop/share/marvin_teleop/config/robot_param_m6.yaml
```

Field:

```yaml
use_incremental_control: true   # incremental mode (default)
use_incremental_control: false  # absolute position mode
```

![Incremental motion notes](/img/pro_p65.png)

![use_incremental_control config](/img/pro_p66.png)
