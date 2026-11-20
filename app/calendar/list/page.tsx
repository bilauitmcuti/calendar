export const runtime = "edge";
export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { MonthRoute, monthRouteMetadata } from "@/components/month-calendar/month-route";

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export async function generateMetadata(): Promise<Metadata> {
  return monthRouteMetadata({ view: "upcoming" });
}

export default function MonthListPage({ searchParams }: PageProps) {
  return <MonthRoute view="upcoming" searchParams={searchParams} />;
}
