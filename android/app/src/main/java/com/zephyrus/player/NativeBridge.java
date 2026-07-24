package com.zephyrus.player;

import android.app.Activity;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.net.Uri;
import android.os.Build;
import android.os.Handler;
import android.os.Looper;
import android.provider.Settings;
import android.util.Log;
import android.webkit.JavascriptInterface;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.core.app.NotificationCompat;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;

import android.support.v4.media.session.MediaSessionCompat;
import android.support.v4.media.session.PlaybackStateCompat;
import android.support.v4.media.MediaMetadataCompat;

import com.getcapacitor.JSObject;

import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/**
 * NativeBridge — JavascriptInterface 桥接层
 * <p>
 * 通过 WebView.addJavascriptInterface 注入，提供以下能力：
 * 1. 状态栏外观控制（深色/浅色图标）
 * 2. 安全区域尺寸获取（状态栏高度、导航栏高度）
 * 3. 媒体通知管理（MediaSession + MediaStyle 通知）
 * 4. 打开 Android 系统设置页面（电池优化、自启动、通知权限等）
 * 5. 返回手势拦截（通知 WebView 而非直接退出）
 */
public class NativeBridge {

    private static final String TAG = "NativeBridge";
    private static final String CHANNEL_ID = "zephyrus_media_playback";
    private static final int NOTIFICATION_ID = 1001;

    private final Activity activity;
    private final Handler mainHandler = new Handler(Looper.getMainLooper());
    private final ExecutorService networkExecutor = Executors.newSingleThreadExecutor();

    private MediaSessionCompat mediaSession;
    private NotificationManager notificationManager;
    private boolean notificationShowing = false;

    // 缓存的媒体信息
    private String cachedTitle = "";
    private String cachedArtist = "";
    private String cachedAlbum = "";
    private Bitmap cachedArtwork = null;
    private boolean cachedIsPlaying = false;
    private long cachedDuration = 0;
    private long cachedPosition = 0;

    public NativeBridge(@NonNull Activity activity) {
        this.activity = activity;
        this.notificationManager = (NotificationManager) activity.getSystemService(Context.NOTIFICATION_SERVICE);
        createNotificationChannel();
    }

    // ==================== 状态栏控制 ====================

    @JavascriptInterface
    public void setStatusBarDark(boolean isDark) {
        mainHandler.post(() -> {
            try {
                WindowInsetsControllerCompat controller =
                        WindowCompat.getInsetsController(activity.getWindow(), activity.getWindow().getDecorView());
                controller.setAppearanceLightStatusBars(!isDark);
            } catch (Exception e) {
                Log.e(TAG, "setStatusBarDark failed", e);
            }
        });
    }

    // ==================== 安全区域 ====================

    @JavascriptInterface
    public String getSafeAreaInsets() {
        try {
            android.view.View decorView = activity.getWindow().getDecorView();
            android.view.WindowInsets insets = decorView.getRootWindowInsets();
            if (insets == null) {
                return "{\"top\":0,\"bottom\":0,\"left\":0,\"right\":0}";
            }
            WindowInsetsCompat compatInsets = WindowInsetsCompat.toWindowInsetsCompat(insets, decorView);
            int top = compatInsets.getInsets(WindowInsetsCompat.Type.statusBars()).top;
            int bottom = compatInsets.getInsets(WindowInsetsCompat.Type.navigationBars()).bottom;

            JSObject result = new JSObject();
            result.put("top", pxToDp(top));
            result.put("bottom", pxToDp(bottom));
            result.put("left", 0);
            result.put("right", 0);
            return result.toString();
        } catch (Exception e) {
            Log.e(TAG, "getSafeAreaInsets failed", e);
            return "{\"top\":0,\"bottom\":0,\"left\":0,\"right\":0}";
        }
    }

    private int pxToDp(int px) {
        float density = activity.getResources().getDisplayMetrics().density;
        return Math.round(px / density);
    }

    // ==================== 媒体通知 ====================

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                    CHANNEL_ID,
                    "音乐播放",
                    NotificationManager.IMPORTANCE_LOW
            );
            channel.setDescription("音乐播放控制通知");
            channel.setShowBadge(false);
            channel.setLockscreenVisibility(NotificationCompat.VISIBILITY_PUBLIC);
            notificationManager.createNotificationChannel(channel);
        }
    }

    private void ensureMediaSession() {
        if (mediaSession == null) {
            mediaSession = new MediaSessionCompat(activity, "ZephyrusPlayer");
            mediaSession.setFlags(
                    MediaSessionCompat.FLAG_HANDLES_MEDIA_BUTTONS |
                            MediaSessionCompat.FLAG_HANDLES_TRANSPORT_CONTROLS
            );
            mediaSession.setCallback(new MediaSessionCompat.Callback() {
                @Override
                public void onPlay() {
                    sendMediaButtonEvent("play");
                }

                @Override
                public void onPause() {
                    sendMediaButtonEvent("pause");
                }

                @Override
                public void onSkipToNext() {
                    sendMediaButtonEvent("next");
                }

                @Override
                public void onSkipToPrevious() {
                    sendMediaButtonEvent("prev");
                }

                @Override
                public void onStop() {
                    sendMediaButtonEvent("stop");
                }
            });
            mediaSession.setActive(true);
        }
    }

    private void sendMediaButtonEvent(String action) {
        mainHandler.post(() -> {
            String js = "window.dispatchEvent(new CustomEvent('media-button',{detail:'" + action + "'}));";
            if (activity instanceof MainActivity) {
                ((MainActivity) activity).evaluateJs(js);
            }
        });
    }

    @JavascriptInterface
    public void updateMediaNotification(
            String title,
            String artist,
            String album,
            String artworkUrl,
            boolean isPlaying,
            long duration,
            long position
    ) {
        cachedTitle = title;
        cachedArtist = artist;
        cachedAlbum = album;
        cachedIsPlaying = isPlaying;
        cachedDuration = duration;
        cachedPosition = position;

        // 异步加载封面
        if (artworkUrl != null && !artworkUrl.isEmpty()) {
            networkExecutor.execute(() -> {
                cachedArtwork = loadBitmap(artworkUrl);
                mainHandler.post(this::showOrUpdateNotification);
            });
        } else {
            cachedArtwork = null;
            mainHandler.post(this::showOrUpdateNotification);
        }
    }

    @JavascriptInterface
    public void clearMediaNotification() {
        mainHandler.post(() -> {
            try {
                notificationManager.cancel(NOTIFICATION_ID);
                if (mediaSession != null) {
                    mediaSession.setPlaybackState(null);
                    mediaSession.setMetadata(null);
                    mediaSession.setActive(false);
                    mediaSession.release();
                    mediaSession = null;
                }
                notificationShowing = false;
            } catch (Exception e) {
                Log.e(TAG, "clearMediaNotification failed", e);
            }
        });
    }

    private void showOrUpdateNotification() {
        try {
            ensureMediaSession();

            // 更新 PlaybackState（包含进度信息）
            long playbackActions = PlaybackStateCompat.ACTION_PLAY
                    | PlaybackStateCompat.ACTION_PAUSE
                    | PlaybackStateCompat.ACTION_PLAY_PAUSE
                    | PlaybackStateCompat.ACTION_SKIP_TO_NEXT
                    | PlaybackStateCompat.ACTION_SKIP_TO_PREVIOUS
                    | PlaybackStateCompat.ACTION_STOP
                    | PlaybackStateCompat.ACTION_SEEK_TO;

            PlaybackStateCompat.Builder stateBuilder = new PlaybackStateCompat.Builder()
                    .setActions(playbackActions)
                    .setState(
                            cachedIsPlaying ? PlaybackStateCompat.STATE_PLAYING : PlaybackStateCompat.STATE_PAUSED,
                            cachedPosition,
                            cachedIsPlaying ? 1.0f : 0f
                    );
            mediaSession.setPlaybackState(stateBuilder.build());

            // 更新 MediaMetadata（包含总时长）
            MediaMetadataCompat.Builder metadataBuilder = new MediaMetadataCompat.Builder();
            if (cachedTitle != null)
                metadataBuilder.putString(MediaMetadataCompat.METADATA_KEY_TITLE, cachedTitle);
            if (cachedArtist != null)
                metadataBuilder.putString(MediaMetadataCompat.METADATA_KEY_ARTIST, cachedArtist);
            if (cachedAlbum != null)
                metadataBuilder.putString(MediaMetadataCompat.METADATA_KEY_ALBUM, cachedAlbum);
            if (cachedDuration > 0)
                metadataBuilder.putLong(MediaMetadataCompat.METADATA_KEY_DURATION, cachedDuration * 1000);
            if (cachedArtwork != null)
                metadataBuilder.putBitmap(MediaMetadataCompat.METADATA_KEY_ALBUM_ART, cachedArtwork);
            mediaSession.setMetadata(metadataBuilder.build());

            // 构建 PendingIntent
            Intent contentIntent = activity.getPackageManager().getLaunchIntentForPackage(activity.getPackageName());
            if (contentIntent != null) {
                contentIntent.setFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_CLEAR_TOP);
            }
            PendingIntent pendingContentIntent = PendingIntent.getActivity(
                    activity, 0, contentIntent,
                    PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT
            );

            // 构建通知
            NotificationCompat.Builder builder = new NotificationCompat.Builder(activity, CHANNEL_ID)
                    .setSmallIcon(android.R.drawable.ic_media_play)
                    .setContentTitle(cachedTitle)
                    .setContentText(cachedArtist)
                    .setSubText(cachedAlbum)
                    .setContentIntent(pendingContentIntent)
                    .setOngoing(cachedIsPlaying)
                    .setShowWhen(false)
                    .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
                    .setOnlyAlertOnce(true);

            if (cachedArtwork != null) {
                builder.setLargeIcon(cachedArtwork);
            }

            // 播放控制按钮
            builder.addAction(android.R.drawable.ic_media_previous, "上一首", createMediaActionPendingIntent("prev"));
            if (cachedIsPlaying) {
                builder.addAction(android.R.drawable.ic_media_pause, "暂停", createMediaActionPendingIntent("pause"));
            } else {
                builder.addAction(android.R.drawable.ic_media_play, "播放", createMediaActionPendingIntent("play"));
            }
            builder.addAction(android.R.drawable.ic_media_next, "下一首", createMediaActionPendingIntent("next"));

            // MediaStyle
            androidx.media.app.NotificationCompat.MediaStyle mediaStyle =
                    new androidx.media.app.NotificationCompat.MediaStyle()
                            .setMediaSession(mediaSession.getSessionToken())
                            .setShowActionsInCompactView(0, 1, 2)
                            .setShowCancelButton(true)
                            .setCancelButtonIntent(createMediaActionPendingIntent("stop"));
            builder.setStyle(mediaStyle);

            notificationManager.notify(NOTIFICATION_ID, builder.build());
            notificationShowing = true;
        } catch (Exception e) {
            Log.e(TAG, "showOrUpdateNotification failed", e);
        }
    }

    private PendingIntent createMediaActionPendingIntent(String action) {
        Intent intent = new Intent(activity, MediaButtonReceiver.class);
        intent.setAction("com.zephyrus.player.MEDIA_ACTION");
        intent.putExtra("action", action);
        return PendingIntent.getBroadcast(
                activity,
                action.hashCode(),
                intent,
                PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT
        );
    }

    @Nullable
    private Bitmap loadBitmap(@NonNull String urlStr) {
        try {
            if (urlStr.startsWith("http")) {
                URL url = new URL(urlStr);
                HttpURLConnection conn = (HttpURLConnection) url.openConnection();
                conn.setConnectTimeout(5000);
                conn.setReadTimeout(5000);
                conn.setInstanceFollowRedirects(true);
                try (InputStream is = conn.getInputStream()) {
                    return BitmapFactory.decodeStream(is);
                }
            }
            return null;
        } catch (Exception e) {
            Log.e(TAG, "loadBitmap failed for " + urlStr, e);
            return null;
        }
    }

    // ==================== 打开系统设置 ====================

    @JavascriptInterface
    public void openBatteryOptimizationSettings() {
        try {
            Intent intent = new Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS);
            intent.setData(Uri.parse("package:" + activity.getPackageName()));
            activity.startActivity(intent);
        } catch (Exception e) {
            try {
                Intent fallback = new Intent(Settings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS);
                activity.startActivity(fallback);
            } catch (Exception e2) {
                toast("无法打开电池优化设置");
            }
        }
    }

    @JavascriptInterface
    public void openAutoStartSettings() {
        String[][] intents = {
                {"com.miui.permcenter", "com.miui.permcenter.autostart.AutoStartManagementActivity"},
                {"com.letv.android.letvsafe", "com.letv.android.letvsafe.AutobootManageActivity"},
                {"com.huawei.systemmanager", "com.huawei.systemmanager.startupmgr.ui.StartupNormalAppListActivity"},
                {"com.huawei.systemmanager", "com.huawei.systemmanager.optimize.process.ProtectActivity"},
                {"com.coloros.safecenter", "com.coloros.safecenter.permission.startup.StartupAppListActivity"},
                {"com.coloros.safecenter", "com.coloros.safecenter.startupapp.StartupAppListActivity"},
                {"com.iqoo.secure", "com.iqoo.secure.ui.phoneoptimize.AddWhiteListActivity"},
                {"com.iqoo.secure", "com.iqoo.secure.ui.phoneoptimize.BgStartUpManager"},
                {"com.vivo.permissionmanager", "com.vivo.permissionmanager.activity.BgStartUpManagerActivity"},
                {"com.samsung.android.lool", "com.samsung.android.sm.ui.battery.BatteryActivity"},
                {"com.oplus.safecenter", "com.oplus.safecenter.startupapp.StartupAppListActivity"},
                {"com.yulong.android.security", "com.yulong.android.seccenter.activity.AutoStartSettingActivity"}
        };

        for (String[] info : intents) {
            try {
                Intent intent = new Intent();
                intent.setComponent(new android.content.ComponentName(info[0], info[1]));
                activity.startActivity(intent);
                return;
            } catch (Exception ignored) {
            }
        }

        toast("请在系统设置中手动允许应用自启动");
    }

    @JavascriptInterface
    public void openNotificationSettings() {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                Intent intent = new Intent(Settings.ACTION_APP_NOTIFICATION_SETTINGS);
                intent.putExtra(Settings.EXTRA_APP_PACKAGE, activity.getPackageName());
                activity.startActivity(intent);
            } else {
                Intent intent = new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS);
                intent.setData(Uri.parse("package:" + activity.getPackageName()));
                activity.startActivity(intent);
            }
        } catch (Exception e) {
            toast("无法打开通知设置");
        }
    }

    @JavascriptInterface
    public void openAppDetailsSettings() {
        try {
            Intent intent = new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS);
            intent.setData(Uri.parse("package:" + activity.getPackageName()));
            activity.startActivity(intent);
        } catch (Exception e) {
            toast("无法打开应用设置");
        }
    }

    @JavascriptInterface
    public void openDisplayOverOtherAppsSettings() {
        try {
            Intent intent = new Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION);
            intent.setData(Uri.parse("package:" + activity.getPackageName()));
            activity.startActivity(intent);
        } catch (Exception e) {
            toast("无法打开悬浮窗设置");
        }
    }

    // ==================== 工具方法 ====================

    private void toast(String msg) {
        mainHandler.post(() -> Toast.makeText(activity, msg, Toast.LENGTH_SHORT).show());
    }

    /**
     * 退出应用（供 JS 在无法返回上一页时调用）
     */
    @JavascriptInterface
    public void exitApp() {
        mainHandler.post(() -> activity.finish());
    }

    /**
     * 清理资源，在 Activity onDestroy 时调用
     */
    public void destroy() {
        clearMediaNotification();
        networkExecutor.shutdown();
    }
}
