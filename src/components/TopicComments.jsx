import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { MessageSquare, Trash2, Send } from "lucide-react";
import { selectCurrentUser } from "../store/slices/authSlice";
import { selectAllUsers } from "../store/slices/usersSlice";
import { addComment, removeComment, selectCommentsForTopic } from "../store/slices/commentsSlice";

function formatWhen(iso) {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

// A lightweight discussion thread under a course topic — learners and
// trainers/admins previewing the course can leave notes or questions
// specific to that topic, visible to everyone taking the course, shared
// across all lessons within it.
export default function TopicComments({ courseId, topicId }) {
  const dispatch = useDispatch();
  const currentUser = useSelector(selectCurrentUser);
  const users = useSelector(selectAllUsers);
  const comments = useSelector((state) => selectCommentsForTopic(state, courseId, topicId));
  const [text, setText] = useState("");

  const handlePost = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    dispatch(addComment({ courseId, topicId, userId: currentUser.id, text: text.trim() }));
    setText("");
  };

  return (
    <div className="rounded-xl border border-stone-200 bg-white p-4">
      <h3 className="mb-3 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-stone-400">
        <MessageSquare size={13} /> Discussion {comments.length > 0 && `(${comments.length})`}
      </h3>

      {comments.length > 0 ? (
        <div className="mb-4 space-y-3.5">
          {comments.map((c) => {
            const author = users.find((u) => u.id === c.userId);
            const isOwn = c.userId === currentUser.id;
            return (
              <div key={c.id} className="flex items-start gap-2.5">
                {author?.avatarUrl ? (
                  <img src={author.avatarUrl} alt={author.name} className="h-7 w-7 shrink-0 rounded-full object-cover" />
                ) : (
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-stone-200 text-[10px] font-bold text-stone-500">
                    ?
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-1.5">
                    <span className="truncate text-xs font-semibold text-stone-800">{author?.name ?? "Former member"}</span>
                    <span className="shrink-0 text-[10px] text-stone-400">{formatWhen(c.createdAt)}</span>
                    {isOwn && (
                      <button
                        onClick={() => dispatch(removeComment(c.id))}
                        title="Delete your comment"
                        className="ml-auto shrink-0 text-stone-300 transition hover:text-rose-600"
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                  <p className="mt-0.5 whitespace-pre-line text-xs leading-relaxed text-stone-600">{c.text}</p>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="mb-4 text-xs text-stone-400">No comments yet — be the first to ask a question or leave a note.</p>
      )}

      <form onSubmit={handlePost} className="flex items-start gap-2.5">
        {currentUser.avatarUrl ? (
          <img src={currentUser.avatarUrl} alt={currentUser.name} className="h-7 w-7 shrink-0 rounded-full object-cover" />
        ) : (
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-stone-200 text-[10px] font-bold text-stone-500">
            {currentUser.name?.[0]}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={2}
            placeholder="Ask a question or leave a note on this topic..."
            className="w-full rounded-lg border border-stone-200 px-3 py-2 text-xs outline-none transition focus:border-brand-600"
          />
          <button
            type="submit"
            disabled={!text.trim()}
            className="mt-1.5 flex items-center gap-1.5 rounded-lg bg-brand-700 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Send size={12} /> Post comment
          </button>
        </div>
      </form>
    </div>
  );
}
