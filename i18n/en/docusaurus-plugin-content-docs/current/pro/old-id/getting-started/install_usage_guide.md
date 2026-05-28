---
title: Installation Guide
---

# KernelMind Apex Installation Guide

This guide covers on-site deployment of KernelMind Apex: device connections, deb installation, network configuration, optional ISC DHCP setup, startup verification, and troubleshooting.

## 1. Checklist

### 1.1 Host & OS

- NVIDIA Jetson, Ubuntu 22.04, ROS 2 Humble.
- Robot body, controller cabinet, robot arms, gripper, cameras, VR headset or host PC.
- Published installation package, e.g.:

```bash
kernelmind-apex_1.0.31_arm64.deb
```

### 1.2 Network Planning

Confirm these addresses before deployment:

| Item | Example | Notes |
|---|---:|---|
| Jetson wired NIC | `eth0` | Connects to the robot control network |
| Jetson static IP | `192.168.10.123/24` | Fixed address on the robot side |
| DHCP address pool | `192.168.10.50–192.168.10.150` | Used when Jetson assigns IPs to other devices |
| QuickView / WebSocket signaling | `ws://192.168.10.123:8554` | Adjust to your actual network |
| VR / host PC IP | `192.168.10.x` | Same subnet as Jetson |

![Network topology placeholder](/img/network_topology_placeholder.png)

## 2. Connect Devices

1. Connect the robot body, controller cabinet, Jetson, cameras, and peripherals with power off.
2. Connect Jetson to the robot control network via a wired Ethernet port.
3. Connect GMSL/CSI camera cables and confirm each camera port matches `head_left`, `head_right`, `hand_left`, `hand_right` in the config.
4. Connect the VR headset or host PC to the same network.
5. Power on — start Jetson first, then the robot controller.

![Device wiring placeholder](/img/device_wiring_placeholder.png)

After powering on, verify devices on Jetson:

```bash
ip addr
ls /dev/video*
sudo dmesg --follow
```

If camera devices are missing, check cables, adapter board power, camera drivers, and the Jetson camera service.

## 3. Install Headset APK (via ADB)

These steps install or update the KernelMind Apex APK on a Meta Quest headset.

### 3.1 Install ADB Tools

Orin must be connected to Wi-Fi to download ADB:

```bash
sudo apt update
sudo apt install android-tools-adb -y
adb version
```

A displayed ADB version number confirms successful installation.

![Install ADB](/img/upgrade_p05.png)

### 3.2 Connect the Headset

1. Connect the headset to Orin with a Type-C cable.
2. Put on the headset and allow USB debugging from inside.
3. On Orin, run:

```bash
adb devices
```

`device` in the output means the connection succeeded.

![Connect headset and verify adb devices](/img/upgrade_p06.png)

### 3.3 Upload Packages

Upload the headset APK and Orin `.deb` package to `~/Downloads` on Orin, e.g.:

- `KernalMind_Apex_meta_260410.apk`
- `kernelmind-apex_1.0.5.7_arm64.deb`

![Upload APK and deb packages](/img/upgrade_p07.png)

### 3.4 Install / Update Headset APK

Uninstall the old version first, then install the new one:

```bash
adb devices
adb uninstall <old-package-name>
adb install KernalMind_Apex_meta_260410.apk
```

![Install Meta headset APK](/img/upgrade_p09.png)

## 4. Install the deb Package

Copy the deb package to Jetson (e.g. `~/Downloads`).

**When updating, uninstall the old version first:**

```bash
sudo apt remove kernelmind-apex
```

Then install the new version:

```bash
cd ~/Downloads
sudo apt install ./kernelmind-apex_<version>_arm64.deb
```

![Install KernelMind system on Orin](/img/upgrade_p11.png)

After installation, re-login or load the environment manually:

```bash
source /etc/profile.d/kernelmind_apex.sh
```

Verify ROS packages are visible:

```bash
ros2 pkg list | grep -E 'marvin|gmsl|node_manager'
```

Key paths after installation:

| Path | Purpose |
|---|---|
| `/opt/kernelmind/apex/install` | ROS 2 workspace install directory |
| `/opt/kernelmind/apex/bringup_RM.sh` | Standard startup script |
| `/opt/kernelmind/apex/bringup_RM_glove.sh` | Peripheral variant startup script |
| `/etc/profile.d/kernelmind_apex.sh` | ROS environment loader |
| `/etc/kernelmind/marvin_teleop/config` | teleop config symlink |
| `/etc/kernelmind/marvin_ros_control/config` | control config symlink |

## 5. Configure Network Parameters

### 5.1 Set Jetson Static IP

Using `eth0` and `192.168.10.123/24` as an example — replace with your actual network:

```bash
nmcli device status
sudo nmcli con add type ethernet ifname eth0 con-name apex-robot-net \
  ipv4.method manual ipv4.addresses 192.168.10.123/24
sudo nmcli con up apex-robot-net
```

If a connection profile already exists, modify it directly:

```bash
sudo nmcli con mod apex-robot-net ipv4.method manual ipv4.addresses 192.168.10.123/24
sudo nmcli con up apex-robot-net
```

Verify:

```bash
ip addr show eth0
ping 192.168.10.50
```

### 5.2 Configure ISC DHCP (when Jetson needs to assign IPs)

If VR, host PC, or other devices need to receive IPs from Jetson, install ISC DHCP Server:

```bash
sudo apt update
sudo apt install isc-dhcp-server
```

Edit `/etc/default/isc-dhcp-server` to specify the NIC:

```bash
sudo nano /etc/default/isc-dhcp-server
```

Example:

```conf
INTERFACESv4="eth0"
```

Edit `/etc/dhcp/dhcpd.conf`:

```bash
sudo nano /etc/dhcp/dhcpd.conf
```

Example configuration:

```conf
default-lease-time 600;
max-lease-time 7200;
authoritative;

subnet 192.168.10.0 netmask 255.255.255.0 {
  range 192.168.10.50 192.168.10.150;
  option routers 192.168.10.123;
  option subnet-mask 255.255.255.0;
  option domain-name-servers 8.8.8.8, 1.1.1.1;
}
```

Enable and start:

```bash
sudo systemctl enable isc-dhcp-server
sudo systemctl restart isc-dhcp-server
sudo systemctl status isc-dhcp-server --no-pager
```

Check leases:

```bash
sudo journalctl -u isc-dhcp-server -f
cat /var/lib/dhcp/dhcpd.leases
```

![DHCP configuration placeholder](/img/dhcp_config_placeholder.png)

### 5.3 Configure QuickView / Camera Parameters

QuickView camera config is installed at:

```bash
/opt/kernelmind/apex/install/gmsl_quadcam/share/gmsl_quadcam/config/quad_csi_quickview.yaml
```

Common fields to modify:

```yaml
quad_csi_quickview:
  ros__parameters:
    signal_url: "ws://192.168.10.123:8554"
    vr_room_id: "10"
    quad_room_id: "11"

    camera_config:
      camera_sources:
        head_left: "csi://0"
        head_right: "csi://1"
        hand_left: "csi://4"
        hand_right: "csi://5"
```

To disable a camera temporarily, set it to `"none"`:

```yaml
hand_left: "none"
```

Restart the launch file for changes to take effect.

## 6. Start the System

Standard M6 startup:

```bash
source /etc/profile.d/kernelmind_apex.sh
/opt/kernelmind/apex/bringup_RM.sh
```

Peripheral variant:

```bash
source /etc/profile.d/kernelmind_apex.sh
/opt/kernelmind/apex/bringup_RM_glove.sh
```

Without RViz:

```bash
/opt/kernelmind/apex/bringup_RM.sh use_rviz:=false
```

Specify a different launch file:

```bash
LAUNCH_PKG=node_manager LAUNCH_FILE=bringup_all_dm_m6_no_rviz.launch.py \
  /opt/kernelmind/apex/bringup_RM.sh
```

Test QuickView camera alone:

```bash
ros2 launch gmsl_quadcam quad_csi_quickview.launch.py
```

## 7. Post-Startup Checks

Check nodes:

```bash
ros2 node list
```

Check topics:

```bash
ros2 topic list
ros2 topic hz /quad_tile/compressed
```

Check control services:

```bash
ros2 service list
```

View logs:

```bash
journalctl -xe
ls ~/.ros/log
```

The QuickView page or client should display the VR view and quad view.

![QuickView output placeholder](/img/quickview_output_placeholder.png)

## 8. Troubleshooting

### 8.1 deb Installation Fails

```bash
sudo apt update
sudo apt install -f
sudo apt install ./kernelmind-apex_<version>_arm64.deb
```

Confirm the OS is Ubuntu 22.04 ARM64 with ROS 2 Humble base packages installed.

### 8.2 Network Unreachable

Check NIC and routes:

```bash
ip addr
ip route
ping <device-IP>
```

If ISC DHCP is enabled, verify `INTERFACESv4` is the correct NIC and that Jetson's static IP and the DHCP subnet are on the same network.

### 8.3 No Camera Image

```bash
ls /dev/video*
ros2 launch gmsl_quadcam quad_csi_quickview.launch.py
```

`No cameras available` in the log usually means a cable problem, driver issue, wrong sensor-id, or camera service not ready. Verify `camera_sources` in `quad_csi_quickview.yaml` matches your actual wiring.

### 8.4 VR or Host PC Cannot Connect to Signaling

Confirm `signal_url` uses Jetson's IP on the control network:

```yaml
signal_url: "ws://192.168.10.123:8554"
```

Test the port from the host PC:

```bash
ping 192.168.10.123
nc -vz 192.168.10.123 8554
```

### 8.5 Robot Does Not Respond to Control

1. Check e-stop, controller power, and driver status.
2. Check all ROS nodes are running.
3. Check VR/headset target pose is updating correctly.
4. If control was disabled by safety logic, resolve the connection issue first, then re-enable.

## 9. Uninstall

```bash
sudo apt remove kernelmind-apex
```

To fully clean up runtime logs and local configuration, back up your data first, then manually remove the relevant directories.
