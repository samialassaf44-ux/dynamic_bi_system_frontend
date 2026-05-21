import React, { useState, useEffect } from 'react';
import FileUpload from './components/FileUpload';
import Breadcrumbs from './components/Breadcrumbs';
import Sidebar from './components/Sidebar';
import ChartView from './components/ChartView';
import { BarChart3, Table, EyeOff, Loader2 } from 'lucide-react';

// ✅ API URL - يقرأ من متغير البيئة أو يستخدم localhost للتطوير
const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

export default function App() {
  const [fileUploaded, setFileUploaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState('');
  const [customCategoryColors, setCustomCategoryColors] = useState({}); 
  const [deletedColumnNames, setDeletedColumnNames] = useState([]); 
  const [allColumns, setAllColumns] = useState([]);
  const [dataPreview, setDataPreview] = useState([]);
  const [dataSummary, setDataSummary] = useState({ rows: 0, cols: 0 });
  const [isAnalysisStarted, setIsAnalysisStarted] = useState(false);

  const [editingChart, setEditingChart] = useState(null);

  const [showNodeTable, setShowNodeTable] = useState(false);
  const [nodeTableData, setNodeTableData] = useState([]);
  const [nodeTableRowsCount, setNodeTableRowsCount] = useState(0);
  const [loadingTable, setLoadingTable] = useState(false);

  const [fontFamily, setFontFamily] = useState('Cairo, sans-serif');
  const [chartWidth, setChartWidth] = useState('md:col-span-1');
  const [chartHeight, setChartHeight] = useState('350px');
  const [barWidth, setBarWidth] = useState(50);
  const [colorMode, setColorMode] = useState('single');

  const [breadcrumbs, setBreadcrumbs] = useState([{ id: 'root', name: 'الرئيسية', filter: {} }]);

  const [charts, setCharts] = useState([]);
  const [selectedX, setSelectedX] = useState('');
  const [selectedY, setSelectedY] = useState('');
  const [chartType, setChartType] = useState('bar');
  const [chartTitle, setChartTitle] = useState('');
  const [themeColor, setThemeColor] = useState('#054239'); 
  const [fontSize, setFontSize] = useState(14);

  const [savedFonts, setSavedFonts] = useState(() => {
    const localFonts = localStorage.getItem('custom_saved_fonts');
    return localFonts ? JSON.parse(localFonts) : [];
  });

  useEffect(() => {
    savedFonts.forEach(font => {
      const linkId = `font-link-${font.value.split(',')[0].trim().replace(/\s+/g, '-').toLowerCase()}`;
      if (!document.getElementById(linkId)) {
        const link = document.createElement('link');
        link.id = linkId;
        link.rel = 'stylesheet';
        link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(font.fontName)}:wght@400;700&display=swap`;
        document.head.appendChild(link);
      }
    });
  }, [savedFonts]);

  useEffect(() => {
    if (isAnalysisStarted && showNodeTable) {
      fetchNodeTableData();
    }
  }, [breadcrumbs, showNodeTable]);

  const fetchNodeTableData = async () => {
    setLoadingTable(true);
    try {
      const currentFilters = breadcrumbs[breadcrumbs.length - 1].filter;
      // ✅ استخدام API_URL بدلاً من المسار النسبي
      const response = await fetch(`${API_URL}/api/table-data`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filters: currentFilters })
      });
      const resData = await response.json();
      if (resData.status === 'success') {
        setNodeTableData(resData.data);
        setNodeTableRowsCount(resData.total_filtered_rows);
      }
    } catch (err) {
      console.error("Error fetching node table data:", err);
    } finally {
      setLoadingTable(false);
    }
  };

  const handleUploadSuccess = (result) => {
    setDataSummary({ rows: result.total_rows, cols: result.total_columns });
    setAllColumns(result.columns);
    setDataPreview(result.preview);
    setFileUploaded(true);
  };

  const getCompatibleCharts = () => {
    if (!selectedX) return [];
    const colX = allColumns.find(c => c.name === selectedX);
    const colY = allColumns.find(c => c.name === selectedY);

    if (!selectedY) {
      return [
        { value: 'bar', label: 'مخطط أعمدة تكراري' },
        { value: 'pie', label: 'مخطط دائري (Pie)' },
        { value: 'donut', label: 'مخطط حلقة (Donut)' }
      ];
    }
    if (colX?.type === 'numeric' && colY?.type === 'numeric') {
      return [{ value: 'scatter', label: '⭐ مخطط مبعثر (Scatter)' }, { value: 'line', label: 'مخطط خطي' }];
    }
    if (colX?.type === 'categorical' && colY?.type === 'numeric') {
      return [{ value: 'bar', label: '⭐ مخطط أعمدة رأسي' }, { value: 'horizontal_bar', label: 'مخطط أعمدة أفقي' }, { value: 'pie', label: 'مخطط دائري' }];
    }
    if (colX?.type === 'date' && colY?.type === 'numeric') {
      return [{ value: 'line', label: '⭐ مخطط خطي زمنى' }, { value: 'area', label: 'مخطط مساحي' }];
    }
    return [{ value: 'bar', label: 'مخطط عام' }];
  };

  const handleStartAnalysis = () => {
    setIsAnalysisStarted(true);
    const autoGeneratedCharts = allColumns
      .filter(col => !deletedColumnNames.includes(col.name) && col.type !== 'unique_id')
      .map((col, index) => {
        return {
          id: Date.now() + index,
          x: col.name,
          y: "",
          type: 'bar',
          title: `توزيع البيانات حسب: ${col.name}`,
          themeColor: '#054239',
          fontSize: 14,
          fontFamily: fontFamily,
          chartWidth: 'md:col-span-1',
          chartHeight: '350px',
          barWidth: 50,
          colorMode: 'single',
          levelId: 'root',
          customCategoryColors: null
        };
      });
    setCharts(autoGeneratedCharts);
  };

  const handleAddChart = () => {
    if (!selectedX) return alert('يرجى تحديد المحور X');
    const newChart = {
      id: Date.now(),
      x: selectedX,
      y: selectedY,
      type: chartType,
      title: chartTitle,
      themeColor: themeColor,
      fontSize: fontSize,
      levelId: breadcrumbs[breadcrumbs.length - 1].id,
      fontFamily: fontFamily,
      chartWidth: chartWidth,
      chartHeight: chartHeight,
      barWidth: barWidth,
      colorMode: colorMode,
      customCategoryColors: colorMode === 'manual' ? { ...customCategoryColors } : null
    };
    setCharts([...charts, newChart]);
    clearSidebarFields();
  };

  const handleUpdateChart = () => {
    if (!editingChart) return;

    setCharts(prevCharts => prevCharts.map(ch => {
      if (ch.id === editingChart.id) {
        return {
          ...ch,
          x: selectedX,
          y: selectedY,
          type: chartType,
          title: chartTitle,
          themeColor: themeColor,
          fontSize: fontSize,
          fontFamily: fontFamily,
          chartWidth: chartWidth,
          chartHeight: chartHeight,
          barWidth: barWidth,
          colorMode: colorMode,
          customCategoryColors: colorMode === 'manual' ? { ...customCategoryColors } : null
        };
      }
      return ch;
    }));

    setEditingChart(null);
    clearSidebarFields();
  };

  const handleEditClick = (chart) => {
    setEditingChart(chart);
    setSelectedX(chart.x);
    setSelectedY(chart.y || '');
    setChartType(chart.type);
    setChartTitle(chart.title);
    setThemeColor(chart.themeColor);
    setFontSize(chart.fontSize);
    setFontFamily(chart.fontFamily);
    setChartWidth(chart.chartWidth);
    setChartHeight(chart.chartHeight);
    setBarWidth(chart.barWidth);
    setColorMode(chart.colorMode);
    setCustomCategoryColors(chart.customCategoryColors || {});
  };

  const clearSidebarFields = () => {
    setChartTitle('');
    setCustomCategoryColors({});
    setEditingChart(null);
  };

  const onChartClick = (params, columnX) => {
    let clickedValue = params.name;

    if (clickedValue && typeof clickedValue === 'object') {
      clickedValue = clickedValue.value || clickedValue.text || JSON.stringify(clickedValue);
    }

    if (!clickedValue) return;

    clickedValue = String(clickedValue).strip ? String(clickedValue).strip() : String(clickedValue).trim();

    const currentLevel = breadcrumbs[breadcrumbs.length - 1];
    const newLevelId = `level_${Date.now()}`;

    const xColumnName = columnX || "فئة";

    const newLevel = {
      id: newLevelId,
      name: `${xColumnName}: ${clickedValue}`,
      filter: { ...currentLevel.filter, [xColumnName]: clickedValue }
    };

    setBreadcrumbs([...breadcrumbs, newLevel]);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-right" dir="rtl">
      <header className="bg-[#054239] text-white shadow-md px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <BarChart3 className="w-8 h-8 text-[#988561]" />
          <h1 className="text-lg font-bold">منظومة BI الذكية للتنقيب الهرمي</h1>
        </div>
        {fileUploaded && isAnalysisStarted && (
          <Breadcrumbs crumbs={breadcrumbs} onCrumbClick={(idx) => setBreadcrumbs(breadcrumbs.slice(0, idx + 1))} />
        )}
      </header>

      <div className="flex-1 flex overflow-hidden">
        <Sidebar 
          isAnalysisStarted={isAnalysisStarted}
          selectedX={selectedX} setSelectedX={setSelectedX} selectedY={selectedY} setSelectedY={setSelectedY}
          chartType={chartType} setChartType={setChartType} chartTitle={chartTitle} setChartTitle={setChartTitle}
          themeColor={themeColor} setThemeColor={setThemeColor} fontSize={fontSize} setFontSize={setFontSize}
          compatibleCharts={getCompatibleCharts()} onAddChart={handleAddChart}
          allColumns={allColumns.filter(c => !deletedColumnNames.includes(c.name))}
          onDeleteColumn={(colName) => setDeletedColumnNames(prev => [...prev, colName])}
          chartWidth={chartWidth} setChartWidth={setChartWidth}
          chartHeight={chartHeight} setChartHeight={setChartHeight}
          barWidth={barWidth} setBarWidth={setBarWidth}
          colorMode={colorMode} setColorMode={setColorMode}
          customCategoryColors={customCategoryColors}
          setCustomCategoryColors={setCustomCategoryColors}
          fontFamily={fontFamily} setFontFamily={setFontFamily}
          savedFonts={savedFonts} setSavedFonts={setSavedFonts}

          editingChart={editingChart}
          onUpdateChart={handleUpdateChart}
          onCancelEdit={clearSidebarFields}
        />

        <main className="flex-1 p-6 overflow-y-auto">
          {!fileUploaded && (
            <FileUpload onUploadSuccess={handleUploadSuccess} loading={loading} fileName={fileName} />
          )}

          {fileUploaded && !isAnalysisStarted && (
            <div className="space-y-6">
              <div className="bg-white p-5 border border-gray-200 rounded-xl flex justify-between items-center shadow-sm">
                <div>
                  <h3 className="font-bold text-[#002623]">تم تحليل بنية الجدول بنجاح: <span className="text-[#428177]">{fileName}</span></h3>
                  <p className="text-xs text-gray-400 mt-1">الملف مكوّن من {dataSummary.rows} أسطر بيانية مصنفة دلالياً.</p>
                </div>
                <button onClick={handleStartAnalysis} className="bg-[#054239] hover:bg-[#002623] text-white font-bold text-sm px-6 py-3 rounded-xl shadow-md transition-colors">
                  بدء تحليل البيانات وإنشاء المخططات
                </button>
              </div>

              <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
                <div className="bg-gray-50 p-3 border-b text-sm font-bold text-[#002623]">معاينة الهيكل الصدري للبيانات (أول 5 صفوف)</div>
                <div className="overflow-x-auto">
                  <table className="w-full text-right text-sm">
                    <thead className="bg-[#054239] text-white text-xs">
                      <tr>
                        {allColumns.map(col => <th key={col.name} className="p-3 border-l border-[#428177]">{col.name}</th>)}
                      </tr>
                    </thead>
                    <tbody className="divide-y text-gray-600">
                      {dataPreview.map((row, idx) => (
                        <tr key={idx} className="hover:bg-gray-50/50">
                          {allColumns.map(col => <td key={col.name} className="p-3 border-l max-w-xs truncate">{row[col.name]}</td>)}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {fileUploaded && isAnalysisStarted && (
            <div className="space-y-4">

              <div className="bg-white p-4 border border-gray-200 rounded-xl flex justify-between items-center shadow-sm">
                <div>
                  <h3 className="font-bold text-[#002623] text-sm">المخططات المتفاعلة في عقدة: <span className="text-[#428177] font-extrabold">{breadcrumbs[breadcrumbs.length - 1].name}</span></h3>
                  <p className="text-xs text-gray-400 mt-0.5">يمكنك تصفية البيانات هرمياً بالنقر على أقسام المخططات.</p>
                </div>
                <button 
                  onClick={() => setShowNodeTable(!showNodeTable)} 
                  className={`flex items-center gap-2 text-xs font-bold px-4 py-2.5 rounded-lg border transition-all shadow-sm
                    ${showNodeTable ? 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
                >
                  {showNodeTable ? <EyeOff className="w-4 h-4"/> : <Table className="w-4 h-4"/>}
                  {showNodeTable ? 'إخفاء جدول البيانات الحالي' : '📄 عرض جدول البيانات لهذه العقدة'}
                </button>
              </div>

              {showNodeTable && (
                <div className="bg-white border border-amber-100 rounded-xl overflow-hidden shadow-md transition-all animate-fadeIn">
                  <div className="bg-amber-50/50 p-3 border-b border-amber-100 text-xs font-bold text-amber-900 flex justify-between items-center">
                    <span>📋 السجلات الفوقية المفلترة (يعرض أول 50 صفاً من أصل {nodeTableRowsCount} سجل مطابق للفلتر الحالي)</span>
                  </div>
                  {loadingTable ? (
                    <div className="p-12 flex justify-center items-center gap-2 text-gray-500 text-sm">
                      <Loader2 className="w-5 h-5 animate-spin text-[#428177]" /> جاري فلترة واستخراج السجلات من الباك إند...
                    </div>
                  ) : nodeTableData.length === 0 ? (
                    <div className="p-8 text-center text-gray-400 text-xs">لا توجد سجلات مطابقة للفلاتر الحالية.</div>
                  ) : (
                    <div className="overflow-x-auto max-h-72">
                      <table className="w-full text-right text-xs">
                        <thead className="bg-gray-100 text-gray-700 font-bold sticky top-0 border-b">
                          <tr>
                            {allColumns.map(col => <th key={col.name} className="p-2.5 border-l">{col.name}</th>)}
                          </tr>
                        </thead>
                        <tbody className="divide-y text-gray-600">
                          {nodeTableData.map((row, idx) => (
                            <tr key={idx} className="hover:bg-amber-50/20">
                              {allColumns.map(col => <td key={col.name} className="p-2 border-l max-w-xs truncate">{row[col.name]}</td>)}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {charts
                  .filter(c => c.levelId === breadcrumbs[breadcrumbs.length - 1].id)
                  .map(chart => (
                    <ChartView 
                      key={chart.id} 
                      chart={chart} 
                      currentFilters={breadcrumbs[breadcrumbs.length - 1].filter} 
                      onChartClick={onChartClick}
                      onDelete={(id) => setCharts(charts.filter(c => c.id !== id))}
                      onEdit={() => handleEditClick(chart)}
                    />
                  ))}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
