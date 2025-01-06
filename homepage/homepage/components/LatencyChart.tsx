"use client";

import { useMemo } from "react";
import Chart from "react-apexcharts";

export function LatencyChart({ data }: { data: any }) {
  console.log(data);

  const series = useMemo(() => {
    return {
      name: "latency",
      data: data.latencyOverTime[0].map((timestamp, latency) => ({
        x: timestamp,
        y: Math.round(data.latencyOverTime[1][latency]),
      })),
    };
  }, [data]);

  console.log(series);

  const chartData = {
    options: {
      chart: {
        height: 350,
        type: "heatmap",
      },
      dataLabels: {
        enabled: false,
      },
      colors: ["#008FFB"],
      title: {
        text: "HeatMap Chart (Single color)",
      },
    },
    series: [],
  };

  return (
    <Chart
      options={chartData.options}
      series={[series]}
      type="heatmap"
      width={500}
      height={320}
    />
  );
}
