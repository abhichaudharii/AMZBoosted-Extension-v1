export default defineContentScript({
    matches: [
        '*://*.amazon.com/*',
        '*://*.amazon.co.uk/*',
        '*://*.amazon.ca/*',
        '*://*.amazon.de/*',
        '*://*.amazon.fr/*',
        '*://*.amazon.it/*',
        '*://*.amazon.es/*',
        '*://*.amazon.in/*',
    ],
    main() {
        console.log('[AMZBoosted] Content script loaded on Amazon page');

        // Listen for messages from background script
        chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
            console.log('[Content] Message received:', message);

            if (message.type === 'extractData') {
                handleExtractData(message.url)
                    .then((data) => sendResponse({ success: true, data }))
                    .catch((error) => sendResponse({ success: false, error: error.message }));
                return true; // Keep channel open for async response
            }

            if (message.type === 'copyToClipboard') {
                try {
                    // Copy text to clipboard using the Clipboard API
                    navigator.clipboard.writeText(message.text)
                        .then(() => {
                            console.log('[Content] Text copied to clipboard:', message.text);
                            sendResponse({ success: true });
                        })
                        .catch((error) => {
                            console.error('[Content] Failed to copy to clipboard:', error);
                            sendResponse({ success: false, error: error.message });
                        });
                } catch (error) {
                    console.error('[Content] Clipboard API not available:', error);
                    sendResponse({ success: false, error: 'Clipboard API not available' });
                }
                return true; // Keep channel open for async response
            }

            if (message.type === 'ping') {
                sendResponse({ success: true, message: 'Content script ready' });
                return false; // Synchronous response
            }

            if (message.type === 'CHECK_MARKETPLACE') {
                // Logic to check current marketplace
                const marketplace = detectMarketplace();
                sendResponse({ marketplace });
                return false;
            }

            if (message.type === 'CHANGE_MARKETPLACE') {
                const { target } = message;
                console.log(`[Content] Simulating marketplace change to ${target}`);
                // In a real scenario, we might redirect:
                // window.location.href = `https://${target}`;

                // For now, just acknowledge
                sendResponse({ success: true });
                return false;
            }

            return false; // Unknown message type
        });

        // Main data extraction function
        async function handleExtractData(url: string) {
            console.log('[Content] Extracting data from:', url);

            const pageType = detectPageType();
            const asin = extractASINFromURL(url);

            const data: any = {
                url,
                extractedAt: new Date().toISOString(),
                type: pageType,
                marketplace: detectMarketplace(),
                asin,
            };

            // Extract based on page type
            switch (pageType) {
                case 'product-detail':
                    data.product = extractProductDetails();
                    data.reviews = await extractReviews();
                    data.pricing = extractPricing();
                    data.availability = extractAvailability();
                    break;

                case 'search-results':
                    data.products = extractSearchResults();
                    break;

                case 'seller-central':
                    data.sellerInfo = extractSellerInfo();
                    break;

                default:
                    data.title = document.title;
                    data.html = document.documentElement.outerHTML.substring(0, 1000); // First 1KB
            }

            return data;
        }

        // Extract product details from product page
        function extractProductDetails() {
            const title = document.querySelector('#productTitle')?.textContent?.trim() || '';
            const brand = document.querySelector('#bylineInfo')?.textContent?.trim() || '';
            const rating = document.querySelector('[data-hook="rating-out-of-text"]')?.textContent?.trim() || '';
            const reviewCount = document.querySelector('[data-hook="total-review-count"]')?.textContent?.trim() || '';
            const imageUrl = (document.querySelector('#landingImage') as HTMLImageElement)?.src || '';

            // Extract features
            const features: string[] = [];
            document.querySelectorAll('#feature-bullets li').forEach((li) => {
                const text = li.textContent?.trim();
                if (text) features.push(text);
            });

            // Extract product details
            const details: Record<string, string> = {};
            document.querySelectorAll('.prodDetTable tr, .detail-bullet-list tr').forEach((tr) => {
                const th = tr.querySelector('th')?.textContent?.trim();
                const td = tr.querySelector('td')?.textContent?.trim();
                if (th && td) {
                    details[th] = td;
                }
            });

            return {
                title,
                brand,
                rating,
                reviewCount,
                imageUrl,
                features,
                details,
            };
        }

        // Extract reviews (first page)
        async function extractReviews() {
            const reviews: any[] = [];

            document.querySelectorAll('[data-hook="review"]').forEach((reviewEl) => {
                const rating = reviewEl.querySelector('[data-hook="review-star-rating"]')?.textContent?.trim() || '';
                const title = reviewEl.querySelector('[data-hook="review-title"]')?.textContent?.trim() || '';
                const body = reviewEl.querySelector('[data-hook="review-body"]')?.textContent?.trim() || '';
                const author = reviewEl.querySelector('.a-profile-name')?.textContent?.trim() || '';
                const date = reviewEl.querySelector('[data-hook="review-date"]')?.textContent?.trim() || '';
                const verified = !!reviewEl.querySelector('[data-hook="avp-badge"]');
                const helpful = reviewEl.querySelector('[data-hook="helpful-vote-statement"]')?.textContent?.trim() || '';

                reviews.push({
                    rating,
                    title,
                    body,
                    author,
                    date,
                    verified,
                    helpful,
                });
            });

            return reviews;
        }

        // Extract pricing information
        function extractPricing() {
            // Priority list for Current Price
            const priceSelectors = [
                '.priceToPay .a-offscreen', // Common on new layouts
                '.a-price .a-offscreen',    // Standard
                '#corePrice_feature_div .a-offscreen',
                '#price_inside_buybox',
                '.aok-offscreen', // User reported case
            ];

            let price = '';
            for (const selector of priceSelectors) {
                const el = document.querySelector(selector);
                const text = el?.textContent?.trim();
                // Check if text looks like a price (contains number)
                if (text && /\d/.test(text)) {
                    price = text;
                    break;
                }
            }

            // Fallback: Construct from parts if found
            if (!price) {
                const whole = document.querySelector('.a-price-whole')?.textContent?.trim();
                const fraction = document.querySelector('.a-price-fraction')?.textContent?.trim();
                const symbol = document.querySelector('.a-price-symbol')?.textContent?.trim() || '$';
                if (whole) {
                    price = `${symbol}${whole}${fraction ? '.' + fraction : ''}`;
                }
            }

            // List Price / MSRP
            const listPrice = document.querySelector('.a-text-price .a-offscreen')?.textContent?.trim() ||
                document.querySelector('#listPrice')?.textContent?.trim() || '';

            const deal = document.querySelector('#dealBadge, .savingsPercentage')?.textContent?.trim() || '';
            const primeEligible = !!document.querySelector('[aria-label*="Prime"]');
            const freeShipping = !!document.querySelector('[data-feature-name="freeShippingMessage"]');

            return {
                currentPrice: price,
                listPrice,
                deal,
                primeEligible,
                freeShipping,
            };
        }

        // Extract availability
        function extractAvailability() {
            const inStock = !!document.querySelector('#availability .a-color-success');
            const stockMessage = document.querySelector('#availability span')?.textContent?.trim() || '';
            const quantity = (document.querySelector('#quantity') as HTMLSelectElement)?.options.length || 0;

            return {
                inStock,
                stockMessage,
                maxQuantity: quantity,
            };
        }

        // Extract search results
        function extractSearchResults() {
            const products: any[] = [];

            document.querySelectorAll('[data-component-type="s-search-result"]').forEach((item) => {
                const asin = item.getAttribute('data-asin') || '';
                const title = item.querySelector('h2 a span')?.textContent?.trim() || '';
                const price = item.querySelector('.a-price .a-offscreen')?.textContent?.trim() || '';
                const rating = item.querySelector('.a-icon-star-small .a-icon-alt')?.textContent?.trim() || '';
                const reviewCount = item.querySelector('[data-csa-c-content-id="alf-customer-ratings-count"]')?.textContent?.trim() || '';
                const imageUrl = (item.querySelector('img.s-image') as HTMLImageElement)?.src || '';
                const prime = !!item.querySelector('[aria-label*="Prime"]');
                const sponsored = !!item.closest('[data-component-type="sp-sponsored-result"]');

                if (asin) {
                    products.push({
                        asin,
                        title,
                        price,
                        rating,
                        reviewCount,
                        imageUrl,
                        prime,
                        sponsored,
                    });
                }
            });

            return products;
        }

        // Extract seller information
        function extractSellerInfo() {
            // This would extract data from Seller Central pages
            // Implementation depends on specific Seller Central page structure
            return {
                message: 'Seller Central extraction not yet implemented',
                title: document.title,
            };
        }

        // Detect marketplace from URL
        function detectMarketplace(): string {
            const hostname = window.location.hostname;

            if (hostname.includes('.com')) return 'US';
            if (hostname.includes('.co.uk')) return 'UK';
            if (hostname.includes('.ca')) return 'CA';
            if (hostname.includes('.de')) return 'DE';
            if (hostname.includes('.fr')) return 'FR';
            if (hostname.includes('.it')) return 'IT';
            if (hostname.includes('.es')) return 'ES';
            if (hostname.includes('.in')) return 'IN';

            return 'US'; // Default
        }

        // Helper: Detect page type
        function detectPageType(): string {
            const url = window.location.href;
            if (url.includes('/dp/') || url.includes('/gp/product/')) return 'product-detail';
            if (url.includes('/s?k=')) return 'search-results';
            if (url.includes('sellercentral')) return 'seller-central';
            return 'other';
        }

        // Helper: Extract ASIN from URL
        function extractASINFromURL(url: string): string {
            const match = url.match(/\/dp\/([A-Z0-9]{10})/);
            return match ? match[1] : '';
        }
    },
});
