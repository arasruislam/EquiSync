"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Sector } from "recharts";
import { useState } from "react";
import { formatCurrency } from "@/lib/utils";

interface ResourcePieChartProps {
  data: {
    name: string;
    value: number;
    color: string;
    glow: string;
  }[];
}

const renderActiveShape = (props: any) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, value, glow } = props;

  return (
    <g>
      <text x={cx} y={cy - 15} dy={8} textAnchor="middle" fill="#9ca3af" fontSize={9} fontWeight={800} className="uppercase tracking-widest">
        {payload.name}
      </text>
      <text x={cx} y={cy + 8} dy={8} textAnchor="middle" fill="white" fontSize={15} fontWeight={900}>
        {formatCurrency(value * 120, "BDT")}
      </text>
      <text x={cx} y={cy + 25} dy={8} textAnchor="middle" fill="#6b7280" fontSize={9} fontWeight={700} className="italic opacity-70">
        ({formatCurrency(value, "USD")})
      </text>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 6}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        style={{ filter: `drop-shadow(0 0 12px ${glow})` }}
      />
      <Sector
        cx={cx}
        cy={cy}
        startAngle={startAngle}
        endAngle={endAngle}
        innerRadius={outerRadius + 10}
        outerRadius={outerRadius + 12}
        fill={fill}
      />
    </g>
  );
};

export default function ResourcePieChart({ data }: ResourcePieChartProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  const onPieEnter = (_: any, index: number) => {
    setActiveIndex(index);
  };

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            activeIndex={activeIndex}
            activeShape={renderActiveShape}
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={70}
            outerRadius={90}
            paddingAngle={5}
            dataKey="value"
            onMouseEnter={onPieEnter}
            stroke="none"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<div className="hidden" />} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
