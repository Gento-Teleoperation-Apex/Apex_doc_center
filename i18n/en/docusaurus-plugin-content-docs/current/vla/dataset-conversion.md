---
title: Dataset Conversion
sidebar_position: 2
---

# LeRobot Dataset Format Conversion (v3.0 -> v2.1)

OpenPI's current training code uses the LeRobot **v2.1** dataset layout. If you exported a **v3.0** dataset through [KM Data Converter](../data-converter/README.zh-CN), run `convert_v3_to_v2.py` to finish format conversion before training.

All commands should be run from the OpenPI project root and use `uv` to manage the environment.

## Conversion Script

`convert_v3_to_v2.py` restores the v3.0 layout to a v2.1-compatible format. Main operations include:

- Validate `codebase_version = "v3.0"` in `info.json`
- Rewrite metadata to the v2.1 schema
- Rebuild per-episode `.parquet` files and video files
- Generate legacy `episodes.jsonl` / `episodes_stats.jsonl`
- Keep the original v3.0 files and append v2.1-compatible files in the same directory

After conversion, the dataset directory can be used directly by the OpenPI training workflow. For four-camera videos and directory structure, see [Dataset Sample](./dataset-sample).

## In-Place Conversion of a Local v3.0 Dataset

If the v3.0 dataset is already on local disk, convert it in place without downloading again:

```bash
uv run convert_v3_to_v2.py --local-root /PATH/TO/YOUR_V3_DATASET
```

- `--local-root`: v3.0 dataset root directory, which should contain `meta/`, `data/`, `videos/`, and other subdirectories.

## Download from Hugging Face Hub and Convert

If the dataset is hosted on Hugging Face Hub, download and convert it in one step:

```bash
uv run convert_v3_to_v2.py \
  --repo-id lerobot/YOUR_DATASET_NAME \
  --root /PATH/TO/LOCAL_DATA_ROOT \
  --force-conversion
```

| Parameter | Description |
| --- | --- |
| `--repo-id` | HF dataset repository ID, for example `lerobot/pusht` |
| `--root` | Local storage root; the dataset will be saved to `<root>/<repo-id>` |
| `--force-conversion` | Force re-download and conversion, overwriting the existing snapshot |

Script flow:

1. Download the v3.0 snapshot to `<root>/<repo-id>`
2. Build the v2.1 layout in a temporary directory
3. Back up the original v3.0 snapshot to a sibling `_v3.0` directory
4. Move the v2.1 layout into the original dataset path

## Integration with KM Data Converter

Recommended data preparation flow:

```text
BAG_STORAGE/recorded_bags raw acquisition
  -> python -m km_data_converter run-full
  -> datasets/lerobot_output/ (LeRobot v3.0)
  -> uv run convert_v3_to_v2.py --local-root <v3.0 dataset path>
  -> v2.1 dataset ready for OpenPI training
```

Before conversion, confirm that:

- The dataset includes main camera and wrist camera images
- `observation.state` and `action` dimensions match the training configuration
- Each episode includes a task description in the `task` field

## FAQ

**Training reports missing episode files after conversion**

Check whether `--local-root` points to the dataset root containing `meta/info.json`, not an episode subdirectory.

**Do I need to delete the original v3.0 files?**

No. The script appends v2.1 files in the original directory and keeps the v3.0 data. If disk space is limited, clean up v3.0-specific files manually after confirming training works.

**Hugging Face download is interrupted**

Run the command again with `--force-conversion`; the script will download again and complete conversion.
