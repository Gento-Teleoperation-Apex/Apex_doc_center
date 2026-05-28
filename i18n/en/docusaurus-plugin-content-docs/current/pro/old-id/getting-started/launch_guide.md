---
title: Launch Teleoperation
sidebar_position: 3
---

# Launch Teleoperation

## 1. SSH into Orin and Start the Backend

```bash
ssh marvin@192.168.10.123
# password: 1234
cd /opt/kernelmind/apex
./bringup_RM.sh
```

> **Note**: When connecting via MobaXterm SSH, uncheck `X11-Forwarding` — leaving it enabled can cause camera capture timeouts or a white VR view.

![SSH login and start robot backend](/img/pro_p18.png)

## 2. Open the KernelMind Apex Teleoperation Software

On the host PC:

1. Enter the Orin IP: `192.168.10.123`.
2. Click `confirm`.
3. Click `startrobot` to start the robot.
4. Click `Impedance Mode` to enter joint impedance mode.
5. Speed mode — `Slow` or `Fast` — can only be set while in standby (reset) state.

![KernelMind Apex teleoperation software connection](/img/pro_p19.png)
