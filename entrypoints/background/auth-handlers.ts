/**
 * Auth Handlers
 * Handles checks for external service authentication (Amazon, etc)
 */

const AMAZON_DOMAINS = [
    'https://sellercentral.amazon.com',
    'https://sellercentral.amazon.co.uk',
    'https://sellercentral.amazon.ca',
    'https://sellercentral.amazon.de',
    'https://sellercentral.amazon.fr',
    'https://sellercentral.amazon.it',
    'https://sellercentral.amazon.es',
    'https://sellercentral.amazon.in',
    'https://sellercentral-europe.amazon.com'
];

export async function handleCheckAmazonLogin() {
    try {
        console.log('[Auth] Verifying Amazon session via API...');

        // We'll try to fetch the sidebar context from the most likely domains
        // Since we don't know the exact region, we could try them all or just .com first
        // Ideally we should check cookies first to guess the domain, but per user request
        // we will use the fetch method.

        // Optimized approach: Check .com first, then others if needed or based on locale?
        // For now, let's try .com as primary, and maybe EU if .com fails?
        // Or just map through them. Parallel might be noisy but fast.

        // We will stick to the user's snippet for .com primarily as requested.
        // If that fails, we can fallback to others or just report false.
        // Let's implement a helper to try a domain.

        const checkDomain = async (baseUrl: string) => {
            try {
                const response = await fetch(`${baseUrl}/conversation-api/v1/sidebarContext`, {
                    headers: {
                        "accept": "*/*",
                        "accept-language": "en-GB,en-US;q=0.9,en;q=0.8",
                        "priority": "u=1, i",
                        // "sec-ch-ua": "\"Google Chrome\";v=\"143\", \"Chromium\";v=\"143\", \"Not A(Brand\";v=\"24\"", // Removing specific version to avoid future proof issues
                        "sec-ch-ua-mobile": "?0",
                        "sec-ch-ua-platform": "\"Windows\"",
                        "sec-fetch-dest": "empty",
                        "sec-fetch-mode": "cors",
                        "sec-fetch-site": "same-origin"
                    },
                    referrer: `${baseUrl}/home`,
                    method: "GET",
                    mode: "cors",
                    credentials: "include" // CRITICAL: This sends the cookies
                });

                if (response.ok) {
                    // console.log(`[Auth] Login confirmed on ${baseUrl}`);
                    return true;
                }
            } catch (err) {
                // Ignore network errors (likely blocked or not logged in)
            }
            return false;
        };

        // Try .com first (most common)
        let isLoggedIn = await checkDomain('https://sellercentral.amazon.com');

        // If not logged in on .com, try major regions (fallback)
        if (!isLoggedIn) {
            // We can do a quick check on other major ones in parallel if really needed
            // But usually checking .com covers global selling accounts linked or typical US users.
            // If user specifically needs other marketplaces, we can expand later or run all.
            // Let's run a few common ones to be safe.
            const others = [
                'https://sellercentral.amazon.co.uk',
                'https://sellercentral.amazon.de',
                'https://sellercentral-europe.amazon.com'
            ];

            const results = await Promise.all(others.map(d => checkDomain(d)));
            isLoggedIn = results.some(r => r === true);
        }

        /* 
        // Fallback to cookie check if API fails completely? 
        // User specifically requested the fetch, likely because cookies were unreliable (e.g. valid cookie but session expired)
        // So we should rely on the fetch result.
        */

        console.log('[Auth] Amazon login check result:', { loggedIn: isLoggedIn });

        return { loggedIn: isLoggedIn };

    } catch (error) {
        console.error('[Auth] Failed to check Amazon login:', error);
        return { loggedIn: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
}
