$(document).ready(function() {
    let baseURL = ""
    let baseDomain = "";

    $('.sub-btn').click(function(){
        $(this).next('.sub-menu').slideToggle();
        $(this).find('.dropdown').toggleClass('rotate');
    });
    
    $('.menu-btn').click(function(){
        $('.side-bar').addClass('active');
        $('.menu-btn').css('visiblity', 'hidden');
    });

    $('.close-btn').click(function(){
        $('.side-bar').removeClass('active');
        $('.menu-btn').css('visiblity', 'visible');
    });

    async function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Function to show error message on the HTML page
    function showError(errorMessage) {
        toastr.error(errorMessage);
    }

    function getActiveTabBaseDomain(callback) {
        chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
            // Get the URL of the active tab
            var url = tabs[0].url;
            var parsedUrl = new URL(url);
            baseURL = parsedUrl.toString();
            baseDomain = parsedUrl.hostname
            callback(baseDomain, baseURL);
        });
    }

    getActiveTabBaseDomain(function(domain, url) {
        baseDomain = domain;
        baseURL = url;
        if (!baseDomain || (!baseDomain.includes("sellercentral.amazon") && !baseDomain.includes("advertising.amazon") && !baseURL.includes(".html"))) {
            showError("Make sure to login to any Seller Central page before use");
            $('#loadingScreen').hide();
        }
    });

    function getMarketPlaceId(selectedMarketPlace) {
        const ids = {
            "us": "ATVPDKIKX0DER",
            "uk": "A1F83G8C2ARO7P",
            "de": "A1PA6795UKMFR9",
            "fr": "A13V1IB3VIYZZH",
            "it": "APJ6JRA9NG5V4",
            "es": "A1RKKUPIHCS9HS",
            "jp": "A1VC38T7YXB528",
            "se": "A2NODRKZP88ZB9",
            "pl": "A1C3SOZRARQ6R3",
            "be": "AMEN7PMS3EDWL",
            "au": "AOZFGU372UMI1",
            "nl": "A1805IZSGTT6HS",
            "mx": "A1AM78C64UM0Y8",
        };
        return ids[selectedMarketPlace];
    }

    function formatData(asin, nicheDataList) {
        const newNicheDataList = [];
        nicheDataList.forEach(nicheData => {
            const dataDict = {
                "ASIN/Keyword": asin,
                "Customer Need": nicheData.nicheTitle,
                "Top Search Term 1": "",
                "Top Search Term 2": "",
                "Top Search Term 3": "",
                "Search Volume (Past 360 days)": nicheData.nicheSummary.searchVolumeT360,
                "Search Volume Growth (Past 180 days)": nicheData.nicheSummary.searchVolumeGrowth180,
                "Search Volume (Past 90 days)": nicheData.nicheSummary.searchVolumeT90,
                "Search Volume Growth (Past 90 days)": nicheData.nicheSummary.searchVolumeGrowth90,
                "Units Sold Lower Bound (Past 360 days)": nicheData.nicheSummary.minimumUnitsSoldT360,
                "Units Sold Upper Bound (Past 360 days)": nicheData.nicheSummary.maximumUnitsSoldT360,
                "Average Units Sold Lower Bound (Past 360 days)": nicheData.nicheSummary.minimumAverageUnitsSoldT360,
                "Average Units Sold Upper Bound (Past 360 days)": nicheData.nicheSummary.maximumAverageUnitsSoldT360,
                "# of Top Clicked Products": nicheData.nicheSummary.productCount,
                "Average Price (USD)": nicheData.nicheSummary.avgPriceT360,
                "Minimum Price (Past 360 days) (USD)": nicheData.nicheSummary.minimumPrice,
                "Maximum Price (Past 360 days) (USD)": nicheData.nicheSummary.maximumPrice,
                "Return Rate (Past 360 days)": (nicheData.returnRateT360 * 100).toFixed(2)
            };
            const topSearchTerms = nicheData.topSearchTermMetrics;
            const topSearchTermsLimited = topSearchTerms.slice(0, 3);
            topSearchTermsLimited.forEach((term, index) => {
                dataDict[`Top Search Term ${index + 1}`] = term.searchTerm;
            });
            newNicheDataList.push(dataDict);
        });
        return newNicheDataList;
    }

    async function getNicheViewData(marketPlaceId, asin, searchASIN) {
        const csrf_response = await fetch(`https://${baseDomain}/ox-api/graphql`, {
            method: 'GET',
        });


        let asinSearchFilter = {
            asinId: asin,
            multiSelectFilters: [],
            obfuscatedMarketplaceId: marketPlaceId,
            rangeFilters: [],
        };

        if (searchASIN == false) {
            asinSearchFilter = {
                obfuscatedMarketplaceId: marketPlaceId,
                searchTermsFilter: {
                    searchInput: asin,
                }
            };
        }
        
        const csrfToken = csrf_response.headers.get('anti-csrftoken-a2z');
        if (csrfToken) {
            
            const jsonPayload = {
                query: 'query getNiches($filter: NicheFilter!, $useNewQuery: Boolean, $searchImprovementsEnabled: Boolean) {\n  niches(\n    filter: $filter\n    useNewQuery: $useNewQuery\n    searchImprovementsEnabled: $searchImprovementsEnabled\n  ) {\n    nicheId\n    obfuscatedMarketplaceId\n    nicheTitle\n    referenceAsinImageUrl\n    currency\n    nicheSummary {\n      searchVolumeT90\n      searchVolumeGrowthT90\n      searchVolumeT360\n      searchVolumeGrowthT180\n      searchVolumeGrowthT360\n      minimumUnitsSoldT90\n      maximumUnitsSoldT90\n      minimumUnitsSoldT360\n      maximumUnitsSoldT360\n      minimumAverageUnitsSoldT360\n      maximumAverageUnitsSoldT360\n      minimumPrice\n      maximumPrice\n      salesPotentialScore\n      productCount\n      avgPrice\n      avgPriceT360\n      demand\n      category\n      nicheType\n      returnRateT360\n      __typename\n    }\n    topSearchTermMetrics {\n      searchTerm\n      __typename\n    }\n    __typename\n  }\n}',
                operationName: 'getNiches',
                variables: {
                    filter: asinSearchFilter,
                    useNewQuery: true,
                    searchImprovementsEnabled: true,
                },
            };
            
            const response = await fetch(`https://${baseDomain}/ox-api/graphql`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'anti-csrftoken-a2z': csrfToken, // Include the retrieved CSRF token
                },
                body: JSON.stringify(jsonPayload),
            });
        
            if (response.ok) {
                const responseData = await response.json();
                let niches = responseData.data.niches;
                // logs searchASIN and niche lenght
                if (searchASIN === true && niches.length == 0) {
                    return getNicheViewData(marketPlaceId, asin, false);
                }
                return niches;
            } else {
                if (searchASIN === true) {
                    return getNicheViewData(marketPlaceId, asin, false);;
                }
                showError(`Failed to fetch ASIN view data for ASIN/Keyword: ${asin}`);
                throw new Error(`Failed to fetch ASIN view data: ${response.status}`);
            }
        }
    }

    function writeDataToFile(fileName, asinDataList) {
        // Helper function to escape double quotes in a string
        const escapeDoubleQuotes = str => str.replace(/"/g, '""');
    
        const headerRow = Object.keys(asinDataList[0]).map(escapeDoubleQuotes).join(',') + '\n';
        // Create data rows
        const dataRows = asinDataList.map(data =>
            Object.values(data)
                .map(value => typeof value === 'string' ? `"${escapeDoubleQuotes(value)}"` : value)
                .join(',')
        ).join('\n');
        // Combine header and data rows
        const csvContent = headerRow + dataRows;
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', fileName);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    function getCurrentDateTime() {
        const now = new Date();
    
        // Get the date components
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
    
        // Get the time components
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
    
        // Combine date and time components with the desired separator
        const dateTimeString = `${year}-${month}-${day}T${hours}_${minutes}_${seconds}`;
    
        return dateTimeString;
    }
    

    function getSelectedOption() {
        var selectedOption = null;
        var options = document.getElementsByName('downloadType');
        for (var i = 0; i < options.length; i++) {
            if (options[i].checked) {
                selectedOption = options[i].value;
                break;
            }
        }
        return selectedOption;
    }

    async function main() {
        const selectedMarketPlace = $('#marketplaceSelect').val();
        const asinList = $('#asinInput').val().trim().split('\n').filter(Boolean);
        const outputOption = getSelectedOption()

        if (asinList.length === 0 || !selectedMarketPlace || !outputOption) {
            toastr.error('Please enter ASIN and select at least one market place option', '', {
                "positionClass": "toast-top-center",
                "tapToDismiss": true,
                "showMethod": "fadeIn",
                "hideMethod": "fadeOut",
                "newestOnTop": true,
                "escapeHtml": false,
            });
            return;
        }
        $('#loadingScreen').show();

        let allNicheDataList = [];
        const marketId = getMarketPlaceId(selectedMarketPlace);
        for (const asin of asinList) {
            try{
                const nicheDataList = await getNicheViewData(marketId, asin, true);
                if (nicheDataList.length !== 0){
                    const formattedDataList = formatData(asin, nicheDataList);
                    if (outputOption === "separateCSV") {
                        const fileName = `Niche_View_${asin}_${selectedMarketPlace.toUpperCase()}_${getCurrentDateTime()}.csv`;
                        writeDataToFile(fileName, formattedDataList);
                        toastr.success(`CSV file downloaded successfully for ASIN: ${asin}`);
                    } else {
                        allNicheDataList = allNicheDataList.concat(formattedDataList);
                    }
                    sleep(2000)
                }else{
                    showError(`No data found for asin/keyword: ${asin}`)
                }
            }
            catch(e){
                showError(`No data found for asin/keyword: ${asin}`)
            }
        }
    
        if (outputOption !== "separateCSV" && allNicheDataList.length > 0) {
            const fileName = `Niche_View_${selectedMarketPlace.toUpperCase()}_${getCurrentDateTime()}.csv`;
            writeDataToFile(fileName, allNicheDataList);
            toastr.success(`CSV file downloaded successfully`);
        }
        $('#loadingScreen').hide();
    }

    $('#submitButton').on('click', main);
});