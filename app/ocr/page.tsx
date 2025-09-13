import LiveScreenOCR from "../components/LiveScreenOCR";

export default function OCRPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4" style={{ color: 'var(--color-text-primary)' }}>Live Screen OCR</h1>
      <p className="mb-4 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
        Share a tab or window to extract text in real time. For privacy, nothing is sent unless you set an endpoint.
      </p>
      <LiveScreenOCR />
    </div>
  );
}


