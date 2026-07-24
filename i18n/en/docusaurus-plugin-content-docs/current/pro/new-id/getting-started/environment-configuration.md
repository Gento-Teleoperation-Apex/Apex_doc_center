---
title: Environment Configuration
sidebar_position: 2
---

# Environment Configuration

## Network

| Device | Default example | Requirement |
|---|---|---|
| Tianzhun controller | `6.6.7.100` | Use the delivered site address |
| Dual-arm controller | `6.6.7.190` | Must match the controller configuration |
| Host PC | `6.6.7.xxx` | Same subnet with no address conflict |
| Pico / Meta Quest | Independent address on the same subnet | The Apex client connects to the Tianzhun IP |

```bash
ping 6.6.7.100
```

No two devices may share an IP address. Before changing the site subnet, update and verify the robot controller, Tianzhun controller, host PC, and headset together.

## Software compatibility

- Use the robot controller / MarvinSDK, Teleop service, Apex frontend, and headset client from the same delivery release.
- The current documentation baseline uses robot controller / MarvinSDK `100343001`, Teleop service `1.0.18`, and Marvin Pro frontend `1.0.7.6o`.
- Package filenames change by release; use the delivered files and release notes.
- Enable Tool and Camera according to the installed options.

## Cameras

The UI always displays four tiles. A disabled `camera_sources` entry appears black. For example, `0, 1, none, none` enables only the first two views and is a valid configuration.

Back up the configuration and contact support before changing camera IDs, wiring, or calibration. Do not edit camera configuration while the robot is operating.

## Headset

Marvin Pro supports [Pico](/xr-teleop/pico) and [Meta Quest](/xr-teleop/meta). The headset must be on the same LAN as the Tianzhun controller. Enter the Tianzhun address, not the headset's own address, in the headset client.
