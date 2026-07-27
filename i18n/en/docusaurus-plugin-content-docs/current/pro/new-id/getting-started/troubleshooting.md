---
title: Troubleshooting
sidebar_position: 4
---

# Troubleshooting

Stop robot motion and record the fault time before diagnosis.

| Symptom | Check first |
|---|---|
| Apex Teleop cannot connect | Controller IP, host subnet, cable, and controller availability |
| Robot fails to start | E-stop, robot power, arm-controller network, and Robot log |
| URDF and physical pose differ | Robot module, model configuration, and joint-state updates |
| Teleop or mode controls unavailable | Robot running and Start Robot completed |
| Home does not move | Ready state, control mode, and robot alarms |
| Homing directly from the packing pose may hit the column | Do not continue Homing; start Robot/Teleop and use RQt `/control/movej` to move all 14 arm joints to zero first |
| Wrist camera approaches the column during Home | Stop immediately and use the emergency stop if needed; verify the starting pose and all-zero procedure |
| Headset cannot connect | dnsmasq, headset cable, connection IP, and VR state |
| Some camera tiles are black | Whether `camera_sources` contains `none` and matches delivery |
| All camera tiles are black | Camera module, power-on initialization, wiring, and Camera log |
| Gripper does not respond | End-effector configuration, Tool module, and gripper restart |
| Teleoperation produces no motion | Impedance Mode, Home, Teleop input mode, and headset connection |

See [Apex Teleop logs](/software/apex-teleop/pro-current#logs). For support, provide the product model, software versions, fault time, Robot/Teleop logs, and wiring photos.

> Press the emergency stop immediately for abnormal motion, repeated alarms, or mechanical interference.
