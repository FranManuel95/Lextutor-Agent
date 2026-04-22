"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global error:", error?.message);
  }, [error]);

  return (
    <html lang="es">
      <body>
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "1.5rem",
            padding: "2rem",
            textAlign: "center",
            backgroundColor: "#0a0a0a",
            color: "#f5f5f5",
            fontFamily: "system-ui, sans-serif",
          }}
        >
          <h2 style={{ fontSize: "1.5rem", color: "#d4af37" }}>
            Se ha producido un error inesperado
          </h2>
          <p style={{ maxWidth: "32rem", opacity: 0.6 }}>
            La aplicación ha fallado. Recarga la página para intentar de nuevo.
          </p>
          {error?.digest && (
            <p style={{ fontFamily: "monospace", fontSize: "0.75rem", opacity: 0.5 }}>
              ID: {error.digest}
            </p>
          )}
          <button
            onClick={reset}
            style={{
              padding: "0.5rem 1.5rem",
              backgroundColor: "#d4af37",
              color: "#0a0a0a",
              border: "none",
              borderRadius: "0.375rem",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            Recargar
          </button>
        </div>
      </body>
    </html>
  );
}
