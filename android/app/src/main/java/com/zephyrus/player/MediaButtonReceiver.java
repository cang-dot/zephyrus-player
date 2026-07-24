package com.zephyrus.player;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

/**
 * 接收媒体通知栏按钮点击事件的 BroadcastReceiver
 * 通过 MainActivity 的静态引用将事件转发给前端 WebView
 */
public class MediaButtonReceiver extends BroadcastReceiver {

    public static final String ACTION_MEDIA_BUTTON = "com.zephyrus.player.MEDIA_ACTION";

    @Override
    public void onReceive(Context context, Intent intent) {
        if (intent == null) return;
        String action = intent.getStringExtra("action");
        if (action == null) return;

        // 通过 MainActivity 静态引用转发到 WebView
        MainActivity mainActivity = MainActivity.getInstance();
        if (mainActivity != null) {
            String js = "window.dispatchEvent(new CustomEvent('media-button',{detail:'" + action + "'}));";
            mainActivity.evaluateJs(js);
        }
    }
}
