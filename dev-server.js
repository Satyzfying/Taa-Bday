const http = require("http");
const fs = require("fs");
const path = require("path");
const { URL } = require("url");

const host = "127.0.0.1";
const port = Number(process.env.PORT || 4173);
const rootDir = __dirname;
const clients = new Set();
const watchers = new Map();

const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".mp3": "audio/mpeg",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".woff": "font/woff",
  ".woff2": "font/woff2"
};

const liveReloadClient = `
<script>
  (() => {
    const protocol = location.protocol === "https:" ? "https" : "http";
    const source = new EventSource(protocol + "://" + location.host + "/__livereload");

    source.addEventListener("change", (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.extension === ".css") {
          document.querySelectorAll('link[rel="stylesheet"]').forEach((link) => {
            const url = new URL(link.href, location.href);
            if (url.pathname.endsWith(payload.path)) {
              url.searchParams.set("v", String(Date.now()));
              link.href = url.toString();
            }
          });
          return;
        }
      } catch (error) {
        console.warn("Live reload payload error", error);
      }

      location.reload();
    });

    source.onerror = () => {
      source.close();
      setTimeout(() => location.reload(), 1000);
    };
  })();
</script>
`;

function sendEvent(data) {
  const payload = `event: change\ndata: ${JSON.stringify(data)}\n\n`;
  clients.forEach((response) => response.write(payload));
}

function watchDirectory(dirPath) {
  if (watchers.has(dirPath)) return;

  try {
    const watcher = fs.watch(dirPath, (eventType, filename) => {
      if (!filename) return;
      const changedPath = path.join(dirPath, filename.toString());

      fs.stat(changedPath, (error, stats) => {
        if (!error && stats.isDirectory()) {
          watchTree(changedPath);
          return;
        }

        if (error && error.code !== "ENOENT") return;

        const relativePath = `/${path.relative(rootDir, changedPath).replace(/\\\\/g, "/")}`;
        const extension = path.extname(changedPath).toLowerCase();
        if (!relativePath.startsWith("/")) return;
        sendEvent({ eventType, extension, path: relativePath });
      });
    });

    watchers.set(dirPath, watcher);
  } catch (error) {
    console.error(`Watch error for ${dirPath}:`, error.message);
  }
}

function watchTree(startDir) {
  watchDirectory(startDir);
  const entries = fs.readdirSync(startDir, { withFileTypes: true });
  entries
    .filter((entry) => entry.isDirectory())
    .forEach((entry) => watchTree(path.join(startDir, entry.name)));
}

function serveFile(filePath, response) {
  fs.readFile(filePath, (error, content) => {
    if (error) {
      response.writeHead(error.code === "ENOENT" ? 404 : 500, { "Content-Type": "text/plain; charset=utf-8" });
      response.end(error.code === "ENOENT" ? "Not found" : "Server error");
      return;
    }

    const extension = path.extname(filePath).toLowerCase();
    const contentType = mimeTypes[extension] || "application/octet-stream";

    if (extension === ".html") {
      const html = content.toString("utf8").replace("</body>", `${liveReloadClient}</body>`);
      response.writeHead(200, { "Content-Type": contentType, "Cache-Control": "no-store" });
      response.end(html);
      return;
    }

    response.writeHead(200, { "Content-Type": contentType, "Cache-Control": "no-store" });
    response.end(content);
  });
}

const server = http.createServer((request, response) => {
  const requestUrl = new URL(request.url, `http://${request.headers.host}`);
  const pathname = decodeURIComponent(requestUrl.pathname);

  if (pathname === "/__livereload") {
    response.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-store",
      Connection: "keep-alive"
    });
    response.write("\n");
    clients.add(response);
    request.on("close", () => clients.delete(response));
    return;
  }

  const requestedPath = pathname === "/" ? "/index.html" : pathname;
  const safePath = path.normalize(requestedPath).replace(/^(\.\.[/\\])+/, "");
  const filePath = path.join(rootDir, safePath);

  if (!filePath.startsWith(rootDir)) {
    response.writeHead(403, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Forbidden");
    return;
  }

  serveFile(filePath, response);
});

watchTree(rootDir);

server.listen(port, host, () => {
  console.log(`Live preview ready at http://${host}:${port}`);
});
