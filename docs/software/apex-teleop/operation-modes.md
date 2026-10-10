---
title: 遥操模式与输入源
sidebar_position: 4
---

# 遥操模式与输入源

本页说明 Input Mode、IK 输入源和遥操动作范围之间的关系，并给出全身遥操、双臂遥操和带底盘遥操的标准操作顺序。不同交付版本显示的控件可能略有差异；界面没有对应选项时，先确认目标设备是否提供本文列出的 Service。

## 1. 操作前提

切换任何输入源前，应先完成以下操作：

1. 清空机器人工作空间并保持急停可触及。
2. 在 Apex 中启动 **Robot** 和 **Teleop**，确认机器人已经 Ready。
3. 首次开箱时，先用拖动模式把机械臂移到标准零位，再进入 **Impedance Mode** 并执行 **Home**。
4. 松开头显左右手柄的遥操使能键，再切换遥操动作范围。

终端命令执行前加载环境：

```bash
source /etc/apex/apex_ros_env.sh
```

## 2. Input Mode

Input Mode 决定最终采用哪一路关节命令。仅发布 Topic、但没有选择对应 Input Mode 时，机器人不会执行该路命令。

| 界面选项 | 数值 | 用途 |
|---|---:|---|
| **None** | `0` | 不转发外部关节命令；切换来源、结束测试或排查时使用 |
| **Teleop** | `1` | 使用 Teleop/QP 输出；头显遥操和 VLA 末端位姿控制均使用此项 |
| **Custom** | `3` | 使用客户程序发布的关节目标，不用于 VLA 末端位姿控制 |

`Planner=2` 和 `Replay=4` 由规划、Home 或回放流程使用，当前上位机通常不提供普通手动按钮。

可通过 Service 切换，并通过状态 Topic 确认实际结果：

```bash
# None
ros2 service call /tj/control/set_input marvin_msgs/srv/Int "{data: 0}"

# Teleop / QP
ros2 service call /tj/control/set_input marvin_msgs/srv/Int "{data: 1}"

# Custom / User joint command
ros2 service call /tj/control/set_input marvin_msgs/srv/Int "{data: 3}"

ros2 topic echo /tj/control/input_mode --once
```

:::warning None 不是急停
`None` 只停止转发外部运动输入，不会关闭 Robot 服务，也不能替代物理急停。
:::

## 3. IK 输入源

IK 输入源决定 Teleop/QP 使用哪一路末端位姿请求。`/tj/info/ik_request_mux/active_source` 是只读状态 Topic，不能通过向该 Topic 发布消息来切换来源。

当前 Marvin Pro 通过 `/tj/control/set_ik_input` Service 切换：

| 数值 | IK 来源 | 用途 |
|---:|---|---|
| `0` | Idle | 不转发 IK 请求 |
| `1` | VR | 头显末端位姿 |
| `2` | VLA | VLA 或客户末端位姿请求 |
| `3` | Replay | IKRequest 数据回放，通常由 Playback 自动切换和恢复 |

```bash
# 查看设备是否支持该接口
ros2 service type /tj/control/set_ik_input

# 切换 IK 来源，例如 VR
ros2 service call /tj/control/set_ik_input marvin_msgs/srv/Int "{data: 1}"

# 核对实际生效来源
ros2 topic echo /tj/info/ik_request_mux/active_source --once
```

来源切换必须遵循以下顺序，以免短暂转发旧的 IK 输出：

| 场景 | 操作顺序 |
|---|---|
| 头显遥操 | 先 `set_ik_input=1`，再 `set_input=1` |
| VLA/客户末端位姿 | 先 `set_ik_input=2`，再 `set_input=1` |
| 客户关节目标 | 先 `set_input=3`，再 `set_ik_input=0` |
| 停止外部控制 | 先 `set_input=0`，再 `set_ik_input=0` |

:::note 产品差异
`set_ik_input` 是当前 Marvin Pro 对外接口。Skye/Luna 或历史交付版本若查询不到该 Service，应使用配套上位机和交付流程，不要自行调用内部 mux 接口。
:::

## 4. 遥操动作范围

支持该功能的 Skye/Luna 版本可选择遥操动作范围：

| 模式 | 数值 | 跟随范围 |
|---|---:|---|
| `full_body` | `0` | 双臂、头部和身体 |
| `arms_only` | `1` | 仅双臂，锁定身体和头部 |
| `arms_head` | `2` | 双臂和头部，锁定身体 |

```bash
# 全身遥操
ros2 service call /tj/control/set_teleop_motion_mode \
  marvin_msgs/srv/Int "{data: 0}"

# 仅双臂遥操
ros2 service call /tj/control/set_teleop_motion_mode \
  marvin_msgs/srv/Int "{data: 1}"

# 双臂加头部
ros2 service call /tj/control/set_teleop_motion_mode \
  marvin_msgs/srv/Int "{data: 2}"

ros2 topic echo /tj/info/teleop_motion_mode --once
```

只有左右手柄的遥操使能键都松开时才允许切换。任一使能键按下时，请求会被拒绝且原模式保持不变。Marvin Pro 为双臂产品，按双臂流程使用，不需要选择 Gento 的全身动作范围。

## 5. 三种遥操流程

### 5.1 Skye/Luna 全身遥操

1. 启动 Robot、Teleop 和头显网络模块，完成 Ready、Impedance Mode 和 Home。
2. 松开左右手柄使能键，将遥操动作范围切换为 `full_body=0`。
3. 不使用底盘时确认底盘模式为 `no_base=0`。
4. 在配套 Apex 界面中将 Input Mode 切换为 **Teleop**。不要在 Skye/Luna 上照抄 Marvin Pro 的 `set_ik_input=1` 命令；两条产品线的原生 IK 来源编号不同。
5. 连接 Pico、腰部和腿部追踪组件，确认 VR 状态正常。
6. 先测试小幅双臂动作，再依次检查头部、躯干、升降或腿部映射。

### 5.2 双臂遥操

Marvin Pro 直接按本流程使用；Skye/Luna 需要限制为双臂时，先选择 `arms_only=1`。

1. 启动 Robot、Teleop，完成 Ready、Impedance Mode 和 Home。
2. Skye/Luna 松开使能键并切换为 `arms_only=1`；Marvin Pro 跳过此步。
3. 确认底盘模式为 `no_base=0`。
4. Marvin Pro 先切换 IK 来源为 `VR=1`，再切换 Input Mode 为 `Teleop=1`；Skye/Luna 直接通过配套界面选择 **Teleop**，不要调用 Pro 的 `set_ik_input`。
5. 连接头显，分别进行左右臂小幅动作，确认方向和使能逻辑正确后再扩大范围。

### 5.3 带底盘遥操

该流程仅适用于已交付并配置底盘遥操模块的设备。底盘模式与上半身动作范围是两个独立设置：

| 底盘模式 | 数值 | 说明 |
|---|---:|---|
| `no_base` | `0` | 不控制底盘 |
| `joystick` | `1` | 使用手柄摇杆控制底盘 |
| `whole_body` | `2` | 底盘参与全身遥操映射 |

1. 确认底盘周围无人员和障碍物，机器人保持静止。
2. 先选择上半身动作范围，例如 `full_body` 或 `arms_only`。
3. 再选择底盘模式：摇杆驾驶选 `1`，全身联动选 `2`。
4. 确认 `/info/base_teleop/active_mode` 返回预期数值。
5. 按产品对应的头显遥操流程选择输入源：Marvin Pro 先选 VR IK、再选 Teleop；Skye/Luna 使用配套界面选择 Teleop。从低速、小范围开始测试。
6. 结束时先将底盘模式切回 `0`，再将 Input Mode 和 IK 来源切回 `0`。

```bash
# 选择摇杆底盘遥操
ros2 service call /control/base_teleop/set_mode \
  marvin_msgs/srv/Int "{data: 1}"

# 选择全身底盘联动
ros2 service call /control/base_teleop/set_mode \
  marvin_msgs/srv/Int "{data: 2}"

# 停止底盘遥操
ros2 service call /control/base_teleop/set_mode \
  marvin_msgs/srv/Int "{data: 0}"

ros2 topic echo /info/base_teleop/active_mode --once
```

## 6. 快速排查

| 现象 | 优先检查 |
|---|---|
| 头显已连接但机器人不动 | Robot Ready、Impedance Mode、Home、Input Mode=`Teleop`；Marvin Pro 还需确认 IK=`VR` |
| 客户关节 Topic 有数据但机器人不动 | Input Mode 是否为 `Custom`，消息时间戳和关节数组是否有效 |
| VLA 末端 Topic 有数据但机器人不动 | 不要选择 Custom；应为 IK=`VLA`、Input Mode=`Teleop` |
| 无法切换全身/双臂模式 | 左右手柄使能键是否完全松开，Service 是否存在 |
| 底盘不动 | 是否安装底盘模块、active mode 是否为 `1/2`、底盘急停与驱动状态 |
| 页面选项与本文不同 | 核对上位机、Teleop 和控制端是否为同一交付批次 |

完整 Topic 和 Service 定义见 [Marvin Pro 客户二次开发接口](./customer-interfaces) 与 [Gento（Skye/Luna）ROS 2 接口](./gento-interfaces)。
