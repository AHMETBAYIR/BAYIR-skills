---
name: youtube-transcripts
description: "Use when a task involves a YouTube video or video research: fetch a transcript, search YouTube, extract captions for an agent, or transcribe a video that has no captions (YouTube transkripti, video transkripti, altyazı çek, konuşmayı yazıya dök). Runs the local `ytt` CLI (captions first, then local Whisper through whisper.cpp, or QNN/HTP on Snapdragon) and integrates with the optional `rk` research corpus."
---

# YouTube transcripts for agents

`ytt` turns a YouTube URL into clean, timestamped, agent-readable text. It is
caption-first because captions are cheap and often human-authored. Only when
captions are missing or unusable does it download audio and run a local ASR
model.

```
YouTube URL
   │
   ├─ yt-dlp metadata ──► manual captions? ──► use them
   │                         │
   │                         └─ auto captions? ──► clean rolling duplicates ──► use them
   │
   └─ no usable captions ──► yt-dlp audio ──► 16 kHz WAV ──► local ASR (auto)
                                                              ├─ whisper.cpp (CPU / Metal / CUDA)
                                                              └─ QNN/HTP (Snapdragon, optional, §8)
```

## 0. When to use / not use

Use when:

- the user gives a YouTube URL (`youtube.com/watch`, `youtu.be`, Shorts, live);
- a research question needs a talk, lecture, interview, demo, or conference video;
- the agent needs a transcript in a context window, SRT, or JSON;
- a video has no captions and must be transcribed locally.

Do **not** use when the video is private, age-gated without cookies, or the user
needs word-level alignment for production subtitles. `ytt` gives segment-level
timestamps, and chunked Whisper ASR lands at ~20–28 s per segment.

## 1. Quick start

```bash
ytt doctor --probe                 # dependencies + live YouTube check
ytt info 'https://youtu.be/ID'     # title, duration, caption tracks
ytt get 'https://youtu.be/ID' --timestamps
ytt get 'https://youtu.be/ID' --json
ytt fetch 'https://youtu.be/ID' --save-dir ~/notes/transcripts
```

The wrapper installs to `$HOME/.local/bin/ytt` on Linux/macOS and to
`$PREFIX/bin/ytt` on Termux; `install.sh` picks the prefix automatically. Source
layout, install and env vars are in *Files and environment*.

Direct caption URLs are fetched with curl_cffi's Chrome TLS fingerprint first
and fall back to urllib (then yt-dlp), which avoids some signed-URL 403s.

For an agent, prefer JSON:

```bash
ytt get "$URL" --json --quiet > "${TMPDIR:-/tmp}/video.json"
```

Then read:

- `video.title`, `video.channel`, `video.duration_s`, `video.language`
- `transcript.source` — `manual`, `auto`, or `asr`
- `transcript.language`, `transcript.engine`
- `transcript.segments[]` — `{start, end, text}`
- `transcript.text` — paragraph-joined text
- `transcript.asr` — audio seconds, elapsed seconds, RTF, chunk count (ASR only)

## 2. Choose the transcript path

```bash
# captions only; fail if none (fast, no audio)
ytt get "$URL" --no-asr --json

# ignore captions and force local ASR (engine auto-selected)
ytt get "$URL" --force-asr --json

# pin a specific engine (`whispercpp`, `qnn`, `none`)
ytt get "$URL" --force-asr --engine whispercpp --json

# keep the spoken language, request a different caption language if present
ytt get "$URL" --lang de --json

# a Turkish talk with no captions
ytt get "$URL" --force-asr --asr-lang tr --json
```

Rules:

- **Manual captions > auto captions > ASR.** Do not run Whisper just because it
  is available.
- `--lang` is the **transcript/caption language**. If that track is missing,
  ASR uses the **spoken** language from video metadata, not `--lang`. This
  prevents an English talk from being transcribed as German.
- `--asr-lang` overrides the spoken language only when metadata is wrong.
- If a video is music/noise, captions may be better than ASR even when auto.
- If yt-dlp hits 429, the tool falls back to ASR. Retry later for captions.

## 3. Accuracy and evidence discipline

This matters for research. A transcript is evidence only after you label how it
was produced.

| Source | Trust | What to do |
|---|---|---|
| `manual` | human-authored captions | quote normally; still check names/numbers |
| `auto` | YouTube ASR | label "auto captions"; verify names, numbers, jargon |
| `asr` | local Whisper | label "ASR"; verify quotes against audio before publishing |

Never present auto captions or ASR as a verbatim quote without checking. Common
failure modes:

- names and acronyms: "Oryon" → "Orion", "ARM" → "R", "SoC" → "SOC";
- Turkish suffixes and proper nouns: "HP" → "hiçbir", "hoparlör" → "apelör";
- sentence boundaries at chunk cuts; text is continuous but a segment may start
  mid-sentence;
- repeated words (`Snapdragon Snapdragon`) are cleaned, but emphasis
  (`very very`) is preserved.

Cite a video with a timestamp link:

```markdown
[Video title](https://youtu.be/ID?t=143) — auto captions, 02:23.
```

## 4. Integrate with the research corpus (`rk`, optional)

This section only applies if you have the `rk` research CLI installed. `rk`'s
source is not in this repo yet, so treat it as a bonus path: everything above
works without it. When present, `rk` treats YouTube as a first-class source.

```bash
# discover videos, then fetch and index the transcript
rk search "on-device LLM Snapdragon" -p video -n 8
rk fetch 'https://youtu.be/ID'

# transcripts are indexed with tier=video and searchable like any document
rk grep '"Hexagon" AND "offload"'
rk show <doc_id> --chars 12000
```

`rk fetch` calls `ytt get --json --quiet`, converts segments to
`[HH:MM:SS] text` markdown, and stores it with title/channel/date/language.
The canonical URL is normalized to `youtube.com/watch?v=ID`, so `youtu.be`
and `watch?v=` links deduplicate.

`rk search -p video` fans out over YouTube and the browser. The `youtube`
backend is not in `general`; use `-p video` or `-s youtube,browser` explicitly.

For comment sections and audience reception, use the `youtube-comments` skill
and `ytc`/`rk comments`. For slide/board/diagram pages, use `vnotes` and
`rk notes` (not a transcript tool). Do not confuse a transcript with a comment
or visual-notes digest: the transcript is what the video says; comments are what
viewers said about it; visual notes are what was shown.

## 5. Local ASR engine

`ytt` ships two ASR backends. `--engine auto` (the default) picks `qnn` when the
Android NPU stack is complete, otherwise `whispercpp`. Force one with
`--engine whispercpp|qnn|none`.

| Engine | Install | Best on |
|---|---|---|
| `whispercpp` | build whisper.cpp, set `YTT_WHISPERCPP_DIR` (or have `whisper-cli` on PATH) | **every platform**: CPU, macOS Metal, CUDA, Vulkan |
| `qnn` | Qualcomm AI Hub artifact + QNN runtime + runner | Snapdragon Hexagon NPU, Android only (§8) |
| `none` | — | captions only, never transcribe |

There is no Python ASR dependency and no model to download at import time: if a
model and `whisper-cli` are present, transcription works offline.

### whisper.cpp (CPU, Metal, CUDA)

- Model: `ggml-large-v3-turbo.bin` (~1.6 GB) is the quality reference point;
  `ggml-small.bin` (~466 MB) when RAM is tight.
- Binary: `~/whisper.cpp/build/bin/whisper-cli`; point `YTT_WHISPERCPP_DIR` at
  the checkout.
- No Python dependency, so it works where pip is not viable — and it is the
  portable default on every platform.

```bash
git clone https://github.com/ggml-org/whisper.cpp ~/whisper.cpp
cmake -S ~/whisper.cpp -B ~/whisper.cpp/build && \
  cmake --build ~/whisper.cpp/build -j
curl -L --fail -o ~/whisper.cpp/models/ggml-large-v3-turbo.bin \
  https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-large-v3-turbo.bin
```

Add `-DGGML_METAL=ON` (macOS) or `-DGGML_CUDA=ON` (NVIDIA) at configure time,
and `-DGGML_VULKAN=ON` for other GPUs. `--engine whispercpp` forces this path.

On Android/Termux a Snapdragon NPU is available in addition; that backend is
strictly optional and documented in §8.

## 6. Model choice: why Whisper large-v3-turbo?

Checked against the Hugging Face ASR landscape and the Open ASR Leaderboard
(Oct–Nov 2026):

| Model | Turkish | Footprint / runtime | Verdict |
|---|---|---|---|
| Whisper large-v3-turbo | **9.0 FLEURS WER** (one measured table) | 809 M, ~1.6 GB; faster-whisper, whisper.cpp, QNN | **default** |
| NVIDIA Parakeet TDT 0.6B v3 / ultra | **not supported** (25 European languages, no Turkish) | 0.6B; NeMo/GGUF, no QNN export | English/European only |
| Qwen3-ASR 0.6B / 1.7B | 0.6B ~16.7 WER; 1.7B competitive but 147 RTFx class | vLLM/Transformers only | needs a different runtime |
| NVIDIA Canary 1B v2 | 25 European languages, translation focus | 1B, NeMo | translation workflows |
| NVIDIA Nemotron 3.5 Transcribe 30B-A3B | supported | 30B MoE | too large for laptop or phone |
| Moonshine / Kyutai STT | English (Kyutai: en/fr) | small/fast | wrong language coverage |

Sources:

- Open ASR Leaderboard / model cards: <https://huggingface.co/openai/whisper-large-v3-turbo>,
  <https://huggingface.co/nvidia/parakeet-tdt-0.6b-v3>,
  <https://huggingface.co/Qwen/Qwen3-ASR-1.7B>
- Parakeet v3 language list and Turkish exclusion: <https://www.yaps.ai/blog/parakeet-vs-whisper>
- Turkish/Macedonian routing measurements: <https://github.com/anomalyco/hex/blob/dev/docs/research/language-recommendations-european.md>

Licences: Whisper code and weights MIT; Parakeet TDT v3 CC-BY-4.0; Canary 1B v2
CC-BY-NC-4.0 (non-commercial); Qwen3-ASR Apache-2.0. Re-read the model card
before shipping commercial output.

Conclusion: **Whisper large-v3-turbo is the right default for a Turkish +
English agent**, because it is the only strong multilingual model here with a
maintained runtime on every target platform — faster-whisper, whisper.cpp and
the QNN export; `ytt` implements the last two — and a permissive licence. Parakeet is not a Turkish option;
Qwen3-ASR needs a different runtime and export; Canary is for translation.

If you add Parakeet later, use it only when the detected language is in its 25
European languages and keep Whisper as the fallback.

## 7. Troubleshooting

| Symptom | Cause | Action |
|---|---|---|
| `yt-dlp not found` | missing dependency | install yt-dlp (`pipx install yt-dlp`, `brew`, distro package, or `pkg` on Termux) |
| `ffmpeg not found` | missing dependency | install ffmpeg from your package manager (`brew`, apt/dnf/pacman, `pkg`) |
| No captions, ASR skipped | `--no-asr` or caption-only | remove the flag or use `--force-asr` |
| `HTTP Error 429` on captions | YouTube rate limit | wait, retry, or let ASR fall back |
| `HTTP Error 403` on captions | signed URL rejected | curl_cffi retry is automatic; then pass `--cookies cookies.txt` |
| `sign in to confirm you're not a bot` | YouTube bot wall | pass `--cookies cookies.txt`; do not scrape aggressively |
| ASR text is wrong language | metadata wrong or `--asr-lang` wrong | pass `--asr-lang tr` / `--asr-lang en` |
| ASR timestamps too coarse | chunk-level design | use captions, or whisper.cpp `-oj` output |
| `no usable captions` | video has none and ASR failed | inspect `ytt doctor`, retry, or download audio manually |
| `ASR unavailable` | no engine installed | build whisper.cpp and set `YTT_WHISPERCPP_BIN`/`_MODEL` (§5) |

QNN/HTP-only symptoms (`QNN Whisper unavailable`, `loadRemoteSymbols failed
4000`) are in §8.

## 8. Optional: Qualcomm NPU backend (Android)

Everything in this section applies only to Android/Termux on a Snapdragon SoC
with a Hexagon NPU. It is never required: captions and whisper.cpp cover every
other platform, and `--engine auto` only picks QNN when
the runtime, the HTP skel and the model are all present.

### Engine and artifact

- Model: Qualcomm AI Hub **Whisper-large-v3-turbo-quantized**, w8a16, HTP V79.
- Runtime: ONNX Runtime 1.30 QNN EP + QAIRT 2.50.
- Measured on the author's Snapdragon phone: 8.5 min video in ~63 s (RTF ~0.12,
  ~8× real time); 3.2 min Turkish video in ~27 s (RTF ~0.14).
- Output: one segment per ~20–28 s audio chunk; no word timestamps.
- The runner loads the encoder/decoder once and processes all chunks in one
  process (`bin/whisper_qnn_runner`).
- `--engine qnn` forces it and fails loudly instead of falling back to CPU.

```bash
ytt doctor
# whisper-qnn    ready
# whisper-model  .../whisper_large_v3_turbo_quantized-...
# htp-runtime    .../qairt-2.50/lib/aarch64-android
```

### Environment (Android only)

```text
YTT_WHISPER_MODEL_DIR      AI Hub encoder.onnx/decoder.onnx directory
YTT_QAIRT                  QAIRT 2.50 lib/aarch64-android
YTT_ORT                    ORT 1.30 build directory
YTT_WHISPER_RUNNER         whisper_qnn_runner path
```

### NPU-specific troubleshooting

| Symptom | Cause | Action |
|---|---|---|
| `QNN Whisper unavailable` | model/runner/runtime missing | `ytt doctor`; check `YTT_*` env vars |
| `loadRemoteSymbols failed 4000` | HTP transport/skel | check `ADSP_LIBRARY_PATH`, V79 skel, reboot/quiesce |
| ASR runs at CPU speed | `auto` fell back off the NPU | `--engine qnn`; re-check skel and runtime |

Do not edit `/odm`, `/vendor`, SELinux, or system libraries to fix ASR. The
validated path is userspace only.

## 9. Evidence checklist

For a video used in a report, record:

```text
URL + video id, title, channel, upload date, duration
transcript source (manual / auto / asr), language, engine
timestamp link for each quote (youtu.be/ID?t=SECONDS)
whether names/numbers were checked against audio
ASR: model, audio seconds, elapsed seconds, RTF, chunk count
```

If the transcript came from ASR and the claim is quantitative, listen to the
timestamp before publishing. If you cannot, mark the claim unverified.

## 10. Compared with MarkItDown's YouTube converter

MarkItDown 0.1.9 (`pip install markitdown[youtube]`) is a general
file/URL-to-Markdown converter. Its YouTube path is a thin wrapper around
`youtube-transcript-api` plus the video's HTML metadata.

| | MarkItDown | `ytt` |
|---|---|---|
| Caption fetch | `youtube-transcript-api` | yt-dlp metadata + direct captions |
| No captions | no ASR; metadata/HTML fallback | downloads audio + local Whisper (whisper.cpp, or QNN on Snapdragon) |
| Timestamps | none (one paragraph) | segment timestamps, SRT/VTT |
| Structured output | Markdown only | JSON, text, Markdown, SRT, VTT |
| Rolling-caption cleanup | none | dedup/stutter repair |
| Language choice | Python kwarg only | `--lang`, `--asr-lang` |
| Cache | no | yes |
| YouTube metadata | description, keywords, views, runtime | channel, date, duration, language, chapters, source |
| Robustness | needs the HTML page; may return footer HTML | player clients, cookies/proxy, retries |
| Cost | ~4 s, no models | captions ~4 s; ASR ~0.1× video length on NPU, ~0.3–0.6× on CPU |

Use MarkItDown when you already have a document pipeline and only need compact
Markdown from a captioned video. Use `ytt` for agent evidence: timestamps,
structured JSON, missing-caption transcription, and `rk` ingestion.

## 11. Files and environment

```text
tools/ytt/                      CLI source (in this repo)
tools/ytt/bin/ytt               wrapper, runs straight from the checkout
$HOME/.local/bin/ytt            installed wrapper (Linux/macOS; $PREFIX/bin on Termux)
~/.cache/yt-transcript/<id>/    meta.json, transcript.*.json, transcript.txt/.srt
```

Overrides:

```text
YTT_CACHE                  cache directory
YTT_WHISPERCPP_DIR         whisper.cpp checkout
YTT_WHISPERCPP_MODEL       GGML model path
YTT_BIN                    ytt path used by rk
```

QNN-only variables are listed in §8. `YTT_BIN` pins the `ytt` path used by
`rk`.

Install — installer route (checks deps, drops the wrapper on PATH):

```bash
cd tools/ytt && ./install.sh
```

Plain pip route, no wrapper on PATH:

```bash
cd tools/ytt
python3 -m pip install -r requirements.txt
./bin/ytt doctor
```

Either way the external binaries `yt-dlp` and `ffmpeg` must be on PATH;
`ytt doctor` reports them.
