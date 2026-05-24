// ### Synced publications ###
// Render the shared ORCID/Crossref publication list on the Publications page.
document.addEventListener("DOMContentLoaded", async () => {
  const container = document.getElementById("publications");
  if (!container) return;

  container.innerHTML = "";

  try {
    const pubs = await window.GhiPublicationSource.loadPublications();
    container.innerHTML = "";

    pubs.forEach(pub => {
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
    });
  } catch (err) {
    container.innerHTML = "";
    console.error(err);
  }
});
