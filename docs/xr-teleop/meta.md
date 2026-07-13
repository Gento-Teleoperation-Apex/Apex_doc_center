---
title: META QUEST 用户手册
sidebar_label: META QUEST
sidebar_position: 2
---

<div className="bingru-theme" />

Meta Quest 人机遥操作

**最新版本：** [`download`![download](./Screenshots/download.svg)](https://github.com/KLMmotion/km_teleop_openxr/releases)

*天机 | 科摩德*

## 打开应用

卸载旧版应用，将最新版本 `.apk` 文件安装到您的头显中，在保持两个手柄被追踪的状态下打开应用。同意弹窗提示。

## 检查您的设置

### 电量

确保您的头显电量在 **20%** 以上，否则出于安全考虑，系统会弹出警告信息，您可能无法开始使用遥操作。

<figure>
    <img src={require("./Screenshots/meta_charge.jpg").default} alt="Low battery warning message" />
    <figcaption>低电量警告信息</figcaption>
</figure>

### 网络

确保您的头显通过 USB 扩展坞和网线连接到主机，以获得最佳体验。强烈建议您手动**关闭头显中的 WiFi**，以防在操作过程中受到任何干扰。

<figure>
    <img src={require("./Screenshots/meta_wifi.jpg").default} alt="WiFi setting" />
    <figcaption>WiFi 设置</figcaption>
</figure>

### 手柄电量

使用前请检查手柄电量。如果手柄电量过低，手柄将无法被追踪，您也无法使用遥操作。您可能需要充电或暂时更换电池，稍后再试。在您放下手柄一段时间后若系统无法追踪到手柄，图标会熄灭。电池图标旁边的手柄图标显示的是由 OpenXR Runtime 提供的实时追踪状态，而不是电量数值。

### 边界设置

我们使用您的房间边界设置来获取真实世界中地面的位置，并将虚拟机械臂的位置显示出来。如果您没有设置房间边界，摇操时您将会看到系统UI 和虚拟机械臂过高或者过低。请在 <i><b>快捷控制 > 边界</b></i> 中检查是否正确设置房间边界。不建议使用<i><b>原地</b></i>。

## 机械臂末端执行器配置

在这个选项中自由切换机械臂末端的配置，通常是灵巧手或者夹爪。根据不同厂家的执行器，遥操的XR 端也需要更改相应配置。

如果机械臂装夹爪，XR端请选择：控制器（手柄）

如果机械臂装灵巧手，XR端请选择：手套（目前仅支持 Manus 手套）


## 连接到主机

进入应用后将显示此界面。

填写您的主机 **IP 地址**以及您的**身高（cm）**，您可以点击身高文本框上方的按钮获取一个预估值。如果检测到主机地址，IP 输入框上方也会出现提示框`ApexHost XXX.XXX.XXX.XXX`，点击即可将主机地址填入输入框。

您可以在主面板上直接选择机械臂末端原点配置（按钮位于 `Connect` 按钮上方）。可以根据不同情况（如夹爪、灵巧手）切换 XR 发送出去的机械臂末端原点配置，以矫正追踪器位置。

:::tip 提示
您必须退出遥操作状态才能更改配置，处于遥操作状态下该按钮无法点击。
:::

确认身高和 IP 地址正确后，点击 `Connect`（连接）按钮连接到主机。

*   **连接成功：**
    *   您双手的手柄会发出两次短促的震动。
    *   `Connection`（连接）图标将会改变。
*   **连接失败：**
    *   您双手的手柄会发出一次长震动。
    *   `Connection`（连接）图标不会有任何变化。

<figure>
    <img src={require("./Screenshots/teleop_endeffector.jpg").default} alt="Connect to host and end-effector settings" />
    <figcaption>连接到主机与末端原点设置</figcaption>
</figure>

### 主机录制功能

在右手柄上按下 **B 键**可以通知主机开始或结束录制，录制成功或失败会有语音提示。在使用此功能前请确保头显跟主机的 HTTP 连接畅通，通过查看主面板上的录制图标（Recording Icon），如果没有感叹号就表示目前连接正常。

## 如何开始和结束遥操作

连接到主机后，您可以按下左手柄上的 **Y 键**开始遥操作。界面会显示您的连接状态。在此模式下，您可以使用手柄控制机器人。按下 **X 键**可以结束摇操。开始和结束时都会有语音播报，如果在摇操过程中出现低电量、设备断联的情况，会自动断开摇操，断开时会有手柄震动。

将手跟虚拟机械臂重合，按住**侧边键**即可以向机械臂发送操控指令。松开侧边键则暂停摇操。强烈建议您在未摇操或暂停时按 **X** 直接退出摇操。

在主面板上有左/右手手柄的图标（Controller Icon），如果图标亮起且没有显示红色，即表示目前手柄的追踪状态正常。

在遥操作过程中，您将看到如下视频传输界面：

<div style={{display: 'flex', justifyContent: 'space-between', gap: '10px'}}>
    <figure style={{margin: 0, width: '49%'}}>
        <img src={require("./Screenshots/teleop_wifi_connectingvideo.jpg").default} alt="Connecting video stream" style={{width: '100%'}} />
        <figcaption style={{textAlign: 'center', fontSize: '0.9em'}}>视频连接中</figcaption>
    </figure>
    <figure style={{margin: 0, width: '49%'}}>
        <img src={require("./Screenshots/teleop_wifi_connectedvideo.jpg").default} alt="Connected video stream" style={{width: '100%'}} />
        <figcaption style={{textAlign: 'center', fontSize: '0.9em'}}>视频已连接</figcaption>
    </figure>
</div>

<figure style={{marginTop: '15px'}}>
    <img src={require("./Screenshots/teleop_video_focused.jpg").default} alt="机械臂右手腕部相机画面" style={{width: '100%'}} />
    <figcaption style={{textAlign: 'center', fontSize: '0.9em'}}>用户正在查看机械臂右手的相机流来帮助他精细化操作</figcaption>
</figure>

此外，主视频流支持切换双目视频（3D）和单目视频（2D）画面。您可以点击空间视频窗口的左上方的按钮来切换。

<figure style={{marginTop: '15px'}}>
    <img src={require("./Screenshots/teleop_stereo.jpg").default} alt="双目视频切换" />
    <figcaption>空间视频窗口左上方的双目视频切换选项</figcaption>
</figure>

## 如何进入开发者模式

:::warning 警告
仅供开发者使用。这可能会给您的设备和机器人带来安全风险。请仅在明确操作后果的情况下启用。
:::

双击面板顶部的 `KernalM` 标志即可打开开发者面板。您会看到主面板旁边出现了新的选项。本应用使用 TCP 进行主机通信，使用 UDP 进行机器人控制并接收来自机器人的遥操作数据，使用 WebRTC 进行视频流传输。

再次双击即可关闭开发者面板。

<figure>
    <img src={require("./Screenshots/teleop_debugmode.jpg").default} alt="Developer Mode" />
    <figcaption>开发者模式</figcaption>
</figure>

在开发者模式下您可以做什么？

在开发者模式下，您可以查看主机与头显之间的通讯细节和具体日志，检查视频的传输与解码情况，进行各个端口配置，以及进行其他更精细的配置。

*   单独更改主机连接、空间视频和数据传输端口。
*   测试主机连接、空间视频和数据传输状态并单独断开/连接它们。
*   查看与主机连接、空间视频和数据传输相关的应用日志。

## 安全检查

[待更新。]

## 交互按键对照表

<table>
  <thead>
    <tr>
      <th>手柄</th><th>按键</th><th>功能</th><th></th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>左手</td><td>菜单键</td><td>最大化/最小化面板</td>
      <td rowSpan={8}>
        <figure style={{margin: 0}}>
          <img src={require("./Screenshots/questtouchpluscontroller.png").default} alt="Quest Touch Plus Controller" width={380} />
          <figcaption style={{textAlign: 'center'}}>Quest Touch Plus Controller</figcaption>
        </figure>
      </td>
    </tr>
    <tr><td>左手</td><td>Y 键</td><td>开始遥操作</td></tr>
    <tr><td>左手</td><td>X 键</td><td>退出遥操作</td></tr>
    <tr><td>右手</td><td>A 键</td><td>显示/隐藏视频窗口</td></tr>
    <tr><td>右手</td><td>B 键</td><td>开始/结束主机录制</td></tr>
    <tr><td>右手</td><td>菜单键</td><td>长按以重置原点</td></tr>
    <tr><td>左/右</td><td>扳机键</td><td>点击UI, 控制夹爪</td></tr>
    <tr><td>左/右</td><td>侧边键</td><td>摇操时按住</td></tr>
  </tbody>
</table>

## 已知问题

*   [待更新。]
