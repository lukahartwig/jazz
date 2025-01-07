import { LatencyChart } from "@/components/LatencyChart";
import { clsx } from "clsx";
import { HeroHeader } from "gcmp-design-system/src/app/components/molecules/HeroHeader";

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
        {
          datasource: {
            type: "prometheus",
            uid: "grafanacloud-prom",
          },
          editorMode: "code",
          expr: '1000 / 2 * avg(probe_duration_seconds{probe=~".*", instance="https://mesh.jazz.tools/self-sync-check", job="self-sync-check"} * on (instance, job,probe,config_version) group_left probe_success{probe=~".*",instance="https://mesh.jazz.tools/self-sync-check", job="self-sync-check"} > 0) by (probe)',
          instant: false,
          interval: "",
          intervalFactor: 1,
          legendFormat: "{{probe}}",
          refId: "B",
        },
      ],
    }),
  });

  const responseData = await res.json();

  if (!responseData.results?.A?.frames || !responseData.results?.B?.frames)
    return;

  const byProbe: any[] = [];

  for (const frame of responseData.results.A.frames) {
    const probe = frame.schema.fields[1].labels.probe;
    byProbe[probe] = {
      status: frame.data.values[1][0],
      label: startCase(probe),
    };
  }

  for (const frame of responseData.results.B.frames) {
    const probe = frame.schema.fields[1].labels.probe;
    if (!byProbe[probe]) {
      byProbe[probe] = {
        label: startCase(probe),
      };
    }

    byProbe[probe].latencyOverTime = frame.data.values;
  }

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
            <th scope="col" className="px-3 py-3.5 whitespace-nowrap">
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
          {Object.values(byProbe).map((row) => (
            <tr key={row.label} className="border-t">
              <td className="pr-3">
                <LatencyChart data={row} />
              </td>
              <td className="whitespace-nowrap px-3 py-4 text-sm">100ms</td>
              <td className="whitespace-nowrap px-3 py-4 text-sm">100ms</td>
              <td className="whitespace-nowrap px-3 py-4 text-sm">
                <div className="flex items-center gap-2">
                  <div
                    className={clsx(
                      "flex-none rounded-full p-1",
                      row.status === 1
                        ? "text-green-400 bg-green-400/10"
                        : "text-rose-400 bg-rose-400/10",
                    )}
                  >
                    <div className="size-1.5 rounded-full bg-current" />
                  </div>
                  {row.status === 1 ? "Up" : "Down"}
                </div>
              </td>
              <td className="whitespace-nowrap px-3 py-4 text-sm">
                {row.label}
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
