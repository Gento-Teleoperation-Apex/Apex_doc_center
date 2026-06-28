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

将 `.apk` 文件安装到您的头显中，在保持两个手柄被追踪的状态下打开应用。同意弹窗提示。

## 检查您的设置

### 电量

确保您的头显电量在 **20%** 以上，否则出于安全考虑，系统会弹出警告信息，您可能无法开始使用遥操作。

<figure>
    <img src={require("./Screenshots/meta_charge.jpg").default} alt="Low battery warning message" />
    <figcaption>低电量警告信息</figcaption>
</figure>

### 网络

确保您的头显通过 USB 扩展坞和网线连接到服务器，以获得最佳体验。强烈建议您**关闭头显中的 WiFi**，以防在操作过程中受到任何干扰。

<figure>
    <img src={require("./Screenshots/meta_wifi.jpg").default} alt="WiFi setting" />
    <figcaption>WiFi 设置</figcaption>
</figure>

### 手柄电量

使用前请检查手柄电量。如果电量过低，手柄将无法被追踪，您也无法使用遥操作。您可能需要充电或暂时更换电池，稍后再试。在您放下手柄一段时间后若系统无法追踪到手柄，图标会熄灭。电池图标旁边的手柄图标显示的是由 OpenXR Runtime 提供的实时追踪状态，而不是电量数值。

### 边界设置

我们使用您的房间边界设置来获取真实世界中地面的位置，并将虚拟机械臂的位置显示出来。如果您没有设置房间边界，摇操时您将会看到系统UI 和虚拟机械臂过高或者过低。请在 <i><b>快捷控制 > 边界</b></i> 中检查是否正确设置房间边界。不建议使用<i><b>原地</b></i>。

## 连接到服务器

进入应用后将显示此界面。

填写您的服务器 **IP 地址**以及您的**身高（cm）**，您可以点击身高文本框上方的按钮获取一个预估值。如果检测到服务器地址，IP 输入框上方也会出现提示框`ApexHost XXX.XXX.XXX.XXX`，点击即可将服务器地址填入输入框。

确认身高和 IP 地址正确后，点击 `Connect`（连接）按钮连接到服务器。

*   **连接成功：**
    *   您双手的手柄会发出两次短促的震动。
    *   `Connection`（连接）图标将会改变。
*   **连接失败：**
    *   您双手的手柄会发出一次长震动。
    *   `Connection`（连接）图标不会有任何变化。

<figure>
    <img src={require("./Screenshots/meta_connecttcp.jpg").default} alt="Connect to server" />
    <figcaption>连接到服务器</figcaption>
</figure>

## 如何开始和结束遥操作

连接到服务器后，您可以按下左手柄上的 **Y 键**开始遥操作。界面会显示您的连接状态。在此模式下，您可以使用手柄控制机器人。按下 **X 键**可以结束摇操。开始和结束时都会有语音播报，如果在摇操过程中出现低电量、设备断联的情况，会自动断开摇操，断开时会有手柄震动。

将手跟虚拟机械臂重合，按住**侧边键**即可以向机械臂发送操控指令。松开侧边键则暂停摇操。强烈建议您在未摇操或暂停时按 **X** 直接退出摇操。

摇操过程中手柄追踪会有偶尔的无法追踪提示是正常现象，建议将手柄的按钮面朝向头显镜头以保持高质量追踪。

<div style={{display: 'flex', justifyContent: 'space-between', gap: '10px'}}>
    <figure style={{margin: 0, width: '48%'}}>
        <img src={require("./Screenshots/meta_teleop_wired.jpg").default} alt="Teleoperation with cable" style={{width: '100%'}} />
        <figcaption>有线遥操作</figcaption>
    </figure>
    <figure style={{margin: 0, width: '48%'}}>
        <img src={require("./Screenshots/meta_teleop_teleopwifi.jpg").default} alt="Teleoperation without cable" style={{width: '100%'}} />
        <figcaption>无线遥操作</figcaption>
    </figure>
</div>

## 如何进入开发者模式

:::warning 警告
仅供开发者使用。这可能会给您的设备和机器人带来安全风险。请仅在明确操作后果的情况下启用。
:::

双击面板顶部的 `KernelM` 标志即可打开开发者面板。您会看到主面板旁边出现了新的选项。

再次双击即可关闭开发者面板。

<figure>
    <img src={require("./Screenshots/meta_teleop_developer.jpg").default} alt="Developer Mode" />
    <figcaption>开发者模式</figcaption>
</figure>

在开发者模式下您可以做什么？

*   **单独**更改 TCP、WebRTC 和 UDP 端口。
*   测试 TCP、WebRTC, UDP 的连接状态，并单独断开/连接它们。
*   查看与 TCP、WebRTC、UDP 相关的应用日志。
*   **切换XR机械臂末端原点配置：** 可以根据不同情况（如夹爪、灵巧手）切换XR发送出去的机械臂末端原点配置，以矫正追踪器位置。

下图展示了通过点击开发者面板里面的配置按钮来切换不同机械臂末端原点配置的案例。您应该咨询我们的技术人员来获取更多细节或支持。

<div style={{display: 'flex', justifyContent: 'space-between', gap: '10px'}}>
    <figure style={{margin: 0, width: '32%'}}>
        <img src={require("./Screenshots/gripperconfig.jpg").default} alt="Gripper configuration" style={{width: '100%'}} />
        <figcaption style={{textAlign: 'center', fontSize: '0.9em'}}>示意图: Gripper 配置</figcaption>
    </figure>
    <figure style={{margin: 0, width: '32%'}}>
        <img src={require("./Screenshots/dexhandconfig1.jpg").default} alt="Dexhand configuration 1" style={{width: '100%'}} />
        <figcaption style={{textAlign: 'center', fontSize: '0.9em'}}>示意图: Dexhand 配置 1</figcaption>
    </figure>
    <figure style={{margin: 0, width: '32%'}}>
        <img src={require("./Screenshots/dexhandconfig2.jpg").default} alt="Dexhand configuration 2" style={{width: '100%'}} />
        <figcaption style={{textAlign: 'center', fontSize: '0.9em'}}>示意图: Dexhand 配置 2</figcaption>
    </figure>
</div>

> 本应用使用 TCP 进行服务器通信，使用 UDP 进行机器人控制并接收来自机器人的遥操作数据，使用 WebRTC 进行视频流传输。

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
      <td rowSpan={7}>
        <figure style={{margin: 0}}>
          <img src={require("./Screenshots/questtouchpluscontroller.png").default} alt="Quest Touch Plus Controller" width={380} />
          <figcaption style={{textAlign: 'center'}}>Quest Touch Plus Controller
          <br/><i>来源：Meta 开发者文档</i></figcaption>
        </figure>
      </td>
    </tr>
    <tr><td>左手</td><td>Y 键</td><td>开始遥操作</td></tr>
    <tr><td>左手</td><td>X 键</td><td>退出遥操作</td></tr>
    <tr><td>右手</td><td>A 键</td><td>显示/隐藏视频窗口</td></tr>
    <tr><td>右手</td><td>菜单键</td><td>长按以重置原点</td></tr>
    <tr><td>左/右</td><td>扳机键</td><td>点击UI, 控制夹爪</td></tr>
    <tr><td>左/右</td><td>侧边键</td><td>摇操时按住</td></tr>
  </tbody>
</table>

## 已知问题

*   [待更新。]
