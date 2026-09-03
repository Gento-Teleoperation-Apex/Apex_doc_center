---
title: Privacy Policy
sidebar_label: Privacy Policy
sidebar_position: 5
---

<div className="bingru-theme" />

# Privacy Policy for Apex Teleop

Last updated: August 27, 2026

Gento Teleoperation Apex Team ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy outlines how our application (**Apex Teleop**, package name: `com.KernalMind.Apex_Teleop`) handles camera, spatial tracking, and network data when providing real-time local streaming and robot teleoperation capabilities.

:::info Platform Distinction
* **Meta Quest Version**: May request access to the headset's RGB passthrough camera feeds to support MR spatial alignment and local real-time video streaming.
* **PICO Version**: **Does NOT have headset camera access**. The PICO version neither requests nor accesses physical camera sensors on the headset; it only renders virtual scenes and robot video feeds received from the robot host.
:::

### 1. Data We Access

* **Camera Video Stream**:
  * **Meta Quest**: The application accesses the headset’s RGB camera feeds (Passthrough) solely to generate a real-time local video stream for first-person view, MR boundary alignment, and local streaming to client browsers within the local network.
  * **PICO**: The PICO application **does NOT access or request** the headset's RGB or physical tracking camera feeds (No Headset Camera Access). All video feeds displayed in the PICO client originate exclusively from the robot's onboard cameras transmitted over the local network.
* **Spatial Tracking Data**: The application accesses 6DoF (six degrees of freedom) head pose and controller/tracker poses (position and orientation) strictly to calculate real-time robot arm and gripper teleoperation commands.
* **Local Network Information**: The application accesses local IP address configurations, subnet details, and local socket ports to discover and establish direct point-to-point connections (UDP/TCP/WebRTC) with the robot host controller (e.g., `6.6.7.100`) and to broadcast local streaming feeds to devices within the same local area network (LAN).
* **Personal Information**: We do not collect, process, or store any personal identifiable information (PII), such as names, email addresses, phone numbers, Meta user account credentials, payment information, or facial biometric data.

### 2. How Data Is Used

* **Real-time Streaming & Teleoperation**: Video feeds and tracking coordinates are used solely to execute real-time robot teleoperation commands and local LAN video previews. Data is not repurposed for marketing, profiling, or analytics.
* **No Persistent Storage**: All camera feeds, spatial tracking data, and video streams are processed transiently in device volatile memory (RAM). The application does **not** record, cache, or permanently store any camera video or personal visual data on the device's local storage or external media.
* **No Cloud Transmission**: All communications and video transmissions occur strictly within your private Local Area Network (LAN) or direct wired/wireless connection between the headset and the robot host controller. No video feeds, tracking coordinates, or telemetry data are uploaded to external cloud servers, remote analytics platforms, or third-party servers.

### 3. Data Retention and Deletion Requests (VRC.Quest.Privacy.4 Compliance)

* **Data Retention**: Because Apex Teleop does not collect, record, or retain any personal data, video recordings, or spatial tracking logs on our servers or in device persistent storage, there is no stored personal data retained.
* **Deletion Requests**: If you have any questions regarding data handling or wish to request confirmation that no personal data associated with you is retained, you may contact us at **18813091982@163.com**. We will handle all user privacy inquiries and deletion requests promptly and free of charge.

### 4. User Control & Consent

* **System Permission & Runtime Consent**: On Meta Quest, camera access requires explicit system-level permission and runtime user consent upon initial launch. The PICO version does not request camera permissions.
* **User-Initiated Streaming**: Teleoperation and video streaming only initiate upon active user configuration and explicit commands (e.g., clicking "Connect" or toggling the streaming function).
* **Permission Revocation**: You may revoke camera, spatial data, or network permissions at any time via your device's system settings (**Settings > Applications > Apex Teleop > Permissions**).

### 5. Third-Party Sharing

We do not sell, trade, rent, or share any personal data, video feeds, spatial tracking information, or network telemetry with third parties.

### 6. Contact Us

If you have any questions, feedback, or concerns regarding this Privacy Policy or our data handling practices, please contact us at:

* **Email**: 18813091982@163.com
* **GitHub Repository**: [Gento-Teleoperation-Apex/Apex_doc_center](https://github.com/Gento-Teleoperation-Apex/Apex_doc_center)
* **Support & Issues**: [Apex Support & Troubleshooting](https://gento-teleoperation-apex.github.io/Apex_doc_center/advanced/troubleshooting)
