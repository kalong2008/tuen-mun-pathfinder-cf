import { useEffect, useState } from "react";
import { useRouterState } from "@tanstack/react-router";

export function NavigationProgress() {
  const pending = useRouterState({ select: (state) => state.status === "pending" });
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!pending) {
      setVisible(false);
      return;
    }
    const timer = window.setTimeout(() => setVisible(true), 120);
    return () => window.clearTimeout(timer);
  }, [pending]);

  if (!visible) return null;

  return (
    <div className="nav-progress" role="progressbar" aria-label="頁面載入中">
      <span className="sr">頁面載入中</span>
    </div>
  );
}
