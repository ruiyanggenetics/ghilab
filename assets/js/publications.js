// ### Synced publications ###
// Render the shared ORCID/Crossref publication list on the Publications page.
const LAB_PUBLICATION_START_YEAR = 2026;

function publicationYear(pub) {
  const year = Number.parseInt(pub.year, 10);
  return Number.isFinite(year) ? year : null;
}

function renderPublication(pub) {
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

  desc.appendChild(document.createTextNode(pub.displayAuthors));
  desc.appendChild(document.createElement("br"));

  const venue = document.createElement("em");
  venue.textContent = pub.displayVenue;
  desc.appendChild(venue);

  title.appendChild(link);
  item.appendChild(title);
  item.appendChild(desc);

  return item;
}

function groupByYear(publications) {
  const groups = new Map();

  publications.forEach(pub => {
    const year = publicationYear(pub) || "Other";
    if (!groups.has(year)) groups.set(year, []);
    groups.get(year).push(pub);
  });

  return Array.from(groups.entries()).sort(([a], [b]) => {
    if (a === "Other") return 1;
    if (b === "Other") return -1;
    return b - a;
  });
}

function renderPublicationSection(container, title, publications) {
  if (!publications.length) return;

  const section = document.createElement("section");
  section.className = "pub-section";

  const heading = document.createElement("h3");
  heading.className = "pub-section-title";
  heading.textContent = title;
  section.appendChild(heading);

  groupByYear(publications).forEach(([year, papers]) => {
    const yearBlock = document.createElement("div");
    yearBlock.className = "pub-year-group";

    const yearHeading = document.createElement("h4");
    yearHeading.className = "pub-year-title";
    yearHeading.textContent = year;
    yearBlock.appendChild(yearHeading);

    papers.forEach(pub => yearBlock.appendChild(renderPublication(pub)));
    section.appendChild(yearBlock);
  });

  container.appendChild(section);
}

document.addEventListener("DOMContentLoaded", async () => {
  const container = document.getElementById("publications");
  if (!container) return;

  container.innerHTML = "";

  try {
    const pubs = await window.GhiPublicationSource.loadPublications();
    const labPublications = pubs.filter(pub =>
      publicationYear(pub) >= LAB_PUBLICATION_START_YEAR
    );
    const priorPublications = pubs.filter(pub =>
      publicationYear(pub) < LAB_PUBLICATION_START_YEAR || !publicationYear(pub)
    );

    container.innerHTML = "";
    renderPublicationSection(container, "Lab publications", labPublications);
    renderPublicationSection(container, "Prior publications from PI", priorPublications);
  } catch (err) {
    container.innerHTML = "";
    console.error(err);
  }
});
