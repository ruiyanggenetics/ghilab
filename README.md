# GHI Lab Website

This repository hosts the official website for the  
**Laboratory of Genetics of Human Immunity (GHI Lab)**.

🌐 **Live site:**  
[https://bcm-rui-yang-genetics.github.io/ghilab/](https://bcm-rui-yang-genetics.github.io/ghilab/)

---

## Purpose

This website presents the research, people, and activities of the GHI Lab, with a focus on:

- Human genetics
- Immunology
- Severe infectious disease, immune dysregulation, and malignancy
- Translational and mechanistic studies using humans as the primary model system

---

## Structure

The site is built using **GitHub Pages + Jekyll** (no external theme dependency).

Top navigation includes:

- About (Home)
- Publications
- Research
- Repositories
- People
- Opportunities
- Search

---

## Technology

- **GitHub Pages**
- **Jekyll (native, no custom plugins)**
- HTML / CSS / minimal JavaScript

This repository intentionally avoids complex templates and heavy plugins to ensure:
- Stability
- Transparency
- Easy long-term maintenance

---

## Local Development

### Prerequisites

- **Ruby** (version 2.7 or higher) - macOS includes Ruby by default, but it may be outdated
- **Bundler** (install with `gem install bundler` if needed)

Check your Ruby version:
```bash
ruby --version
```

If Ruby is outdated (< 2.7), install a newer version using Homebrew:
```bash
brew install ruby
```

### Install Steps

1. Navigate to the project directory:
   ```bash
   cd github/ghilab
   ```

2. Install dependencies:
   ```bash
   bundle install
   ```

### Run Locally

Start the development server:
```bash
bundle exec jekyll serve
```

Then open your browser and visit: **http://localhost:4000/ghilab/**

### Troubleshooting

#### If `bundle install` fails:

**Missing gems error:**
```bash
gem install jekyll bundler
bundle install
```

**Permission errors (macOS/Linux):**
```bash
sudo gem install bundler
bundle install
```

**macOS - Xcode Command Line Tools missing:**
```bash
xcode-select --install
```

**Windows:** Install Ruby via [RubyInstaller](https://rubyinstaller.org/) with DevKit.

#### If `jekyll serve` fails:

**Port 4000 already in use (macOS):**
```bash
lsof -i :4000 | grep LISTEN  # Find process
kill <PID>                   # Kill it, then retry
```

**Permission denied on port (macOS):**
```bash
sudo lsof -i :4000 | grep LISTEN
sudo kill <PID>
```

**Liquid Exception errors:**
```bash
bundle update
bundle install
```
