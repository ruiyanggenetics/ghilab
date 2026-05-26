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

- Research
- People
- Resources
- Publications
- News
- Funding
- Gallery
- Join us!
- Search

---

## Automated Data Sources

Several pages are intentionally maintained from public external sources so the
website can stay lightweight.

### Publications

Publications are pulled from ORCID:

- ORCID profile: [https://orcid.org/0000-0003-4427-2158](https://orcid.org/0000-0003-4427-2158)
- ORCID works API: [https://pub.orcid.org/v3.0/0000-0003-4427-2158/works](https://pub.orcid.org/v3.0/0000-0003-4427-2158/works)

Important rule: **ORCID is the only source of truth for which papers appear on
the website.** Crossref and Europe PMC are used only to improve metadata for
papers that are already present in ORCID, such as full author lists, journal
names, DOI links, and PMID-backed journal corrections.

This prevents unrelated Crossref-only records from appearing on the lab website.
To add or remove a publication, update the ORCID record rather than editing the
website.

### People

The People page is populated from the lab Google Sheet. The sheet controls lab
member cards, alumni/collaborator grouping, photos, biographies, and origin map
coordinates.

### News

The News page is populated from the lab updates Google Sheet. News items are
sorted by date, newest first.

### Funding

The Funding page is populated from the funding Google Sheet. Logos, award names,
links, and start/end dates are managed there.

### Join Us

The active job posts section is populated from the jobs Google Sheet. The sheet
columns are:

- Position
- Earliest start date
- Link

Only rows with a position are displayed.

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
