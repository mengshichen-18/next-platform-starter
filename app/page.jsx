// app/page.jsx
'use client';

import { useState } from 'react';
import { saveAs } from 'file-saver';

export default function Page() {
  const [files, setFiles] = useState([]);
  const [results, setResults] = useState([]);
  const [loadingIndex, setLoadingIndex] = useState(null);

  const handleAddFiles = (e) => {
    const selected = Array.from(e.target.files);
    setFiles(prev => [...prev, ...selected]);
  };

  const handleRemoveLast = () => {
    setFiles(prev => prev.slice(0, -1));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setResults([]);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setLoadingIndex(i);
      const formData = new FormData();
      formData.append('file', file);

      const [code, year] = file.name.split('.')[0].split('_');
      try {
        const res = await fetch('/api/score', {
          method: 'POST',
          body: formData,
        });
        if (!res.ok) throw new Error('API 错误');
        const result = await res.json();
        setResults(prev => [...prev, { code, year, scores: result }]);
      } catch (err) {
        setResults(prev => [...prev, { code, year, scores: null }]);
      }
    }
    setLoadingIndex(null);
  };

  const downloadCSV = () => {
    if (!results.length) return;
    const headers = ['企业代码', '年份', ...Object.keys(results[0].scores || {})];
    const rows = results.map(r => [r.code, r.year, ...(r.scores ? Object.values(r.scores) : [])]);
    const csv = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
    saveAs(blob, 'score.csv');
  };

  return (
    <div className="max-w-5xl mx-auto py-10 px-4">
      <h1 className="text-2xl font-bold mb-6">大模型评分助手</h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <label className="flex flex-col">
          <span className="font-medium">上传文件</span>
          <input
            type="file"
            accept=".txt"
            multiple
            onChange={handleAddFiles}
            className="border p-2 rounded"
          />
        </label>

        {files.map((file, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <span>{file.name}</span>
            {files.length > 1 && idx === files.length - 1 && (
              <button
                type="button"
                onClick={handleRemoveLast}
                className="text-sm text-red-600 underline"
              >
                删除
              </button>
            )}
          </div>
        ))}

        <button
          type="submit"
          disabled={loadingIndex !== null}
          className={`py-2 px-4 rounded ${loadingIndex !== null ? 'bg-gray-400 cursor-not-allowed text-white' : 'bg-green-400 hover:bg-green-700 text-white'}`}
        >
          {loadingIndex !== null ? `评分中（第 ${loadingIndex + 1} 个）...` : '提交评分请求'}
        </button>
      </form>

      {results.length > 0 && (
        <div className="mt-6 overflow-x-auto">
          <h2 className="text-lg font-semibold mb-2">评分结果</h2>
          <table className="table-auto border border-collapse min-w-full">
            <thead>
              <tr>
                <th className="border px-4 py-2">企业代码</th>
                <th className="border px-4 py-2">年份</th>
                {results[0] && results[0].scores &&
                  Object.keys(results[0].scores).map((key, idx) => (
                    <th key={idx} className="border px-4 py-2">{key}</th>
                  ))}
              </tr>
            </thead>
            <tbody>
              {results.map((r, rowIdx) => (
                <tr key={rowIdx}>
                  <td className="border px-4 py-2 text-center">{r.code}</td>
                  <td className="border px-4 py-2 text-center">{r.year}</td>
                  {r.scores &&
                    Object.values(r.scores).map((val, colIdx) => (
                      <td key={colIdx} className="border px-4 py-2 text-center">{val}</td>
                    ))}
                </tr>
              ))}
            </tbody>
          </table>

          <button
            onClick={downloadCSV}
            className="mt-4 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded"
          >
            下载评分结果（CSV）
          </button>
        </div>
      )}
    </div>
  );
}
