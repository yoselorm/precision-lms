import React, { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Bold,
  Copy,
  Eye,
  ImagePlus,
  Italic,
  PenLine,
  RotateCcw,
  PenTool,
  Trash2,
  Type,
  Upload,
  X,
} from "lucide-react";
import Header from "../components/Header";
import CertificateCanvas from "../components/CertificateCanvas";
import CertificateView from "../components/CertificateView";
import { selectCourseById, setCourseCertificate } from "../store/slices/coursesSlice";
import { pushToast } from "../store/slices/uiSlice";
import { useConfirm } from "../components/ConfirmDialog";
import {
  PLACEHOLDERS,
  defaultTemplate,
  getTemplate,
  textElement,
  imageElement,
  signatureElement,
  newElementId,
  readImageFile,
  formatCertificateDate,
} from "../utils/certificateTemplate";

const inputClass = "w-full rounded-lg border border-stone-200 px-2.5 py-1.5 text-xs outline-none focus:border-brand-600";

const ADD_TEXT_PRESETS = [
  { label: "Custom text", text: "New text", fontSize: 20 },
  { label: "Learner name", text: "{{learner_name}}", fontSize: 40, bold: true, fontFamily: "serif", color: "#17295D" },
  { label: "Course title", text: "{{course_title}}", fontSize: 26, bold: true, color: "#21409A" },
  { label: "Completion date", text: "{{completion_date}}", fontSize: 14, color: "#78716c" },
  { label: "Certificate title", text: "{{certificate_title}}", fontSize: 16, bold: true, color: "#78716c" },
  { label: "Issued by", text: "{{issuer}}", fontSize: 15, bold: true, color: "#44403c" },
];

function Field({ label, children }) {
  return (
    <div>
      <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-stone-400">{label}</label>
      {children}
    </div>
  );
}

function RangeField({ label, value, min, max, step = 1, suffix = "", onChange }) {
  return (
    <Field label={`${label} · ${value}${suffix}`}>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-full accent-brand-700" />
    </Field>
  );
}

function ToggleButton({ active, onClick, title, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`flex h-8 w-8 items-center justify-center rounded-lg border text-stone-600 transition ${
        active ? "border-brand-600 bg-brand-50 text-brand-800" : "border-stone-200 hover:bg-stone-50"
      }`}
    >
      {children}
    </button>
  );
}

// Picks an image file and hands back a downscaled data URL.
function ImagePickButton({ label, onPick, keepTransparency, maxWidth, className }) {
  const inputRef = useRef(null);
  return (
    <>
      <button type="button" onClick={() => inputRef.current?.click()} className={className}>
        {label}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (file) onPick(await readImageFile(file, { keepTransparency, maxWidth }));
        }}
      />
    </>
  );
}

function SignaturePad({ onUse, onClose }) {
  const canvasRef = useRef(null);
  const drawing = useRef(false);
  const [hasInk, setHasInk] = useState(false);

  const point = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * canvasRef.current.width,
      y: ((e.clientY - rect.top) / rect.height) * canvasRef.current.height,
    };
  };

  const start = (e) => {
    const ctx = canvasRef.current.getContext("2d");
    const { x, y } = point(e);
    ctx.lineWidth = 3.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#1c1917";
    ctx.beginPath();
    ctx.moveTo(x, y);
    drawing.current = true;
    canvasRef.current.setPointerCapture(e.pointerId);
  };
  const move = (e) => {
    if (!drawing.current) return;
    const ctx = canvasRef.current.getContext("2d");
    const { x, y } = point(e);
    ctx.lineTo(x, y);
    ctx.stroke();
    setHasInk(true);
  };
  const end = () => {
    drawing.current = false;
  };
  const clear = () => {
    canvasRef.current.getContext("2d").clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    setHasInk(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex animate-backdrop-in items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg animate-scale-in rounded-2xl bg-white p-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-bold text-stone-900">Draw signature</h2>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-600">
            <X size={18} />
          </button>
        </div>
        <canvas
          ref={canvasRef}
          width={600}
          height={200}
          onPointerDown={start}
          onPointerMove={move}
          onPointerUp={end}
          onPointerLeave={end}
          className="w-full touch-none rounded-xl border border-dashed border-stone-300 bg-stone-50"
        />
        <p className="mt-1.5 text-[11px] text-stone-400">Sign with your mouse, trackpad or finger.</p>
        <div className="mt-5 flex justify-end gap-2">
          <button onClick={clear} className="rounded-lg border border-stone-200 px-4 py-2 text-sm font-semibold text-stone-600 hover:bg-stone-50">
            Clear
          </button>
          <button
            onClick={() => onUse(canvasRef.current.toDataURL("image/png"))}
            disabled={!hasInk}
            className="rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Use signature
          </button>
        </div>
      </div>
    </div>
  );
}

function ElementPanel({ element, onChange, onDelete, onDuplicate, onLayer, onDrawSignature }) {
  const textRef = useRef(null);

  const insertToken = (token) => {
    const node = textRef.current;
    const start = node?.selectionStart ?? element.text.length;
    const end = node?.selectionEnd ?? element.text.length;
    onChange({ text: element.text.slice(0, start) + token + element.text.slice(end) });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold capitalize text-stone-800">{element.type}</p>
        <div className="flex gap-1">
          <ToggleButton onClick={() => onLayer(1)} title="Bring forward">
            <ArrowUp size={14} />
          </ToggleButton>
          <ToggleButton onClick={() => onLayer(-1)} title="Send backward">
            <ArrowDown size={14} />
          </ToggleButton>
          <ToggleButton onClick={onDuplicate} title="Duplicate">
            <Copy size={14} />
          </ToggleButton>
          <button
            onClick={onDelete}
            title="Delete"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {element.type === "text" && (
        <>
          <Field label="Text">
            <textarea ref={textRef} value={element.text} onChange={(e) => onChange({ text: e.target.value })} rows={3} className={inputClass} />
            <div className="mt-1.5 flex flex-wrap gap-1">
              {PLACEHOLDERS.map((p) => (
                <button
                  key={p.token}
                  type="button"
                  onClick={() => insertToken(p.token)}
                  className="rounded-md bg-brand-50 px-1.5 py-0.5 text-[10px] font-semibold text-brand-700 hover:bg-brand-100"
                >
                  + {p.label}
                </button>
              ))}
            </div>
          </Field>
          <Field label="Font">
            <select value={element.fontFamily} onChange={(e) => onChange({ fontFamily: e.target.value })} className={inputClass}>
              <option value="sans">Sans serif</option>
              <option value="serif">Serif</option>
              <option value="script">Script</option>
            </select>
          </Field>
          <RangeField label="Size" value={element.fontSize} min={8} max={90} suffix="px" onChange={(v) => onChange({ fontSize: v })} />
          <div className="flex items-end gap-3">
            <Field label="Colour">
              <input type="color" value={element.color} onChange={(e) => onChange({ color: e.target.value })} className="h-8 w-12 cursor-pointer rounded border border-stone-200" />
            </Field>
            <div className="flex gap-1">
              <ToggleButton active={element.bold} onClick={() => onChange({ bold: !element.bold })} title="Bold">
                <Bold size={14} />
              </ToggleButton>
              <ToggleButton active={element.italic} onClick={() => onChange({ italic: !element.italic })} title="Italic">
                <Italic size={14} />
              </ToggleButton>
            </div>
            <div className="flex gap-1">
              {[
                ["left", AlignLeft],
                ["center", AlignCenter],
                ["right", AlignRight],
              ].map(([align, Icon]) => (
                <ToggleButton key={align} active={element.align === align} onClick={() => onChange({ align })} title={`Align ${align}`}>
                  <Icon size={14} />
                </ToggleButton>
              ))}
            </div>
          </div>
        </>
      )}

      {element.type === "image" && (
        <ImagePickButton
          label={
            <>
              <Upload size={13} /> Replace image
            </>
          }
          onPick={(src) => onChange({ src })}
          keepTransparency
          maxWidth={900}
          className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-stone-200 px-3 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-50"
        />
      )}

      {element.type === "signature" && (
        <>
          <Field label="Name">
            <input value={element.name} onChange={(e) => onChange({ name: e.target.value })} className={inputClass} />
          </Field>
          <Field label="Title / role">
            <input value={element.title} onChange={(e) => onChange({ title: e.target.value })} className={inputClass} />
          </Field>
          <Field label="Signature">
            {element.src && <img src={element.src} alt="" className="mb-2 h-14 w-full rounded-lg border border-stone-200 bg-stone-50 object-contain" />}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={onDrawSignature}
                className="flex items-center justify-center gap-1.5 rounded-lg border border-stone-200 px-2 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-50"
              >
                <PenLine size={13} /> Draw
              </button>
              <ImagePickButton
                label={
                  <>
                    <Upload size={13} /> Upload
                  </>
                }
                onPick={(src) => onChange({ src })}
                keepTransparency
                maxWidth={600}
                className="flex items-center justify-center gap-1.5 rounded-lg border border-stone-200 px-2 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-50"
              />
            </div>
            {element.src && (
              <button type="button" onClick={() => onChange({ src: "" })} className="mt-1.5 text-[11px] font-semibold text-rose-600 hover:underline">
                Remove signature image
              </button>
            )}
          </Field>
        </>
      )}

      <RangeField label="Width" value={element.width} min={5} max={100} suffix="%" onChange={(v) => onChange({ width: v })} />
      <div className="grid grid-cols-2 gap-2">
        <Field label="Left (%)">
          <input type="number" min={0} max={100} step={0.5} value={element.x} onChange={(e) => onChange({ x: Number(e.target.value) })} className={inputClass} />
        </Field>
        <Field label="Top (%)">
          <input type="number" min={0} max={100} step={0.5} value={element.y} onChange={(e) => onChange({ y: Number(e.target.value) })} className={inputClass} />
        </Field>
      </div>
      <p className="text-[11px] text-stone-400">Tip: drag on the certificate to move, or use the arrow keys to nudge.</p>
    </div>
  );
}

function BackgroundPanel({ background, onChange, onReset }) {
  return (
    <div className="space-y-4">
      <p className="text-sm font-bold text-stone-800">Page</p>
      <p className="text-xs text-stone-400">Click an element on the certificate to edit it, or use the buttons above to add one.</p>
      <Field label="Background colour">
        <input type="color" value={background.color || "#ffffff"} onChange={(e) => onChange({ color: e.target.value })} className="h-8 w-12 cursor-pointer rounded border border-stone-200" />
      </Field>
      <Field label="Background image">
        {background.image && <img src={background.image} alt="" className="mb-2 h-20 w-full rounded-lg border border-stone-200 object-cover" />}
        <div className="flex gap-2">
          <ImagePickButton
            label={
              <>
                <Upload size={13} /> {background.image ? "Replace" : "Upload"}
              </>
            }
            onPick={(image) => onChange({ image })}
            maxWidth={1600}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-stone-200 px-3 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-50"
          />
          {background.image && (
            <button onClick={() => onChange({ image: "" })} className="rounded-lg border border-stone-200 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50">
              Remove
            </button>
          )}
        </div>
      </Field>
      <div className="flex items-end gap-3">
        <label className="flex items-center gap-2 text-xs font-semibold text-stone-600">
          <input type="checkbox" checked={!!background.border} onChange={(e) => onChange({ border: e.target.checked })} className="accent-brand-700" />
          Decorative border
        </label>
        {background.border && (
          <input
            type="color"
            value={background.borderColor || "#21409A"}
            onChange={(e) => onChange({ borderColor: e.target.value })}
            className="h-8 w-12 cursor-pointer rounded border border-stone-200"
          />
        )}
      </div>
      <button
        onClick={onReset}
        className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-stone-200 px-3 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-50"
      >
        <RotateCcw size={13} /> Reset to default layout
      </button>
    </div>
  );
}

export default function CertificateDesigner({ onMenuClick }) {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const course = useSelector((state) => selectCourseById(state, courseId));
  const confirm = useConfirm();

  const [template, setTemplate] = useState(() => (course?.certificate ? structuredClone(getTemplate(course.certificate)) : null));
  const [selectedId, setSelectedId] = useState(null);
  const [dirty, setDirty] = useState(false);
  const [showFieldNames, setShowFieldNames] = useState(false);
  const [drawingFor, setDrawingFor] = useState(null);
  const [previewing, setPreviewing] = useState(false);
  const [addTextOpen, setAddTextOpen] = useState(false);

  const update = useCallback((fn) => {
    setTemplate((prev) => fn(prev));
    setDirty(true);
  }, []);

  const updateElement = useCallback(
    (id, patch) => update((t) => ({ ...t, elements: t.elements.map((el) => (el.id === id ? { ...el, ...patch } : el)) })),
    [update]
  );

  const addElement = (el) => {
    update((t) => ({ ...t, elements: [...t.elements, el] }));
    setSelectedId(el.id);
  };

  const deleteElement = useCallback(
    (id) => {
      update((t) => ({ ...t, elements: t.elements.filter((el) => el.id !== id) }));
      setSelectedId(null);
    },
    [update]
  );

  // Delete / arrow-key shortcuts for the selected element, ignored while typing.
  useEffect(() => {
    const onKey = (e) => {
      if (!selectedId || ["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement?.tagName)) return;
      if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        deleteElement(selectedId);
        return;
      }
      const step = e.shiftKey ? 2 : 0.5;
      const delta = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] }[e.key];
      if (!delta) return;
      e.preventDefault();
      update((t) => ({
        ...t,
        elements: t.elements.map((el) => (el.id === selectedId ? { ...el, x: el.x + delta[0], y: el.y + delta[1] } : el)),
      }));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedId, deleteElement, update]);

  if (!course?.certificate || !template) {
    return (
      <div className="flex h-full flex-1 items-center justify-center text-sm text-stone-400">
        This course doesn't have a certificate.{" "}
        <button className="ml-2 underline" onClick={() => navigate("/admin/certificates")}>
          Back to certificates
        </button>
      </div>
    );
  }

  const selected = template.elements.find((el) => el.id === selectedId);
  const sampleData = showFieldNames
    ? { learnerName: "{{learner_name}}", courseTitle: "{{course_title}}", completionDate: "{{completion_date}}", certificateTitle: "{{certificate_title}}", issuer: "{{issuer}}" }
    : {
        learnerName: "Ama Boateng",
        courseTitle: course.title,
        completionDate: formatCertificateDate(new Date()),
        certificateTitle: course.certificate.title,
        issuer: course.certificate.issuer,
      };

  const save = () => {
    dispatch(setCourseCertificate({ courseId: course.id, certificate: { template } }));
    dispatch(pushToast({ type: "success", message: "Certificate design saved." }));
    setDirty(false);
  };

  const leave = async () => {
    if (
      dirty &&
      !(await confirm({
        title: "Leave without saving?",
        message: "Your changes to this certificate design will be lost.",
        confirmLabel: "Leave without saving",
        cancelLabel: "Keep editing",
        tone: "danger",
      }))
    ) {
      return;
    }
    navigate("/admin/certificates");
  };

  const toolbarButton = "flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50";

  return (
    <div className="flex h-full flex-1 flex-col overflow-y-auto bg-stone-50">
      <Header title="Design certificate" subtitle={course.certificate.title} onMenuClick={onMenuClick} />

      <div className="space-y-4 p-4 sm:p-6 lg:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button onClick={leave} className="flex items-center gap-1.5 text-xs font-semibold text-stone-500 hover:text-stone-700">
            <ArrowLeft size={14} /> Back to certificates
          </button>
          <div className="flex flex-wrap items-center gap-2">
            <label className="flex items-center gap-1.5 text-xs font-semibold text-stone-600">
              <input type="checkbox" checked={showFieldNames} onChange={(e) => setShowFieldNames(e.target.checked)} className="accent-brand-700" />
              Show field names
            </label>
            <button onClick={() => setPreviewing(true)} className={toolbarButton}>
              <Eye size={13} /> Preview &amp; download
            </button>
            <button
              onClick={save}
              disabled={!dirty}
              className="rounded-lg bg-brand-700 px-4 py-2 text-xs font-semibold text-white hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {dirty ? "Save design" : "Saved"}
            </button>
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-[1fr_300px]">
          <div className="min-w-0 space-y-3">
            <div className="flex flex-wrap gap-2">
              <div className="relative">
                <button onClick={() => setAddTextOpen((v) => !v)} className={toolbarButton}>
                  <Type size={13} /> Add text field
                </button>
                {addTextOpen && (
                  <div className="absolute left-0 top-full z-20 mt-1 w-48 rounded-xl border border-stone-200 bg-white p-1 shadow-lg">
                    {ADD_TEXT_PRESETS.map(({ label, ...preset }) => (
                      <button
                        key={label}
                        onClick={() => {
                          addElement(textElement({ ...preset, y: 50 }));
                          setAddTextOpen(false);
                        }}
                        className="block w-full rounded-lg px-3 py-2 text-left text-xs font-medium text-stone-700 hover:bg-stone-50"
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <ImagePickButton
                label={
                  <>
                    <ImagePlus size={13} /> Add image
                  </>
                }
                onPick={(src) => addElement(imageElement(src, { width: 18 }))}
                keepTransparency
                maxWidth={900}
                className={toolbarButton}
              />
              <button onClick={() => addElement(signatureElement())} className={toolbarButton}>
                <PenTool size={13} /> Add signature
              </button>
            </div>

            <div className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
              <CertificateCanvas
                template={template}
                data={sampleData}
                editable
                selectedId={selectedId}
                onSelect={(id) => {
                  setSelectedId(id);
                  setAddTextOpen(false);
                }}
                onMoveElement={updateElement}
              />
            </div>
          </div>

          <div className="h-fit rounded-2xl border border-stone-200 bg-white p-4">
            {selected ? (
              <ElementPanel
                element={selected}
                onChange={(patch) => updateElement(selected.id, patch)}
                onDelete={() => deleteElement(selected.id)}
                onDuplicate={() => addElement({ ...selected, id: newElementId(), x: Math.min(100, selected.x + 2), y: Math.min(100, selected.y + 2) })}
                onLayer={(dir) =>
                  update((t) => {
                    const els = [...t.elements];
                    const i = els.findIndex((el) => el.id === selected.id);
                    const j = Math.min(els.length - 1, Math.max(0, i + dir));
                    [els[i], els[j]] = [els[j], els[i]];
                    return { ...t, elements: els };
                  })
                }
                onDrawSignature={() => setDrawingFor(selected.id)}
              />
            ) : (
              <BackgroundPanel
                background={template.background}
                onChange={(patch) => update((t) => ({ ...t, background: { ...t.background, ...patch } }))}
                onReset={async () => {
                  const ok = await confirm({
                    title: "Reset to the default layout?",
                    message: "This replaces your current design. You can still leave without saving to undo it.",
                    confirmLabel: "Reset design",
                  });
                  if (!ok) return;
                  update(() => defaultTemplate(course.certificate));
                  setSelectedId(null);
                }}
              />
            )}
          </div>
        </div>
      </div>

      {drawingFor && (
        <SignaturePad
          onClose={() => setDrawingFor(null)}
          onUse={(src) => {
            updateElement(drawingFor, { src });
            setDrawingFor(null);
          }}
        />
      )}

      {previewing && (
        <CertificateView
          certificate={{ ...course.certificate, template }}
          learnerName="Ama Boateng"
          courseTitle={course.title}
          completedAt={new Date().toISOString()}
          onClose={() => setPreviewing(false)}
        />
      )}
    </div>
  );
}
