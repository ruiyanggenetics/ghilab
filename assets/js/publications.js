const API_URL = "https://ghilab.ryangrui.workers.dev/";

document.addEventListener("DOMContentLoaded", async () => {
  const container = document.getElementById("publications");

  // ⛔ Not on publications page → do nothing
  if (!container) return;

  container.innerHTML = `<div class="pub-desc">Loading publications…</div>`;

  try {
    const res = await fetch(API_URL);
    if (!res.ok) throw new Error("Failed to load publications");

    const pubs = await res.json();
    container.innerHTML = "";

    pubs.forEach(pub => {
      const card = document.createElement("a");
      card.className = "pub-card";
      card.href = pub.url;
      card.target = "_blank";
      card.rel = "noopener";

      card.innerHTML = `
        <div>
          <div class="pub-title">${pub.title}</div>
          <div class="pub-desc">
            ${pub.authors}<br>
            <em>${pub.journal}</em> (${pub.year})
          </div>
        </div>
      `;

      container.appendChild(card);
    });

  } catch (err) {
    container.innerHTML = `
      <div class="pub-desc">
        Failed to load publications.
      </div>
    `;
    console.error(err);
  }
});
