import React from 'react';
import { Upload } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

export default function FileUpload({ onUploadSuccess, loading, fileName }) {
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`${API_URL}/api/upload`, {  // ✅ await + const
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      if (result.status === 'success') {
        onUploadSuccess(result);
      } else {
        alert(result.detail || 'حدث خطأ أثناء رفع الملف');
      }
    } catch (error) {
      alert('فشل الاتصال بالسيرفر، تأكد من تشغيل FastAPI');
    }
  };

  return (
    <div className="max-w-2xl mx-auto mt-20 bg-white border-2 border-dashed border-[#428177] rounded-2xl p-10 text-center shadow-md">
      <Upload className="w-16 h-16 text-[#054239] mx-auto mb-4 animate-pulse" />
      <h3 className="text-lg font-bold text-[#002623] mb-2">رفع ملف البيانات الخاص بك</h3>
      <p className="text-sm text-gray-500 mb-6">يدعم النظام ملفات Excel (.xlsx) أو CSV لتوليد المخططات الهرمية</p>
      
      <label className="bg-[#054239] hover:bg-[#002623] text-white px-6 py-3 rounded-xl font-bold text-sm shadow-md cursor-pointer transition-all inline-block">
        {loading ? 'جاري معالجة الملف...' : 'اختر ملفاً من جهازك'}
        <input type="file" accept=".csv, .xlsx, .xls" className="hidden" onChange={handleFileChange} disabled={loading} />
      </label>
      {fileName && <p className="mt-3 text-xs text-[#8e7b5b] font-medium">{fileName}</p>}
    </div>
  );
}