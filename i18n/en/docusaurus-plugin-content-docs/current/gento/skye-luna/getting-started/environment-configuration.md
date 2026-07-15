---
title: Environment Configuration
sidebar_position: 2
---

# Environment Configuration

## Network

| Device | Description |
|---|---|
| Tianzhun 003 | Default examples use `6.6.7.100`; use the actual site address if changed |
| Host PC | Same subnet as Tianzhun 003, with no conflict |
| Pico | Independent address on the same subnet; the client connects to Tianzhun 003 |

```bash
ping 6.6.7.100
```

Pico must not use the same IP as Tianzhun 003. When changing the site subnet, update the host, Pico, and network-service configuration together.

## Wearing and tracking

1. Install the left and right wearable arm units securely.
2. Wear the waist tracker in the specified orientation.
3. Install leg trackers at the specified positions without swapping sides.
4. Check charge, connection, and tracking for every component.
5. After Home, test small arm motions first, then verify torso and knee mapping.

## Software

Skye/Luna uses the classic Apex Teleop and Pico client matched to the controller release. See [Classic Apex Teleop](/software/apex-teleop/classic).
