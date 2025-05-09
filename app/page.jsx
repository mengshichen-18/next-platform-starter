// app/page.jsx
'use client';

import { useState } from 'react';
import { saveAs } from 'file-saver';

export default function Page() {
  const [files, setFiles] = useState([]);
  const [results, setResults] = useState([]);
  const [loadingIndex, setLoadingIndex] = useState(null);
  const [customUrl, setCustomUrl] = useState('');
  const [customKey, setCustomKey] = useState('');
  const [customModel, setCustomModel] = useState('');
  const [activeMode, setActiveMode] = useState(null); // 'default' or 'custom'

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
    setActiveMode('default');

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
    setActiveMode(null);
  };

  const handleCustomLLM = async () => {
    if (!customKey || !customUrl || !customModel || files.length === 0) {
      alert('请填写 API Key、URL 和模型名，并上传至少一个文件');
      return;
    }

    setResults([]);
    setActiveMode('custom');
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setLoadingIndex(i);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('url', customUrl);
      formData.append('key', customKey);
      formData.append('model', customModel);

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
    setActiveMode(null);
  };

  const downloadCSV = () => {
    if (!results.length) return;
    const headers = ['企业代码', '年份', ...Object.keys(results[0].scores || {})];
    const rows = results.map(r => [r.code, r.year, ...(r.scores ? Object.values(r.scores) : [])]);
    const csv = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
    saveAs(blob, 'score.csv');
  };

  const buttonClass = `py-2 px-4 rounded w-full ${loadingIndex !== null ? 'bg-gray-400 cursor-not-allowed text-white' : 'bg-green-500 hover:bg-green-700 text-white'} cursor-pointer`;

  return (
    <div className="max-w-5xl mx-auto py-10 px-4">
      <h1 className="text-2xl font-bold mb-6">大模型评分助手（默认使用DeepSeek-V3模型）</h1>

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
          className={buttonClass}
        >
          {activeMode === 'default' && loadingIndex !== null ? `评分中（第 ${loadingIndex + 1} 个）...` : '提交评分请求'}
        </button>
      </form>

      <div className="mt-8">
        <h3 className="font-medium mb-2">或使用自定义 LLM（支持 DeepSeek/Qwen等OpenAI框架的LLM API）</h3>
        <input
          type="text"
          placeholder="模型 API 地址"
          value={customUrl}
          onChange={(e) => setCustomUrl(e.target.value)}
          className="border p-2 rounded w-full mb-2"
        />
        <input
          type="text"
          placeholder="你的 API Key"
          value={customKey}
          onChange={(e) => setCustomKey(e.target.value)}
          className="border p-2 rounded w-full mb-2"
        />
        <input
          type="text"
          placeholder="模型名称（如 deepseek-chat 或 qwen-long）"
          value={customModel}
          onChange={(e) => setCustomModel(e.target.value)}
          className="border p-2 rounded w-full mb-4"
        />
        <button
          onClick={handleCustomLLM}
          disabled={loadingIndex !== null}
          className={buttonClass}
        >
          {activeMode === 'custom' && loadingIndex !== null ? `评分中（第 ${loadingIndex + 1} 个）...` : '使用自定义模型评分'}
        </button>
      </div>

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
            className="mt-4 bg-green-400 hover:bg-green-700 text-white py-2 px-4 rounded"
          >
            下载评分结果（CSV）
          </button>
        </div>
      )}
    </div>
  );
}
