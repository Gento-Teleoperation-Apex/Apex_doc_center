---
title: Hardware Wiring
sidebar_position: 1
---

# Hardware Wiring

When Skye/Luna is shipped, the Tianzhun 003 control unit is already integrated inside the robot. On the user side, network, peripheral, and headset connections are mainly completed through the exposed rear interfaces. The overall wiring principle is the same as Marvin Pro: the robot, host PC, headset, and router / switch must be on the same LAN.

## 1. Devices and Accessories

Before wiring, confirm that the Skye/Luna device, headset, controllers / sensors, Ethernet cables, Type-C Ethernet adapter, power adapter, and other accessories are complete.

![Skye/Luna standard devices and accessories](/img/gento/skye-luna/device-overview.jpg)

## 2. Rear Interface Reference

The rear interface positions and appearance of Skye and Luna are slightly different. During on-site wiring, use the physical interface of the corresponding model as the reference.

### 2.1 Skye Rear Interfaces

![Skye rear interfaces](/img/gento/skye-luna/skye-rear-ports.jpg)

### 2.2 Luna Rear Interfaces

![Luna rear interfaces](/img/gento/skye-luna/luna-rear-ports.jpg)

## 3. Network Wiring

Connect the network as follows:

:::warning Headset Ethernet Port
For wired headset networking, connect a **Tianzhun controller to Ethernet port 1** and a **Lingjing Thor controller to Ethernet port 2**. Both controllers use `6.6.7.100` as the default connection address. Do not interchange the two ports. If the site network was changed, follow the delivered configuration.
:::

1. Connect the robot rear Ethernet port to the router / switch.
2. Connect the host PC to the same router / switch.
3. Connect the headset to the same router / switch through the Type-C Ethernet adapter.
4. Confirm that the robot, host PC, and headset are on the same subnet.

![Skye/Luna network wiring reference](/img/gento/skye-luna/wiring-reference.jpg)

## 4. Wiring Check

Before powering on and starting the system, check each item:

| Check item | Requirement |
|---|---|
| Robot rear Ethernet port | Ethernet cable is firmly inserted and connected to the router / switch |
| Host PC network | On the same LAN as the robot |
| Headset network | Wired access through the Type-C Ethernet adapter |
| Power and emergency stop | Power connection is normal and the emergency stop button is released |
| Cable status | Ethernet cables, adapters, and power cables are not loose |

## 5. Notes

- Headset Wi-Fi is not recommended for teleoperation. Use the wired network connection first.
- Connect the headset cable to port 1 for a Tianzhun controller and port 2 for a Lingjing Thor controller.
- After wiring is complete, proceed to environment configuration and startup debugging.
- If the host PC cannot connect to the robot, first check the Ethernet cable, router / switch, power, and IP subnet.
