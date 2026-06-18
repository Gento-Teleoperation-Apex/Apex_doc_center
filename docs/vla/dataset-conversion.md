---
title: 数据集转换
sidebar_position: 2
---

# LeRobot 数据集格式转换（v3.0 → v2.1）

OpenPI 当前训练代码使用 LeRobot **v2.1** 数据集布局。若你通过 [KM Data Converter](/data-converter/README.zh-CN) 导出了 **v3.0** 格式数据集，需先运行 `convert_v3_to_v2.py` 完成格式转换后再开始训练。

所有命令均在 OpenPI 项目根目录下执行，并使用 `uv` 管理环境。

## 转换脚本说明

`convert_v3_to_v2.py` 会将 v3.0 布局还原为 v2.1 兼容格式，主要操作包括：

- 校验 `info.json` 中 `codebase_version = "v3.0"`
- 重写 metadata 为 v2.1 schema
- 重建逐 episode 的 `.parquet` 与视频文件
- 生成 legacy 的 `episodes.jsonl` / `episodes_stats.jsonl`
- 保留 v3.0 原始文件，并在同一目录下追加 v2.1 兼容文件

转换完成后，数据集目录即可直接用于 OpenPI 训练流程。转换结果的四路相机视频与目录结构说明见 [数据集样例](/vla/dataset-sample)。

## 本地 v3.0 数据集原地转换

若 v3.0 数据集已在本地磁盘，可直接原地转换，无需重新下载：

```bash
uv run convert_v3_to_v2.py --local-root /PATH/TO/YOUR_V3_DATASET
```

- `--local-root`：v3.0 数据集根目录，应包含 `meta/`、`data/`、`videos/` 等子目录。

## 从 Hugging Face Hub 下载并转换

若数据集托管在 Hugging Face Hub，可一步完成下载与转换：

```bash
uv run convert_v3_to_v2.py \
  --repo-id lerobot/YOUR_DATASET_NAME \
  --root /PATH/TO/LOCAL_DATA_ROOT \
  --force-conversion
```

| 参数 | 说明 |
| --- | --- |
| `--repo-id` | HF 数据集仓库 ID，例如 `lerobot/pusht` |
| `--root` | 本地存储根目录，数据集将保存至 `<root>/<repo-id>` |
| `--force-conversion` | 强制重新下载并转换（覆盖已有快照） |

脚本执行流程：

1. 下载 v3.0 快照至 `<root>/<repo-id>`
2. 在临时目录构建 v2.1 布局
3. 将原始 v3.0 快照备份至 `_v3.0` 同级目录
4. 将 v2.1 布局移入原数据集路径

## 与 KM Data Converter 的衔接

推荐的数据准备流程：

```text
BAG_STORAGE 原始采集
  -> python -m km_data_converter run-full
  -> datasets/lerobot_output/（LeRobot v3.0）
  -> uv run convert_v3_to_v2.py --local-root <v3.0 数据集路径>
  -> 可用于 OpenPI 训练的 v2.1 数据集
```

转换前请确认：

- 数据集中包含主相机与腕部相机图像
- `observation.state` 与 `action` 字段维度与训练配置一致
- 每条 episode 附有任务描述（`task` 字段）

## 常见问题

**转换后训练报错找不到 episode 文件**

检查 `--local-root` 是否指向包含 `meta/info.json` 的数据集根目录，而非某个 episode 子目录。

**是否需要删除 v3.0 原始文件**

不需要。脚本会在原目录追加 v2.1 文件，v3.0 数据仍保留。若磁盘空间紧张，可在确认训练正常后手动清理 v3.0 专属文件。

**Hugging Face 下载中断**

加上 `--force-conversion` 重新执行，脚本会重新下载并完成转换。
