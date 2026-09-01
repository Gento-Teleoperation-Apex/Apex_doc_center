---
title: Camera Configuration and ROS Interfaces
sidebar_position: 2.5
---

# Camera Configuration and ROS Interfaces

This chapter describes the slot configuration, ROS 2 interfaces, WebRTC video, and MCAP recording workflow of the current `gmsl_quadcam` four-camera component. Camera models and device numbers vary by delivery, so verify the configuration on the target system.

## 1. System layout

The component provides four fixed logical slots:

| Slot | Mosaic position | Typical use |
|---|---|---|
| `head_left` | Top left | Left head camera |
| `head_right` | Top right | Right head camera |
| `wrist_left` | Bottom left | Left wrist camera |
| `wrist_right` | Bottom right | Right wrist camera |

CUDA processing combines the four inputs into a 2x2 mosaic. Each slot independently defines its model, physical device, rotation, fit mode, calibration, and depth settings. Set an unused slot to `source: "none"`.

A common configuration uses SH5 head cameras and D405 wrist cameras. SH5 uses CSI/Argus, while SH3 and D405 use V4L2. Device numbers depend on enumeration. Check them before editing the configuration:

```bash
v4l2-ctl --list-devices
v4l2-ctl --list-formats-ext
```

## 2. Startup and checks

On a delivered system, start **Camera** from Apex. To launch the installed component from a terminal:

```bash
source /etc/apex/apex_ros_env.sh
ros2 launch gmsl_quadcam quad_csi_quickview.launch.py
```

To use another configuration:

```bash
ros2 launch gmsl_quadcam quad_csi_quickview.launch.py \
  params_file:=/absolute/path/to/quad_quickview.yaml
```

This launch already starts the WebRTC signaling server. Do not start another process on the same port.

## 3. Configuration files

The main configuration is normally installed at:

```text
/opt/kernelmind/apex/install/gmsl_quadcam/share/gmsl_quadcam/config/quad_quickview.yaml
```

Model defaults are stored under `camera_profiles/` in the same directory. The main file contains profile references, physical connections, and mounting orientation:

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

Back up the deployed configuration before editing it. Active color and depth sources must be unique, all four slot keys must exist, and at least one camera must remain enabled.

### 3.1 Common parameters

| Parameter | Description |
|---|---|
| `profile` | Camera model registered under `camera_profiles` |
| `source` | `csi://N`, `/dev/videoN`, `/dev/gmslcamN`, or `none` |
| `depth_source` | Independent V4L2 device used when the profile enables depth |
| `fps` | Per-camera capture negotiation rate; it does not define the mosaic rate |
| `flip_method` | `true` rotates the image by 180 degrees |
| `fit_mode` | `contain` preserves aspect ratio with black bars; `stretch` fills the cell |
| `calibration.enabled` | Enables CUDA undistortion for the slot |
| `depth.enabled` | Enables the paired D405 depth device |
| `depth.publish_raw` | Publishes the raw `16UC1` depth image |

### 3.2 Disable a slot

```yaml
quad_csi_quickview:
  ros__parameters:
    camera:
      head_right:
        source: "none"
```

The disabled cell remains black and displays `CAM N DISABLED`. Do not set all four slots to `none`.

## 4. ROS topics

The default `mosaic.fps` is 30 Hz. Most single-camera, undistorted, H.264, JPEG, and compressed-depth topics use subscriber-driven publication. Their actual rate cannot exceed the valid input and mosaic configuration; measure it on the target with `ros2 topic hz`.

### 4.1 Per-camera color images

| Topic | Type | Format | Publication condition |
|---|---|---|---|
| `/camera/left_eye/image_nv12` | `sensor_msgs/msg/Image` | NV12 | Exported when a subscriber exists |
| `/camera/right_eye/image_nv12` | `sensor_msgs/msg/Image` | NV12 | Exported when a subscriber exists |
| `/camera/left_wrist/image_nv12` | `sensor_msgs/msg/Image` | NV12 | Exported when a subscriber exists |
| `/camera/right_wrist/image_nv12` | `sensor_msgs/msg/Image` | NV12 | Exported when a subscriber exists |
| `/camera/left_eye/image_nv12_undistorted` | `sensor_msgs/msg/Image` | NV12 | Slot calibration enabled and a subscriber exists |
| `/camera/right_eye/image_nv12_undistorted` | `sensor_msgs/msg/Image` | NV12 | Slot calibration enabled and a subscriber exists |
| `/camera/left_wrist/image_nv12_undistorted` | `sensor_msgs/msg/Image` | NV12 | Slot calibration enabled and a subscriber exists |
| `/camera/right_wrist/image_nv12_undistorted` | `sensor_msgs/msg/Image` | NV12 | Slot calibration enabled and a subscriber exists |

The mosaic path does not depend on these ROS images. NVMM-to-CPU export occurs only when a per-camera color topic has a subscriber.

### 4.2 Mosaic and depth images

| Topic | Type | `CompressedImage.format` | Publication condition / description |
|---|---|---|---|
| `/quad_tile/compressed` | `sensor_msgs/msg/CompressedImage` | `h264` | Raw four-camera mosaic; starts its encoder when subscribed |
| `/quad_tile/compressed_undistorted` | `sensor_msgs/msg/CompressedImage` | `h264` | Mosaic processed according to each slot's calibration; ROS messages publish when subscribed |
| `/quad_tile/jpeg/compressed` | `sensor_msgs/msg/CompressedImage` | `jpeg` | Processed JPEG mosaic; Reliable, KeepLast(1), default 640x360 at quality 55 |
| `/camera/<name>/depth/image_raw` | `sensor_msgs/msg/Image` | `16UC1` | `depth.enabled=true` and `publish_raw=true` |
| `/camera/<name>/depth/image_raw/compressed` | `sensor_msgs/msg/CompressedImage` | `h264` | Depth enabled; grayscale mapping and encoding run when subscribed |

`/recorder/quad_tile/compressed_undistorted` is written directly to MCAP and is not exposed as a normal ROS publisher.

## 5. WebRTC

The default signaling URL is `ws://127.0.0.1:8554`, with rooms `10`, `11`, and `12`. All rooms share the same processed mosaic H.264 stream; they are not separate layouts or encoders.

The default WebRTC output is 1920x1488, and the mosaic reads the latest frames at 30 Hz. An active slot that receives no frame for more than 500 ms displays `STALE`.

## 6. MCAP recording

Recording service:

```text
/recorder/set_recording
marvin_msgs/srv/VideoCapture
```

Start recording:

```bash
ros2 service call /recorder/set_recording marvin_msgs/srv/VideoCapture \
  "{start_stop: true, save_dir: ''}"
```

Stop recording:

```bash
ros2 service call /recorder/set_recording marvin_msgs/srv/VideoCapture \
  "{start_stop: false, save_dir: ''}"
```

An empty `save_dir` uses `recorder.directory`. The default is `/media/marvin/BAG_STORAGE/recorded_bags`. Recordings contain the processed mosaic H.264 stream in MCAP storage.

## 7. D435 RGB-D

D435 uses the separate `config/rgbd_cameras.yaml` configuration and is not included in the four-camera mosaic:

```bash
ros2 launch gmsl_quadcam rgbd_cameras.launch.py
```

Common topics:

```text
/camera/d435/color/image_raw
/camera/d435/depth/image_rect_raw
/camera/d435/color/camera_info
/camera/d435/depth/camera_info
```

## 8. Quick checks and troubleshooting

```bash
source /etc/apex/apex_ros_env.sh

ros2 node list
ros2 topic list | grep -Ei 'camera|image|compressed|quad'
ros2 topic info /quad_tile/compressed_undistorted -v
ros2 topic hz /quad_tile/compressed_undistorted
```

| Symptom | Interpretation and action |
|---|---|
| No data on `/quad_tile/compressed` | Check for subscribers first; its encoder remains stopped without subscribers by design |
| No compressed depth data | Verify that depth is enabled and a subscriber exists |
| `CAM N DISABLED` | The slot source is `none` |
| `CAM N STALE` | The slot has received no new frame for more than 500 ms |
| WebRTC reports unavailable | Check Camera, ensure only one signaling server is running, and inspect room, SDP, and ICE logs |
| Repeated capture or Argus errors | Check the GMSL link, sensor mode, cable, device number, and driver |

For full communication diagnostics, see [Skye/Luna modular communication diagnostics](/advanced/gento-communication-diagnostics) or [Marvin Pro modular communication diagnostics](/advanced/pro-communication-diagnostics).
