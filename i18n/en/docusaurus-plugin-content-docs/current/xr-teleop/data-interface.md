---
title: Apex XR Data Interface
sidebar_label: Apex XR Data Interface
---
<div className="bingru-theme" />
The Apex XR Data Interface transmits teleoperation data between devices. PICO and Meta Quest use the same packet format. Meta Quest supports only Dual-arm mode and Effortless Full-body Tracking, so it does not provide PICO Body Tracking data.

| Teleoperation mode | Available data |
| --- | --- |
| Dual-arm mode | Poses of the headset and both controllers or hands. |
| PICO Body Tracking | Body joint data while tracking is valid. |
| Effortless Full-body Tracking | Body joint data from inverse kinematics after calibration in the headset. Lower-body poses are estimated by the solver. |

All three modes send fixed 897-byte packets. The sender fills missing body joint records with zeros.

Download Apex XR Live Preview

<details>
<summary>Windows</summary>

[Download 64-bit](pathname:///files/apex-xr-viewer/apex-xr-viewer-windows-x64.exe) or [download 32-bit](pathname:///files/apex-xr-viewer/apex-xr-viewer-windows-x86.exe). Double-click the downloaded file to start.

[Download the Python version](pathname:///files/apex-xr-viewer/apex-xr-viewer.pyz). Requires Python 3.10 or later. From the download folder, run `py -3 apex-xr-viewer.pyz`.

</details>

<details>
<summary>macOS</summary>

[Download the Python version](pathname:///files/apex-xr-viewer/apex-xr-viewer.pyz). Requires Python 3.10 or later. From the download folder, run `python3 apex-xr-viewer.pyz`.

</details>

<details>
<summary>Linux</summary>

[Download the Python version](pathname:///files/apex-xr-viewer/apex-xr-viewer.pyz). Requires Python 3.10 or later. From the download folder, run `python3 apex-xr-viewer.pyz`.

</details>

Apex XR Live Preview opens a browser when it starts. Select your computer's network adapter and a headset on the same LAN. Keep the app open on the headset, then click the link icon to view live data.

<div style={{display: 'flex', justifyContent: 'space-between', gap: '10px'}}>
    <figure style={{margin: 0, width: '49%'}}>
        <img src={require("../../../../../docs/xr-teleop/Screenshots/rtudp-preview1.jpg").default} alt="Data viewer showing 3D joints and controller buttons" style={{width: '100%'}} />
        <figcaption style={{textAlign: 'center', fontSize: '0.9em'}}>3D joint view and controller inputs</figcaption>
    </figure>
    <figure style={{margin: 0, width: '49%'}}>
        <img src={require("../../../../../docs/xr-teleop/Screenshots/rtudp-preview2.jpg").default} alt="Data monitor showing right thumbstick input over time" style={{width: '100%'}} />
        <figcaption style={{textAlign: 'center', fontSize: '0.9em'}}>Right thumbstick input plot</figcaption>
    </figure>
</div>

## LAN device discovery

Use LAN discovery to find online headsets. On the same LAN, the host listens on the UDP multicast address `224.0.0.225:7447` and sends a `scout` to that address. The headset multicasts a `hello` to the same address at startup and in response to a `scout`.

Apex XR follows Zenoh's discovery flow using the custom UTF-8 JSON messages below. For the standard protocol, see [Scouting in the official Zenoh specification](https://spec.zenoh.io/spec/1.0.0/scouting/index.html).

1. The host sends a `scout`. Generate a new `zid` each time the host starts. A `whatami` value of `1` identifies a peer.

   ```json
   {"msg_type":"scout","zid":"11111111-1111-4111-8111-111111111111","whatami":1}
   ```

2. The headset replies with a `hello`.

   ```json
   {
     "msg_type": "hello",
     "zid": "22222222-2222-4222-8222-222222222222",
     "whatami": 1,
     "locators": ["tcp/192.168.1.42:9010", "udp/192.168.1.42:9000", "udp/192.168.1.42:9001"],
     "metadata": {"name": "ApexHeadset", "model": "PICO A210", "app_version": "1.0.0"}
   }
   ```

## Network ports and commands

| Parameter | Value | Description |
| --- | --- | --- |
| Transport | UDP | Multi-byte values use little-endian encoding. |
| Send rate | About 90 Hz | Current setting. |
| Headset signaling port | 9871 | Default port. |
| Data receiver port | 9870 | Default port. |

Bind a UDP port and send the following ASCII commands to the headset's signaling port from that same socket.

| Command | Headset behavior |
| --- | --- |
| `APLYLINK` | Starts sending data to the command's source IP and port. |
| `RELEASELINK` | Stops sending data. |

## Packet format

Byte offsets are zero-based and ranges are inclusive.

| Byte offset | Size (bytes) | Type | Field | Description |
| --- | --- | --- | --- | --- |
| 0–4 | 5 | `char[5]` | Magic | Fixed value `PICO9`. |
| 5–8 | 4 | `uint32` | Sequence ID | Increments from 0 when the stream starts. |
| 9–16 | 8 | `uint64` | Timestamp | Unix timestamp in milliseconds at packet assembly. |
| 17–852 | 836 | 11 joint records | Joints | Pose, velocity, and acceleration for 11 keypoints. |
| 853–862 | 10 | `uint8[10]` | Buttons | 0 means released, 1 means pressed. |
| 863–894 | 32 | `float32[8]` | Analogs | Thumbstick, trigger, and grip values. |
| 895–896 | 2 | `uint16` | Checksum | CRC16-Modbus over bytes 0–894. |

Compared with the legacy 745-byte packet, the new format keeps the `PICO9` header and the offsets of the first nine joints, then adds the left and right elbows after the torso. The button, analog, and checksum sections each start 152 bytes later. Receivers that only accept the legacy length must be updated; the viewer linked above supports both packet lengths.

## Joint data

### Keypoint order

Each keypoint occupies 76 bytes. The OpenPose column identifies the corresponding body parts.

| Index | Byte offset | Body part | OpenPose (CMU BODY_25) |
| --- | --- | --- | --- |
| 0 | 17–92 | Head | Nose (0) |
| 1 | 93–168 | Left hand | L_Wrist (7) |
| 2 | 169–244 | Right hand | R_Wrist (4) |
| 3 | 245–320 | Pelvis | Mid-Hip (8) |
| 4 | 321–396 | Left knee | L_Knee (13) |
| 5 | 397–472 | Right knee | R_Knee (10) |
| 6 | 473–548 | Left foot | L_Ankle (14) |
| 7 | 549–624 | Right foot | R_Ankle (11) |
| 8 | 625–700 | Torso | Neck (1), Mid-Hip (8) |
| 9 | 701–776 | Left elbow | L_Elbow (6) |
| 10 | 777–852 | Right elbow | R_Elbow (3) |

<figure>
    <img src={require("./Screenshots/OpenPoseBody25.png").default} alt="OpenPose BODY_25 keypoint diagram" />
    <figcaption>OpenPose BODY_25 keypoint diagram</figcaption>
</figure>

### Joint record

Each record contains 19 `float32` values. Offsets are relative to the start of the record. All joints are expressed in world coordinates. By default, X points forward, Y points left, and Z points up.

| Relative offset | Size (bytes) | Components | Meaning | Unit |
| --- | --- | --- | --- | --- |
| 0–11 | 12 | `px, py, pz` | 3D position | m |
| 12–27 | 16 | `qx, qy, qz, qw` | Rotation quaternion | Unitless |
| 28–39 | 12 | `vx, vy, vz` | Linear velocity | m/s |
| 40–51 | 12 | `avx, avy, avz` | Angular velocity | rad/s |
| 52–63 | 12 | `ax, ay, az` | Linear acceleration | m/s² |
| 64–75 | 12 | `aax, aay, aaz` | Angular acceleration | rad/s² |

## Controller data

| Byte offset | Input | Data type | Range | Diagram number |
| --- | --- | --- | --- | --- |
| 853 | Left X button | `uint8` | 0, 1 | 9 |
| 854 | Left Y button | `uint8` | 0, 1 | 10 |
| 855 | Right A button | `uint8` | 0, 1 | 8 |
| 856 | Right B button | `uint8` | 0, 1 | 12 |
| 857 | Left thumbstick click (Scale Toggle) | `uint8` | 0, 1 | 5 |
| 858 | Right thumbstick click (Scale Toggle) | `uint8` | 0, 1 | 6 |
| 859–862 | Reserved, set to zero | `uint8` | 0 | — |
| 863–866 | Left thumbstick X axis | `float32` | -1.0 to 1.0 | 5 |
| 867–870 | Left thumbstick Y axis | `float32` | -1.0 to 1.0 | 5 |
| 871–874 | Right thumbstick X axis | `float32` | -1.0 to 1.0 | 6 |
| 875–878 | Right thumbstick Y axis | `float32` | -1.0 to 1.0 | 6 |
| 879–882 | Left trigger | `float32` | 0.0 to 1.0 | 11 |
| 883–886 | Right trigger | `float32` | 0.0 to 1.0 | 13 |
| 887–890 | Left grip | `float32` | 0.0 to 1.0 | 3 |
| 891–894 | Right grip | `float32` | 0.0 to 1.0 | 15 |

<figure>
    <img src={require("./Screenshots/picoultracontroller.png").default} alt="PICO controller button layout" />
    <figcaption>Controller diagram</figcaption>
</figure>
