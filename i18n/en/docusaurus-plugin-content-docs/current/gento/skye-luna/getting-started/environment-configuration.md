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
5. After Home, test small arm motions first. Then verify BODY/LIFT mapping on Skye or torso/leg mapping on Luna.

## Software

Skye/Luna uses the Teleop service, Apex frontend, and Pico client matched to the controller release. The current documentation baseline is Teleop service `1.0.18` and Gento frontend `1.0.6.81g`. Versions continue to evolve, so use packages from the same delivery release. See [Classic Apex Teleop](/software/apex-teleop/classic).
