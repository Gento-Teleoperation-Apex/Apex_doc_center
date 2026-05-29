# KM Data Converter

面向机器人模仿学习数据集的转换工具链。它可以把原始采集目录 `BAG_STORAGE` 中的 MCAP 数据与四路相机视频，自动整理、对齐并导出为 LeRobot v3.0 数据集。

- 一键完成从原始采集数据到 LeRobot v3.0 数据集的转换
- 支持 2x2 拼接相机视频拆分，默认包含左眼、右眼、左腕、右腕四路视角
- 将 MCAP 机器人状态数据导出为 RRD，并与视频帧进行时间对齐
- 可通过 Electron 桌面界面选择路径、设置 FPS、填写任务描述并查看实时日志
- 支持在 Rerun 中查看转换后的数据集和机器人状态

## 转换流程

```text
BAG_STORAGE 原始数据
  -> 拆分四路相机视频
  -> MCAP 导出为 RRD
  -> 视频与机器人状态对齐
  -> 导出 LeRobot 数据集
  -> 使用 Rerun 可视化检查
```

每个 episode 目录需要采用以下结构：

```text
BAG_STORAGE/
  my_bag-yy-MM-dd-HH-mm-ss/
    data/
      data_0.mcap
    video/
      cameras.mp4
      cameras_first_frame.yaml
```

默认的 `cameras.mp4` 画面布局为：

```text
left_eye      right_eye
left_wrist    right_wrist
```

## 环境准备

推荐使用 Python 3.10 至 3.12。

```powershell
pip install -e .
pip install rerun-sdk[all]
pip install -e .\examples\python\rerun_export
```

如环境中缺少视频或 YAML 相关依赖，可额外安装：

```powershell
pip install opencv-python pyyaml
```

## 使用桌面界面

项目内置 Electron UI，适合日常转换时使用。

![Electron UI 界面预览](image/img_v3_02125_5a1db36f-9785-40a1-a9ef-b49fd4240f0g.jpg)

```powershell
cd .\km_data_converter_UI
npm install
npm run dev
```

在界面中选择 `BAG_STORAGE` 源目录和输出目录，设置目标 FPS、任务描述以及高级选项后，即可启动完整转换流程。界面会显示进度、实时日志、最终数据集路径，并提供按钮用 Rerun 打开转换结果。

![Electron UI 转换流程预览](image/img_v3_02125_6fb03327-ba42-4ab0-b605-35e36ddaf33g.jpg)

## 使用命令行转换

将所有采集目录放到 `BAG_STORAGE` 下后，运行：

```powershell
python -m km_data_converter run-full
```

也可以显式传入输入和输出路径：

```powershell
python -m km_data_converter run-full <bag_storage_path> [output_root_path]
```

常用参数示例：

```powershell
python -m km_data_converter run-full ^
  --bag-storage BAG_STORAGE ^
  --target-fps 10 ^
  --output-dir OUTPUT_DIR ^
  --repo-id rerun/droid_lerobot_full ^
  --end-effector {gripper,hand} ^
  --task-description TASK_DESCRIPTION ^
  --strict
```

默认输出目录结构如下：

```text
datasets/
  mcap2rrd/
  video2rrd/
  lerobot_output/
```

最终的 LeRobot 数据集通常包含 `data`、`meta` 和 `videos` 等目录。

## 分步运行

如果需要调试或只执行某个阶段，也可以分步运行。

拆分拼接视频：

```powershell
python -m km_data_converter split-video
```

将 MCAP 转换为 RRD：

```powershell
python -m km_data_converter mcap-to-rrd ^
  --bag-storage .\BAG_STORAGE ^
  --output-dir .\datasets\mcap2rrd
```

将视频与机器人状态写入新的 RRD：

```powershell
python -m km_data_converter video-to-rrd ^
  --bag-storage .\BAG_STORAGE ^
  --dataset-dir .\datasets\mcap2rrd ^
  --output-dir .\datasets\video2rrd
```

导出 LeRobot 数据集：

```powershell
python -m km_data_converter rrd-to-lerobot ^
  --input-dir .\datasets\video2rrd ^
  --output-root .\datasets\lerobot_output\lerobot_datasets
```

如果希望覆盖所有帧的任务描述，可以传入固定文本：

```powershell
python -m km_data_converter rrd-to-lerobot ^
  --input-dir .\datasets\video2rrd ^
  --output-root .\datasets\lerobot_output\lerobot_datasets ^
  --task-description TASK_DESCRIPTION
```

## 主要命令

| 命令 | 作用 |
| --- | --- |
| `python -m km_data_converter run-full` | 运行完整转换流程 |
| `python -m km_data_converter split-video` | 将 `cameras.mp4` 拆分为四路相机视频 |
| `python -m km_data_converter mcap-to-rrd` | 为每个 episode 导出 `mcap2rrd.rrd` |
| `python -m km_data_converter video-to-rrd` | 对齐视频与机器人状态，生成 `video2rrd` |
| `python -m km_data_converter rrd-to-lerobot` | 合并多个 RRD 并导出 LeRobot 数据集 |

## 数据字段

### Action

`action` 向量共 56 维，顺序固定：

```text
action = [effort(14), position(14), velocity(14), control_A(7), control_B(7)]
```

其中：

- 0-13：关节力矩 `/joint_states/effort`
- 14-27：关节位置 `/joint_states/position`
- 28-41：关节速度 `/joint_states/velocity`
- 42-48：左臂控制指令 `/control/joint_cmd_A`
- 49-55：右臂控制指令 `/control/joint_cmd_B`

### Observation State

`observation.state` 向量共 26 维，顺序固定：

```text
observation.state = [eef_left(7), eef_right(7), gripper_feedback_L(6), gripper_feedback_R(6)]
```

其中：

- `eef_left`：左末端执行器 7 维位姿
- `eef_right`：右末端执行器 7 维位姿
- `gripper_feedback_L`：左夹爪 6 维反馈
- `gripper_feedback_R`：右夹爪 6 维反馈

末端位姿字段顺序为：

```text
pose.position.x, pose.position.y, pose.position.z,
pose.orientation.x, pose.orientation.y, pose.orientation.z, pose.orientation.w
```

## Marvin_pro URDF

如果需要在已有 `video2rrd` 文件中追加 Marvin URDF 和对齐后的关节变换，可运行：

```powershell
python -m km_data_converter.urdf ^
  --input-rrd .\datasets\video2rrd\video2rrd-yy-MM-dd-HH-mm-ss.rrd ^
  --output-rrd .\datasets\video2rrd\video2rrd-yy-MM-dd-HH-mm-ss-with-urdf.rrd ^
  --no-spawn
```

常用参数：

- `--input-rrd`：需要增强的 `video2rrd` 文件
- `--output-rrd`：输出 RRD 路径，省略时会在原文件旁生成 `-with-urdf.rrd`
- `--xacro`：可选 xacro 文件路径，默认使用仓库内的 Marvin M6 模型
- `--output-urdf`：可选的展开后 URDF 输出路径
- `--no-spawn`：不自动打开 Rerun 查看器

## Rerun 可视化

安装 Rerun：

```powershell
pip install rerun-sdk[all]
```

进入 `datasets\lerobot_output` 后打开数据集：

```powershell
rerun .\lerobot_datasets-yy-MM-dd-HH-mm-ss\
```

将 `yy-MM-dd-HH-mm-ss` 替换为实际生成的数据集时间戳目录名。

## 使用注意

- episode 目录名必须以 `my_bag-yy-MM-dd-HH-mm-ss` 开头
- `video-to-rrd` 需要四路拆分视频全部存在
- `video-to-rrd` 会在每个 episode 的 `video` 目录下生成传感器 dashboard 视频
- 默认情况下脚本会跳过异常 episode 并继续处理；使用 `--strict` 后会在首次错误时停止
- 转换新数据可能覆盖 `datasets` 下的旧中间结果，请提前保存需要保留的 RRD 或数据集
- 转换新一批数据前，建议清理或替换 `BAG_STORAGE` 中的旧采集目录
