import { useCallback, useState } from "react";
import { useDispatch } from "react-redux";
import { pushToast } from "../store/slices/uiSlice";

// Runs an API thunk and toasts its error. Resolves to the thunk's payload,
// or `null` if it failed — callers just bail out on null:
//   const [run, busy] = useApiAction();
//   const course = await run(createCourse(form));
//   if (!course) return;
export function useApiAction() {
  const dispatch = useDispatch();
  const [busy, setBusy] = useState(false);

  const run = useCallback(
    async (action, { successMessage } = {}) => {
      setBusy(true);
      try {
        const result = await dispatch(action);
        if (result.error) {
          dispatch(pushToast({ type: "error", message: result.payload || "Something went wrong. Please try again." }));
          return null;
        }
        if (successMessage) dispatch(pushToast({ type: "success", message: successMessage }));
        return result.payload ?? true;
      } finally {
        setBusy(false);
      }
    },
    [dispatch]
  );

  return [run, busy];
}
