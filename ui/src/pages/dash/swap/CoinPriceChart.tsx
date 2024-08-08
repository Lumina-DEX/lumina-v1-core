import { createChart, ColorType, PriceScaleMode } from "lightweight-charts";
import React, { useEffect, useRef } from "react";

const initialData = [
  { time: "2018-01-03", value: 10.11 },
  { time: "2018-02-02", value: 30.11 },
  { time: "2018-03-13", value: 50.11 },
  { time: "2018-04-23", value: 30.11 },
  { time: "2018-05-05", value: 70.11 },
  { time: "2018-05-07", value: 10.11 },
  { time: "2018-05-21", value: 50.11 },
  { time: "2018-05-22", value: 50.11 },
  { time: "2018-05-23", value: 70.11 },
  { time: "2018-05-24", value: 50.11 },
  { time: "2018-05-25", value: 50.11 },
  { time: "2018-06-24", value: 100.02 },
  { time: "2018-07-25", value: 40.32 },
  { time: "2018-08-26", value: 60.17 },
  { time: "2018-09-27", value: 70.89 },
  { time: "2018-12-23", value: 80.11 },
  { time: "2018-12-24", value: 90.02 },
  { time: "2018-12-25", value: 110.32 },
  { time: "2018-12-26", value: 120.17 },
  { time: "2018-12-27", value: 28.89 },
  { time: "2018-12-28", value: 25.46 },
  { time: "2018-12-29", value: 111.92 },
  { time: "2018-12-30", value: 22.68 },
  { time: "2018-12-31", value: 100.67 },
];

const CoinPriceChart = () => {
  const chartContainerRef = useRef<any>();
  const chartInstanceRef = useRef<any>();

  const colors = {
    backgroundColor: "rgba(0, 0, 0, 0)",
    lineColor: "#4d369a",
    textColor: "black",
    areaTopColor: "#4d369a",
    areaBottomColor: "rgba(77, 54, 200, 0)",
  };

  const handleResize = () => {
    chartInstanceRef.current.applyOptions({
      width: chartContainerRef.current.offsetWidth,
    });
  };
  useEffect(() => {
    chartInstanceRef.current = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: colors.backgroundColor },
        textColor: colors.textColor,
      },
      width: chartContainerRef.current.offsetWidth,
      height: 400,
      rightPriceScale: {
        borderVisible: false,
        mode: PriceScaleMode.Normal,
      },
      timeScale: {
        borderVisible: false,
      },
      grid: {
        horzLines: {
          visible: false,
        },
        vertLines: {
          visible: false,
        },
      },
    });
    chartInstanceRef.current.timeScale().fitContent();
    const myPriceFormater = Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format;

    chartInstanceRef.current.applyOptions({
      localization: {
        priceFormatter: myPriceFormater,
      },
    });

    const newSeries = chartInstanceRef.current.addAreaSeries({
      lineColor: colors.lineColor,
      topColor: colors.areaTopColor,
      bottomColor: colors.areaBottomColor,
    });
    newSeries.setData(initialData);

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div id="coinPriceChart" className="w-full">
      <div
        ref={chartContainerRef}
        style={{ width: "100%", height: "100%" }}
      ></div>
    </div>
  );
};

export default CoinPriceChart;
