async function downloadChildASINReport(baseDomain, startDate, endDate) {
    const apiURL = `https://${baseDomain}/business-reports/api`;
    
    // Initialize the payload for the first request without the page number
    const payload = {
        operationName: "reportDataQuery",
        variables: {
            input: {
                legacyReportId: "102:DetailSalesTrafficByChildItem",
                startDate: startDate,
                endDate: endDate,
                asins:["B0CJCMF6KW"]
            }
        },
        query: `query reportDataQuery($input: GetReportDataInput) {
            getReportData(input: $input) {
                granularity
                hadPrevious
                hasNext
                size
                startDate
                endDate
                page
                columns {
                    label
                    valueFormat
                    isGraphable
                    translationKey
                    isDefaultSortAscending
                    isDefaultGraphed
                    isDefaultSelected
                    isDefaultSortColumn
                    __typename
                }
                rows
                __typename
            }
        }`
    };

    try {
        // Fetch the first page
        const response = await fetch(apiURL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        let jsonData = await response.json();
        let reportData = jsonData.data.getReportData;

        // Initialize the response object to return
        const finalResponse = {
            ...reportData,
            rows: [...reportData.rows] // Start with the rows from the first response
        };

        let pageCount = 0

        // Loop to fetch additional pages if they exist
        while (reportData.hasNext) {
            // Increment the page number for the next request
            payload.variables.input.page = pageCount + 1;

            // Fetch the next page
            const nextResponse = await fetch(apiURL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (!nextResponse.ok) {
                throw new Error(`HTTP error! Status: ${nextResponse.status}`);
            }

            jsonData = await nextResponse.json();
            reportData = jsonData.data.getReportData;

            // Append the new rows to the final response
            finalResponse.rows.push(...reportData.rows);
        }

        return finalResponse; // Return the final response with all rows

    } catch (error) {
        console.error('An error occurred:', error);
        return null;
    }
}


async function runChildASINTask(task) {
    var tabId = 11;
    const baseDomain = getBaseDomain(task.marketURL);
    let switchMarketplaceURL = await getSwitchMarketplaceURL(task.marketplaceName, baseDomain, task.amazonAccount);
    
    chrome.tabs.create({ url: 'https://google.com/' }, function(newTab) {
        setTimeout(function() {
            tabId = newTab.id;
            chrome.tabs.sendMessage(tabId, { action: 'switchPartner', switchMarketplaceURL, tabId});
        }, 2000);
    });

    const { startDate, endDate } = getReportDateRange(task.reportDate);
    setTimeout(async function () {
        try {
            let jsonData = { columns: [], rows: [] };
            if (task.downloadType === 'singleDateRange') {
                let jsonDataOut = await downloadChildASINReport(baseDomain, startDate, endDate);
    
                // Add new column names for startDate and endDate
                jsonData.columns = jsonDataOut.columns;
                jsonData.columns.push({ label: 'startDate' });
                jsonData.columns.push({ label: 'endDate' });
    
                jsonData.rows = jsonDataOut.rows;
                jsonData.rows.forEach(row => {
                    row.push(startDate);
                    row.push(endDate);
                });
                let fileName = `${task.filenamePrefix || ''}ChildASIN_${task.marketplaceName}_${getCurrentDateTime()}${task.filenameSuffix || ''}.csv`;
                chrome.tabs.sendMessage(tabId, { action: 'downloadChildASINReportCSV', fileName, jsonData, tabId });
            } else {
                let start = new Date(startDate);
                let end = new Date(endDate);
                
                while (start <= end) {
                    let currentDateString = start.toISOString().split('T')[0];
                    let jsonDataOut = await downloadChildASINReport(baseDomain, currentDateString, currentDateString);
    
                    // Only set the columns once
                    if (jsonData.columns.length === 0) {
                        jsonData.columns = jsonDataOut.columns;
                        jsonData.columns.push({ label: 'startDate' });
                        jsonData.columns.push({ label: 'endDate' });
                    }
    
                    jsonDataOut.rows.forEach(row => {
                        row.push(currentDateString);
                        row.push(currentDateString);
                    });
    
                    jsonData.rows = jsonData.rows.concat(jsonDataOut.rows);
    
                    start.setDate(start.getDate() + 1);
    
                    await sleep(500); // Introduce a delay between each iteration
                }
                
                let fileName = `${task.filenamePrefix || ''}ChildASIN_${task.marketplaceName}_${getCurrentDateTime()}_daily${task.filenameSuffix || ''}.csv`;
                chrome.tabs.sendMessage(tabId, { action: 'downloadChildASINReportCSV', fileName, jsonData, tabId });
                if (tabId !== 11){
                    chrome.tabs.remove(tabId);
                }
            }
        } catch (error) {
            console.error('Error processing dates:', error);
        }
    }, 5000);
}