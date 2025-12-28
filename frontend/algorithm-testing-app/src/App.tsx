import React, { useEffect } from "react";
import AlgorithmTesting from "./pages/AlgorithmTesting";

const App: React.FC = () => {
  useEffect(() => {
    document.title = "Algorithm Testing";
  }, []);
   
  return (
    <div>
      <main className="main-content">
        <AlgorithmTesting />
      </main>
    </div>
  );
};

export default App;
