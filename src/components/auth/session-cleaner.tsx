"use client";

import { useEffect } from "react";

export function SessionCleaner() {
  useEffect(() => {
    sessionStorage.removeItem("dashboard-period-params");
  }, []);

  return null;
}
