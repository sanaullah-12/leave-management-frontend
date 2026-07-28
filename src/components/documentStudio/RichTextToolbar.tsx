import React from "react";
import {
  BoldIcon,
  ItalicIcon,
  UnderlineIcon,
  ListBulletIcon,
  NumberedListIcon,
  Bars3BottomLeftIcon,
  Bars3Icon,
  Bars3BottomRightIcon,
  Bars4Icon,
  TableCellsIcon,
  PhotoIcon,
  ArrowUturnLeftIcon,
  ArrowUturnRightIcon,
  MagnifyingGlassIcon,
  DocumentPlusIcon,
} from "@heroicons/react/24/outline";

export interface EditorCommands {
  exec: (command: string, value?: string) => void;
  isActive: (command: string) => boolean;
  insertHtml: (html: string) => void;
  setBlock: (tag: string) => void;
  setFontColor: (color: string) => void;
  setHighlight: (color: string) => void;
  toggleFind: () => void;
}

interface Props {
  cmd: EditorCommands;
  /** bump to force active-state re-read on selection change */
  version: number;
}

const Divider = () => (
  <span className="mx-1 h-5 w-px flex-shrink-0 bg-gray-200 dark:bg-gray-700" />
);

const FONT_COLORS = [
  "#111827", "#dc2626", "#ea580c", "#ca8a04", "#16a34a",
  "#2563eb", "#7c3aed", "#db2777", "#0891b2", "#6b7280",
];
const HIGHLIGHTS = [
  "#fef08a", "#bbf7d0", "#bfdbfe", "#fbcfe8", "#e9d5ff", "transparent",
];

const ToolBtn: React.FC<{
  onClick: () => void;
  active?: boolean;
  title: string;
  children: React.ReactNode;
}> = ({ onClick, active, title, children }) => (
  <button
    type="button"
    title={title}
    onMouseDown={(e) => e.preventDefault()}
    onClick={onClick}
    className={`grid h-8 w-8 flex-shrink-0 place-items-center rounded-lg transition-colors ${
      active
        ? "text-white"
        : "text-gray-600 hover:bg-black/5 dark:text-gray-300 dark:hover:bg-white/10"
    }`}
    style={active ? { background: "var(--accent)" } : undefined}
  >
    {children}
  </button>
);

const ColorPopover: React.FC<{
  label: string;
  swatch: string;
  colors: string[];
  onPick: (c: string) => void;
  glyph: React.ReactNode;
}> = ({ label, swatch, colors, onPick, glyph }) => {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  return (
    <div ref={ref} className="relative flex-shrink-0">
      <button
        type="button"
        title={label}
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => setOpen((v) => !v)}
        className="flex h-8 items-center gap-0.5 rounded-lg px-1.5 text-gray-600 transition-colors hover:bg-black/5 dark:text-gray-300 dark:hover:bg-white/10"
      >
        <span className="grid place-items-center">{glyph}</span>
        <span
          className="h-1 w-4 rounded-full"
          style={{ background: swatch === "transparent" ? "#d1d5db" : swatch }}
        />
      </button>
      {open && (
        <div className="absolute left-0 top-9 z-30 grid grid-cols-5 gap-1.5 rounded-xl border border-gray-200 bg-white p-2 shadow-xl dark:border-gray-700 dark:bg-gray-800">
          {colors.map((c) => (
            <button
              key={c}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                onPick(c);
                setOpen(false);
              }}
              className="h-6 w-6 rounded-md border border-black/10 dark:border-white/10"
              style={{
                background:
                  c === "transparent"
                    ? "repeating-conic-gradient(#e5e7eb 0% 25%, #fff 0% 50%) 50% / 8px 8px"
                    : c,
              }}
              title={c}
            />
          ))}
        </div>
      )}
    </div>
  );
};

/** Word-processor style formatting toolbar. Stateless — drives the canvas via `cmd`. */
const RichTextToolbar: React.FC<Props> = ({ cmd }) => {
  const [block, setBlockState] = React.useState("p");

  return (
    <div className="flex flex-wrap items-center gap-0.5 rounded-xl border border-gray-200/70 bg-white/80 p-1.5 backdrop-blur-sm dark:border-gray-700/50 dark:bg-gray-800/70">
      {/* Block style */}
      <select
        value={block}
        onMouseDown={(e) => e.stopPropagation()}
        onChange={(e) => {
          setBlockState(e.target.value);
          cmd.setBlock(e.target.value);
        }}
        className="h-8 flex-shrink-0 rounded-lg border border-gray-200 bg-white px-2 text-xs font-medium text-gray-700 outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
        title="Text style"
      >
        <option value="p">Paragraph</option>
        <option value="h1">Heading 1</option>
        <option value="h2">Heading 2</option>
        <option value="h3">Heading 3</option>
        <option value="blockquote">Quote</option>
      </select>

      <Divider />

      <ToolBtn title="Bold (Ctrl+B)" active={cmd.isActive("bold")} onClick={() => cmd.exec("bold")}>
        <BoldIcon className="h-4 w-4" />
      </ToolBtn>
      <ToolBtn title="Italic (Ctrl+I)" active={cmd.isActive("italic")} onClick={() => cmd.exec("italic")}>
        <ItalicIcon className="h-4 w-4" />
      </ToolBtn>
      <ToolBtn title="Underline (Ctrl+U)" active={cmd.isActive("underline")} onClick={() => cmd.exec("underline")}>
        <UnderlineIcon className="h-4 w-4" />
      </ToolBtn>

      <ColorPopover
        label="Text color"
        glyph={<span className="text-sm font-bold leading-none">A</span>}
        swatch={FONT_COLORS[0]}
        colors={FONT_COLORS}
        onPick={cmd.setFontColor}
      />
      <ColorPopover
        label="Highlight"
        glyph={<span className="text-sm font-bold leading-none">🖍</span>}
        swatch={HIGHLIGHTS[0]}
        colors={HIGHLIGHTS}
        onPick={cmd.setHighlight}
      />

      <Divider />

      <ToolBtn title="Align left" active={cmd.isActive("justifyLeft")} onClick={() => cmd.exec("justifyLeft")}>
        <Bars3BottomLeftIcon className="h-4 w-4" />
      </ToolBtn>
      <ToolBtn title="Align center" active={cmd.isActive("justifyCenter")} onClick={() => cmd.exec("justifyCenter")}>
        <Bars3Icon className="h-4 w-4" />
      </ToolBtn>
      <ToolBtn title="Align right" active={cmd.isActive("justifyRight")} onClick={() => cmd.exec("justifyRight")}>
        <Bars3BottomRightIcon className="h-4 w-4" />
      </ToolBtn>
      <ToolBtn title="Justify" active={cmd.isActive("justifyFull")} onClick={() => cmd.exec("justifyFull")}>
        <Bars4Icon className="h-4 w-4" />
      </ToolBtn>

      <Divider />

      <ToolBtn title="Bulleted list" active={cmd.isActive("insertUnorderedList")} onClick={() => cmd.exec("insertUnorderedList")}>
        <ListBulletIcon className="h-4 w-4" />
      </ToolBtn>
      <ToolBtn title="Numbered list" active={cmd.isActive("insertOrderedList")} onClick={() => cmd.exec("insertOrderedList")}>
        <NumberedListIcon className="h-4 w-4" />
      </ToolBtn>

      <Divider />

      <ToolBtn
        title="Insert table"
        onClick={() =>
          cmd.insertHtml(
            '<table><tbody><tr><td>&nbsp;</td><td>&nbsp;</td></tr><tr><td>&nbsp;</td><td>&nbsp;</td></tr></tbody></table><p><br/></p>'
          )
        }
      >
        <TableCellsIcon className="h-4 w-4" />
      </ToolBtn>
      <ToolBtn
        title="Insert image (URL)"
        onClick={() => {
          const url = window.prompt("Image URL");
          if (url) cmd.insertHtml(`<img src="${url}" alt="" />`);
        }}
      >
        <PhotoIcon className="h-4 w-4" />
      </ToolBtn>
      <ToolBtn
        title="Page break"
        onClick={() =>
          cmd.insertHtml(
            '<div style="break-after:page;page-break-after:always;height:0;"></div><p><br/></p>'
          )
        }
      >
        <DocumentPlusIcon className="h-4 w-4" />
      </ToolBtn>

      <Divider />

      <ToolBtn title="Undo (Ctrl+Z)" onClick={() => cmd.exec("undo")}>
        <ArrowUturnLeftIcon className="h-4 w-4" />
      </ToolBtn>
      <ToolBtn title="Redo (Ctrl+Y)" onClick={() => cmd.exec("redo")}>
        <ArrowUturnRightIcon className="h-4 w-4" />
      </ToolBtn>
      <ToolBtn title="Find & replace" onClick={cmd.toggleFind}>
        <MagnifyingGlassIcon className="h-4 w-4" />
      </ToolBtn>
    </div>
  );
};

export default RichTextToolbar;
