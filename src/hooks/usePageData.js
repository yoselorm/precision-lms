import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";

// Runs a page loader (see store/loadAppData.js) whenever the page opens —
// and again if the session changes (sign-in/out, or an admin preview).
// Loaders only run with a session unless `publicPage` is set, for pages
// signed-out visitors see too (their loaders use public endpoints).
export function usePageData(loader, { publicPage = false } = {}) {
  const dispatch = useDispatch();
  const token = useSelector((state) => state.auth.token);
  useEffect(() => {
    if (token || publicPage) dispatch(loader());
  }, [dispatch, loader, token, publicPage]);
}
