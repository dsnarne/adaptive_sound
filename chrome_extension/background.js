let API_ENDPOINT = ""; // set in options, fallback empty

async function loadConfig() {
	const { apiEndpoint } = await chrome.storage.sync.get(["apiEndpoint"]);
	API_ENDPOINT = apiEndpoint || "";
}

loadConfig();
chrome.storage.onChanged.addListener((changes, area) => {
	if (area === 'sync' && changes.apiEndpoint) {
		API_ENDPOINT = changes.apiEndpoint.newValue || "";
	}
});

async function requestSnapshot(tabId) {
	try {
		const res = await chrome.tabs.sendMessage(tabId, { type: "SNAPSHOT" });
		if (!res || !res.text) return;

		await chrome.storage.local.set({ lastSnapshot: { ...res, ts: Date.now() } });

		if (API_ENDPOINT) {
			try {
				await fetch(API_ENDPOINT, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(res)
				});
			} catch (e) {
				// swallow network errors for now
			}
		}
	} catch (e) {
		// content not ready yet
	}
}

chrome.tabs.onActivated.addListener(({ tabId }) => {
	requestSnapshot(tabId);
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
	if (changeInfo.status === "complete") requestSnapshot(tabId);
	if (changeInfo.url) requestSnapshot(tabId);
});

chrome.runtime.onMessage.addListener((msg, sender) => {
	if (msg?.type === "LIVE_SIGNALS") {
		chrome.storage.local.set({ lastSignals: msg.payload });
	}
});
