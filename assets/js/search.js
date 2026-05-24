// ### Search data ###
// Static pages come from search.json; publications come from the shared
// ORCID/Crossref publication source.
let pages = [];

const input = document.getElementById("nav-search-input");
const resultsBox = document.getElementById("nav-search-results");

function getBaseUrl() {
  const script = document.currentScript || document.querySelector('script[src$="/assets/js/search.js"]');
  if (!script) return "";

  const src = new URL(script.getAttribute("src"), window.location.href);
  return src.pathname.replace(/\/assets\/js\/search\.js$/, "");
}

function cleanText(value) {
  return window.GhiPublicationSource.cleanText(value);
}

// ### Publication search records ###
// Publications are shaped to look like regular search results.
function publicationToSearchPage(pub) {
  const title = cleanText(pub.title);
  const authors = cleanText(pub.authors);
  const journal = cleanText(pub.journal);
  const year = cleanText(pub.year);
  const url = cleanText(pub.url) || `${getBaseUrl()}/publications/`;

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
// Publication sync is best-effort, so site search still works if a service is down.
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
    const publications = await window.GhiPublicationSource.loadPublications();
    pages = pages.concat(publications.map(publicationToSearchPage).filter(Boolean));
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
