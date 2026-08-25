---
title: APK Installation and Upgrade
sidebar_label: APK Installation
sidebar_position: 1
---

# Headset APK Installation and Upgrade

This page applies to Pico and Meta Quest headsets. Before installation, confirm that the delivered APK matches the headset model and belongs to the same delivery release as the controller-side Teleop service.

:::warning Before installation

- Pico and Meta Quest use different APKs. Do not install one platform's package on the other.
- Record the current APK, Teleop, and Apex versions, together with the Host IP, ports, and site-specific client settings.
- Use a USB data cable. A charge-only cable cannot establish an ADB connection.
- Stop teleoperation and leave the robot in a safe state during installation.

:::

## 1. Prepare ADB

Install Android Debug Bridge on Ubuntu:

```bash
sudo apt update
sudo apt install adb
adb version
```

On Windows, extract Android SDK Platform-Tools and open PowerShell in that folder. Use `.\adb.exe` in place of `adb` in the following commands if necessary.

## 2. Enable USB Debugging

1. Enable system developer mode and USB debugging according to the headset vendor's requirements.
2. Keep the headset powered on and unlocked, then connect it with a USB data cable.
3. Accept the USB debugging prompt inside the headset. Select “Always allow” only for a trusted maintenance computer.
4. Run:

```bash
adb kill-server
adb start-server
adb devices
```

A connected headset should appear with the state `device`:

```text
List of devices attached
<SERIAL>    device
```

| State | Action |
|---|---|
| `unauthorized` | Put on the headset, allow USB debugging, and run `adb devices` again |
| No device | Try another USB data cable or port, unlock the headset, and verify USB debugging |
| Multiple devices | Add `-s <SERIAL>` to subsequent commands |

## 3. Install the APK

Open the directory containing the APK and replace the example with the delivered filename:

```bash
cd ~/Downloads
adb install -r "./<HEADSET_APK_FILE>.apk"
```

A successful installation prints:

```text
Success
```

With multiple Android devices connected:

```bash
adb -s <SERIAL> install -r "./<HEADSET_APK_FILE>.apk"
```

The `-r` option performs an in-place upgrade and preserves application data when the package name and signature match. Do not type the example angle brackets literally.

## 4. When an In-Place Upgrade Fails

For `INSTALL_FAILED_UPDATE_INCOMPATIBLE`, a signature mismatch, or a downgrade error, record the current client settings first. Uninstall the old Apex Teleop application through the headset's application settings, then install the new APK:

```bash
adb install "./<HEADSET_APK_FILE>.apk"
```

Uninstalling clears the local Host IP, port, and other application settings. Do not copy an `adb uninstall` command from another source unless the actual Android package ID has been confirmed.

For `INSTALL_FAILED_VERSION_DOWNGRADE`, first verify that the delivered package is correct. If an approved rollback is required, uninstall the current version and then install the confirmed rollback APK.

## 5. Open and Verify the Application

1. Disconnect the installation USB cable and restore the delivered wired-network connection.
2. Open Apex Teleop from the headset's application library, Unknown Sources, or enterprise application list.
3. On first launch, grant the required permissions and complete boundary, safety, and privacy prompts.
4. Restore the delivered Host IP. The current default controller address is `6.6.7.100` for both Tianzhun and Lingjing Thor; use the delivery parameters when the site network has been changed.
5. Keep both controllers or the required trackers online, then verify the client version, network, video, and tracking states.
6. Clear the robot workspace and begin teleoperation with small movements.

Continue with the matching operation guide:

- [Pico User Manual](./pico.md)
- [Meta Quest User Manual](./meta.md)

## 6. Information Required for Installation Support

Provide the output of both commands instead of reporting only “installation failed”:

```bash
adb devices
adb install -r "./<HEADSET_APK_FILE>.apk"
```

Also provide the headset model, system version, complete APK filename, Teleop/Apex versions, full terminal error, and a screenshot of any headset prompt. Do not repeatedly install or switch APKs while the robot is moving.
