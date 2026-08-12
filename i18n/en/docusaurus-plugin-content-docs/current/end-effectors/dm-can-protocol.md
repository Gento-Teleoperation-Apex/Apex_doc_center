---
title: DM Gripper CAN Protocol
sidebar_position: 2
---

# DM Gripper CAN Frames and Reference Table

> Audience: customer developers and technical-support engineers using an OmniGripper with DM4310 motors.
> Baseline: `kernelmind-apex-tool 1.0.6.10h`, verified on a Tianzhun system on August 11, 2026.
> On a complete Apex system, use the standard ROS 2 interface whenever possible. See [ApexTool Usage and Integration](/end-effectors/apex-tool).

:::danger Raw frames can move the physical gripper

Before running `cansend`, stop every other gripper command source, clear the gripper workspace, and ensure that power can be disabled immediately. Setting zero or changing motor IDs, control mode, ranges, direction, or CAN parameters can cause unexpected motion or loss of communication. These are not routine customer operations.

:::

## 1. Scope

This page describes the DM4310 motor and MIT mode used by the current OmniGripper implementation:

- Communication from ApexTool to the physical gripper.
- SocketCAN channels and CAN IDs.
- Enable, disable, reset, and MIT control frames.
- Feedback frames, status codes, and ROS 2 feedback topics.
- Frame capture, single-side communication checks, and fault diagnosis.

Other DM motors may use the same frame layout but different position, velocity, and torque ranges. Do not reuse the conversions on this page for another motor model. Position-velocity, velocity-only, torque-position, and parameter-management modes are not part of the current ApexTool C++ production path.

## 2. Current Control Path

```text
/control/gripperValueL/R
        |
        v
ApexTool DM gripper node
        |
        | SocketCAN MIT frames
        v
vcan0 / vcan1
        |
        | Robot Node terminal bridge
        v
Arm terminal board
        |
        v
Left/right DM4310 gripper motors
```

Linux exposes `vcan0/vcan1` as virtual CAN interfaces. On a complete Apex system, Robot Node and the arm terminal board bridge them to physical grippers. Creating empty interfaces with the same names on a normal computer does not connect physical motors.

## 3. Default Channels and CAN IDs

| Device | SocketCAN | Slave ID | Master ID | MIT transmit CAN ID |
|---|---|---:|---:|---:|
| Left gripper | `vcan0` | `0x01` | `0x11` | `0x001` |
| Right gripper | `vcan1` | `0x02` | `0x12` | `0x002` |

Notes:

1. Control frames are sent to the motor's Slave ID.
2. Feedback may use the Slave ID or Master ID. Some firmware uses CAN ID `0x000` and places the motor ID in the lower four bits of the first data byte.
3. The current C++ driver accepts `0x01/0x11/0x00` on the left and `0x02/0x12/0x00` on the right.
4. Confirm IDs and channels from the target system; cable color alone is not authoritative.

## 4. Linux SocketCAN Frame Format

The current path uses standard 11-bit CAN IDs and 8-byte data frames. Linux `struct can_frame` is laid out as follows:

```text
can_id: 4 bytes
can_dlc: 1 byte
padding: 3 bytes
data: 8 bytes
```

Python packing format:

```python
frame = struct.pack("<IB3x8s", can_id, 8, payload)
```

Example left-gripper MIT frame:

```text
SocketCAN: 001#7FFF7FF0180627FF

Linux 16-byte memory representation:
01 00 00 00 08 00 00 00 7F FF 7F F0 18 06 27 FF
```

The Linux `can_id` field is little-endian. The MIT payload follows its protocol bit layout and must not be reversed as a complete byte array.

## 5. Startup, Enable, and Reset

### 5.1 ApexTool Startup Sequence

```text
1. Open non-blocking SocketCAN sockets on vcan0 and vcan1
2. Send enable to the left gripper
3. Wait 100 ms
4. Send enable to the right gripper
5. Wait 100 ms
6. Send left and right MIT frames continuously at control_rate_hz
7. Poll left and right feedback frames
8. Publish ROS feedback topics at feedback_rate_hz
```

### 5.2 Reset Service

`/control/reset_grippers` performs:

```text
Disable left -> disable right -> wait 100 ms
-> enable left -> wait 100 ms -> enable right
```

Call it with:

```bash
ros2 service call /control/reset_grippers std_srvs/srv/Trigger "{}"
```

### 5.3 Shutdown Behavior

The baseline version defaults to `disable_on_shutdown=false`. A normal node exit closes SocketCAN but does not guarantee that a disable frame is sent. When physical disable must be confirmed, follow the complete machine safety procedure. A stopped process alone does not prove that the motor is disabled.

## 6. Special Control Frames

Special commands use the target Slave ID as the CAN ID and a DLC of 8.

| Function | 8-byte payload | Description |
|---|---|---|
| Enable | `FF FF FF FF FF FF FF FC` | Enters the enabled state |
| Disable | `FF FF FF FF FF FF FF FD` | Leaves the enabled state |
| Set current position as zero | `FF FF FF FF FF FF FF FE` | Changes the position reference; use only in an approved calibration procedure |

| Function | Left `vcan0` | Right `vcan1` |
|---|---|---|
| Enable | `001#FFFFFFFFFFFFFFFC` | `002#FFFFFFFFFFFFFFFC` |
| Disable | `001#FFFFFFFFFFFFFFFD` | `002#FFFFFFFFFFFFFFFD` |
| Set zero | `001#FFFFFFFFFFFFFFFE` | `002#FFFFFFFFFFFFFFFE` |

:::warning Zero-position command

`FE` changes the position reference. Do not send it until the mechanical position, motor firmware, and recovery procedure have been confirmed.

:::

## 7. MIT Control Frame

### 7.1 Parameters and Ranges

| Parameter | Meaning | Baseline default | DM4310 encoding range | Bits |
|---|---|---:|---:|---:|
| `q` | Target position | Mapped from the upstream command | `-12.5 to 12.5 rad` | 16 |
| `dq` | Target velocity | `0 rad/s` | `-30 to 30 rad/s` | 12 |
| `Kp` | Position stiffness | `3.0` | `0 to 500` | 12 |
| `Kd` | Velocity damping | `0.12` | `0 to 5` | 12 |
| `tau` | Feed-forward torque | `0 Nm` | `-10 to 10 Nm` | 12 |

These values explain frames produced by the baseline release; they are not customer-adjustable safety limits. Kp/Kd, feed-forward torque, and physical ranges require grip-force, temperature, vibration, and stability validation.

### 7.2 Physical and Integer Conversion

Encoding:

```text
raw = int((value - minimum) / (maximum - minimum) * (2^bits - 1))
```

Decoding:

```text
value = raw / (2^bits - 1) * (maximum - minimum) + minimum
```

Integer encoding introduces quantization. For example, decoded zero velocity and torque may be approximately `-0.007 rad/s` and `-0.0024 Nm`. This does not necessarily indicate continuous motion or negative torque.

### 7.3 MIT 8-Byte Layout

```text
| q 16 bit | dq 12 bit | Kp 12 bit | Kd 12 bit | tau 12 bit |
```

Byte encoding:

```text
Byte0 = q_raw[15:8]
Byte1 = q_raw[7:0]
Byte2 = dq_raw[11:4]
Byte3 = dq_raw[3:0] << 4 | Kp_raw[11:8]
Byte4 = Kp_raw[7:0]
Byte5 = Kd_raw[11:4]
Byte6 = Kd_raw[3:0] << 4 | tau_raw[11:8]
Byte7 = tau_raw[7:0]
```

Reverse parsing:

```text
q_raw   = Byte0 << 8 | Byte1
dq_raw  = Byte2 << 4 | Byte3 >> 4
Kp_raw  = (Byte3 & 0x0F) << 8 | Byte4
Kd_raw  = Byte5 << 4 | Byte6 >> 4
tau_raw = (Byte6 & 0x0F) << 8 | Byte7
```

## 8. Common Baseline MIT Frames

The table uses:

```text
dq=0, Kp=3.0, Kd=0.12, tau=0
Position mapping range=0 to 1.6 rad
```

| Upstream `gripperValue` | Target `q` | MIT payload |
|---:|---:|---|
| `0.00` | `0.00 rad` | `7F FF 7F F0 18 06 27 FF` |
| `0.25` | `0.40 rad` | `84 18 7F F0 18 06 27 FF` |
| `0.50` | `0.80 rad` | `88 30 7F F0 18 06 27 FF` |
| `0.75` | `1.20 rad` | `8C 49 7F F0 18 06 27 FF` |
| `0.90` | `1.44 rad` | `8E BE 7F F0 18 06 27 FF` |
| `1.00` | `1.60 rad` | `90 61 7F F0 18 06 27 FF` |

For `gripperValue=0.5`:

```text
Left:  vcan0  001#88307FF0180627FF
Right: vcan1  002#88307FF0180627FF
```

Actual opening direction depends on mechanical installation and position-range configuration. Contact, limits, stiffness, and load can produce a difference between target and feedback position.

### Verified Frame Values

The following DM4310 frames were verified with `dq=0` and `tau=0`:

| `q` | `Kp` | `Kd` | Payload |
|---:|---:|---:|---|
| `0.0` | `1.0` | `0.10` | `7F FF 7F F0 08 05 17 FF` |
| `0.0` | `3.0` | `0.12` | `7F FF 7F F0 18 06 27 FF` |
| `0.5` | `1.0` | `0.10` | `85 1E 7F F0 08 05 17 FF` |
| `0.5` | `3.0` | `0.12` | `85 1E 7F F0 18 06 27 FF` |
| `1.0` | `1.0` | `0.10` | `8A 3C 7F F0 08 05 17 FF` |
| `1.0` | `3.0` | `0.12` | `8A 3C 7F F0 18 06 27 FF` |
| `1.5` | `1.0` | `0.10` | `8F 5B 7F F0 08 05 17 FF` |
| `1.5` | `3.0` | `0.12` | `8F 5B 7F F0 18 06 27 FF` |

## 9. Feedback Parsing

### 9.1 Payload Layout

```text
Byte0[7:4] = motor status/fault code
Byte0[3:0] = embedded motor ID
Byte1~2    = position q, 16 bit
Byte3      = velocity dq[11:4]
Byte4[7:4] = velocity dq[3:0]
Byte4[3:0] = torque tau[11:8]
Byte5      = torque tau[7:0]
Byte6      = MOS temperature, integer degrees Celsius
Byte7      = motor winding/rotor temperature, integer degrees Celsius
```

Parsing and conversion:

```text
status = (Byte0 >> 4) & 0x0F
embedded_id = Byte0 & 0x0F
q_raw = Byte1 << 8 | Byte2
dq_raw = Byte3 << 4 | Byte4 >> 4
tau_raw = (Byte4 & 0x0F) << 8 | Byte5

q   = uint_to_float(q_raw,   -12.5, 12.5, 16)
dq  = uint_to_float(dq_raw,  -30.0, 30.0, 12)
tau = uint_to_float(tau_raw, -10.0, 10.0, 12)
```

### 9.2 ROS 2 Feedback Topics

| Topic | Data |
|---|---|
| `/info/gripper_feedback_L` | `[position, velocity, torque, mos_temperature, motor_temperature]` |
| `/info/gripper_feedback_R` | `[position, velocity, torque, mos_temperature, motor_temperature]` |
| `/info/gripper_feedback_L_err` | `[status/error_code]` |
| `/info/gripper_feedback_R_err` | `[status/error_code]` |

### 9.3 Status and Fault Codes

| Upper four bits | Meaning | Interpretation |
|---:|---|---|
| `0x0` | Off | Not enabled/disabled |
| `0x1` | On | Enabled, no fault |
| `0x8` | Overvoltage | Fault |
| `0x9` | Undervoltage | Fault |
| `0xA` | Overcurrent | Fault |
| `0xB` | MOS overtemperature | Fault |
| `0xC` | Motor winding overtemperature | Fault |
| `0xD` | Communication loss | Fault |
| `0xE` | Overload | Fault |

`error_code=1` means On, not a fault. Preserve the raw frame and check the matching firmware protocol when an undefined value appears.

## 10. Unsupported Extended Operations

The original Python driver also contains position-velocity, velocity-only, torque-position, and RID parameter operations. The current ApexTool C++ production path uses MIT mode only, and the dual-vCAN routing does not guarantee support for other modes or `0x7FF` parameter-management frames.

Customers must not perform the following on production systems:

- Switch `CTRL_MODE` or use legacy firmware offset IDs.
- Write or save `ESC_ID`, `MST_ID`, CAN bitrate, direction, or encoding ranges.
- Write parameters to flash without a complete backup.
- Apply the range or frame table of another DM model to a DM4310.

Development of an extended mode requires the matching motor-firmware protocol, a complete parameter backup, an isolated test bench, and technical-support confirmation of channel routing and recovery procedures.

## 11. Capture and Single-Side Communication Check

### 11.1 Inspect Interfaces

```bash
ip -details -statistics link show vcan0
ip -details -statistics link show vcan1
```

### 11.2 Capture Raw Frames

```bash
candump -L vcan0
candump -L vcan1
candump -L vcan0,vcan1
```

### 11.3 Send Raw Frames

The production node sends MIT frames continuously. Stop ApexTool first to prevent multiple command sources:

```bash
sudo systemctl stop apex-tool.service
```

Only after completing the safety checks, perform a single-side, small-range check in the order enable, one communication frame, disable:

```bash
cansend vcan0 001#FFFFFFFFFFFFFFFC
cansend vcan0 001#88307FF0180627FF
cansend vcan0 001#FFFFFFFFFFFFFFFD
```

Restore the service after the test:

```bash
sudo systemctl start apex-tool.service
```

A single frame is suitable only for checking communication. Normal stiffness control requires stable periodic transmission with feedback, timeout, and fault handling.

## 12. Common Symptoms

| Symptom | Check first |
|---|---|
| `OSError: [Errno 19] No such device` | Whether `vcan0/vcan1` exist and interface names are correct |
| vCAN transmits but the gripper does not move | Robot Node bridge, terminal board, power, wiring, and CAN ID |
| Motion works but stiffness is abnormal | Enable state, Kp/Kd, continuous command transmission, and feedback state `1` |
| Left and right interfere | Incorrect shared interface/ID, multiple transmitters, or bridge congestion |
| `error=1` | Normal enabled state, not a fault |
| Feedback remains stale | Return CAN ID, terminal-board bridge, and receive loop |
| Temperature keeps rising | Stalled gripping, load, stiffness, and mechanical limits |
| Target and feedback differ | Contact load, stiffness, mechanical limits, and range mapping |

## 13. Safety Requirements

1. Before enable or MIT transmission, keep people, tools, and fragile objects outside the gripper range.
2. Start with one side, low stiffness, and a small position change before testing both sides.
3. ApexTool, customer software, and manual `cansend` must not transmit simultaneously.
4. MIT command and feedback frames use different 8-byte definitions; do not parse one as the other.
5. `error=1` means enabled; interpret faults using the status table.
6. Do not send zero-position command `FE` at an unknown mechanical position.
7. Do not change IDs, control mode, bitrate, direction, or ranges without a parameter backup.
8. vCAN has no physical bitrate; its configuration cannot identify the terminal-bus bitrate.
9. If feedback stops, do not increase target position or stiffness. Restore communication first.

## 14. Baseline Summary

```text
Left: vcan0 / ID 1
Right: vcan1 / ID 2
FC enable is sent during startup
MIT 8-byte frames are sent continuously
Baseline Kp=3.0, Kd=0.12, dq=0, tau=0
Feedback includes position, velocity, torque, MOS temperature,
motor temperature, and status
reset_grippers performs an FD -> FC reset sequence
```

These behaviors and tables apply to the version baseline stated at the top of this page. After upgrading ApexTool or motor firmware, or changing motor models, verify channels, IDs, ranges, frame layout, and safety parameters again.
