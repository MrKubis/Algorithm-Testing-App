import React, { useEffect, useState } from "react";
import AlgorithmTesting from "./pages/AlgorithmTesting";
import FunctionTesting from "./pages/FunctionTesting";
import "./App.css";

type Page = "algorithm" | "function";

const App: React.FC = () => {
  const [page, setPage] = useState<Page>("algorithm");

  useEffect(() => {
    document.title = page === "algorithm" ? "Algorithm Testing" : "Function Testing";
  }, [page]);
   
  return (
    <div className="app-shell">
      <nav className="top-nav">
        <div className="nav-brand">
          <span className="nav-title">Algorithm Test Bench</span>
          <span className="nav-subtitle">Compare functions across tuned algorithms</span>
        </div>
        <div className="nav-actions">
          <button
            type="button"
            className={`button nav-button ${page === "algorithm" ? "button-primary" : "button-secondary"}`}
            onClick={() => setPage("algorithm")}
            aria-pressed={page === "algorithm"}
          >
            Algorithm Testing
          </button>
          <button
            type="button"
            className={`button nav-button ${page === "function" ? "button-primary" : "button-secondary"}`}
            onClick={() => setPage("function")}
            aria-pressed={page === "function"}
          >
            Function Testing
          </button>
        </div>
      </nav>
      <main className="main-content">
        {page === "algorithm" ? <AlgorithmTesting /> : <FunctionTesting />}
      </main>
    </div>
  );
};

export default App;
