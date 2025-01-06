import { cn } from "@/lib/utils";
import { clsx } from "clsx";
import { Icon } from "gcmp-design-system/src/app/components/atoms/Icon";
import { HeroHeader } from "gcmp-design-system/src/app/components/molecules/HeroHeader";
import { HeartIcon } from "lucide-react";
import { Fragment } from "react";

export const metadata = {
  title: "Status",
  description: "Great apps by smart people.",
};

const locations = [
  {
    name: "Edinburgh",
    people: [
      {
        name: "Lindsay Walton",
        title: "Front-end Developer",
        email: "lindsay.walton@example.com",
        role: "Member",
      },
      {
        name: "Courtney Henry",
        title: "Designer",
        email: "courtney.henry@example.com",
        role: "Admin",
      },
    ],
  },
  // More people...
];

const statuses = {
  up: "text-green-400 bg-green-400/10",
  down: "text-rose-400 bg-rose-400/10",
};

export default async function Page() {
  const res = await fetch("https://gcmp.grafana.net/api/ds/query", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.GRAFANA_SERVICE_ACCOUNT}`,
    },
    body: JSON.stringify({
      from: "now-5m",
      to: "now",
      queries: [
        {
          datasource: {
            type: "prometheus",
            uid: "grafanacloud-prom",
          },
          expr: 'avg(probe_success{instance="https://mesh.jazz.tools/self-sync-check", job="self-sync-check"}) by (probe)',
          instant: true,
          intervalFactor: 1,
          maxDataPoints: 100,
          intervalMs: 1000,
          refId: "A",
        },
      ],
    }),
  });
  const responseData = await res.json();

  return (
    <div className="container flex flex-col gap-6 pb-10 lg:pb-20">
      <HeroHeader
        title="Systems status"
        slogan="Great system status spage by smart people."
      />

      <table className="min-w-full">
        <thead className="text-left text-sm font-semibold text-stone-900 dark:text-white">
          <tr>
            <th scope="col" className="py-3.5 pl-4 pr-3 sm:pl-3 w-3/5">
              Latency
            </th>
            <th scope="col" className="px-3 py-3.5">
              Average
            </th>
            <th scope="col" className="px-3 py-3.5">
              99th %
            </th>
            <th scope="col" className="px-3 py-3.5">
              Status
            </th>
            <th>
              <span className="sr-only">Location</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {responseData.results.A.frames.map((frame) => (
            <tr key={frame.schema.fields[1].labels.probe} className="border-t">
              <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-stone-900 sm:pl-3"></td>
              <td className="whitespace-nowrap px-3 py-4 text-sm">100ms</td>
              <td className="whitespace-nowrap px-3 py-4 text-sm">200ms</td>
              <td className="whitespace-nowrap px-3 py-4 text-sm">
                <div className="flex items-center gap-2">
                  <div
                    className={clsx(
                      "flex-none rounded-full p-1",
                      frame.data.values[1][0] === 1
                        ? "text-green-400 bg-green-400/10"
                        : "text-rose-400 bg-rose-400/10",
                    )}
                  >
                    <div className="size-1.5 rounded-full bg-current" />
                  </div>
                  {frame.data.values[1][0] === 1 ? "Up" : "Down"}
                </div>
              </td>
              <td className="whitespace-nowrap px-3 py-4 text-sm">
                {startCase(frame.schema.fields[1].labels.probe)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function startCase(str: string) {
  return str.replace(/([a-z])([A-Z])/g, "$1 $2");
}
