import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import {
  MegaphoneIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  EllipsisHorizontalIcon,
  PencilIcon,
  TrashIcon,
  BookmarkIcon,
  BookmarkSlashIcon,
  EyeIcon,
  FaceSmileIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "../context/AuthContext";
import { useDebouncedValue } from "../hooks/useDebouncedValue";
import { announcementsAPI } from "../services/api";
import {
  categoryIcon,
  type IconComponent,
} from "../components/announcements/categoryIcons";
import {
  showSuccessToast,
  showErrorToast,
} from "../utils/toastHelpers";
import { staggerContainer, staggerItem } from "../lib/motion";
import Avatar from "../components/Avatar";
import Modal from "../components/ui/Modal";
import Select from "../components/ui/Select";
import DatePicker from "../components/ui/DatePicker";
import Dropdown from "../components/ui/Dropdown";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import LogoLoader from "../components/LogoLoader";

/* ------------------------------------------------------------------ */
/*  Types & metadata                                                   */
/* ------------------------------------------------------------------ */
interface Announcement {
  _id: string;
  title: string;
  body: string;
  category: string;
  audience: "all" | "admins";
  pinned: boolean;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
  authorName: string;
  author?: { _id?: string; name?: string; profilePicture?: string; position?: string };
  reactionCounts: Record<string, number>;
  myReaction: string | null;
  readCount: number;
  hasRead: boolean;
}

const CATEGORIES: Record<
  string,
  { label: string; icon: IconComponent; chip: string; bar: string }
> = {
  general: { label: "General", icon: categoryIcon("general"), chip: "bg-gray-100 text-gray-700 dark:bg-gray-700/60 dark:text-gray-300", bar: "from-gray-400 to-gray-500" },
  event: { label: "Event", icon: categoryIcon("event"), chip: "bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300", bar: "from-violet-500 to-purple-600" },
  policy: { label: "Policy", icon: categoryIcon("policy"), chip: "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300", bar: "from-blue-500 to-indigo-600" },
  celebration: { label: "Celebration", icon: categoryIcon("celebration"), chip: "bg-pink-50 text-pink-700 dark:bg-pink-500/10 dark:text-pink-300", bar: "from-pink-500 to-rose-500" },
  update: { label: "Update", icon: categoryIcon("update"), chip: "bg-cyan-50 text-cyan-700 dark:bg-cyan-500/10 dark:text-cyan-300", bar: "from-cyan-500 to-teal-600" },
  urgent: { label: "Urgent", icon: categoryIcon("urgent"), chip: "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-300", bar: "from-red-500 to-rose-600" },
};
const CATEGORY_KEYS = Object.keys(CATEGORIES);
// Reaction glyphs. These are product data, not decoration: the chosen emoji is
// stored per reaction and must stay in sync with VALID_EMOJIS in
// backend/routes/announcements.js.
const EMOJIS = ["👍", "🎉", "❤️", "👏", "🚀", "👀"];

/** Shared form-field style - matches the app's inputs (accent focus ring). */
const FIELD =
  "w-full rounded-xl bg-[var(--card-surface)] px-4 py-3 text-sm text-gray-900 outline-none ring-1 ring-inset ring-gray-200/70 transition-shadow placeholder-gray-400 focus:ring-2 focus:ring-blue-500/50 dark:text-gray-100 dark:placeholder-gray-500 dark:ring-white/10";

const catMeta = (c: string) => CATEGORIES[c] ?? CATEGORIES.general;

/* ------------------------------------------------------------------ */
/*  Reaction bar                                                       */
/* ------------------------------------------------------------------ */
const ReactionBar: React.FC<{
  a: Announcement;
  onReact: (emoji: string) => void;
}> = ({ a, onReact }) => {
  const [open, setOpen] = useState(false);
  const active = Object.entries(a.reactionCounts).filter(([, n]) => n > 0);

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {active.map(([emoji, n]) => {
        const mine = a.myReaction === emoji;
        return (
          <button
            key={emoji}
            onClick={() => onReact(emoji)}
            className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium transition-colors ${
              mine
                ? "border-transparent text-white"
                : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700/60"
            }`}
            style={mine ? { background: "var(--accent)" } : undefined}
          >
            <span>{emoji}</span>
            <span className="tabular-nums">{n}</span>
          </button>
        );
      })}

      <div className="relative">
        <button
          onClick={() => setOpen((v) => !v)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          className="grid h-7 w-7 place-items-center rounded-full border border-gray-200 text-gray-400 transition-colors hover:border-gray-300 hover:text-gray-600 dark:border-gray-700 dark:hover:text-gray-200"
          title="Add reaction"
        >
          <FaceSmileIcon className="h-4 w-4" />
        </button>
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, y: 6, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 6, scale: 0.96 }}
              className="absolute bottom-9 left-0 z-20 flex gap-1 rounded-xl border border-gray-200 bg-white p-1.5 shadow-xl dark:border-gray-700 dark:bg-gray-800"
            >
              {EMOJIS.map((e) => (
                <button
                  key={e}
                  onMouseDown={(ev) => ev.preventDefault()}
                  onClick={() => {
                    onReact(e);
                    setOpen(false);
                  }}
                  className={`grid h-8 w-8 place-items-center rounded-lg text-lg transition-transform hover:scale-125 ${
                    a.myReaction === e ? "bg-gray-100 dark:bg-gray-700" : ""
                  }`}
                >
                  {e}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  Announcement card                                                  */
/* ------------------------------------------------------------------ */
const AnnouncementCard: React.FC<{
  a: Announcement;
  canManage: boolean;
  onRead: () => void;
  onReact: (emoji: string) => void;
  onEdit: () => void;
  onPin: () => void;
  onDelete: () => void;
}> = ({ a, canManage, onRead, onReact, onEdit, onPin, onDelete }) => {
  const [expanded, setExpanded] = useState(false);
  const meta = catMeta(a.category);
  const long = a.body.length > 260;

  const toggle = () => {
    setExpanded((v) => !v);
    if (!a.hasRead) onRead();
  };

  return (
    <motion.article
      variants={staggerItem}
      layout
      className="group relative overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-sm transition-shadow hover:shadow-md dark:border-gray-700/60 dark:bg-gray-800/60"
    >
      {/* Category accent bar */}
      <div className={`h-1 w-full bg-gradient-to-r ${meta.bar}`} />

      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <Avatar
              src={a.author?.profilePicture}
              name={a.author?.name || a.authorName}
              size="sm"
            />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">
                {a.author?.name || a.authorName}
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500">
                {a.author?.position ? `${a.author.position} · ` : ""}
                {formatDistanceToNow(new Date(a.createdAt), { addSuffix: true })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {!a.hasRead && (
              <span
                className="h-2 w-2 flex-shrink-0 rounded-full"
                style={{ background: "var(--accent)" }}
                title="New"
              />
            )}
            {a.pinned && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
                <BookmarkIcon className="h-3 w-3" />
                Pinned
              </span>
            )}
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${meta.chip}`}
            >
              <meta.icon className="h-3 w-3" />
              {meta.label}
            </span>
            {a.audience === "admins" && (
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-500 dark:bg-gray-700 dark:text-gray-400">
                HR only
              </span>
            )}
            {canManage && (
              <Dropdown
                align="right"
                widthClass="w-40"
                bareButton
                buttonClassName="grid h-7 w-7 place-items-center rounded-lg text-gray-400 hover:bg-black/5 hover:text-gray-700 dark:hover:bg-white/10 dark:hover:text-gray-200"
                sections={[
                  {
                    items: [
                      { label: "Edit", icon: PencilIcon, onClick: onEdit },
                      {
                        label: a.pinned ? "Unpin" : "Pin to top",
                        icon: a.pinned ? BookmarkSlashIcon : BookmarkIcon,
                        onClick: onPin,
                      },
                    ],
                  },
                  {
                    items: [
                      { label: "Delete", icon: TrashIcon, danger: true, onClick: onDelete },
                    ],
                  },
                ]}
              >
                <EllipsisHorizontalIcon className="h-5 w-5" />
              </Dropdown>
            )}
          </div>
        </div>

        <h3 className="mt-3 text-lg font-bold tracking-tight text-gray-900 dark:text-white">
          {a.title}
        </h3>

        <p
          className={`mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-gray-600 dark:text-gray-300 ${
            !expanded && long ? "line-clamp-3" : ""
          }`}
        >
          {a.body}
        </p>
        {long && (
          <button
            onClick={toggle}
            className="mt-1.5 text-xs font-semibold text-blue-600 hover:underline dark:text-blue-400"
          >
            {expanded ? "Show less" : "Read more"}
          </button>
        )}

        {/* Footer: reactions + read count */}
        <div className="mt-4 flex items-center justify-between gap-3 border-t border-gray-100 pt-3 dark:border-gray-700/50">
          <ReactionBar a={a} onReact={onReact} />
          <span className="inline-flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
            <EyeIcon className="h-4 w-4" />
            {a.readCount}
          </span>
        </div>
      </div>
    </motion.article>
  );
};

/* ------------------------------------------------------------------ */
/*  Create / edit modal                                                */
/* ------------------------------------------------------------------ */
interface DraftState {
  title: string;
  body: string;
  category: string;
  audience: "all" | "admins";
  pinned: boolean;
  expiresAt: string;
}
const EMPTY_DRAFT: DraftState = {
  title: "",
  body: "",
  category: "general",
  audience: "all",
  pinned: false,
  expiresAt: "",
};

const AnnouncementModal: React.FC<{
  open: boolean;
  editing: Announcement | null;
  onClose: () => void;
  onSubmit: (draft: DraftState) => void;
  saving: boolean;
}> = ({ open, editing, onClose, onSubmit, saving }) => {
  const [draft, setDraft] = useState<DraftState>(EMPTY_DRAFT);

  React.useEffect(() => {
    if (open) {
      setDraft(
        editing
          ? {
              title: editing.title,
              body: editing.body,
              category: editing.category,
              audience: editing.audience,
              pinned: editing.pinned,
              expiresAt: editing.expiresAt ? editing.expiresAt.slice(0, 10) : "",
            }
          : EMPTY_DRAFT
      );
    }
  }, [open, editing]);

  const valid = draft.title.trim() && draft.body.trim();

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={editing ? "Edit announcement" : "New announcement"}
      description="Share news, events or policy updates with your team."
      icon={<MegaphoneIcon className="h-5 w-5" />}
      footer={
        <div className="flex w-full justify-end gap-2">
          <button onClick={onClose} className="btn-secondary text-sm">
            Cancel
          </button>
          <button
            onClick={() => valid && onSubmit(draft)}
            disabled={!valid || saving}
            className="btn-primary text-sm disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? "Posting..." : editing ? "Save changes" : "Post announcement"}
          </button>
        </div>
      }
    >
      <div className="space-y-5">
        <div>
          <label className="form-label">Title</label>
          <input
            autoFocus
            value={draft.title}
            onChange={(e) => setDraft({ ...draft, title: e.target.value })}
            placeholder="e.g. Office closed for the long weekend"
            maxLength={160}
            className={FIELD}
          />
        </div>

        <div>
          <label className="form-label">Content</label>
          <textarea
            value={draft.body}
            onChange={(e) => setDraft({ ...draft, body: e.target.value })}
            placeholder="Write the details of your announcement..."
            rows={6}
            maxLength={8000}
            className={`${FIELD} resize-y leading-relaxed`}
          />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="form-label">Category</label>
            <Select
              value={draft.category}
              onChange={(v) => setDraft({ ...draft, category: v })}
              options={CATEGORY_KEYS.map((k) => ({
                value: k,
                label: CATEGORIES[k].label,
              }))}
            />
          </div>
          <div>
            <label className="form-label">Audience</label>
            <Select
              value={draft.audience}
              onChange={(v) => setDraft({ ...draft, audience: v as "all" | "admins" })}
              options={[
                { value: "all", label: "Everyone" },
                { value: "admins", label: "HR / Admins only" },
              ]}
            />
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="form-label">
              Auto-expire{" "}
              <span className="font-normal text-gray-400">(optional)</span>
            </label>
            <DatePicker
              value={draft.expiresAt}
              onChange={(v) => setDraft({ ...draft, expiresAt: v })}
              placeholder="No expiry"
            />
          </div>
          <div>
            <label className="form-label">Visibility</label>
            <button
              type="button"
              onClick={() => setDraft({ ...draft, pinned: !draft.pinned })}
              className="flex w-full items-center justify-between rounded-xl bg-[var(--card-surface)] px-4 py-3 text-sm ring-1 ring-inset ring-gray-200/70 transition-shadow dark:ring-white/10"
            >
              <span className="font-medium text-gray-700 dark:text-gray-200">
                Pin to top
              </span>
              <span
                className={`relative h-6 w-10 flex-shrink-0 rounded-full transition-colors ${
                  draft.pinned ? "" : "bg-gray-200 dark:bg-gray-700"
                }`}
                style={draft.pinned ? { background: "var(--accent)" } : undefined}
              >
                <span
                  className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
                    draft.pinned ? "right-0.5" : "left-0.5"
                  }`}
                />
              </span>
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */
const AnnouncementsPage: React.FC = () => {
  const { user } = useAuth();
  const canManage = user?.role === "admin";
  const qc = useQueryClient();

  const [category, setCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Announcement | null>(null);
  const [confirmDel, setConfirmDel] = useState<Announcement | null>(null);

  // The input stays bound to `search` so typing is instant; only the query key
  // trails it. Keying directly off `search` fired one request per keystroke.
  const debouncedSearch = useDebouncedValue(search.trim(), 300);

  const { data, isLoading } = useQuery({
    queryKey: ["announcements", category, debouncedSearch],
    queryFn: async () => {
      const res = await announcementsAPI.getAnnouncements({
        category: category === "all" ? undefined : category,
        search: debouncedSearch || undefined,
      });
      return res.data as { announcements: Announcement[]; pagination: any };
    },
    staleTime: 30 * 1000,
    placeholderData: (prev) => prev,
  });

  const items = data?.announcements ?? [];

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["announcements"] });
    qc.invalidateQueries({ queryKey: ["dashboard-announcements"] });
  };

  const createMut = useMutation({
    mutationFn: (draft: DraftState) =>
      announcementsAPI.create({
        ...draft,
        expiresAt: draft.expiresAt || null,
      }),
    onSuccess: () => {
      showSuccessToast("Announcement posted");
      setModalOpen(false);
      invalidate();
    },
    onError: (e: any) =>
      showErrorToast(e?.response?.data?.message || "Could not post announcement"),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, draft }: { id: string; draft: DraftState }) =>
      announcementsAPI.update(id, { ...draft, expiresAt: draft.expiresAt || null }),
    onSuccess: () => {
      showSuccessToast("Announcement updated");
      setModalOpen(false);
      setEditing(null);
      invalidate();
    },
    onError: (e: any) =>
      showErrorToast(e?.response?.data?.message || "Could not update announcement"),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => announcementsAPI.remove(id),
    onSuccess: () => {
      showSuccessToast("Announcement deleted");
      invalidate();
    },
    onError: () => showErrorToast("Could not delete announcement"),
  });

  const pinMut = useMutation({
    mutationFn: ({ id, pinned }: { id: string; pinned: boolean }) =>
      announcementsAPI.update(id, { pinned }),
    onSuccess: invalidate,
  });

  const reactMut = useMutation({
    mutationFn: ({ id, emoji }: { id: string; emoji: string }) =>
      announcementsAPI.react(id, emoji),
    onSuccess: invalidate,
  });

  const readMut = useMutation({
    mutationFn: (id: string) => announcementsAPI.markRead(id),
    onSuccess: invalidate,
  });

  const stats = useMemo(() => {
    const total = items.length;
    const pinned = items.filter((a) => a.pinned).length;
    const unread = items.filter((a) => !a.hasRead).length;
    return { total, pinned, unread };
  }, [items]);

  const openCreate = () => {
    setEditing(null);
    setModalOpen(true);
  };
  const openEdit = (a: Announcement) => {
    setEditing(a);
    setModalOpen(true);
  };

  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      className="space-y-6"
    >
      {/* Header */}
      <motion.div
        variants={staggerItem}
        className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl dark:text-white">
            <MegaphoneIcon className="h-7 w-7 text-blue-600 dark:text-blue-400" />
            Announcements
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {canManage
              ? "Post company news, events and updates to your whole team."
              : "News, events and updates from your HR team."}
          </p>
        </div>
        {canManage && (
          <motion.button
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.97 }}
            onClick={openCreate}
            className="btn-primary inline-flex items-center gap-2 self-start"
          >
            <PlusIcon className="h-5 w-5" />
            New Announcement
          </motion.button>
        )}
      </motion.div>

      {/* Stat chips */}
      <motion.div variants={staggerItem} className="flex flex-wrap gap-3">
        {[
          { label: "Total notices", value: stats.total },
          { label: "Pinned", value: stats.pinned },
          { label: "Unread", value: stats.unread },
        ].map((s) => (
          <div
            key={s.label}
            className="flex items-center gap-2 rounded-xl border border-gray-200/70 bg-white px-4 py-2.5 dark:border-gray-700/50 dark:bg-gray-800/60"
          >
            <span className="text-xl font-bold tabular-nums text-gray-900 dark:text-white">
              {s.value}
            </span>
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
              {s.label}
            </span>
          </div>
        ))}
      </motion.div>

      {/* Filters */}
      <motion.div
        variants={staggerItem}
        className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="flex gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {["all", ...CATEGORY_KEYS].map((c) => {
            const active = category === c;
            const FilterIcon = c === "all" ? null : CATEGORIES[c].icon;
            return (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                  active
                    ? "text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700/60 dark:text-gray-300 dark:hover:bg-gray-700"
                }`}
                style={active ? { background: "var(--accent)" } : undefined}
              >
                {FilterIcon && <FilterIcon className="h-3.5 w-3.5" />}
                {c === "all" ? "All" : CATEGORIES[c].label}
              </button>
            );
          })}
        </div>
        <div className="relative sm:w-64">
          <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search announcements"
            className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
          />
        </div>
      </motion.div>

      {/* Feed */}
      {isLoading ? (
        <LogoLoader label="Loading announcements..." minHClass="min-h-[420px]" />
      ) : items.length === 0 ? (
        <motion.div
          variants={staggerItem}
          className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 py-16 text-center dark:border-gray-700"
        >
          <div className="mb-4 grid h-16 w-16 place-items-center rounded-2xl text-gray-400 dark:text-gray-500">
            <MegaphoneIcon className="h-8 w-8" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {search || category !== "all"
              ? "No matching announcements"
              : "No announcements yet"}
          </h3>
          <p className="mt-1 max-w-sm text-sm text-gray-500 dark:text-gray-400">
            {canManage
              ? "Post your first notice to keep everyone in the loop."
              : "Check back soon - your HR team hasn't posted anything yet."}
          </p>
          {canManage && !search && category === "all" && (
            <button onClick={openCreate} className="btn-primary mt-5 inline-flex items-center gap-2">
              <PlusIcon className="h-5 w-5" />
              New Announcement
            </button>
          )}
        </motion.div>
      ) : (
        <motion.div variants={staggerContainer} className="grid gap-4 lg:grid-cols-2">
          <AnimatePresence mode="popLayout">
            {items.map((a) => (
              <AnnouncementCard
                key={a._id}
                a={a}
                canManage={canManage}
                onRead={() => readMut.mutate(a._id)}
                onReact={(emoji) => reactMut.mutate({ id: a._id, emoji })}
                onEdit={() => openEdit(a)}
                onPin={() => pinMut.mutate({ id: a._id, pinned: !a.pinned })}
                onDelete={() => setConfirmDel(a)}
              />
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Modals */}
      <AnnouncementModal
        open={modalOpen}
        editing={editing}
        onClose={() => {
          setModalOpen(false);
          setEditing(null);
        }}
        saving={createMut.isPending || updateMut.isPending}
        onSubmit={(draft) =>
          editing
            ? updateMut.mutate({ id: editing._id, draft })
            : createMut.mutate(draft)
        }
      />

      <ConfirmDialog
        open={!!confirmDel}
        onClose={() => setConfirmDel(null)}
        onConfirm={() => {
          if (confirmDel) deleteMut.mutate(confirmDel._id);
          setConfirmDel(null);
        }}
        loading={deleteMut.isPending}
        variant="danger"
        title={`Delete “${confirmDel?.title}”?`}
        description="This announcement will be permanently removed for everyone."
        consequences={["This action cannot be undone."]}
        confirmLabel="Delete announcement"
      />
    </motion.div>
  );
};

export default AnnouncementsPage;
