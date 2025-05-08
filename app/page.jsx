'use client';

import { useState } from 'react';

let API_key = "sk-0ad6d4515579467f861e113efe4c6f43";

export default function Page() {
    const [file, setFile] = useState(null);
    const [text, setText] = useState('');
    const [resultUrl, setResultUrl] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        const formData = new FormData();
        if (file) formData.append('file', file);
        formData.append('text', text);

        setLoading(true);
        setResultUrl('');

        try {
            const res = await fetch('/api/score', {
                method: 'POST',
                body: formData,
            });
            if (!res.ok) throw new Error("API error");
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            setResultUrl(url);
        } catch (err) {
            alert('提交失败: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleClearFile = () => {
        setFile(null);
        document.getElementById('file-input').value = ''; // 清除 <input type="file">
    };

    return (
        <div className="max-w-xl mx-auto py-10 px-4">
            <h1 className="text-2xl font-bold mb-6">大模型评分助手</h1>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <label className="flex flex-col">
                    <span className="font-medium">上传文件（可选）</span>
                    <div className="flex items-center gap-2">
                        <input
                            id="file-input"
                            type="file"
                            accept=".txt,.pdf,.docx"
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

                <label className="flex flex-col">
                    <span className="font-medium">输入补充文本（可选）</span>
                    <textarea
                        rows="4"
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder="输入对文件的说明、补充、问题等"
                        className="border p-2 rounded"
                    />
                </label>

                <button
                    type="submit"
                    disabled={loading}
                    className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
                >
                    {loading ? "提交中..." : "提交评分请求"}
                </button>
            </form>

            {resultUrl && (
                <div className="mt-6">
                    <p className="mb-2">评分结果已生成：</p>
                    <a
                        href={resultUrl}
                        download="score.json"
                        className="text-blue-600 underline"
                    >
                        点击下载结果文件
                    </a>
                </div>
            )}
        </div>
    );
}
