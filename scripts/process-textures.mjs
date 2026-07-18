/**
 * 图片纹理处理脚本（sharp 版）
 *
 * 将素材图片处理为：去饱和（灰度）+ 半透明 PNG 纹理
 * 用于诡谲模式的"报纸滤镜效果"
 *
 * 用法: node scripts/process-textures.mjs
 */
import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, basename } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

// 输入文件列表
const inputFiles = [
  'C:\\Users\\Administrator\\Downloads\\35902967_115716760100_2.jpg',
  'C:\\Users\\Administrator\\Downloads\\ff779ff8cd988d450f85cfb548e3c7faac72e3324b778-s4SeWF_fw658.webp',
  'C:\\Users\\Administrator\\Downloads\\f309fa04ca7847c6b112c3dde0c24235f04b77a42016f-JPGsBX_fw658.webp',
  'C:\\Users\\Administrator\\Downloads\\OIP-C (2).webp',
  'C:\\Users\\Administrator\\Downloads\\c492e8938a92331c379532dcf2da896c51b116725e115-u3YjAR_fw658.webp',
];

// 输出目录
const outputDir = join(projectRoot, 'src', 'renderer', 'assets', 'textures', 'newspaper');

// 确保输出目录存在
if (!existsSync(outputDir)) {
  mkdirSync(outputDir, { recursive: true });
}

// 处理参数
const OPACITY = 0.35;       // 半透明度（0-1），35% 不透明度
const TARGET_WIDTH = 800;   // 目标宽度（缩放，保持比例）

async function processImage(inputPath, index) {
  try {
    console.log(`[${index + 1}/${inputFiles.length}] 处理: ${basename(inputPath)}`);

    // 读取图片元数据
    const metadata = await sharp(inputPath).metadata();
    console.log(`  原始: ${metadata.width}×${metadata.height} ${metadata.format}`);

    // 处理图片：
    // 1. 缩放到目标宽度
    // 2. 去饱和（grayscale）
    // 3. 调整对比度和亮度
    // 4. 合成半透明 alpha 层
    const processed = await sharp(inputPath)
      .resize({ width: TARGET_WIDTH, fit: 'inside', withoutEnlargement: true })
      .grayscale()                          // 去饱和
      .modulate({ brightness: 0.85 })      // 略微压暗
      .linear(1.15, -0.1)                  // 增强对比度（gain=1.15, bias=-0.1）
      .png()
      .toBuffer();

    // 读取处理后的图片，手动设置 alpha 通道
    const { data, info } = await sharp(processed)
      .raw()
      .toBuffer({ resolveWithObject: true });

    // 遍历像素，设置 alpha = 255 * OPACITY
    const channels = info.channels;
    if (channels === 4) {
      // 已有 alpha 通道，直接覆盖
      for (let i = 3; i < data.length; i += 4) {
        data[i] = Math.round(255 * OPACITY);
      }
    } else if (channels === 3) {
      // 无 alpha 通道，需要添加
      const newData = Buffer.alloc(data.length / 3 * 4);
      for (let i = 0, j = 0; i < data.length; i += 3, j += 4) {
        newData[j] = data[i];         // R
        newData[j + 1] = data[i + 1]; // G
        newData[j + 2] = data[i + 2]; // B
        newData[j + 3] = Math.round(255 * OPACITY); // A
      }
      // 用新数据生成图片
      const outputName = `newspaper-${String(index + 1).padStart(2, '0')}.png`;
      const outputPath = join(outputDir, outputName);

      await sharp(newData, {
        raw: {
          width: info.width,
          height: info.height,
          channels: 4
        }
      })
        .png()
        .toFile(outputPath);

      console.log(`  ✓ 已保存: ${outputName} (${info.width}×${info.height}, opacity=${OPACITY})`);
      return outputPath;
    }

    // channels === 4 的情况
    const outputName = `newspaper-${String(index + 1).padStart(2, '0')}.png`;
    const outputPath = join(outputDir, outputName);

    await sharp(data, {
      raw: {
        width: info.width,
        height: info.height,
        channels: 4
      }
    })
      .png()
      .toFile(outputPath);

    console.log(`  ✓ 已保存: ${outputName} (${info.width}×${info.height}, opacity=${OPACITY})`);
    return outputPath;
  } catch (err) {
    console.error(`  ✗ 处理失败: ${err.message}`);
    return null;
  }
}

async function main() {
  console.log('=== 纹理处理脚本 (sharp) ===');
  console.log(`输出目录: ${outputDir}`);
  console.log(`参数: 去饱和 + ${Math.round(OPACITY * 100)}% 不透明度 + 对比度增强\n`);

  const results = [];
  for (let i = 0; i < inputFiles.length; i++) {
    const result = await processImage(inputFiles[i], i);
    if (result) results.push(result);
  }

  console.log(`\n=== 完成 ===`);
  console.log(`成功处理 ${results.length}/${inputFiles.length} 张图片`);
  console.log(`输出文件:`);
  results.forEach(f => console.log(`  ${basename(f)}`));

  // 生成纹理清单 JSON
  const manifest = {
    name: 'newspaper',
    description: '报纸纹理素材 - 去饱和半透明',
    textures: results.map((f, i) => ({
      id: `newspaper-${String(i + 1).padStart(2, '0')}`,
      src: `assets/textures/newspaper/${basename(f)}`,
      duration: 500  // 每张显示 500ms
    }))
  };

  const manifestPath = join(outputDir, 'manifest.json');
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf-8');
  console.log(`\n清单已生成: ${manifestPath}`);
}

main().catch(console.error);
