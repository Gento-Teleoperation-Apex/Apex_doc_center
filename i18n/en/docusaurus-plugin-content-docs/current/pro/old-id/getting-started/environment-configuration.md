---
title: Environment Configuration
sidebar_position: 2
---

# Environment Configuration

## Network

Historical Orin systems usually use the following subnet. Use the delivered device record when values differ.

| Device | Historical default example |
|---|---|
| Orin | `192.168.10.123` |
| Dual-arm controller | `192.168.10.190` |
| Router | `192.168.10.1` |
| Host PC and headset | Non-conflicting `192.168.10.x` addresses |

```bash
ping 192.168.10.123
```

When an independent router is the LAN gateway, the DHCP gateway must point to the router. Use the Orin address only when Orin is explicitly configured to provide the network service without an independent router.

When changing the DHCP subnet, first assign the Orin Ethernet interface a static address in the new subnet. Otherwise, the DHCP service may fail to listen. A network administrator or technical support should coordinate subnet changes.

## Software and headset

- Use the Orin software, classic Apex Teleop, and headset client delivered for the device.
- Historical systems may use Meta Quest or Pico.
- Do not apply current Tianzhun addresses or packages to an Orin system.
