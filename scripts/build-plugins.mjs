#!/usr/bin/env node

/**
 * 插件构建脚本：将旧格式（ES module + IIFE）转换为 v2 格式（Function Body）
 *
 * 用法：node scripts/build-plugins.mjs
 * 输入：public/plugins/*.js
 * 输出：public/plugins/v2/*.js（原地覆盖也可）
 *
 * v2 格式要求：
 * - 无 CSS 注入 IIFE
 * - 无模块互操作辅助函数
 * - 无 IIFE 包装
 * - 所有声明用 var（不用 const/let）
 * - export { X as default } → return { default: X }
 * - 直接可被 new Function(code)() 执行
 */

import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync } from 'fs';
import { join, basename } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const PLUGINS_DIR = join(__dirname, '..', 'public', 'plugins');
const OUTPUT_DIR = join(PLUGINS_DIR); // 输出到同一目录（覆盖原文件）

function convertToV2(rawJs) {
  let code = rawJs;

  // 1. 移除 CSS 注入 IIFE
  code = code.replace(
    /^\(function\(\)\{var s=document\.createElement\('style'\);[\s\S]*?\}\)\(\);\s*/m,
    ''
  );

  // 2. 移除模块互操作辅助函数
  code = code.replace(/var X=function\([^)]*\)\{[\s\S]*?return d;\};/m, '');

  // 3. 移除 let X; 声明
  code = code.replace(/^\s*let X;\s*$/gm, '');

  // 4. 剥离 IIFE 包装
  code = code
    .replace(
      /(var\s+__sh_\w+\s*=\s*\{\s*\}\s*;\s*)\(function\s*\(\s*\)\s*\{['"]use strict['"];\s*/g,
      '$1\n'
    )
    .replace(/^\}\)\(\)\s*;?\s*$/gm, '');

  // 5. 修复重复 var 声明：var en=var en=... → var en=...（支持 $ 前缀标识符）
  code = code.replace(/\bvar\s+([$\w]+)\s*=\s*var\s+\1\s*=/g, 'var $1 =');

  // 6. 将所有 const/let 改为 var（避免和 IIFE 内的 var 声明冲突）
  code = code.replace(/^\s*(const|let)\s+/gm, 'var ');

  // 7. 将 class 声明改为 var 赋值（避免重复声明冲突）
  //    class X { → var X = class {
  //    class X extends Y { → var X = class extends Y {
  code = code.replace(/\bclass\s+([$\w]+)\s*(extends\s+[^{]+?)?\s*\{/g, (_, name, extendsClause) => {
    return `var ${name} = class ${extendsClause ? extendsClause.trim() : ''} {`;
  });

  // 8. 跨 IIFE 重命名重复 var 声明（不同模块中同名变量加后缀）
  //    必须在 class→var 转换之后执行，才能捕获 class 声明的重复
  const moduleBlocks = code.split(/(?=^\s*var\s+__sh_)/m);
  const declaredVars = new Set();
  const renamedBlocks = moduleBlocks.map((block) => {
    const localDecls = [...block.matchAll(/^\s*var\s+([$\w]+)/gm)].map((m) => m[1]);
    let result = block;
    for (const varName of localDecls) {
      if (varName.startsWith('__sh_')) continue;
      if (declaredVars.has(varName)) {
        let suffix = 2;
        while (declaredVars.has(`${varName}_${suffix}`)) suffix++;
        const newName = `${varName}_${suffix}`;
        result = result.replace(new RegExp(`\\bvar\\s+${varName}\\b`, 'g'), `var ${newName}`);
        result = result.replace(new RegExp(`\\b${varName}\\b`, 'g'), newName);
        declaredVars.add(newName);
      } else {
        declaredVars.add(varName);
      }
    }
    return result;
  });
  code = renamedBlocks.join('');

  // 9. 替换 export 语句为 return
  code = code.replace(
    /export\s*\{\s*([$\w]+)\s+as\s+default\s*\}\s*;?/g,
    'return { default: $1 };'
  );

  return code;
}

// 主流程
const args = process.argv.slice(2);
const inPlace = args.includes('--in-place');

const pluginsDir = inPlace ? PLUGINS_DIR : PLUGINS_DIR;
const outputDir = inPlace ? PLUGINS_DIR : join(PLUGINS_DIR, 'v2');

if (!inPlace) {
  mkdirSync(outputDir, { recursive: true });
}

const files = readdirSync(PLUGINS_DIR).filter(f => f.endsWith('.js') && !f.includes('v2'));

console.log(`找到 ${files.length} 个插件文件`);

for (const file of files) {
  const inputPath = join(PLUGINS_DIR, file);
  const rawJs = readFileSync(inputPath, 'utf-8');

  console.log(`转换: ${file} (${rawJs.length} chars)`);

  const v2Code = convertToV2(rawJs);

  // 验证 v2 格式
  const hasExport = /export\s*\{/.test(v2Code);
  const hasReturn = /return\s*\{\s*default\s*:/.test(v2Code);
  const hasConstLet = /^(const|let)\s+/m.test(v2Code);
  const hasIIFE = /^\(function\s*\(\s*\)\s*\{/.test(v2Code);

  if (hasExport) {
    console.error(`  ✗ ${file}: 仍有 export 语句`);
    continue;
  }
  if (!hasReturn) {
    console.error(`  ✗ ${file}: 缺少 return { default: ... }`);
    continue;
  }
  if (hasConstLet) {
    console.error(`  ✗ ${file}: 仍有 const/let 声明`);
    continue;
  }
  if (hasIIFE) {
    console.error(`  ✗ ${file}: 仍有 IIFE 包装`);
    continue;
  }

  const outputPath = inPlace ? inputPath : join(outputDir, file);
  writeFileSync(outputPath, v2Code, 'utf-8');

  console.log(`  ✓ ${file} → ${v2Code.length} chars (${inPlace ? '原地覆盖' : 'v2/' + file})`);
}

console.log('\n完成！');
