---
title: 模型训练
sidebar_position: 2
---

# PI0 / PI05 模型训练

数据集转换为 LeRobot v2.1 格式后，可使用 OpenPI 提供的 PyTorch 或 JAX 训练入口对 PI0 / PI05 模型进行微调。

## 训练入口

| 脚本 | 框架 | 推荐场景 |
| --- | --- | --- |
| `scripts/train_pytorch.py` | PyTorch | 日常微调（推荐） |
| `scripts/train.py` | JAX / Flax | 需要 JAX 生态时使用 |

PyTorch 训练依赖以下模块：

- `openpi.training.config`：训练配置
- `openpi.training.data_loader`：LeRobot v2.1 数据加载
- `openpi.models_pytorch.pi0_pytorch.PI0Pytorch`：模型定义

## 单 GPU 训练

```bash
uv run scripts/train_pytorch.py pi05_lerobot_datasets0314 \
  --exp_name pi05_lerobot_run1
```

## 多 GPU 训练（单节点）

```bash
torchrun --standalone --nnodes=1 --nproc_per_node=2 \
  scripts/train_pytorch.py pi05_lerobot_datasets0314 \
  --exp_name pi05_lerobot_run1
```

## 训练配置

`<config_name>`（如 `pi05_lerobot_datasets0314`）需在 `openpi.training.config` 中预先定义，配置项包括：

- 数据集路径
- batch size
- 训练步数
- 学习率调度
- checkpoint 保存目录（`checkpoint_dir`）

自定义数据集时，请复制现有 config 并修改数据集路径与 normalization stats 路径。

## Checkpoint 结构

训练过程中，checkpoint 按步数保存在 `config.checkpoint_dir` 下：

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

每个步数目录包含：

| 文件 | 说明 |
| --- | --- |
| `model.safetensors` | 模型权重 |
| `optimizer.pt` | 优化器状态 |
| `metadata.pt` | 训练元数据 |
| `assets/...` | 可选的 normalization stats |

## 断点续训

从最新 checkpoint 恢复训练：

```bash
uv run scripts/train_pytorch.py pi05_lerobot_datasets0314 \
  --exp_name pi05_lerobot_run1 \
  --resume
```

## JAX 训练（备选）

```bash
uv run scripts/train.py pi05_lerobot_datasets0314 \
  --exp_name pi05_jax_run1
```

大多数微调工作流使用 PyTorch 脚本即可；仅在明确需要 JAX 栈时再选用此入口。

## 选择 Checkpoint

训练完成后，从 `checkpoint_dir` 中选取合适的步数目录用于部署。选择建议：

- 优先使用验证 loss 收敛后的 checkpoint（如 `20000`、`28000`）
- 避免使用训练初期（步数过小）的 checkpoint
- 部署时在策略服务器脚本中指定具体步数目录，例如 `28000`

## 训练注意事项

- 确保 v2.1 数据集路径与 config 中配置一致
- 首次训练前检查 normalization stats 是否已生成或正确引用
- 多 GPU 训练时 `--nproc_per_node` 应与可用 GPU 数量匹配
- 训练日志与 checkpoint 路径由 `--exp_name` 与 config 共同决定，建议使用有意义的实验名称
