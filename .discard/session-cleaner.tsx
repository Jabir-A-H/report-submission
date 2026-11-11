"use client";

import { useEffect } from "react";

export function SessionCleaner() {
  useEffect(() => {
    try {
      sessionStorage.removeItem("dashboard-period-params");
    } catch {}
  }, []);

  return null;
}
