---
title: VLA Overview
sidebar_position: 1
---

# VLA Vision-Language-Action Model

VLA (Vision-Language-Action) models are end-to-end policy models that combine visual perception, natural-language instructions, and robot action control. Given camera images, robot proprioceptive state, and a natural-language task description, the model directly outputs end-effector and gripper control actions for imitation learning and real-robot deployment.

This section is based on the [OpenPI](https://github.com/Physical-Intelligence/openpi) framework and describes the full workflow from data collection, dataset conversion, and model training to real-robot inference.

## Applicable Scenarios

- Fine-tune PI0 / PI05 models using LeRobot-format datasets
- Convert LeRobot v3.0 datasets exported by KM Data Converter to the v2.1 format required by OpenPI training
- Deploy trained checkpoints on robots such as Marvin Pro and execute language-instruction tasks through a WebSocket policy service

## End-to-End Flow

```text
Raw acquisition data (BAG / MCAP)
  -> KM Data Converter exports LeRobot v3.0 dataset
  -> convert_v3_to_v2.py converts to v2.1 format
  -> train_pytorch.py trains PI0 / PI05 model
  -> serve_policy_kmd_joint.py starts the policy server
  -> vlahost collects robot state and camera images
  -> openpi_client_policy_http_kmd_joint.py performs inference and sends actions
```

## Observation and Action Format

The current KMD real-robot deployment uses three cameras and a 16D joint-space state:

| Field | Type | Description |
| --- | --- | --- |
| `state` | float32 vector | 16D state: 7 left-arm joints, left gripper, 7 right-arm joints, right gripper |
| `cam_high` | HWC uint8 | Main-view camera image |
| `cam_left_wrist` | HWC uint8 | Left-wrist camera image |
| `cam_right_wrist` | HWC uint8 | Right-wrist camera image |
| `prompt` | string | Natural-language task instruction |

Policy output:

| Field | Type | Description |
| --- | --- | --- |
| `actions` | `[T, 16]` | Joint-action chunk in the same order as the 16D state |

The model uses degrees internally. Robot-side `joint_states.positions` normally uses radians. The OpenPI client converts `rad -> deg` before inference and `deg -> rad` before sending an action.

## Environment Requirements

- Python 3.10+
- [uv](https://github.com/astral-sh/uv) package manager
- Run all commands from the OpenPI project root
- NVIDIA GPU is recommended for training; inference can run through a policy service on an independent GPU server

## Quick Navigation

| Document | Content |
| --- | --- |
| [Dataset Conversion](/vla/dataset-conversion) | LeRobot v3.0 to v2.1 format conversion |
| [Dataset Sample](/vla/dataset-sample) | Four-camera video and directory structure description |
| [Model Training](/vla/training) | PI0 / PI05 fine-tuning and checkpoint management |
| [Real-Robot Deployment](/vla/deployment) | Policy server and robot client integration |
