---
title: 故障排查
sidebar_position: 4
---

# 故障排查

先停止机器人运动并记录故障时间，再按下表排查。

| 现象 | 优先检查 |
|---|---|
| Apex Teleop 无法连接 | 右上角 IP、上位机网段、网线、天准控制器是否在线 |
| Robot 启动失败 | 急停、机器人供电、双臂控制板网络、Robot 日志 |
| URDF 与实体姿态不一致 | Robot 模块、机型配置、关节状态是否更新 |
| Teleop 或模式按钮不可用 | Robot 是否运行、是否点击 Start Robot |
| 点击 Home 后不动作 | Ready 状态、控制模式、机器人是否存在报警 |
| 打包姿态直接 Home 可能碰撞立柱 | 禁止继续 Home；先启动 Robot/Teleop，通过 RQt 调用 `/control/movej` 将双臂 14 关节移动到全零位 |
| Home 过程中腕部相机接近立柱 | 立即停止并按需急停，重新确认起始姿态和全零位步骤 |
| 头显无法连接 | dnsmasq、头显网线、连接 IP、VR 状态 |
| 四宫格部分黑屏 | `camera_sources` 是否包含 `none`；启用路数是否符合交付配置 |
| 全部相机黑屏 | Camera、上电后相机初始化、线束和 Camera 日志 |
| 夹爪无响应 | 是否配置末端执行器、Tool 是否启动、夹爪是否需要重启 |
| 遥操无动作 | Impedance Mode、Home、Input Mode=Teleop、头显连接 |

前端日志操作见 [Apex Teleop 日志说明](/software/apex-teleop/pro-current#日志查看)。需要技术支持时，请提供产品型号、软件版本、故障时间、Robot/Teleop 日志和现场接线照片。

> 发生异常运动、持续报警或机械干涉时，应立即按下急停，不要反复尝试启动。
