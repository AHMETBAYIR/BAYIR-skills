# yt-transcript (`ytt`)

Agent-friendly YouTube transcripts for Linux, macOS and Android/Termux.

1. Fetch manual or automatic YouTube captions first (fast, no ASR).
2. If no usable captions, download the audio and transcribe it locally.
3. Local ASR runs on whisper.cpp (CPU, or whatever backend your build of it
   supports). On Snapdragon Android devices an AI Hub Whisper-large-v3-turbo
   export can run on the Hexagon HTP instead — see *Local ASR paths*.

## Quick start

```bash
./bin/ytt doctor --probe
./bin/ytt get 'https://youtu.be/jNQXAC9IVRw' --timestamps
./bin/ytt get 'https://youtu.be/jNQXAC9IVRw' --json
./bin/ytt fetch 'https://youtu.be/ID' --save-dir ~/notes/transcripts
```

Install the `ytt` command on `PATH`:

```bash
./install.sh          # links into ~/.local/bin, or $PREFIX/bin on Termux
ytt doctor
```

Requirements:

- **Python 3.10+** with `numpy`, `soundfile`, `scipy`, `tiktoken`, and
  optionally `curl_cffi` (Chrome TLS fingerprint for signed caption URLs).
  `pip install -r requirements.txt`, or let your distro packages provide them.
- **`yt-dlp`** and **`ffmpeg`** on `PATH`
  (`apt install yt-dlp ffmpeg` · `brew install yt-dlp ffmpeg` ·
  `pipx install yt-dlp` · `pkg install yt-dlp ffmpeg` on Termux).
- For local ASR without captions: a whisper.cpp build (`whisper-cli`) and a
  GGML model. The QNN path is optional and Android-only.

`ytt doctor` checks all of the above and tells you what is missing.

## Commands

```text
ytt fetch URL...        fetch + cache; default markdown
ytt get URL...          print transcript; default plain text
ytt info URL            metadata and available caption tracks
ytt search "query"      YouTube search (title, URL, duration)
ytt doctor [--probe]    check yt-dlp, ffmpeg, QNN, whisper.cpp
ytt cache [list|clear|path]
```

Useful flags:

```text
--json                  machine-readable record
--format md|text|json|srt|vtt
--timestamps            [HH:MM:SS] prefixes
--lang tr,en            preferred caption language
--asr-lang tr           spoken language for ASR (default: video metadata)
--force-asr             ignore captions
--no-asr                captions only
--engine auto|qnn|whispercpp
--start 120 --end 300   keep a time range
--max-chars 12000       truncate for a context window
--refresh               ignore the cache
--keep-audio            keep the 16 kHz WAV in the cache
```

## Output

`--json` returns:

```json
{
  "ok": true,
  "video": {"id": "...", "title": "...", "channel": "...", "duration_s": 510,
            "upload_date": "2024-10-21", "language": "en"},
  "transcript": {
    "source": "manual|auto|asr",
    "language": "en",
    "engine": "youtube|qnn-whisper-large-v3-turbo|whisper.cpp",
    "text": "...",
    "segments": [{"start": 0.0, "end": 24.4, "text": "..."}],
    "word_count": 1559,
    "asr": {"audio_seconds": 510.6, "elapsed_seconds": 62.7, "rtf": 0.123}
  },
  "paths": {"json": "...", "txt": "...", "srt": "..."}
}
```

## Local ASR paths

| Engine | Runtime | Model | Notes |
|---|---|---|---|
| `whispercpp` | whisper.cpp (`whisper-cli`) | any GGML model, e.g. `ggml-small.bin` | **portable default**; CPU, plus Metal/CUDA if your build has it |
| `qnn` | ONNX Runtime QNN EP + QAIRT | AI Hub Whisper-large-v3-turbo w8a16 | **optional, Android only**; Snapdragon HTP |

`--engine auto` (the default) picks `qnn` when a QNN model, runner and runtime
are all present, otherwise `whispercpp`.

For the CPU path, install whisper.cpp and download a model once:

```bash
git clone https://github.com/ggerganov/whisper.cpp
cd whisper.cpp && cmake -B build && cmake --build build -j
mkdir -p ~/.local/share/ytt/whisper.cpp/models
curl -L --fail -o ~/.local/share/ytt/whisper.cpp/models/ggml-small.bin \
  https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-small.bin
```

Point `YTT_WHISPERCPP_BIN` at the binary and `YTT_WHISPERCPP_MODEL` at a model
if you keep them elsewhere; `YTT_WHISPERCPP_DIR` relocates the whole tree.
Whisper-cli is also picked up from `PATH` automatically.

### Optional: Qualcomm NPU backend (Android)

Build the runner with `YTT_ORT_INCLUDE` / `YTT_ORT_LIB` pointing at an ONNX
Runtime build with the QNN execution provider, place an AI Hub
Whisper-large-v3-turbo export under `~/.local/share/ytt/models/` (or set
`YTT_WHISPER_MODEL_DIR`), and set `YTT_QAIRT` / `YTT_ORT` to the QAIRT runtime
and ORT build. `ytt doctor` reports missing pieces.

## Notes and limits

- Auto captions and ASR are **not verbatim primary evidence**. Label them and
  verify names, numbers and quotes against the audio or a manual transcript.
- QNN ASR timestamps are chunk-level (roughly every 20–28 s), not word-level;
  whisper.cpp gives segment-level times.
- `--lang` chooses the transcript language; if that caption track is missing,
  ASR transcribes the **spoken** language (from metadata) and the agent can
  translate. Use `--asr-lang` only to override the spoken language.
- Auto-caption text is cleaned for rolling duplicates, but YouTube ASR errors
  remain ("Oryon" → "Orion", "ARM" → "R").
- Respect YouTube's terms and rate limits. The tool uses yt-dlp; it does not
  bypass paywalls or private-video access.
- 429s on translated caption tracks are common; the tool retries via yt-dlp and
  then falls back to ASR.
