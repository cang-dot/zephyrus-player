import './index.css';
import '@/assets/css/mobile.css';
import 'animate.css';
import 'remixicon/fonts/remixicon.css';

// 全局错误捕获 —— 生产构建调试用
window.addEventListener('error', (e) => {
  const div = document.createElement('div');
  div.style.cssText = 'position:fixed;inset:0;z-index:99999;background:red;color:white;padding:20px;font-size:16px;white-space:pre-wrap;overflow:auto;';
  div.textContent = `[ERROR] ${e.message}\n${e.filename}:${e.lineno}\n${e.error?.stack || ''}`;
  document.body.appendChild(div);
});
window.addEventListener('unhandledrejection', (e) => {
  const div = document.createElement('div');
  div.style.cssText = 'position:fixed;inset:0;z-index:99999;background:darkred;color:white;padding:20px;font-size:16px;white-space:pre-wrap;overflow:auto;';
  div.textContent = `[PROMISE REJECTION] ${e.reason}\n${e.reason?.stack || ''}`;
  document.body.appendChild(div);
});

// 触发所有播放模式自注册
import '@/playerStyles';

import { createApp } from 'vue';

import i18n from '@/../i18n/renderer';
import router from '@/router';
import pinia from '@/store';

import App from './App.vue';
import directives from './directive';

const app = createApp(App);

Object.keys(directives).forEach((key: string) => {
  app.directive(key, directives[key as keyof typeof directives]);
});

app.use(pinia);
app.use(router);
app.use(i18n as any);
app.mount('#app');
