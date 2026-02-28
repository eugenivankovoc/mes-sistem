import { Outlet } from "react-router-dom";
import { AssistTopBar } from "@/components/AssistTopBar";

export function AssistLayout() {
  return (
    <div className="flex flex-col h-screen bg-card overflow-hidden">
      <AssistTopBar />
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
