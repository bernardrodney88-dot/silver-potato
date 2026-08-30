import { useState } from "react";
import { HashRouter, Navigate, Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { Dashboard } from "./pages/Dashboard";
import { Drills } from "./pages/Drills";
import { Lab } from "./pages/Lab";
import { Mock } from "./pages/Mock";
import { ProblemDetail } from "./pages/ProblemDetail";
import { Problems } from "./pages/Problems";
import { Sheets } from "./pages/Sheets";
import { ProgressCtx } from "./progress-context";
import { loadProgress, type Progress } from "./store";

export default function App() {
  const [progress, setProgress] = useState<Progress>(() => loadProgress());
  return (
    <ProgressCtx.Provider value={{ progress, setProgress }}>
      <HashRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/problems" element={<Problems />} />
            <Route path="/problems/:id" element={<ProblemDetail />} />
            <Route path="/drills" element={<Drills />} />
            <Route path="/lab" element={<Lab />} />
            <Route path="/mock" element={<Mock />} />
            <Route path="/sheets" element={<Sheets />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </HashRouter>
    </ProgressCtx.Provider>
  );
}
