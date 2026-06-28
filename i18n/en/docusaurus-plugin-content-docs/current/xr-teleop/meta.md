---
title: USER MANUAL FOR META QUEST
sidebar_label: META QUEST
sidebar_position: 2
---

<div className="bingru-theme" />

Human-Robot TeleOperation for Meta Quest

**Latest version:** [`download`![download](./Screenshots/download.svg)](https://github.com/KLMmotion/km_teleop_openxr/releases)

*Tianji | KernelMind*

## Open app

Install `.apk` to your headset, open with two controllers keeping tracked. Agree to popups.

## Check your setups

### Battery

Make sure your headset battery is above **20%**, or the warning message would pop up and you may not start using teleoperation for safety concerns.

<figure>
    <img src={require("./Screenshots/meta_charge.jpg").default} alt="Low battery warning message" />
    <figcaption>Low battery warning message</figcaption>
</figure>

### Internet

Make sure your headset is connected to server through USB hub and LAN cable for best experience. You are strongly suggested to **turn off WiFi** in headset in case of any interference during operation. Click on the button below the message to open WiFi setting panel.

<figure>
    <img src={require("./Screenshots/meta_wifi.jpg").default} alt="WiFi setting" />
    <figcaption>WiFi setting</figcaption>
</figure>

### Controller Battery

Check your controller battery level before using. If it is too low, the controller will not be able to track and you will not be able to use teleoperation. You may need to charge it or replace batteries for a while and try again. The controller icon near the battery icon shows the real-time tracking status provided by OpenXR Runtime, not the battery numbers.

### Boundary

We use your boundary settings to determine the location of the real-world floor and display the position of the virtual robotic arm. If you haven't set up your room boundary, the system UI and virtual robotic arm may appear too high or too low during teleoperation. Please check if your room boundary is correctly configured in <i><b>Quick Control > Boundary</b></i>. Don't recommend to proceed with <i><b>Stationary</b></i>.

## Connect to server

This interface would be shown after you enter the app.

Please enter your server IP address and your height (in cm). You can click the button above the height input field to get an estimated value. If a server address is detected, a button reading `ApexHost XXX.XXX.XXX.XXX` will also appear above the IP input field; click it to auto-fill the server address into the field.

Once you fill IP and height, click on `Connect` button to connect to server.

*   **Connect successfully:**
    *   You will receive two short vibrations on controllers on both hands.
    *   The `Connection` icon will change.
*   **Connect fail:**
    *   You will receive a long vibration on controllers on both hands.
    *   The `Connection` icon does not make any changes.

<figure>
    <img src={require("./Screenshots/meta_connecttcp.jpg").default} alt="Connect to server" />
    <figcaption>Connect to server</figcaption>
</figure>

## How to start and end teleoperation

After connecting to the server, you can start teleoperation by pressing the **Y button** on your left controller. The interface would show you the status of connection. In this mode, you can use the controllers to control the robot. Press the **X button** to end teleoperation. There will be voice prompts when starting and ending the process. If a low battery or device disconnection occurs during operation, the teleoperation will automatically disconnect, accompanied by controller vibrations.

Align your hand with the virtual robotic arm and hold the **Grip** button to start teleoperating. Release the Grip button to pause. We strongly recommend pressing the **X** button to exit teleoperation completely whenever you are paused or not actively controlling the arm.

<div style={{display: 'flex', justifyContent: 'space-between', gap: '10px'}}>
    <figure style={{margin: 0, width: '48%'}}>
        <img src={require("./Screenshots/meta_teleop_wired.jpg").default} alt="Teleoperation with cable" style={{width: '100%'}} />
        <figcaption>Teleoperation with cable</figcaption>
    </figure>
    <figure style={{margin: 0, width: '48%'}}>
        <img src={require("./Screenshots/meta_teleop_teleopwifi.jpg").default} alt="Teleoperation without cable" style={{width: '100%'}} />
        <figcaption>Teleoperation without cable</figcaption>
    </figure>
</div>

## How to enter Developer Mode

:::warning Warning
This is for developer use only. You may bring safety issues to both of your device and the robot. Please enable it only when you know what you are doing.
:::

Double click on `KernelM` logo on the top row of the panel to open developer panel. You will see new options appear next to the main panel.

Double click again to close developer panel.

<figure>
    <img src={require("./Screenshots/meta_teleop_developer.jpg").default} alt="Developer Mode" />
    <figcaption>Developer Mode</figcaption>
</figure>

What can you do in Developer Mode?

*   Change TCP, WebRTC, UDP ports **individually**.
*   Test TCP, WebRTC, UDP connection status and disconnect/connect them individually.
*   See App log regarding to TCP, WebRTC, UDP.
*   **Change XR end-effector origin configurations:** Switch the origin configuration of the robotic arm sent out in XR based on different situations (e.g., Gripper, Dexhand) to calibrate the tracker position.

:::tip Tip
You must exit teleoperation to change configuration, the button remains uninteractable while you are manipulating the robot.
:::

Change configuration of end-effector origin by clicking on the button below, the green text indicates what is enabled.

<div style={{display: 'flex', justifyContent: 'space-between', gap: '10px'}}>
    <figure style={{margin: 0, width: '32%'}}>
        <img src={require("./Screenshots/gripperconfig.jpg").default} alt="Gripper configuration" style={{width: '100%'}} />
        <figcaption style={{textAlign: 'center', fontSize: '0.9em'}}>Config example: Gripper</figcaption>
    </figure>
    <figure style={{margin: 0, width: '32%'}}>
        <img src={require("./Screenshots/dexhandconfig1.jpg").default} alt="Dexhand configuration 1" style={{width: '100%'}} />
        <figcaption style={{textAlign: 'center', fontSize: '0.9em'}}>Config example: Dexhand 1</figcaption>
    </figure>
    <figure style={{margin: 0, width: '32%'}}>
        <img src={require("./Screenshots/dexhandconfig2.jpg").default} alt="Dexhand configuration 2" style={{width: '100%'}} />
        <figcaption style={{textAlign: 'center', fontSize: '0.9em'}}>Config example: Dexhand 2</figcaption>
    </figure>
</div>

> The App uses TCP for server communication, UDP for robot control and receives teleoperation data from robot, and WebRTC for video streaming.

## Safety check

[To be updated.]

## Lookup table for interactions

<table>
  <thead>
    <tr>
      <th>Controller</th><th>Button</th><th>Function</th><th></th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Left Hand</td><td>Menu Button</td><td>Maximize/Minimize Panel</td>
      <td rowSpan={7}>
        <figure style={{margin: 0}}>
          <img src={require("./Screenshots/questtouchpluscontroller.png").default} alt="Quest Touch Plus Controller" width={380} />
          <figcaption style={{textAlign: 'center'}}>Quest Touch Plus Controller. <br/><i>Source: Meta Developer Documentation</i></figcaption>
        </figure>
      </td>
    </tr>
    <tr><td>Left Hand</td><td>Y Button</td><td>Start teleoperation</td></tr>
    <tr><td>Left Hand</td><td>X Button</td><td>Exit teleoperation</td></tr>
    <tr><td>Right Hand</td><td>A Button</td><td>Show/Hide video window</td></tr>
    <tr><td>Right Hand</td><td>Menu Button</td><td>Hold to reset XR origin</td></tr>
    <tr><td>Both Hands</td><td>Trigger</td><td>Click UI, Control Gripper</td></tr>
    <tr><td>Both Hands</td><td>Grip</td><td>Hold to control robot</td></tr>
  </tbody>
</table>

## Known issues

*   [To be updated.]
