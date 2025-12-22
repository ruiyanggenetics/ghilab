let pages = [];
const input = document.getElementById("nav-search-input");
const resultsBox = document.getElementById("nav-search-results");

// Load search index
fetch("/ghilab/search.json")
  .then(res => res.json())
  .then(data => {
    pages = data;
  })
  .catch(err => {
    console.error("Failed to load search index:", err);
  });

// Listen for typing
input.addEventListener("input", () => {
  const query = input.value.trim().toLowerCase();
  resultsBox.innerHTML = "";

  if (query.length < 2) return;

  const matches = pages.filter(p =>
    p.title.toLowerCase().includes(query) ||
    p.content.toLowerCase().includes(query)
  ).slice(0, 8);

  if (!matches.length) {
    resultsBox.innerHTML = `<div class="nav-search-item">
      <a><div class="nav-search-snippet">No results</div></a>
    </div>`;
    return;
  }

  matches.forEach(p => {
    const snippet = p.content.substring(0, 120) + "…";

    const item = document.createElement("div");
    item.className = "nav-search-item";

    item.innerHTML = `
      <a href="${p.url}">
        <div class="nav-search-title">${p.title}</div>
        <div class="nav-search-snippet">${snippet}</div>
      </a>
    `;

    resultsBox.appendChild(item);
  });
});

// Hide results when clicking elsewhere
document.addEventListener("click", e => {
  if (!e.target.closest(".nav-search")) {
    resultsBox.innerHTML = "";
  }
});
