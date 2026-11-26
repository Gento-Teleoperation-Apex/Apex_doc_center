---
title: Apex XR 数据接口
sidebar_label: Apex XR 数据接口
---

Apex XR 数据接口用于跨设备传输遥操作数据。PICO 和 Meta Quest 共用同一数据包格式。Meta Quest 只有“仅双臂”和“简易全身追踪”两种遥操模式，因此不提供 PICO 全身追踪数据。

| 遥操模式 | 可用数据 |
| --- | --- |
| 仅双臂模式 | 头显及左右手柄或手部的位姿。 |
| PICO 全身追踪 | 追踪有效时提供身体关节数据。 |
| 简易全身追踪 | 在头显内完成校准后，提供逆运动学解算的身体关节数据。下肢位姿由解算估算。 |

三种模式均发送 897 字节的定长数据包。缺失的身体关节记录全部置零。三种模式均发送手柄按键数据。

下载 Apex XR Live Preview。此应用可以让你熟悉所有数据接口并实时预览。

<details>
<summary>Windows</summary>

[下载 64 位](pathname:///files/apex-xr-viewer/apex-xr-viewer-windows-x64.exe)或[下载 32 位](pathname:///files/apex-xr-viewer/apex-xr-viewer-windows-x86.exe)。下载后双击运行。

[下载 Python 版](pathname:///files/apex-xr-viewer/apex-xr-viewer.pyz)。需要 Python 3.10 或更新版本。在下载目录运行 `py -3 apex-xr-viewer.pyz`。

</details>

<details>
<summary>macOS</summary>

[下载 Python 版](pathname:///files/apex-xr-viewer/apex-xr-viewer.pyz)。需要 Python 3.10 或更新版本。在下载目录运行 `python3 apex-xr-viewer.pyz`。

</details>

<details>
<summary>Linux</summary>

[下载 Python 版](pathname:///files/apex-xr-viewer/apex-xr-viewer.pyz)。需要 Python 3.10 或更新版本。在下载目录运行 `python3 apex-xr-viewer.pyz`。

</details>

Apex XR Live Preview 启动后会自动打开浏览器。请选择本机网卡和选择同一局域网内的头显（保持应用开启），点击连接图标查看实时数据。

<div style={{display: 'flex', justifyContent: 'space-between', gap: '10px'}}>
    <figure style={{margin: 0, width: '49%'}}>
        <img src={require("./Screenshots/rtudp-preview1.jpg").default} alt="数据查看器显示三维关节和手柄按键" style={{width: '100%'}} />
        <figcaption style={{textAlign: 'center', fontSize: '0.9em'}}>三维关节视图和手柄输入</figcaption>
    </figure>
    <figure style={{margin: 0, width: '49%'}}>
        <img src={require("./Screenshots/rtudp-preview2.jpg").default} alt="数据监视器显示右手摇杆输入随时间变化" style={{width: '100%'}} />
        <figcaption style={{textAlign: 'center', fontSize: '0.9em'}}>右手摇杆输入曲线</figcaption>
    </figure>
</div>

## 局域网设备发现

建议先通过局域网发现在线头显。主机在同一局域网内监听 UDP 组播 `224.0.0.225:7447`，并向该地址发送 `scout`。头显收到请求或启动时，向同一地址组播 `hello`。

Apex XR 使用 Zenoh 的发现流程，使用下方的自定义 UTF-8 JSON 报文。标准协议见 [Zenoh 官方协议](https://spec.zenoh.io/spec/1.0.0/scouting/index.html)。以下是报文示例。

1. 主机发送 `scout`。每次启动生成新的 `zid`，`whatami` 为 `1` 表示对等节点。

  ```json
  {"msg_type":"scout","zid":"11111111-1111-4111-8111-111111111111","whatami":1}
  ```

2. 头显回复 `hello`。

  ```json
  {
    "msg_type": "hello",
    "zid": "22222222-2222-4222-8222-222222222222",
    "whatami": 1,
    "locators": ["tcp/192.168.1.42:9010", "udp/192.168.1.42:9000", "udp/192.168.1.42:9001"],
    "metadata": {"name": "ApexHeadset", "model": "PICO A210", "app_version": "1.0.0"}
  }
  ```

## 网络端口和指令

| 参数 | 值 | 说明 |
| --- | --- | --- |
| 传输协议 | UDP | 多字节数据按小端序编码。 |
| 发送频率 | 约 90 Hz | 当前配置。 |
| 头显信令端口 | 9871 | 默认端口。 |
| 数据接收端口 | 9870 | 默认端口。 |

接收端绑定 UDP 端口后，从同一套接字向头显的信令端口发送以下 ASCII 指令。

| 指令 | 头显行为 |
| --- | --- |
| `APLYLINK` | 开始向指令的源 IP 和源端口发送数据。 |
| `RELEASELINK` | 停止发送数据。 |

## 数据包格式

字节偏移从 0 开始，范围包含两端。

| 字节偏移 | 长度（字节） | 类型 | 字段 | 说明 |
| --- | --- | --- | --- | --- |
| 0–4 | 5 | `char[5]` | 包头标识 | 固定为 `PICO9`。 |
| 5–8 | 4 | `uint32` | 包序号 | 每次启动发送时从 0 开始递增。 |
| 9–16 | 8 | `uint64` | 时间戳 | 组包时的 Unix 时间戳，单位为毫秒。 |
| 17–852 | 836 | 关节记录 × 11 | 关节数据 | 11 个关键点的位姿、速度和加速度。 |
| 853–862 | 10 | `uint8[10]` | 按键 | 0 为松开，1 为按下。 |
| 863–894 | 32 | `float32[8]` | 模拟量 | 摇杆、扳机键和侧边键的输入值。 |
| 895–896 | 2 | `uint16` | 校验码 | 使用 CRC16-Modbus，覆盖第 0–894 字节。 |

相比旧版 745 字节包，新版保留 `PICO9` 包头和前九个关节的偏移，在躯干后追加左右肘。按键、模拟量和校验码的起始偏移均后移 152 字节。仅支持旧版长度的接收器需要更新；上方提供的查看器支持两种包长。

## 关节数据

### 关键点顺序

每个关键点占 76 字节。OpenPose 列用于对照人体部位。

| 序号 | 字节偏移 | 部位 | OpenPose（CMU BODY_25） |
| --- | --- | --- | --- |
| 0 | 17–92 | 头部 | 鼻（0） |
| 1 | 93–168 | 左手 | 左腕（7） |
| 2 | 169–244 | 右手 | 右腕（4） |
| 3 | 245–320 | 骨盆 | 髋部中心（8） |
| 4 | 321–396 | 左膝 | 左膝（13） |
| 5 | 397–472 | 右膝 | 右膝（10） |
| 6 | 473–548 | 左脚 | 左踝（14） |
| 7 | 549–624 | 右脚 | 右踝（11） |
| 8 | 625–700 | 躯干 | 颈部（1）、髋部中心（8） |
| 9 | 701–776 | 左肘 | 左肘（6） |
| 10 | 777–852 | 右肘 | 右肘（3） |

<figure>
    <img src={require("./Screenshots/OpenPoseBody25.png").default} alt="Low battery warning message" />
    <figcaption>OpenPose BODY_25 关键点示意图</figcaption>
</figure>

### 关节记录

每条记录包含 19 个 `float32`。相对偏移从该记录起始字节算起。关节皆为世界坐标系，坐标系默认为X 朝前，Y 朝左，Z 向上。

| 相对偏移 | 长度（字节） | 分量 | 含义 | 单位 |
| --- | --- | --- | --- | --- |
| 0–11 | 12 | `px, py, pz` | 三维位置 | m |
| 12–27 | 16 | `qx, qy, qz, qw` | 旋转四元数 | 无量纲 |
| 28–39 | 12 | `vx, vy, vz` | 线速度 | m/s |
| 40–51 | 12 | `avx, avy, avz` | 角速度 | rad/s |
| 52–63 | 12 | `ax, ay, az` | 线加速度 | m/s² |
| 64–75 | 12 | `aax, aay, aaz` | 角加速度 | rad/s² |

## 手柄数据

| 字节偏移 | 输入 | 数据类型 |取值范围 | 图中编号 |
| --- | --- | --- | --- | --- |
| 853 | 左手 X 键 | uint8 | 0,1 | 9 |
| 854 | 左手 Y 键 | uint8 | 0,1 | 10 |
| 855 | 右手 A 键 | uint8 | 0,1 | 8 |
| 856 | 右手 B 键 | uint8 | 0,1 | 12 |
| 857 | 左手摇杆按下（Scale Toggle） | uint8 | 0,1 | 5 |
| 858 | 右手摇杆按下（Scale Toggle） | uint8 | 0,1 | 6 |
| 859–862 | 预留，置零 | uint8 | 0 | — |
| 863–866 | 左手摇杆 X 轴 | float32 | -1.0 至 1.0 | 5 |
| 867–870 | 左手摇杆 Y 轴 | float32 | -1.0 至 1.0 | 5 |
| 871–874 | 右手摇杆 X 轴 | float32 | -1.0 至 1.0 | 6 |
| 875–878 | 右手摇杆 Y 轴 | float32 | -1.0 至 1.0 | 6 |
| 879–882 | 左手扳机键 | float32 | 0.0 至 1.0 | 11 |
| 883–886 | 右手扳机键 | float32 | 0.0 至 1.0 | 13 |
| 887–890 | 左手侧边键 | float32 | 0.0 至 1.0 | 3 |
| 891–894 | 右手侧边键 | float32 | 0.0 至 1.0 | 15 |

<figure>
    <img src={require("./Screenshots/picoultracontroller.png").default} alt="Low battery warning message" />
    <figcaption>手柄示意图</figcaption>
</figure>
