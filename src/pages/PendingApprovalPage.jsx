import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { Clock, Ban, LogOut, GraduationCap } from "lucide-react";
import { selectCurrentUser, logout } from "../store/slices/authSlice";

export default function PendingApprovalPage() {
  const dispatch = useDispatch();
  const currentUser = useSelector(selectCurrentUser);
  const isDenied = currentUser?.status === "denied";

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-gradient-to-br from-stone-100 via-stone-50 to-amber-50 px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-stone-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-700 text-white">
          <GraduationCap size={22} />
        </div>
        <div className={`mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full ${isDenied ? "bg-rose-50" : "bg-amber-50"}`}>
          {isDenied ? <Ban size={24} className="text-rose-600" /> : <Clock size={24} className="text-amber-600" />}
        </div>
        <h1 className="text-lg font-bold text-stone-900">
          {isDenied ? "Your trainer application wasn't approved" : "Your trainer account is pending approval"}
        </h1>
        <p className="mt-2 text-sm text-stone-500">
          {isDenied
            ? `Hi ${currentUser?.name?.split(" ")[0]}, an admin has reviewed your trainer signup and it wasn't approved at this time. Reach out to your programme admin if you think this is a mistake.`
            : `Thanks for signing up, ${currentUser?.name?.split(" ")[0]}. An admin needs to review and approve trainer accounts before you can access class management, materials, or assignments. No action needed on your end.`}
        </p>
        <button
          onClick={() => dispatch(logout())}
          className="mx-auto mt-6 flex items-center gap-1.5 rounded-lg border border-stone-200 px-4 py-2 text-sm font-semibold text-stone-600 hover:bg-stone-50"
        >
          <LogOut size={14} /> Log out
        </button>
      </div>
    </div>
  );
}
