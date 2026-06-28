import assert from "node:assert/strict";
import { access, readFile, readdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const here = path.dirname(fileURLToPath(import.meta.url));
const websiteRoot = path.resolve(here, "..");
const repoRoot = path.resolve(here, "..", "..");
const siteRoot = path.join(websiteRoot, "site");
const workerRoot = path.join(websiteRoot, "worker");
const skillRoot = path.join(repoRoot, "skills", "loopy");
const legacySkillRoot = path.join(repoRoot, "skills", "loop-library");

const [
  html,
  learnHtml,
  agentHtml,
  css,
  browserScript,
  dataSource,
  proxySource,
  workerSource,
  loopRoutesSource,
  catalogStoreSource,
  authVotesSource,
  voteStoreSource,
  rendererSource,
  workerPackageSource,
  workerLockSource,
  wranglerSource,
  skillSource,
  skillInterface,
  skillDiscovery,
  skillRun,
  skillDebrief,
  skillPublish,
  legacySkillSource,
  legacySkillRun,
  legacySkillDebrief,
  legacySkillPublish,
  readme,
  agents,
] = await Promise.all([
  readFile(path.join(siteRoot, "index.html"), "utf8"),
  readFile(path.join(siteRoot, "learn", "index.html"), "utf8"),
  readFile(path.join(siteRoot, "agents", "index.html"), "utf8"),
  readFile(path.join(siteRoot, "styles.css"), "utf8"),
  readFile(path.join(siteRoot, "script.js"), "utf8"),
  readFile(path.join(siteRoot, ".herenow", "data.json"), "utf8"),
  readFile(path.join(siteRoot, ".herenow", "proxy.json"), "utf8"),
  readFile(path.join(workerRoot, "src", "index.js"), "utf8"),
  readFile(path.join(workerRoot, "src", "loop-routes.js"), "utf8"),
  readFile(path.join(workerRoot, "src", "catalog-store.js"), "utf8"),
  readFile(path.join(workerRoot, "src", "auth-votes.js"), "utf8"),
  readFile(path.join(workerRoot, "src", "vote-store.js"), "utf8"),
  readFile(path.join(workerRoot, "src", "render-loops.js"), "utf8"),
  readFile(path.join(workerRoot, "package.json"), "utf8"),
  readFile(path.join(workerRoot, "package-lock.json"), "utf8"),
  readFile(path.join(workerRoot, "wrangler.jsonc"), "utf8"),
  readFile(path.join(skillRoot, "SKILL.md"), "utf8"),
  readFile(path.join(skillRoot, "agents", "openai.yaml"), "utf8"),
  readFile(path.join(skillRoot, "references", "discover.md"), "utf8"),
  readFile(path.join(skillRoot, "references", "run.md"), "utf8"),
  readFile(path.join(skillRoot, "references", "debrief.md"), "utf8"),
  readFile(path.join(skillRoot, "references", "publish.md"), "utf8"),
  readFile(path.join(legacySkillRoot, "SKILL.md"), "utf8"),
  readFile(path.join(legacySkillRoot, "references", "run.md"), "utf8"),
  readFile(path.join(legacySkillRoot, "references", "debrief.md"), "utf8"),
  readFile(path.join(legacySkillRoot, "references", "publish.md"), "utf8"),
  readFile(path.join(repoRoot, "README.md"), "utf8"),
  readFile(path.join(repoRoot, "AGENTS.md"), "utf8"),
]);

const workerPackage = JSON.parse(workerPackageSource);
const workerLock = JSON.parse(workerLockSource);
const wrangler = JSON.parse(wranglerSource);
const dataManifest = JSON.parse(dataSource);
const proxyManifest = JSON.parse(proxySource);
const structuredDataMatch = html.match(
  /<script type="application\/ld\+json">\s*([\s\S]*?)\s*<\/script>/,
);

assert(structuredDataMatch, "Homepage structured data is missing.");
const structuredData = JSON.parse(structuredDataMatch[1]);
const collection = structuredData["@graph"].find(
  (item) => item["@type"] === "CollectionPage",
);

// GitHub contains only the shell and application. Published loop records and
// generated public catalog surfaces must remain database-only.
for (const absolutePath of [
  path.join(websiteRoot, "scripts/loop-data.mjs"),
  path.join(websiteRoot, "scripts/build-loop-pages.mjs"),
  path.join(websiteRoot, "scripts/build-skill-catalog.mjs"),
  path.join(websiteRoot, "scripts/build-social-images.mjs"),
  path.join(websiteRoot, "scripts/validate-loop-data.mjs"),
  path.join(siteRoot, "catalog.json"),
  path.join(siteRoot, "catalog.md"),
  path.join(siteRoot, "catalog.txt"),
  path.join(siteRoot, "feed.xml"),
  path.join(siteRoot, "sitemap.xml"),
  path.join(siteRoot, "llms.txt"),
  path.join(skillRoot, "references", "catalog.md"),
]) {
  await assert.rejects(access(absolutePath), undefined, absolutePath);
}

const loopPageFiles = await readdir(path.join(siteRoot, "loops"), {
  recursive: true,
}).catch((error) => {
  if (error.code === "ENOENT") return [];
  throw error;
});
assert.equal(loopPageFiles.filter((name) => name.endsWith(".html")).length, 0);
assert(html.includes("<!-- LOOP_DATABASE_ROWS_START -->"));
assert(html.includes("<!-- LOOP_DATABASE_ROWS_END -->"));
assert(!html.includes('class="loop-row"'));
assert(html.includes('id="results-count" aria-live="polite">显示 0 个 loop'));
assert.equal(collection.mainEntity.numberOfItems, 0);
assert.deepEqual(collection.mainEntity.itemListElement, []);
assert.deepEqual(
  await readdir(path.join(siteRoot, "assets", "social")),
  ["loop-library-20260621-2.png"],
);

// The shell still contains every stable UI, discovery, form, and hosting hook
// that the Worker needs when it injects current database records.
for (const value of [
  'id="library"',
  'id="submit"',
  'id="loop-search"',
  'id="loop-sort"',
  'id="library-pagination"',
  'name="loop-library-form-api"',
  "https://signals.forwardfuture.com/loop-library/catalog.json",
  "https://signals.forwardfuture.com/loop-library/sitemap.xml",
  "https://signals.forwardfuture.com/loop-library/feed.xml",
  "https://here.now/r/signals",
]) {
  assert(html.includes(value), value);
}
assert(html.includes("搜索目录"));
assert(html.includes("按标题、任务或贡献者搜索"));
assert(html.includes('class="search-field"'));
assert(html.includes("styles.css?v=20260623-row-background-v2"));
assert(html.includes("script.js?v=20260625-form-protection"));
assert(css.includes(".search-control-label"));
assert(css.includes(".search-control:hover .search-field"));
assert(css.includes(".search-control:focus-within .search-field"));
assert.match(css, /\.loop-row\s*\{[^}]*background:\s*var\(--surface\);[^}]*\}/);
assert.match(css, /\.loop-table td\s*\{[^}]*background:\s*transparent;[^}]*\}/);
assert.equal((html.match(/data-here-now-credit/g) || []).length, 2);
for (const page of [learnHtml, agentHtml]) {
  assert(page.includes("styles.css?v=20260623-row-background-v2"));
  assert(page.includes("script.js?v=20260625-form-protection"));
}
for (const page of [html, learnHtml, agentHtml]) {
  const brandPosition = page.indexOf('class="brand-lockup"');
  const creditPosition = page.indexOf(
    'class="here-now-credit here-now-credit--header"',
  );
  const navPosition = page.indexOf('class="site-nav"');
  assert(brandPosition < creditPosition && creditPosition < navPosition);
}
assert(
  css.includes("grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);"),
);
assert(learnHtml.includes("Agent loop 如何工作"));
assert(agentHtml.includes("给 AI agent"));
assert(agentHtml.includes("有界执行回执"));
assert(html.includes("查找、设计、运行"));
assert(css.includes(".loop-row"));
assert(css.includes(".sort-control"));
assert(css.includes(".sort-control select.is-pointer-focused:focus"));
assert(browserScript.includes("data-category-filter"));
assert(browserScript.includes('sortSelect.addEventListener("pointerdown"'));
assert(browserScript.includes('sortSelect.addEventListener("keydown"'));
assert(browserScript.includes('sortSelect.addEventListener("blur"'));
assert(html.includes('<option value="newest">最新 → 最早</option>'));
assert(html.includes('<option value="oldest">最早 → 最新</option>'));
assert(browserScript.includes('"oldest"'));
assert(browserScript.includes('sortSelect.addEventListener("change"'));
assert(browserScript.includes('params.set("sort", activeSort)'));
assert(browserScript.includes("function comparePopular"));
assert(browserScript.includes("Number(b.dataset.upvotes || 0)"));
assert(html.includes('<option value="featured">精选优先，其次按热度</option>'));
assert(browserScript.includes("library-pagination"));
assert(!browserScript.includes("innerHTML"));

// Form collections remain private and browser writes continue through the
// authenticated Worker gateway.
const suggestions = dataManifest.collections?.suggestions;
const weeklySignups = dataManifest.collections?.weekly_signups;
for (const collectionConfig of [suggestions, weeklySignups]) {
  assert(collectionConfig);
  assert.equal(collectionConfig.access.read, "owner");
  assert.equal(collectionConfig.access.insert, "owner");
  assert.equal(collectionConfig.access.update, "owner");
  assert.equal(collectionConfig.access.delete, "owner");
}
assert(workerSource.includes("TURNSTILE_RATE_LIMITER.limit"));
assert(workerSource.includes("https://challenges.cloudflare.com/turnstile/v0/siteverify"));
assert(browserScript.includes("function setTurnstileUnavailable"));
assert(browserScript.includes("setTurnstileReady(widget, token)"));
assert(
  browserScript.includes(
    "weeklyButton.disabled = !turnstileWidgets.weeklySignups.token",
  ),
);
assert(
  browserScript.includes(
    "submitButton.disabled = !turnstileWidgets.suggestions.token",
  ),
);
assert(!browserScript.includes("Complete the verification check before signing up."));
assert(!browserScript.includes("Complete the verification check before submitting."));
assert(workerSource.includes("handleLoopRoute"));
assert(workerSource.includes("handleAuthVoteRoute"));
assert(browserScript.includes('document.querySelectorAll("[data-vote-controls]")'));
assert(browserScript.includes('credentials: "same-origin"'));
assert(css.includes(".vote-controls"));
assert(css.includes(".login-dialog"));
assert(rendererSource.includes("renderVoteControls(loop.slug)"));
assert(rendererSource.includes('class="vote-label"'));
assert(rendererSource.includes('aria-label="为这个 loop 投票" hidden'));
assert(browserScript.includes("setVotingUiVisible(body.uiEnabled === true)"));
assert(css.includes(".vote-controls[hidden]"));
assert(authVotesSource.includes('scope: "read:user"'));
assert(authVotesSource.includes("function authBridge"));
assert(authVotesSource.includes("readSignedValue(state"));
assert(authVotesSource.includes('LOOP_CATALOG_INSTANCE = "published-loops"'));
assert(browserScript.includes('window.sessionStorage.setItem(OAUTH_NONCE_KEY'));
assert(browserScript.includes('window.sessionStorage.getItem(VOTE_SESSION_KEY)'));
assert(browserScript.includes('url.searchParams.set("client_nonce", nonce)'));
assert(browserScript.includes("sessionToken: readVoteSessionToken()"));
assert(!authVotesSource.includes("Set-Cookie"));
assert(!authVotesSource.includes("X_OAUTH"));
assert(!authVotesSource.includes('"/auth/x"'));
assert(!browserScript.includes("Continue with X"));
assert(authVotesSource.includes("isTrustedMutationOrigin"));
assert(voteStoreSource.includes("PRIMARY KEY (loop_slug, voter_key)"));
assert(voteStoreSource.includes("CHECK (value IN (-1, 1))"));

// Publishing, backup, rendering, and activation all terminate at the database.
assert(loopRoutesSource.includes('"/admin/loops/export"'));
assert(loopRoutesSource.includes('"/admin/loops/import"'));
assert(loopRoutesSource.includes('"/admin/loops/restore/start"'));
assert(loopRoutesSource.includes("BOOTSTRAP_CATALOG_DIGEST"));
assert(loopRoutesSource.includes("expectedRevision"));
assert(catalogStoreSource.includes("CREATE TABLE IF NOT EXISTS loops"));
assert(catalogStoreSource.includes("CREATE TABLE IF NOT EXISTS loop_revisions"));
assert(catalogStoreSource.includes('url.pathname === "/export"'));
assert(rendererSource.includes("从生产目录数据库生成"));
assert(!rendererSource.includes("scripts/loop-data.mjs"));

assert.equal(workerPackage.scripts["loop:publish"], "node bin/publish-loop.mjs");
assert.equal(workerPackage.scripts["loops:import"], "node bin/import-bootstrap.mjs");
assert.equal(workerPackage.scripts["loops:export"], "node bin/export-catalog.mjs");
assert.equal(workerPackage.scripts["loops:restore"], "node bin/restore-catalog.mjs");
assert.equal(workerPackage.devDependencies.wrangler, "4.103.0");
assert.equal(workerLock.packages["node_modules/wrangler"].version, "4.103.0");

assert.equal(wrangler.name, "loop-library-forms");
assert.equal(wrangler.workers_dev, true);
assert.equal(wrangler.routes, undefined);
assert.equal(wrangler.durable_objects.bindings[1].name, "LOOP_CATALOG");
assert.equal(wrangler.durable_objects.bindings[1].class_name, "LoopCatalog");
assert.equal(wrangler.durable_objects.bindings[2].name, "VOTE_STORE");
assert.equal(wrangler.durable_objects.bindings[2].class_name, "VoteStore");
assert.deepEqual(wrangler.migrations[1], {
  tag: "v2",
  new_sqlite_classes: ["LoopCatalog"],
});
assert.deepEqual(wrangler.migrations[2], {
  tag: "v3",
  new_sqlite_classes: ["VoteStore"],
});
assert.match(wrangler.vars.BOOTSTRAP_CATALOG_DIGEST, /^[a-f0-9]{64}$/);
assert.equal(wrangler.vars.BOOTSTRAP_LOOP_COUNT, "50");
assert.equal(wrangler.vars.PUBLIC_ORIGIN_URL, "https://calm-mortar-jtek.here.now/");
assert.equal(wrangler.vars.PUBLIC_SHELL_URL, "https://calm-mortar-jtek.here.now/index.html");
assert.equal(wrangler.vars.PUBLIC_SITE_HOSTNAME, "signals.forwardfuture.com");
assert.equal(wrangler.vars.PUBLIC_SITE_PATH, "/loop-library");
assert.equal(wrangler.vars.VOTING_UI_ENABLED, "true");
assert.deepEqual(Object.keys(proxyManifest.proxies).sort(), [
  "/",
  "/api/loops",
  "/api/loops/*",
  "/api/votes",
  "/auth/*",
  "/catalog.json",
  "/catalog.md",
  "/catalog.txt",
  "/feed.xml",
  "/llms.txt",
  "/loops/*",
  "/sitemap.xml",
]);
for (const proxy of Object.values(proxyManifest.proxies)) {
  assert.match(proxy.upstream, /^https:\/\/loop-library-forms\.mberman84\.workers\.dev\/loop-library(?:\/|$)/);
  assert(["120/hour/ip", "600/hour/ip"].includes(proxy.rateLimit));
}

assert.match(skillSource, /实时目录是判断哪些 loop 已发布的事实来源/);
assert.match(skillSource, /^---\nname: loopy\n/);
assert(skillSource.includes("不要用仓库内容或记忆代替生产数据库"));
assert(!skillSource.includes("references/catalog.md"));
assert(skillSource.includes("references/discover.md"));
assert(skillSource.includes("references/run.md"));
assert(skillSource.includes("references/debrief.md"));
assert(skillSource.includes("references/publish.md"));
assert(skillSource.includes("两个语义等价工作的具体发生"));
assert(skillSource.includes("验证每个设计出的 loop"));
assert(skillSource.includes("静默追踪一个完整循环"));
assert(skillSource.includes("你想完成什么？"));
assert(skillSource.includes("成功的结果会是什么样子？"));
assert(skillSource.includes("提供一次性工作流"));
assert(skillSource.includes("用 Loop Doctor 判断 loop 设计"));
assert(skillDiscovery.includes("没有运行历史的代码库模式"));
assert(skillDiscovery.includes("重复任务不会自动成为好 loop"));
assert(skillDiscovery.includes("强制的 crafted-loop 预检"));
assert(skillDiscovery.includes("搜索实时目录"));
assert(skillRun.includes("## Loopy run receipt"));
assert(skillRun.includes("重新读取当前状态"));
assert(skillRun.includes("默认不要创建回执文件"));
assert(skillRun.includes("有限运行边界"));
assert(skillRun.includes("把每个 loop"));
assert(skillRun.includes("不要把 modified date 当作唯一版本"));
assert(skillRun.includes("Definition: [exact fetched/local/pasted definition, or SHA-256"));
assert(skillRun.includes("Check: [acceptance check"));
assert(skillDebrief.includes("只有一次运行时，只描述那次运行"));
assert(skillDebrief.includes("environment or tool failure"));
assert(skillPublish.includes("搜索实时目录"));
assert(skillPublish.includes("没有对预览的明确批准"));
assert(skillPublish.includes("已授权的 owner 动作默认保存为 draft"));
assert(skillPublish.includes("成功接受响应"));
assert(skillPublish.includes("不要编造 identifier"));
assert(skillPublish.includes("绝不要从泛泛的提交批准中设置 public suggestion 的 permission"));
assert(skillPublish.includes("Attestation: [exact current ownership/license terms"));
assert(skillInterface.includes('display_name: "Loopy"'));
assert(skillInterface.includes("使用 $loopy"));
assert(skillInterface.includes("访谈我的目标"));
assert.match(legacySkillSource, /^---\nname: loop-library\n/);
assert(legacySkillSource.includes("Loopy 的兼容名称"));
assert(legacySkillSource.includes("references/run.md"));
assert.equal(legacySkillRun, skillRun);
assert.equal(legacySkillDebrief, skillDebrief);
assert.equal(legacySkillPublish, skillPublish);
for (const source of [html, learnHtml, agentHtml, rendererSource, readme, skillSource, skillInterface]) {
  assert(!source.includes("skills/loop-library"));
  assert(!source.includes("--skill loop-library"));
  assert(!source.includes("$loop-library"));
}
assert.match(readme, /没有已发布 loop 记录/);
assert(readme.includes("它可以走八条路径"));
assert(readme.includes("| **Discover** |"));
assert(readme.includes("| **Craft** |"));
assert(readme.includes("| **Run** |"));
assert(readme.includes("| **Debrief** |"));
assert(readme.includes("| **Publish** |"));
assert(readme.includes("$loopy 分析这个代码库"));
assert(readme.includes("至少需要两个不同的线程"));
assert(readme.includes("会检查实时目录"));
assert(readme.includes("不会创建持久运行文件"));
assert(readme.includes("默认保存为草稿"));
assert(readme.includes("提供一个有限运行边界"));
assert(readme.includes("公开建议只返回接受回执"));
assert(readme.includes("单独确认预览中显示的当前所有权"));
assert(readme.includes("保留在迁移前 Git 历史中"));
assert(readme.includes("loops:export"));
assert(readme.includes("loops:restore"));
assert(agents.includes("Do not commit"));
assert(agents.includes("Never publish the empty shell"));

console.log("Loop Library database-only checks passed.");
