---
title: Gento DAgger 使用手册
sidebar_position: 8
draft: true
description: Skye/Luna 模型执行、VR 人工接管、恢复模型和干预数据检查的客户操作流程。
---

# Gento DAgger 使用手册

文档版：1.0 · 更新日期：2026-11-04。

本手册适用于**已交付 DAgger 功能版的 Gento Skye/Luna**，说明模型执行时如何通过 VR 人工纠正、恢复模型，以及检查本次干预数据。普通遥操和界面操作见 [Gento 当前版操作指南](/software/apex-teleop/gento-current)。

:::note 先确认配套版本
Core、Apex Teleop 前端、Runtime、Tool、头显客户端和 VLA Host 必须采用交付清单中的配套版本。本手册不表示所有历史 Gento 安装包均支持 DAgger；缺少本文接口时，先联系支持人员确认配套包，不自行替换 SDK 或启动第二套驱动。
:::

## 1. 功能与分工

```text
客户模型 -> VLA Host -> 已选中的控制源 -> 机器人
                         |
                  人工接管时切到 VR
                         |
                  Gento Replay + 相机录制
```

| 组件 | 本轮职责 |
|---|---|
| Robot、Teleop | 机器人反馈、控制源仲裁及遥操/IK 链路 |
| VLA Host | 接收模型动作、屏蔽接管期间的模型输出、协调接管/恢复和录制 |
| Gento Replay | 录制机器人数据，协调相机录制，提供录制状态和路径 |
| 客户模型客户端 | 读取状态/图像、完成推理、生成安全目标；接管后清除旧动作队列 |
| 操作员 | 安全监护、VR 纠正、确认恢复条件和数据完整性 |

交付的 `client.py` 是接入模板；默认返回各动作字段均为 `None` 的字典，不执行真实模型推理。客户需接入自己的模型，或使用另行交付的已适配模型客户端。本功能不等于自动完成模型训练、数据重训练和 checkpoint 更新。

## 2. 安全与开始条件

1. 清空工作空间，安排能立即操作物理急停的人员。首次联调使用交付允许的低速、小范围设置。
2. 完成该机型的供电、Ready、阻抗模式及必要的初始姿态准备。姿态不正确时，不直接执行 Home。
3. Pico 和所需追踪器连接正常；先独立验证 VR 小幅遥操和末端方向，再进入模型流程。
4. 停止回放及其他动作发布程序，确保只有本轮模型和受控的 VR 接管链路参与控制。
5. 模型未开放动作输出；输入保持安全状态。不要先运行可发动作的模型，再检查系统。
6. 确认录制目录、空间、权限，以及一段短录制的机器人数据和视频均正常。

:::danger B 键不是急停
`B` 是人工接管/恢复的切换请求，不是硬实时安全按钮。耗时推理、图像读取或网络等待可能延迟请求处理；无交互终端或终端无焦点时也可能不起作用。出现碰撞、夹持或失控风险时，使用物理急停，不等待热键、HTTP 或录制响应。
:::

`Input=None` 只停止相应关节输入转发，**不等于失能、断电或停止所有末端输出**，不能替代急停。

## 3. 地址、终端与软件检查

### 3.1 在哪台电脑执行

| 终端 | 位置 | 用途 |
|---|---|---|
| 主控终端 | 天准/Orin/Thor 主控宿主机 | Docker 管理、启动 Host、HTTP 状态检查 |
| ROS 终端 | 已运行的 Teleop 容器，或配套原生 ROS 环境 | `ros2` 检查与控制源切换 |
| 模型终端 | 客户模型电脑 | 推理客户端与 `B` 热键，需保持焦点 |

| 服务 | 主控本机 | 模型电脑访问 |
|---|---|---|
| VLA Host | `http://127.0.0.1:8000` | `http://主控IP:8000` |
| Gento Replay | `http://127.0.0.1:8012` | `http://主控IP:8012` |
| Apex Backend | `http://127.0.0.1:8080` | `http://主控IP:8080` |

这里的“主控 IP”是运行 Host 的计算单元地址，不是机械臂内部运动控制器地址。端口以交付配置为准。ROS 默认命名空间为 `/tj`，它不加到 HTTP URL 上。接口仅在可信局域网使用，不将控制端口暴露到公网。

### 3.2 准备 ROS 终端

先通过 Apex 启动 Robot、Teleop，以及任务需要的 Camera、Tool，确认模块无启动错误。Docker 部署在**主控宿主机**新开终端执行：

```bash
sudo docker ps --format 'table {{.Names}}\t{{.Status}}'
sudo docker exec -it apex-teleop \
  /usr/local/bin/apex-runtime-entrypoint bash --noprofile --norc
```

容器名不是 `apex-teleop` 时，使用实际名称。进入后才执行下文标为“ROS 终端”的命令；不要在未配置 ROS 的宿主机直接执行。

**原生部署二选一：**在已安装配套 ROS 包的主控终端执行 `source /etc/apex/apex_ros_env.sh`，然后把该终端作为 ROS 终端。不混用原生与容器驱动。

### 3.3 检查服务并保持安全输入

**ROS 终端：**

```bash
ros2 node list
ros2 service type /tj/control/set_input
ros2 service type /tj/control/set_ik_input
ros2 service type /tj/control/gento_replay/record
ros2 service type /recorder/set_recording
```

前三项服务类型应为 `marvin_msgs/srv/Int`，相机录制服务应为 `marvin_msgs/srv/VideoCapture`。节点或服务重复时先排查，不重复启动 recorder。

在模型尚未发送动作、机器人静止且操作员确认安全后，保持输入关闭：

```bash
ros2 service call /tj/control/set_input marvin_msgs/srv/Int '{data: 0}'
ros2 service call /tj/control/set_ik_input marvin_msgs/srv/Int '{data: 0}'
```

检查每次服务响应的 `success`。服务缺失或失败时停止本流程，不继续开放模型控制。

## 4. 启动 Host 与录制预检

### 4.1 Gento Replay

Teleop 可能已经包含 Gento Replay。先检查上一节的录制服务和节点；只有确认未启动时，才在**另一个 ROS 终端**运行：

```bash
ros2 launch gento_replay gento_replay.launch.py apex_ros_namespace:=tj
```

保持启动终端运行。独立启动时确认其 `record_dir` 与界面存储设置一致；最终以状态中的 `record_dir` 和 `current_bag_uri` 为准，不根据文件夹名称猜路径。

### 4.2 VLA Host

Docker 部署，在**主控宿主机的新终端**执行，保持该终端运行：

```bash
sudo docker exec -it apex-teleop /usr/local/bin/apex-runtime-entrypoint \
  ros2 launch vlahost vlahost_server.launch.py \
  apex_ros_namespace:=tj host:=0.0.0.0 port:=8000
```

原生部署在已加载环境的 ROS 终端中执行同一条 `ros2 launch`，不加 `docker exec`。Skye 的 `body_joint_num` 为 `3`，Luna 为 `6`；配套 launch 按机型选择，没有正确机型环境时应由交付人员显式核对该参数。

### 4.3 只读预检

**主控宿主机终端：**

```bash
VLA_URL=http://127.0.0.1:8000
GENTO_URL=http://127.0.0.1:8012
BACKEND_URL=http://127.0.0.1:8080

curl -sS --max-time 5 "$VLA_URL/health" | python3 -m json.tool
curl -sS --max-time 5 "$VLA_URL/state" | python3 -m json.tool
curl -sS --max-time 5 "$VLA_URL/intervention/status" | python3 -m json.tool
curl -sS --max-time 5 "$GENTO_URL/api/gento_replay/status" | python3 -m json.tool
curl -sS --max-time 5 "$BACKEND_URL/api/v1/robot/status" | python3 -m json.tool
```

每个新终端都需重新设置 URL。模型电脑上检查时，将 `127.0.0.1` 改成主控 IP。

| 检查项 | 通过条件 |
|---|---|
| Host | `/health` 可响应；它不代表机器人或录制健康 |
| 反馈 | 关节/末端字段有效，源反馈时间戳持续新鲜；静止时数值不变是正常的 |
| 图像 | 浏览器能打开 `http://主控IP:8000/stream/quad.mjpg`，画面持续刷新 |
| 接管 | 初始 `active=false`、`transitioning=false`，无未处理错误 |
| 录制 | `record_service_available=true`、状态未过期、`playback_active=false` |
| 存储 | 实际录制目录可写、空间足够；短录制停止后能读取数据和视频 |

`/state.stamp` 是快照时间，不是每个传感器的采样时间；仅看到快照不断返回，不能证明每项反馈没有冻结。

![VLA Host 调试面板布局](@site/draft-assets/vla/dagger/host-panel.jpg)

图为布局参考，其中“等待数据/视频”不是通过状态。左侧查看反馈；右侧 Joint/EEF 选择只改变 action 格式，**不会自动切换机器人控制源**。首次测试只使用当前反馈对应的保持目标，不复制任意示例坐标。

## 5. 模型准备与首次开放控制

### 5.1 模型电脑准备

使用随项目交付的 `vlahost/client.py` 和 `client_requirements.txt`。以下命令在**包含这两个交付路径的客户端目录**执行，不要求客户访问内部源码仓库：

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r client_requirements.txt
```

模型集成必须满足：Joint 使用双臂各 7 个绝对关节角，单位 rad；EEF 使用基座坐标系绝对位姿 `[x,y,z,qx,qy,qz,qw]`，位置单位 m。末端控制范围以配套 Tool 为准，不假定所有末端都是 `0~1`。Joint 与 EEF 不混在同一条 action 中。

### 5.2 首次联调顺序

1. 保持安全输入和模型输出关闭，完成第 4 节预检及短录制验证。
2. 模型侧确认观测、动作格式、双臂顺序、坐标和工具映射正确；准备当前姿态保持目标，夹爪不输出测试目标。
3. 在操作员确认后运行模型客户端，先持续发送经过确认的当前姿态保持目标，再按下节选择匹配控制源。
4. 核对实际来源、反馈和目标连续性；首次仅做交付允许的小幅、低速动作。
5. 先完成一次“模型 → 接管 → 新观测推理 → 恢复”的短循环，再正式采集。

在**模型电脑终端**运行，替换主控 IP：

```bash
python3 vlahost/client.py --server-url http://6.6.7.100:8000 \
  --control-mode eef --intervention-key b --rate-hz 10
```

Joint 模型使用 `--control-mode joint`。此命令没有“安全试运行”开关；是否发动作由接入的推理程序决定。示例 `10 Hz` 不是所有模型的验收频率：EEF Host 默认以 `50 Hz` 输出，目标超过 `0.5 s` 未更新会停止该输出；Joint 按收到的动作发布，不能套用 EEF 的超时停机保证。实际模型发送频率、轨迹连续性和安全约束按交付联调结果设置。

### 5.3 选择模型控制源

仅在首次基线设置时操作。之后接管/恢复由 Host 管理，不同时手动改 mux。

| 模式 | Input | IK 来源 | 顺序 |
|---|---:|---:|---|
| 模型 EEF | `1`，Teleop/QP | `2`，VLA | 先 IK，再 Input |
| 模型 Joint | `3`，user | `0`，Idle | 先 Input，再 IK |
| 人工 VR | `1`，Teleop/QP | `1`，VR | 由 Host 切换 |

**ROS 终端，EEF 二选一：**

```bash
ros2 service call /tj/control/set_ik_input marvin_msgs/srv/Int '{data: 2}'
ros2 service call /tj/control/set_input marvin_msgs/srv/Int '{data: 1}'
```

**ROS 终端，Joint 二选一：**

```bash
ros2 service call /tj/control/set_input marvin_msgs/srv/Int '{data: 3}'
ros2 service call /tj/control/set_ik_input marvin_msgs/srv/Int '{data: 0}'
```

用 Backend `/api/v1/robot/status` 的 `current_input_mode`、`current_ik_input_source` 核对实际来源。Host 的 `control_mode` 只表示动作模式，不是 mux 已切换的证明。

## 6. 一次人工纠正循环

### 6.1 开始接管

1. 模型执行期间，操作员持续监护。在可安全接管的异常出现时，在**模型客户端终端**按一次 `B`。
2. 等待并查询实际状态，不盲目连续按键。Host 屏蔽模型动作，并行请求 VR 切源和录制。
3. 确认 `active=true`、`transitioning=false`，实际来源为 Input `1` / IK `1`。
4. **先松开，再重新按下 VR 使能键/踏键**，再进行小幅纠正。接管状态为真不代表 VR 已使能。
5. 检查真实录制状态，记录数据路径。录制失败时仍应优先保证人工控制安全，但这段数据不能当作合格样本。

本次新建分段录制的正常 Host 状态：

```json
{"active":true,"transitioning":false,"model_control_mode":"eef","recording_active":true,"recording_owned":true,"last_error":null}
```

已有整轮录制时，`recording_owned=false` 是正常情况，详见第 7 节。`recording_active` 是 Host 标记，仍须检查 Gento 状态中的 `recording`、`camera_recording`、错误字段和写入计数。

### 6.2 恢复模型

1. 将机器人带回可继续任务且安全的状态，松开 VR 使能。
2. 确认模型已清除旧 action chunk/排队目标，能根据最新图像和状态重新推理。Host 清缓存不等于客户模型也清了缓存。
3. 按第二次 `B`，Host 按进入接管时保存的 Joint/EEF 模式恢复控制源，并仅停止自己新建的录制。
4. 确认 `active=false`、`transitioning=false`，实际来源匹配第 5 节；检查 `warning`、`last_error` 和录制状态。
5. 模型使用新观测生成连续的新目标，从保持或低速跟随开始；不要续发接管前的旧动作。

### 6.3 不使用热键时

在能访问主控的 HTTP 终端设置 `VLA_URL`，模式应与真实模型一致：

```bash
# 明确开始；Joint 模型将 eef 改为 joint
curl -sS --max-time 40 -X POST "$VLA_URL/intervention" \
  -H 'Content-Type: application/json' \
  -d '{"active":true,"model_control_mode":"eef"}' | python3 -m json.tool

# 查询，不改变状态
curl -sS --max-time 5 "$VLA_URL/intervention/status" | python3 -m json.tool

# 确认已具备恢复条件后，明确结束
curl -sS --max-time 40 -X POST "$VLA_URL/intervention" \
  -H 'Content-Type: application/json' -d '{"active":false}' | python3 -m json.tool
```

热键仅在交互式 Linux 终端有焦点时可用，无需回车、大小写均可，默认去抖 `0.5 s`。无 TTY 时用 HTTP。超时是“结果未确认”，先查询状态和实际来源，再决定重试；不要用 `active:null` 盲目重试。

## 7. 分段录制与整轮录制

| 方式 | 如何开始 | 谁停止 | 数据含义 |
|---|---|---|---|
| 干预分段 | 无既有录制时，接管请求启动 | Host 退出接管时停止自己创建的录制 | 仍需确认起录边界、VR 使能和有效纠正区间 |
| 整轮录制 | 操作员在任务开始前明确启动 | 启动该录制的人员在任务结束时停止 | 同时含模型、切换过渡和人工数据，不能全部标为专家动作 |

需要失败前上下文时，可先在**主控 HTTP 终端**开启整轮录制。确认没有他人的录制且没有回放后执行：

```bash
curl -sS --max-time 40 -X POST "$GENTO_URL/api/gento_replay/record" \
  -H 'Content-Type: application/json' \
  -d '{"data":1,"name":"dagger_r001_taskA"}' | python3 -m json.tool
```

检查响应 `success` 和实际状态。已有录制不属于本次接管时，Host 不会在第二次 `B` 后停掉它。任务结束、模型停止输出、接管已退出后，由录制负责人执行：

```bash
curl -sS --max-time 40 -X POST "$GENTO_URL/api/gento_replay/record" \
  -H 'Content-Type: application/json' -d '{"data":0}' | python3 -m json.tool
```

机器人数据与相机录制是不同环节。起录和切源并行，不保证同一瞬间完成；保留失败前窗口或严格覆盖干预起点时，采用整轮录制并依据真实时间戳标注。

## 8. 数据检查与归档

停止录制后，检查真实 `current_bag_uri` 指向的目录。以下只表示逻辑结构，不承诺具体文件名：

```text
<实际 bag 目录>/
  metadata.yaml
  <机器人数据>.mcap
  video/
    <相机录制文件，格式由交付相机决定>
```

| 必查项目 | 合格判据 |
|---|---|
| 录制结束 | 自己的分段录制确已停止，文件完成写入；外部整轮录制按归属处理 |
| 数据状态 | `recording_error` 无异常，写入计数有效；检查 dropped/write error 等可用计数 |
| 相机 | 所需视角有实际可读取的视频；目录存在不代表录制成功 |
| 时间 | 数据和视频时间范围有重叠；按共同时间基准处理，不用文件修改时间替代采样时间 |
| 必需字段 | 实际反馈、实际下发目标、末端命令/反馈及任务所需状态确有消息 |
| 干预区间 | 区分请求时刻、切源成功、VR 实际使能、恢复模型等边界及过渡数据 |
| 任务记录 | 任务/轮次、模型版本、机型/工具、动作模式、路径、接管原因及是否可用 |

数据选择和标签按模型训练契约确定。可利用包内实际记录的输入源、VR 使能和消息时间戳核对区间；**本手册不保证系统自动生成独立的 intervention 标签文件或已对齐训练集**。需要此类导出时，按交付的数据处理流程另行验证。

建议保留一条归档记录：`轮次 | bag路径 | Joint/EEF | 干预起止及时间基准 | 原因 | 视频/数据结果 | 可用/作废`。缺失视频、时间不明或录制失败时标为异常，不混入已验收专家样本。后续转换见 [Data-Processing-Tool](/data-converter/README.zh-CN)。

## 9. 正常结束与异常处理

### 9.1 正常结束

1. 暂停模型所有动作输出，包括末端；没有暂停功能时停止模型程序。不要依赖断网自动接管。
2. 机器人处于安全状态后，查询 Host；仍在接管时显式结束接管，模型保持不发目标。
3. 在 ROS 终端依次设置 `set_input=0`、`set_ik_input=0`，逐项确认成功；这不是物理急停。
4. 按录制归属停录并检查文件完整性。
5. 最后停止客户端和本次启动的 Host；按现场规范停止模块/机器人。

### 9.2 故障速查

| 现象 | 安全处理与下一检查点 |
|---|---|
| B 无反应或延迟 | 不当作急停；确认焦点/TTY/推理耗时，必要时用独立 HTTP 终端查询和明确请求 |
| 请求超时 | 先查 Host 状态和实际来源，不连续切换 |
| `active=true` 但 VR 不动 | 确认实际来源；松开再按使能，检查头显和遥操范围 |
| 接管成功但录制失败 | 保证人工控制安全，检查 warning、目录及 Gento 错误；该段标异常 |
| `active=false` 但仍在录制 | 判断是否外部整轮录制或停录失败；核对归属后单独处理，重复结束请求不保证重试停录 |
| 切源失败或 `rollback failed` | 暂停模型，不继续流程；核对实际来源，保留日志并联系支持 |
| 恢复时跳变 | 停止本次试验，检查旧 chunk、最新观测、坐标/单位和首帧，不反复切换掩盖问题 |
| Host/客户端退出、断网 | 不假定自动切回安全输入或恢复录制归属；停止输出后按实际状态恢复 |

## 10. API 速查与验收清单

| 接口 | 用途与判读 |
|---|---|
| `GET /health` | Host 可响应，不代表机器人 Ready |
| `GET /state`、`WS /ws/state?rate_hz=30` | 最新缓存快照，不保证各传感器新鲜或严格同步 |
| `GET /stream/quad.mjpg` | 图像字节流；`state` 仅带图像元信息 |
| `POST /action`、`WS /ws/action?ack=true` | Joint/EEF/末端动作；`success:true` 不等于实际完成动作 |
| `GET /intervention/status` | 接管状态；此查询本身没有 `success` 字段 |
| `POST /intervention` | `active:true/false` 明确开始/结束，`model_control_mode` 与模型一致 |
| `GET /api/gento_replay/status`（8012） | 录制真实状态、路径、错误和计数 |
| `GET /api/v1/robot/status`（8080） | 核对实际输入源和机器人状态，使用 Backend 的 `ok/data` 格式 |

Host 业务失败可能仍为 HTTP `200`，须检查 `success/error/warning/suppressed`。接管中返回 `success:true,suppressed:true` 表示模型动作被屏蔽，不是已执行。正式高频接入使用经验证的客户端，不把单帧 HTTP 示例当作完整控制器。

交付联调至少逐项确认：只读状态、短录制、模型首帧保持、Joint/EEF 所选模式、VR 接管与重新使能、模型输出屏蔽、新观测恢复、既有整轮录制归属、文件和视频、正常结束以及超时/故障处理。文档或接口返回成功不能替代这些实机验收。
