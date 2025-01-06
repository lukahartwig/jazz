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
      grid: {
        padding: {
          left: 0,
          right: 0,
        },
      },
      chart: {
        height: 350,
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
        show: false,
        labels: {
          show: false,
        },
        axisBorder: {
          show: false,
        },
        axisTicks: {
          show: false,
        },
      },
      yaxis: {
        show: false,
        labels: {
          show: false,
        },
        axisBorder: {
          show: false,
        },
        axisTicks: {
          show: false,
        },
      },
      plotOptions: {
        heatmap: {
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
      // colors: [
      //   "#f0fdf4",
      //   "#dcfce7",
      //   "#bbf7d0",
      //   "#86efac",
      //   "#4ade80",
      //   "#22c55e",
      //   "#16a34a",
      //   "#15803d",
      //   "#166534",
      //   "#14532d",
      //   "#052e16",
      // ],
    },
  };

  return (
    <Chart
      options={chartData.options}
      series={[series]}
      type="heatmap"
      width={900}
      height={100}
    />
  );
}
