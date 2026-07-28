import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { motion } from "framer-motion";
import {
  MinusIcon,
  PlusIcon,
  EyeIcon,
  PencilSquareIcon,
  XMarkIcon,
  ArrowsPointingOutIcon,
  TrashIcon,
  Bars3BottomLeftIcon,
  Bars3Icon,
  Bars3BottomRightIcon,
} from "@heroicons/react/24/outline";
import RichTextToolbar, { type EditorCommands } from "./RichTextToolbar";
import type { BrandingAsset, PageSettings } from "./types";

export interface CanvasHandle {
  /** Insert a {{Token}} at the current caret. */
  insertToken: (key: string) => void;
  focus: () => void;
  getHtml: () => string;
}

interface Props {
  /** Changes whenever a different template/document is loaded — resets the DOM. */
  docKey: string;
  initialHtml: string;
  page: PageSettings;
  assets: BrandingAsset[];
  editable: boolean;
  onChange: (html: string) => void;
}

const assetFor = (assets: BrandingAsset[], slot: BrandingAsset["slot"]) =>
  assets.find((a) => a.slot === slot && a.enabled);

/**
 * The centrepiece — a live, zoomable A4 canvas with a contentEditable body and
 * WYSIWYG letterhead/watermark preview that matches the export pipeline 1:1.
 */
const DocumentCanvas = forwardRef<CanvasHandle, Props>(
  ({ docKey, initialHtml, page, assets, editable, onChange }, ref) => {
    const bodyRef = useRef<HTMLDivElement>(null);
    const [zoom, setZoom] = useState(1);
    const [selVersion, setSelVersion] = useState(0);
    const [preview, setPreview] = useState(false);
    const [findOpen, setFindOpen] = useState(false);
    const [find, setFind] = useState("");
    const [replace, setReplace] = useState("");
    const [matchInfo, setMatchInfo] = useState<string>("");
    const [selectedImg, setSelectedImg] = useState<HTMLImageElement | null>(null);
    const [imgBox, setImgBox] = useState<
      { left: number; top: number; width: number; height: number } | null
    >(null);
    const scrollRef = useRef<HTMLDivElement>(null);

    const isEditing = editable && !preview;

    // (Re)hydrate the DOM only when the loaded document changes — never on keystroke.
    useEffect(() => {
      if (bodyRef.current) bodyRef.current.innerHTML = initialHtml;
      setSelectedImg(null);
      setImgBox(null);
    }, [docKey]); // eslint-disable-line react-hooks/exhaustive-deps

    // Auto fit-to-width on first mount so the whole A4 page is visible.
    useEffect(() => {
      const el = scrollRef.current;
      if (!el) return;
      const id = requestAnimationFrame(() => {
        const avail = el.clientWidth - 48; // account for p-6 padding
        const pagePx = 794; // A4 width at 96dpi
        if (avail > 0 && avail < pagePx) {
          setZoom(Math.max(0.5, +(avail / pagePx).toFixed(2)));
        }
      });
      return () => cancelAnimationFrame(id);
    }, []);

    // Track selection to refresh toolbar active-states.
    useEffect(() => {
      const handler = () => {
        if (
          bodyRef.current &&
          document.activeElement &&
          bodyRef.current.contains(document.activeElement)
        ) {
          setSelVersion((v) => v + 1);
        }
      };
      document.addEventListener("selectionchange", handler);
      return () => document.removeEventListener("selectionchange", handler);
    }, []);

    const sync = useCallback(() => {
      if (bodyRef.current) onChange(bodyRef.current.innerHTML);
    }, [onChange]);

    const focusBody = () => bodyRef.current?.focus();

    const exec = useCallback(
      (command: string, value?: string) => {
        focusBody();
        try {
          document.execCommand(command, false, value);
        } catch {
          /* unsupported command — no-op */
        }
        setSelVersion((v) => v + 1);
        sync();
      },
      [sync]
    );

    const insertHtml = useCallback(
      (html: string) => {
        focusBody();
        try {
          document.execCommand("insertHTML", false, html);
        } catch {
          /* no-op */
        }
        sync();
      },
      [sync]
    );

    const cmd: EditorCommands = useMemo(
      () => ({
        exec,
        isActive: (command: string) => {
          try {
            return document.queryCommandState(command);
          } catch {
            return false;
          }
        },
        insertHtml,
        setBlock: (tag: string) => exec("formatBlock", `<${tag}>`),
        setFontColor: (color: string) => exec("foreColor", color),
        setHighlight: (color: string) =>
          exec("hiliteColor", color === "transparent" ? "#ffffff00" : color),
        toggleFind: () => setFindOpen((v) => !v),
      }),
      // selVersion intentionally in deps so isActive re-reads on selection change
      [exec, insertHtml, selVersion]
    );

    useImperativeHandle(ref, () => ({
      insertToken: (key: string) => {
        insertHtml(
          `<span data-token="1" style="color:var(--accent);font-weight:600;">{{${key}}}</span>&nbsp;`
        );
      },
      focus: focusBody,
      getHtml: () => bodyRef.current?.innerHTML ?? "",
    }));

    /* -------- find & replace (text-node safe) -------- */
    const doReplaceAll = () => {
      if (!bodyRef.current || !find) return;
      const walker = document.createTreeWalker(
        bodyRef.current,
        NodeFilter.SHOW_TEXT
      );
      let count = 0;
      const nodes: Text[] = [];
      let n: Node | null;
      while ((n = walker.nextNode())) nodes.push(n as Text);
      nodes.forEach((node) => {
        const text = node.nodeValue ?? "";
        if (text.includes(find)) {
          const next = text.split(find);
          count += next.length - 1;
          node.nodeValue = next.join(replace);
        }
      });
      setMatchInfo(count ? `Replaced ${count}` : "No matches");
      sync();
    };

    const countMatches = () => {
      if (!bodyRef.current || !find) return setMatchInfo("");
      const text = bodyRef.current.innerText || "";
      const matches = text.split(find).length - 1;
      setMatchInfo(matches ? `${matches} matches` : "No matches");
    };

    /* -------- drag & drop placeholder support -------- */
    const onDrop = (e: React.DragEvent) => {
      const key = e.dataTransfer.getData("text/placeholder");
      if (!key) return;
      e.preventDefault();
      // Place caret at the drop point when the browser supports it.
      const pos =
        (document as any).caretRangeFromPoint?.(e.clientX, e.clientY) ??
        null;
      if (pos) {
        const sel = window.getSelection();
        sel?.removeAllRanges();
        sel?.addRange(pos);
      }
      insertHtml(
        `<span data-token="1" style="color:var(--accent);font-weight:600;">{{${key}}}</span>&nbsp;`
      );
    };

    /* -------- image selection & resize (Word-like) -------- */
    const computeBox = (img: HTMLImageElement) => ({
      left: img.offsetLeft,
      top: img.offsetTop,
      width: img.offsetWidth,
      height: img.offsetHeight,
    });

    const onEditorClick = (e: React.MouseEvent) => {
      const t = e.target as HTMLElement;
      if (t && t.tagName === "IMG") {
        const img = t as HTMLImageElement;
        setSelectedImg(img);
        setImgBox(computeBox(img));
      } else if (selectedImg) {
        setSelectedImg(null);
        setImgBox(null);
      }
    };

    const beginResize = (e: React.PointerEvent, side: "e" | "w") => {
      e.preventDefault();
      e.stopPropagation();
      const img = selectedImg;
      if (!img) return;
      const startX = e.clientX;
      const startW = img.offsetWidth;
      const maxW = bodyRef.current?.clientWidth ?? startW;
      const dir = side === "e" ? 1 : -1;
      const onMove = (ev: PointerEvent) => {
        const dx = ((ev.clientX - startX) / zoom) * dir;
        const w = Math.max(48, Math.min(startW + dx, maxW));
        img.style.width = `${Math.round(w)}px`;
        img.style.height = "auto";
        setImgBox(computeBox(img));
      };
      const onUp = () => {
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
        setImgBox(computeBox(img));
        sync();
      };
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
    };

    const setImgWidthPct = (pct: number) => {
      const img = selectedImg;
      if (!img) return;
      img.style.width = `${pct}%`;
      img.style.height = "auto";
      setImgBox(computeBox(img));
      sync();
    };

    const setImgAlign = (align: "left" | "center" | "right") => {
      const img = selectedImg;
      if (!img) return;
      img.style.display = "block";
      img.style.marginLeft = align === "left" ? "0" : "auto";
      img.style.marginRight = align === "right" ? "0" : "auto";
      setImgBox(computeBox(img));
      sync();
    };

    const deleteImg = () => {
      const img = selectedImg;
      if (!img) return;
      img.remove();
      setSelectedImg(null);
      setImgBox(null);
      sync();
    };

    const header = page.showLetterhead ? assetFor(assets, "header") : undefined;
    const logo = page.showLetterhead ? assetFor(assets, "logo") : undefined;
    const footer = page.showLetterhead ? assetFor(assets, "footer") : undefined;
    const signature = assetFor(assets, "signature");
    const watermark = page.showWatermark
      ? assetFor(assets, "watermark")
      : undefined;
    const background = page.showBackground
      ? assetFor(assets, "background")
      : undefined;

    return (
      <div className="flex h-full flex-col">
        {/* Toolbar */}
        {isEditing && (
          <div className="mb-3">
            <RichTextToolbar cmd={cmd} version={selVersion} />
          </div>
        )}

        {/* Picture toolbar — shown while an image is selected */}
        {isEditing && selectedImg && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-3 flex flex-wrap items-center gap-1 rounded-xl border border-gray-200/70 bg-white/80 p-1.5 backdrop-blur-sm dark:border-gray-700/50 dark:bg-gray-800/70"
          >
            <span className="px-2 text-xs font-semibold text-gray-500 dark:text-gray-400">
              Picture
            </span>
            <span className="mx-1 h-5 w-px bg-gray-200 dark:bg-gray-700" />
            {[25, 50, 75, 100].map((p) => (
              <button
                key={p}
                onClick={() => setImgWidthPct(p)}
                className="rounded-lg px-2 py-1 text-xs font-medium text-gray-600 transition-colors hover:bg-black/5 dark:text-gray-300 dark:hover:bg-white/10"
                title={`Set width to ${p}%`}
              >
                {p}%
              </button>
            ))}
            <span className="mx-1 h-5 w-px bg-gray-200 dark:bg-gray-700" />
            <button
              onClick={() => setImgAlign("left")}
              title="Align left"
              className="grid h-8 w-8 place-items-center rounded-lg text-gray-600 hover:bg-black/5 dark:text-gray-300 dark:hover:bg-white/10"
            >
              <Bars3BottomLeftIcon className="h-4 w-4" />
            </button>
            <button
              onClick={() => setImgAlign("center")}
              title="Align center"
              className="grid h-8 w-8 place-items-center rounded-lg text-gray-600 hover:bg-black/5 dark:text-gray-300 dark:hover:bg-white/10"
            >
              <Bars3Icon className="h-4 w-4" />
            </button>
            <button
              onClick={() => setImgAlign("right")}
              title="Align right"
              className="grid h-8 w-8 place-items-center rounded-lg text-gray-600 hover:bg-black/5 dark:text-gray-300 dark:hover:bg-white/10"
            >
              <Bars3BottomRightIcon className="h-4 w-4" />
            </button>
            <span className="mx-1 h-5 w-px bg-gray-200 dark:bg-gray-700" />
            <button
              onClick={deleteImg}
              title="Delete image"
              className="grid h-8 w-8 place-items-center rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10"
            >
              <TrashIcon className="h-4 w-4" />
            </button>
            <span className="ml-auto px-2 text-[11px] text-gray-400">
              Drag the blue handles to resize
            </span>
          </motion.div>
        )}

        {/* Find & replace */}
        {findOpen && isEditing && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-3 flex flex-wrap items-center gap-2 rounded-xl border border-gray-200/70 bg-white/80 p-2 dark:border-gray-700/50 dark:bg-gray-800/70"
          >
            <input
              value={find}
              onChange={(e) => setFind(e.target.value)}
              onKeyUp={countMatches}
              placeholder="Find"
              className="h-8 w-32 rounded-lg border border-gray-200 bg-white px-2 text-sm outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
            />
            <input
              value={replace}
              onChange={(e) => setReplace(e.target.value)}
              placeholder="Replace with"
              className="h-8 w-32 rounded-lg border border-gray-200 bg-white px-2 text-sm outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
            />
            <button onClick={doReplaceAll} className="btn-secondary h-8 px-3 text-xs">
              Replace all
            </button>
            {matchInfo && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {matchInfo}
              </span>
            )}
            <button
              onClick={() => setFindOpen(false)}
              className="ml-auto grid h-8 w-8 place-items-center rounded-lg text-gray-400 hover:bg-black/5 dark:hover:bg-white/10"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          </motion.div>
        )}

        {/* Canvas scroll area */}
        <div
          ref={scrollRef}
          className="relative flex-1 overflow-auto rounded-2xl bg-gray-100/70 p-6 dark:bg-gray-900/40"
        >
          <div
            className="mx-auto"
            style={{
              width: `calc(210mm * ${zoom})`,
              transition: "width 0.2s ease",
            }}
          >
            <div
              style={{
                transform: `scale(${zoom})`,
                transformOrigin: "top center",
                width: "210mm",
              }}
            >
              <div
                onDrop={onDrop}
                onDragOver={(e) => e.preventDefault()}
                className="ds-page relative bg-white text-gray-900 shadow-[0_10px_40px_rgba(0,0,0,0.14)] ring-1 ring-black/5"
                style={{
                  width: "210mm",
                  minHeight: "297mm",
                  padding: `${page.margin}mm`,
                  fontFamily: page.fontFamily,
                  fontSize: `${page.fontSize}pt`,
                  lineHeight: page.lineHeight,
                  ...(background
                    ? {
                        backgroundImage: `url(${background.dataUrl})`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                        backgroundRepeat: "no-repeat",
                      }
                    : {}),
                }}
              >
                {/* Watermark */}
                {watermark && (
                  <div className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center">
                    <img
                      src={watermark.dataUrl}
                      alt=""
                      style={{
                        maxWidth: "60%",
                        opacity: watermark.opacity / 100,
                        transform: `scale(${watermark.scale / 100})`,
                      }}
                    />
                  </div>
                )}

                <div className="relative z-10">
                  {/* Header / logo */}
                  {header ? (
                    <div className="mb-4 text-center">
                      <img
                        src={header.dataUrl}
                        alt="Letterhead"
                        style={{
                          maxWidth: "100%",
                          transform: `scale(${header.scale / 100})`,
                          transformOrigin: "top center",
                        }}
                      />
                    </div>
                  ) : logo ? (
                    <div className="mb-4">
                      <img
                        src={logo.dataUrl}
                        alt="Logo"
                        style={{
                          maxHeight: 64,
                          transform: `scale(${logo.scale / 100})`,
                          transformOrigin: "top left",
                        }}
                      />
                    </div>
                  ) : null}

                  {/* Editable body */}
                  <div
                    ref={bodyRef}
                    className="ds-editable outline-none"
                    contentEditable={isEditing}
                    suppressContentEditableWarning
                    onInput={sync}
                    onClick={onEditorClick}
                    spellCheck
                    style={{ minHeight: "40mm" }}
                  />

                  {/* Image resize handles */}
                  {isEditing && selectedImg && imgBox && (
                    <div
                      className="pointer-events-none absolute z-20"
                      style={{
                        left: imgBox.left,
                        top: imgBox.top,
                        width: imgBox.width,
                        height: imgBox.height,
                      }}
                    >
                      <div
                        className="absolute inset-0 rounded-sm border-2"
                        style={{ borderColor: "var(--accent)" }}
                      />
                      {(["nw", "ne", "sw", "se"] as const).map((c) => (
                        <span
                          key={c}
                          onPointerDown={(e) =>
                            beginResize(e, c === "ne" || c === "se" ? "e" : "w")
                          }
                          className="pointer-events-auto absolute h-3 w-3 rounded-full border-2 border-white bg-[var(--accent)] shadow"
                          style={{
                            cursor:
                              c === "nw" || c === "se"
                                ? "nwse-resize"
                                : "nesw-resize",
                            left: c.includes("w") ? -6 : undefined,
                            right: c.includes("e") ? -6 : undefined,
                            top: c.includes("n") ? -6 : undefined,
                            bottom: c.includes("s") ? -6 : undefined,
                          }}
                        />
                      ))}
                    </div>
                  )}

                  {/* Signature */}
                  {signature && (
                    <div className="mt-5">
                      <img
                        src={signature.dataUrl}
                        alt="Signature"
                        style={{
                          maxHeight: 80,
                          transform: `scale(${signature.scale / 100})`,
                          transformOrigin: "top left",
                        }}
                      />
                    </div>
                  )}

                  {/* Footer */}
                  {footer && (
                    <div className="mt-6 text-center">
                      <img
                        src={footer.dataUrl}
                        alt="Footer"
                        style={{
                          maxWidth: "100%",
                          transform: `scale(${footer.scale / 100})`,
                          transformOrigin: "bottom center",
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar: zoom + preview */}
        <div className="mt-3 flex items-center justify-between rounded-xl border border-gray-200/70 bg-white/80 px-3 py-2 dark:border-gray-700/50 dark:bg-gray-800/70">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setZoom((z) => Math.max(0.5, +(z - 0.1).toFixed(2)))}
              className="grid h-8 w-8 place-items-center rounded-lg text-gray-600 hover:bg-black/5 dark:text-gray-300 dark:hover:bg-white/10"
              title="Zoom out"
            >
              <MinusIcon className="h-4 w-4" />
            </button>
            <span className="w-12 text-center text-xs font-medium tabular-nums text-gray-600 dark:text-gray-300">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={() => setZoom((z) => Math.min(1.5, +(z + 0.1).toFixed(2)))}
              className="grid h-8 w-8 place-items-center rounded-lg text-gray-600 hover:bg-black/5 dark:text-gray-300 dark:hover:bg-white/10"
              title="Zoom in"
            >
              <PlusIcon className="h-4 w-4" />
            </button>
            <button
              onClick={() => setZoom(1)}
              className="ml-1 grid h-8 w-8 place-items-center rounded-lg text-gray-600 hover:bg-black/5 dark:text-gray-300 dark:hover:bg-white/10"
              title="Reset zoom"
            >
              <ArrowsPointingOutIcon className="h-4 w-4" />
            </button>
          </div>

          <div className="text-[11px] font-medium text-gray-400 dark:text-gray-500">
            A4 · 210 × 297 mm
          </div>

          {editable && (
            <button
              onClick={() => setPreview((v) => !v)}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-xs font-medium text-gray-600 transition-colors hover:bg-black/5 dark:text-gray-300 dark:hover:bg-white/10"
            >
              {preview ? (
                <>
                  <PencilSquareIcon className="h-4 w-4" /> Edit
                </>
              ) : (
                <>
                  <EyeIcon className="h-4 w-4" /> Print preview
                </>
              )}
            </button>
          )}
        </div>
      </div>
    );
  }
);

DocumentCanvas.displayName = "DocumentCanvas";
export default DocumentCanvas;
