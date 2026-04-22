import Image from "next/image";
import Link from "next/link";

import ScheduleViewer from "@/app/components/schedule/schedule-viewer";
import { readSchoolScheduleData } from "@/lib/school-schedule";

export const dynamic = "force-dynamic";

type SchedulePageProps = {
  searchParams: Promise<{
    lang?: string | string[];
    [key: string]: string | string[] | undefined;
  }>;
};

type Language = "en" | "fr" | "ar";

function normalizeLanguage(value: string | undefined): Language {
  return value === "fr" || value === "ar" ? value : "en";
}

function getSingleParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function SchedulePage({ searchParams }: SchedulePageProps) {
  const resolvedSearchParams = await searchParams;
  const language = normalizeLanguage(getSingleParam(resolvedSearchParams.lang));
  const schedule = await readSchoolScheduleData();

  return (
    <main className="gem-page min-h-screen text-slate-950">
      <div className="relative z-10 mx-auto max-w-7xl px-5 py-5 sm:px-8 sm:py-7">
        <nav className="gem-panel sticky top-4 z-30 flex items-center justify-between gap-4 rounded-3xl px-4 py-3 sm:px-5">
          <Link
            href={{ pathname: "/", query: { lang: language } }}
            className="flex min-w-0 items-center gap-3"
          >
            <span className="gem-logo-mark flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/80 p-2">
              <Image
                src="/school-logo.png"
                alt=""
                width={36}
                height={36}
                className="object-contain"
                priority
              />
            </span>
            <span className="min-w-0">
              <span className="gem-eyebrow block">GEMAI</span>
              <span className="mt-1 block truncate text-sm font-semibold text-slate-900">
                School Schedule
              </span>
            </span>
          </Link>

          <Link
            href={{ pathname: "/", query: { lang: language } }}
            className="gem-soft-button inline-flex h-10 items-center justify-center rounded-2xl px-4 text-sm font-semibold"
          >
            Back to GEMAI
          </Link>
        </nav>

        <section className="gem-shell relative mt-5 overflow-hidden rounded-[32px] px-6 py-10 sm:px-10 lg:px-14">
          <Image
            src="/school-logo.png"
            alt=""
            width={420}
            height={420}
            className="gem-watermark absolute -right-20 top-12 hidden object-contain lg:block"
            aria-hidden="true"
          />
          <div className="relative">
            <p className="gem-eyebrow">School Schedule</p>
            <h1 className="mt-4 max-w-3xl text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
              Class weekly timetables
            </h1>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600 sm:text-base">
              Choose a class section to view its weekly schedule with period times,
              subjects, teachers, and recess blocks.
            </p>

            <div className="mt-8">
              <ScheduleViewer schedule={schedule} />
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
