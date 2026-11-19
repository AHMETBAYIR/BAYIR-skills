"""Local ASR backends: whisper.cpp on CPU/GPU (portable), and an optional
Qualcomm AI Hub Whisper export on the Hexagon HTP (Android only)."""

from __future__ import annotations

import base64
import json
import os
import re
import shutil
import tempfile
import time
from dataclasses import dataclass
from pathlib import Path

import numpy as np
import soundfile as sf

from .subtitles import Cue, clean_text
from .util import eprint, run_cmd, which

SAMPLE_RATE = 16000
N_FFT = 400
HOP = 160
CHUNK_SAMPLES = 480000
N_MELS = 128


# --------------------------------------------------------------------------- #
# paths / environment
# --------------------------------------------------------------------------- #
def _first_existing(*paths: str | Path) -> Path | None:
    for p in paths:
        if not p:
            continue
        q = Path(os.path.expanduser(str(p)))
        if q.exists():
            return q
    return None


def model_dir() -> Path | None:
    """Directory holding the optional QNN Whisper encoder/decoder pair.

    Set ``YTT_WHISPER_MODEL_DIR`` to an AI Hub export, or drop one into
    ``${XDG_DATA_HOME:-~/.local/share}/ytt/models``. Any subdirectory that
    contains ``encoder.onnx`` and ``decoder.onnx`` is accepted. This backend is
    Android/Snapdragon only; everything else uses whisper.cpp.
    """
    env = os.environ.get("YTT_WHISPER_MODEL_DIR")
    candidates = [env] if env else []
    data_home = Path(os.environ.get("XDG_DATA_HOME") or (Path.home() / ".local" / "share"))
    base = data_home / "ytt" / "models"
    for p in candidates:
        if p:
            q = Path(os.path.expanduser(str(p)))
            if (q / "encoder.onnx").exists() and (q / "decoder.onnx").exists():
                return q
    if base.exists():
        for q in sorted(base.glob("*")):
            if (q / "encoder.onnx").exists() and (q / "decoder.onnx").exists():
                return q
    return None


def qnn_paths() -> dict:
    """Paths for the optional Android NPU backend; every one is overridable."""
    qnn = Path(os.path.expanduser(os.environ.get("YTT_QAIRT", "~/qairt/lib/aarch64-android")))
    ort = Path(os.path.expanduser(os.environ.get("YTT_ORT", "~/onnxruntime-qnn")))
    default_runner = Path(__file__).resolve().parent.parent / "bin" / "whisper_qnn_runner"
    runner = Path(os.path.expanduser(
        os.environ.get("YTT_WHISPER_RUNNER", str(default_runner))))
    return {"qnn": qnn, "ort": ort, "runner": runner, "model": model_dir()}


def qnn_missing() -> list[str]:
    p = qnn_paths()
    missing = []
    if not p["model"]:
        missing.append("Whisper QNN model (encoder.onnx/decoder.onnx)")
    if not p["runner"].exists():
        missing.append(f"runner {p['runner']}")
    if not (p["qnn"] / "libQnnHtp.so").exists():
        missing.append(f"QNN runtime {p['qnn']}/libQnnHtp.so")
    if not (p["ort"] / "libonnxruntime.so").exists():
        missing.append(f"ORT build {p['ort']}/libonnxruntime.so")
    return missing


def _qnn_env() -> dict:
    p = qnn_paths()
    ld = [str(p["qnn"]), str(p["ort"])]
    if os.environ.get("PREFIX"):
        ld.append(os.environ["PREFIX"] + "/lib")
    ld += ["/system/lib64", "/vendor/lib64", "/vendor/lib"]
    return {
        "LD_LIBRARY_PATH": ":".join(ld),
        "ADSP_LIBRARY_PATH": f"{p['qnn']};/vendor/lib/rfsa/adsp;/vendor/dsp/cdsp",
        "LD_PRELOAD": "/system/lib64/libbinder_ndk.so",
        "YTT_QNN_ACTIVE": "1",
    }


# --------------------------------------------------------------------------- #
# Whisper tokenizer (tiktoken; the tokenizers wheel is broken on Python 3.14)
# --------------------------------------------------------------------------- #
class WhisperTokens:
    _pat = (r"""'s|'t|'re|'ve|'m|'ll|'d| ?\p{L}+| ?\p{N}+| ?[^\s\p{L}\p{N}]+|"""
            r"""\s+(?!\S)|\s+""")

    def __init__(self, model_dir_: Path):
        import tiktoken
        tok_path = _asset_path(model_dir_, "multilingual.tiktoken")
        if tok_path is None:
            raise RuntimeError("multilingual.tiktoken not found (set YTT_TOKENIZER)")
        ranks = {}
        with open(tok_path, encoding="utf-8") as f:
            for line in f:
                k, v = line.split()
                ranks[base64.b64decode(k)] = int(v)
        self.enc = tiktoken.Encoding(
            name="whisper-multilingual", pat_str=self._pat, mergeable_ranks=ranks,
            special_tokens={"<|endoftext|>": 50257, "<|startoftranscript|>": 50258},
        )
        self.lang_ids: dict[str, int] = {}
        tok_json = model_dir_ / "tokenizer.json"
        if tok_json.exists():
            try:
                data = json.loads(tok_json.read_text(encoding="utf-8"))
                for item in data.get("added_tokens") or []:
                    content = item.get("content") or ""
                    m = re.fullmatch(r"<\|([a-zA-Z_-]+)\|>", content)
                    if m and 50259 <= int(item.get("id", 0)) <= 50356:
                        self.lang_ids[m.group(1).lower()] = int(item["id"])
            except Exception:  # noqa: BLE001
                pass
        # Always have the common codes even if tokenizer.json is absent.
        for code, tid in {
            "en": 50259, "zh": 50260, "de": 50261, "es": 50262, "ru": 50263,
            "ko": 50264, "fr": 50265, "ja": 50266, "pt": 50267, "tr": 50268,
            "pl": 50269, "ca": 50270, "nl": 50271, "ar": 50272, "sv": 50273,
            "it": 50274, "id": 50275, "hi": 50276, "fi": 50277, "vi": 50278,
            "he": 50279, "uk": 50280, "el": 50281, "ms": 50282, "cs": 50283,
            "ro": 50284, "da": 50285, "hu": 50286, "ta": 50287, "no": 50288,
            "th": 50289, "ur": 50290, "hr": 50291, "bg": 50292, "lt": 50293,
            "la": 50294, "mi": 50295, "ml": 50296, "cy": 50297, "sk": 50298,
            "te": 50299, "fa": 50300, "lv": 50301, "bn": 50302, "sr": 50303,
            "az": 50304, "sl": 50305, "kn": 50306, "et": 50307, "mk": 50308,
            "br": 50309, "eu": 50310, "is": 50311, "hy": 50312, "ne": 50313,
            "mn": 50314, "bs": 50315, "kk": 50316, "sq": 50317, "sw": 50318,
            "gl": 50319, "mr": 50320, "pa": 50321, "si": 50322, "km": 50323,
            "sn": 50324, "yo": 50325, "so": 50326, "af": 50327, "oc": 50328,
            "ka": 50329, "be": 50330, "tg": 50331, "sd": 50332, "gu": 50333,
            "am": 50334, "yi": 50335, "lo": 50336, "uz": 50337, "fo": 50338,
            "ht": 50339, "ps": 50340, "tk": 50341, "nn": 50342, "mt": 50343,
            "sa": 50344, "lb": 50345, "my": 50346, "bo": 50347, "tl": 50348,
            "mg": 50349, "as": 50350, "tt": 50351, "haw": 50352, "ln": 50353,
            "ha": 50354, "ba": 50355, "jw": 50356,
        }.items():
            self.lang_ids.setdefault(code, tid)

    def lang_id(self, language: str | None) -> int | None:
        if not language:
            return None
        code = language.lower().replace("_", "-")
        if code.startswith("zh"):
            return self.lang_ids.get("zh")
        base = code.split("-")[0]
        return self.lang_ids.get(base)

    def decode(self, tokens: list[int]) -> str:
        keep = [int(t) for t in tokens if 0 <= int(t) < 50257]
        if not keep:
            return ""
        try:
            text = self.enc.decode(keep)
        except Exception:  # noqa: BLE001
            text = ""
            for t in keep:
                try:
                    text += self.enc.decode([t])
                except Exception:  # noqa: BLE001
                    pass
        return clean_text(text)


# --------------------------------------------------------------------------- #
# audio + features
# --------------------------------------------------------------------------- #
def audio_duration(path: Path) -> float:
    info = sf.info(str(path))
    return float(info.frames) / float(info.samplerate or SAMPLE_RATE)


def load_audio(path: Path) -> np.ndarray:
    audio, sr = sf.read(str(path), dtype="float32", always_2d=False)
    if getattr(audio, "ndim", 1) > 1:
        audio = audio.mean(axis=1)
    audio = np.asarray(audio, dtype=np.float32)
    if sr != SAMPLE_RATE:
        from scipy.signal import resample_poly
        g = np.gcd(int(sr), SAMPLE_RATE)
        audio = resample_poly(audio, SAMPLE_RATE // g, int(sr) // g).astype(np.float32)
    return audio


def _asset_path(model_dir_: Path, name: str) -> Path | None:
    env = os.environ.get("YTT_" + name.upper().replace(".", "_"))
    candidates = [env] if env else []
    candidates += [
        model_dir_ / name,
        Path(__file__).resolve().parent.parent / "models" / "whisper-turbo" / name,
        model_dir_.parent / name,
    ]
    for c in candidates:
        if c and Path(c).exists():
            return Path(c)
    return None


def _mel_filters(model_dir_: Path) -> np.ndarray:
    p = _asset_path(model_dir_, "mel_filters.npz")
    if p is None:
        raise RuntimeError("mel_filters.npz not found (set YTT_MEL_FILTERS_NPZ)")
    z = np.load(p)
    return z["mel_128"].astype(np.float32)


def extract_features(audio: np.ndarray, mel: np.ndarray) -> np.ndarray:
    n = CHUNK_SAMPLES
    a = np.zeros(n, dtype=np.float32)
    m = min(len(audio), n)
    a[:m] = audio[:m]
    padded = np.pad(a, (N_FFT // 2, N_FFT // 2), mode="reflect")
    frames = np.lib.stride_tricks.sliding_window_view(padded, N_FFT)[::HOP]
    window = (0.5 - 0.5 * np.cos(2 * np.pi * np.arange(N_FFT) / N_FFT)).astype(np.float32)
    spec = np.fft.rfft(frames * window, axis=1)
    mag = (np.abs(spec) ** 2).astype(np.float32).T  # 201 x 3001
    mag = mag[:, :-1]                                # 201 x 3000
    mel_spec = mel @ mag
    log_spec = np.log10(np.maximum(mel_spec, 1e-10))
    log_spec = np.maximum(log_spec, log_spec.max() - 8.0)
    log_spec = (log_spec + 4.0) / 4.0
    return log_spec.astype(np.float32)


def quantize_features(features: np.ndarray, scale: float, zero_point: int) -> np.ndarray:
    q = np.rint(features / scale) + zero_point
    return np.clip(q, 0, 65535).astype("<u2")


def chunk_audio(audio: np.ndarray, max_len: float = 28.0,
                min_len: float = 7.0) -> list[tuple[int, int, bool]]:
    """Split at low-energy points. Returns (start_sample, end_sample, hard_cut)."""
    n = len(audio)
    max_s = int(max_len * SAMPLE_RATE)
    min_s = int(min_len * SAMPLE_RATE)
    if n <= max_s:
        return [(0, n, False)]

    frame = 320  # 20 ms
    count = n // frame
    if count < 3:
        return [(0, n, False)]
    rms = np.sqrt(np.mean(audio[: count * frame].reshape(count, frame) ** 2, axis=1))
    # Silence threshold adapts to the recording; never above a comfortable
    # speech level, never below the noise floor.
    thr = float(np.clip(np.percentile(rms, 18) * 1.6, 0.0035, 0.02))
    silent = rms < thr
    # Runs of at least 150 ms.
    min_run = 8
    runs: list[tuple[int, int]] = []
    i = 0
    while i < count:
        if silent[i]:
            j = i
            while j < count and silent[j]:
                j += 1
            if j - i >= min_run:
                runs.append((i, j))
            i = j
        else:
            i += 1

    out: list[tuple[int, int, bool]] = []
    start = 0
    while start < n:
        target = min(n, start + max_s)
        if target >= n:
            out.append((start, n, False))
            break
        lo = start + min_s
        hi = target
        best = None
        for a, b in runs:
            a_s, b_s = a * frame, b * frame
            if b_s <= lo or a_s >= hi:
                continue
            mid = (max(a_s, lo) + min(b_s, hi)) // 2
            if mid < lo:
                continue
            if best is None or mid > best:
                best = mid
        if best is not None and best > start + min_s:
            out.append((start, best, False))
            start = best
        else:
            out.append((start, target, True))
            start = target
    # Merge a tiny tail into the previous chunk.
    if len(out) >= 2 and (out[-1][1] - out[-1][0]) < int(1.5 * SAMPLE_RATE):
        s0, _, hard = out[-2]
        out[-2] = (s0, out[-1][1], hard)
        out.pop()
    return out


# --------------------------------------------------------------------------- #
# QNN Whisper
# --------------------------------------------------------------------------- #
@dataclass
class AsrResult:
    segments: list[Cue]
    language: str
    engine: str
    model: str
    audio_seconds: float
    elapsed_seconds: float
    details: dict


def transcribe_qnn(wav: Path, language: str | None = None, max_tokens: int = 180,
                   keep_work: bool = False, work_dir: Path | None = None) -> AsrResult:
    missing = qnn_missing()
    if missing:
        raise RuntimeError("QNN Whisper unavailable: " + ", ".join(missing))
    p = qnn_paths()
    md = p["model"]
    assert md is not None
    tok = WhisperTokens(md)
    mel = _mel_filters(md)
    meta = json.loads((md / "metadata.json").read_text(encoding="utf-8"))
    enc_in = meta["model_files"]["encoder.onnx"]["inputs"]["input_features"]
    scale = float(enc_in["quantization_parameters"]["scale"])
    zp = int(enc_in["quantization_parameters"]["zero_point"])

    audio = load_audio(wav)
    audio_seconds = len(audio) / SAMPLE_RATE
    chunks = chunk_audio(audio)
    lang_code = (language or "en").lower().split("-")[0]
    lid = tok.lang_id(lang_code)
    prefix = [50258]
    if lid is not None:
        prefix.append(lid)
    prefix += [50360, 50364]  # <|transcribe|>, <|notimestamps|>

    tmp_parent = Path.home() / ".tmp"
    tmp_parent.mkdir(parents=True, exist_ok=True)
    tmp = Path(work_dir) if work_dir else Path(tempfile.mkdtemp(prefix="ytt-asr-", dir=str(tmp_parent)))
    tmp.mkdir(parents=True, exist_ok=True)
    t0 = time.time()
    try:
        lines = []
        for i, (s, e, _hard) in enumerate(chunks):
            feats = extract_features(audio[s:e], mel)
            q = quantize_features(feats, scale, zp)
            fpath = tmp / f"chunk-{i:04d}.raw"
            fpath.write_bytes(q.tobytes(order="C"))
            lines.append(f"{fpath}\t{int(s / SAMPLE_RATE * 1000)}")
        list_path = tmp / "chunks.tsv"
        list_path.write_text("\n".join(lines) + "\n", encoding="utf-8")

        cmd = [str(p["runner"]), str(md / "encoder.onnx"), str(md / "decoder.onnx"),
               str(list_path), str(p["qnn"] / "libQnnHtp.so"),
               "--prefix", ",".join(str(x) for x in prefix),
               "--max-tokens", str(max_tokens)]
        env = _qnn_env()
        timeout = max(300, int(audio_seconds * 2) + 180)
        proc = run_cmd(cmd, timeout=timeout, env=env)
        rows = []
        for line in proc.stdout.splitlines():
            line = line.strip()
            if line.startswith("{"):
                rows.append(json.loads(line))
        if len(rows) != len(chunks):
            raise RuntimeError(f"runner returned {len(rows)}/{len(chunks)} chunks")
    finally:
        if not keep_work:
            shutil.rmtree(tmp, ignore_errors=True)

    segments: list[Cue] = []
    total_enc = total_dec = 0.0
    chunk_tokens = []
    for (s, e, hard), row in zip(chunks, rows):
        text = clean_asr_text(tok.decode(row.get("tokens") or []))
        chunk_tokens.append(len(row.get("tokens") or []))
        total_enc += float(row.get("encoder_ms") or 0)
        total_dec += float(row.get("decoder_ms") or 0)
        if not text:
            continue
        start_s = s / SAMPLE_RATE
        end_s = e / SAMPLE_RATE
        if segments and hard:
            text = _dedup_boundary(segments[-1].text, text)
        if text:
            segments.append(Cue(start_s, max(end_s, start_s + 0.3), text))
    if not segments:
        raise RuntimeError("Whisper produced no text (silent audio or model failure)")
    elapsed = time.time() - t0
    return AsrResult(
        segments=segments, language=lang_code, engine="qnn-whisper-large-v3-turbo",
        model=str(md), audio_seconds=audio_seconds, elapsed_seconds=elapsed,
        details={"chunks": len(chunks), "encoder_ms": round(total_enc, 1),
                 "decoder_ms": round(total_dec, 1),
                 "rtf": round(elapsed / max(0.001, audio_seconds), 3),
                 "prefix": prefix, "chunk_tokens": chunk_tokens},
    )


def clean_asr_text(text: str) -> str:
    text = clean_text(text)
    words = text.split()
    out = []
    emphasis = {"very", "really", "no", "yes", "never", "bye", "ha", "haha", "so"}
    for w in words:
        key = re.sub(r"^[^\w]+|[^\w]+$", "", w.lower())
        if out:
            prev = re.sub(r"^[^\w]+|[^\w]+$", "", out[-1].lower())
            if key and key == prev and key not in emphasis:
                continue
        out.append(w)
    return " ".join(out).strip()


def _dedup_boundary(prev: str, text: str, max_words: int = 24) -> str:
    a = prev.split()
    b = text.split()
    for k in range(min(len(a), len(b), max_words), 0, -1):
        if [w.lower().strip(".,!?;:") for w in a[-k:]] == [w.lower().strip(".,!?;:") for w in b[:k]]:
            return " ".join(b[k:])
    return text


# --------------------------------------------------------------------------- #
# whisper.cpp
# --------------------------------------------------------------------------- #
def whispercpp_paths() -> dict:
    data_home = Path(os.environ.get("XDG_DATA_HOME") or (Path.home() / ".local" / "share"))
    root = Path(os.path.expanduser(os.environ.get(
        "YTT_WHISPERCPP_DIR", str(data_home / "ytt" / "whisper.cpp"))))
    env_bin = os.environ.get("YTT_WHISPERCPP_BIN")
    if env_bin:
        bin_ = Path(os.path.expanduser(env_bin))
    else:
        found = which("whisper-cli") or which("whisper.cpp")
        bin_ = Path(found) if found else root / "build" / "bin" / "whisper-cli"
    model = os.environ.get("YTT_WHISPERCPP_MODEL")
    candidates = [model] if model else []
    candidates += [str(root / "models/ggml-small.bin"), str(root / "models/ggml-base.bin"),
                   str(root / "models/ggml-tiny.en.bin")]
    found = _first_existing(*[c for c in candidates if c])
    return {"bin": bin_, "model": found, "dir": root}


def whispercpp_missing() -> list[str]:
    p = whispercpp_paths()
    missing = []
    if not p["bin"].exists():
        missing.append(f"whisper-cli {p['bin']}")
    if not p["model"]:
        missing.append("whisper.cpp GGML model (ggml-small.bin)")
    return missing


def transcribe_whispercpp(wav: Path, language: str | None = None,
                          timeout: int = 3600) -> AsrResult:
    missing = whispercpp_missing()
    if missing:
        raise RuntimeError("whisper.cpp unavailable: " + ", ".join(missing))
    p = whispercpp_paths()
    audio = load_audio(wav)
    audio_seconds = len(audio) / SAMPLE_RATE
    tmp = Path(tempfile.mkdtemp(prefix="ytt-wcpp-"))
    t0 = time.time()
    try:
        out = tmp / "out"
        cmd = [str(p["bin"]), "-m", str(p["model"]), "-f", str(wav),
               "-l", (language or "auto").split("-")[0], "-oj", "-of", str(out),
               "-np", "-t", str(min(8, os.cpu_count() or 4))]
        run_cmd(cmd, timeout=timeout)
        data = json.loads((tmp / "out.json").read_text(encoding="utf-8"))
        segs = []
        for item in data.get("transcription") or []:
            off = item.get("offsets") or {}
            start = float(off.get("from", 0)) / 1000.0
            end = float(off.get("to", start * 1000 + 1000)) / 1000.0
            text = clean_asr_text(item.get("text") or "")
            if text:
                segs.append(Cue(start, max(end, start + 0.2), text))
        if not segs:
            raise RuntimeError("whisper.cpp produced no text")
        elapsed = time.time() - t0
        return AsrResult(
            segments=segs, language=(language or "auto"), engine="whisper.cpp",
            model=str(p["model"]), audio_seconds=audio_seconds, elapsed_seconds=elapsed,
            details={"rtf": round(elapsed / max(0.001, audio_seconds), 3)},
        )
    finally:
        shutil.rmtree(tmp, ignore_errors=True)


def transcribe(wav: Path, language: str | None = None, engine: str = "auto") -> AsrResult:
    engine = (engine or "auto").lower()
    if engine in ("auto", "qnn", "htp"):
        if not qnn_missing():
            return transcribe_qnn(wav, language=language)
        if engine != "auto":
            raise RuntimeError("QNN Whisper unavailable: " + ", ".join(qnn_missing()))
    if engine in ("auto", "whispercpp", "cpu", "whisper.cpp"):
        return transcribe_whispercpp(wav, language=language)
    raise RuntimeError(f"unknown ASR engine: {engine}")
