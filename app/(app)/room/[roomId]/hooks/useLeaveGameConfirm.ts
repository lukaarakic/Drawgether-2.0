import { useEffect } from "react";

export function useLeaveGameConfirm(active = true) {
  useEffect(() => {
    if (!active) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };

    history.pushState(null, "", window.location.href);

    const handlePopState = () => {
      const confirm = window.confirm(
        "Are you sure you want to leave the game?",
      );
      if (confirm) {
        window.history.back();
      } else {
        history.pushState(null, "", window.location.href);
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("popstate", handlePopState);
    };
  }, [active]);
}
