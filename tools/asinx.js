$(document).ready(function() {
    // https://sellercentral.amazon.com/opportunity-explorer/explore/search?search=B0CRQHVP6Q&search_type=ASIN
    // https://sellercentral.amazon.com/opportunity-explorer/explore/search?search=6%2520Pack%2520Fairy%2520Lights%2520Battery%2520Operated&search_type=KEYWORD
    
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

    function formatData(asin, asinDataList) {

        const newAsinDataList = [];
        asinDataList.forEach(asinData => {
            const dataDict = {
                "ASIN/Keyword": asin,
                "Product Name": asinData.productName,
                "ASIN": asinData.asin,
                "Brand": asinData.brand,
                "Category": asinData.category,
                "Launch Date": asinData.launchDate,
                "Search Click Count (Past 360 days)": asinData.clickCountT360,
                "Average Selling Price (past 90 days) (USD)": asinData.averageSellingPriceT90,
                "Average Selling Price (past 360 days) (USD)": asinData.averageSellingPriceT360,
                "Total Ratings": asinData.totalReviews,
                "Average Rating": asinData.averageCustomerRating,
                "Average BSR": asinData.averageBestSellersRanking,
                "Average # of Selling Partners": asinData.totalOfferDepthT90,
            };
            newAsinDataList.push(dataDict);
        });
        return newAsinDataList;
    }

    async function getAsinViewData(marketPlaceId, asin) {
        const jsonPayload = {
            query: 'query axGetAsins($filter: AxAsinFilter!) {\n  axAsins(filter: $filter) {\n    obfuscatedMarketplaceId\n    asin\n    productName\n    asinImageUrl\n    currency\n    brand\n    category\n    launchDate\n    clickCount\n    clickCountT360\n    averageSellingPriceT90\n    averageSellingPriceT360\n    totalReviews\n    averageCustomerRating\n    averageBestSellersRanking\n    totalOfferDepthT90\n    newOfferAvgDepthT90\n    pageViewsT7\n    pageViewsT7StartDate\n    pageViewsT7EndDate\n    pageViewsLatest\n    pageViewsLatestDate\n    isExactMatch\n    __typename\n  }\n}',
            operationName: 'axGetAsins',
            variables: {
                filter: {
                    obfuscatedMarketplaceId: marketPlaceId,
                    searchTermsFilter: {
                        searchInput: asin,
                    },
                },
            },
        };

        const csrf_response = await fetch(`https://${baseDomain}/ox-api/graphql`, {
            method: 'GET',
        });
        
        const csrfToken = csrf_response.headers.get('anti-csrftoken-a2z');
        if (csrfToken) {
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
                return responseData.data.axAsins;
            } else {
                showError(`Failed to fetch ASIN view data for ASIN: ${asin}`)
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

        let allAsinDataList = [];
        const marketId = getMarketPlaceId(selectedMarketPlace);
        for (const asin of asinList) {
            try{
                const asinDataList = await getAsinViewData(marketId, asin);
                if (asinDataList.length !== 0){
                    const formattedDataList = formatData(asin, asinDataList);
                    if (outputOption === "separateCSV") {
                        const fileName = `ASIN_VIEW_${asin}_${selectedMarketPlace.toUpperCase()}_${getCurrentDateTime()}.csv`;
                        writeDataToFile(fileName, formattedDataList);
                        toastr.success(`CSV file downloaded successfully for ASIN: ${asin}`);
                    } else {
                        allAsinDataList = allAsinDataList.concat(formattedDataList);
                    }
                    sleep(2000)
                }else{
                    showError(`No data found for asin: ${asin}`)
                }
            }
            catch(e){
                showError(`No data found for asin: ${asin}`)
            }
        }
    
        if (outputOption !== "separateCSV" && allAsinDataList.length > 0) {
            const fileName = `ASIN_VIEW_${selectedMarketPlace.toUpperCase()}_${getCurrentDateTime()}.csv`;
            writeDataToFile(fileName, allAsinDataList);
            toastr.success(`CSV file downloaded successfully`);
        }
        $('#loadingScreen').hide();
    }

    $('#submitButton').on('click', main);
});