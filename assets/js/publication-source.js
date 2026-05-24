// ### Publication source ###
// ORCID owns the full list. Crossref fills in cleaner author and journal metadata.
(function () {
  const ORCID_ID = "0000-0003-4427-2158";
  const ORCID_RECORD_URL = `https://pub.orcid.org/v3.0/${ORCID_ID}`;
  const ORCID_WORKS_URL = `${ORCID_RECORD_URL}/works`;
  const CROSSREF_WORKS_URL = "https://api.crossref.org/works";
  const EUROPE_PMC_SEARCH_URL = "https://www.ebi.ac.uk/europepmc/webservices/rest/search";

  let publicationsPromise = null;

  function cleanText(value) {
    const div = document.createElement("div");
    div.innerHTML = String(value || "");
    return div.textContent
      .replace(/\s+/g, " ")
      .replace(/\s+([,.;:])/g, "$1")
      .trim();
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

  function nameToPubMedStyle(name) {
    const cleanName = cleanText(name);
    if (!cleanName) return "";

    if (cleanName.includes(",")) {
      const [family, ...givenParts] = cleanName.split(",").map(part => part.trim());
      const initials = initialsFromGivenName(givenParts.join(" "));
      return initials ? `${family} ${initials}` : family;
    }

    const parts = cleanName.split(/\s+/).filter(Boolean);
    if (parts.length < 2) return cleanName;

    const lastPart = parts[parts.length - 1];
    const firstPart = parts[0];
    const lastPartLooksLikeInitials = /^[A-Z]{1,5}$/.test(lastPart.replace(/\./g, ""));
    const firstPartLooksLikeInitials = /^[A-Z]{1,5}$/.test(firstPart.replace(/\./g, ""));

    if (lastPartLooksLikeInitials && !firstPartLooksLikeInitials) {
      return cleanName;
    }

    const family = parts.pop();
    const initials = initialsFromGivenName(parts.join(" "));
    return initials ? `${family} ${initials}` : family;
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

  function workTypeLabel(type) {
    const labels = {
      "book-chapter": "Book chapter",
      "conference-paper": "Conference paper",
      "journal-article": "Journal article",
      "posted-content": "Preprint",
      "preprint": "Preprint"
    };

    return labels[cleanText(type).toLowerCase()] || "Publication";
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

  function pmidFromExternalIds(container) {
    const pmid = externalIds(container).find(id =>
      cleanText(id?.["external-id-type"]).toLowerCase() === "pmid"
    );

    return cleanText(externalIdValue(pmid));
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
    const pmid = pmidFromExternalIds(group?.["external-ids"]) ||
      pmidFromExternalIds(summary?.["external-ids"]);
    const dateParts = orcidDateParts(summary?.["publication-date"]);
    const title = cleanText(summary?.title?.title?.value || summary?.title?.["translated-title"]?.value);

    if (!title) return null;

    return {
      title,
      authors: "",
      journal: orcidValue(summary?.["journal-title"]) || workTypeLabel(summary?.type),
      year: dateParts[0] ? String(dateParts[0]) : "",
      url: cleanText(summary?.url?.value) || firstExternalUrl(group?.["external-ids"]) || doiUrl(doi),
      doi,
      pmid,
      putCode: summary?.["put-code"],
      sortDate: dateScore(dateParts)
    };
  }

  function initialsFromGivenName(given) {
    return cleanText(given)
      .replace(/\./g, " ")
      .split(/[\s-]+/)
      .map(part => part.charAt(0).toUpperCase())
      .filter(Boolean)
      .join("");
  }

  function formatAuthor(author) {
    const family = cleanText(author.family);
    const initials = initialsFromGivenName(author.given);

    if (family && initials) return `${family} ${initials}`;
    if (family) return family;

    return cleanText(author.name);
  }

  function formatAuthors(authors) {
    return (authors || [])
      .map(formatAuthor)
      .filter(Boolean)
      .join(", ");
  }

  function orcidContributorName(contributor) {
    return orcidValue(contributor?.["credit-name"]);
  }

  function formatOrcidContributors(contributors) {
    return (contributors?.contributor || [])
      .map(orcidContributorName)
      .map(nameToPubMedStyle)
      .filter(Boolean)
      .join(", ");
  }

  function compactAuthors(authors) {
    const names = cleanText(authors)
      .split(/\s*,\s*/)
      .map(name => name.trim())
      .filter(Boolean);

    if (!names.length) return "Yang R";
    return names.join(", ");
  }

  function displayVenue(pub) {
    const journal = cleanText(pub.journal) || "Publication";
    return pub.year ? `${journal} (${pub.year})` : journal;
  }

  function isGenericJournalLabel(journal) {
    return ["journal article", "publication"].includes(cleanText(journal).toLowerCase());
  }

  function withDisplayFields(pub) {
    return {
      ...pub,
      displayAuthors: compactAuthors(pub.authors),
      displayVenue: displayVenue(pub)
    };
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
      pmid: cleanText(item.PMID || item.pmid),
      sortDate: dateScore(dateParts)
    };
  }

  function orcidWorkToPublication(work) {
    const dateParts = orcidDateParts(work?.["publication-date"]);
    const doi = doiFromExternalIds(work?.["external-ids"]);
    const pmid = pmidFromExternalIds(work?.["external-ids"]);
    const title = cleanText(work?.title?.title?.value || work?.title?.["translated-title"]?.value);

    if (!title) return null;

    return {
      title,
      authors: formatOrcidContributors(work?.contributors),
      journal: orcidValue(work?.["journal-title"]) || workTypeLabel(work?.type),
      year: dateParts[0] ? String(dateParts[0]) : "",
      url: cleanText(work?.url?.value) || firstExternalUrl(work?.["external-ids"]) || doiUrl(doi),
      doi,
      pmid,
      putCode: work?.["put-code"],
      sortDate: dateScore(dateParts)
    };
  }

  function europePmcDateParts(item) {
    const date = cleanText(item.firstPublicationDate || item.firstIndexDate);
    const year = Number.parseInt(cleanText(item.pubYear), 10);
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) return date.split("-").map(Number);
    return year ? [year] : [];
  }

  function europePmcItemToPublication(item) {
    const dateParts = europePmcDateParts(item);
    const doi = normalizeDoi(item.doi);
    const title = cleanText(item.title);

    if (!title) return null;

    return {
      title,
      authors: cleanText(item.authorString),
      journal: cleanText(item.journalTitle),
      year: dateParts[0] ? String(dateParts[0]) : "",
      url: doiUrl(doi) || (item.pmid ? `https://pubmed.ncbi.nlm.nih.gov/${item.pmid}/` : ""),
      doi,
      pmid: cleanText(item.pmid),
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

  async function fetchOrcidJson(url) {
    try {
      return await fetchJson(url, "application/vnd.orcid+json");
    } catch (err) {
      return fetchJson(url);
    }
  }

  async function fetchOrcidPublications() {
    const data = await fetchOrcidJson(ORCID_WORKS_URL);
    return (data.group || []).map(orcidGroupToPublication).filter(Boolean);
  }

  async function fetchOrcidWorkByPutCode(putCode) {
    const data = await fetchOrcidJson(`${ORCID_RECORD_URL}/work/${putCode}`);
    return orcidWorkToPublication(data);
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

  async function fetchEuropePmcPublication(pub) {
    const url = new URL(EUROPE_PMC_SEARCH_URL);

    if (pub.pmid) {
      url.searchParams.set("query", `EXT_ID:${pub.pmid} AND SRC:MED`);
    } else if (pub.doi) {
      url.searchParams.set("query", `DOI:"${pub.doi}"`);
    } else {
      url.searchParams.set("query", `TITLE:"${pub.title}"`);
    }

    url.searchParams.set("format", "json");
    url.searchParams.set("pageSize", "1");

    const data = await fetchJson(url.toString());
    return europePmcItemToPublication(data.resultList?.result?.[0]);
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

  function publicationLookup(publications) {
    const byDoi = new Map();
    const byPmid = new Map();
    const byTitle = new Map();

    publications.filter(Boolean).forEach(pub => {
      if (pub.doi) byDoi.set(normalizeDoi(pub.doi), pub);
      if (pub.pmid) byPmid.set(cleanText(pub.pmid), pub);
      byTitle.set(normalizeTitle(pub.title), pub);
    });

    return { byDoi, byPmid, byTitle };
  }

  function mergePublication(base, extra) {
    if (!extra) return base;

    return {
      title: extra.title || base.title,
      authors: extra.authors || base.authors,
      journal: extra.journal && isGenericJournalLabel(base.journal) ?
        extra.journal :
        extra.journal || base.journal,
      year: extra.year || base.year,
      url: extra.url || base.url,
      doi: base.doi || extra.doi,
      pmid: base.pmid || extra.pmid,
      sortDate: extra.sortDate || base.sortDate
    };
  }

  function dedupePublications(publications) {
    const byKey = new Map();

    publications.filter(Boolean).forEach(pub => {
      const key = publicationKey(pub);
      byKey.set(key, mergePublication(byKey.get(key) || pub, pub));
    });

    return Array.from(byKey.values())
      .map(withDisplayFields)
      .sort((a, b) => b.sortDate - a.sortDate || a.title.localeCompare(b.title));
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
      const orcidDetails = await mapWithLimit(
        orcidPublications.map(pub => pub.putCode).filter(Boolean),
        4,
        fetchOrcidWorkByPutCode
      );
      const orcidDetailsByPutCode = new Map(
        orcidDetails.map(pub => [pub.putCode, pub])
      );
      const enrichedOrcidPublications = orcidPublications.map(pub =>
        mergePublication(pub, orcidDetailsByPutCode.get(pub.putCode))
      );

      const missingDois = Array.from(new Set(
        enrichedOrcidPublications
          .map(pub => normalizeDoi(pub.doi))
          .filter(doi => doi && !lookup.byDoi.has(doi))
      ));

      const detailItems = await mapWithLimit(missingDois, 4, fetchCrossrefByDoi);
      const detailedLookup = crossrefLookup(crossrefItems.concat(detailItems));
      const basePublications = enrichedOrcidPublications.length ?
        enrichedOrcidPublications :
        crossrefItems.map(crossrefItemToPublication).filter(Boolean);
      const genericVenuePublications = basePublications.filter(pub =>
        isGenericJournalLabel(pub.journal) && (pub.pmid || pub.doi || pub.title)
      );
      const europePmcPublications = await mapWithLimit(
        genericVenuePublications,
        4,
        fetchEuropePmcPublication
      );
      const europePmcLookup = publicationLookup(europePmcPublications);

      const merged = basePublications.map(pub => mergePublication(
        pub,
        europePmcLookup.byPmid.get(cleanText(pub.pmid)) ||
          europePmcLookup.byDoi.get(normalizeDoi(pub.doi)) ||
          europePmcLookup.byTitle.get(normalizeTitle(pub.title)) ||
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
