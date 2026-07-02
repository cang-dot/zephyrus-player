// 导入所有模式（触发自注册）
import './default';
import './stage';
import './magazine';
import './frenzy';

// 导出注册表 API
export { getAllStyles, getStyle } from './registry';
export type { PlayerStyleDefinition, SettingItem } from './registry';

// 导出自定义函数
export { useStyleContext } from './useStyleContext';
