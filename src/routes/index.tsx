import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Search,
  X,
  Phone,
  Briefcase,
  Pencil,
  Trash2,
  Users,
  Flame,
  Sun,
  Snowflake,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "KháchHàng — Sổ quản lý khách hàng" },
      {
        name: "description",
        content:
          "Ứng dụng quản lý thông tin khách hàng: tên, số điện thoại, nghề nghiệp và phân loại theo mức độ quan tâm Lạnh - Ấm - Nóng.",
      },
      { property: "og:title", content: "KháchHàng — Sổ quản lý khách hàng" },
      {
        property: "og:description",
        content:
          "Quản lý thông tin khách hàng và phân loại tiềm năng Lạnh - Ấm - Nóng.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: KhachHangApp,
});

// ---------- Types ----------
type Level = "lanh" | "am" | "nong";

interface Customer {
  id: string;
  name: string;
  phone: string;
  occupation: string;
  level: Level;
  createdAt: number;
}

// ---------- Constants ----------
const STORAGE_KEY = "khachhang.customers.v1";

const LEVEL_META: Record<
  Level,
  {
    label: string;
    tagline: string;
    dot: string;
    text: string;
    chipBg: string;
    chipText: string;
    avatarBg: string;
    avatarText: string;
    sectionShadow: string;
    icon: typeof Flame;
  }
> = {
  nong: {
    label: "Nóng",
    tagline: "Sẵn sàng chốt",
    dot: "bg-hot",
    text: "text-hot",
    chipBg: "bg-hot/15",
    chipText: "text-hot",
    avatarBg: "bg-hot/15",
    avatarText: "text-hot",
    sectionShadow: "shadow-[0_24px_60px_-34px_rgba(239,68,68,0.5)]",
    icon: Flame,
  },
  am: {
    label: "Ấm",
    tagline: "Đang quan tâm",
    dot: "bg-warm",
    text: "text-warm",
    chipBg: "bg-warm/15",
    chipText: "text-warm",
    avatarBg: "bg-warm/15",
    avatarText: "text-warm",
    sectionShadow: "shadow-[0_24px_60px_-34px_rgba(245,158,11,0.5)]",
    icon: Sun,
  },
  lanh: {
    label: "Lạnh",
    tagline: "Cần nuôi dưỡng",
    dot: "bg-cold",
    text: "text-cold",
    chipBg: "bg-cold/15",
    chipText: "text-cold",
    avatarBg: "bg-cold/15",
    avatarText: "text-cold",
    sectionShadow: "shadow-[0_24px_60px_-34px_rgba(100,116,139,0.5)]",
    icon: Snowflake,
  },
};

const LEVEL_ORDER: Level[] = ["nong", "am", "lanh"];

const SEED: Customer[] = [
  {
    id: "seed-1",
    name: "Trần Hải Yến",
    phone: "0902 118 456",
    occupation: "Kiến trúc sư",
    level: "nong",
    createdAt: Date.now() - 50000,
  },
  {
    id: "seed-2",
    name: "Đặng Minh Tuấn",
    phone: "0913 772 901",
    occupation: "Chủ doanh nghiệp",
    level: "nong",
    createdAt: Date.now() - 40000,
  },
  {
    id: "seed-3",
    name: "Lê Ngọc Anh",
    phone: "0934 556 210",
    occupation: "Designer",
    level: "am",
    createdAt: Date.now() - 30000,
  },
  {
    id: "seed-4",
    name: "Phạm Văn Hùng",
    phone: "0987 334 120",
    occupation: "Kế toán trưởng",
    level: "am",
    createdAt: Date.now() - 20000,
  },
  {
    id: "seed-5",
    name: "Ngô Thanh Thảo",
    phone: "0918 220 674",
    occupation: "Giáo viên",
    level: "lanh",
    createdAt: Date.now() - 10000,
  },
  {
    id: "seed-6",
    name: "Hoàng Duy Trí",
    phone: "0976 445 883",
    occupation: "Nhân viên bán hàng",
    level: "lanh",
    createdAt: Date.now() - 5000,
  },
];

// ---------- Helpers ----------
function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return (parts[0] ?? "").slice(0, 2).toUpperCase();
  const first = parts[0] ?? "";
  const last = parts.at(-1) ?? "";
  return (first[0] ?? "") + (last[0] ?? "") || "?";
}

function loadCustomers(): Customer[] {
  if (typeof window === "undefined") return SEED;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return SEED;
    const parsed = JSON.parse(raw) as Customer[];
    if (!Array.isArray(parsed)) return SEED;
    return parsed;
  } catch {
    return SEED;
  }
}

function saveCustomers(customers: Customer[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(customers));
  } catch {
    // ignore
  }
}

function normalizePhone(value: string): string {
  return value.replace(/[^\d\s+]/g, "").trim();
}

// ---------- Component ----------
function KhachHangApp() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | Level>("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // form state
  const [formName, setFormName] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formOccupation, setFormOccupation] = useState("");
  const [formLevel, setFormLevel] = useState<Level>("am");
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    setCustomers(loadCustomers());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) saveCustomers(customers);
  }, [customers, hydrated]);

  // counts
  const counts = useMemo(() => {
    const c = { all: customers.length, nong: 0, am: 0, lanh: 0 };
    for (const cu of customers) c[cu.level] += 1;
    return c;
  }, [customers]);

  // filtered list
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return customers.filter((cu) => {
      if (filter !== "all" && cu.level !== filter) return false;
      if (!q) return true;
      return (
        cu.name.toLowerCase().includes(q) ||
        cu.phone.toLowerCase().includes(q) ||
        cu.occupation.toLowerCase().includes(q)
      );
    });
  }, [customers, query, filter]);

  // grouped
  const grouped = useMemo(() => {
    const map: Record<Level, Customer[]> = { nong: [], am: [], lanh: [] };
    for (const cu of filtered) map[cu.level].push(cu);
    return map;
  }, [filtered]);

  function openAdd() {
    setEditing(null);
    setFormName("");
    setFormPhone("");
    setFormOccupation("");
    setFormLevel("am");
    setFormError(null);
    setModalOpen(true);
  }

  function openEdit(cu: Customer) {
    setEditing(cu);
    setFormName(cu.name);
    setFormPhone(cu.phone);
    setFormOccupation(cu.occupation);
    setFormLevel(cu.level);
    setFormError(null);
    setModalOpen(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const name = formName.trim();
    const phone = normalizePhone(formPhone);
    const occupation = formOccupation.trim();
    if (!name) {
      setFormError("Vui lòng nhập tên khách hàng.");
      return;
    }
    if (!phone) {
      setFormError("Vui lòng nhập số điện thoại.");
      return;
    }
    if (editing) {
      setCustomers((prev) =>
        prev.map((cu) =>
          cu.id === editing.id
            ? { ...cu, name, phone, occupation, level: formLevel }
            : cu,
        ),
      );
    } else {
      const newCu: Customer = {
        id: `c-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        name,
        phone,
        occupation,
        level: formLevel,
        createdAt: Date.now(),
      };
      setCustomers((prev) => [newCu, ...prev]);
    }
    setModalOpen(false);
    setConfirmDeleteId(null);
  }

  function handleDelete(id: string) {
    setCustomers((prev) => prev.filter((cu) => cu.id !== id));
    setConfirmDeleteId(null);
    if (editing?.id === id) setModalOpen(false);
  }

  return (
    <div className="app-gradient min-h-screen font-body text-ink antialiased">
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-10">
        {/* Header */}
        <header className="relative rounded-3xl border border-white/60 bg-white/40 p-5 shadow-[0_20px_60px_-30px_rgba(79,124,255,0.6)] backdrop-blur-xl sm:p-7">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/90 to-transparent" />
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="grid size-11 place-items-center rounded-2xl bg-gradient-to-br from-brand to-indigo-500 font-display text-lg font-bold text-white shadow-lg shadow-brand/30">
                K
              </div>
              <div>
                <h1 className="font-display text-xl font-bold leading-none tracking-tight">
                  KháchHàng
                </h1>
                <p className="mt-1 text-xs text-cold">
                  Sổ quản lý khách hàng
                </p>
              </div>
            </div>
            <button
              onClick={openAdd}
              className="inline-flex items-center gap-1.5 rounded-full bg-brand px-4 py-2.5 text-sm font-semibold text-brand-foreground shadow-lg shadow-brand/30 transition-transform active:scale-95"
            >
              <Plus className="size-4" />
              Thêm mới
            </button>
          </div>

          {/* Search */}
          <div className="mt-5 flex items-center gap-2.5 rounded-2xl border border-white/60 bg-white/50 px-3.5 py-2.5 text-cold backdrop-blur-md">
            <Search className="size-4 shrink-0 text-cold/70" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Tìm theo tên, số điện thoại, nghề nghiệp…"
              className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-cold/60"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                aria-label="Xóa tìm kiếm"
                className="grid size-5 shrink-0 place-items-center rounded-full text-cold/70 hover:bg-cold/10 hover:text-ink"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>

          {/* Stats */}
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard label="Tổng khách" value={counts.all} icon={Users} />
            <StatCard
              label="Lạnh"
              value={counts.lanh}
              tone="cold"
              icon={Snowflake}
            />
            <StatCard
              label="Ấm"
              value={counts.am}
              tone="warm"
              icon={Sun}
            />
            <StatCard
              label="Nóng"
              value={counts.nong}
              tone="hot"
              icon={Flame}
            />
          </div>
        </header>

        {/* Filters */}
        <div className="mt-5 flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-cold">
            Phân loại
          </span>
          <FilterChip
            active={filter === "all"}
            onClick={() => setFilter("all")}
            label="Tất cả"
            count={counts.all}
          />
          {LEVEL_ORDER.map((lvl) => (
            <FilterChip
              key={lvl}
              active={filter === lvl}
              onClick={() => setFilter(lvl)}
              label={LEVEL_META[lvl].label}
              count={counts[lvl]}
              tone={lvl}
            />
          ))}
        </div>

        {/* List */}
        <section className="mt-4 space-y-3">
          {filtered.length === 0 && (
            <EmptyState hasCustomers={customers.length > 0} />
          )}

          {(filter === "all" ? LEVEL_ORDER : [filter]).map((lvl) => {
            const items = grouped[lvl];
            if (items.length === 0) return null;
            const meta = LEVEL_META[lvl];
            const Icon = meta.icon;
            return (
              <div
                key={lvl}
                className={`relative rounded-3xl border border-white/60 bg-white/40 p-4 backdrop-blur-xl sm:p-5 ${meta.sectionShadow}`}
              >
                <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/90 to-transparent" />
                <div className="mb-3 flex items-center gap-2">
                  <Icon className={`size-3.5 ${meta.text}`} />
                  <span
                    className={`text-xs font-semibold uppercase tracking-wider ${meta.text}`}
                  >
                    {meta.label} · {meta.tagline}
                  </span>
                  <span className="ml-auto rounded-full bg-white/60 px-2 py-0.5 text-[10px] font-semibold text-cold">
                    {items.length}
                  </span>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {items.map((cu) => (
                    <CustomerCard
                      key={cu.id}
                      customer={cu}
                      onEdit={() => openEdit(cu)}
                      onAskDelete={() => setConfirmDeleteId(cu.id)}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </section>

        <p className="mt-6 text-center text-xs text-cold">
          Dữ liệu lưu trên thiết bị của bạn · {customers.length} khách hàng
        </p>
      </div>

      {/* Floating add button (mobile) */}
      <button
        onClick={openAdd}
        aria-label="Thêm khách hàng"
        className="fixed bottom-6 right-5 z-30 grid size-14 place-items-center rounded-full bg-brand text-brand-foreground shadow-xl shadow-brand/40 transition-transform active:scale-95 sm:hidden"
      >
        <Plus className="size-6" />
      </button>

      {/* Add / Edit modal */}
      {modalOpen && (
        <CustomerModal
          editing={editing}
          formName={formName}
          formPhone={formPhone}
          formOccupation={formOccupation}
          formLevel={formLevel}
          formError={formError}
          setName={setFormName}
          setPhone={(v) => setFormPhone(normalizePhone(v))}
          setOccupation={setFormOccupation}
          setLevel={setFormLevel}
          onClose={() => setModalOpen(false)}
          onSubmit={handleSubmit}
          onDelete={
            editing ? () => setConfirmDeleteId(editing.id) : undefined
          }
        />
      )}

      {/* Delete confirmation */}
      {confirmDeleteId && (
        <ConfirmDialog
          title="Xóa khách hàng?"
          message="Hành động này không thể hoàn tác. Khách hàng sẽ bị xóa vĩnh viễn."
          confirmLabel="Xóa"
          onConfirm={() => handleDelete(confirmDeleteId)}
          onCancel={() => setConfirmDeleteId(null)}
        />
      )}
    </div>
  );
}

// ---------- Sub-components ----------
function StatCard({
  label,
  value,
  tone,
  icon: Icon,
}: {
  label: string;
  value: number;
  tone?: "cold" | "warm" | "hot";
  icon: typeof Users;
}) {
  const toneClass =
    tone === "cold"
      ? "text-cold"
      : tone === "warm"
        ? "text-warm"
        : tone === "hot"
          ? "text-hot"
          : "text-ink";
  return (
    <div className="rounded-2xl border border-white/60 bg-white/45 p-4 backdrop-blur-md">
      <div className="flex items-center justify-between">
        <p className="text-xs text-cold">{label}</p>
        <Icon className={`size-3.5 ${tone === "hot" ? "text-hot" : tone === "warm" ? "text-warm" : tone === "cold" ? "text-cold" : "text-cold/50"}`} />
      </div>
      <p className={`mt-1 font-display text-2xl font-bold ${toneClass}`}>
        {value}
      </p>
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  label,
  count,
  tone,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
  tone?: Level;
}) {
  const toneText =
    tone === "nong"
      ? "text-hot"
      : tone === "am"
        ? "text-warm"
        : tone === "lanh"
          ? "text-cold"
          : "text-brand";
  const activeBg =
    tone === "nong"
      ? "border-hot/30 bg-hot/15"
      : tone === "am"
        ? "border-warm/30 bg-warm/15"
        : tone === "lanh"
          ? "border-cold/30 bg-cold/15"
          : "border-brand/30 bg-brand/15";
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
        active
          ? `${activeBg} ${toneText}`
          : "border-white/60 bg-white/40 text-cold hover:bg-white/60"
      }`}
    >
      {label}
      <span className="rounded-full bg-black/5 px-1.5 text-[10px] font-bold text-cold/80">
        {count}
      </span>
    </button>
  );
}

function CustomerCard({
  customer,
  onEdit,
  onAskDelete,
}: {
  customer: Customer;
  onEdit: () => void;
  onAskDelete: () => void;
}) {
  const meta = LEVEL_META[customer.level];
  return (
    <div className="group rounded-2xl border border-white/60 bg-white/50 p-4 backdrop-blur-md transition-shadow hover:shadow-lg hover:shadow-brand/5">
      <div className="flex items-center gap-3">
        <div
          className={`grid size-11 shrink-0 place-items-center rounded-xl ${meta.avatarBg} font-display font-bold ${meta.avatarText}`}
        >
          {initials(customer.name)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-display font-semibold">{customer.name}</p>
          <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-cold">
            <Phone className="size-3 shrink-0" />
            {customer.phone || "—"}
          </p>
        </div>
        <span
          className={`shrink-0 rounded-full ${meta.chipBg} px-2 py-0.5 text-[10px] font-semibold ${meta.chipText}`}
        >
          {meta.label}
        </span>
      </div>
      <div className="mt-3 flex items-center justify-between">
        <span className="flex items-center gap-1 truncate text-xs text-cold">
          <Briefcase className="size-3 shrink-0" />
          {customer.occupation || "Chưa rõ nghề nghiệp"}
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={onEdit}
            aria-label="Chỉnh sửa"
            className="grid size-7 place-items-center rounded-lg text-cold transition-colors hover:bg-brand/10 hover:text-brand"
          >
            <Pencil className="size-3.5" />
          </button>
          <button
            onClick={onAskDelete}
            aria-label="Xóa"
            className="grid size-7 place-items-center rounded-lg text-cold transition-colors hover:bg-hot/10 hover:text-hot"
          >
            <Trash2 className="size-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ hasCustomers }: { hasCustomers: boolean }) {
  return (
    <div className="rounded-3xl border border-white/60 bg-white/40 p-10 text-center backdrop-blur-xl">
      <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-brand/10 text-brand">
        <Users className="size-7" />
      </div>
      <p className="mt-4 font-display text-base font-semibold">
        {hasCustomers ? "Không tìm thấy khách hàng" : "Chưa có khách hàng nào"}
      </p>
      <p className="mt-1 text-sm text-cold">
        {hasCustomers
          ? "Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc."
          : "Bắt đầu bằng cách thêm khách hàng đầu tiên của bạn."}
      </p>
    </div>
  );
}

function CustomerModal({
  editing,
  formName,
  formPhone,
  formOccupation,
  formLevel,
  formError,
  setName,
  setPhone,
  setOccupation,
  setLevel,
  onClose,
  onSubmit,
  onDelete,
}: {
  editing: Customer | null;
  formName: string;
  formPhone: string;
  formOccupation: string;
  formLevel: Level;
  formError: string | null;
  setName: (v: string) => void;
  setPhone: (v: string) => void;
  setOccupation: (v: string) => void;
  setLevel: (v: Level) => void;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  onDelete?: () => void;
}) {
  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center sm:items-center">
      <div
        className="absolute inset-0 bg-ink/25 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div className="relative w-full max-w-md rounded-t-[24px] border border-white/60 bg-white/80 p-5 shadow-2xl backdrop-blur-2xl sm:rounded-[24px] sm:p-6">
        <div className="mx-auto mb-4 size-1 rounded-full bg-ink/20 sm:hidden" />
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-bold tracking-tight">
            {editing ? "Chỉnh sửa khách hàng" : "Thêm khách hàng"}
          </h2>
          <button
            onClick={onClose}
            aria-label="Đóng"
            className="grid size-8 place-items-center rounded-full text-cold transition-colors hover:bg-ink/5 hover:text-ink"
          >
            <X className="size-4" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="mt-4 space-y-4">
          <Field label="Tên khách hàng">
            <input
              type="text"
              value={formName}
              onChange={(e) => setName(e.target.value)}
              placeholder="Họ và tên"
              autoFocus
              className="w-full rounded-xl border border-white/60 bg-white/70 px-3 py-2.5 text-sm outline-none transition-shadow focus:ring-2 focus:ring-brand/40"
            />
          </Field>
          <Field label="Số điện thoại">
            <input
              type="tel"
              inputMode="tel"
              value={formPhone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="09xx xxx xxx"
              className="w-full rounded-xl border border-white/60 bg-white/70 px-3 py-2.5 text-sm outline-none transition-shadow focus:ring-2 focus:ring-brand/40"
            />
          </Field>
          <Field label="Nghề nghiệp">
            <input
              type="text"
              value={formOccupation}
              onChange={(e) => setOccupation(e.target.value)}
              placeholder="Ví dụ: Kế toán, Designer..."
              className="w-full rounded-xl border border-white/60 bg-white/70 px-3 py-2.5 text-sm outline-none transition-shadow focus:ring-2 focus:ring-brand/40"
            />
          </Field>
          <Field label="Mức độ quan tâm">
            <div className="grid grid-cols-3 gap-2">
              {LEVEL_ORDER.map((lvl) => {
                const meta = LEVEL_META[lvl];
                const selected = formLevel === lvl;
                return (
                  <button
                    type="button"
                    key={lvl}
                    onClick={() => setLevel(lvl)}
                    className={`rounded-xl py-2.5 text-sm font-semibold ring-1 transition-colors ${
                      selected
                        ? `${meta.chipBg} ${meta.chipText} ring-current/0`
                        : "bg-white/70 text-cold ring-white/60 hover:bg-white"
                    }`}
                    style={
                      selected
                        ? { boxShadow: `inset 0 0 0 1.5px currentColor` }
                        : undefined
                    }
                  >
                    {meta.label}
                  </button>
                );
              })}
            </div>
          </Field>

          {formError && (
            <p className="rounded-xl bg-hot/10 px-3 py-2 text-xs font-medium text-hot">
              {formError}
            </p>
          )}

          <div className="flex gap-2 pt-1">
            <button
              type="submit"
              className="flex-1 rounded-xl bg-brand py-3 text-sm font-semibold text-brand-foreground shadow-lg shadow-brand/30 transition-transform active:scale-[0.98]"
            >
              {editing ? "Lưu thay đổi" : "Lưu khách hàng"}
            </button>
            {editing && onDelete && (
              <button
                type="button"
                onClick={onDelete}
                className="rounded-xl bg-hot/10 px-4 py-3 text-sm font-semibold text-hot transition-colors hover:bg-hot/20"
              >
                <Trash2 className="size-4" />
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-cold">
        {label}
      </span>
      {children}
    </label>
  );
}

function ConfirmDialog({
  title,
  message,
  confirmLabel,
  onConfirm,
  onCancel,
}: {
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-ink/30 backdrop-blur-[2px]"
        onClick={onCancel}
      />
      <div className="relative w-full max-w-sm rounded-2xl border border-white/60 bg-white/90 p-5 text-center shadow-2xl backdrop-blur-2xl">
        <div className="mx-auto grid size-11 place-items-center rounded-full bg-hot/15 text-hot">
          <Trash2 className="size-5" />
        </div>
        <h3 className="mt-3 font-display text-base font-bold">{title}</h3>
        <p className="mt-1.5 text-sm text-cold">{message}</p>
        <div className="mt-5 flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 rounded-xl border border-white/60 bg-white/70 py-2.5 text-sm font-semibold text-cold transition-colors hover:bg-white"
          >
            Hủy
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 rounded-xl bg-hot py-2.5 text-sm font-semibold text-white shadow-lg shadow-hot/30 transition-transform active:scale-[0.98]"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
