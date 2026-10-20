"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { applyChange, ChangeError } from "@/core/changes";
import { toIcs } from "@/core/ics";
import { daysUntil } from "@/core/schedule";
import { whatsappText, whatsappUrl } from "@/core/share";
import type { Change, Plan } from "@/core/types";
import { useI18n } from "@/i18n";
import { deletePlan, getPlan, savePlan } from "@/store/local";
import { useHydrated, usePlan } from "@/store/plans";
import { Assistant } from "@/ui/assistant/Assistant";
import { localToday, postJson } from "@/ui/api";
import { takeNotice } from "@/ui/notice";
import { BudgetTab } from "./BudgetTab";
import { GuestsTab } from "./GuestsTab";
import { IdeasTab } from "./IdeasTab";
import { Overview } from "./Overview";
import { Tabs } from "./Tabs";
import { TimelineTab } from "./TimelineTab";
import { VendorsTab } from "./VendorsTab";
import styles from "./Dashboard.module.css";

/** Shared by every tab: apply a change (returns an error message) or replace the plan. */
export interface PlanActions {
  apply(change: Change): string | null;
  replace(plan: Plan): void;
  ask(message: string): void;
}

export function Dashboard({ id }: { id: string }) {
  const { t } = useI18n();
  const router = useRouter();
  const hydrated = useHydrated();
  const plan = usePlan(id);
  const [tab, setTab] = useState("overview");
  const [notice, setNotice] = useState<string | null>(null);
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [seed, setSeed] = useState<string | null>(null);
  const [redrafting, setRedrafting] = useState(false);

  useEffect(() => {
    // A one-time message handed over from the wizard.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNotice(takeNotice(id));
  }, [id]);

  if (!hydrated) return <p className="container">{t("common.loading")}</p>;
  if (!plan) {
    return (
      <div className={`container ${styles.missing}`}>
        <p>{t("plan.notFound")}</p>
        <Link href="/plan/new" className="btn btn-primary">
          {t("plans.create")}
        </Link>
      </div>
    );
  }

  const actions: PlanActions = {
    apply(change) {
      try {
        // Read the latest saved version so several approvals in a row build on each other.
        savePlan(applyChange(getPlan(plan.id) ?? plan, change));
        return null;
      } catch (error) {
        return error instanceof ChangeError ? error.message : t("error.generic");
      }
    },
    replace: (next) => savePlan(next),
    ask(message) {
      setSeed(message);
      setAssistantOpen(true);
    },
  };

  const days = daysUntil(plan.brief.date, localToday());
  const countdown =
    days > 1
      ? t("plan.countdown", { days })
      : days === 1
        ? t("plan.tomorrow")
        : days === 0
          ? t("plan.today")
          : t("plan.past");

  const shareText = whatsappText(plan, {
    budget: t("share.budget"),
    spent: t("share.spent"),
    next: t("share.next"),
    vendorsLeft: t("share.vendorsLeft"),
  });

  function downloadCalendar() {
    const url = URL.createObjectURL(new Blob([toIcs(plan!)], { type: "text/calendar" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `${plan!.brief.title.replace(/[^\p{L}\p{N}]+/gu, "-")}.ics`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function redraft() {
    setRedrafting(true);
    const res = await postJson<{ plan: Plan; notice?: string }>("/api/plan", {
      brief: plan!.brief,
      today: localToday(),
    });
    setRedrafting(false);
    if (!res.ok) return setNotice(res.error || t("error.generic"));
    // Keep the id and anything the person has added (guests).
    savePlan({ ...res.data.plan, id: plan!.id, guests: plan!.guests, createdAt: plan!.createdAt });
    setNotice(res.data.notice ?? null);
  }

  const lang = plan.brief.language;
  const tabs = [
    { id: "overview", label: t("tab.overview"), panel: <Overview plan={plan} /> },
    { id: "budget", label: t("tab.budget"), panel: <BudgetTab plan={plan} actions={actions} /> },
    {
      id: "timeline",
      label: t("tab.timeline"),
      panel: <TimelineTab plan={plan} actions={actions} />,
    },
    { id: "vendors", label: t("tab.vendors"), panel: <VendorsTab plan={plan} actions={actions} /> },
    { id: "guests", label: t("tab.guests"), panel: <GuestsTab plan={plan} actions={actions} /> },
    { id: "ideas", label: t("tab.ideas"), panel: <IdeasTab plan={plan} actions={actions} /> },
  ];

  return (
    <div className={`container ${styles.layout}`}>
      <div className={styles.main}>
        <header className={styles.head}>
          <p className={styles.countdown}>{countdown}</p>
          <h1 lang={lang}>{plan.brief.title}</h1>
          <p className={styles.meta}>
            {new Date(`${plan.brief.date}T00:00:00`).toLocaleDateString("en-IN", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}{" "}
            · {t("plan.guestsCity", { guests: plan.brief.guests, city: plan.brief.city })}
          </p>
          <div className={`${styles.actions} no-print`}>
            <a
              className="btn btn-secondary btn-small"
              href={whatsappUrl(shareText)}
              target="_blank"
              rel="noopener noreferrer"
            >
              {t("action.share")}
            </a>
            <button
              type="button"
              className="btn btn-secondary btn-small"
              onClick={downloadCalendar}
            >
              {t("action.calendar")}
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-small"
              onClick={() => window.print()}
            >
              {t("action.print")}
            </button>
            <button
              type="button"
              className="btn btn-ghost btn-small"
              onClick={() => {
                if (window.confirm(t("action.deleteConfirm"))) {
                  deletePlan(plan.id);
                  router.push("/plans");
                }
              }}
            >
              {t("action.delete")}
            </button>
          </div>
        </header>

        {notice && (
          <div className={`notice ${styles.notice}`} role="status">
            <p>{notice}</p>
            <button
              type="button"
              className="btn btn-secondary btn-small"
              onClick={redraft}
              disabled={redrafting}
            >
              {redrafting ? t("plan.redrafting") : t("plan.redraft")}
            </button>
          </div>
        )}

        <Tabs tabs={tabs} active={tab} onChange={setTab} label={plan.brief.title} />
      </div>

      <Assistant
        plan={plan}
        actions={actions}
        open={assistantOpen}
        onOpenChange={setAssistantOpen}
        seed={seed}
        onSeedUsed={() => setSeed(null)}
      />
    </div>
  );
}
