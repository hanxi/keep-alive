import React, { useEffect, useState } from "react";

export default function PlaylistExporter() {
  const [platforms, setPlatforms] = useState([]);
  const [selected, setSelected] = useState("");
  const [hint, setHint] = useState([]);
  const [urlLike, setUrlLike] = useState("");
  const [fileNameBase, setFileNameBase] = useState("网络歌单");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/platforms")
      .then((res) => res.json())
      .then((list) => {
        setPlatforms(list);
        if (list.length) {
          setSelected(list[0].name);
          setHint(list[0].hints);
        }
      });
  }, []);

  useEffect(() => {
    const item = platforms.find((p) => p.name === selected);
    if (item) setHint(item.hints);
  }, [selected, platforms]);

  const inputPlaceholder =
    platforms.find((p) => p.name === selected)?.hints[0] ||
    "请输入歌单链接、ID或酷狗码";

  async function handleExport() {
    if (!selected || !urlLike) return;
    setLoading(true);
    try {
      const name = fileNameBase || "网络歌单";
      const res = await fetch("/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform: selected, urlLike, name }),
      });
      if (!res.ok) throw new Error(await res.text());
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = name + ".json";
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      alert("导出失败：" + (e.message || e));
    }
    setLoading(false);
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
          歌单导出工具
        </h2>
        <div>
          <label className="block mb-1 font-medium">选择平台</label>
          <select
            className="w-full border rounded px-3 py-2"
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
          >
            {platforms.map((p) => (
              <option value={p.name} key={p.name}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
        {/* 美化后的提示区域（不含图标） */}
        <div className="text-sm text-blue-700 bg-blue-50 border-l-4 border-blue-400 rounded px-3 py-2 flex flex-col gap-2">
          {hint && hint.length > 0 ? (
            hint.map((msg, idx) => (
              <div key={idx} className="flex items-start gap-2">
                <span className="font-bold text-blue-500">•</span>
                <span>{msg}</span>
              </div>
            ))
          ) : (
            <span>暂无提示</span>
          )}
        </div>
        <div>
          <label className="block mb-1 font-medium">歌单链接/ID/酷狗码</label>
          <input
            className="w-full border rounded px-3 py-2"
            placeholder={inputPlaceholder}
            value={urlLike}
            onChange={(e) => setUrlLike(e.target.value)}
          />
        </div>
        <div>
          <label className="block mb-1 font-medium">导出文件名</label>
          <div className="flex items-center gap-1">
            <input
              className="w-full border rounded px-3 py-2"
              placeholder="playlist"
              value={fileNameBase}
              onChange={(e) => setFileNameBase(e.target.value.replace(/\.json$/i, ""))}
            />
            <span className="text-gray-600 text-base select-none">.json</span>
          </div>
          <span className="text-xs text-gray-500">只填文件名，不需要加后缀，系统自动补全 .json</span>
        </div>
        <button
          className="
            w-full
            bg-blue-600
            text-white
            py-2
            rounded
            hover:bg-blue-700
            disabled:opacity-50
            text-base
            sm:text-lg
          "
          onClick={handleExport}
          disabled={loading || !urlLike}
        >
          {loading ? "导出中..." : "导出歌单"}
        </button>
      </div>
    </div>
  );
}
