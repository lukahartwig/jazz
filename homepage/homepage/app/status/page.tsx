import { cn } from "@/lib/utils";
import { Icon } from "gcmp-design-system/src/app/components/atoms/Icon";
import { HeroHeader } from "gcmp-design-system/src/app/components/molecules/HeroHeader";
import { HeartIcon } from "lucide-react";

export const metadata = {
  title: "Status",
  description: "Great apps by smart people.",
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

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-12">
        {responseData.results.A.frames.map((frame) => (
          <div key={frame.schema.fields[1].labels.probe} className="">
            <h2 className="mt-2 flex items-center gap-2 text-xl text-stone-900 dark:text-white">
              {startCase(frame.schema.fields[1].labels.probe)}
            </h2>
            <div className="mt-3 flex gap-4 items-center">
              <Icon
                name="heart"
                size="4xl"
                className={
                  frame.data.values[1][0] === 1
                    ? "text-green-500"
                    : "text-red-500"
                }
              />
              <div>
                <p className="flex items-baseline text-stone-900 dark:text-stone-200">
                  <div className="bg-blue-400 self-center size-2 rounded-full mr-1.5" />
                  127
                  <span className="self-baseline text-xs text-stone-500">
                    ms
                  </span>
                </p>
                <p className="mt-0.5 text-xs">Avg latency</p>
              </div>
              <div>
                <p className="flex items-baseline text-stone-900 dark:text-stone-200">
                  <div className="bg-red-500 self-center size-2 rounded-full mr-1.5" />
                  337
                  <span className="self-baseline text-xs text-stone-500">
                    ms
                  </span>
                </p>
                <p className="mt-0.5 text-xs">99th percentile</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {/* <pre>{JSON.stringify(responseData, null, 2)}</pre> */}
      </div>
    </div>
  );
}

function startCase(str: string) {
  return str.replace(/([a-z])([A-Z])/g, "$1 $2");
}
