export const runtime = "edge";
export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { MonthRoute, monthRouteMetadata } from "@/components/month-calendar/month-route";

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export async function generateMetadata(): Promise<Metadata> {
  return monthRouteMetadata({ view: "grid" });
}

export default function MonthPage({ searchParams }: PageProps) {
  return <MonthRoute view="grid" searchParams={searchParams} />;
}
