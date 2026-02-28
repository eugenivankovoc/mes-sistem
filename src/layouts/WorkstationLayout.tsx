import { Outlet } from "react-router-dom";

export function WorkstationLayout() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Outlet />
    </div>
  );
}
