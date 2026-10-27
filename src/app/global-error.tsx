"use client";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", background: "#FBF6EC", color: "#2B1D0E", display: "grid", placeItems: "center", minHeight: "100vh", margin: 0 }}>
        <main style={{ textAlign: "center", padding: 24 }}>
          <h1>Something went wrong</h1>
          <p>Please refresh the page or try again in a moment.</p>
          <button onClick={reset} style={{ background: "#E9A21A", border: 0, borderRadius: 999, padding: "12px 24px", fontWeight: 700, cursor: "pointer" }}>
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
