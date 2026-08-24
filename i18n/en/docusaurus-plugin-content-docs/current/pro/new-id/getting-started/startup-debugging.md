---
title: Startup and Debugging
sidebar_position: 3
---

# Marvin Pro Startup and Debugging

This page applies to the current Tianzhun-controller version and covers the minimum sequence from power-on to first teleoperation. For buttons, recording, playback, and logs, see [Current Marvin Pro Apex Teleop](/software/apex-teleop/pro-current).

## 1. Before startup

- Connect the robot, cabinet, host PC, and headset according to [Hardware Wiring](./hardware-wiring).
- Release the emergency stop and clear the robot workspace.
- Put the host PC and Tianzhun controller on the same subnet.
- Connect the headset to the same LAN.
- Check whether the robot is still in its factory packing pose. **Do not click Home from the packing pose. A wrist camera may collide with the center column.**

## 2. Connect to the Controller

Select the address and account for the controller installed in the device. These are factory defaults; use the delivery configuration if the IP address, username, or password has been changed.

| Controller | Default IP | Username | Default password |
|---|---|---|---|
| Tianzhun | `6.6.7.100` | `nvidia` | `nvidia` |
| Lingjing Thor | `6.6.7.100` | `user` | `1` |

Tianzhun controller:

```bash
ping 6.6.7.100
ssh nvidia@6.6.7.100
```

Lingjing Thor controller:

```bash
ping 6.6.7.100
ssh user@6.6.7.100
```

Enter the corresponding default password on the first SSH connection. If the delivered device already uses a changed password, do not attempt to restore the factory default.

After controller power-on, if the delivered system contains `~/cam_geac`, initialize the cameras according to the delivered configuration:

```bash
cd ~/cam_geac
./rb_camera.sh init
```

Start the Apex backend service:

```bash
sudo systemctl start apex-backend.service
sudo systemctl status apex-backend.service --no-pager
```

> Disable `X11-Forwarding` in MobaXterm to avoid camera timeout or headset video issues.

## 3. Start Apex Teleop and the Robot

1. Open Apex Teleop.
2. Enter the Tianzhun controller IP in the upper-right field and press **Enter**.
3. Start **Robot**.
4. Confirm that the URDF pose matches the physical robot.
5. Start **Teleop** and **dnsmasq**.
6. Start **Camera** when video is required. Start **Tool** only when an end effector is configured.
7. Click **Start Robot** in the lower-left card.

![Current Marvin Pro Apex Teleop](/img/software/apex-teleop/pro-main.png)

## 4. First Unpacking: Exit the Packing Pose

:::danger Do not Home directly from the packing pose
The robot is delivered with both arms hanging vertically close to the center column. Calling Home directly from this pose can cause a wrist camera to collide with the column. After first unpacking, or whenever the robot has been manually returned to the packing pose, first move all 14 arm joints to zero.
:::

After completing the previous section, confirm that **Robot** and **Teleop** are running and the robot is Ready. Open RQt from a desktop terminal with the Apex ROS environment loaded:

```bash
source /etc/apex/apex_ros_env.sh
rqt
```

In RQt, open **Plugins → Services → Service Caller**, then perform these calls:

1. Select `/control/set_mode`, set `data` to `1`, and switch to Position Mode.
2. Select `/control/set_input`, set `data` to `2`, and select Planner input.
3. Select `/control/movej`, set `joint_values` to the following 14 zeros, and click **Call**:

```text
[0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0]
```

Watch the physical robot and the distance between each wrist camera and the center column throughout the motion. Keep the emergency stop within reach. Continue only after both arms reach the all-zero pose. This section does not need to be repeated when the robot has already left the packing pose and its starting path is known to be safe.

## 5. Enter the Teleoperation Pose

1. Confirm that the robot has left the packing pose and is at the all-zero pose or another verified safe starting pose.
2. Select **Impedance Mode**.
3. Click **Home** and wait for the teleoperation initial pose.
4. Set **Input Mode** to **Teleop**.

## 6. Connect the Headset

Marvin Pro supports Pico and Meta Quest:

- [Pico headset guide](/xr-teleop/pico)
- [Meta Quest headset guide](/xr-teleop/meta)

Connect the headset cable, open the Apex headset client, and connect to the controller. Confirm the VR state in Apex Teleop, then begin with small motions in a clear workspace.

## 7. Quick Checks

| Symptom | Check |
|---|---|
| Cannot connect from the IP field | IP, subnet, cable, and controller network |
| Robot does not start | E-stop, robot power, controller link, and Robot log |
| URDF does not follow the robot | Robot module and robot model configuration |
| Teleop unavailable | Robot running and Ready state |
| Headset cannot connect | dnsmasq, headset cable, connection IP, and VR state |
| Camera is black | Camera module, camera initialization, and `camera_sources` |
| No teleoperation motion | Impedance Mode, Home completion, and Teleop input mode |
| First startup from the packing pose | Do not Home directly; use RQt and `/control/movej` to move all 14 arm joints to zero first |
| Home path approaches the center column | Stop immediately and use the emergency stop if needed; check the starting pose and the all-zero step |

For further diagnosis, see [Apex Teleop logs](/software/apex-teleop/pro-current#logs).
