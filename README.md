# BAYIR skills

A collection of agent skills for **study notes**, **research**, and **YouTube
evidence gathering** — used with [Pi-Bolt](https://github.com/opensec-git/Pi-Bolt),
Claude Code, opencode and other `SKILL.md`-based agents.

Every skill is a folder with a `SKILL.md` (YAML front matter + instructions), plus
optional `scripts/`, `references/`, `assets/` and `examples/`.

## Platform support

The skills are portable: nothing assumes one particular machine, distribution or
shell.

| Platform | Status | Notes |
|---|---|---|
| Linux (x86_64, aarch64) | primary | X11 or Wayland; Debian/Ubuntu, Fedora and Arch package names are given wherever a tool is needed |
| Android / Termux | primary | the environment these were written in; Qualcomm NPU and Plasma specifics are kept as optional appendix sections |
| macOS | expected to work | the note skills are pure Python; the browser-verification helper prefers `$BROWSER` and falls back to any installed Firefox/Chromium |

Each skill works out where things are at runtime instead of hardcoding one home
directory: `$HTML_STUDY_NOTES_SKILL` for the shared note base, `$BROWSER` for the
verification helper, `$XDG_*` for caches and data, and a search over
`~/.agents/skills`, `~/.pi/agent/skills`, `~/.claude/skills` and the repo itself.

## Skills

### Research & media

| Skill | Version | Files | What it does |
|---|---|---|---|
| [`deep-research`](skills/deep-research) | — | 1 | Multi-source, citation-bearing research. Plan → fan-out search → evidence ledger → contradiction check → verify loop on the local `rk` toolkit (keyless search, SQLite corpus, citation verification), with PinchTab for browser-rendered pages. |
| [`youtube-transcripts`](skills/youtube-transcripts) | — | 1 | Fetch a transcript, search YouTube, or transcribe a video that has no captions. Runs the local `ytt` CLI — captions first, then Whisper on the Hexagon HTP or whisper.cpp on CPU — and feeds the `rk` research corpus. |
| [`youtube-comments`](skills/youtube-comments) | — | 1 | Fetch comments and replies, summarize top comments, analyse sentiment or controversy. Runs the local `ytc` CLI (built on `youtube-comment-downloader`) and reports a completeness receipt. |

### Study notes

The `interactive-*` family all build on `html-study-notes`: one self-contained,
printable HTML file with step-through labs, retrieval practice, complexity/parameter
tables and a print fallback.

| Skill | Version | Files | What it covers |
|---|---|---|---|
| [`html-study-notes`](skills/html-study-notes) | 1.0 | 10 | Base generator — standalone HTML study notes for class notes, mathematics and electronics; designed, printable pages with rendered math and circuit diagrams. |
| [`interactive-architecture-notes`](skills/interactive-architecture-notes) | 0.1 | 20 | Architecture studio, history/theory, building technology — plan/section/elevation, stair and ramp checks, daylight, wall assemblies, acoustics, egress, precedent analysis. |
| [`interactive-bme-notes`](skills/interactive-bme-notes) | 1.0 | 20 | Biomedical engineering — biomechanics and joint loading, viscoelasticity, biomaterials, tissue-engineering diffusion limits, biofluid mechanics, biosignals, medical imaging, biosensors. |
| [`interactive-civil-notes`](skills/interactive-civil-notes) | 0.1 | 19 | Civil engineering — statics and structural analysis, reinforced concrete, steel/timber/masonry, foundations and geotechnics, earthquake engineering (TBDY 2018, TS 500), hydraulics, transportation, quantity take-off. |
| [`interactive-cs-notes`](skills/interactive-cs-notes) | — | 13 | Algorithms, data structures and CS — step-through labs, complexity tables, coding practice. |
| [`interactive-ee-notes`](skills/interactive-ee-notes) | 0.2 | 40 | Electrical, electronics and communications — circuit analysis, phasors and AC power, transients, analog/digital electronics, op-amps, filters, signals and systems, sampling, modulation, RF and link budgets, antennas, machines, power systems. |
| [`interactive-math-notes`](skills/interactive-math-notes) | 1.0 | 18 | University mathematics — calculus I–III, differential equations, numerical analysis, linear algebra, proof courses; MatLivre/Jupyter/SymPy verified. |
| [`interactive-mbg-notes`](skills/interactive-mbg-notes) | 1.0 | 20 | Molecular biology and genetics — replication, transcription and splicing, translation, gene regulation and epigenetics, Mendelian and population genetics, genomics, recombinant DNA, PCR, plasmid cloning, CRISPR, sequencing. |
| [`interactive-me-notes`](skills/interactive-me-notes) | 1.1 | 26 | Mechanical engineering — statics, dynamics, mechanics of materials, thermodynamics, heat transfer, fluids, machine elements, mechanisms, vibrations, manufacturing, control, FEM, technical drawing. |
| [`interactive-med-notes`](skills/interactive-med-notes) | 1.0 | 38 | Medical school — anatomy and neuroanatomy, physiology, histology/embryology, biochemistry and genetics, microbiology and immunology, pathology, pharmacology, internal medicine, surgery/emergency/critical care, paediatrics and ob/gyn, neurology and psychiatry, public health and biostatistics, radiology, clinical skills/OSCE. |
| [`interactive-mse-notes`](skills/interactive-mse-notes) | 1.0 | 34 | Materials science and engineering — crystallography and Miller planes, phase diagrams and the lever rule, diffusion, mechanical behaviour, XRD, TTT/CCT, ternary diagrams, Ashby selection, semiconductor bands, grain-size measurement. |
| [`interactive-physics-notes`](skills/interactive-physics-notes) | 0.1 | 9 | University physics — mechanics, electromagnetism, waves and optics, thermodynamics and statistical mechanics, quantum mechanics, relativity and astrophysics, condensed matter, nuclear/particle physics, computational physics, lab and data analysis. |

## Tools

The two CLIs behind the research skills ship here as source, with portable
launchers and installers (`~/.local/bin` on Linux/macOS, `$PREFIX/bin` on Termux):

| Tool | Command | Used by |
|---|---|---|
| [`tools/ytt`](tools/ytt) | `ytt` | `youtube-transcripts` — captions first, local ASR when there are none |
| [`tools/ytc`](tools/ytc) | `ytc` | `youtube-comments` — normalized comments, threads, completeness receipt |

See [tools/README.md](tools/README.md) for dependencies, environment variables and
the optional Android NPU backend.

## Install

Skills are plain folders — copy the ones you want into your agent's skills directory.

```bash
git clone https://github.com/AHMETBAYIR/BAYIR-skills.git
cd BAYIR-skills

# for agents that read ~/.agents/skills (Claude Code, opencode, Pi-Bolt, ...)
mkdir -p ~/.agents/skills
cp -r skills/* ~/.agents/skills/

# Pi-Bolt also reads ~/.pi/agent/skills
mkdir -p ~/.pi/agent/skills
cp -r skills/* ~/.pi/agent/skills/
```

Or symlink a single skill so `git pull` updates it in place:

```bash
ln -s "$PWD/skills/interactive-ee-notes" ~/.agents/skills/interactive-ee-notes
```

## Requirements

| Skills | Needs |
|---|---|
| `html-study-notes`, all `interactive-*` | `python3` 3.10+ (the scripts use only the standard library), any modern browser for the HTML output |
| `youtube-transcripts` | `ytt` from [tools/ytt](tools/ytt); `yt-dlp` + `ffmpeg`; whisper.cpp for uncaptioned videos |
| `youtube-comments` | `ytc` from [tools/ytc](tools/ytc) |
| `deep-research` | a web search backend — the `rk` companion CLI if you have it (source not in this repo), optional [PinchTab](https://github.com/pinchtab/pinchtab) for browser-rendered pages |

The `interactive-*` and `html-study-notes` skills work standalone: no API keys, no
network access, no build step — the agent writes one HTML file and the browser does
the rest.

## Layout

```
skills/<name>/SKILL.md        # front matter (name, description, version) + instructions
skills/<name>/scripts/        # helper scripts invoked by the agent
skills/<name>/references/     # deep reference material loaded on demand
skills/<name>/assets/         # CSS/JS/templates embedded into the output page
skills/<name>/examples/       # worked examples
tools/<tool>/                 # source of the CLIs the research skills drive
```

`sync.sh` compares the live skill folders in `~/.pi/agent/skills` and
`~/.agents/skills` with this repo. It reports drift by default and only writes
when you ask, because a live folder often carries machine-specific edits you do
not want to publish:

```bash
./sync.sh                       # report drift for every skill
./sync.sh --write               # copy live -> repo
./sync.sh --write deep-research # or just one skill
```

## License

MIT — see [LICENSE](LICENSE).
