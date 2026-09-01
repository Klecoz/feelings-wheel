import { Route, Routes } from "react-router-dom";
import { StoreProvider } from "./components/StoreProvider";
import { BottomNav } from "./components/BottomNav";
import { WheelScreen } from "./routes/WheelScreen";
import { HistoryScreen } from "./routes/HistoryScreen";
import { SummaryScreen } from "./routes/SummaryScreen";
import { SettingsScreen } from "./routes/SettingsScreen";
import { StorageBanner } from "./components/StorageBanner";

export default function App() {
  return (
    <StoreProvider>
      <div
        className="flex h-full flex-col"
        style={{ paddingTop: "env(safe-area-inset-top)" }}
      >
        <StorageBanner />
        <main className="flex min-h-0 flex-1 flex-col">
          <Routes>
            <Route path="/" element={<WheelScreen />} />
            <Route path="/c/:coreId" element={<WheelScreen />} />
            <Route path="/history" element={<HistoryScreen />} />
            <Route path="/summary" element={<SummaryScreen />} />
            <Route path="/settings" element={<SettingsScreen />} />
            <Route path="*" element={<WheelScreen />} />
          </Routes>
        </main>
        <BottomNav />
      </div>
    </StoreProvider>
  );
}
