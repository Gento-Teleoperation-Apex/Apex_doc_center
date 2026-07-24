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

## 2. Connect to the Tianzhun controller

The following uses the default IP `6.6.7.100`. Use the delivered site configuration if it was changed.

```bash
ping 6.6.7.100
ssh nvidia@6.6.7.100
```

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

## 3. Start Apex Teleop

1. Open Apex Teleop.
2. Enter the Tianzhun controller IP in the upper-right field and press **Enter**.
3. Start **Robot**.
4. Confirm that the URDF pose matches the physical robot.
5. Start **Teleop** and **dnsmasq**.
6. Start **Camera** when video is required. Start **Tool** only when an end effector is configured.
7. Click **Start Robot** in the lower-left card.
8. Select **Impedance Mode**.
9. Click **Home** and wait for the teleoperation initial pose.
10. Set **Input Mode** to **Teleop**.

![Current Marvin Pro Apex Teleop](/img/software/apex-teleop/pro-main.png)

## 4. Connect the headset

Marvin Pro supports Pico and Meta Quest:

- [Pico headset guide](/xr-teleop/pico)
- [Meta Quest headset guide](/xr-teleop/meta)

Connect the headset cable, open the Apex headset client, and connect to the controller. Confirm the VR state in Apex Teleop, then begin with small motions in a clear workspace.

## 5. Quick checks

| Symptom | Check |
|---|---|
| Cannot connect from the IP field | IP, subnet, cable, and controller network |
| Robot does not start | E-stop, robot power, controller link, and Robot log |
| URDF does not follow the robot | Robot module and robot model configuration |
| Teleop unavailable | Robot running and Ready state |
| Headset cannot connect | dnsmasq, headset cable, connection IP, and VR state |
| Camera is black | Camera module, camera initialization, and `camera_sources` |
| No teleoperation motion | Impedance Mode, Home completion, and Teleop input mode |

For further diagnosis, see [Apex Teleop logs](/software/apex-teleop/pro-current#logs).
