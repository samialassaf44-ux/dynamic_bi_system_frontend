import React, { useEffect, useState } from 'react';
import { Layout, Palette, Sliders, Trash2, Plus, Check } from 'lucide-react';

export default function Sidebar({ 
  allColumns, isAnalysisStarted, selectedX, setSelectedX, selectedY, setSelectedY,
  chartType, setChartType, chartTitle, setChartTitle, themeColor, setThemeColor,
  fontSize, setFontSize, compatibleCharts, onAddChart,
  chartWidth, setChartWidth, chartHeight, setChartHeight,
  barWidth, setBarWidth, colorMode, setColorMode,
  customCategoryColors, setCustomCategoryColors,
  onDeleteColumn,
  // استقبال الخصائص الجديدة للخطوط الذكية
  fontFamily, setFontFamily, savedFonts, setSavedFonts,
  // 💡 [جديد]: استقبال خصائص وضع التعديل المنفصل القادمة من App.jsx
  editingChart, onUpdateChart, onCancelEdit
}) {

  const [uniqueCategories, setUniqueCategories] = useState([]);
  // حالات داخلية لإدارة نموذج إضافة الخط الجديد
  const [showFontInput, setShowFontInput] = useState(false);
  const [newFontName, setNewFontName] = useState('');

  useEffect(() => {
    if (selectedX && colorMode === 'manual') {
      const fetchCategories = async () => {
        try {
          // const response = await fetch(`http://127.0.0.1:8000/api/column-categories?column=${encodeURIComponent(selectedX)}`);
          const response = await fetch(`/api/column-categories?column=${encodeURIComponent(selectedX)}`);
          const data = await response.json();
          setUniqueCategories(data.categories || []);
          
          // في حال عدم وجود ألوان مخصصة محفوظة مسبقاً لهذا المخطط، نقوم بتعبئتها تلقائياً كالعادة
          if (Object.keys(customCategoryColors).length === 0) {
            const initialColors = {};
            data.categories.forEach((cat, index) => {
              const defaultPalette = ['#054239', '#428177', '#8e7b5b', '#988561', '#1f5f54'];
              initialColors[cat] = defaultPalette[index % defaultPalette.length];
            });
            setCustomCategoryColors(initialColors);
          }
        } catch (err) {
          console.error("Error fetching column categories:", err);
        }
      };
      fetchCategories();
    } else {
      setUniqueCategories([]);
    }
  }, [selectedX, colorMode]);

  const handleColorChange = (category, color) => {
    setCustomCategoryColors(prev => ({
      ...prev,
      [category]: color
    }));
  };

  // دالة معالجة وحفظ الخط الخارجي الجديد في الذاكرة المحلية والـ CDN
  const handleSaveCustomFont = () => {
    const trimmedName = newFontName.trim();
    if (!trimmedName) return alert('يرجى كتابة اسم الخط أولاً');

    const fontValue = `${trimmedName}, sans-serif`;
    
    const isExist = savedFonts.some(f => f.fontName.toLowerCase() === trimmedName.toLowerCase());
    if (isExist) return alert('هذا الخط موجود بالفعل في القائمة المنسدلة!');

    const newFontObj = {
      value: fontValue,
      label: `خط خارجي: ${trimmedName}`,
      fontName: trimmedName
    };

    const updatedFonts = [...savedFonts, newFontObj];
    setSavedFonts(updatedFonts);
    localStorage.setItem('custom_saved_fonts', JSON.stringify(updatedFonts));

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(trimmedName)}:wght@400;700&display=swap`;
    document.head.appendChild(link);

    setFontFamily(fontValue);
    setNewFontName('');
    setShowFontInput(false);
  };

  const baseFontOptions = [
    { value: 'Cairo, sans-serif', label: 'خط كاريو (Cairo)' },
    { value: 'Tajawal, sans-serif', label: 'خط تجول (Tajawal)' },
    { value: 'Tahoma, Geneva, sans-serif', label: 'خط تاهوما (Tahoma)' },
    { value: 'Arial, Helvetica, sans-serif', label: 'خط أريال التقليدي (Arial)' }
  ];

  const allFontOptions = [...baseFontOptions, ...savedFonts];

  return (
    <aside className="w-80 bg-white border-l border-gray-200 shadow-sm flex flex-col p-4 overflow-y-auto">
      {!isAnalysisStarted ? (
        <div>
          <h2 className="font-bold text-[#054239] mb-4 flex items-center gap-2 border-b pb-2 text-base">
            <Layout className="w-5 h-5 text-[#428177]" /> أعمدة الملف المكتشفة
          </h2>
          <div className="space-y-2">
            {allColumns.map(col => (
              <div key={col.name} className="p-2.5 bg-gray-50 border border-gray-100 rounded-lg flex justify-between items-center group hover:border-red-100 hover:bg-red-50/10 transition-colors">
                <div className="flex flex-col truncate max-w-[140px]">
                  <span className="font-medium text-[#002623] text-sm truncate">{col.name}</span>
                  <span className="text-[10px] text-gray-400 mt-0.5">
                    {col.type === 'numeric' ? 'عددي' : col.type === 'categorical' ? 'تصنيفي' : col.type === 'date' ? 'تاريخ' : 'فريد'}
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-bold block group-hover:hidden
                    ${col.type === 'numeric' ? 'bg-green-100 text-green-800' : 
                      col.type === 'categorical' ? 'bg-[#054239]/10 text-[#054239]' : 
                      col.type === 'date' ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-600'}`}>
                    {col.type === 'numeric' ? 'رقمي' : col.type === 'categorical' ? 'تصنيفي' : col.type === 'date' ? 'تاريخ' : 'فريد'}
                  </span>
                  
                  <button 
                    onClick={() => onDeleteColumn(col.name)}
                    className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md opacity-0 group-hover:opacity-100 transition-all"
                    title="استبعاد هذا العمود نهائياً"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* 💡 [تحديث بصري]: تغيير عنوان السايدبار ديناميكياً لتنبيه المستخدم بالوضع الحالي */}
          <h2 className="font-bold text-[#054239] border-b pb-2 flex items-center gap-2 text-base">
            <Palette className="w-5 h-5 text-[#8e7b5b]" /> 
            {editingChart ? '🔧 تعديل خصائص المخطط المحدد' : 'إعدادات وتخصيص المخطط'}
          </h2>

          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-600 block">المحور الأساسي (X)</label>
            <select className="w-full border rounded-lg p-2 text-sm bg-white border-gray-300 focus:border-[#054239]" value={selectedX} onChange={(e) => setSelectedX(e.target.value)}>
              <option value="">-- اختر العمود --</option>
              {allColumns.filter(c => c.type !== 'unique_id').map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-600 block">محور التقاطع الحسابي (Y) - اختياري</label>
            <select className="w-full border rounded-lg p-2 text-sm bg-white border-gray-300" value={selectedY} onChange={(e) => setSelectedY(e.target.value)}>
              <option value="">-- حساب التكرار التلقائي --</option>
              {allColumns.filter(c => c.type === 'numeric').map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-600 block">نوع المخطط المتوافق</label>
            <select className="w-full border rounded-lg p-2 text-sm bg-white border-gray-300" value={chartType} onChange={(e) => setChartType(e.target.value)}>
              {compatibleCharts.map(ch => <option key={ch.value} value={ch.value}>{ch.label}</option>)}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-600 block">عنوان المخطط</label>
            <input type="text" className="w-full border rounded-lg p-2 text-sm border-gray-300" placeholder="اكتب عنواناً..." value={chartTitle} onChange={(e) => setChartTitle(e.target.value)} />
          </div>

          {/* نظام تلوين الأقسام والأعمدة المطور */}
          <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 space-y-2">
            <label className="text-xs font-bold text-[#054239] flex items-center gap-1"><Palette className="w-4 h-4"/> نظام تلوين الأقسام والأعمدة</label>
            <div className="grid grid-cols-3 gap-1">
              <button type="button" onClick={() => setColorMode('single')} className={`py-1 text-[10px] font-bold rounded border ${colorMode === 'single' ? 'bg-[#054239] text-white' : 'bg-white text-gray-600'}`}>لون موحد</button>
              <button type="button" onClick={() => setColorMode('multi')} className={`py-1 text-[10px] font-bold rounded border ${colorMode === 'multi' ? 'bg-[#054239] text-white' : 'bg-white text-gray-600'}`}>أوتوماتيكي</button>
              <button type="button" onClick={() => setColorMode('manual')} className={`py-1 text-[10px] font-bold rounded border ${colorMode === 'manual' ? 'bg-[#054239] text-white' : 'bg-white text-gray-600'}`}>بيدي 🎨</button>
            </div>

            {colorMode === 'single' && (
              <div className="flex gap-2 items-center mt-2">
                <input type="color" className="w-10 h-8 border rounded cursor-pointer" value={themeColor} onChange={(e) => setThemeColor(e.target.value)} />
                <span className="text-xs text-gray-700 uppercase font-mono font-bold">{themeColor}</span>
              </div>
            )}

            {colorMode === 'manual' && uniqueCategories.length > 0 && (
              <div className="mt-2 space-y-2 max-h-40 overflow-y-auto border-t pt-2 custom-scrollbar">
                <label className="text-[11px] font-bold text-gray-500 block mb-1">اختر لون كل قسم بيدك:</label>
                {uniqueCategories.map(cat => (
                  <div key={cat} className="flex items-center justify-between bg-white p-1.5 rounded border border-gray-200">
                    <span className="text-xs font-medium text-gray-700 truncate max-w-[140px]">{cat}</span>
                    <input 
                      type="color" 
                      className="w-8 h-6 border rounded cursor-pointer" 
                      value={(customCategoryColors && customCategoryColors[cat]) || '#428177'} 
                      onChange={(e) => handleColorChange(cat, e.target.value)} 
                    />
                  </div>
                ))}
              </div>
            )}
            {colorMode === 'manual' && !selectedX && (
              <span className="text-[11px] text-amber-600 block mt-1">يرجى اختيار المحور الأساسي X أولاً لتعديل ألوانه.</span>
            )}
          </div>

          {/* الخط والأبعاد الهندسي */}
          <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 space-y-3">
            <label className="text-xs font-bold text-[#054239] flex items-center gap-1"><Sliders className="w-4 h-4"/> الخط والأبعاد الهندسية</label>
            
            <div className="space-y-1">
              <div className="flex justify-between items-center mb-1">
                <label className="text-[11px] font-bold text-gray-500 block">نوع الخط العربي/العالمي</label>
                <button 
                  type="button"
                  onClick={() => setShowFontInput(!showFontInput)}
                  className="text-[10px] font-bold text-[#428177] hover:text-[#054239] flex items-center gap-0.5"
                >
                  <Plus className="w-3 h-3" /> خط من Google؟
                </button>
              </div>

              {showFontInput ? (
                <div className="flex gap-1 mb-2 bg-white p-1.5 rounded border border-gray-200 shadow-inner">
                  <input 
                    type="text" 
                    className="flex-1 text-xs p-1 border rounded bg-gray-50 font-mono" 
                    placeholder="مثال: Amiri أو Changa" 
                    value={newFontName}
                    onChange={(e) => setNewFontName(e.target.value)}
                  />
                  <button 
                    type="button" 
                    onClick={handleSaveCustomFont}
                    className="p-1 bg-[#054239] text-white rounded hover:bg-[#002623]"
                    title="حفظ الخط وتطبيقه"
                  >
                    <Check className="w-3 h-3" />
                  </button>
                </div>
              ) : null}

              <select className="w-full border rounded-md p-1.5 text-xs bg-white border-gray-300" value={fontFamily} onChange={(e) => setFontFamily(e.target.value)}>
                {allFontOptions.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-gray-500 block">حجم الخط الأساسي ({fontSize}px)</label>
              <input type="range" min="10" max="22" className="w-full accent-[#054239]" value={fontSize} onChange={(e) => setFontSize(parseInt(e.target.value))} />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-gray-500 block">العرض الكلي</label>
                <select className="w-full border rounded-md p-1.5 text-xs bg-white border-gray-300" value={chartWidth} onChange={(e) => setChartWidth(e.target.value)}>
                  <option value="w-full">كامل (100%)</option>
                  <option value="md:col-span-1">نصف المساحة</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-gray-500 block">الارتفاع المكتبي</label>
                <select className="w-full border rounded-md p-1.5 text-xs bg-white border-gray-300" value={chartHeight} onChange={(e) => setChartHeight(e.target.value)}>
                  <option value="250px">قصير (250px)</option>
                  <option value="350px">متوسط (350px)</option>
                  <option value="450px">طويل (450px)</option>
                </select>
              </div>
            </div>

            {(chartType === 'bar' || chartType === 'horizontal_bar') && (
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-gray-500 block">سماكة الأعمدة البيانية ({barWidth}%)</label>
                <input type="range" min="10" max="90" step="5" className="w-full accent-[#428177]" value={barWidth} onChange={(e) => setBarWidth(parseInt(e.target.value))} />
              </div>
            )}
          </div>

          {/* 💡 [جديد]: تبديل أزرار الحفظ والإضافة ديناميكياً تبعاً لحالة النظام */}
          {editingChart ? (
            <div className="grid grid-cols-2 gap-2 mt-2">
              <button 
                type="button"
                onClick={onUpdateChart} 
                className="w-full bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold py-2.5 rounded-lg transition-colors shadow-sm"
              >
                💾 حفظ تعديلات المخطط
              </button>
              <button 
                type="button"
                onClick={onCancelEdit} 
                className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs font-bold py-2.5 rounded-lg transition-colors"
              >
                إلغاء التعديل
              </button>
            </div>
          ) : (
            <button 
              type="button"
              onClick={onAddChart} 
              className="w-full bg-[#054239] hover:bg-[#002623] text-white text-sm font-bold py-2.5 rounded-lg transition-colors shadow-sm mt-2"
            >
              ➕ إضافة المخطط إلى اللوحة
            </button>
          )}
        </div>
      )}
    </aside>
  );
}