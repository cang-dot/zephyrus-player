package com.zephyrus.player;

import android.os.Bundle;
import android.view.KeyEvent;
import android.view.WindowManager;
import android.webkit.WebView;

import androidx.core.view.WindowCompat;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    private static MainActivity instance;

    private NativeBridge nativeBridge;
    private long lastBackPressTime = 0;

    /**
     * 获取 MainActivity 单例引用（供 MediaButtonReceiver 等使用）
     */
    public static MainActivity getInstance() {
        return instance;
    }

    @Override
    public void onCreate(Bundle savedInstanceState) {
        instance = this;
        super.onCreate(savedInstanceState);

        // 启用边到边显示，让内容延伸到状态栏和导航栏后面
        // 必须在 super.onCreate() 之后调用，确保 Capacitor 不会覆盖这些设置
        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_DRAWS_SYSTEM_BAR_BACKGROUNDS);
        getWindow().clearFlags(WindowManager.LayoutParams.FLAG_TRANSLUCENT_STATUS);
        getWindow().clearFlags(WindowManager.LayoutParams.FLAG_TRANSLUCENT_NAVIGATION);
        getWindow().setStatusBarColor(android.graphics.Color.TRANSPARENT);
        getWindow().setNavigationBarColor(android.graphics.Color.TRANSPARENT);

        // 初始化 NativeBridge
        nativeBridge = new NativeBridge(this);

        // 等待 WebView 创建后注册 JavascriptInterface
        registerNativeBridge();
    }

    private void registerNativeBridge() {
        try {
            WebView webView = this.bridge.getWebView();
            if (webView != null) {
                webView.addJavascriptInterface(nativeBridge, "AndroidNative");
                // 注入安全区域 CSS 变量
                injectSafeAreaInsets();
            } else {
                // WebView 尚未就绪，延迟重试
                new android.os.Handler(android.os.Looper.getMainLooper()).postDelayed(this::registerNativeBridge, 200);
            }
        } catch (Exception e) {
            new android.os.Handler(android.os.Looper.getMainLooper()).postDelayed(this::registerNativeBridge, 200);
        }
    }

    private void injectSafeAreaInsets() {
        if (nativeBridge == null) return;
        String insetsJson = nativeBridge.getSafeAreaInsets();
        String js = "(function(){" +
                "try {" +
                "  var insets = " + insetsJson + ";" +
                "  var root = document.documentElement;" +
                "  root.style.setProperty('--safe-area-inset-top', insets.top + 'px');" +
                "  root.style.setProperty('--safe-area-inset-bottom', insets.bottom + 'px');" +
                "  root.style.setProperty('--safe-area-inset-left', insets.left + 'px');" +
                "  root.style.setProperty('--safe-area-inset-right', insets.right + 'px');" +
                "} catch(e) { console.error('injectSafeAreaInsets error:', e); }" +
                "})();";
        evaluateJs(js);
    }

    /**
     * 执行 JS 代码（供 NativeBridge 和 MediaButtonReceiver 调用）
     */
    public void evaluateJs(String js) {
        try {
            WebView webView = this.bridge.getWebView();
            if (webView != null) {
                webView.evaluateJavascript(js, null);
            }
        } catch (Exception e) {
            // 忽略
        }
    }

    /**
     * 拦截返回键 / 全面屏手势返回
     * 通知前端进行页面导航，而不是直接退出应用
     */
    @Override
    public void onBackPressed() {
        long now = System.currentTimeMillis();
        if (now - lastBackPressTime < 300) {
            return;
        }
        lastBackPressTime = now;

        // 通过 JS 通知前端处理返回
        // dispatchEvent 返回 true 表示事件未被 preventDefault（即前端不处理，需要退出）
        String js = "(function(){" +
                "  if (window.dispatchEvent(new CustomEvent('native-back-press', {cancelable: true}))) {" +
                "    if (window.AndroidNative && window.AndroidNative.exitApp) {" +
                "      window.AndroidNative.exitApp();" +
                "    }" +
                "  }" +
                "})();";
        evaluateJs(js);
    }

    @Override
    public boolean onKeyDown(int keyCode, KeyEvent event) {
        if (keyCode == KeyEvent.KEYCODE_BACK) {
            onBackPressed();
            return true;
        }
        return super.onKeyDown(keyCode, event);
    }

    @Override
    public void onDestroy() {
        if (nativeBridge != null) {
            nativeBridge.destroy();
        }
        instance = null;
        super.onDestroy();
    }
}
