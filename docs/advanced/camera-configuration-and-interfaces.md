---
title: 相机配置与 ROS 接口
sidebar_position: 2.5
---

# 相机配置与 ROS 接口

本章说明当前 `gmsl_quadcam` 四路相机组件的槽位配置、ROS 2 接口、WebRTC 视频和 MCAP 录像方法。不同交付版本的相机型号和设备编号可能不同，应以目标设备配置为准。

## 1. 系统结构

组件提供四个固定逻辑槽位：

| 槽位 | 画面位置 | 常见用途 |
|---|---|---|
| `head_left` | 左上 | 左头部相机 |
| `head_right` | 右上 | 右头部相机 |
| `wrist_left` | 左下 | 左腕相机 |
| `wrist_right` | 右下 | 右腕相机 |

四路输入经过 CUDA 处理后组成 2×2 Mosaic。每个槽位可独立设置相机型号、物理设备、旋转、画面适配、标定和深度；不使用的槽位设置为 `source: "none"`。

当前常见组合为头部 SH5、腕部 D405。SH5 使用 CSI/Argus，SH3 和 D405 使用 V4L2。设备编号取决于现场枚举结果，修改前先执行：

```bash
v4l2-ctl --list-devices
v4l2-ctl --list-formats-ext
```

## 2. 启动与检查

正常交付设备优先在 Apex 中启动 **Camera**。需要从终端启动已安装组件时执行：

```bash
source /etc/apex/apex_ros_env.sh
ros2 launch gmsl_quadcam quad_csi_quickview.launch.py
```

使用指定配置：

```bash
ros2 launch gmsl_quadcam quad_csi_quickview.launch.py \
  params_file:=/absolute/path/to/quad_quickview.yaml
```

该 Launch 已包含 WebRTC 信令服务，不要再启动第二个占用相同端口的实例。

## 3. 配置文件

主配置通常位于：

```text
/opt/kernelmind/apex/install/gmsl_quadcam/share/gmsl_quadcam/config/quad_quickview.yaml
```

相机型号默认参数位于同目录的 `camera_profiles/`。主配置保存 Profile 引用、物理接线和安装方向等部署差异，例如：

```yaml
quad_csi_quickview:
  ros__parameters:
    camera_profiles:
      sh5: "camera_profiles/sh5.yaml"
      sh3: "camera_profiles/sh3.yaml"
      d405: "camera_profiles/d405.yaml"

    camera:
      head_left:
        profile: "sh5"
        source: "csi://0"
        flip_method: false
      head_right:
        profile: "sh5"
        source: "csi://1"
        flip_method: true
      wrist_left:
        profile: "d405"
        source: "/dev/video5"
        depth_source: "/dev/video4"
        flip_method: false
      wrist_right:
        profile: "d405"
        source: "/dev/video7"
        depth_source: "/dev/video6"
        flip_method: true
```

修改前先备份现场配置。有效彩色源和深度源不能重复，四个槽位名称必须存在，并且至少启用一路相机。

### 3.1 常用参数

| 参数 | 说明 |
|---|---|
| `profile` | 引用 `camera_profiles` 中注册的相机型号 |
| `source` | `csi://N`、`/dev/videoN`、`/dev/gmslcamN` 或 `none` |
| `depth_source` | Profile 启用深度时使用的独立 V4L2 设备 |
| `fps` | 单路相机启动和协商帧率，不等于 Mosaic 输出频率 |
| `flip_method` | `true` 表示旋转 180° |
| `fit_mode` | `contain` 保持比例并补黑边；`stretch` 拉伸填满 |
| `calibration.enabled` | 是否对该槽位执行 CUDA 去畸变 |
| `depth.enabled` | 是否启用 D405 配对深度设备 |
| `depth.publish_raw` | 是否发布原始 `16UC1` 深度图 |

### 3.2 禁用槽位

```yaml
quad_csi_quickview:
  ros__parameters:
    camera:
      head_right:
        source: "none"
```

禁用后对应画面保持黑色并显示 `CAM N DISABLED`。四路不能全部设置为 `none`。

## 4. ROS Topic

默认 `mosaic.fps` 为 30 Hz。单路彩色、去畸变、H.264、JPEG 和深度压缩 Topic 多数采用按订阅启停方式，实际频率不会高于有效输入和 Mosaic 配置，应在目标设备使用 `ros2 topic hz` 实测。

### 4.1 单路彩色图像

| Topic | 类型 | 格式 | 发布条件 |
|---|---|---|---|
| `/camera/left_eye/image_nv12` | `sensor_msgs/msg/Image` | NV12 | 存在订阅者时导出 |
| `/camera/right_eye/image_nv12` | `sensor_msgs/msg/Image` | NV12 | 存在订阅者时导出 |
| `/camera/left_wrist/image_nv12` | `sensor_msgs/msg/Image` | NV12 | 存在订阅者时导出 |
| `/camera/right_wrist/image_nv12` | `sensor_msgs/msg/Image` | NV12 | 存在订阅者时导出 |
| `/camera/left_eye/image_nv12_undistorted` | `sensor_msgs/msg/Image` | NV12 | 该槽位启用标定且存在订阅者 |
| `/camera/right_eye/image_nv12_undistorted` | `sensor_msgs/msg/Image` | NV12 | 该槽位启用标定且存在订阅者 |
| `/camera/left_wrist/image_nv12_undistorted` | `sensor_msgs/msg/Image` | NV12 | 该槽位启用标定且存在订阅者 |
| `/camera/right_wrist/image_nv12_undistorted` | `sensor_msgs/msg/Image` | NV12 | 该槽位启用标定且存在订阅者 |

Mosaic 主路径不依赖这些 ROS Image。只有订阅单路彩色 Topic 时才执行 NVMM 到 CPU 的导出。

### 4.2 Mosaic 与深度图像

| Topic | 类型 | `CompressedImage.format` | 发布条件 / 说明 |
|---|---|---|---|
| `/quad_tile/compressed` | `sensor_msgs/msg/CompressedImage` | `h264` | 原始四路 Mosaic；有订阅者时启动编码器 |
| `/quad_tile/compressed_undistorted` | `sensor_msgs/msg/CompressedImage` | `h264` | 按各槽位标定配置处理后的 Mosaic；有订阅者时发布 ROS 消息 |
| `/quad_tile/jpeg/compressed` | `sensor_msgs/msg/CompressedImage` | `jpeg` | 处理后的 JPEG Mosaic；Reliable、KeepLast(1)，默认 640×360、quality 55 |
| `/camera/<name>/depth/image_raw` | `sensor_msgs/msg/Image` | `16UC1` | `depth.enabled=true` 且 `publish_raw=true` |
| `/camera/<name>/depth/image_raw/compressed` | `sensor_msgs/msg/CompressedImage` | `h264` | 启用深度且存在订阅者时进行灰度映射和编码 |

`/recorder/quad_tile/compressed_undistorted` 只写入 MCAP，不作为普通 ROS Publisher 对外发布。

## 5. WebRTC

默认信令地址为 `ws://127.0.0.1:8554`，房间号为 `10`、`11`、`12`。这些房间共享同一路处理后 Mosaic H.264 码流，而不是三个独立布局或编码器。

WebRTC 默认输出为 1920×1488，Mosaic 默认以 30 Hz 取最新帧。某个活跃槽位超过 500 ms 没有新帧时，画面会显示 `STALE`。

## 6. MCAP 录像

录像服务：

```text
/recorder/set_recording
marvin_msgs/srv/VideoCapture
```

开始录像：

```bash
ros2 service call /recorder/set_recording marvin_msgs/srv/VideoCapture \
  "{start_stop: true, save_dir: ''}"
```

停止录像：

```bash
ros2 service call /recorder/set_recording marvin_msgs/srv/VideoCapture \
  "{start_stop: false, save_dir: ''}"
```

`save_dir` 为空时使用配置中的 `recorder.directory`。默认目录为 `/media/marvin/BAG_STORAGE/recorded_bags`，录像内容为处理后 Mosaic H.264，存储格式为 MCAP。

## 7. D435 RGB-D

D435 使用独立配置 `config/rgbd_cameras.yaml`，不加入四路 Mosaic：

```bash
ros2 launch gmsl_quadcam rgbd_cameras.launch.py
```

常用 Topic：

```text
/camera/d435/color/image_raw
/camera/d435/depth/image_rect_raw
/camera/d435/color/camera_info
/camera/d435/depth/camera_info
```

## 8. 快速检查与故障判断

```bash
source /etc/apex/apex_ros_env.sh

ros2 node list
ros2 topic list | grep -Ei 'camera|image|compressed|quad'
ros2 topic info /quad_tile/compressed_undistorted -v
ros2 topic hz /quad_tile/compressed_undistorted
```

| 现象 | 判断与处理 |
|---|---|
| `/quad_tile/compressed` 没有数据 | 先确认是否存在订阅者；无订阅者时不启动对应编码器属于正常行为 |
| 深度压缩 Topic 没有数据 | 确认深度已启用且存在订阅者 |
| `CAM N DISABLED` | 对应槽位的 `source` 为 `none` |
| `CAM N STALE` | 对应槽位超过 500 ms 没有新帧 |
| WebRTC 显示不可用 | 检查 Camera、唯一信令服务器实例、房间号以及 SDP/ICE 日志 |
| 持续出现 Capture 或 Argus 错误 | 检查 GMSL 链路、传感器模式、线缆、设备编号和驱动 |

需要完整链路诊断时，参见 [Skye/Luna 模块化通讯排查](/advanced/gento-communication-diagnostics) 或 [Marvin Pro 模块化通讯排查](/advanced/pro-communication-diagnostics)。
