export const runtime = "edge";
export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MonthRoute, monthRouteMetadata } from "@/components/month-calendar/month-route";
import { monthProgramFromSlug } from "@/lib/month-routes";

interface PageProps {
  params: Promise<{ program: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { program } = await params;
  return monthRouteMetadata({ programSlug: program, view: "upcoming" });
}

export default async function MonthProgramListPage({ params, searchParams }: PageProps) {
  const { program } = await params;
  if (!monthProgramFromSlug(program)) notFound();
  return <MonthRoute programSlug={program} view="upcoming" searchParams={searchParams} />;
}
