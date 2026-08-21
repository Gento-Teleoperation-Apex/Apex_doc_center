---
title: Topic 白名单配置与排查
sidebar_position: 2
---

# Apex Topic 白名单配置与排查说明

更新日期：2026-08-20
适用范围：Marvin Pro、Gento Skye、Gento Luna
适用对象：客户开发人员、测试人员、技术支持工程师

## 1. 文档目的

Apex 中不止有一套 Topic 白名单。不同白名单分别控制：

- 哪些 Topic 可以写入客户数据包。
- 哪些 Topic 可以从数据包中加载和回放。
- 哪些 Topic 可以通过 WebSocket 送到前端。
- 哪些 Topic 可以写入滚动诊断日志。

这些白名单互相独立。某个 Topic 出现在 `ros2 topic list` 中，不代表它一定会被录制、回放、发送到前端或写入诊断包。

本文已按 2026-08-20 当前版本的 `/tj` 接口规则更新。不同发布版本可能已经修改实现，现场必须以目标机安装产物和运行参数为准。完整接口速查参见 [Marvin Pro ROS Topic 列表](./ros-topic-list)。

:::warning 使用边界

- 查询 Topic、参数和运行状态的命令可直接用于只读排查。
- 修改白名单、安装目录文件或 systemd 服务前，应先确认设备版本并备份原文件。
- 需要修改 Python 硬编码白名单的版本，应联系 Gento Teleoperation Apex 技术支持确认，不建议客户直接修改安装产物。
- 回放控制 Topic 或重启服务可能中断控制并引起机器人动作，必须在机器人停止、工作空间清空且急停可触及时进行。

:::

## 2. 核心概念

### 2.1 白名单不是 Topic 创建器

把 Topic 名加入白名单只表示“允许处理”，不会创建发布者，也不会自动产生数据。一个 Topic 最终被处理，通常需要同时满足：

1. Topic 名与白名单完全一致，包括大小写、前导 `/` 和命名空间。
2. 当前终端、节点和发布者使用相同的 ROS 环境与 `ROS_DOMAIN_ID`。
3. Topic 已存在，并且录制或转发期间持续发布消息。
4. 消息类型可以被当前节点导入。
5. 发布者和订阅者的 QoS 兼容。
6. 对录制功能而言，开始录制时的选择列表也包含该 Topic。
7. 存储路径可写，录制节点和 rosbag 写入器没有异常。

### 2.2 白名单与选择列表的区别

```text
白名单：系统允许处理的最大范围
选择列表：本次任务从白名单中实际选择的子集
```

例如录制白名单允许 A、B、C，但开始录制时只选择 A、B，则本次数据包不会包含 C。选择列表不能绕过白名单。

### 2.3 Topic 名必须精确匹配

以下名称不是同一个 Topic：

```text
/joint_states
/tj/joint_states
joint_states
/Joint_States
```

目标机启用了 `APEX_ROS_NAMESPACE=tj` 时，部分相对 Topic 会解析为 `/tj/...`。当前源码中还有若干使用绝对名称或硬编码集合的模块，因此修改前必须先看目标机实际名称。

```bash
source /etc/apex/apex_ros_env.sh
echo "ROS_DOMAIN_ID=${ROS_DOMAIN_ID:-未设置}"
echo "APEX_ROS_NAMESPACE=${APEX_ROS_NAMESPACE:-未设置}"
ros2 topic list -t | sort
```

## 3. 四类白名单总览

| 白名单 | 作用 | 典型节点 | 当前实现方式 | 常见归属服务 |
| --- | --- | --- | --- | --- |
| 数据录制白名单 | 限制写入客户数据包的 Topic | `data_bag_recorder` | 当前检查源码为 Python 硬编码 | `apex-teleop.service` |
| 回放白名单 | 限制从 bag 加载并回放的 Topic | `playback_node` | ROS 参数 `topic_whitelist` | `apex-teleop.service` |
| WebSocket 白名单 | 限制转发到 Web 前端的 ROS Topic | `topic_websocket_server` | ROS 参数，默认值来自 Python | 通常为 Backend/WebSocket 模块 |
| 滚动日志白名单 | 限制自动写入黑匣子诊断 bag 的 Topic | `all_topic_log_recorder` | 当前检查源码为 Python 硬编码 | 通常随 Robot 模块启动 |

> 服务归属会随版本变化。修改前使用 `systemctl cat`、节点列表和进程命令确认，不要只按表格猜测。

## 4. 数据录制白名单

### 4.1 作用

数据录制白名单决定前端“可选录制 Topic”以及录制节点允许写入 MCAP 的最大集合。

典型配置文件：

```text
/opt/kernelmind/apex/install/recording_playback_nodes_py/share/recording_playback_nodes_py/config/recording_playback.yaml
```

配置文件中存在以下字段：

```yaml
data_bag_recorder:
  ros__parameters:
    allowed_topics:
      - "/tj/joint_states"
      - "/tj/info/gripper_feedback_L"
      - "/tj/info/gripper_feedback_R"
      - "/tj/info/eef_left"
      - "/tj/info/eef_right"
      - "/tj/control/joint_cmd_A"
      - "/tj/control/joint_cmd_B"
      - "/hand_left/joint_commands"
      - "/hand_left/joint_states"
      - "/hand_right/joint_commands"
      - "/hand_right/joint_states"
```

### 4.2 当前版本的重要限制

在本次检查的 Apex Deploy 源码中，`bag_recorder_data.py` 使用 Python 常量 `ALLOWED_TOPICS` 判断 Topic，且只声明了存储路径参数，没有声明或读取 YAML 中的 `allowed_topics`。

因此，对这类版本：

```text
只修改 recording_playback.yaml 中的 allowed_topics，不会让新 Topic 真正通过录制白名单。
```

必须先判断目标机属于哪种实现：

```bash
source /etc/apex/apex_ros_env.sh

NODE=$(ros2 node list | grep '/data_bag_recorder$' | head -n 1)
echo "Recorder node: ${NODE:-未找到}"

if [ -n "$NODE" ]; then
    ros2 param list "$NODE" | sort
    ros2 param dump "$NODE"
fi
```

结果判断：

- 能看到 `allowed_topics`：该版本可能已支持 YAML/ROS 参数，继续核对参数值和实际效果。
- 看不到 `allowed_topics`：该版本大概率仍使用代码硬编码，不能只改 YAML。

查找目标机实际安装代码：

```bash
find /opt/kernelmind/apex/install -type f -name 'bag_recorder_data.py' -print
```

不同版本的包名可能是：

```text
recording_playback_nodes_py
bag_recorder_nodes_py
```

### 4.3 查看录制节点实际允许的 Topic

优先通过产品提供的录制接口查询，而不是只看 YAML：

```bash
source /etc/apex/apex_ros_env.sh
ros2 service list -t | grep '/tj/recorder/control'
```

若服务类型为 `marvin_msgs/srv/JsonCommand`，可直接查询：

```bash
source /etc/apex/apex_ros_env.sh

SERVICE=$(ros2 service list | grep '/tj/recorder/control$' | head -n 1)
echo "Recorder service: ${SERVICE:-未找到}"

if [ -n "$SERVICE" ]; then
    ros2 service call "$SERVICE" marvin_msgs/srv/JsonCommand \
      '{command_json: "{\"action\":\"get_topics\"}"}'
fi
```

返回列表是“当前可见、类型可识别并且通过白名单”的 Topic，不是系统全部 Topic。

### 4.4 开始录制时的选择列表

当前录制服务支持在 `start` 命令中传入 `topics`。传入列表会再次与白名单取交集，未在白名单中的项会被忽略。

前端正常时，优先通过前端选择并开始录制。只有内部调试时才直接调用 ROS Service。

例如只录制关节和左右夹爪反馈：

```bash
source /etc/apex/apex_ros_env.sh

SERVICE=$(ros2 service list | grep '/tj/recorder/control$' | head -n 1)
ros2 service call "$SERVICE" marvin_msgs/srv/JsonCommand \
  '{command_json: "{\"action\":\"start\",\"topics\":[\"/tj/joint_states\",\"/tj/info/gripper_feedback_L\",\"/tj/info/gripper_feedback_R\"]}"}'
```

停止录制：

```bash
source /etc/apex/apex_ros_env.sh

SERVICE=$(ros2 service list | grep '/tj/recorder/control$' | head -n 1)
ros2 service call "$SERVICE" marvin_msgs/srv/JsonCommand \
  '{command_json: "{\"action\":\"stop\"}"}'
```

### 4.5 推荐修改方式

正式版本推荐由研发将录制白名单改为真正的 ROS 参数：

```text
声明 allowed_topics 参数
-> 读取参数为集合
-> 所有白名单判断使用该集合
-> 在 recording_playback.yaml 维护具体列表
```

这样可以避免直接修改 `site-packages` 中的 Python 文件。

如经 Gento Teleoperation Apex 技术支持确认，现场必须临时修改硬编码版本：

1. 记录安装包版本。
2. 备份目标 Python 文件。
3. 只新增已确认名称的 Topic。
4. 重启录制节点所属服务。
5. 查询 `get_topics` 并做短时录包验证。
6. 将修改纳入后续正式安装包；重装软件会覆盖现场补丁。

:::danger 不要直接试改

不要把修改 `site-packages` 中 Python 文件作为常规配置方式。未经确认的现场修改可能导致录制节点无法启动，并会在软件重装或升级后丢失。

:::

## 5. 回放白名单

### 5.1 作用

回放白名单决定回放节点从 bag 中加载哪些 Topic。bag 中存在某个 Topic，不代表回放节点一定会加载它。

典型配置：

```yaml
playback_node:
  ros__parameters:
    topic_whitelist:
      - "/tj/joint_states"
      - "/tj/info/gripper_feedback_L"
      - "/tj/info/gripper_feedback_R"
      - "/hand_left/joint_commands"
      - "/hand_right/joint_commands"
```

当前检查源码会声明并读取 `topic_whitelist` 参数，因此这部分 YAML 在 launch 正确加载配置文件时可以生效。

### 5.2 查看运行值

```bash
source /etc/apex/apex_ros_env.sh

NODE=$(ros2 node list | grep -E '/(bag_)?playback_node$' | head -n 1)
echo "Playback node: ${NODE:-未找到}"

if [ -n "$NODE" ]; then
    ros2 param get "$NODE" topic_whitelist
fi
```

### 5.3 注意事项

- 空白名单在当前源码中表示允许加载全部 Topic，不建议客户现场随意设为空。
- 修改白名单后，已加载的 bag 需要重新加载才能应用新列表。
- 回放白名单只决定加载和发布范围，不负责把机械臂控制源切换到 Replay。
- 命令 Topic 回放可能驱动实体机器人，验证时必须确认控制源、Ready 状态和现场安全。

## 6. WebSocket 前端白名单

### 6.1 作用

`topic_websocket_server` 将 ROS 消息序列化为 JSON，再发送给 Web 前端。WebSocket 白名单决定服务器会订阅和转发哪些 ROS Topic。

当前检查源码默认开放：

```text
/tj/control/input_mode
/tj/info/arm_state
/tj/info/robot_state
/tj/info/vr_connected
/tj/joint_states
```

`/tj/info/robot_info` 使用独立订阅和独立消息路径，不完全依赖主白名单。

默认转发频率上限为约 `30 Hz`。因此：

```text
ROS Topic 为 200 Hz，不代表 Web 前端也会收到 200 Hz。
```

### 6.2 查看运行参数

```bash
source /etc/apex/apex_ros_env.sh

NODE=$(ros2 node list | grep '/topic_websocket_server$' | head -n 1)
echo "WebSocket node: ${NODE:-未找到}"

if [ -n "$NODE" ]; then
    ros2 param get "$NODE" topic_whitelist
    ros2 param get "$NODE" default_topic_fps
    ros2 param get "$NODE" path
fi
```

### 6.3 典型现象

| 现象 | 优先判断 |
| --- | --- |
| `ros2 topic echo` 有数据，前端没有 | WebSocket 白名单、路径或客户端订阅问题 |
| 前端数据频率明显低于 ROS | `default_topic_fps` 或单 Topic 限频 |
| 日志出现 `Whitelist topic not discovered yet` | Topic 名不一致、节点未启动、Domain 或命名空间不一致 |
| WebSocket 能连接但只有机器人信息 | 主白名单 Topic 未发现或没有消息 |

新增高频、体积大的 Topic 前，应评估 JSON 序列化、CPU、网络和浏览器负载。图像和点云不应因为“前端看不到”就直接加入通用 WebSocket 白名单。

## 7. 滚动诊断日志白名单

### 7.1 作用

`all_topic_log_recorder` 用于持续记录故障排查数据，相当于系统的滚动黑匣子。它与客户主动录制的数据包不是同一个功能。

当前检查源码默认写入：

```text
/tj/joint_states
/tj/info/gripper_feedback_L
/tj/info/gripper_feedback_R
/tj/info/eef_left
/tj/info/eef_right
/tj/control/eef_cmd_A
/tj/control/eef_cmd_B
/tj/control/enableL
/tj/control/enableR
/tj/control/gripperValueL
/tj/control/gripperValueR
/tj/control/ik_cmd_A
/tj/control/ik_cmd_B
/tj/control/ik_request
/tj/control/ik_result
/tj/control/joint_cmd_A
/tj/control/joint_cmd_B
/tj/control/joint_cmd_plan_A
/tj/control/joint_cmd_plan_B
/tj/control/qp_controller/joint_cmd_A
/tj/control/qp_controller/joint_cmd_B
/tj/control/playback_control
/tj/control/target_poseL
/tj/control/target_poseR
/hand_left/joint_commands
/hand_left/joint_states
/hand_right/joint_commands
/hand_right/joint_states
```

当前检查源码中的列表也是 Python 硬编码。可配置参数只有：

```text
log_storage_dir
max_log_bags
scan_interval_sec
```

默认日志根目录为运行用户的：

```text
~/.ros/log/topic_log-*
```

默认最多保留 10 个滚动日志目录，存储格式为 SQLite3。

### 7.2 查看状态

```bash
source /etc/apex/apex_ros_env.sh

NODE=$(ros2 node list | grep '/all_topic_log_recorder$' | head -n 1)
echo "Log recorder node: ${NODE:-未找到}"

if [ -n "$NODE" ]; then
    ros2 param dump "$NODE"
    ros2 node info "$NODE"
fi

find "$HOME/.ros/log" -maxdepth 1 -type d -name 'topic_log-*' -printf '%TY-%Tm-%Td %TH:%TM  %p\n' 2>/dev/null | sort
```

不要为了“信息更全”把所有系统 Topic 加入滚动日志。高频反馈、图像、点云和大量调试 Topic 会显著增加磁盘写入和系统负载。

## 8. Pro 与 Gento 的白名单差异

### 8.1 Marvin Pro 常见数据

```text
/tj/joint_states
/tj/info/joint_feedback
/tj/info/eef_left
/tj/info/eef_right
/tj/info/gripper_feedback_L
/tj/info/gripper_feedback_R
/tj/control/joint_cmd_A
/tj/control/joint_cmd_B
/tj/control/gripperValueL
/tj/control/gripperValueR
```

### 8.2 Gento Skye/Luna 可能新增的数据

Gento 除双臂外还可能包含头部、身体、腰部、升降或腿部数据。常见候选包括：

```text
/tj/control/joint_cmd_body
/tj/control/joint_cmd_head
/tj/control/qp_controller/joint_cmd_body
/tj/control/qp_controller/joint_cmd_head
/tj/info/robot_cmd_state
/tj/control/teleop/ik_request
```

以上是候选名称，不是所有版本都会发布。加入白名单前必须先在目标机执行：

```bash
source /etc/apex/apex_ros_env.sh
ros2 topic list -t | grep -E 'body|head|lift|robot_cmd_state|ik_request'
```

Skye 和 Luna 的身体结构不同，不能直接复制同一组身体 Topic 并假定含义、关节数量和类型一致。

## 9. 推荐的现场修改流程

### 9.1 修改前确认

```bash
source /etc/apex/apex_ros_env.sh

echo '=== 系统与 ROS ==='
echo "ROS_DISTRO=${ROS_DISTRO:-未设置}"
echo "ROS_DOMAIN_ID=${ROS_DOMAIN_ID:-未设置}"
echo "APEX_ROS_NAMESPACE=${APEX_ROS_NAMESPACE:-未设置}"

echo '=== Apex 包版本 ==='
dpkg-query -W -f='${Package}\t${Version}\n' 2>/dev/null | \
  grep -E '^(kernelmind-apex|apexteleop|kernelmind-apex-tool)' || true

echo '=== 白名单相关节点 ==='
ros2 node list | grep -E 'data_bag_recorder|playback_node|topic_websocket_server|all_topic_log_recorder' || true
```

### 9.2 备份配置

```bash
CFG=/opt/kernelmind/apex/install/recording_playback_nodes_py/share/recording_playback_nodes_py/config/recording_playback.yaml
sudo cp "$CFG" "$CFG.bak.$(date +%Y%m%d_%H%M%S)"
```

若目标机路径不同，先用以下命令查找：

```bash
find /opt/kernelmind/apex/install -path '*/config/recording_playback.yaml' -print
```

### 9.3 确认修改是否会被节点读取

```bash
source /etc/apex/apex_ros_env.sh

for suffix in data_bag_recorder playback_node topic_websocket_server all_topic_log_recorder; do
    NODE=$(ros2 node list | grep "/${suffix}$" | head -n 1)
    echo
    echo "=== ${suffix}: ${NODE:-未运行} ==="
    if [ -n "$NODE" ]; then
        ros2 param list "$NODE" | sort
    fi
done
```

参数列表中没有对应白名单字段时，应按该版本源码或安装产物处理，不能假定 YAML 会生效。

### 9.4 重启实际归属服务

:::warning 服务重启会中断当前任务

确认机器人已经停止遥操和录制，再重启对应服务。不要在机器人运动、录包或实机回放过程中执行以下命令。

:::

录制和回放通常随 Teleop 启动：

```bash
sudo systemctl restart apex-teleop.service
systemctl --no-pager --full status apex-teleop.service
```

滚动诊断录制通常随 Robot 启动：

```bash
sudo systemctl restart apex-robot.service
systemctl --no-pager --full status apex-robot.service
```

WebSocket 所属服务需按目标版本确认：

```bash
systemctl list-units --type=service --all | grep -E 'apex-(backend|web|teleop)'
pgrep -af 'topic_websocket_server'
```

## 10. 修改后的验证

### 10.1 验证源 Topic

将 `TOPIC` 改为需要验证的名称：

```bash
source /etc/apex/apex_ros_env.sh
TOPIC=/tj/info/eef_left

ros2 topic info "$TOPIC" -v
timeout 5 ros2 topic echo "$TOPIC" --once
timeout 8 ros2 topic hz "$TOPIC"
```

预期：

- `Publisher count` 大于 0。
- `echo --once` 能收到一帧。
- `topic hz` 能统计到合理频率。

### 10.2 验证录制接口是否列出 Topic

```bash
source /etc/apex/apex_ros_env.sh

SERVICE=$(ros2 service list | grep '/tj/recorder/control$' | head -n 1)
ros2 service call "$SERVICE" marvin_msgs/srv/JsonCommand \
  '{command_json: "{\"action\":\"get_topics\"}"}'
```

### 10.3 短时录制并检查 bag

推荐通过前端录制 10 至 20 秒，期间让目标数据产生变化。录制完成后查找最新 bag：

```bash
ROOT=${BAG_STORAGE_ROOT:-/media/$USER/BAG_STORAGE}
find "$ROOT" -type f -name metadata.yaml -printf '%T@ %h\n' 2>/dev/null | \
  sort -nr | head
```

检查指定 bag：

```bash
ros2 bag info /实际/bag/data/目录
```

确认输出中的 Topic 名、类型和消息数量。只出现 Topic 名但消息数量为 0，也不能算录制成功。

### 10.4 验证回放白名单

:::danger 实体机器人回放

回放命令 Topic 可能驱动实体机器人。优先在无动作环境验证 Topic 加载范围；需要实机回放时，必须遵循正式安全流程并保持急停可触及。

:::

```bash
source /etc/apex/apex_ros_env.sh

NODE=$(ros2 node list | grep -E '/(bag_)?playback_node$' | head -n 1)
ros2 param get "$NODE" topic_whitelist
```

重新加载 bag 后再观察回放日志和目标 Topic。实体机器人回放必须按正式安全流程执行。

## 11. 常见问题速查

| 现象 | 可能原因 | 处理 |
| --- | --- | --- |
| `ros2 topic list` 有，录制列表没有 | 不在录制白名单、命名空间不同、消息类型无法导入 | 查 `get_topics`、精确名称和节点日志 |
| 改了 YAML 仍不生效 | 当前 Recorder 使用 Python 硬编码、改错安装路径、launch 未加载该 YAML | 查运行参数和实际安装代码 |
| 录制列表有，bag 中没有 | 本次未选择、录制期间无消息、QoS 不兼容、写入异常 | 查录制状态、`echo/hz`、日志和 `ros2 bag info` |
| bag 中有，回放时没有 | 不在回放白名单、修改后未重新加载 bag | 查 `topic_whitelist` 并重新加载 |
| ROS 有数据，前端看不到 | 不在 WebSocket 白名单、路径不一致、客户端过滤 | 查 WebSocket 运行参数和日志 |
| 前端频率只有约 30 Hz | WebSocket 默认限频 | 核对 `default_topic_fps`，不要误判 ROS 源频率 |
| `/joint_states` 可录，`/tj/joint_states` 不可录 | 白名单与实际解析名称不一致 | 按目标机完整 Topic 名处理 |
| 新增 Topic 后 CPU/磁盘升高 | Topic 高频、消息体大或重复录制 | 删除非必要项，限制采集范围和持续时间 |
| 图像 Topic 加入后包异常增大 | 图像本身数据量大，且产品视频可能另走 MP4/WebRTC | 按相机录制链路处理，不要默认塞入 rosbag |

## 12. 配置原则

1. 只加入任务明确需要的 Topic，不追求“全部都录”。
2. 优先记录最终反馈和最终控制命令，再按问题加入中间调试 Topic。
3. 图像、点云和高频数组单独评估带宽与存储。
4. Pro、Skye、Luna 分别维护，不跨机型照抄身体和头部 Topic。
5. 修改白名单后必须做“源 Topic、录制接口、实际 bag”三级验证。
6. 现场补丁必须回收到正式安装包，否则重装或升级后会丢失。
7. 对外提供数据接口时，应明确白名单只是软件过滤范围，不等于接口实时性承诺。

## 13. 当前源码结论

截至本次检查：

- `data_bag_recorder`：录制白名单由 `bag_recorder_data.py` 中的 `ALLOWED_TOPICS` 硬编码；YAML 虽有 `allowed_topics`，但当前检查源码未读取。
- `playback_node`：回放白名单通过 ROS 参数 `topic_whitelist` 读取。
- `topic_websocket_server`：前端白名单通过 ROS 参数 `topic_whitelist` 读取，默认约 30 Hz 转发上限。
- `all_topic_log_recorder`：诊断白名单由 Python 中的 `ALLOWED_TOPICS` 硬编码。

后续版本若完成参数化，应同步更新本文，并保留“版本、适用产品线、验证设备、验证日期”记录。
