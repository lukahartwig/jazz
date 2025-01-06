"use client";

import { ApexOptions } from "apexcharts";
import { useMemo } from "react";
import Chart from "react-apexcharts";

export function LatencyChart({ data }: { data: any }) {
  const series = useMemo(() => {
    return {
      name: "Latency",
      data: data.latencyOverTime[0].map(
        (timestamp: number, latency: number) => ({
          x: timestamp,
          y: Math.round(data.latencyOverTime[1][latency]),
        }),
      ),
    };
  }, [data]);

  const options: ApexOptions = {
    grid: {
      show: false,
    },
    stroke: {
      show: false,
    },
    chart: {
      animations: {
        enabled: false,
      },
      type: "heatmap",
      toolbar: {
        show: false,
      },
    },
    dataLabels: {
      enabled: false,
    },
    title: {
      text: "",
    },
    xaxis: {
      labels: {
        show: false,
      },
      axisBorder: {
        show: false,
      },
      axisTicks: {
        show: false,
      },
      tooltip: {
        enabled: false,
      },
    },
    yaxis: {
      show: false,
      labels: {
        formatter: function (value: number) {
          return value + " milliseconds";
        },
      },
    },

    tooltip: {
      theme: "",
      custom: function ({ series, seriesIndex, dataPointIndex, w }) {
        const latency = series[seriesIndex][dataPointIndex];

        const date = new Date(
          w.globals.labels[dataPointIndex],
        ).toLocaleString();

        return `
<div class="">
  <span class="text-xs">${date}</span><br/>
  <span><span class="font-semibold text-stone-900 dark:text-white">${latency}</span> milliseconds</span><br/>
</div>
        `;
      },
      cssClass: "g-apexcharts-tooltip",
    },
    plotOptions: {
      heatmap: {
        radius: 0,
        colorScale: {
          ranges: [
            {
              from: 0,
              to: 10,
              color: "#1ae200",
            },
            {
              from: 10,
              to: 50,
              color: "#32c119",
            },
            {
              from: 50,
              to: 100,
              color: "#62bd56",
            },
            {
              from: 100,
              to: 200,
              color: "#4c8944",
            },
            {
              from: 200,
              to: 300,
              color: "#3b6537",
            },
            {
              from: 300,
              to: 400,
              color: "#405b3d",
            },
            {
              from: 400,
              to: 500,
              color: "#395335",
            },
            {
              from: 500,
              to: 750,
              color: "#283e2b",
            },
            {
              from: 750,
              to: 1000,
              color: "#1e2a1d",
            },
            {
              from: 1000,
              to: 3000,
              color: "#162018",
            },
            {
              from: 3000,
              color: "#ff001e",
            },
          ],
        },
      },
    },
  };

  return (
    <Chart
      options={options}
      series={[series]}
      type="heatmap"
      width={900}
      height={100}
    />
  );
}
