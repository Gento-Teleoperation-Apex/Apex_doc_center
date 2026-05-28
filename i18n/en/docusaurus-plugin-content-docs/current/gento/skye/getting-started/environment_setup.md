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

![Stop conflicting dnsmasq service](/img/skye_p08.png)

### 1.2 Check Network Interface

```bash
ifconfig
```

Note the current `eth0` address.

![Check eth0 NIC address](/img/skye_p09.png)

### 1.3 Set the Listening Interface

```bash
cd /etc/default
sudo chmod 666 isc-dhcp-server
```

Change `INTERFACESv4=""` to:

```text
INTERFACESv4="eth0"
```

![Configure DHCP listening interface](/img/skye_p10.png)

### 1.4 Edit dhcpd.conf

```bash
cd /etc/dhcp
sudo chmod 666 dhcpd.conf
```

Using the Skye-provided DHCP config file, change the subnet references from `192.168.10` to `6.6.7`.

![Configure dhcpd.conf](/img/skye_p11.png)

## 2. Visualization & RViz Environment

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

![Skye visualization and RViz environment](/img/skye_p12.png)
