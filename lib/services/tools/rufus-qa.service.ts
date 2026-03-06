
interface RufusQAOptions {
    marketplace: string;
    asinList: string[];
    runId?: string;
}

class RufusQAService {
    private activeRuns = new Map<string, boolean>();

    private delay(ms: number) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    private getBaseDomain(marketplace: string): string {
        // Map common marketplaces to domains if needed, or default to .com for this specific tool requirement
        // The requirements showed www.amazon.com. We can stick to that or map if multi-geo support is needed later.
        // For now, let's respect the marketplace passed but default the domain logic.
        // If marketplace is 'us', it's amazon.com. 
        // Simple mapping for now:
        const tldMap: { [key: string]: string } = {
            'us': 'com',
            'uk': 'co.uk',
            'de': 'de',
            'fr': 'fr',
            'it': 'it',
            'es': 'es',
            'ca': 'ca',
            'jp': 'co.jp',
            // Add others as needed
        };
        const tld = tldMap[marketplace.toLowerCase()] || 'com';
        return `www.amazon.${tld}`;
    }

    private async getAntiCsrfToken(domain: string): Promise<string> {
        const url = `https://${domain}/rufus/cl/render?ref=nl_cl_dsk_rend`;
        try {
            const response = await fetch(url);
            const text = await response.text();

            // Extract <meta name="anti-csrftoken-a2z" ... >
            const match = text.match(/<meta\s+name=["']anti-csrftoken-a2z["']\s+content=["']([^"']+)["']\s*\/?>/i);
            if (match && match[1]) {
                return match[1];
            }
            throw new Error('CSRF token not found in page');
        } catch (e: any) {
            console.error('Failed to get CSRF token', e);
            throw new Error(`Failed to initialize session: ${e.message}`);
        }
    }

    /**
     * Extracts the JSON data from the streaming response format.
     * Looks for lines starting with `data:` and finds the last valid JSON chunk 
     * that contains the expected target/content.
     */
    private parseStreamingResponse(text: string): any {
        const lines = text.split('\n');
        // We want to process chunks.
        // The requirement says: 
        // "reponse retuinr brlow like chucnks again and again we need the correct one find using `event:inference` and `data:{"sections":[{"action":"REPLACE","target":{"type":"TextSubsections"` last one will be the correct one"

        let validChunks: any[] = [];

        for (const line of lines) {
            if (line.startsWith('data:')) {
                try {
                    const jsonStr = line.substring(5); // remove 'data:'
                    const data = JSON.parse(jsonStr);
                    if (data.sections) {
                        validChunks.push(data);
                    }
                } catch (e) {
                    // ignore incomplete lines
                }
            }
        }

        return validChunks;
    }

    private async fetchRelatedQuestions(domain: string, csrfToken: string, asin: string): Promise<string[]> {
        const url = `https://${domain}/rufus/cl/streaming?tabId=${crypto.randomUUID()}&ref=nl_cl_crl_rq_0_0&programId=NILE_CLASSIC%3Adesktop-cl`;

        const payload = {
            queryContext: {
                query: "",
                actionType: "ASIN_CLICK"
            },
            pageContext: {
                pageType: "DETAIL_PAGE",
                targetPageType: "DETAIL_PAGE",
                originPageType: "DETAIL_PAGE",
                targetUrl: `https://${domain}/dp/${asin}`,
                originUrl: `https://${domain}/dp/${asin}`, // Using same as target for simplicity, or we could leave empty
                targetPageMetadata: [{ type: "ASIN", value: asin }],
                pageMetadata: [{ type: "ASIN", value: asin }],
                originPageMetadata: [{ type: "ASIN", value: asin }] // Using same as target
            }
        };

        const response = await fetch(url, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'content-type': 'application/json',
                'accept': '*/*',
                'anti-csrftoken-a2z': csrfToken
            },
            body: JSON.stringify(payload)
        });

        const text = await response.text();
        const chunks = this.parseStreamingResponse(text);

        // We are looking for the 'related_questions' section.
        // In the example: "groupId":"section_groupId_related_questions_JK88S0Y8K6K299DMGEBM_0"
        // HTML content contains <li> items with "rufus-pill" buttons.
        // <span class="rufus-color-blue-40 rufus-font-size-base">Does it have a fingerprint&nbsp;scanner?</span>

        const questions: string[] = [];

        // Check the last few chunks for our carousel
        for (const chunk of chunks.reverse()) {
            const sections = chunk.sections || [];
            for (const section of sections) {
                const html = section.content?.data || "";
                if (html.includes('rufus-related-question-pill')) {
                    // Extract text from the pills
                    // Regex to match: <span class="rufus-color-blue-40 rufus-font-size-base">TEXT</span>
                    const pillRegex = /<span class="rufus-color-blue-40 rufus-font-size-base">([^<]+)<\/span>/g;
                    let match;
                    while ((match = pillRegex.exec(html)) !== null) {
                        // Decode HTML entities (e.g. &nbsp;)
                        let q = match[1].replace(/&nbsp;/g, ' ').trim();
                        // Sometimes text might have other entities, simple decode:
                        q = q.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
                        if (q && !questions.includes(q)) {
                            questions.push(q);
                        }
                    }
                    if (questions.length > 0) return questions;
                }
            }
        }

        return questions;
    }

    private async fetchAnswer(domain: string, csrfToken: string, asin: string, question: string): Promise<string | null> {
        const url = `https://${domain}/rufus/cl/streaming?tabId=${crypto.randomUUID()}&ref=nl_cl_crl_rq_0_0&programId=NILE_CLASSIC%3Adesktop-cl`;

        const payload = {
            queryContext: {
                query: question,
                actionType: "SEARCH",
                qis: "NileRelatedQuestion" // As seen in example for related questions
            },
            pageContext: {
                pageType: "DETAIL_PAGE",
                targetPageType: "DETAIL_PAGE",
                originPageType: "DETAIL_PAGE",
                targetUrl: `https://${domain}/dp/${asin}`,
                originUrl: `https://${domain}/dp/${asin}`,
                targetPageMetadata: [{ type: "ASIN", value: asin }],
                pageMetadata: [{ type: "ASIN", value: asin }],
                originPageMetadata: [{ type: "ASIN", value: asin }]
            }
        };

        const response = await fetch(url, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'content-type': 'application/json',
                'accept': '*/*',
                'anti-csrftoken-a2z': csrfToken
            },
            body: JSON.stringify(payload)
        });

        const text = await response.text();
        const chunks = this.parseStreamingResponse(text);

        // Looking for "TextSubsections"
        // Example: "action":"REPLACE","target":{"type":"TextSubsections"...
        // Content contains <p class="rufus-markdown-paragraph ...">THE ANSWER</p>

        for (const chunk of chunks.reverse()) {
            const sections = chunk.sections || [];
            for (const section of sections) {
                if (section.target?.type === 'TextSubsections') {
                    const html = section.content?.data || "";
                    // Extract paragraph text
                    // <p class="rufus-markdown-paragraph rufus-markdown-animation-support"> ... </p>
                    const pRegex = /<p[^>]*class="[^"]*rufus-markdown-paragraph[^"]*"[^>]*>(.*?)<\/p>/s;
                    const match = pRegex.exec(html);
                    if (match && match[1]) {
                        // Clean up HTML tags inside the answer (anchor tags, strong tags)
                        let answer = match[1].replace(/<[^>]+>/g, ''); // strip tags
                        answer = answer.replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&');
                        return answer.trim();
                    }
                }
            }
        }

        return null;
    }

    async execute(
        _urls: string[] | null,
        options: RufusQAOptions,
        onProgress: (progress: any) => void
    ): Promise<any> {
        const { asinList, marketplace, runId } = options;

        if (runId) this.activeRuns.set(runId, true);

        const domain = this.getBaseDomain(marketplace || 'us');
        const total = asinList.length;
        let completed = 0;
        let successful = 0;
        const results: any[] = [];

        console.log(`[RufusQA] Starting for ${total} ASINs on ${domain}`);

        try {
            // 1. Get CSRF Token once if possible, or retry if it fails
            onProgress({ statusMessage: 'Initializing session...', total, completed: 0 });
            let csrfToken: string;
            try {
                csrfToken = await this.getAntiCsrfToken(domain);
            } catch (e: any) {
                return {
                    success: false,
                    results: [],
                    errors: [`Failed to initialize: ${e.message}. Please insure you are logged in to ${domain}`]
                };
            }

            for (const asin of asinList) {
                if (runId && !this.activeRuns.get(runId)) break;

                onProgress({
                    total,
                    completed,
                    currentUrl: asin,
                    statusMessage: `Finding questions for ${asin}...`
                });

                try {
                    // Step 1: Get Questions
                    const questions = await this.fetchRelatedQuestions(domain, csrfToken, asin);

                    if (questions.length === 0) {
                        results.push({
                            ASIN: asin,
                            Marketplace: marketplace,
                            Question: 'No relevant questions found',
                            Answer: 'N/A'
                        });
                    } else {
                        // Step 2: Get Answers for eacg question
                        let qIndex = 0;
                        for (const q of questions) {
                            if (runId && !this.activeRuns.get(runId)) break;
                            qIndex++;

                            onProgress({
                                total,
                                completed,
                                currentUrl: asin,
                                statusMessage: `Fetching answer for Q${qIndex}/${questions.length}: "${q.substring(0, 30)}..."`
                            });

                            // Small delay to be polite
                            await this.delay(1000 + Math.random() * 1000);

                            const answer = await this.fetchAnswer(domain, csrfToken, asin, q);

                            results.push({
                                ASIN: asin,
                                Marketplace: marketplace,
                                Question: q,
                                Answer: answer || 'Failed to fetch answer'
                            });
                        }
                    }
                    successful++;
                } catch (e: any) {
                    console.error(`[RufusQA] Error processing ${asin}`, e);
                    results.push({
                        ASIN: asin,
                        Marketplace: marketplace,
                        Question: 'Error',
                        Answer: e.message
                    });
                }

                completed++;
                // Delay between ASINs
                await this.delay(2000);
            }

            return {
                results,
                processedCount: completed,
                successful,
                failed: total - successful,
                creditsUsed: 5 * successful // Assuming some credit cost logic
            };

        } finally {
            if (runId) this.activeRuns.delete(runId);
        }
    }
}

export const rufusQAService = new RufusQAService();
