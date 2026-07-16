---
layout: default
title: Join us!
description: Training and employment opportunities in the GHI lab for research assistants, students, postdoctoral fellows, clinical fellows, and instructors.
permalink: /opportunities/
---

# Join us!

As a new and growing laboratory, we are looking for **talented, curious, and motivated trainees**—including research assistants, postdoctoral fellows, graduate students, undergraduate students, and clinical fellows—who are passionate about advancing our understanding of inborn errors of immunity and improving the lives of affected children and families.

## Research Assistants / Research Technicians

We welcome candidates interested in gaining hands-on experience in human genetics, immunology, and translational research. Please email Rui your CV and a brief cover letter describing your interests. Available positions are listed below.

## Postdoctoral Fellows

We welcome postdoctoral candidates from all disciplines. Please email Rui your CV and a brief cover letter describing your research interests. Positions are available for candidates whose interests align with the lab’s research program.

## Graduate Students

We welcome BCM PhD, MD/PhD, and MS students interested in thesis research. Please email Rui to discuss your interests and potential rotation opportunities. We are not currently able to accept graduate students from outside BCM.

## Clinical Fellows

BCM clinical fellows and instructors interested in research are encouraged to email Rui to discuss potential opportunities.

<section class="jobs-section">
  <h2>Current active job posts</h2>
  <div id="active-jobs" class="jobs-list">
    <p class="pub-desc">Loading active job posts...</p>
  </div>
</section>

<script>
// ### Job posts sheet ###
// Active postings are maintained in a small public sheet.
const JOBS_SHEET_ID = "1A_p1mxWfKvQzdPBp_TAjVJMm67AJutFzJ0HHo92fU-8";
const JOBS_SHEET_NAMES = ["Sheet1", "Jobs", "Openings"];

function cleanText(value) {
  return value === null || value === undefined
    ? ""
    : String(value).trim();
}

function normKey(value) {
  return cleanText(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}

function makeHeaderMap(cols) {
  const fallback = {
    position: 0,
    start: 1,
    link: 2
  };

  const aliases = {
    position: "position",
    title: "position",
    role: "position",
    job: "position",
    earlieststartdate: "start",
    startdate: "start",
    start: "start",
    link: "link",
    url: "link",
    posting: "link"
  };

  const map = {};

  cols.forEach((col, index) => {
    const key = aliases[normKey(col.label || col.id)];
    if (key) map[key] = index;
  });

  return {
    ...fallback,
    ...map
  };
}

function cell(row, map, key) {
  return row.c?.[map[key]];
}

function cellText(row, map, key) {
  const value = cell(row, map, key);
  return cleanText(value?.f || value?.v);
}

function isHeaderRow(row) {
  const keys = (row.c || []).map(value =>
    normKey(value?.f || value?.v)
  );

  return (
    keys.includes("position") &&
    keys.some(key => key.includes("start"))
  );
}

function mapFromHeaderRow(row) {
  return makeHeaderMap(
    (row.c || []).map(value => ({
      label: value?.f || value?.v
    }))
  );
}

function parseSheetDate(cellValue, formattedValue) {
  if (
    typeof cellValue === "string" &&
    cellValue.startsWith("Date")
  ) {
    const parts = cellValue.match(/\d+/g);

    if (parts && parts.length >= 3) {
      const date = new Date(
        Number(parts[0]),
        Number(parts[1]),
        Number(parts[2])
      );

      if (!isNaN(date.getTime())) return date;
    }
  }

  const parsed = Date.parse(
    cleanText(formattedValue || cellValue)
  );

  return isNaN(parsed) ? null : new Date(parsed);
}

function formatDate(date, fallback) {
  if (!date) return fallback;

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
}

function makeJobCard(job) {
  const card = document.createElement(
    job.link ? "a" : "div"
  );

  card.className = "job-card";

  if (job.link) {
    card.href = job.link;
    card.target = "_blank";
    card.rel = "noopener";
  }

  const title = document.createElement("div");
  title.className = "job-title";
  title.textContent = job.position;

  const start = document.createElement("div");
  start.className = "job-start";
  start.textContent =
    `Earliest start date: ${job.startLabel || "Flexible"}`;

  card.appendChild(title);
  card.appendChild(start);

  return card;
}

async function fetchJobsSheet(sheetName) {
  const url =
    `https://docs.google.com/spreadsheets/d/${JOBS_SHEET_ID}` +
    `/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(sheetName)}`;

  const res = await fetch(url);

  if (!res.ok) {
    throw new Error(
      `Failed to load jobs sheet "${sheetName}": ${res.status}`
    );
  }

  const text = await res.text();

  const match = text.match(
    /google\.visualization\.Query\.setResponse\((.*)\);?$/s
  );

  if (!match || !match[1]) {
    throw new Error(
      `Could not parse jobs sheet: ${sheetName}`
    );
  }

  return JSON.parse(match[1]);
}

async function loadJobsSheet() {
  let lastError;

  for (const sheetName of JOBS_SHEET_NAMES) {
    try {
      const json = await fetchJobsSheet(sheetName);
      const rows = json.table?.rows || [];

      if (rows.length) return json;
    } catch (err) {
      lastError = err;
    }
  }

  if (lastError) throw lastError;

  return {
    table: {
      cols: [],
      rows: []
    }
  };
}

document.addEventListener("DOMContentLoaded", async () => {
  const container = document.getElementById("active-jobs");

  if (!container) return;

  try {
    const json = await loadJobsSheet();

    let rows = json.table?.rows || [];

    const headerRow =
      rows[0] && isHeaderRow(rows[0]);

    const map = headerRow
      ? mapFromHeaderRow(rows[0])
      : makeHeaderMap(json.table?.cols || []);

    if (headerRow) {
      rows = rows.slice(1);
    }

    const jobs = rows
      .map(row => {
        const startCell = cell(row, map, "start");

        const startDate = parseSheetDate(
          startCell?.v,
          startCell?.f
        );

        return {
          position: cellText(row, map, "position"),
          startDate,
          startLabel: formatDate(
            startDate,
            cellText(row, map, "start")
          ),
          link: cellText(row, map, "link")
        };
      })
      .filter(job => job.position);

    jobs.sort((a, b) => {
      const aTime = a.startDate
        ? a.startDate.getTime()
        : Number.MAX_SAFE_INTEGER;

      const bTime = b.startDate
        ? b.startDate.getTime()
        : Number.MAX_SAFE_INTEGER;

      return aTime - bTime;
    });

    container.innerHTML = "";

    if (!jobs.length) {
      container.innerHTML =
        '<p class="pub-desc">No active job posts listed right now.</p>';

      return;
    }

    jobs.forEach(job => {
      container.appendChild(makeJobCard(job));
    });
  } catch (err) {
    console.error(err);

    container.innerHTML =
      '<p class="pub-desc">Unable to load active job posts.</p>';
  }
});
</script>
