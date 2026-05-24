// ### Search data ###
// Static pages come from search.json; publications are added from the same
// public feed used by the Publications page.
let pages = [];

const input = document.getElementById("nav-search-input");
const resultsBox = document.getElementById("nav-search-results");
const SEARCH_ORCID_ID = "0000-0003-4427-2158";
const SEARCH_CROSSREF_URL = "https://api.crossref.org/works";

function getBaseUrl() {
  const script = document.currentScript || document.querySelector('script[src$="/assets/js/search.js"]');
  if (!script) return "";

  const src = new URL(script.getAttribute("src"), window.location.href);
  return src.pathname.replace(/\/assets\/js\/search\.js$/, "");
}

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

// ### Publication search records ###
// Publications are shaped to look like regular search results.
function crossrefItemToSearchPage(item) {
  const dateParts = publicationDateParts(item);
  const doi = cleanText(item.DOI);
  const title = cleanText(item.title?.[0]);
  const authors = formatAuthors(item.author);
  const journal = cleanText(item["container-title"]?.[0]) ||
    cleanText(item["short-container-title"]?.[0]) ||
    cleanText(item.institution?.[0]?.name) ||
    cleanText(item.publisher);
  const year = dateParts[0] ? String(dateParts[0]) : "";
  const url = cleanText(item.URL) || doiUrl(doi) || `${getBaseUrl()}/publications/`;

  if (!title) return null;

  return {
    title,
    url,
    content: [title, authors, journal, year].filter(Boolean).join(" "),
    type: "publication"
  };
}

// ### Search results ###
// Keep this small and fast: title match, content match, then a short snippet.
function renderNoResults() {
  const item = document.createElement("div");
  item.className = "nav-search-item";

  const link = document.createElement("a");
  const snippet = document.createElement("div");
  snippet.className = "nav-search-snippet";
  snippet.textContent = "No results";

  link.appendChild(snippet);
  item.appendChild(link);
  resultsBox.appendChild(item);
}

function makeSnippet(content, query) {
  const text = cleanText(content);
  const index = text.toLowerCase().indexOf(query.toLowerCase());
  const start = Math.max(0, index - 45);
  const end = Math.min(text.length, start + 140);
  const prefix = start > 0 ? "..." : "";
  const suffix = end < text.length ? "..." : "";

  return `${prefix}${text.slice(start, end)}${suffix}`;
}

function renderResults(query) {
  resultsBox.innerHTML = "";

  if (query.length < 2) return;

  const matches = pages.filter(p =>
    cleanText(p.title).toLowerCase().includes(query) ||
    cleanText(p.content).toLowerCase().includes(query)
  ).slice(0, 8);

  if (!matches.length) {
    renderNoResults();
    return;
  }

  matches.forEach(p => {
    const item = document.createElement("div");
    item.className = "nav-search-item";

    const link = document.createElement("a");
    link.href = p.url;

    if (/^https?:\/\//.test(p.url)) {
      link.target = "_blank";
      link.rel = "noopener";
    }

    const title = document.createElement("div");
    title.className = "nav-search-title";
    title.textContent = p.type === "publication" ? `Publication: ${p.title}` : p.title;

    const snippet = document.createElement("div");
    snippet.className = "nav-search-snippet";
    snippet.textContent = makeSnippet(p.content, query);

    link.appendChild(title);
    link.appendChild(snippet);
    item.appendChild(link);
    resultsBox.appendChild(item);
  });
}

// ### Load indexes ###
// The page index is local. Publication data is best-effort, so search still
// works if the feed is unavailable.
async function loadSearchIndex() {
  const baseUrl = getBaseUrl();

  try {
    const res = await fetch(`${baseUrl}/search.json`);
    if (!res.ok) throw new Error("Search index fetch failed");
    pages = await res.json();
  } catch (err) {
    console.error("Failed to load search index:", err);
  }

  try {
    const url = new URL(SEARCH_CROSSREF_URL);
    url.searchParams.set("filter", `orcid:${SEARCH_ORCID_ID}`);
    url.searchParams.set("rows", "100");
    url.searchParams.set("sort", "published");
    url.searchParams.set("order", "desc");

    const res = await fetch(url.toString(), {
      headers: { Accept: "application/json" }
    });

    if (!res.ok) throw new Error("Publications fetch failed");
    const publications = await res.json();
    const publicationPages = (publications.message?.items || [])
      .map(crossrefItemToSearchPage)
      .filter(Boolean);

    pages = pages.concat(publicationPages);
  } catch (err) {
    console.error("Failed to add publications to search index:", err);
  }

  if (input) renderResults(input.value.trim().toLowerCase());
}

// ### Wire the search box ###
// Results update as the user types and clear when the user clicks elsewhere.
if (input && resultsBox) {
  loadSearchIndex();

  input.addEventListener("input", () => {
    renderResults(input.value.trim().toLowerCase());
  });

  document.addEventListener("click", e => {
    if (!e.target.closest(".nav-search")) {
      resultsBox.innerHTML = "";
    }
  });
}
