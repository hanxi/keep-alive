import React from "react";
import { HashRouter, Routes, Route, Link } from "react-router-dom";
import PlaylistExporter from "./App";
import PlaylistMerge from "./PlaylistMerge";

export default function MainApp() {
  return (
    <HashRouter>
      <div className="w-full flex gap-4 p-2 bg-gray-100">
        <Link to="/" className="text-blue-600 font-bold hover:underline">
          歌单导出
        </Link>
        <Link to="/merge" className="text-blue-600 font-bold hover:underline">
          合并歌单
        </Link>
      </div>
      <Routes>
        <Route path="/" element={<PlaylistExporter />} />
        <Route path="/merge" element={<PlaylistMerge />} />
      </Routes>
    </HashRouter>
  );
}
