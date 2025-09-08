import React, { useState } from "react";

// 高亮 json 的简单函数
function syntaxHighlight(json) {
  if (!json) return "";
  json = json.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return json.replace(
    /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
    function (match) {
      let cls = "number";
      if (/^"/.test(match)) {
        if (/:$/.test(match)) cls = "key";
        else cls = "string";
      } else if (/true|false/.test(match)) cls = "boolean";
      else if (/null/.test(match)) cls = "null";
      return `<span class="${cls}">${match}</span>`;
    }
  );
}

export default function PlaylistMerge() {
  const [files, setFiles] = useState([]); // {name, content}
  const [error, setError] = useState("");
  const [merging, setMerging] = useState(false);
  const [merged, setMerged] = useState(""); // 合并结果 json 字符串
  const [copyTip, setCopyTip] = useState(""); // 复制提示

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

  // 合并逻辑，结果显示在文本框
  function mergePlaylists() {
    setMerging(true);
    setError("");
    try {
      const all = [];
      for (const f of files) {
        let arr = [];
        if (Array.isArray(f.data)) arr = f.data;
        else if (typeof f.data === "object") arr = [f.data];
        else continue;
        all.push(...arr);
      }
      const mergedStr = JSON.stringify(all, null, 2);
      setMerged(mergedStr);
    } catch (e) {
      setError("合并失败：" + (e.message || e));
    }
    setMerging(false);
  }

  // 导出下载
  function exportMerged() {
    if (!merged) return;
    const blob = new Blob([merged], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "merged-playlists.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  // 复制到剪贴板
  async function copyToClipboard() {
    if (!merged) return;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      try {
        await navigator.clipboard.writeText(merged);
        setCopyTip("已复制到剪贴板");
      } catch {
        setCopyTip("复制失败");
      }
    } else {
      // 兼容性降级：用 textarea 复制
      try {
        const textarea = document.createElement("textarea");
        textarea.value = merged;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
        setCopyTip("已复制到剪贴板");
      } catch {
        setCopyTip("复制失败");
      }
    }
    setTimeout(() => setCopyTip(""), 1500);
  }

  function removeFile(idx) {
    setFiles(files.filter((_, i) => i !== idx));
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center px-2 pt-6">
      <div
        className="
        w-full
        max-w-screen-lg
        mx-auto
        p-4
        bg-white
        shadow
        rounded
        space-y-6
        sm:p-6
        sm:space-y-8
      "
        style={{
          marginTop: 0,
          minWidth: "320px",
        }}
      >
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
        <div className="flex gap-2">
          <button
            className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50 text-base sm:text-lg"
            disabled={files.length === 0 || merging}
            onClick={mergePlaylists}
          >
            {merging ? "合并中..." : "合并"}
          </button>
          <button
            className="flex-1 bg-green-600 text-white py-2 rounded hover:bg-green-700 disabled:opacity-50 text-base sm:text-lg"
            disabled={!merged}
            onClick={exportMerged}
          >
            导出
          </button>
          <button
            className="flex-1 bg-gray-700 text-white py-2 rounded hover:bg-gray-800 disabled:opacity-50 text-base sm:text-lg"
            disabled={!merged}
            onClick={copyToClipboard}
          >
            复制
          </button>
        </div>
        {/* 语法高亮文本框显示合并结果 */}
        {merged && (
          <div className="mt-4">
            <label className="block mb-1 font-medium">合并结果预览</label>
            <pre
              className="overflow-auto rounded bg-gray-900 text-gray-100 p-3 text-xs sm:text-sm"
              style={{
                maxHeight: 400,
                fontSize: "14px",
                whiteSpace: "pre-wrap",
                wordBreak: "break-all",
              }}
              dangerouslySetInnerHTML={{
                __html: syntaxHighlight(merged)
              }}
            />
            {/* 简单样式，实际建议用 prismjs/highlight.js */}
            <style>{`
              .string { color: #ce9178;}
              .number { color: #b5cea8;}
              .boolean { color: #569cd6;}
              .null { color: #569cd6;}
              .key { color: #9cdcfe;}
            `}</style>
            {copyTip && (
              <div className="mt-2 text-green-600 text-sm font-semibold">{copyTip}</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
