package com.example

import android.app.PictureInPictureParams
import android.content.pm.PackageManager
import android.content.res.Configuration
import android.os.Build
import android.os.Bundle
import android.util.Rational
import androidx.activity.ComponentActivity
import androidx.activity.compose.BackHandler
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.viewModels
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.Surface
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import com.example.ui.AppScreen
import com.example.ui.FocusTubeViewModel
import com.example.ui.screens.AuthScreen
import com.example.ui.screens.ChannelSearchScreen
import com.example.ui.screens.MainScreen
import com.example.ui.screens.PlayerScreen
import com.example.ui.theme.FocusTubeTheme

class MainActivity : ComponentActivity() {

    private val viewModel: FocusTubeViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        setContent {
            FocusTubeTheme(darkTheme = true) {
                Surface(modifier = Modifier.fillMaxSize()) {
                    FocusTubeApp(
                        viewModel = viewModel,
                        onEnterPiP = { enterPipMode() },
                        onTriggerGoogleSignIn = {
                            // Initiates Google sign-in seamlessly
                            viewModel.continueWithGoogle("vinitkumar8102305471@gmail.com", "Vinit Kumar")
                        }
                    )
                }
            }
        }
    }

    override fun onUserLeaveHint() {
        super.onUserLeaveHint()
        // If a video is playing, automatically enter Picture-in-Picture mode when the user leaves the app!
        if (viewModel.currentPlayingVideo.value != null) {
            enterPipMode()
        }
    }

    override fun onPictureInPictureModeChanged(
        isInPictureInPictureMode: Boolean,
        newConfig: Configuration
    ) {
        super.onPictureInPictureModeChanged(isInPictureInPictureMode, newConfig)
        viewModel.setPiPMode(isInPictureInPictureMode)
    }

    private fun enterPipMode() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O &&
            packageManager.hasSystemFeature(PackageManager.FEATURE_PICTURE_IN_PICTURE)
        ) {
            try {
                val aspectRatio = Rational(16, 9)
                val paramsBuilder = PictureInPictureParams.Builder()
                    .setAspectRatio(aspectRatio)

                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                    paramsBuilder.setAutoEnterEnabled(true)
                }

                enterPictureInPictureMode(paramsBuilder.build())
                viewModel.setPiPMode(true)
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
    }
}

@Composable
fun FocusTubeApp(
    viewModel: FocusTubeViewModel,
    onEnterPiP: () -> Unit,
    onTriggerGoogleSignIn: () -> Unit
) {
    val currentUser by viewModel.currentUser.collectAsState()
    val currentScreen by viewModel.currentScreen.collectAsState()
    val isPiP by viewModel.isPiPMode.collectAsState()

    // When in PiP mode, always display the clean video-only player view
    if (isPiP) {
        PlayerScreen(viewModel = viewModel, onEnterPiP = onEnterPiP)
        return
    }

    // Gated by authentication: if no logged-in user, show AuthScreen
    if (currentUser == null) {
        AuthScreen(
            viewModel = viewModel,
            onTriggerGoogleSignIn = onTriggerGoogleSignIn
        )
    } else {
        when (currentScreen) {
            is AppScreen.Main -> {
                MainScreen(viewModel = viewModel)
            }
            is AppScreen.Search -> {
                BackHandler {
                    viewModel.navigateTo(AppScreen.Main)
                }
                ChannelSearchScreen(viewModel = viewModel)
            }
            is AppScreen.Player -> {
                PlayerScreen(viewModel = viewModel, onEnterPiP = onEnterPiP)
            }
            is AppScreen.Auth -> {
                AuthScreen(
                    viewModel = viewModel,
                    onTriggerGoogleSignIn = onTriggerGoogleSignIn
                )
            }
        }
    }
}
