---
title: DM 夹爪 CAN 协议
sidebar_position: 2
---

# DM 夹爪 CAN 帧收发协议与常用帧表

> 适用对象：使用 OmniGripper（DM4310）的客户开发人员和技术支持工程师。
> 文档基线：`kernelmind-apex-tool 1.0.6.10h`，2026-08-11 天准实机验证结果。
> 使用完整 Apex 系统时，应优先通过标准 ROS 2 接口控制夹爪，参见 [ApexTool 使用与二次开发](/end-effectors/apex-tool)。

当前 Marvin Pro 与 Gento 标准交付默认使用 `/tj` 命名空间。旧版独立 Tool 包可能仍使用根路径，实际接口以目标机 `ros2 topic list -t` 和 `ros2 service list -t` 为准。

:::danger 直接发帧会驱动物理夹爪

执行 `cansend` 前必须停止其他夹爪控制源、清空夹爪附近区域并确保可以立即断使能。设置零位、修改电机 ID、控制模式、量程、方向或 CAN 参数可能造成夹爪误动作或失联，不属于客户常规操作。

:::

## 1. 协议范围

本文介绍当前 OmniGripper 使用的 DM4310 电机和 MIT 控制模式，包括：

- ApexTool 到物理夹爪的通信链路。
- SocketCAN 通道和 CAN ID。
- 使能、失能、复位和 MIT 控制帧。
- 反馈帧、状态码和 ROS 2 反馈 Topic。
- 抓帧、单侧通信检查和常见故障判断。

其他 DM 电机可能采用相同帧布局，但位置、速度和力矩量程不一定相同，不能直接套用本文换算结果。位置速度、纯速度、力位混合和参数读写不是当前 ApexTool C++ 夹爪节点的正式控制链路。

## 2. 当前控制链路

```text
/tj/control/gripperValueL/R
        |
        v
ApexTool DM 夹爪节点
        |
        | SocketCAN MIT 帧
        v
vcan0 / vcan1
        |
        | Robot Node 末端透传
        v
机械臂末端板
        |
        v
左/右 DM4310 夹爪电机
```

`vcan0/vcan1` 在 Linux 中表现为虚拟 CAN 接口，但在完整 Apex 系统中由 Robot Node 和末端板透传到物理夹爪。仅在普通电脑上创建同名 vCAN 接口不会连接物理电机。

## 3. 默认通道和 CAN ID

| 对象 | SocketCAN 接口 | Slave ID | Master ID | MIT 发送 CAN ID |
|---|---|---:|---:|---:|
| 左夹爪 | `vcan0` | `0x01` | `0x11` | `0x001` |
| 右夹爪 | `vcan1` | `0x02` | `0x12` | `0x002` |

说明：

1. 控制帧发送到电机 Slave ID。
2. 反馈帧可能使用 Slave ID 或 Master ID；部分固件使用 CAN ID `0x000`，并把电机 ID 放在数据首字节低 4 位。
3. 当前 C++ 驱动接受左侧 `0x01/0x11/0x00` 和右侧 `0x02/0x12/0x00`。
4. ID 和通道应以目标机实际配置为准，不能只按左右接线颜色判断。

## 4. Linux SocketCAN 帧格式

当前链路使用标准 11 bit CAN ID 和 8 字节数据帧。Linux `struct can_frame` 的布局为：

```text
can_id: 4 bytes
can_dlc: 1 byte
padding: 3 bytes
data: 8 bytes
```

Python 打包格式：

```python
frame = struct.pack("<IB3x8s", can_id, 8, payload)
```

左夹爪 MIT 帧示例：

```text
SocketCAN：001#7FFF7FF0180627FF

Linux 16 字节内存：
01 00 00 00 08 00 00 00 7F FF 7F F0 18 06 27 FF
```

Linux 结构中的 `can_id` 采用小端存储；MIT 数据区按协议位布局排列，不能把数据区整体反转。

## 5. 启动、使能和复位

### 5.1 ApexTool 启动顺序

```text
1. 打开 vcan0 和 vcan1 非阻塞 SocketCAN 套接字
2. 左夹爪发送使能帧
3. 等待 100 ms
4. 右夹爪发送使能帧
5. 等待 100 ms
6. 按 control_rate_hz 持续发送左右 MIT 控制帧
7. 轮询接收左右反馈帧
8. 按 feedback_rate_hz 发布 ROS 反馈 Topic
```

### 5.2 复位 Service

`/tj/control/reset_grippers` 执行：

```text
左失能 -> 右失能 -> 等待 100 ms
-> 左使能 -> 等待 100 ms -> 右使能
```

调用方式：

```bash
ros2 service call /tj/control/reset_grippers std_srvs/srv/Trigger "{}"
```

### 5.3 退出行为

基线版本默认 `disable_on_shutdown=false`。节点正常退出时只关闭 SocketCAN，不保证主动发送失能帧。需要确认电机物理失能时，应按整机安全流程断使能，不能仅以“进程已停止”作为判断依据。

## 6. 特殊控制帧

特殊命令使用目标电机 Slave ID 作为 CAN ID，DLC 为 8。

| 功能 | 数据区 8 字节 | 说明 |
|---|---|---|
| 上使能 | `FF FF FF FF FF FF FF FC` | 电机进入使能状态 |
| 下使能 | `FF FF FF FF FF FF FF FD` | 电机退出使能状态 |
| 设置当前位置为零位 | `FF FF FF FF FF FF FF FE` | 改变位置基准，仅限经过确认的标定流程 |

| 功能 | 左夹爪 `vcan0` | 右夹爪 `vcan1` |
|---|---|---|
| 上使能 | `001#FFFFFFFFFFFFFFFC` | `002#FFFFFFFFFFFFFFFC` |
| 下使能 | `001#FFFFFFFFFFFFFFFD` | `002#FFFFFFFFFFFFFFFD` |
| 设置零位 | `001#FFFFFFFFFFFFFFFE` | `002#FFFFFFFFFFFFFFFE` |

:::warning 零位命令

`FE` 会改变位置基准。未确认夹爪机械位置、电机固件和恢复方法前，不得发送该命令。

:::

## 7. MIT 控制帧

### 7.1 参数与量程

| 参数 | 含义 | 基线默认值 | DM4310 编码量程 | 位数 |
|---|---|---:|---:|---:|
| `q` | 目标位置 | 由上层指令映射 | `-12.5 ~ 12.5 rad` | 16 |
| `dq` | 目标速度 | `0 rad/s` | `-30 ~ 30 rad/s` | 12 |
| `Kp` | 位置刚度 | `3.0` | `0 ~ 500` | 12 |
| `Kd` | 速度阻尼 | `0.12` | `0 ~ 5` | 12 |
| `tau` | 前馈力矩 | `0 Nm` | `-10 ~ 10 Nm` | 12 |

这些数值用于解释基线版本产生的帧，不代表客户可自行调整的安全范围。Kp/Kd、前馈力矩和物理量程需要经过夹持力、温升、抖动和稳定性验证。

### 7.2 物理值与整数互转

编码：

```text
raw = int((value - minimum) / (maximum - minimum) * (2^bits - 1))
```

解码：

```text
value = raw / (2^bits - 1) * (maximum - minimum) + minimum
```

整数编码会产生量化误差。例如零速度和零力矩反解后可能约为 `-0.007 rad/s` 和 `-0.0024 Nm`，不一定表示电机持续运动或输出负力矩。

### 7.3 MIT 8 字节布局

```text
| q 16 bit | dq 12 bit | Kp 12 bit | Kd 12 bit | tau 12 bit |
```

逐字节编码：

```text
Byte0 = q_raw[15:8]
Byte1 = q_raw[7:0]
Byte2 = dq_raw[11:4]
Byte3 = dq_raw[3:0] << 4 | Kp_raw[11:8]
Byte4 = Kp_raw[7:0]
Byte5 = Kd_raw[11:4]
Byte6 = Kd_raw[3:0] << 4 | tau_raw[11:8]
Byte7 = tau_raw[7:0]
```

反向拆解：

```text
q_raw   = Byte0 << 8 | Byte1
dq_raw  = Byte2 << 4 | Byte3 >> 4
Kp_raw  = (Byte3 & 0x0F) << 8 | Byte4
Kd_raw  = Byte5 << 4 | Byte6 >> 4
tau_raw = (Byte6 & 0x0F) << 8 | Byte7
```

## 8. 基线版本常用 MIT 帧

下表统一采用：

```text
dq=0, Kp=3.0, Kd=0.12, tau=0
位置映射范围=0~1.6 rad
```

| 上层 `gripperValue` | 目标位置 `q` | MIT 数据区 |
|---:|---:|---|
| `0.00` | `0.00 rad` | `7F FF 7F F0 18 06 27 FF` |
| `0.25` | `0.40 rad` | `84 18 7F F0 18 06 27 FF` |
| `0.50` | `0.80 rad` | `88 30 7F F0 18 06 27 FF` |
| `0.75` | `1.20 rad` | `8C 49 7F F0 18 06 27 FF` |
| `0.90` | `1.44 rad` | `8E BE 7F F0 18 06 27 FF` |
| `1.00` | `1.60 rad` | `90 61 7F F0 18 06 27 FF` |

例如 `gripperValue=0.5`：

```text
左：vcan0  001#88307FF0180627FF
右：vcan1  002#88307FF0180627FF
```

实际开合方向取决于机械安装和位置范围配置。目标位置不等于必然达到的位置；接触物体、机械限位、刚度和负载都会造成目标值与反馈值存在差异。

### 已确认帧值

以下帧来自已确认的 DM4310 数据，条件均为 `dq=0`、`tau=0`：

| `q` | `Kp` | `Kd` | 数据区 |
|---:|---:|---:|---|
| `0.0` | `1.0` | `0.10` | `7F FF 7F F0 08 05 17 FF` |
| `0.0` | `3.0` | `0.12` | `7F FF 7F F0 18 06 27 FF` |
| `0.5` | `1.0` | `0.10` | `85 1E 7F F0 08 05 17 FF` |
| `0.5` | `3.0` | `0.12` | `85 1E 7F F0 18 06 27 FF` |
| `1.0` | `1.0` | `0.10` | `8A 3C 7F F0 08 05 17 FF` |
| `1.0` | `3.0` | `0.12` | `8A 3C 7F F0 18 06 27 FF` |
| `1.5` | `1.0` | `0.10` | `8F 5B 7F F0 08 05 17 FF` |
| `1.5` | `3.0` | `0.12` | `8F 5B 7F F0 18 06 27 FF` |

## 9. 反馈帧解析

### 9.1 数据布局

```text
Byte0[7:4] = 电机状态/故障码
Byte0[3:0] = 帧内嵌电机 ID
Byte1~2    = 位置 q，16 bit
Byte3      = 速度 dq[11:4]
Byte4[7:4] = 速度 dq[3:0]
Byte4[3:0] = 力矩 tau[11:8]
Byte5      = 力矩 tau[7:0]
Byte6      = MOS 温度，摄氏度整数
Byte7      = 电机线圈/转子温度，摄氏度整数
```

拆解和换算：

```text
status = (Byte0 >> 4) & 0x0F
embedded_id = Byte0 & 0x0F
q_raw = Byte1 << 8 | Byte2
dq_raw = Byte3 << 4 | Byte4 >> 4
tau_raw = (Byte4 & 0x0F) << 8 | Byte5

q   = uint_to_float(q_raw,   -12.5, 12.5, 16)
dq  = uint_to_float(dq_raw,  -30.0, 30.0, 12)
tau = uint_to_float(tau_raw, -10.0, 10.0, 12)
```

### 9.2 ROS 2 反馈 Topic

| Topic | 数据 |
|---|---|
| `/tj/info/gripper_feedback_L` | `[position, velocity, torque, mos_temperature, motor_temperature]` |
| `/tj/info/gripper_feedback_R` | `[position, velocity, torque, mos_temperature, motor_temperature]` |
| `/tj/info/gripper_feedback_L_err` | `[status/error_code]` |
| `/tj/info/gripper_feedback_R_err` | `[status/error_code]` |

### 9.3 状态和故障码

| 高 4 位 | 含义 | 判断 |
|---:|---|---|
| `0x0` | Off | 未使能/已失能 |
| `0x1` | On | 已使能，无故障 |
| `0x8` | 超压 | 异常 |
| `0x9` | 欠压 | 异常 |
| `0xA` | 过电流 | 异常 |
| `0xB` | MOS 过温 | 异常 |
| `0xC` | 电机线圈过温 | 异常 |
| `0xD` | 通讯丢失 | 异常 |
| `0xE` | 过载 | 异常 |

`error_code=1` 表示 On，不是故障。遇到未定义值时，应保留原始帧并结合对应固件协议确认。

## 10. 未开放的扩展操作

原 Python 驱动还包含位置速度、纯速度、力位混合及 RID 参数读写。当前 ApexTool C++ 正式链路只使用 MIT 控制，且当前双 vCAN 路由不保证支持其他模式或 `0x7FF` 参数管理帧。

客户不得在生产设备上自行执行以下操作：

- 切换 `CTRL_MODE` 或使用旧固件偏移 ID。
- 写入或保存 `ESC_ID`、`MST_ID`、CAN 波特率、方向和量程。
- 未备份参数时写入 Flash。
- 把其他 DM 型号的量程或帧表用于 DM4310。

确需开发扩展模式时，应取得对应电机固件协议、完整参数备份和独立台架，并由技术支持确认通道路由和恢复方法。

## 11. 抓帧与单侧通信检查

### 11.1 查看接口

```bash
ip -details -statistics link show vcan0
ip -details -statistics link show vcan1
```

### 11.2 抓取原始帧

```bash
candump -L vcan0
candump -L vcan1
candump -L vcan0,vcan1
```

### 11.3 直接发帧

正式夹爪节点持续发送 MIT 帧。直接测试前必须停止 ApexTool，避免多个命令源同时控制：

```bash
sudo systemctl stop apex-tool.service
```

仅在完成安全检查后，按“使能 -> 单帧通信检查 -> 失能”执行单侧、小范围测试：

```bash
cansend vcan0 001#FFFFFFFFFFFFFFFC
cansend vcan0 001#88307FF0180627FF
cansend vcan0 001#FFFFFFFFFFFFFFFD
```

测试完成后恢复服务：

```bash
sudo systemctl start apex-tool.service
```

单发一帧只适合检查通信。正常刚度控制必须稳定周期发送，并处理反馈、超时和故障状态。

## 12. 常见现象

| 现象 | 优先检查 |
|---|---|
| `OSError: [Errno 19] No such device` | `vcan0/vcan1` 是否存在，接口名是否正确 |
| vCAN 有发送但夹爪不动 | Robot Node 末端桥、末端板、供电、接线和 CAN ID |
| 能动但刚度异常 | 是否使能、Kp/Kd、命令是否持续发送、反馈状态是否为 `1` |
| 左右夹爪互相干扰 | 是否共用错误接口/ID，是否存在多个发送进程或透传拥塞 |
| `error=1` | 正常已使能，不是故障 |
| 反馈一直为旧值 | 回帧 CAN ID、末端板透传和接收循环 |
| 温度持续升高 | 夹持堵转、负载、刚度和机械限位 |
| 目标与反馈不一致 | 接触负载、刚度、机械限位和量程映射 |

## 13. 安全要求

1. 发送使能或 MIT 帧前，确认夹爪范围内无人、无工具和易损物。
2. 调试从单侧、低刚度、小位置变化开始，再测试双侧。
3. 不允许 ApexTool、客户程序和手工 `cansend` 同时发送控制帧。
4. MIT 命令帧和反馈帧的 8 字节定义不同，不得混用解析方式。
5. `error=1` 表示已使能，应按状态码表判断故障。
6. 不得在未知位置发送设置零位 `FE`。
7. 不得在没有参数备份时修改电机 ID、控制模式、波特率、方向或量程。
8. `vcan` 没有物理波特率，不能根据 vCAN 配置推断末端总线速率。
9. 反馈中断时应停止增加目标位置或刚度，并先恢复通信。

## 14. 基线实现摘要

```text
左 vcan0 / ID 1
右 vcan1 / ID 2
启动发送 FC 上使能
控制持续发送 MIT 8 字节帧
基线 Kp=3.0、Kd=0.12、dq=0、tau=0
反馈包含位置、速度、力矩、MOS 温度、电机温度和状态码
reset_grippers 执行 FD -> FC 复位流程
```

以上行为和帧表适用于本文档标注的版本基线。升级 ApexTool、电机固件或更换电机型号后，应重新核对通道、ID、量程、帧布局和安全参数。
