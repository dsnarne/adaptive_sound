let lastSnapshot = { url: location.href, title: document.title, text: "" };

function extractMainText() {
	const articleCandidates = Array.from(document.querySelectorAll("article, main"))
		.map(el => el.innerText)
		.join("\n\n");
	const fallback = document.body?.innerText || "";
	const text = (articleCandidates.length > 500 ? articleCandidates : fallback)
		.replace(/\s+\n/g, "\n")
		.replace(/\n{3,}/g, "\n\n")
		.slice(0, 6000);
	return { url: location.href, title: document.title, text };
}

function refreshSnapshot() { lastSnapshot = extractMainText(); }
refreshSnapshot();

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
	if (msg?.type === "SNAPSHOT") {
		refreshSnapshot();
		sendResponse(lastSnapshot);
		return true;
	}
});

let throttle = false;
const observer = new MutationObserver(() => {
	if (throttle) return;
	throttle = true;
	setTimeout(() => { refreshSnapshot(); throttle = false; }, 1500);
});
observer.observe(document.documentElement, { childList: true, subtree: true });

document.addEventListener("visibilitychange", () => {
	if (document.visibilityState === "visible") refreshSnapshot();
});

let lastY = window.scrollY, lastT = performance.now();
setInterval(() => {
	const now = performance.now();
	const dy = Math.abs(window.scrollY - lastY);
	const dt = (now - lastT) / 1000;
	lastY = window.scrollY; lastT = now;
	const scrollV = dy / Math.max(dt, 0.016);
	const visible = document.visibilityState === "visible";
	chrome.runtime.sendMessage({
		type: "LIVE_SIGNALS",
		payload: { url: location.href, scrollV, visible, ts: Date.now() }
	});
}, 2500);

["pushState","replaceState"].forEach(k => {
	const orig = history[k];
	history[k] = function(...args){ const r = orig.apply(this,args); refreshSnapshot(); return r; };
});
window.addEventListener("popstate", refreshSnapshot);
