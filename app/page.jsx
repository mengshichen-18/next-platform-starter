// app/page.jsx
'use client';

import { useState } from 'react';
import { saveAs } from 'file-saver';

export default function Page() {
  const [file, setFile] = useState(null);
  const [scores, setScores] = useState(null);
  const [loading, setLoading] = useState(false);
  const [meta, setMeta] = useState({ code: '', year: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return alert('请上传一个文件');

    const formData = new FormData();
    formData.append('file', file);

    // 提取文件名中信息：000001_2023.txt -> 000001, 2023
    const [code, year] = file.name.split('.')[0].split('_');
    setMeta({ code, year });

    setLoading(true);
    setScores(null);

    try {
      const res = await fetch('/api/score', {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) throw new Error('API 错误');

      const resultObj = await res.json();
      console.log('评分结果:', resultObj);

      const results = Object.entries(resultObj).map(([dimension, score]) => ({
        dimension,
        score,
      }));
      setScores(results);
    } catch (err) {
      alert('评分失败: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClearFile = () => {
    setFile(null);
    document.getElementById('file-input').value = '';
  };

  const downloadCSV = () => {
    if (!scores) return;
    const { code, year } = meta;
    const header = ['企业代码', '年份', ...scores.map(r => r.dimension)].join(',');
    const row = [code, year, ...scores.map(r => r.score)].join(',');
    const csv = `${header}\n${row}`;
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
    saveAs(blob, 'score.csv');
  };

  return (
    <div className="max-w-4xl mx-auto py-10 px-4">
      <h1 className="text-2xl font-bold mb-6">大模型评分助手</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <label className="flex flex-col">
          <span className="font-medium">上传文件</span>
          <div className="flex items-center gap-2">
            <input
              id="file-input"
              type="file"
              accept=".txt"
              onChange={(e) => setFile(e.target.files[0])}
              className="border p-2 rounded flex-1"
            />
            {file && (
              <button
                type="button"
                onClick={handleClearFile}
                className="text-sm text-red-600 underline"
              >
                清除
              </button>
            )}
          </div>
        </label>

        <button
          type="submit"
          disabled={loading}
          className={`py-2 px-4 rounded ${loading ? 'bg-gray-400 cursor-not-allowed text-white' : 'bg-green-400 hover:bg-green-700 text-white'}`}
        >
          {loading ? '评分中...' : '提交评分请求'}
        </button>
      </form>

      {scores && (
        <div className="mt-6 overflow-x-auto">
          <h2 className="text-lg font-semibold mb-2">评分结果</h2>
          <table className="table-auto border border-collapse min-w-full">
            <thead>
              <tr>
                <th className="border px-4 py-2">企业代码</th>
                <th className="border px-4 py-2">年份</th>
                {scores.map((r, idx) => (
                  <th key={idx} className="border px-4 py-2">{r.dimension}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border px-4 py-2 text-center">{meta.code}</td>
                <td className="border px-4 py-2 text-center">{meta.year}</td>
                {scores.map((r, idx) => (
                  <td key={idx} className="border px-4 py-2 text-center">{r.score}</td>
                ))}
              </tr>
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