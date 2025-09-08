import React, { useState } from "react";

export default function PlaylistMerge() {
  const [files, setFiles] = useState([]); // {name, content}
  const [error, setError] = useState("");
  const [merging, setMerging] = useState(false);

  // 处理文件选择/拖拽
  async function handleFiles(fileList) {
    setError("");
    const arr = [];
    for (const file of fileList) {
      if (!file.name.endsWith(".json")) {
        setError("只支持 JSON 文件");
        return;
      }
      try {
        const text = await file.text();
        const parsed = JSON.parse(text);
        arr.push({ name: file.name, data: parsed });
      } catch {
        setError(`${file.name} 不是有效的 JSON`);
        return;
      }
    }
    setFiles((prev) => [...prev, ...arr]);
  }

  // 拖拽上传
  function onDrop(e) {
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
  }

  // 合并逻辑
  function mergePlaylists() {
    setMerging(true);
    try {
      // [{name, data}]，data为数组或对象
      const all = [];
      for (const f of files) {
        let arr = [];
        if (Array.isArray(f.data)) arr = f.data;
        else if (typeof f.data === "object") arr = [f.data];
        else continue;
        all.push(...arr);
      }
      // 合并成一个数组
      const merged = JSON.stringify(all, null, 2);
      const blob = new Blob([merged], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "merged-playlists.json";
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError("合并失败：" + (e.message || e));
    }
    setMerging(false);
  }

  function removeFile(idx) {
    setFiles(files.filter((_, i) => i !== idx));
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center px-2 pt-6">
      <div className="w-full max-w-md mx-auto p-4 bg-white shadow rounded space-y-6 sm:p-6 sm:space-y-8">
        <h2 className="text-lg sm:text-xl font-bold mb-2 text-center">
          合并歌单工具
        </h2>
        <div
          className="border-2 border-dashed border-blue-400 bg-blue-50 rounded p-4 flex flex-col items-center cursor-pointer transition hover:bg-blue-100"
          onDrop={onDrop}
          onDragOver={e => e.preventDefault()}
        >
          <span className="text-blue-600 mb-2">拖入或选择多个 .json 歌单文件</span>
          <input
            type="file"
            multiple
            accept=".json"
            className="hidden"
            id="file-input"
            onChange={e => handleFiles(e.target.files)}
          />
          <label
            htmlFor="file-input"
            className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700 cursor-pointer"
          >
            选择文件
          </label>
        </div>
        {files.length > 0 && (
          <div className="bg-gray-100 rounded p-3">
            <div className="font-bold mb-2">已上传文件：</div>
            <ul className="space-y-1">
              {files.map((f, i) => (
                <li key={i} className="flex items-center gap-2 text-xs sm:text-sm">
                  <span>{f.name}</span>
                  <button
                    className="text-red-500 px-2 py-0 rounded hover:bg-red-100"
                    onClick={() => removeFile(i)}
                  >移除</button>
                </li>
              ))}
            </ul>
          </div>
        )}
        {error && (
          <div className="text-red-600 bg-red-50 border-l-4 border-red-400 rounded px-3 py-2">
            {error}
          </div>
        )}
        <button
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50 text-base sm:text-lg"
          disabled={files.length === 0 || merging}
          onClick={mergePlaylists}
        >
          {merging ? "合并中..." : "合并并导出"}
        </button>
      </div>
    </div>
  );
}
