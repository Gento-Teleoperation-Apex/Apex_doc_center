---
title: Startup and Debugging
sidebar_position: 3
---

# Skye/Luna Startup and Debugging

This page covers the minimum sequence from power-on to first full-body teleoperation. For buttons, recording, playback, and logs, see [Classic Apex Teleop](/software/apex-teleop/classic).

## 1. Before startup

- Connect the robot, host PC, network device, and Pico according to [Hardware Wiring](./hardware-wiring).
- Release the emergency stop and clear the workspace.
- Put the host PC and Tianzhun 003 control unit on the same subnet.
- Charge and correctly wear the Pico headset, waist tracker, and leg trackers.

## 2. Connect to Tianzhun 003

The following uses the default IP `6.6.7.100`. Use the delivered site configuration if it was changed.

```bash
ping 6.6.7.100
ssh nvidia@6.6.7.100
```

Start the Apex backend service:

```bash
sudo systemctl start apex-backend.service
sudo systemctl status apex-backend.service --no-pager
```

## 3. Start classic Apex Teleop

1. Open Apex Teleop.
2. Enter the Tianzhun 003 IP and press **Enter**.
3. Start **Robot** and verify that the 3D model matches the physical robot.
4. Start **Teleop** and the network module. Camera is optional.
5. Use the robot start control to set the robot Ready.
6. Select **Impedance Mode**, then execute **Home**.
7. Verify both arms and the physical robot pose. For Skye, also verify BODY and LIFT; for Luna, verify BODY and the knee-style body structure.

## 4. Connect Pico

Skye/Luna uses Pico with waist and leg trackers for full-body teleoperation. Follow the [Pico headset guide](/xr-teleop/pico) for developer mode, network, and Apex client setup.

After connection, test small arm motions first. For Skye, verify torso and lift mapping; for Luna, verify torso and leg mapping. Increase the range only after all directions are correct.

## 5. Quick checks

| Symptom | Check |
|---|---|
| Cannot connect to Tianzhun 003 | IP, host subnet, and cable |
| 3D and physical poses differ | Robot module, model configuration, and startup log |
| Teleop unavailable | Robot running and Ready state |
| Pico cannot connect | Network module, headset IP, cable, and client settings |
| Arms move but BODY/LIFT or lower body does not | Model configuration, tracker charge, placement, and tracking state |
| Camera is black | Camera module and camera connection |
| No teleoperation motion | Impedance Mode, Home, and headset connection |
