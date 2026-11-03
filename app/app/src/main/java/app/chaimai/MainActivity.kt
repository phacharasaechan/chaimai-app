package app.chaimai

import android.annotation.SuppressLint
import android.content.Intent
import android.content.res.Configuration
import android.graphics.Color
import android.os.Bundle
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.activity.ComponentActivity
import androidx.activity.OnBackPressedCallback
import androidx.core.graphics.ColorUtils
import androidx.core.view.WindowCompat
import androidx.webkit.WebViewAssetLoader

class MainActivity : ComponentActivity() {
    private lateinit var web: WebView
    private lateinit var assetLoader: WebViewAssetLoader

    // ./web is served from the APK's assets over https, so the page behaves like a real site
    // (localStorage, hash routing, fonts) instead of an old-style file:// page.
    private val appHost = "appassets.androidplatform.net"
    private val startUrl = "https://appassets.androidplatform.net/assets/index.html"

    private val isNight: Boolean
        get() = (resources.configuration.uiMode and Configuration.UI_MODE_NIGHT_MASK) ==
            Configuration.UI_MODE_NIGHT_YES

    // Returns the page's background as #rrggbb ('' if unknown/transparent)
    private val colorJs = """
        (function(){
          function norm(c){
            if(!c)return '';
            var x=document.createElement('canvas').getContext('2d');
            x.fillStyle='#000';x.fillStyle=c;var v=x.fillStyle;
            return /^#[0-9a-f]{6}$/i.test(v)?v:'';
          }
          var r='';
          if(document.body)r=norm(getComputedStyle(document.body).backgroundColor);
          if(!r)r=norm(getComputedStyle(document.documentElement).backgroundColor);
          return r;
        })();
    """.trimIndent()

    // Closes the custom keypad if it is open; returns 1 when it did.
    private val closeKeypadJs = """
        (function(){
          var a=document.activeElement;
          if(a&&a.hasAttribute&&a.hasAttribute('data-num')){a.blur();return 1;}
          return 0;
        })();
    """.trimIndent()

    private fun prefs() = getSharedPreferences("ui", MODE_PRIVATE)
    private fun prefKey() = if (isNight) "bar_night" else "bar_day"

    private fun applyBarColor(color: Int) {
        web.setBackgroundColor(color)
        if (window.statusBarColor == color) return
        window.statusBarColor = color
        WindowCompat.getInsetsController(window, window.decorView)
            .isAppearanceLightStatusBars = ColorUtils.calculateLuminance(color) > 0.5
        prefs().edit().putInt(prefKey(), color).apply() // reused for instant colour on next launch
    }

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        assetLoader = WebViewAssetLoader.Builder()
            .setDomain(appHost)
            .addPathHandler("/assets/", WebViewAssetLoader.AssetsPathHandler(this))
            .build()

        web = WebView(this)
        web.setDefaultFocusHighlightEnabled(false)
        setContentView(web)
        applyBarColor(prefs().getInt(prefKey(), if (isNight) Color.parseColor("#0E1513") else Color.parseColor("#F4FAF7")))

        web.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            allowFileAccess = false
            allowContentAccess = false
        }

        web.webViewClient = object : WebViewClient() {
            override fun shouldInterceptRequest(v: WebView, r: WebResourceRequest): WebResourceResponse? =
                assetLoader.shouldInterceptRequest(r.url)

            override fun shouldOverrideUrlLoading(v: WebView, r: WebResourceRequest): Boolean {
                if (r.url.host == appHost) return false
                try { startActivity(Intent(Intent.ACTION_VIEW, r.url)) } catch (_: Exception) {}
                return true
            }

            override fun onPageFinished(v: WebView, url: String?) {
                v.evaluateJavascript(colorJs) { raw ->
                    val hex = raw?.trim('"')
                    if (!hex.isNullOrEmpty() && hex.startsWith("#")) {
                        runCatching { applyBarColor(Color.parseColor(hex)) }
                    }
                }
            }
        }

        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                // 1st: close the keypad if open. 2nd: go back through tabs. 3rd: exit.
                web.evaluateJavascript(closeKeypadJs) { r ->
                    if (r == "1") return@evaluateJavascript
                    if (web.canGoBack()) web.goBack()
                    else { isEnabled = false; onBackPressedDispatcher.onBackPressed() }
                }
            }
        })

        if (savedInstanceState != null) web.restoreState(savedInstanceState)
        else web.loadUrl(startUrl)
    }

    override fun onResume() { super.onResume(); web.onResume() }
    override fun onPause() { web.onPause(); super.onPause() }

    override fun onSaveInstanceState(outState: Bundle) {
        super.onSaveInstanceState(outState)
        web.saveState(outState)
    }
}
