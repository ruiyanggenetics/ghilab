// ### Publication source ###
// ORCID owns the full list. Crossref fills in cleaner author and journal metadata.
(function () {
  const ORCID_ID = "0000-0003-4427-2158";
  const ORCID_WORKS_URL = `https://pub.orcid.org/v3.0/${ORCID_ID}/works`;
  const CROSSREF_WORKS_URL = "https://api.crossref.org/works";

  let publicationsPromise = null;

  function cleanText(value) {
    const div = document.createElement("div");
    div.innerHTML = String(value || "");
    return div.textContent.replace(/\s+/g, " ").trim();
  }

  function normalizeDoi(doi) {
    return cleanText(doi)
      .replace(/^https?:\/\/(dx\.)?doi\.org\//i, "")
      .toLowerCase();
  }

  function doiUrl(doi) {
    const cleanDoi = normalizeDoi(doi);
    return cleanDoi ? `https://doi.org/${cleanDoi}` : "";
  }

  function normalizeTitle(title) {
    return cleanText(title).toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  }

  function orcidValue(value) {
    return cleanText(value?.value || value);
  }

  function orcidDateParts(date) {
    if (!date) return [];
    return [date.year, date.month, date.day]
      .map(orcidValue)
      .filter(Boolean)
      .map(Number);
  }

  function crossrefDateParts(item) {
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

  function externalIds(container) {
    const ids = container?.["external-id"] || [];
    return Array.isArray(ids) ? ids : [ids];
  }

  function externalIdValue(id) {
    return cleanText(id?.["external-id-normalized"]?.value || id?.["external-id-value"]);
  }

  function doiFromExternalIds(container) {
    const doi = externalIds(container).find(id =>
      cleanText(id?.["external-id-type"]).toLowerCase() === "doi"
    );

    return normalizeDoi(externalIdValue(doi));
  }

  function firstExternalUrl(container) {
    const found = externalIds(container).find(id => cleanText(id?.["external-id-url"]?.value));
    return cleanText(found?.["external-id-url"]?.value);
  }

  function sourceName(summary) {
    return cleanText(summary?.source?.["source-name"]?.value);
  }

  function bestOrcidSummary(group) {
    const summaries = group?.["work-summary"] || [];
    if (!summaries.length) return null;

    return summaries.find(summary => sourceName(summary).toLowerCase() === "crossref") ||
      summaries.find(summary => doiFromExternalIds(summary["external-ids"])) ||
      summaries[0];
  }

  function orcidGroupToPublication(group) {
    const summary = bestOrcidSummary(group);
    const groupDoi = doiFromExternalIds(group?.["external-ids"]);
    const summaryDoi = doiFromExternalIds(summary?.["external-ids"]);
    const doi = groupDoi || summaryDoi;
    const dateParts = orcidDateParts(summary?.["publication-date"]);
    const title = cleanText(summary?.title?.title?.value || summary?.title?.["translated-title"]?.value);

    if (!title) return null;

    return {
      title,
      authors: "",
      journal: orcidValue(summary?.["journal-title"]) || cleanText(summary?.type),
      year: dateParts[0] ? String(dateParts[0]) : "",
      url: cleanText(summary?.url?.value) || firstExternalUrl(group?.["external-ids"]) || doiUrl(doi),
      doi,
      sortDate: dateScore(dateParts)
    };
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
    const dateParts = crossrefDateParts(item);
    const doi = normalizeDoi(item.DOI);
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

  async function fetchJson(url, accept = "application/json") {
    const res = await fetch(url, {
      headers: { Accept: accept }
    });

    if (!res.ok) throw new Error(`Publication fetch failed: ${res.status}`);
    return res.json();
  }

  async function fetchOrcidPublications() {
    let data;

    try {
      data = await fetchJson(ORCID_WORKS_URL, "application/vnd.orcid+json");
    } catch (err) {
      data = await fetchJson(ORCID_WORKS_URL);
    }

    return (data.group || []).map(orcidGroupToPublication).filter(Boolean);
  }

  async function fetchCrossrefByOrcid() {
    const url = new URL(CROSSREF_WORKS_URL);
    url.searchParams.set("filter", `orcid:${ORCID_ID}`);
    url.searchParams.set("rows", "100");
    url.searchParams.set("sort", "published");
    url.searchParams.set("order", "desc");

    const data = await fetchJson(url.toString());
    return data.message?.items || [];
  }

  async function fetchCrossrefByDoi(doi) {
    const data = await fetchJson(`${CROSSREF_WORKS_URL}/${encodeURIComponent(doi)}`);
    return data.message || null;
  }

  async function mapWithLimit(items, limit, mapper) {
    const results = new Array(items.length);
    let next = 0;

    async function worker() {
      while (next < items.length) {
        const index = next;
        next += 1;

        try {
          results[index] = await mapper(items[index]);
        } catch (err) {
          results[index] = null;
        }
      }
    }

    await Promise.all(
      Array.from({ length: Math.min(limit, items.length) }, worker)
    );

    return results.filter(Boolean);
  }

  function publicationKey(pub) {
    if (pub.doi) return `doi:${normalizeDoi(pub.doi)}`;
    return `title:${normalizeTitle(pub.title)}`;
  }

  function crossrefLookup(items) {
    const byDoi = new Map();
    const byTitle = new Map();

    items.map(crossrefItemToPublication).filter(Boolean).forEach(pub => {
      if (pub.doi) byDoi.set(normalizeDoi(pub.doi), pub);
      byTitle.set(normalizeTitle(pub.title), pub);
    });

    return { byDoi, byTitle };
  }

  function mergePublication(base, extra) {
    if (!extra) return base;

    return {
      title: extra.title || base.title,
      authors: extra.authors || base.authors,
      journal: extra.journal || base.journal,
      year: extra.year || base.year,
      url: extra.url || base.url,
      doi: base.doi || extra.doi,
      sortDate: extra.sortDate || base.sortDate
    };
  }

  function dedupePublications(publications) {
    const byKey = new Map();

    publications.filter(Boolean).forEach(pub => {
      const key = publicationKey(pub);
      byKey.set(key, mergePublication(byKey.get(key) || pub, pub));
    });

    return Array.from(byKey.values()).sort((a, b) =>
      b.sortDate - a.sortDate || a.title.localeCompare(b.title)
    );
  }

  async function loadPublications() {
    if (publicationsPromise) return publicationsPromise;

    publicationsPromise = (async () => {
      const [orcidResult, crossrefResult] = await Promise.allSettled([
        fetchOrcidPublications(),
        fetchCrossrefByOrcid()
      ]);

      const orcidPublications = orcidResult.status === "fulfilled" ? orcidResult.value : [];
      const crossrefItems = crossrefResult.status === "fulfilled" ? crossrefResult.value : [];
      const lookup = crossrefLookup(crossrefItems);

      const missingDois = Array.from(new Set(
        orcidPublications
          .map(pub => normalizeDoi(pub.doi))
          .filter(doi => doi && !lookup.byDoi.has(doi))
      ));

      const detailItems = await mapWithLimit(missingDois, 4, fetchCrossrefByDoi);
      const detailedLookup = crossrefLookup(crossrefItems.concat(detailItems));
      const basePublications = orcidPublications.length ?
        orcidPublications :
        crossrefItems.map(crossrefItemToPublication).filter(Boolean);

      const merged = basePublications.map(pub => mergePublication(
        pub,
        detailedLookup.byDoi.get(normalizeDoi(pub.doi)) ||
          detailedLookup.byTitle.get(normalizeTitle(pub.title))
      ));

      const crossrefOnly = crossrefItems.map(crossrefItemToPublication).filter(Boolean);
      return dedupePublications(merged.concat(crossrefOnly));
    })();

    return publicationsPromise;
  }

  window.GhiPublicationSource = {
    cleanText,
    loadPublications
  };
})();
