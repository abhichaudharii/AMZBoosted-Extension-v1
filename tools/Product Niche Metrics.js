$(document).ready(function () {
    let baseURL = "";
    let baseDomain = "";

    async function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    function showError(msg) {
        toastr.error(msg);
    }

    function getActiveTabBaseDomain(callback) {
        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            const url = new URL(tabs[0].url);
            baseURL = url.toString();
            baseDomain = url.hostname;
            callback(baseDomain, baseURL);
        });
    }

    getActiveTabBaseDomain(function (domain) {
        if (!domain || !domain.includes("sellercentral.amazon")) {
            showError("Please open any Seller Central page first");
            $('#loadingScreen').hide();
        }
    });

    function getMarketPlaceId(mp) {
        return {
            us: "ATVPDKIKX0DER",
            uk: "A1F83G8C2ARO7P",
            gb: "A1F83G8C2ARO7P",
            de: "A1PA6795UKMFR9",
            fr: "A13V1IB3VIYZZH",
            it: "APJ6JRA9NG5V4",
            es: "A1RKKUPIHCS9HS",
            jp: "A1VC38T7YXB528"
        }[mp];
    }

    /* ---------------- CSRF ---------------- */

    async function getCsrfToken() {
        const res = await fetch(`https://${baseDomain}/ox-api/graphql`, {
            method: "GET",
            credentials: "include"
        });
        return res.headers.get("anti-csrftoken-a2z");
    }

    /* ---------------- RESOLVERS ---------------- */

    async function axSearch(marketPlaceId, text) {
        const csrf = await getCsrfToken();
        const payload = {
            query: `
            query axSearchQuery($obfuscatedMarketplaceId: String!, $searchText: String!, $pageSize: Int) {
              axSearch(
                obfuscatedMarketplaceId: $obfuscatedMarketplaceId
                searchText: $searchText
                pageSize: $pageSize
              ) {
                searchResults
              }
            }`,
            operationName: "axSearchQuery",
            variables: {
                obfuscatedMarketplaceId: marketPlaceId,
                searchText: text,
                pageSize: 10
            }
        };

        const r = await fetch(`https://${baseDomain}/ox-api/graphql`, {
            method: "POST",
            headers: {
                "content-type": "application/json",
                "anti-csrftoken-a2z": csrf
            },
            credentials: "include",
            body: JSON.stringify(payload)
        });

        const j = await r.json();
        return j?.data?.axSearch?.searchResults || [];
    }

    async function searchNiches(marketPlaceId, text) {
        const csrf = await getCsrfToken();
        const payload = {
            query: `
            query searchNicheSearchTerms($input: SearchNicheRequest) {
              searchNiches(request: $input) {
                hits {
                  searchTerm
                  nicheHits {
                    nicheId
                    obfuscatedMarketplaceId
                  }
                }
              }
            }`,
            operationName: "searchNicheSearchTerms",
            variables: {
                input: {
                    obfuscatedMarketplaceId: marketPlaceId,
                    partialSearchTerm: text,
                    pageSize: 10
                }
            }
        };

        const r = await fetch(`https://${baseDomain}/ox-api/graphql`, {
            method: "POST",
            headers: {
                "content-type": "application/json",
                "anti-csrftoken-a2z": csrf
            },
            credentials: "include",
            body: JSON.stringify(payload)
        });

        const j = await r.json();
        return j?.data?.searchNiches?.hits || [];
    }

    /* ---------------- NICHES ---------------- */

    async function getNicheViewData(marketPlaceId, input, isAsin) {
        const csrf = await getCsrfToken();

        const filter = isAsin
            ? {
                obfuscatedMarketplaceId: marketPlaceId,
                asinId: input,
                rangeFilters: [],
                multiSelectFilters: []
            }
            : {
                obfuscatedMarketplaceId: marketPlaceId,
                rangeFilters: [],
                multiSelectFilters: [],
                searchTermsFilter: { searchInput: input }
            };

        const payload = {
            query: `
            query getNiches($filter: NicheFilter!, $useNewQuery: Boolean) {
              niches(filter: $filter, useNewQuery: $useNewQuery) {
                nicheId
                obfuscatedMarketplaceId
                nicheTitle
              }
            }`,
            operationName: "getNiches",
            variables: {
                filter,
                useNewQuery: true
            }
        };

        const r = await fetch(`https://${baseDomain}/ox-api/graphql`, {
            method: "POST",
            headers: {
                "content-type": "application/json",
                "anti-csrftoken-a2z": csrf
            },
            credentials: "include",
            body: JSON.stringify(payload)
        });

        const j = await r.json();
        return j?.data?.niches || [];
    }

    async function getNicheDetails(marketPlaceId, nicheId) {
        const csrf = await getCsrfToken();

        const payload = {
            query: `
            query getNiche($nicheInput: NicheInput!) {
              niche(request: $nicheInput) {
                nicheTitle
                nicheSummary {
                  searchVolumeT360
                  searchVolumeGrowthT180
                  minimumAverageUnitsSoldT360
                  maximumAverageUnitsSoldT360
                  avgPriceT360
                  productCount
                  returnRateT360
                }
                asinMetrics(request: $nicheInput) {
                  asin
                  asinTitle
                  brand
                  category
                  launchDate
                  avgPriceT360
                  clickCountT360
                  clickShareT360
                  totalReviews
                  customerRating
                  bestSellersRanking
                  avgSellerVendorCountT360
                }
              }
            }`,
            operationName: "getNiche",
            variables: {
                nicheInput: {
                    nicheId,
                    obfuscatedMarketplaceId: marketPlaceId
                }
            }
        };

        const r = await fetch(`https://${baseDomain}/ox-api/graphql`, {
            method: "POST",
            headers: {
                "content-type": "application/json",
                "anti-csrftoken-a2z": csrf
            },
            credentials: "include",
            body: JSON.stringify(payload)
        });

        const j = await r.json();
        return j?.data?.niche;
    }

    /* ---------------- MAIN ---------------- */

    async function main() {
        const marketplace = $('#marketplaceSelect').val();
        const inputs = $('#asinInput').val().trim().split('\n').filter(Boolean);
        const marketPlaceId = getMarketPlaceId(marketplace);

        if (!marketPlaceId || inputs.length === 0) {
            showError("Missing marketplace or input");
            return;
        }

        $('#loadingScreen').show();

        for (const input of inputs) {
            try {
                const [asinHits, keywordHits] = await Promise.all([
                    axSearch(marketPlaceId, input),
                    searchNiches(marketPlaceId, input)
                ]);

                let niches = [];

                if (keywordHits.length > 0) {
                    niches = await getNicheViewData(marketPlaceId, input, false);
                } else {
                    // always try ASIN
                    niches = await getNicheViewData(marketPlaceId, input, true);
                }

                for (const n of niches) {
                    const details = await getNicheDetails(n.obfuscatedMarketplaceId, n.nicheId);
                    console.log("Niche details:", details);
                    await sleep(2000);
                }

            } catch (e) {
                console.error(e);
                showError(`Failed for: ${input}`);
            }
        }

        $('#loadingScreen').hide();
    }

    $('#submitButton').on('click', main);
});
