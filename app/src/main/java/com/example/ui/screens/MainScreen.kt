package com.example.ui.screens

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.navigationBars
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.windowInsetsPadding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Download
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.Subscriptions
import androidx.compose.material.icons.outlined.Download
import androidx.compose.material.icons.outlined.Home
import androidx.compose.material.icons.outlined.Subscriptions
import androidx.compose.material3.Badge
import androidx.compose.material3.BadgedBox
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.NavigationBarItemDefaults
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp
import com.example.ui.BottomNavTab
import com.example.ui.FocusTubeViewModel
import com.example.ui.theme.YouTubeRed

@Composable
fun MainScreen(viewModel: FocusTubeViewModel) {
    val currentTab by viewModel.currentBottomTab.collectAsState()
    val allDownloads by viewModel.allDownloads.collectAsState()

    Scaffold(
        bottomBar = {
            NavigationBar(
                containerColor = MaterialTheme.colorScheme.background,
                modifier = Modifier
                    .windowInsetsPadding(WindowInsets.navigationBars)
                    .testTag("bottom_navigation_bar")
            ) {
                // Home Tab
                NavigationBarItem(
                    selected = currentTab == BottomNavTab.HOME,
                    onClick = { viewModel.selectBottomTab(BottomNavTab.HOME) },
                    icon = {
                        Icon(
                            imageVector = if (currentTab == BottomNavTab.HOME) Icons.Filled.Home else Icons.Outlined.Home,
                            contentDescription = "Home"
                        )
                    },
                    label = { Text("Home", fontSize = 11.sp, fontWeight = FontWeight.Medium) },
                    colors = NavigationBarItemDefaults.colors(
                        selectedIconColor = YouTubeRed,
                        selectedTextColor = YouTubeRed,
                        indicatorColor = YouTubeRed.copy(alpha = 0.12f),
                        unselectedIconColor = MaterialTheme.colorScheme.onSurfaceVariant,
                        unselectedTextColor = MaterialTheme.colorScheme.onSurfaceVariant
                    ),
                    modifier = Modifier.testTag("tab_home")
                )

                // Subscriptions Tab
                NavigationBarItem(
                    selected = currentTab == BottomNavTab.SUBSCRIPTIONS,
                    onClick = { viewModel.selectBottomTab(BottomNavTab.SUBSCRIPTIONS) },
                    icon = {
                        Icon(
                            imageVector = if (currentTab == BottomNavTab.SUBSCRIPTIONS) Icons.Filled.Subscriptions else Icons.Outlined.Subscriptions,
                            contentDescription = "Subscriptions"
                        )
                    },
                    label = { Text("Subscriptions", fontSize = 11.sp, fontWeight = FontWeight.Medium) },
                    colors = NavigationBarItemDefaults.colors(
                        selectedIconColor = YouTubeRed,
                        selectedTextColor = YouTubeRed,
                        indicatorColor = YouTubeRed.copy(alpha = 0.12f),
                        unselectedIconColor = MaterialTheme.colorScheme.onSurfaceVariant,
                        unselectedTextColor = MaterialTheme.colorScheme.onSurfaceVariant
                    ),
                    modifier = Modifier.testTag("tab_subscriptions")
                )

                // Downloads Tab with Badge
                NavigationBarItem(
                    selected = currentTab == BottomNavTab.DOWNLOADS,
                    onClick = { viewModel.selectBottomTab(BottomNavTab.DOWNLOADS) },
                    icon = {
                        BadgedBox(
                            badge = {
                                if (allDownloads.isNotEmpty()) {
                                    Badge(containerColor = YouTubeRed, contentColor = Color.White) {
                                        Text("${allDownloads.size}")
                                    }
                                }
                            }
                        ) {
                            Icon(
                                imageVector = if (currentTab == BottomNavTab.DOWNLOADS) Icons.Filled.Download else Icons.Outlined.Download,
                                contentDescription = "Downloads"
                            )
                        }
                    },
                    label = { Text("Downloads", fontSize = 11.sp, fontWeight = FontWeight.Medium) },
                    colors = NavigationBarItemDefaults.colors(
                        selectedIconColor = YouTubeRed,
                        selectedTextColor = YouTubeRed,
                        indicatorColor = YouTubeRed.copy(alpha = 0.12f),
                        unselectedIconColor = MaterialTheme.colorScheme.onSurfaceVariant,
                        unselectedTextColor = MaterialTheme.colorScheme.onSurfaceVariant
                    ),
                    modifier = Modifier.testTag("tab_downloads")
                )
            }
        }
    ) { innerPadding ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
        ) {
            when (currentTab) {
                BottomNavTab.HOME -> {
                    HomeScreen(viewModel = viewModel)
                }
                BottomNavTab.SUBSCRIPTIONS -> {
                    ChannelSearchScreen(viewModel = viewModel)
                }
                BottomNavTab.DOWNLOADS -> {
                    DownloadsScreen(viewModel = viewModel)
                }
            }
        }
    }
}
