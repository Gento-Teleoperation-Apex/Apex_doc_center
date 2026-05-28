---
title: Troubleshooting & Safety
sidebar_position: 5
---

# Troubleshooting & Safety

## Troubleshooting

### 1. VR Headset Issues

- Do not connect the VR headset via Wi-Fi — Wi-Fi is prone to drops and slow throughput, which can cause data interruptions.
- Keep the VR headset battery charged.
- Passthrough / recording is only available when the `BAG_STORAGE` USB drive is inserted.
- Switch to standby when not teleoperating to avoid accidental triggers.
- If the headset behaves abnormally, loses power, or shuts down, stop all teleoperation immediately.

![VR headset common issues](/img/pro_p38.png)

### 2. Errors on Startup

Check whether `robot_param_m6.yaml` has been modified. Parameters like `K` and `D` must remain in float format, e.g.:

- ✅ `6.0` (correct)
- ❌ `6` (may cause startup failure)

![Startup errors and teleoperation notes](/img/pro_p39.png)

### 3. Camera White Screen / WARN After MobaXterm SSH

Cause: MobaXterm enables `X11-Forwarding` by default, which alters the remote display environment and can cause camera capture timeouts or a white VR view.

Fix: uncheck `X11-Forwarding` and reconnect via SSH.

![Disable X11 Forwarding in MobaXterm](/img/pro_p40.png)

### 4. deb Installation Fails

```bash
sudo apt update
sudo apt install -f
sudo apt install ./kernelmind-apex_<version>_arm64.deb
```

Confirm the OS is Ubuntu 22.04 ARM64 with ROS 2 Humble base packages installed.

### 5. Network Unreachable

Check NIC and routes:

```bash
ip addr
ip route
ping <device-IP>
```

If ISC DHCP is enabled, confirm `INTERFACESv4` is the correct NIC and that Jetson's static IP and the DHCP subnet are on the same network.

### 6. No Camera Image

```bash
ls /dev/video*
ros2 launch gmsl_quadcam quad_csi_quickview.launch.py
```

`No cameras available` in the log usually indicates a cable problem, driver issue, wrong sensor-id, or camera service not ready. Verify `camera_sources` in `quad_csi_quickview.yaml` matches your actual wiring.

### 7. VR or Host PC Cannot Connect to Signaling

Confirm `signal_url` uses Jetson's IP on the control network:

```yaml
signal_url: "ws://192.168.10.123:8554"
```

Test the port from the host PC:

```bash
ping 192.168.10.123
nc -vz 192.168.10.123 8554
```

### 8. Robot Does Not Respond to Control

1. Check e-stop, controller power, and driver status.
2. Verify all ROS nodes are running (`ros2 node list`).
3. Check VR/headset target pose is updating correctly.
4. If control was disabled by safety logic, resolve the connection issue first, then re-enable.

---

## Safety Notes

1. Before teleoperating, verify that the e-stop button, controller power, Ethernet cables, USB drive, and headset battery are all in order.
2. Switch to standby when not teleoperating to prevent accidental side-button or foot-pedal triggers from causing robot motion.
3. In incremental mode, red/blue controller alignment is not required, but your hand position should still **roughly match** the current gripper position before enabling teleoperation.
4. When using the foot pedal, **never** press the right joystick Menu button while the enable pedal is held down.
5. **Back up config files** before modifying IP, payload, stiffness, damping, Home position, or TCP offset.
