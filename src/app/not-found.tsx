"use client";

import Link from "next/link";
import { useI18n } from "@/i18n";

export default function NotFound() {
  const { t } = useI18n();
  return (
    <div className="container status-page">
      <h1>{t("notFound.title")}</h1>
      <Link href="/" className="btn btn-primary">
        {t("notFound.home")}
      </Link>
    </div>
  );
}
