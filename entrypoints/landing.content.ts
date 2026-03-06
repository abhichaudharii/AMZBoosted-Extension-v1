import { defineContentScript } from 'wxt/sandbox';

export default defineContentScript({
    matches: [
        '*://*.amzboosted.com/*',
    ],
    main() {
        console.log('[AMZBoosted] Landing page content script loaded');

        // State tracking
        let isLoggedIn = false;
        let step1Success = false;
        let step2Success = false;

        // Helper: Toggle step visibility
        function showSuccessState(stepNumber: number) {
            const defaultEl = document.getElementById(`step-${stepNumber}-default`);
            const successEl = document.getElementById(`step-${stepNumber}-success`);
            const numberEl = document.getElementById(`step-${stepNumber}-number`);
            const checkEl = document.getElementById(`step-${stepNumber}-check`);
            const container = document.getElementById(`step-${stepNumber}-container`);

            // Only apply if not already successfully shown
            if (defaultEl && !defaultEl.classList.contains('hidden')) {
                defaultEl.classList.add('hidden');
                if (successEl) successEl.classList.remove('hidden');

                if (numberEl) numberEl.classList.add('hidden');
                if (checkEl) checkEl.classList.remove('hidden');

                // Visual Polish: Update the icon container to look "Active/Success" (Orange Gradient)
                const iconContainer = numberEl?.parentElement || checkEl?.parentElement;
                if (iconContainer) {
                    iconContainer.classList.remove('bg-white/5', 'text-gray-400', 'border', 'border-white/10');
                    iconContainer.classList.add('bg-gradient-to-br', 'from-[#FF6B00]', 'to-[#FF914D]', 'text-white', 'shadow-lg', 'shadow-orange-500/20', 'border-0');
                }

                // Ensure the check icon itself is white (overriding any default green classes like text-green-400)
                if (checkEl) {
                    checkEl.classList.remove('text-green-400');
                    checkEl.classList.add('text-white');
                }

                if (container) {
                    container.classList.remove('opacity-70'); // Fixed mismatch
                    container.classList.add('opacity-100');
                }
            }
        }

        // --- Step Updaters ---

        function updateStep1() {
            if (step1Success) return;

            const container = document.getElementById('step-1-container');
            if (container) {
                showSuccessState(1);
                step1Success = true;

                // If step 1 is done (extension installed), make step 2 active/visible (but not checked)
                const step2Container = document.getElementById('step-2-container');
                if (step2Container) {
                    step2Container.classList.remove('opacity-70');
                    step2Container.classList.add('opacity-100');

                    // Now that step 1 is done, we can actively look for login
                    checkLoginStatus();
                }
            }
        }

        function updateStep2() {
            if (step2Success) return;
            if (!isLoggedIn) return;

            const container = document.getElementById('step-2-container');
            if (container) {
                showSuccessState(2);
                step2Success = true;
            }
        }

        function updateStep3() {
            if (!isLoggedIn) return;

            const btn = document.getElementById('btn-launch-extension') as HTMLButtonElement;
            const container = document.getElementById('step-3-container');

            if (btn && container) {
                // Only update if not already enabled/updated
                if (btn.disabled) {
                    btn.disabled = false;
                    btn.classList.remove('opacity-50', 'cursor-not-allowed', 'shadow-none');

                    // Clone to remove old listeners to prevent duplicates if any, though disabled helps
                    const newBtn = btn.cloneNode(true) as HTMLButtonElement;
                    if (btn.parentNode) {
                        btn.parentNode.replaceChild(newBtn, btn);
                        newBtn.addEventListener('click', (e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            chrome.runtime.sendMessage({ type: 'OPEN_SIDEPANEL_ON_CURRENT_WINDOW' });
                        });
                    }
                }

                // Make sure container is fully visible
                if (container.classList.contains('opacity-70')) {
                    container.classList.remove('opacity-70');
                    container.classList.add('opacity-100');
                }
            }
        }

        // --- Event Delegation for Robustness in SPA ---
        // Listen on document body to catch clicks even if elements are re-rendered
        document.addEventListener('click', (e) => {
            const target = e.target as HTMLElement;
            const link = target.closest('a');

            // check if it's the install link
            if (link && (link.href.includes('chrome.google.com/webstore') || link.getAttribute('data-amz-boosted-launch') === 'true')) {
                e.preventDefault();
                e.stopPropagation();
                chrome.runtime.sendMessage({ type: 'OPEN_SIDEPANEL_ON_CURRENT_WINDOW' });
            }
        }, true); // Capture phase to ensure we intercept first

        function updateNavbarButton() {
            // Find the Install Extension link
            // We search for the original HREF because SPA might re-render it
            const installLinks = document.querySelectorAll('a[href*="chrome.google.com/webstore"]');

            installLinks.forEach((link) => {
                // If we already processed this exact DOM node and it hasn't been reverted, skip
                if (link.getAttribute('data-amz-boosted-launch') === 'true' && link.textContent === 'Launch Tool') return;

                // Visual Update
                link.textContent = 'Launch Tool';

                // Mark it for our click handler (and to avoid reprocessing)
                link.setAttribute('data-amz-boosted-launch', 'true');

                // Optional: Change href to avoid status bar confusing user, 
                // but we MUST NOT change it if we want our selector to work on re-renders/navigation
                // SPA re-renders might put the original href back, or might not update the DOM if it thinks it matches.
                // Safest bet: Leave href alone, rely on click listener.

                // link.setAttribute('href', '#'); // REMOVED to fix SPA navigation issue
            });
        }

        // --- Main Logic ---

        function runUpdates() {
            // Step 1 is always true if the content script is running (extension installed)
            updateStep1();

            // Check login dependent steps
            if (isLoggedIn) {
                updateStep2();
                updateStep3();
            }

            // Always try to update navbar
            updateNavbarButton();
        }

        function checkLoginStatus() {
            // Stop checking if we already succeeded
            if (step2Success) return;

            chrome.runtime.sendMessage({ type: 'CHECK_AMAZON_LOGIN' }, (response) => {
                // console.log('[Landing Content] Login response:', response);
                if (response && response.loggedIn) {
                    isLoggedIn = true;
                    runUpdates();
                }
            });
        }

        // Initial run
        runUpdates();

        // Persistent Observation for SPA changes
        const observer = new MutationObserver(() => {
            runUpdates();
        });

        observer.observe(document.body, { childList: true, subtree: true });

        // Periodically check login status just in case, but ONLY after step 1 matches
        setInterval(() => {
            if (step1Success && !isLoggedIn) {
                checkLoginStatus();
            }
            // Also force runUpdates periodically just in case MutationObserver misses a subtle change
            runUpdates();
        }, 500); // 500ms interval for snappier UI updates
    },
});
