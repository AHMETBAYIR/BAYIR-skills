---
name: youtube-transcripts
description: "Use when a task involves a YouTube video or video research: fetch a transcript, search YouTube, extract captions for an agent, or transcribe a video that has no captions (YouTube transkripti, video transkripti, altyazı çek, konuşmayı yazıya dök). Runs the local `ytt` CLI (captions first, then Whisper on the Hexagon HTP or whisper.cpp on CPU) and integrates with the `rk` research corpus."
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
   └─ no usable captions ──► yt-dlp audio ──► 16 kHz WAV ──► Whisper
                                                              ├─ QNN/HTP large-v3-turbo (default)
                                                              └─ whisper.cpp small (CPU fallback)
```

## 0. When to use / not use

Use when:

- the user gives a YouTube URL (`youtube.com/watch`, `youtu.be`, Shorts, live);
- a research question needs a talk, lecture, interview, demo, or conference video;
- the agent needs a transcript in a context window, SRT, or JSON;
- a video has no captions and must be transcribed locally.

Do **not** use when the video is private, age-gated without cookies, or the user
needs word-level alignment for production subtitles. `ytt` gives segment-level
timestamps, and QNN ASR is chunk-level (~20–28 s).

## 1. Quick start

```bash
ytt doctor --probe                 # dependencies + live YouTube check
ytt info 'https://youtu.be/ID'     # title, duration, caption tracks
ytt get 'https://youtu.be/ID' --timestamps
ytt get 'https://youtu.be/ID' --json
ytt fetch 'https://youtu.be/ID' --save-dir ~/notes/transcripts
```

`ytt` is installed at `$PREFIX/bin/ytt`; the project is `~/yt-transcript`.
Direct caption URLs are fetched with curl_cffi's Chrome TLS fingerprint first
and fall back to urllib (then yt-dlp), which avoids some signed-URL 403s.

For an agent, prefer JSON:

```bash
ytt get "$URL" --json --quiet > /tmp/video.json
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

# ignore captions and force local ASR
ytt get "$URL" --force-asr --engine qnn --json

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

## 4. Integrate with the research corpus (`rk`)

`rk` now treats YouTube as a first-class source.

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

## 5. Local ASR engines

### QNN / HTP (default)

- Model: Qualcomm AI Hub **Whisper-large-v3-turbo-quantized**, w8a16, HTP V79.
- Runtime: ORT 1.30 QNN EP + QAIRT 2.50.
- Measured on this phone: 8.5 min video in ~63 s (RTF ~0.12, ~8× real time);
  3.2 min Turkish video in ~27 s (RTF ~0.14).
- Output: one segment per ~20–28 s audio chunk; no word timestamps.
- The runner loads the encoder/decoder once and processes all chunks in one
  process (`~/yt-transcript/bin/whisper_qnn_runner`).

Check it:

```bash
ytt doctor
# whisper-qnn    ready
# whisper-model  .../whisper_large_v3_turbo_quantized-...
# htp-runtime    .../qairt-2.50/lib/aarch64-android
```

### whisper.cpp (CPU fallback)

- Model: `ggml-small.bin` multilingual (or `ggml-base.bin`).
- Binary: `~/npu-tests/whisper-test/whisper.cpp/build-cpu/bin/whisper-cli`.
- Use when QNN is unavailable, or `--engine whispercpp`.
- Lower accuracy than large-v3-turbo, but portable and still faster than
  real time on this device.

```bash
curl -L --fail -o ~/npu-tests/whisper-test/whisper.cpp/models/ggml-small.bin \
  https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-small.bin
```

## 6. Model choice: why Whisper large-v3-turbo?

Checked against the Hugging Face ASR landscape and the Open ASR Leaderboard
(Oct–Nov 2026):

| Model | Turkish | On-device fit | Verdict |
|---|---|---|---|
| Whisper large-v3-turbo | **9.0 FLEURS WER** (one measured table) | 809 M; validated QNN HTP artifact already on this phone | **default** |
| NVIDIA Parakeet TDT 0.6B v3 / ultra | **not supported** (25 European languages, no Turkish) | NeMo/GGUF; no local HTP artifact | English/European only |
| Qwen3-ASR 0.6B / 1.7B | 0.6B ~16.7 WER; 1.7B competitive but 147 RTFx class | vLLM/Transformers; no HTP QNN export | not for this device yet |
| NVIDIA Canary 1B v2 | 25 European languages, translation focus | 1B, NeMo; no HTP artifact | translation workflows |
| NVIDIA Nemotron 3.5 Transcribe 30B-A3B | supported | 30B MoE | too large for phone |
| Moonshine / Kyutai STT | English (Kyutai: en/fr) | small/fast | wrong language coverage |

Sources:

- Open ASR Leaderboard / model cards: <https://huggingface.co/openai/whisper-large-v3-turbo>,
  <https://huggingface.co/nvidia/parakeet-tdt-0.6b-v3>,
  <https://huggingface.co/Qwen/Qwen3-ASR-1.7B>
- Parakeet v3 language list and Turkish exclusion: <https://www.yaps.ai/blog/parakeet-vs-whisper>
- Turkish/Macedonian routing measurements: <https://github.com/anomalyco/hex/blob/dev/docs/research/language-recommendations-european.md>

Conclusion: **Whisper large-v3-turbo is the right default for a Turkish +
English agent on this phone**, because it is the only strong multilingual model
with an already-validated Hexagon artifact. Parakeet is not a Turkish option;
Qwen3-ASR needs a different runtime and export; Canary is for translation.

If you add Parakeet later, use it only when the detected language is in its 25
European languages and keep Whisper as the fallback.

## 7. Troubleshooting

| Symptom | Cause | Action |
|---|---|---|
| `yt-dlp not found` | missing dependency | `pkg install yt-dlp` |
| `ffmpeg not found` | missing dependency | `pkg install ffmpeg` |
| No captions, ASR skipped | `--no-asr` or caption-only | remove the flag or use `--force-asr` |
| `HTTP Error 429` on captions | YouTube rate limit | wait, retry, or let ASR fall back |
| `HTTP Error 403` on captions | signed URL rejected | curl_cffi retry is automatic; then pass `--cookies cookies.txt` |
| `sign in to confirm you're not a bot` | YouTube bot wall | pass `--cookies cookies.txt`; do not scrape aggressively |
| `QNN Whisper unavailable` | model/runner/runtime missing | `ytt doctor`; check `YTT_*` env vars |
| `loadRemoteSymbols failed 4000` | HTP transport/skel | check `ADSP_LIBRARY_PATH`, V79 skel, reboot/quiesce |
| ASR text is wrong language | metadata wrong or `--asr-lang` wrong | pass `--asr-lang tr` / `--asr-lang en` |
| ASR timestamps too coarse | chunk-level design | use captions, or whisper.cpp `-oj` output |
| `no usable captions` | video has none and ASR failed | inspect `ytt doctor`, retry, or download audio manually |

Do not edit `/odm`, `/vendor`, SELinux, or system libraries to fix ASR. The
validated path is userspace only.

## 8. Evidence checklist

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

## 9. Compared with MarkItDown's YouTube converter

MarkItDown 0.1.9 (`pip install markitdown[youtube]`) is a general
file/URL-to-Markdown converter. Its YouTube path is a thin wrapper around
`youtube-transcript-api` plus the video's HTML metadata.

| | MarkItDown | `ytt` |
|---|---|---|
| Caption fetch | `youtube-transcript-api` | yt-dlp metadata + direct captions |
| No captions | no ASR; metadata/HTML fallback | downloads audio + Whisper (QNN/CPU) |
| Timestamps | none (one paragraph) | segment timestamps, SRT/VTT |
| Structured output | Markdown only | JSON, text, Markdown, SRT, VTT |
| Rolling-caption cleanup | none | dedup/stutter repair |
| Language choice | Python kwarg only | `--lang`, `--asr-lang` |
| Cache | no | yes |
| YouTube metadata | description, keywords, views, runtime | channel, date, duration, language, chapters, source |
| Robustness | needs the HTML page; may return footer HTML | player clients, cookies/proxy, retries |
| Cost | ~4 s, no models | captions ~4 s; ASR ~0.12× video length |

Use MarkItDown when you already have a document pipeline and only need compact
Markdown from a captioned video. Use `ytt` for agent evidence: timestamps,
structured JSON, missing-caption transcription, and `rk` ingestion.

## 10. Files and environment

```text
~/yt-transcript/                 project + CLI
~/yt-transcript/bin/ytt          wrapper (on PATH after install.sh)
~/yt-transcript/bin/whisper_qnn_runner
~/.cache/yt-transcript/<id>/     meta.json, transcript.*.json, transcript.txt/.srt
```

Overrides:

```text
YTT_CACHE                  cache directory
YTT_WHISPER_MODEL_DIR      AI Hub encoder.onnx/decoder.onnx directory
YTT_QAIRT                  QAIRT 2.50 lib/aarch64-android
YTT_ORT                    ORT 1.30 build directory
YTT_WHISPER_RUNNER         whisper_qnn_runner path
YTT_WHISPERCPP_DIR         whisper.cpp checkout
YTT_WHISPERCPP_MODEL       GGML model path
YTT_BIN                    ytt path used by rk
```

Rebuild/install:

```bash
~/yt-transcript/install.sh
```
