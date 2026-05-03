import { useLayoutEffect, useMemo, useRef } from "react";
import * as am5 from "@amcharts/amcharts5";
import * as am5percent from "@amcharts/amcharts5/percent";
import * as am5xy from "@amcharts/amcharts5/xy";
import am5themes_Animated from "@amcharts/amcharts5/themes/Animated";
import { formatCurrency, USERS } from "../utils";

function createSafeRoot(container) {
  if (!container) return null;
  am5.array.each(am5.registry.rootElements, (root) => {
    if (root?.dom === container) {
      root.dispose();
    }
  });
  return am5.Root.new(container);
}

export default function Dashboard({ categories, expenses }) {
  const gaugeRef = useRef(null);
  const pieRef = useRef(null);
  const barRef = useRef(null);

  const summary = useMemo(() => {
    const totalBudget = categories.reduce((acc, c) => acc + (Number(c.target) || 0), 0);
    const totalSpent = expenses.reduce((acc, e) => acc + e.amount, 0);

    const byCategory = categories.map((cat) => ({
      category: cat.name,
      spent: expenses.filter((e) => e.categoryId === cat.id).reduce((acc, e) => acc + e.amount, 0),
      target: Number(cat.target) || 0
    }));

    const byUser = USERS.map((u) => ({
      user: u,
      spent: expenses.filter((e) => e.paidBy === u).reduce((acc, e) => acc + e.amount, 0)
    }));

    return { totalBudget, totalSpent, byCategory, byUser };
  }, [categories, expenses]);

  useLayoutEffect(() => {
    const root = createSafeRoot(gaugeRef.current);
    if (!root) return;
    root.setThemes([am5themes_Animated.new(root)]);

    const totalBudget = Math.max(summary.totalBudget, 0);
    const spent = Math.min(summary.totalSpent, totalBudget || summary.totalSpent);
    const remaining = Math.max((totalBudget || 0) - spent, 0);

    const chart = root.container.children.push(
      am5percent.PieChart.new(root, {
        startAngle: 180,
        endAngle: 360,
        innerRadius: am5.percent(70),
        layout: root.verticalLayout
      })
    );

    const series = chart.series.push(
      am5percent.PieSeries.new(root, {
        valueField: "value",
        categoryField: "category",
        startAngle: 180,
        endAngle: 360
      })
    );

    series.labels.template.set("forceHidden", true);
    series.ticks.template.set("forceHidden", true);

    series.data.setAll([
      { category: "הוצאה", value: spent, fill: am5.color(0x0f172a) },
      { category: "נותר", value: remaining > 0 ? remaining : 0.0001, fill: am5.color(0xe2e8f0) }
    ]);

    series.slices.template.adapters.add("fill", (fill, target) => target.dataItem?.dataContext?.fill || fill);
    series.slices.template.adapters.add("stroke", (stroke, target) => target.dataItem?.dataContext?.fill || stroke);

    chart.seriesContainer.children.push(
      am5.Label.new(root, {
        text: `${formatCurrency(summary.totalSpent)}\nמתוך ${formatCurrency(summary.totalBudget)}`,
        centerX: am5.percent(50),
        centerY: am5.percent(75),
        textAlign: "center",
        fontSize: 12,
        fontWeight: "500",
        maxWidth: am5.percent(80),
        oversizedBehavior: "wrap"
      })
    );

    series.appear(800, 100);

    return () => {
      if (!root.isDisposed()) root.dispose();
    };
  }, [summary.totalSpent, summary.totalBudget]);

  useLayoutEffect(() => {
    const root = createSafeRoot(pieRef.current);
    if (!root) return;
    root.setThemes([am5themes_Animated.new(root)]);

    const chart = root.container.children.push(am5percent.PieChart.new(root, { innerRadius: am5.percent(55) }));
    const series = chart.series.push(
      am5percent.PieSeries.new(root, {
        name: "קטגוריות",
        valueField: "spent",
        categoryField: "category"
      })
    );

    series.labels.template.setAll({
      textType: "circular",
      fontSize: 10,
      maxWidth: 90,
      oversizedBehavior: "truncate"
    });
    series.slices.template.setAll({
      tooltipText: "{category}: {value.formatNumber('#,###')} ₪"
    });
    series.data.setAll(summary.byCategory.filter((item) => item.spent > 0));
    series.appear(800, 100);

    return () => {
      if (!root.isDisposed()) root.dispose();
    };
  }, [summary.byCategory]);

  useLayoutEffect(() => {
    const root = createSafeRoot(barRef.current);
    if (!root) return;
    root.setThemes([am5themes_Animated.new(root)]);

    const chart = root.container.children.push(am5xy.XYChart.new(root, { panX: false, panY: false }));

    const xAxis = chart.xAxes.push(
      am5xy.CategoryAxis.new(root, {
        categoryField: "user",
        renderer: am5xy.AxisRendererX.new(root, {})
      })
    );

    const yAxis = chart.yAxes.push(am5xy.ValueAxis.new(root, { renderer: am5xy.AxisRendererY.new(root, {}) }));
    xAxis.get("renderer").labels.template.setAll({ fontSize: 10 });
    yAxis.get("renderer").labels.template.setAll({ fontSize: 10 });

    const series = chart.series.push(
      am5xy.ColumnSeries.new(root, {
        xAxis,
        yAxis,
        valueYField: "spent",
        categoryXField: "user",
        tooltip: am5.Tooltip.new(root, { labelText: "{valueY.formatNumber('#,###')} ₪" })
      })
    );

    series.columns.template.setAll({
      cornerRadiusTL: 12,
      cornerRadiusTR: 12,
      fill: am5.color(0x1e293b),
      stroke: am5.color(0x1e293b)
    });

    xAxis.data.setAll(summary.byUser);
    series.data.setAll(summary.byUser);
    series.appear(800);
    chart.appear(800, 100);

    return () => {
      if (!root.isDisposed()) root.dispose();
    };
  }, [summary.byUser]);

  return (
    <section className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card title="תקציב מול הוצאה">
          <div ref={gaugeRef} className="h-56 sm:h-64" />
        </Card>
        <Card title="פילוח לפי קטגוריה">
          <div ref={pieRef} className="h-56 sm:h-64" />
        </Card>
        <Card title="השוואה בין פואד לחיסן">
          <div ref={barRef} className="h-56 sm:h-64" />
        </Card>
      </div>

      <Card title="מעקב תקציבי לפי קטגוריה">
        <div className="space-y-3">
          {summary.byCategory.map((item) => {
            const remaining = item.target - item.spent;
            const percent = item.target > 0 ? Math.min(100, (item.spent / item.target) * 100) : 100;
            const exceeded = remaining < 0;

            return (
              <div key={item.category} className="rounded-xl border border-slate-100 p-3">
                <div className="flex items-center justify-between text-sm mb-2">
                  <p className="font-medium">{item.category}</p>
                  <p className={exceeded ? "text-rose-600 font-semibold" : "text-slate-600"}>
                    {exceeded ? `חריגה: ${formatCurrency(Math.abs(remaining))}` : `נותר: ${formatCurrency(remaining)}`}
                  </p>
                </div>
                <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div className={`h-full ${exceeded ? "bg-rose-500" : "bg-slate-900"}`} style={{ width: `${percent}%` }} />
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  הוצאה: {formatCurrency(item.spent)} / יעד: {formatCurrency(item.target)}
                </p>
              </div>
            );
          })}
        </div>
      </Card>
    </section>
  );
}

function Card({ title, children }) {
  return (
    <div className="bg-white rounded-2xl shadow-soft border border-slate-100 p-5">
      <h3 className="font-semibold text-slate-900 mb-3">{title}</h3>
      {children}
    </div>
  );
}
