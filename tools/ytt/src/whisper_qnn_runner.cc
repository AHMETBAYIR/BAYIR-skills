#include <onnxruntime_cxx_api.h>
#include <chrono>
#include <cstdio>
#include <cstdlib>
#include <cstring>
#include <fstream>
#include <sstream>
#include <string>
#include <unordered_map>
#include <vector>

// Runs the Qualcomm AI Hub Whisper-large-v3-turbo QNN encoder/decoder
// wrappers on the HTP. One process handles a list of 30 s feature chunks so
// the ORT/QNN sessions are created only once.
//
// usage:
//   whisper_qnn_runner encoder.onnx decoder.onnx list.tsv backend.so \
//       [--prefix 50258,50268,50360,50364] [--max-tokens 180] [--eot 50257]
//
// list.tsv: one "<features.raw>\t<start_ms>" per line.
// Output: one JSON object per chunk on stdout.

struct Buf {
  std::vector<uint8_t> data;
  std::vector<int64_t> shape;
  ONNXTensorElementDataType type = ONNX_TENSOR_ELEMENT_DATA_TYPE_UNDEFINED;
  size_t bytes() const { return data.size(); }
};

static size_t esize(ONNXTensorElementDataType t) {
  switch (t) {
    case ONNX_TENSOR_ELEMENT_DATA_TYPE_UINT8:
    case ONNX_TENSOR_ELEMENT_DATA_TYPE_INT8: return 1;
    case ONNX_TENSOR_ELEMENT_DATA_TYPE_UINT16:
    case ONNX_TENSOR_ELEMENT_DATA_TYPE_INT16:
    case ONNX_TENSOR_ELEMENT_DATA_TYPE_FLOAT16: return 2;
    case ONNX_TENSOR_ELEMENT_DATA_TYPE_INT32:
    case ONNX_TENSOR_ELEMENT_DATA_TYPE_FLOAT: return 4;
    case ONNX_TENSOR_ELEMENT_DATA_TYPE_INT64: return 8;
    default: return 0;
  }
}

static Buf make_buf(const std::vector<int64_t>& shape, ONNXTensorElementDataType type) {
  Buf b; b.shape = shape; b.type = type;
  size_t n = 1; for (auto d : shape) n *= (size_t)d;
  b.data.assign(n * esize(type), 0);
  return b;
}

static Ort::Value tensor(Buf& b, const Ort::MemoryInfo& mem) {
  return Ort::Value::CreateTensor(mem, b.data.data(), b.data.size(), b.shape.data(),
                                  b.shape.size(), b.type);
}

static std::vector<int64_t> shape_of(Ort::Session& s, bool input, size_t i) {
  auto ti = input ? s.GetInputTypeInfo(i) : s.GetOutputTypeInfo(i);
  return ti.GetTensorTypeAndShapeInfo().GetShape();
}

static ONNXTensorElementDataType type_of(Ort::Session& s, bool input, size_t i) {
  auto ti = input ? s.GetInputTypeInfo(i) : s.GetOutputTypeInfo(i);
  return ti.GetTensorTypeAndShapeInfo().GetElementType();
}

static std::string name_of(Ort::Session& s, bool input, size_t i,
                           Ort::AllocatorWithDefaultOptions& alloc) {
  auto n = input ? s.GetInputNameAllocated(i, alloc) : s.GetOutputNameAllocated(i, alloc);
  return std::string(n.get());
}

static void copy_output(Ort::Value& v, Buf& b) {
  auto info = v.GetTensorTypeAndShapeInfo();
  b.shape = info.GetShape();
  b.type = info.GetElementType();
  size_t bytes = info.GetElementCount() * esize(b.type);
  b.data.resize(bytes);
  std::memcpy(b.data.data(), v.GetTensorData<void>(), bytes);
}

static std::vector<int> parse_ids(const std::string& s) {
  std::vector<int> out;
  std::stringstream ss(s);
  std::string part;
  while (std::getline(ss, part, ',')) {
    if (!part.empty()) out.push_back(std::atoi(part.c_str()));
  }
  return out;
}

int main(int argc, char** argv) {
  if (argc < 5) {
    fprintf(stderr,
            "usage: %s encoder.onnx decoder.onnx list.tsv backend.so "
            "[--prefix 50258,50268,50360,50364] [--max-tokens 180] [--eot 50257]\n",
            argv[0]);
    return 2;
  }
  const char* encoder_path = argv[1];
  const char* decoder_path = argv[2];
  const char* list_path = argv[3];
  const char* backend = argv[4];
  std::vector<int> prefix;
  int max_tokens = 180;
  int eot = 50257;
  for (int i = 5; i < argc; ++i) {
    std::string a = argv[i];
    if (a == "--prefix" && i + 1 < argc) prefix = parse_ids(argv[++i]);
    else if (a == "--max-tokens" && i + 1 < argc) max_tokens = std::atoi(argv[++i]);
    else if (a == "--eot" && i + 1 < argc) eot = std::atoi(argv[++i]);
    else { fprintf(stderr, "unknown argument: %s\n", a.c_str()); return 2; }
  }

  Ort::Env env(ORT_LOGGING_LEVEL_WARNING, "whisper-qnn");
  Ort::SessionOptions so;
  so.SetGraphOptimizationLevel(GraphOptimizationLevel::ORT_ENABLE_ALL);
  so.SetLogSeverityLevel(2);
  std::unordered_map<std::string, std::string> opts;
  opts["backend_path"] = backend;
  opts["htp_arch"] = "79";
  opts["soc_model"] = "69";
  opts["enable_htp_fp16_precision"] = "1";
  so.AppendExecutionProvider("QNN", opts);
  Ort::AllocatorWithDefaultOptions alloc;
  Ort::MemoryInfo mem = Ort::MemoryInfo::CreateCpu(OrtArenaAllocator, OrtMemTypeDefault);

  // Read the chunk list first so a malformed list fails before model load.
  struct Item { std::string path; long long start_ms; };
  std::vector<Item> items;
  {
    std::ifstream f(list_path);
    if (!f) { fprintf(stderr, "cannot open list: %s\n", list_path); return 2; }
    std::string line;
    while (std::getline(f, line)) {
      if (line.empty()) continue;
      size_t tab = line.find('\t');
      Item it;
      it.path = tab == std::string::npos ? line : line.substr(0, tab);
      it.start_ms = tab == std::string::npos ? 0 : std::atoll(line.substr(tab + 1).c_str());
      items.push_back(it);
    }
  }
  if (items.empty()) { fprintf(stderr, "empty list\n"); return 2; }

  try {
    auto t0 = std::chrono::steady_clock::now();
    Ort::Session enc(env, encoder_path, so);
    Ort::Session dec(env, decoder_path, so);
    auto t1 = std::chrono::steady_clock::now();
    fprintf(stderr, "session_init_ms=%.3f chunks=%zu prefix=%zu max_tokens=%d\n",
            std::chrono::duration<double, std::milli>(t1 - t0).count(),
            items.size(), prefix.size(), max_tokens);

    // Encoder input/output names.
    auto en = name_of(enc, true, 0, alloc);
    std::vector<std::string> eout_storage;
    std::vector<const char*> eout_names;
    for (size_t i = 0; i < enc.GetOutputCount(); ++i)
      eout_storage.push_back(name_of(enc, false, i, alloc));
    for (auto& n : eout_storage) eout_names.push_back(n.c_str());

    // Decoder input/output names, captured once.
    std::vector<std::string> din_storage, dout_storage;
    std::vector<const char*> din_names, dout_names;
    for (size_t i = 0; i < dec.GetInputCount(); ++i)
      din_storage.push_back(name_of(dec, true, i, alloc));
    for (size_t i = 0; i < dec.GetOutputCount(); ++i)
      dout_storage.push_back(name_of(dec, false, i, alloc));
    for (auto& n : din_storage) din_names.push_back(n.c_str());
    for (auto& n : dout_storage) dout_names.push_back(n.c_str());

    std::unordered_map<std::string, Buf> base_state;
    for (size_t i = 0; i < dec.GetInputCount(); ++i) {
      base_state[din_storage[i]] = make_buf(shape_of(dec, true, i), type_of(dec, true, i));
    }

    for (size_t ci = 0; ci < items.size(); ++ci) {
      const auto& item = items[ci];
      auto tc0 = std::chrono::steady_clock::now();
      Buf ein = make_buf(shape_of(enc, true, 0), type_of(enc, true, 0));
      std::ifstream f(item.path, std::ios::binary);
      if (!f) throw std::runtime_error("cannot open features " + item.path);
      f.read(reinterpret_cast<char*>(ein.data.data()), ein.data.size());
      if ((size_t)f.gcount() != ein.data.size())
        throw std::runtime_error("bad feature size " + item.path);

      std::vector<const char*> ein_names{en.c_str()};
      std::vector<Ort::Value> ein_vals;
      ein_vals.push_back(tensor(ein, mem));
      auto eouts = enc.Run(Ort::RunOptions{nullptr}, ein_names.data(), ein_vals.data(), 1,
                           eout_names.data(), eout_names.size());
      auto tc1 = std::chrono::steady_clock::now();

      std::unordered_map<std::string, Buf> enc_out;
      for (size_t i = 0; i < enc.GetOutputCount(); ++i) {
        Buf b; copy_output(eouts[i], b);
        enc_out[eout_storage[i]] = std::move(b);
      }

      // Fresh decoder state for this chunk. Cross caches come from the encoder;
      // self caches and the attention mask start at zero.
      auto state = base_state;
      for (auto& kv : state) {
        const std::string& n = kv.first;
        Buf& b = kv.second;
        if (n.find("cache_cross") != std::string::npos) {
          auto it = enc_out.find(n);
          if (it == enc_out.end()) throw std::runtime_error("missing encoder output " + n);
          b = it->second;
        } else {
          std::fill(b.data.begin(), b.data.end(), 0);
        }
      }

      auto set_scalar_i32 = [&](const std::string& n, int v) {
        auto it = state.find(n);
        if (it == state.end()) throw std::runtime_error("missing decoder input " + n);
        reinterpret_cast<int32_t*>(it->second.data.data())[0] = v;
      };
      auto set_mask = [&](int pos) {
        auto it = state.find("attention_mask");
        if (it == state.end()) throw std::runtime_error("missing attention_mask");
        auto* p = reinterpret_cast<uint16_t*>(it->second.data.data());
        size_t n = it->second.data.size() / 2;
        if (pos < 0 || (size_t)pos >= n) throw std::runtime_error("attention mask overflow");
        p[n - 1 - (size_t)pos] = 65535;
      };

      auto run_decoder = [&](int token, int pos, Buf& logits) {
        set_scalar_i32("input_ids", token);
        set_scalar_i32("position_ids", pos);
        set_mask(pos);
        std::vector<Ort::Value> vals;
        for (auto& n : din_storage) vals.push_back(tensor(state[n], mem));
        auto douts = dec.Run(Ort::RunOptions{nullptr}, din_names.data(), vals.data(),
                             vals.size(), dout_names.data(), dout_names.size());
        for (size_t i = 0; i < dec.GetOutputCount(); ++i) {
          auto& n = dout_storage[i];
          if (n == "logits") {
            copy_output(douts[i], logits);
          } else {
            Buf b; copy_output(douts[i], b);
            std::string in_name = n;
            if (in_name.size() > 4 && in_name.substr(in_name.size() - 4) == "_out")
              in_name.replace(in_name.size() - 4, 4, "_in");
            auto it = state.find(in_name);
            if (it == state.end()) throw std::runtime_error("missing cache input " + in_name);
            it->second = std::move(b);
          }
        }
      };

      Buf logits;
      int pos = 0;
      for (size_t pi = 0; pi < prefix.size(); ++pi) {
        run_decoder(prefix[pi], pos, logits);
        pos++;
      }
      if (prefix.empty()) {
        run_decoder(50258, pos, logits);  // <|startoftranscript|>
        pos++;
      }

      std::vector<int> tokens;
      auto td0 = std::chrono::steady_clock::now();
      int vocab = (int)(logits.data.size() / 2);
      if (vocab <= 0) throw std::runtime_error("empty logits");
      for (int step = 0; step < max_tokens; ++step) {
        auto* p = reinterpret_cast<uint16_t*>(logits.data.data());
        int eot_score = eot < vocab ? (int)p[eot] : -1;
        int best = -1;
        uint16_t best_score = 0;
        for (int j = 0; j < vocab; ++j) {
          if (j >= 50257) continue;   // no special/timestamp tokens
          if (j == 220 && step == 0) continue;  // Whisper begin-suppress
          if (p[j] > best_score) { best_score = p[j]; best = j; }
        }
        // EOT wins only if it is the actual maximum, not merely present.
        if (eot_score >= 0 && eot_score > (int)best_score) break;
        if (best < 0) break;
        tokens.push_back(best);
        run_decoder(best, pos, logits);
        pos++;
      }
      auto td1 = std::chrono::steady_clock::now();
      printf("{\"i\":%zu,\"start_ms\":%lld,\"tokens\":[", ci, item.start_ms);
      for (size_t k = 0; k < tokens.size(); ++k) {
        printf("%s%d", k ? "," : "", tokens[k]);
      }
      printf("],\"encoder_ms\":%.3f,\"decoder_ms\":%.3f}\n",
             std::chrono::duration<double, std::milli>(tc1 - tc0).count(),
             std::chrono::duration<double, std::milli>(td1 - td0).count());
      fflush(stdout);
    }
    return 0;
  } catch (const std::exception& e) {
    fprintf(stderr, "FAILED: %s\n", e.what());
    return 1;
  }
}
