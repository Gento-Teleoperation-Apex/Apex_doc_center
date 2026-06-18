---
title: Environment Setup
sidebar_position: 1
---

# Skye Environment Setup

## 1. DHCP Service Configuration

The Skye VR headset connects to the Orin via a wired connection. Orin must run a DHCP service to assign it an IP in the `6.6.7.x` subnet.

### 1.1 Resolve dnsmasq Conflict

If ISC DHCP conflicts with `dnsmasq` after installation, stop dnsmasq first:

```bash
sudo systemctl stop dnsmasq
sudo systemctl disable dnsmasq
```

![Stop conflicting dnsmasq service](/img/skye/dnsmasq_stop.png)

### 1.2 Check Network Interface

```bash
ifconfig
```

Note the current `eth0` address.

![Check eth0 NIC address](/img/skye/eth0_ifconfig.png)

### 1.3 Set the Listening Interface

On the robot system, find `/etc/default/isc-dhcp-server`, open a terminal in that directory, then run:

```bash
cd /etc/default
sudo chmod 666 isc-dhcp-server
```

If a password is required, use `nvidia`.

Change `INTERFACESv4=""` to:

```text
INTERFACESv4="eth0"
```

![Configure DHCP listening interface](/img/skye/dhcp_interface.png)

### 1.4 Edit dhcpd.conf

On the robot system, find `/etc/dhcp/dhcpd.conf`, open a terminal in that directory, then run:

```bash
cd /etc/dhcp
sudo chmod 666 dhcpd.conf
```

If a password is required, use `nvidia`.

Update the configuration using the Skye-provided DHCP file:

1. Open the downloaded `dhcp_service.md` file and copy lines 178-191.
2. Open `/etc/dhcp/dhcpd.conf` and comment out lines 10-14 in the original file.
3. Paste the copied content near line 15.
4. Change all `192.168.10` subnet references to `6.6.7`.

![Configure dhcpd.conf](/img/skye/dhcp_conf.png)

## 2. Visualization & RViz Environment

Enter `/opt/kernelmind/apex` and open a terminal:

```bash
cd /opt/kernelmind/apex
source install/setup.bash
ros2 run marvin_teleop.bash
ros2 run marvin_teleop mink_ik_node.py
```

If Mink is missing:

```bash
pip install mink
```

![Skye visualization and RViz environment](/img/skye/visualization_rviz_env.png)
