import React, { useState, useEffect } from 'react';
import ReactECharts from 'echarts-for-react';
import { Trash2, Edit2 } from 'lucide-react';

// ✅ API URL - يقرأ من متغير البيئة أو يستخدم localhost للتطوير
const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

export default function ChartView({ chart, currentFilters, onChartClick, onDelete, onEdit }) {
  const [chartOptions, setChartOptions] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRealChartData = async () => {
      setLoading(true);
      try {
        // ✅ استخدام API_URL بدلاً من المسار النسبي
        const response = await fetch(`${API_URL}/api/chart-data`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            x_column: chart.x,
            y_column: chart.y || "",
            filters: currentFilters && Object.keys(currentFilters).length > 0 ? currentFilters : {}
          })
        });
        const data = await response.json();

        const isPieOrDonut = chart.type === 'pie' || chart.type === 'donut';
        const isHorizontal = chart.type === 'horizontal_bar';

        let seriesData = [];

        if (isPieOrDonut) {
          seriesData = data.x_data.map((name, i) => {
            let itemColor = undefined;
            if (chart.colorMode === 'manual' && chart.customCategoryColors) {
              itemColor = chart.customCategoryColors[name];
            }
            return { 
              name, 
              value: data.y_data[i],
              itemStyle: itemColor ? { color: itemColor } : undefined
            };
          });
        } else {
          if (chart.colorMode === 'manual' && chart.customCategoryColors) {
            seriesData = data.y_data.map((val, idx) => {
              const categoryName = data.x_data[idx];
              const chosenColor = chart.customCategoryColors[categoryName] || chart.themeColor;
              return {
                value: val,
                itemStyle: { color: chosenColor }
              };
            });
          } else if (chart.colorMode === 'multi') {
            const predefinedColors = ['#054239', '#428177', '#8e7b5b', '#988561', '#1f5f54', '#b5a484'];
            seriesData = data.y_data.map((val, idx) => ({
              value: val,
              itemStyle: { color: predefinedColors[idx % predefinedColors.length] }
            }));
          } else {
            seriesData = data.y_data;
          }
        }

        const option = {
          title: { 
            text: chart.title || `${chart.x} Analysis`, 
            left: 'center', 
            textStyle: { fontSize: chart.fontSize, color: '#002623', fontFamily: chart.fontFamily } 
          },
          textStyle: { fontFamily: chart.fontFamily },
          tooltip: { trigger: isPieOrDonut ? 'item' : 'axis' },
          xAxis: !isPieOrDonut ? (isHorizontal ? { type: 'value' } : { type: 'category', data: data.x_data }) : null,
          yAxis: !isPieOrDonut ? (isHorizontal ? { type: 'category', data: data.x_data } : { type: 'value' }) : null,
          series: [
            {
              name: data.series_name,
              type: isPieOrDonut ? 'pie' : 'bar',
              barWidth: chart.barWidth ? `${chart.barWidth}%` : '50%',
              radius: chart.type === 'donut' ? ['40%', '70%'] : isPieOrDonut ? '70%' : null,
              data: seriesData,
              itemStyle: {
                color: chart.colorMode === 'single' ? chart.themeColor : undefined,
                borderRadius: isPieOrDonut ? 0 : [4, 4, 0, 0]
              }
            }
          ]
        };

        setChartOptions(option);
      } catch (err) {
        console.error("Error fetching analytics data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchRealChartData();
  }, [chart, currentFilters]);

  if (loading) {
    return <div className="h-[300px] flex items-center justify-center text-sm font-bold text-[#428177]">جاري تحليل واستدعاء البيانات الفلكية...</div>;
  }

  const containerClass = chart.chartWidth === 'w-full' ? 'col-span-1 md:col-span-2' : 'col-span-1';

  return (
    <div className={`bg-white border border-gray-200 rounded-xl p-4 shadow-sm relative hover:shadow-md transition-shadow ${containerClass}`}>
      <div className="flex items-center gap-2">
        <button onClick={onEdit} className="p-1 text-gray-400 hover:text-amber-600 transition-colors" title="تعديل خصائص المخطط">
          <Edit2 className="w-4 h-4" />
        </button>
        <button onClick={() => onDelete(chart.id)} className="p-1 text-gray-400 hover:text-red-500 transition-colors" title="حذف">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
      <div className="mt-4">
        {chartOptions && (
          <ReactECharts 
            option={chartOptions} 
            style={{ height: chart.chartHeight || '320px', width: '100%' }}
            onEvents={{'click': (params) => onChartClick(params, chart.x)}} 
          />
        )}
      </div>
    </div>
  );
}