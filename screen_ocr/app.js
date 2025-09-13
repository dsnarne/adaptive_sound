const video = document.getElementById('video');
const startBtn = document.getElementById('start');
const stopBtn = document.getElementById('stop');
const textEl = document.getElementById('text');
const statusEl = document.getElementById('status');
const intervalInput = document.getElementById('interval');
const endpointInput = document.getElementById('endpoint');
const langSelect = document.getElementById('lang');

let stream = null;
let loopTimer = null;
let worker = null;
let lastHash = '';

function hashString(input) {
	let h = 0;
	for (let i = 0; i < input.length; i++) {
		h = ((h << 5) - h) + input.charCodeAt(i);
		h |= 0;
	}
	return h.toString();
}

async function initWorker(language) {
	if (worker) {
		await worker.terminate();
		worker = null;
	}
	worker = await Tesseract.createWorker(language);
}

async function startCapture() {
	try {
		await initWorker(langSelect.value);
		stream = await navigator.mediaDevices.getDisplayMedia({ video: { frameRate: 15 }, audio: false });
		video.srcObject = stream;
		startBtn.disabled = true;
		stopBtn.disabled = false;
		statusEl.textContent = 'Capturing... select a tab or window to share.';
		startLoop();
	} catch (e) {
		statusEl.textContent = 'Permission denied or capture failed.';
	}
}

function stopCapture() {
	if (loopTimer) { clearInterval(loopTimer); loopTimer = null; }
	if (stream) { stream.getTracks().forEach(t => t.stop()); stream = null; }
	if (worker) { worker.terminate(); worker = null; }
	startBtn.disabled = false;
	stopBtn.disabled = true;
	statusEl.textContent = 'Stopped.';
}

function startLoop() {
	const canvas = document.createElement('canvas');
	const ctx = canvas.getContext('2d');
	const sample = async () => {
		if (!video.videoWidth || !video.videoHeight) return;
		canvas.width = video.videoWidth;
		canvas.height = video.videoHeight;
		ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
		const blob = await new Promise(r => canvas.toBlob(r, 'image/png'));
		const { data: { text } } = await worker.recognize(blob);
		const trimmed = text.trim();
		const h = hashString(trimmed);
		if (h !== lastHash && trimmed) {
			lastHash = h;
			textEl.textContent = trimmed;
			const endpoint = endpointInput.value.trim();
			if (endpoint) {
				fetch(endpoint, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ ts: Date.now(), text: trimmed })
				}).catch(() => {});
			}
		}
	};
	const intervalMs = Math.max(300, Number(intervalInput.value) || 1200);
	loopTimer = setInterval(sample, intervalMs);
}

startBtn.addEventListener('click', startCapture);
stopBtn.addEventListener('click', stopCapture);

window.addEventListener('beforeunload', stopCapture);
