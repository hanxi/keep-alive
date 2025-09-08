import { serve } from "bun";
import { readdirSync } from "fs";
import path from "path";

// 歌曲平台模块目录
const MUSIC_FREE_DIR = path.resolve("Music_Free");

async function loadPlatforms() {
  const files = readdirSync(MUSIC_FREE_DIR).filter(f => f.endsWith(".js"));
  const platforms = [];
  for (const file of files) {
    try {
      const mod = await import(path.resolve(MUSIC_FREE_DIR, file));
      platforms.push({
        name: mod.default.platform,
        hints: mod.default.hints?.importMusicSheet || [],
        importMusicSheet: mod.default.importMusicSheet,
        module: mod.default,
      });
    } catch (e) {
      console.error(`Failed to load platform module: ${file} ${e}`);
    }
  }
  return platforms;
}

// 缓存平台列表
let platformList: any[] = [];
await loadPlatforms().then(list => platformList = list);

function getPlatform(name: string) {
  return platformList.find(p => p.name === name);
}

// 简易 JSON body parser
async function parseJsonBody(req: Request) {
  try {
    return await req.json();
  } catch {
    return {};
  }
}

let platformShort: map<string, string> = {
  "小枸音乐": "kg",
  "小蜜音乐": "migu",
  "小秋音乐": "tx",
  "小蜗音乐": "kw",
  "小芸音乐": "wy",
};


// 从环境变量读取端口，默认 53000
const PORT = process.env.PORT || 53000;

serve({
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url);

    // 获取平台列表
    if (url.pathname === "/platforms" && req.method === "GET") {
      if (!platformList.length) platformList = await loadPlatforms();
      return new Response(
        JSON.stringify(platformList.map(p => ({
          name: p.name,
          hints: p.hints,
        }))),
        { headers: { "Content-Type": "application/json" } }
      );
    }

    // 导出歌单
    if (url.pathname === "/export" && req.method === "POST") {
      const { platform, urlLike, name } = await parseJsonBody(req);
      const p = getPlatform(platform);
      if (!p) {
        return new Response(JSON.stringify({ error: "平台不存在" }), {
          status: 400,
          headers: { "Content-Type": "application/json" }
        });
      }
      try {
        const res = await p.importMusicSheet(urlLike);
        const platform_code = platformShort[platform];
        let musics = [];
        for (const item of res) {
          const id = item.songmid || item.id;
          musics.push({
            name: `${item.artist}-${item.title}`,
            url: `https://lxmusicapi.onrender.com/url/${platform_code}/${id}/320k`,
            headers: {
              "X-Request-Key": "share-v2"
            }
          });
        }
        const result = {
          name: name,
          musics: musics
        }
        return new Response(JSON.stringify(result, null, 2), {
          headers: {
            "Content-Type": "application/json",
            "Content-Disposition": "attachment; filename=playlist.json"
          }
        });
      } catch (e: any) {
        return new Response(JSON.stringify({ error: "导出失败", detail: String(e) }), {
          status: 500,
          headers: { "Content-Type": "application/json" }
        });
      }
    }

    // 静态文件服务
    if (url.pathname === "/" && req.method === "GET") {
      return new Response(Bun.file("public/index.html"));
    }
    if (url.pathname.startsWith("/tailwind.css") && req.method === "GET") {
      return new Response(Bun.file("public/tailwind.css"));
    }
    if (url.pathname.startsWith("/main.js") && req.method === "GET") {
      return new Response(Bun.file("public/main.js"));
    }

    return new Response("Not Found", { status: 404 });
  }
});
