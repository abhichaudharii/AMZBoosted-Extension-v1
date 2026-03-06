$(document).ready(function () {
    let baseURL = "";
    let baseDomain = "";

    const sleep = ms => new Promise(r => setTimeout(r, ms));

    function showError(msg) {
        toastr.error(msg);
    }

    /* ---------------- TAB ---------------- */

    function getActiveTabBaseDomain(callback) {
        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            const url = new URL(tabs[0].url);
            baseURL = url.toString();
            baseDomain = url.hostname;
            callback();
        });
    }

    getActiveTabBaseDomain(() => {
        if (!baseDomain.includes("sellercentral.amazon")) {
            showError("Please open Seller Central before using this tool");
            $('#loadingScreen').hide();
        }
    });

    /* ---------------- MARKETPLACE ---------------- */

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

    /* ---------------- SEARCH HELPERS ---------------- */

    function isASIN(val) {
        return /^[A-Z0-9]{10}$/.test(val.trim());
    }

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

    /* ---------------- NICHE DETAILS (NEW TOOL DATA) ---------------- */

    async function getNicheDetails(marketPlaceId, nicheId) {
        const csrf = await getCsrfToken();

        const payload = {
            query: `
            query getNiche($input: NicheInput!) {
              niche(request: $input) {
                nicheTitle
                nicheSummary {
                  searchVolumeT360
                  avgPriceT360
                  productCount
                  returnRateT360
                }
                searchTermMetrics {
                  searchTerm
                  searchVolumeT360
                  searchConversionRateT360
                  clickShare
                  topClickedProducts {
                    asin
                    asinTitle
                  }
                }
              }
            }`,
            operationName: "getNiche",
            variables: {
                input: {
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
                let nicheHits = [];

                if (isASIN(input)) {
                    const asinSearch = await axSearch(marketPlaceId, input);
                    if (asinSearch.length > 0) {
                        nicheHits = await searchNiches(marketPlaceId, input);
                    }
                } else {
                    nicheHits = await searchNiches(marketPlaceId, input);
                }

                const uniqueNiches = new Map();
                nicheHits.forEach(h =>
                    h.nicheHits.forEach(n =>
                        uniqueNiches.set(n.nicheId, n)
                    )
                );

                for (const niche of uniqueNiches.values()) {
                    const details = await getNicheDetails(
                        niche.obfuscatedMarketplaceId,
                        niche.nicheId
                    );

                    console.log("Niche:", details.nicheTitle);
                    console.log("Search terms:", details.searchTermMetrics);

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
