---
title: Model Training
sidebar_position: 4
---

# PI0 / PI05 Model Training

After converting the dataset to LeRobot v2.1 format, use the PyTorch or JAX training entry points provided by OpenPI to fine-tune PI0 / PI05 models.

## Training Entry Points

| Script | Framework | Recommended scenario |
| --- | --- | --- |
| `scripts/train_pytorch.py` | PyTorch | Daily fine-tuning, recommended |
| `scripts/train.py` | JAX / Flax | Use when the JAX ecosystem is required |

PyTorch training depends on the following modules:

- `openpi.training.config`: training configuration
- `openpi.training.data_loader`: LeRobot v2.1 data loading
- `openpi.models_pytorch.pi0_pytorch.PI0Pytorch`: model definition

## Single-GPU Training

```bash
uv run scripts/train_pytorch.py pi05_lerobot_datasets0314 \
  --exp_name pi05_lerobot_run1
```

## Multi-GPU Training (Single Node)

```bash
uv run torchrun --standalone --nnodes=1 --nproc_per_node=2 \
  scripts/train_pytorch.py pi05_lerobot_datasets0314 \
  --exp_name pi05_lerobot_run1
```

## Training Configuration

`<config_name>`, such as `pi05_lerobot_datasets0314`, must be pre-defined in `openpi.training.config`. Configuration items include:

- Dataset path
- Batch size
- Training steps
- Learning rate schedule
- Checkpoint save directory (`checkpoint_dir`)

For a custom dataset, copy an existing config and modify the dataset path and normalization stats path.

## Checkpoint Structure

During training, checkpoints are saved by step under `config.checkpoint_dir`:

```text
checkpoints/
  pi05_lerobot_datasets0314/
    lerobot_datasets0314_finetune/
      0/
      1000/
      20000/
      28000/
      ...
```

Each step directory contains:

| File | Description |
| --- | --- |
| `model.safetensors` | Model weights |
| `optimizer.pt` | Optimizer state |
| `metadata.pt` | Training metadata |
| `assets/...` | Optional normalization stats |

## Resume Training

Resume training from the latest checkpoint:

```bash
uv run scripts/train_pytorch.py pi05_lerobot_datasets0314 \
  --exp_name pi05_lerobot_run1 \
  --resume
```

## JAX Training Alternative

```bash
uv run scripts/train.py pi05_lerobot_datasets0314 \
  --exp_name pi05_jax_run1
```

Most fine-tuning workflows can use the PyTorch script. Use this entry only when a JAX stack is explicitly required.

## Choose a Checkpoint

After training, select an appropriate step directory from `checkpoint_dir` for deployment. Recommendations:

- Prefer checkpoints after validation loss has converged, such as `20000` or `28000`
- Avoid checkpoints from the early training stage with very small step counts
- Specify the concrete step directory, such as `28000`, in the policy server script during deployment

## Training Notes

- Ensure the v2.1 dataset path matches the path configured in the config
- Before first training, check whether normalization stats have been generated or referenced correctly
- In multi-GPU training, `--nproc_per_node` should match the number of available GPUs
- Training logs and checkpoint paths are determined by both `--exp_name` and the config; use meaningful experiment names
