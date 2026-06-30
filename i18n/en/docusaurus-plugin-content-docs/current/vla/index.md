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
  -> serve_policy starts the policy server
  -> Openpi_client_policy connects to the real robot and executes actions
```

## Observation and Action Format

Expected observation input for the policy server:

| Field | Type | Description |
| --- | --- | --- |
| `observation/state` | float32 vector | Robot proprioceptive state, for example 8D EEF pose + gripper |
| `observation/image` | HWC uint8 | Main camera image, recommended 224x224 or 256x256 |
| `observation/wrist_image` | HWC uint8 | Wrist camera image |
| `prompt` | string | Natural-language task instruction |

Policy output:

| Field | Type | Description |
| --- | --- | --- |
| `actions` | `[T, action_dim]` | Action sequence chunk, for example `[T, 7]` means EEF delta + gripper |

Typical meaning of a 7D action vector:

```text
actions = [delta_pos(3), delta_rot(3), gripper(1)]
```

- `delta_pos`: end-effector position delta
- `delta_rot`: end-effector orientation delta in axis-angle representation
- `gripper`: gripper open/close value, where 0 = open and 1 = close

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
