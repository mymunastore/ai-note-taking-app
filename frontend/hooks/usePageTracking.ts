import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useAnalytics } from "../contexts/AnalyticsContext";

export function usePageTracking() {
  const location = useLocation();
  const { capturePageView, isEnabled } = useAnalytics();

  useEffect(() => {
    if (isEnabled) {
      const url = window.location.origin + location.pathname + location.search;
      const title = document.title;
      
      capturePageView(url, title);
    }
  }, [location, capturePageView, isEnabled]);
}
