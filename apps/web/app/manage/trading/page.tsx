"use client";

import { Children, useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type Account = { id: string; name: string; broker: "wealthsimple" | "ibkr"; accountType: "non_registered"; currency: string; initialFund: string; _count: { positions: number } };
type Instrument = { id: string; symbol: string; name: string; instrumentType: "stock" | "etf"; currency: string; isActive: boolean; _count: { positions: number } };
type AccountForm = Pick<Account, "name" | "broker" | "accountType" | "currency" | "initialFund">;
type InstrumentForm = Pick<Instrument, "symbol" | "name" | "instrumentType" | "currency" | "isActive">;

const emptyAccount: AccountForm = { name: "", broker: "wealthsimple", accountType: "non_registered", currency: "CAD", initialFund: "" };
const emptyInstrument: InstrumentForm = { symbol: "", name: "", instrumentType: "etf", currency: "CAD", isActive: true };

async function readApiResponse<T>(response: Response): Promise<T & { error?: string }> {
  const body = await response.text();
  if (!body.trim()) {
    return { error: `The server returned an empty response (${response.status}).` } as T & { error?: string };
  }

  try {
    return JSON.parse(body) as T & { error?: string };
  } catch {
    return { error: `The server returned an invalid response (${response.status}).` } as T & { error?: string };
  }
}

export default function TradingManagementPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [instruments, setInstruments] = useState<Instrument[]>([]);
  const [accountForm, setAccountForm] = useState(emptyAccount);
  const [instrumentForm, setInstrumentForm] = useState(emptyInstrument);
  const [editingAccountId, setEditingAccountId] = useState<string | null>(null);
  const [editingInstrumentId, setEditingInstrumentId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<"account" | "instrument" | null>(null);
  const [message, setMessage] = useState<{ text: string; error: boolean } | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/manage/trading", { cache: "no-store" });
      const data = await readApiResponse<{ accounts?: Account[]; instruments?: Instrument[] }>(response);
      if (!response.ok) throw new Error(data.error ?? "Unable to load trading data.");
      setAccounts(data.accounts ?? []);
      setInstruments(data.instruments ?? []);
    } catch (error) {
      setMessage({ text: error instanceof Error ? error.message : "Unable to load trading data.", error: true });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => { void loadData(); }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const save = async (resource: "account" | "instrument") => {
    setSaving(resource);
    setMessage(null);
    const id = resource === "account" ? editingAccountId : editingInstrumentId;
    const data = resource === "account" ? accountForm : instrumentForm;
    try {
      const response = await fetch("/api/manage/trading", {
        method: id ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resource, id: id ?? undefined, data }),
      });
      const result = await readApiResponse<Record<string, never>>(response);
      if (!response.ok) throw new Error(result.error ?? "Unable to save record.");
      setMessage({ text: `${resource === "account" ? "Account" : "Instrument"} ${id ? "updated" : "created"}.`, error: false });
      if (resource === "account") { setAccountForm(emptyAccount); setEditingAccountId(null); } else { setInstrumentForm(emptyInstrument); setEditingInstrumentId(null); }
      await loadData();
    } catch (error) {
      setMessage({ text: error instanceof Error ? error.message : "Unable to save record.", error: true });
    } finally {
      setSaving(null);
    }
  };

  return (
    <main className="min-h-[calc(100vh-7.5rem)] p-4 md:p-8">
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <header className="rise-in border-b border-black/10 pb-6">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-black/50">Trading</p>
          <h1 className="mt-3 font-(--font-fashion-display) text-4xl text-black">Manage accounts and instruments</h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-black/60">Maintain the accounts and stock or ETF definitions used by the holdings view.</p>
        </header>

        {message ? <p role={message.error ? "alert" : "status"} className={`rounded-xl border px-4 py-3 text-sm ${message.error ? "border-red-300 bg-red-50 text-red-800" : "border-emerald-300 bg-emerald-50 text-emerald-800"}`}>{message.text}</p> : null}

        <div className="grid gap-6 lg:grid-cols-2">
          <EditorCard title={editingAccountId ? "Edit trading account" : "Add trading account"} description="Accounts use one currency for all of their holdings.">
            <form className="space-y-4" onSubmit={(event) => { event.preventDefault(); void save("account"); }}>
              <Field label="Account name"><Input required value={accountForm.name} onChange={(event) => setAccountForm({ ...accountForm, name: event.target.value })} placeholder="Long-term Wealthsimple" /></Field>
              <div className="grid gap-4 sm:grid-cols-2"><Field label="Broker"><select className="form-select" value={accountForm.broker} onChange={(event) => setAccountForm({ ...accountForm, broker: event.target.value as Account["broker"] })}><option value="wealthsimple">Wealthsimple</option><option value="ibkr">IBKR</option></select></Field><Field label="Account type"><select className="form-select" value={accountForm.accountType} disabled><option value="non_registered">Non-registered</option></select></Field></div>
              <div className="grid gap-4 sm:grid-cols-2"><Field label="Currency"><Input required maxLength={3} value={accountForm.currency} onChange={(event) => setAccountForm({ ...accountForm, currency: event.target.value.toUpperCase() })} /></Field><Field label="Initial fund"><Input required type="number" min="0" step="0.00000001" value={accountForm.initialFund} onChange={(event) => setAccountForm({ ...accountForm, initialFund: event.target.value })} placeholder="10000.00" /></Field></div>
              <EditorActions editing={Boolean(editingAccountId)} saving={saving === "account"} onCancel={() => { setEditingAccountId(null); setAccountForm(emptyAccount); }} />
            </form>
          </EditorCard>

          <EditorCard title={editingInstrumentId ? "Edit instrument" : "Add instrument"} description="Currencies must match the account that holds the instrument.">
            <form className="space-y-4" onSubmit={(event) => { event.preventDefault(); void save("instrument"); }}>
              <div className="grid gap-4 sm:grid-cols-2"><Field label="Symbol"><Input required value={instrumentForm.symbol} onChange={(event) => setInstrumentForm({ ...instrumentForm, symbol: event.target.value.toUpperCase() })} placeholder="TSX" /></Field><Field label="Instrument type"><select className="form-select" value={instrumentForm.instrumentType} onChange={(event) => setInstrumentForm({ ...instrumentForm, instrumentType: event.target.value as Instrument["instrumentType"] })}><option value="etf">ETF</option><option value="stock">Stock</option></select></Field></div>
              <Field label="Instrument name"><Input required value={instrumentForm.name} onChange={(event) => setInstrumentForm({ ...instrumentForm, name: event.target.value })} placeholder="Example leveraged ETF" /></Field>
              <div className="grid gap-4 sm:grid-cols-2"><Field label="Currency"><Input required maxLength={3} value={instrumentForm.currency} onChange={(event) => setInstrumentForm({ ...instrumentForm, currency: event.target.value.toUpperCase() })} /></Field><Field label="Status"><select className="form-select" value={instrumentForm.isActive ? "active" : "inactive"} onChange={(event) => setInstrumentForm({ ...instrumentForm, isActive: event.target.value === "active" })}><option value="active">Active</option><option value="inactive">Inactive</option></select></Field></div>
              <EditorActions editing={Boolean(editingInstrumentId)} saving={saving === "instrument"} onCancel={() => { setEditingInstrumentId(null); setInstrumentForm(emptyInstrument); }} />
            </form>
          </EditorCard>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <RecordCard title="Trading accounts" empty="No trading accounts yet." loading={loading}>
            {accounts.map((account) => <div key={account.id} className="flex items-center justify-between gap-3 border-t border-black/10 py-3"><div><Link href={`/trading/accounts/${account.id}`} className="font-medium hover:underline">{account.name}</Link><p className="text-xs text-black/55">{account.broker === "ibkr" ? "IBKR" : "Wealthsimple"} · {account.currency} · {account._count.positions} position{account._count.positions === 1 ? "" : "s"}</p></div><Button type="button" variant="secondary" size="sm" onClick={() => { setEditingAccountId(account.id); setAccountForm({ name: account.name, broker: account.broker, accountType: account.accountType, currency: account.currency, initialFund: account.initialFund }); }}>Edit</Button></div>)}
          </RecordCard>
          <RecordCard title="Trading instruments" empty="No trading instruments yet." loading={loading}>
            {instruments.map((instrument) => <div key={instrument.id} className="flex items-center justify-between gap-3 border-t border-black/10 py-3"><div><div className="flex items-center gap-2"><p className="font-medium">{instrument.symbol}</p><Badge variant={instrument.isActive ? "accent" : "default"}>{instrument.isActive ? "Active" : "Inactive"}</Badge></div><p className="text-xs text-black/55">{instrument.name} · {instrument.currency} · {instrument._count.positions} position{instrument._count.positions === 1 ? "" : "s"}</p></div><Button type="button" variant="secondary" size="sm" onClick={() => { setEditingInstrumentId(instrument.id); setInstrumentForm({ symbol: instrument.symbol, name: instrument.name, instrumentType: instrument.instrumentType, currency: instrument.currency, isActive: instrument.isActive }); }}>Edit</Button></div>)}
          </RecordCard>
        </div>
      </div>
    </main>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) { return <label className="block space-y-2 text-sm font-medium">{label}{children}</label>; }
function EditorCard({ title, description, children }: { title: string; description: string; children: ReactNode }) { return <Card className="bg-white/78"><CardHeader className="border-b border-black/10"><CardTitle className="font-(--font-fashion-display)">{title}</CardTitle><CardDescription>{description}</CardDescription></CardHeader><CardContent className="p-4 md:p-6">{children}</CardContent></Card>; }
function EditorActions({ editing, saving, onCancel }: { editing: boolean; saving: boolean; onCancel: () => void }) { return <div className="flex gap-2 pt-2"><Button type="submit" disabled={saving}>{saving ? "Saving..." : editing ? "Save changes" : "Add"}</Button>{editing ? <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button> : null}</div>; }
function RecordCard({ title, empty, loading, children }: { title: string; empty: string; loading: boolean; children: ReactNode }) { return <Card className="bg-white/78"><CardHeader><CardTitle className="text-base">{title}</CardTitle></CardHeader><CardContent className="pt-0">{loading ? <p className="text-sm text-black/55">Loading...</p> : Children.count(children) === 0 ? <p className="text-sm text-black/55">{empty}</p> : <div>{children}</div>}</CardContent></Card>; }
