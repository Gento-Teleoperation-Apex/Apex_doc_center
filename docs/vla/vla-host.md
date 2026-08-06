---
title: VLA Host 客户手册
sidebar_position: 7
---

# VLA Host 客户使用手册

`vlahost` 用于连接机器人 ROS 2 控制系统与外部 VLA 模型主机。机器人侧运行
`vlahost_server`，对外提供 HTTP/WebSocket 接口；模型侧不需要安装 ROS，只需要通过
WebSocket读取机器人状态并发送关节目标。

本文以默认 ROS namespace `tj` 和 Pro 双臂机器人为例。若现场修改了
`APEX_ROS_NAMESPACE`，请将文中的 `/tj/...` 替换为实际namespace。

## 1. 控制链路

VLA控制双臂时，必须启动Robot模块和Teleop模块，并将Teleop的命令输入源设置为
`input=3`（user）：

```text
VLA模型/策略
    │ WebSocket /ws/action
    │ jointcmd_left/right，单位rad
    ▼
vlahost_server
    │ 发布 /tj/control/user/joint_cmd_A
    │ 发布 /tj/control/user/joint_cmd_B
    ▼
joint_cmd_mux（Teleop模块，input=3=user）
    │ 仅转发当前选中的user输入
    │ 发布 /tj/control/joint_cmd_A
    │ 发布 /tj/control/joint_cmd_B
    ▼
marvin_robot_node（Robot模块）
    │ 检查命令时间戳和长度
    │ rad转换为degree
    │ 200 Hz控制线程读取最新命令
    ▼
MarvinRobot / Marvin SDK
    ▼
机器人控制器与左右机械臂
```

如果`input`不是3，`vlahost_server`仍会收到VLA action，也仍会发布
`/tj/control/user/joint_cmd_A/B`，但`joint_cmd_mux`不会把它转发到
`/tj/control/joint_cmd_A/B`，机器人不会执行VLA关节命令。

### 1.1 Teleop input定义

| input | 名称 | 输入话题 | 用途 |
|---:|---|---|---|
| 0 | idle | 无 | 停止mux输出，默认值 |
| 1 | teleop | `/tj/control/qp_controller/joint_cmd_A/B` | VR遥操/QP控制 |
| 2 | planner | `/tj/control/joint_cmd_plan_A/B` | 关节规划器 |
| 3 | user | `/tj/control/user/joint_cmd_A/B` | VLA Host或客户自定义控制器 |
| 4 | replay | `/tj/control/replay/joint_cmd_A/B` | 数据回放 |

注意：`input=3`表示“选择user命令源”。它与Robot模块的`mode=3`不是同一个参数。
Robot mode的0/1/3分别表示idle、position和impedance模式。

## 2. 启动前条件

开始控制前确认：

1. 机器人周围无人，急停和机械限位工作正常。
2. Robot模块已连接机器人控制器，并且左右臂没有故障。
3. Teleop模块已经运行；`joint_cmd_mux`属于Teleop模块。
4. VLA输出满足机器人关节位置、速度和加速度限制。
5. 模型主机能够访问机器人TCP端口8000。
6. 首次联调使用低速度限制，并让VLA第一帧目标等于当前关节位置。

`vlahost_server`只校验关节数组长度和数值是否有限，不负责完整的关节限位、速度限制、
加速度限制或碰撞检查。客户策略必须自行生成连续、安全的关节轨迹。

## 3. 启动方法

### 3.1 已部署设备

先启动Robot和Teleop模块。可以通过Apex UI启动，也可以在机器人上执行：

```bash
sudo systemctl start apex-robot.service
sudo systemctl start apex-teleop.service
sudo systemctl status apex-robot.service apex-teleop.service
```

然后启动VLA Host：

```bash
source /etc/apex/apex_ros_env.sh
ros2 launch vlahost vlahost_server.launch.py \
  host:=0.0.0.0 \
  port:=8000 \
  ros_namespace:=tj
```

如果安装环境没有`/etc/apex/apex_ros_env.sh`，使用：

```bash
source /opt/kernelmind/apex/install/setup.bash
ros2 launch vlahost vlahost_server.launch.py host:=0.0.0.0 port:=8000 ros_namespace:=tj
```

### 3.2 开发工作空间

```bash
cd /home/marvin/test_apex_ws
colcon build --packages-select vlahost
source install/setup.bash
ros2 launch vlahost vlahost_server.launch.py host:=0.0.0.0 port:=8000 ros_namespace:=tj
```

### 3.3 检查服务

在模型主机或机器人上执行：

```bash
curl http://<ROBOT_IP>:8000/health
```

预期返回：

```json
{"status":"ok"}
```

浏览器访问`http://<ROBOT_IP>:8000/`可以打开调试页面；访问
`http://<ROBOT_IP>:8000/stream/quad.mjpg`可以单独检查四路相机拼接图像。

## 4. 将Teleop输入切换到VLA

### 4.1 通过ROS 2服务切换

```bash
ros2 service call /tj/control/set_input marvin_msgs/srv/Int "{data: 3}"
```

预期响应中：

```text
success: true
message: Input set to 3
```

确认当前输入：

```bash
ros2 topic echo --once /tj/control/input_mode
```

预期：

```yaml
data: 3
```

也可以通过Apex Backend设置：

```bash
curl -X POST http://<ROBOT_IP>:8080/api/v1/control/set_input \
  -H 'Content-Type: application/json' \
  -d '{"input":3}'
```

### 4.2 输入切换时的平滑过渡

`joint_cmd_mux`默认使用3秒ramp。切换到`input=3`以后，左右臂分别在收到第一条user命令时，
从当前关节反馈平滑过渡到VLA目标。左右臂哪一侧先收到命令，哪一侧先开始自己的ramp。

安全建议：

- 切换前让VLA action stream已经准备好。
- 第一帧目标使用当前`joint_states.positions`中的对应7个关节值。
- 持续发送命令至少3秒，不要只发送一帧后等待。
- 切换期间也必须保证目标连续，不能突然改变到远离当前位置的姿态。

## 5. 模型侧client

模型主机不需要ROS。复制`vlahost/client.py`和`client_requirements.txt`后安装：

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r client_requirements.txt
python3 vlahost/client.py --server-url http://<ROBOT_IP>:8000 --rate-hz 100
```

默认使用两条长连接：

- `WS /ws/state`：接收最新机器人状态。
- `WS /ws/action`：发送VLA动作。

提供的`run_inference()`只是接入模板，默认返回的所有action字段都是`None`，因此默认client
不会让机器人运动。客户需要在该函数中调用模型，或者实现自己的WebSocket client。

### 5.1 控制频率要求

`vlahost_server`不会主动重复、插值或保持VLA action。收到一条action，就为其中存在的每个手臂
发布一条ROS关节命令。因此action发送频率就是
`/tj/control/user/joint_cmd_A/B`的发布频率。

| 环节 | 默认/配置频率 | 说明 |
|---|---:|---|
| 示例client循环 | 默认10 Hz | 仅用于接口演示，不建议直接用于连续关节控制 |
| 推荐VLA action输出 | 100～200 Hz | 200 Hz与Robot SDK控制线程一致 |
| `joint_cmd_mux`输出 | 跟随active输入 | `input=3`时跟随user命令频率 |
| `marvin_robot_node`控制线程 | 200 Hz | 每5 ms读取最新A/B命令并调用SDK |

对于推理频率低于100 Hz的模型，建议模型输出action chunk，模型侧再做带速度/加速度约束的
插值，并以100～200 Hz发送。直接以10 Hz发送离散关节位置会产生明显阶梯和遥操卡顿。

## 6. Action接口

### 6.1 WebSocket（正式控制推荐）

连接地址：

```text
ws://<ROBOT_IP>:8000/ws/action
```

消息格式：

```json
{
  "jointcmd_left":  [0.0, -0.5, 0.2, -1.2, 0.0, 0.6, 0.0],
  "jointcmd_right": [0.0, -0.5, -0.2, -1.2, 0.0, -0.6, 0.0],
  "gripper_left": 0.0,
  "gripper_right": 0.0
}
```

字段说明：

| 字段 | 类型 | 单位/长度 | ROS输出 |
|---|---|---|---|
| `jointcmd_left` | `float[7]` | rad，左臂L1～L7 | `/tj/control/user/joint_cmd_A` |
| `jointcmd_right` | `float[7]` | rad，右臂R1～R7 | `/tj/control/user/joint_cmd_B` |
| `joint_cmd_left` | `float[7]` | `jointcmd_left`的兼容别名 | 同上 |
| `joint_cmd_right` | `float[7]` | `jointcmd_right`的兼容别名 | 同上 |
| `gripper_left` | `float` | 由夹爪驱动定义，原值透传 | `/control/gripperValueL` |
| `gripper_right` | `float` | 由夹爪驱动定义，原值透传 | `/control/gripperValueR` |
| `eef_left/right` | - | 预留 | 当前禁用，传入会返回错误 |

每个字段都可以省略或设置为`null`。例如只控制左臂时，可以只发送`jointcmd_left`；此时不会
发布右臂命令。

默认`/ws/action`不为每帧返回ack，以减少高频控制开销。调试时可连接：

```text
ws://<ROBOT_IP>:8000/ws/action?ack=true
```

每帧将返回：

```json
{"success":true}
```

### 6.2 HTTP（单帧调试）

HTTP适合验证接口，不建议用于100～200 Hz正式控制：

```bash
curl -X POST http://<ROBOT_IP>:8000/action \
  -H 'Content-Type: application/json' \
  -d '{
    "jointcmd_left":[0.0,-0.5,0.2,-1.2,0.0,0.6,0.0],
    "jointcmd_right":[0.0,-0.5,-0.2,-1.2,0.0,-0.6,0.0]
  }'
```

## 7. State接口

### 7.1 WebSocket

```text
ws://<ROBOT_IP>:8000/ws/state?rate_hz=100
```

`rate_hz`控制server向该WebSocket连接发送最新snapshot的频率。它不会改变ROS上游话题频率，
也不会保证转发每一条ROS消息；server始终发送各话题的最新值。端点默认30 Hz，提供的client
默认请求10 Hz。

示例state：

```json
{
  "stamp": 1234567890000000000,
  "joint_states": {
    "positions": [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
                  0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0],
    "velocities": [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
                   0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0],
    "efforts": [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
                0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0],
    "est_joint_force": [0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
                        0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0]
  },
  "eef_left": {
    "position": {"x":0.0,"y":0.0,"z":0.0},
    "orientation": {"x":0.0,"y":0.0,"z":0.0,"w":1.0}
  },
  "eef_right": {
    "position": {"x":0.0,"y":0.0,"z":0.0},
    "orientation": {"x":0.0,"y":0.0,"z":0.0,"w":1.0}
  },
  "gripper_left": {
    "position":0.0,"velocity":0.0,"torque":0.0,
    "temperature_mos":0.0,"temperature_motor":0.0,"error":0,"raw":[]
  },
  "gripper_right": {
    "position":0.0,"velocity":0.0,"torque":0.0,
    "temperature_mos":0.0,"temperature_motor":0.0,"error":0,"raw":[]
  },
  "quad_image": {
    "format":"mjpeg","stream_url":"/stream/quad.mjpg",
    "width":640,"height":360,"source_fps":30.0,"stream_fps":30.0,"seq":42
  }
}
```

关节顺序固定为：

```text
positions[0:7]  = 左臂 L1,L2,L3,L4,L5,L6,L7
positions[7:14] = 右臂 R1,R2,R3,R4,R5,R6,R7
```

关节位置单位为rad，速度为rad/s；`efforts`和`est_joint_force`当前使用同一组SDK估算关节
力矩数据。EEF位置单位为m，姿态使用四元数`x,y,z,w`。

### 7.2 HTTP snapshot与MJPEG

```bash
curl http://<ROBOT_IP>:8000/state
```

图像数据不会放入state JSON。`quad_image.stream_url`指向独立MJPEG流：

```text
http://<ROBOT_IP>:8000/stream/quad.mjpg
```

## 8. ROS话题与频率

以下为默认namespace `tj`下的实际接口。标称频率来自当前配置；普通Linux和ROS executor下的
瞬时频率会随CPU负载变化。

### 8.1 VLA Host订阅

| 话题 | 类型 | 标称频率 | 作用 |
|---|---|---:|---|
| `/tj/info/joint_feedback` | `marvin_msgs/msg/Jointfeedback` | 200 Hz | 14个手臂关节的位置、速度和力矩反馈 |
| `/tj/info/eef_left` | `geometry_msgs/msg/PoseStamped` | Teleop内部标称1000 Hz | 左末端基于当前关节反馈计算的FK位姿 |
| `/tj/info/eef_right` | `geometry_msgs/msg/PoseStamped` | Teleop内部标称1000 Hz | 右末端基于当前关节反馈计算的FK位姿 |
| `/quad_tile/compressed` | `sensor_msgs/msg/CompressedImage` | 相机配置决定，通常30 Hz | 四路GMSL相机2×2拼接压缩图 |
| `/info/gripper_feedback_L` | `std_msgs/msg/Float32MultiArray` | Tool模块决定 | 左夹爪位置、速度、力矩和温度原始反馈 |
| `/info/gripper_feedback_R` | `std_msgs/msg/Float32MultiArray` | Tool模块决定 | 右夹爪反馈 |
| `/info/gripper_feedback_L_err` | `std_msgs/msg/Int32MultiArray` | Tool模块决定 | 左夹爪错误码 |
| `/info/gripper_feedback_R_err` | `std_msgs/msg/Int32MultiArray` | Tool模块决定 | 右夹爪错误码 |

EEF上游标称频率高于WebSocket state频率。VLA Host只保存最新EEF，不会把1000 Hz历史逐条发送给
模型。模型实际接收频率由`/ws/state?rate_hz=...`决定。

### 8.2 VLA Host发布及下游链路

| 话题/服务 | 类型 | 频率/QoS | 作用 |
|---|---|---|---|
| `/tj/control/user/joint_cmd_A` | `marvin_msgs/msg/JointcmdArm` | 跟随左臂action；best-effort | VLA左臂7关节目标，rad |
| `/tj/control/user/joint_cmd_B` | `marvin_msgs/msg/JointcmdArm` | 跟随右臂action；best-effort | VLA右臂7关节目标，rad |
| `/tj/control/set_input` | `marvin_msgs/srv/Int` | 按需调用 | 设置mux输入，VLA必须设置为3 |
| `/tj/control/input_mode` | `std_msgs/msg/Int32` | 启动及切换时发布；transient-local | 当前mux输入，3表示user |
| `/tj/control/joint_cmd_A` | `marvin_msgs/msg/JointcmdArm` | 跟随被选中的输入；best-effort | mux输出给Robot模块的左臂命令 |
| `/tj/control/joint_cmd_B` | `marvin_msgs/msg/JointcmdArm` | 跟随被选中的输入；best-effort | mux输出给Robot模块的右臂命令 |
| `/control/gripperValueL` | `std_msgs/msg/Float32` | 跟随action字段 | 左夹爪命令，global话题 |
| `/control/gripperValueR` | `std_msgs/msg/Float32` | 跟随action字段 | 右夹爪命令，global话题 |

VLA、mux和Robot关节命令链路使用best-effort语义。Robot模块对最终命令使用`KeepLast(1)`，
只关心最新目标，不会补发旧目标。`marvin_robot_node`还会丢弃ROS时间戳超过100 ms的命令。

## 9. Robot模块如何执行命令

Robot模块的当前默认配置为：

```yaml
control_rate: 200
ff_mode: true
ff_interval: 5
```

收到`/tj/control/joint_cmd_A/B`后：

1. 检查`header.stamp`距离当前ROS时间不超过100 ms。
2. 检查每侧恰好包含7个关节位置。
3. 将rad转换为degree，写入该侧最新命令缓存。
4. 200 Hz SDK线程在机器人ready且Robot mode为1或3时读取新命令。
5. 左右都有新命令时调用`PosCmd(A,B)`；只有一侧有新命令时调用`PosCmdA`或`PosCmdB`。
6. 没有新命令或机器人不在可控状态时调用`emptyCmd()`。

因此，Robot模块已启动并不等于机械臂一定执行VLA命令。还需要：

- Robot连接正常；
- Robot已经ready；
- Robot mode为position(1)或impedance(3)；
- Teleop mux input为user(3)；
- VLA持续发送新鲜、有效的命令。

## 10. 推荐联调步骤

### 10.1 只检查反馈，不控制机器人

保持`input=0`：

```bash
ros2 service call /tj/control/set_input marvin_msgs/srv/Int "{data: 0}"
curl http://<ROBOT_IP>:8000/state
```

确认joint、EEF、gripper和camera字段不为`null`。某个字段为`null`表示VLA Host尚未收到对应ROS话题。

### 10.2 检查VLA action是否进入user话题

机器人保持idle，发送一帧测试action，然后执行：

```bash
ros2 topic echo --once /tj/control/user/joint_cmd_A
ros2 topic echo --once /tj/control/user/joint_cmd_B
```

### 10.3 检查mux转发

切换`input=3`后：

```bash
ros2 topic hz /tj/control/user/joint_cmd_A
ros2 topic hz /tj/control/joint_cmd_A
```

VLA同时控制右臂时，对B话题执行同样检查。正常情况下user输入和mux输出平均频率接近。

### 10.4 低速实机测试

1. 将VLA第一帧设置为当前关节反馈。
2. 开始100～200 Hz连续action stream。
3. 设置`input=3`。
4. 由合格操作人员将Robot设置为允许控制的模式并ready。
5. 先做很小幅度、低速度单关节运动。
6. 检查左右臂方向、关节顺序、限位和急停。

## 11. 停止控制

停止模型或VLA Host之前，先把mux切到idle：

```bash
ros2 service call /tj/control/set_input marvin_msgs/srv/Int "{data: 0}"
```

然后停止VLA client和server。需要恢复VR遥操时设置：

```bash
ros2 service call /tj/control/set_input marvin_msgs/srv/Int "{data: 1}"
```

WebSocket断开不会自动把`input_mode`改回0。断开后VLA Host不再发布新命令，Robot控制线程会进入
无新命令路径，但仍建议客户侧实现连接watchdog并主动切回idle。

## 12. 常用诊断命令

```bash
# 节点和服务
ros2 node list | grep -E 'vlahost|joint_mux|marvin_robot'
ros2 service list | grep /tj/control/set_input

# 当前mux输入
ros2 topic echo --once /tj/control/input_mode

# 上游VLA命令和mux输出频率
ros2 topic hz /tj/control/user/joint_cmd_A
ros2 topic hz /tj/control/joint_cmd_A

# 查看话题端点和QoS
ros2 topic info -v /tj/control/user/joint_cmd_A
ros2 topic info -v /tj/control/joint_cmd_A

# Robot反馈与EEF频率
ros2 topic hz /tj/info/joint_feedback
ros2 topic hz /tj/info/eef_left

# VLA Host网络接口
curl http://<ROBOT_IP>:8000/health
curl http://<ROBOT_IP>:8000/state
```

常见问题：

| 现象 | 检查 |
|---|---|
| `/health`无法访问 | server是否运行、IP/端口、防火墙和路由 |
| state字段为`null` | 对应ROS话题是否存在，namespace是否一致 |
| user话题有数据但final话题没有 | `input_mode`是否为3，Teleop/joint_cmd_mux是否运行 |
| final话题有数据但机器人不动 | Robot连接、ready、Robot mode、命令时间戳及故障状态 |
| 命令频率约10 Hz且运动阶梯明显 | client默认10 Hz；增加输出频率或对action chunk插值 |
| 只有一侧运动 | action是否提供另一侧字段，B话题是否有数据 |
| 切换后立即运动较大 | 第一帧与当前反馈差异过大，或未持续发送3秒ramp命令 |

## 13. Server参数

| 参数 | 默认值 | 说明 |
|---|---:|---|
| `host` | `0.0.0.0` | HTTP/WebSocket监听地址 |
| `port` | `8000` | HTTP/WebSocket端口 |
| `ros_namespace` | `tj` | Robot/Teleop核心话题namespace |
| `image_max_width` | `640` | 重编码图像最大宽度 |
| `image_max_height` | `360` | 重编码图像最大高度 |
| `image_jpeg_quality` | `55` | JPEG质量，1～95 |
| `image_stream_fps` | `60.0` | MJPEG目标上限，不能超过相机源帧率 |
| `image_passthrough` | `false` | 直接转发上游JPEG，跳过解码和重编码 |

如上游`/quad_tile/compressed`已经是合适尺寸的JPEG，可将`image_passthrough`设为`true`，
以降低CPU和延迟。当前标准launch只对外声明`host`、`port`和`ros_namespace`；调整图像ROS参数时，
请在客户部署的launch中覆盖`vlahost_server`的parameters，或修改
`vlahost_server.launch.py`里的参数字典后重新构建。

## 14. 网络与安全限制

- 当前接口没有用户认证和TLS。不要把端口8000暴露到公网或不可信网络。
- 建议使用隔离局域网、防火墙白名单，必要时在反向代理层增加TLS和认证。
- `/ws/action`是直接运动命令入口；任何能访问该端口的客户端都可能发送动作。
- VLA Host不提供碰撞检查，也不会替代机器人急停、安全PLC或现场操作规范。
- 客户client应实现连接超时、状态超时、模型异常、非有限数值、关节限位和速度/加速度watchdog。
