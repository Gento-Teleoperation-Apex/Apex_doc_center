---
title: Hardware Setup
sidebar_position: 2
---

# Hardware Setup

This section covers power wiring, network connections, initial pose setup, and Orin + camera deserializer board installation for the Marvin Pro dual-arm robot system.

> Disconnect all power before wiring.

## 1. Dual-Arm Power & Communication Wiring

### 1.1 Wiring Steps

With main power disconnected:

1. Connect the dual-arm robot `48V+` / `48V−` to the DC output terminals of the 220 V → 48 V switching PSU.
2. Connect the discharge module `48V+` / `48V−` in parallel with the same 48 V bus.
3. Wire the emergency-stop button box into the robot's e-stop control circuit.
4. Connect the left arm and right arm `ethcart` ports to the corresponding ports on the robot controller.
5. Connect the 12 V power supply to the robot controller, then run an Ethernet cable from the controller to the LAN router.

![Dual-arm power and communication wiring](/img/pro_p05.png)

Physical connector reference:

![Robot wiring reference photo](/img/pro_p06.png)

### 1.2 Power-On Sequence

1. Power on the 220 V → 48 V switching PSU first.
2. Then power on the robot controller.
3. Confirm the robot controller IP is `192.168.10.190`.

![Dual-arm power-on and controller IP](/img/pro_p07.png)

## 2. Initial Level-Arm Pose

Use `fxstation` or `MarvinPlatform` software to move both arms to the initial level-arm pose before continuing.

1. Switch to **Position Mode**.
2. Enter **Joint Follow Mode**.
3. Write the following waypoints:
   - Left arm: first `[0, 0, 0, 0, 0, 0, 0]`, then `[90, -90, -90, -90, 0, 0, 0]`
   - Right arm: first `[0, 0, 0, 0, 0, 0, 0]`, then `[-90, -90, 90, -90, 0, 0, 0]`
4. Click Add Point and Run at the default speed of `20%`.

![Initial level-arm pose setup](/img/pro_p08.png)

## 3. Orin & Camera Deserializer Board Installation

### 3.1 Install the Deserializer Board

1. Remove the Orin base plate and release the internal mounting screws.
2. Install the support posts for the deserializer board.
3. Align the deserializer board with the support posts and tighten.

Camera port mapping:

| Deserializer port | Camera |
|---|---|
| 8 | Left-eye camera |
| 6 | Left-wrist camera |
| 7 | Right-wrist camera |
| 0 | Right-eye camera |

![Deserializer board ports and power-on procedure](/img/pro_p16.png)

### 3.2 Power-On Sequence

1. **Power on the deserializer board first** and wait ~10 seconds.
2. **Then power on Orin** and wait ~1 minute.
3. Confirm all four camera indicator LEDs are **solid on**.

> If any LED is not on, check that all camera cable connections are secure.
