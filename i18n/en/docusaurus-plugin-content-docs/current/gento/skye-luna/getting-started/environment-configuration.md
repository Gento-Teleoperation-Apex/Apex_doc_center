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

The current formal Skye/Luna documentation baseline is `v1.1.7.1g` with Gento SDK `4.7.1`. At customer sites, use the controller package listed in the delivery manifest. The Teleop service, Apex frontend, and Pico client must be the matching versions from the same delivery release; do not infer their versions from the controller package number. See the [current Gento operation guide](/software/apex-teleop/gento-current) for the updated matching UI, or [Classic Apex Teleop](/software/apex-teleop/classic) for historical interfaces.
