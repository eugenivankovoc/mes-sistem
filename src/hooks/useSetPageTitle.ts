import { useEffect } from "react";
import { usePageTitle } from "@/contexts/PageTitleContext";

/** Call at the top of any page component to set the TopBar title and document title. */
export function useSetPageTitle(title: string) {
  const { setTitle } = usePageTitle();
  useEffect(() => {
    setTitle(title);
    document.title = title ? `${title} - MES Sustav` : "MES Sustav";
  }, [title, setTitle]);
}
