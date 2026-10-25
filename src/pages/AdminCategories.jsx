import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Check, Pencil, Plus, Tags, Trash2, X } from "lucide-react";
import Header from "../components/Header";
import { useConfirm } from "../components/ConfirmDialog";
import { selectCategories, addCategory, renameCategory, removeCategory } from "../store/slices/categoriesSlice";
import { selectAllCourses } from "../store/slices/coursesSlice";
import { pushToast } from "../store/slices/uiSlice";

const inputClass = "w-full rounded-lg border border-stone-200 px-3 py-2 text-sm outline-none focus:border-brand-600";

// Admin-managed list of course categories. Trainers (and admins) pick from
// it when adding a course; renaming one updates every course that uses it.
export default function AdminCategories({ onMenuClick }) {
  const dispatch = useDispatch();
  const confirm = useConfirm();
  const categories = useSelector(selectCategories);
  const courses = useSelector(selectAllCourses);
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [editing, setEditing] = useState(null); // { id, name, description }
  const [error, setError] = useState("");

  const courseCount = (name) => courses.filter((c) => c.category === name).length;
  const nameTaken = (name, exceptId) =>
    categories.some((c) => c.id !== exceptId && c.name.toLowerCase() === name.trim().toLowerCase());

  const handleAdd = (e) => {
    e.preventDefault();
    setError("");
    if (!newName.trim() || !newDescription.trim()) return;
    if (nameTaken(newName)) {
      setError(`"${newName.trim()}" already exists.`);
      return;
    }
    dispatch(addCategory({ name: newName, description: newDescription }));
    dispatch(pushToast({ type: "success", message: `Category "${newName.trim()}" added.` }));
    setNewName("");
    setNewDescription("");
  };

  const saveRename = () => {
    const category = categories.find((c) => c.id === editing.id);
    const name = editing.name.trim();
    if (!name) return;
    if (nameTaken(name, editing.id)) {
      setError(`"${name}" already exists.`);
      return;
    }
    dispatch(renameCategory({ id: editing.id, name, description: editing.description, previousName: category.name }));
    dispatch(pushToast({ type: "success", message: `Category "${name}" saved.` }));
    setEditing(null);
    setError("");
  };

  const handleDelete = async (category) => {
    const ok = await confirm({
      title: `Delete "${category.name}"?`,
      message: "It will no longer be available when adding a course.",
      confirmLabel: "Delete category",
      tone: "danger",
    });
    if (!ok) return;
    dispatch(removeCategory({ id: category.id }));
    dispatch(pushToast({ type: "success", message: `Category "${category.name}" deleted.` }));
  };

  return (
    <div className="flex h-full flex-1 flex-col overflow-y-auto bg-stone-50">
      <Header title="Categories" subtitle="The course categories trainers choose from when adding a course." onMenuClick={onMenuClick} />

      <div className="mx-auto w-full max-w-3xl space-y-5 p-4 sm:p-6 lg:p-8">
        <form onSubmit={handleAdd} className="space-y-3 rounded-2xl border border-stone-200 bg-white p-5">
          <p className="text-sm font-bold text-stone-800">Add a category</p>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-stone-600">
              Name <span className="text-rose-500">*</span>
            </label>
            <input
              value={newName}
              onChange={(e) => {
                setNewName(e.target.value);
                setError("");
              }}
              placeholder="e.g. Field Epidemiology"
              className={inputClass}
            />
            {error && <p className="mt-1.5 text-xs font-medium text-rose-600">{error}</p>}
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-stone-600">
              Description <span className="text-rose-500">*</span>
            </label>
            <textarea
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              rows={2}
              placeholder="What kind of courses belong here — shown to learners on the home page"
              className={inputClass}
            />
          </div>
          <button
            type="submit"
            disabled={!newName.trim() || !newDescription.trim()}
            className="flex items-center gap-1.5 rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Plus size={15} /> Add category
          </button>
        </form>

        <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white">
          {categories.length === 0 ? (
            <div className="flex flex-col items-center gap-2 p-10 text-center text-sm text-stone-400">
              <Tags size={24} className="text-stone-300" /> No categories yet — add the first one above.
            </div>
          ) : (
            <ul className="divide-y divide-stone-100">
              {categories.map((category) => {
                const count = courseCount(category.name);
                const isEditing = editing?.id === category.id;
                return (
                  <li key={category.id} className="flex items-start gap-3 px-5 py-3">
                    {isEditing ? (
                      <div className="min-w-0 flex-1 space-y-2">
                        <input
                          autoFocus
                          value={editing.name}
                          onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                          onKeyDown={(e) => e.key === "Escape" && setEditing(null)}
                          placeholder="Name"
                          className={inputClass}
                        />
                        <textarea
                          value={editing.description}
                          onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                          rows={2}
                          placeholder="Description"
                          className={inputClass}
                        />
                      </div>
                    ) : (
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-stone-800">{category.name}</p>
                        {category.description && <p className="text-xs text-stone-500">{category.description}</p>}
                        <p className="mt-0.5 text-[11px] text-stone-400">
                          {count} course{count === 1 ? "" : "s"}
                        </p>
                      </div>
                    )}
                    <div className="flex shrink-0 gap-1.5">
                      {isEditing ? (
                        <>
                          <button
                            onClick={saveRename}
                            disabled={!editing.name.trim()}
                            title="Save"
                            className="rounded-lg bg-brand-700 p-2 text-white hover:bg-brand-800 disabled:opacity-50"
                          >
                            <Check size={14} />
                          </button>
                          <button onClick={() => setEditing(null)} title="Cancel" className="rounded-lg border border-stone-200 p-2 text-stone-500 hover:bg-stone-50">
                            <X size={14} />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => setEditing({ id: category.id, name: category.name, description: category.description || "" })}
                            title="Edit"
                            className="rounded-lg border border-stone-200 p-2 text-stone-500 hover:bg-stone-50 hover:text-stone-800"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(category)}
                            disabled={count > 0}
                            title={count > 0 ? "In use by courses — move them to another category first" : "Delete"}
                            className="rounded-lg border border-stone-200 p-2 text-stone-500 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-stone-200 disabled:hover:bg-transparent disabled:hover:text-stone-500"
                          >
                            <Trash2 size={14} />
                          </button>
                        </>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
        <p className="text-xs text-stone-400">Categories that courses are using can't be deleted. Renaming one updates those courses too.</p>
      </div>
    </div>
  );
}
