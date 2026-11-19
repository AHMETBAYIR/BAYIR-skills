# Tools

Source for the two CLIs that the skills in this repo drive. Both are plain
Python, work on **Linux, macOS and Android/Termux**, and install into
`~/.local/bin` (or `$PREFIX/bin` on Termux) without touching the system Python
beyond what you already have.

| Tool | Command | Used by | What it does |
|---|---|---|---|
| [`ytt`](ytt) | `ytt` | `skills/youtube-transcripts` | YouTube transcripts: captions first, local ASR when there are none, plus search and a cache. |
| [`ytc`](ytc) | `ytc` | `skills/youtube-comments` | YouTube comments: normalized JSONL, threads and replies, completeness receipt, summaries, filters. |

## Install

```bash
# transcripts
cd tools/ytt && ./install.sh
ytt doctor --probe

# comments (creates an isolated virtualenv)
cd tools/ytc && ./install.sh
ytc doctor --probe
```

Both installers pick the destination automatically:

| Host | Launcher goes to | Notes |
|---|---|---|
| Linux / macOS | `~/.local/bin` | override with `YTT_BIN_DIR` / `YTC_BIN_DIR` |
| Termux | `$PREFIX/bin` | detected via `$TERMUX_VERSION` or `/data/data/com.termux/files/usr` |

### Dependencies

| Needs | `ytt` | `ytc` |
|---|---|---|
| Python | 3.10+ | 3.10+ |
| System tools | `yt-dlp`, `ffmpeg`, `ffprobe` | — |
| Python packages | `numpy`, `soundfile`, `scipy`, `tiktoken`, optional `curl-cffi` | `youtube-comment-downloader`, `curl-cffi` |
| Local ASR (optional) | whisper.cpp `whisper-cli` + a GGML model | — |

```bash
# Debian / Ubuntu
sudo apt install yt-dlp ffmpeg python3-venv
# Fedora
sudo dnf install yt-dlp ffmpeg python3
# macOS
brew install yt-dlp ffmpeg
# Termux
pkg install yt-dlp ffmpeg python
```

`pip install -r requirements.txt` inside each folder covers the Python side;
`ytc/install.sh` does it for you in a virtualenv at
`${XDG_DATA_HOME:-~/.local/share}/ytc/venv`.

## Environment

| Variable | Used by | Purpose |
|---|---|---|
| `YTT_PYTHON`, `YTC_PYTHON` | launchers | force an interpreter |
| `YTC_VENV` | `ytc` | virtualenv location made by `install.sh` |
| `YTT_WHISPERCPP_DIR` / `_BIN` / `_MODEL` | `ytt` | whisper.cpp tree, `whisper-cli` binary, GGML model |
| `YTT_WHISPER_MODEL_DIR` | `ytt` | AI Hub Whisper export for the optional QNN path |
| `YTT_QAIRT`, `YTT_ORT`, `YTT_WHISPER_RUNNER` | `ytt` | QNN runtime, ONNX Runtime build, runner binary (Android) |
| `YTT_CACHE_DIR` | `ytt` | default `${XDG_CACHE_HOME:-~/.cache}/yt-transcript` |

`ytt doctor` and `ytc doctor` print what they found and what is missing.

## Notes

- **Android NPU support is optional.** The QNN/HTP path only builds and runs on
  Snapdragon Android devices with the Qualcomm AI Hub Whisper export and a
  QAIRT runtime. Everything else falls back to whisper.cpp, which is the
  portable default.
- **No network bypass.** Both tools use the public YouTube surface through
  `yt-dlp` / `youtube-comment-downloader`; they do not bypass paywalls, private
  videos or rate limits. Respect YouTube's terms.
- **Assets.** `ytt/models/whisper-turbo/` ships only the two small assets the
  code needs (`multilingual.tiktoken`, `mel_filters.npz`) plus provenance
  metadata — not the model weights.
- The QNN runner is built from `ytt/src/whisper_qnn_runner.cc`; the compiled
  binary is not committed.
- Licence: MIT, same as the rest of this repo.
