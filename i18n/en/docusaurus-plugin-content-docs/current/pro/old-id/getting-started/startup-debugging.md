---
title: Startup and Debugging
sidebar_position: 3
---

# Historical Marvin Pro Startup and Debugging

This page applies to delivered Marvin Pro systems using NVIDIA Jetson Orin. For buttons, recording, playback, and logs, see [Classic Apex Teleop](/software/apex-teleop/classic).

## 1. Before startup

- Connect the robot, Orin, router, host PC, and headset according to [Hardware Wiring](./hardware-wiring).
- Release the emergency stop and clear the workspace.
- Put the host PC, Orin, and headset on the same LAN.

## 2. Start the Orin backend

The following uses the historical default IP `192.168.10.123`. Use the delivered site value if it differs.

```bash
ping 192.168.10.123
ssh marvin@192.168.10.123
cd /opt/kernelmind/apex
./bringup_RM.sh
```

> Disable `X11-Forwarding` in MobaXterm to avoid camera timeout or headset video issues.

## 3. Start classic Apex Teleop

1. Open the Apex Teleop version delivered with the system.
2. Enter the Orin IP and connect.
3. Start Robot and verify that the 3D model matches the physical robot.
4. Start Teleop and the required network module. Camera is optional.
5. Use the robot start control to set the robot Ready.
6. Select **Impedance Mode**, then execute **Home**.
7. Connect the headset and begin teleoperation.

## 4. Headset

Historical deliveries may use Meta Quest or Pico:

- [Meta Quest headset guide](/xr-teleop/meta)
- [Pico headset guide](/xr-teleop/pico)

## 5. Quick checks

| Symptom | Check |
|---|---|
| Cannot connect to Orin | IP, router, cables, and host subnet |
| Robot does not start | E-stop, power, Robot log, and arm-controller connection |
| Teleop unavailable | Robot running and Ready state |
| Headset not connected | Headset IP, network service, and cable |
| No camera image | Camera module, camera wiring, and historical deserializer connection |
| No teleoperation motion | Impedance Mode, Home, and headset connection |
