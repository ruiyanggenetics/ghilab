// ### Publication source ###
// Crossref is queried by ORCID so the page keeps updating without hand edits.
const ORCID_ID = "0000-0003-4427-2158";
const CROSSREF_URL = "https://api.crossref.org/works";

function cleanText(value) {
  const div = document.createElement("div");
  div.innerHTML = String(value || "");
  return div.textContent.replace(/\s+/g, " ").trim();
}

function publicationDateParts(item) {
  const dateFields = [
    "published-print",
    "published-online",
    "published",
    "posted",
    "issued",
    "created"
  ];

  for (const field of dateFields) {
    const parts = item[field]?.["date-parts"]?.[0];
    if (Array.isArray(parts) && parts.length) return parts;
  }

  return [];
}

function dateScore(parts) {
  const [year = 0, month = 1, day = 1] = parts.map(Number);
  return (year * 10000) + (month * 100) + day;
}

function doiUrl(doi) {
  const cleanDoi = cleanText(doi).replace(/^https?:\/\/(dx\.)?doi\.org\//i, "");
  return cleanDoi ? `https://doi.org/${cleanDoi}` : "";
}

function formatAuthor(author) {
  return cleanText([author.given, author.family].filter(Boolean).join(" ")) ||
    cleanText(author.name);
}

function formatAuthors(authors) {
  return (authors || [])
    .map(formatAuthor)
    .filter(Boolean)
    .join(", ");
}

function crossrefItemToPublication(item) {
  const dateParts = publicationDateParts(item);
  const doi = cleanText(item.DOI);
  const title = cleanText(item.title?.[0]);

  if (!title) return null;

  return {
    title,
    authors: formatAuthors(item.author),
    journal: cleanText(item["container-title"]?.[0]) ||
      cleanText(item["short-container-title"]?.[0]) ||
      cleanText(item.institution?.[0]?.name) ||
      cleanText(item.publisher),
    year: dateParts[0] ? String(dateParts[0]) : "",
    url: cleanText(item.URL) || doiUrl(doi),
    doi,
    sortDate: dateScore(dateParts)
  };
}

async function fetchPublications() {
  const url = new URL(CROSSREF_URL);
  url.searchParams.set("filter", `orcid:${ORCID_ID}`);
  url.searchParams.set("rows", "100");
  url.searchParams.set("sort", "published");
  url.searchParams.set("order", "desc");

  const res = await fetch(url.toString(), {
    headers: { Accept: "application/json" }
  });

  if (!res.ok) throw new Error("Crossref publication fetch failed");

  const data = await res.json();
  const seen = new Set();

  return (data.message?.items || [])
    .map(crossrefItemToPublication)
    .filter(Boolean)
    .filter(pub => {
      const key = (pub.doi || pub.title).toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => b.sortDate - a.sortDate || a.title.localeCompare(b.title));
}

// ### Page rendering ###
// Keep external metadata as text, not HTML, so outside data cannot alter the page.
function renderPublication(container, pub) {
  const item = document.createElement("div");
  item.className = "pub-dynamic-item";

  const title = document.createElement("div");
  title.className = "pub-title";

  const link = document.createElement("a");
  link.href = pub.url || "#";
  link.target = "_blank";
  link.rel = "noopener";
  link.textContent = pub.title;

  const desc = document.createElement("div");
  desc.className = "pub-desc";

  if (pub.authors) {
    desc.appendChild(document.createTextNode(pub.authors));
    desc.appendChild(document.createElement("br"));
  }

  const journal = document.createElement("em");
  journal.textContent = pub.journal || "Publication";
  desc.appendChild(journal);

  if (pub.year) {
    desc.appendChild(document.createTextNode(` (${pub.year})`));
  }

  title.appendChild(link);
  item.appendChild(title);
  item.appendChild(desc);
  container.appendChild(item);
}

document.addEventListener("DOMContentLoaded", async () => {
  const container = document.getElementById("publications");
  if (!container) return;

  container.innerHTML = "";

  try {
    const pubs = await fetchPublications();
    container.innerHTML = "";
    pubs.forEach(pub => renderPublication(container, pub));
  } catch (err) {
    container.innerHTML = "";
    console.error(err);
  }
});
