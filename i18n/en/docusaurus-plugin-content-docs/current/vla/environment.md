---
title: Environment and Project Setup
sidebar_position: 4
---

# OpenPI Environment and Project Setup

The KMD VLA deployment uses two projects:

| Project | Installation host | Purpose |
| --- | --- | --- |
| `openpi-kmd` | GPU training/inference server | Train models, load checkpoints, run the policy server, and run the real-robot inference client |
| `vlahost` | Robot ROS 2 host | Convert ROS 2 state and camera topics into HTTP APIs and receive model actions |

## 1. Get the Projects

Clone OpenPI KMD on the GPU server:

```bash
git clone https://github.com/KLMmotion/openpi-kmd.git
cd openpi-kmd
```

Clone vlahost on the robot:

```bash
git clone https://github.com/KLMmotion/vlahost.git
```

Record the deployed commit so that code, model, and documentation updates can be reproduced against the same version.

## 2. Install openpi-kmd

`openpi-kmd` requires Python 3.11 or later and uses `uv` for environment management:

```bash
cd openpi-kmd
uv sync
```

`uv sync` creates the environment from `pyproject.toml` and `uv.lock`. Run subsequent commands through `uv run` to avoid accidentally using the system Python:

```bash
uv run python --version
```

Main project entry points:

| File | Purpose |
| --- | --- |
| `scripts/train_pytorch.py` | PyTorch model training |
| `scripts/train.py` | JAX / Flax model training |
| `scripts/compute_norm_stats.py` | Compute state and action normalization statistics |
| `scripts/serve_policy_kmd_joint.py` | Load a KMD 16D joint-space checkpoint and start the policy server |
| `vla_helpers/openpi_client_policy_http_kmd_joint.py` | Read vlahost state, query the policy, and send actions |
| `vla_helpers/openpi_policy_shared.py` | Shared KMD policy data-processing logic |

## 3. Check the GPU Environment

Training and the policy server require an NVIDIA GPU. After synchronizing the environment, verify that PyTorch and JAX detect it:

```bash
uv run python -c "import torch; print(torch.cuda.is_available(), torch.cuda.device_count())"
uv run python -c "import jax; print(jax.devices())"
```

If no GPU is listed, check the NVIDIA driver, CUDA compatibility, and current-user permissions before training or deployment.

## 4. Docker Setup (Optional)

The project also provides Docker configuration. Docker helps isolate dependencies but is not required. GPU containers require:

- Docker Engine, preferably in rootless mode.
- NVIDIA Container Toolkit.
- A non-Snap Docker installation because the Snap package is incompatible with NVIDIA Container Toolkit.
- No Docker Desktop, which is also incompatible with the NVIDIA runtime configuration used by this project.

For Ubuntu 22.04, refer to these project scripts:

```text
scripts/docker/install_docker_ubuntu22.sh
scripts/docker/install_nvidia_container_toolkit.sh
```

Build and start the project container:

```bash
docker compose -f scripts/docker/compose.yml up --build
```

Run a specific example:

```bash
docker compose -f examples/<example_name>/compose.yml up --build
```

The first build downloads and installs dependencies and can take a while. Later runs reuse the image cache.

## 5. Install vlahost on the Robot

Place `vlahost` in the robot ROS 2 workspace and build it:

```bash
ln -s /path/to/vlahost ~/ros_ws/src/vlahost
cd ~/ros_ws
colcon build --packages-select vlahost
source install/setup.bash
```

The robot environment must provide `rclpy`, `FastAPI`, `uvicorn`, `pinocchio`, and the project message package `marvin_msgs`. If the build succeeds but the node reports a missing Python module, install that dependency in the active robot ROS 2 environment.

## 6. Network Requirements

- The GPU server must reach the robot-side `vlahost` HTTP port, default `8000`.
- The inference client must reach the OpenPI policy-server WebSocket port, default `8000`.
- If the policy server and inference client run on the same GPU server, set `--policy-host` to `localhost`.
- When the robot and GPU server are separate, confirm that firewalls and switches do not block the required ports.

## Project References

- [KLMmotion/openpi-kmd](https://github.com/KLMmotion/openpi-kmd): OpenPI KMD environment, training, policy-server, and client source.
- [KLMmotion/vlahost](https://github.com/KLMmotion/vlahost): Robot-side ROS 2 HTTP bridge service.
