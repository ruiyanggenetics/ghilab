// ### Publications feed ###
// The Publications page pulls a small JSON feed and renders it quietly. If the
// feed is unavailable, the page still shows the external profile cards.
document.addEventListener("DOMContentLoaded", async () => {
  const container = document.getElementById("publications");

  if (!container) return;

  container.innerHTML = "";

  try {
    const res = await fetch("https://ghilab.ryangrui.workers.dev/");
    if (!res.ok) throw new Error("Fetch failed");

    const pubs = await res.json();
    container.innerHTML = "";

    pubs.forEach(p => {
      const item = document.createElement("div");
      item.className = "pub-dynamic-item";

      item.innerHTML = `
        <div class="pub-title">
          <a href="${p.url}" target="_blank" rel="noopener">${p.title}</a>
        </div>
        <div class="pub-desc">
          ${p.authors}<br>
          <em>${p.journal}</em> (${p.year})
        </div>
      `;

      container.appendChild(item);
    });

  } catch (err) {
    container.innerHTML = "";
    console.error(err);
  }
});
