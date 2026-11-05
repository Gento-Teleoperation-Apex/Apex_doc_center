---
title: Software and Firmware Update
sidebar_position: 5
---

# Software and Firmware Update

Record the Tianzhun 003 controller, Teleop service, Apex frontend, and Pico client versions before updating. Back up network, model, camera, and tracking configuration and safely stop the robot.

```bash
sudo apt install ./<controller-package-from-delivery-manifest>.deb
```

Skye/Luna requires a matching Gento controller package marked with `g` or `gento`. Do not install an unmarked Marvin Pro package.

The current formal documentation baseline is `v1.1.7.1g` with Gento SDK `4.7.1`, but this does not mean every customer system already runs that release. The controller, Teleop service, Apex frontend, and Pico packages must come from the same delivery release. After updating, verify Robot, 3D pose, cameras, Pico, and Home. Then verify small arm/BODY/LIFT motions on Skye or arm/BODY motions on Luna.

For validation, saving, applying, and post-apply checks in the updated matching UI, see the [current Gento operation guide](/software/apex-teleop/gento-current). Updating the baseline package does not establish DAgger support; check the delivery manifest separately and complete the [DAgger integration and acceptance checks](/vla/dagger#10-api-reference-and-acceptance-checklist).

See the [Pico headset guide](/xr-teleop/pico) for installation and developer mode. Do not update robot-controller, servo, or tracker firmware across versions without technical support approval.
