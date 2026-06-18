---
title: Troubleshooting
sidebar_position: 3
---

# Skye Troubleshooting

### 1. Virtual Controller Position Inaccurate

1. Check that the VR cable harness is properly connected.
2. Long-press the right controller circle button to reset.

![Skye virtual controller position inaccurate](/img/skye/controller_reset.png)

### 2. RViz Shows No Image

In RViz, click `Fixed Frame` and select `base link`.

![RViz Fixed Frame setting](/img/skye/rviz_fixed_frame.png)

### 3. DHCP Service Fails to Start

Confirm the following:
- `dnsmasq` has been stopped (`sudo systemctl stop dnsmasq`)
- `INTERFACESv4` in `isc-dhcp-server` is set to the correct NIC (usually `eth0`)
- The subnet in `dhcpd.conf` has been changed to `6.6.7.x`

### 4. VR Headset Cannot Get an IP

Check ISC DHCP service status on Orin:

```bash
sudo systemctl status isc-dhcp-server
sudo journalctl -u isc-dhcp-server -f
```

Confirm the VR headset is connected to Orin via a wired connection, not Wi-Fi.
