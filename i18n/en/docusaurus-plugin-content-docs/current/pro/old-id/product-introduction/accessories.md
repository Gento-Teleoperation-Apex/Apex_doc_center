---
title: Accessories
sidebar_position: 4
---

# Accessories

## Standard Accessories

| Item | Qty | Description |
|---|---|---|
| VR headset (Meta Quest) | 1 | Provides immersive first-person view |
| Controllers (left/right) | 1 each | Control arm motion and gripper open/close |
| Router | 1 | LAN hub connecting Orin, robot controller, and headset |
| Ethernet cables | Several | Wired connections for low-latency stable transmission |
| USB drive (labeled `BAG_STORAGE`) | 1 | Stores ROS bag and MP4 recording data |
| Type-C data cable | 1 | ADB debugging — connects headset to Orin |

## Optional Accessories

| Item | Description |
|---|---|
| Manus data glove | Captures fine finger movements, used with Wuji Hand |
| Wuji Hand | Dexterous robot end-effector that receives glove commands |
| Foot pedal (3-button) | Maps arm enable to foot, for use with motion-capture gloves / dexterous hands |

### Foot Pedal Notes

When using motion-capture gloves or dexterous hands, the controller cannot simultaneously control the gripper and enable the arm. The foot pedal replaces the controller side-button:

- **Press**: enable both arms to follow
- **Release**: stop following

Foot pedal button assignments:

| Button | Function |
|---|---|
| Button 1 (left) | Enable both left and right arms simultaneously |
| Button 3 (right) | Return both arms to Home position |

![Foot pedal extension workflow](/img/pro_p55.png)
