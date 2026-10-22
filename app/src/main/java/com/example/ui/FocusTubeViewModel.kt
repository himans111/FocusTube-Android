package com.example.ui

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.example.data.local.FocusTubeDatabase
import com.example.data.model.ChannelEntity
import com.example.data.model.DownloadEntity
import com.example.data.model.UserAccount
import com.example.data.model.VideoEntity
import com.example.data.repository.FocusTubeRepository
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.flatMapLatest
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch

sealed class AppScreen {
    object Main : AppScreen()
    object Search : AppScreen()
    object Player : AppScreen()
    object Auth : AppScreen()
}

enum class BottomNavTab {
    HOME,
    SUBSCRIPTIONS,
    DOWNLOADS
}

class FocusTubeViewModel(application: Application) : AndroidViewModel(application) {

    private val repository: FocusTubeRepository

    private val _currentScreen = MutableStateFlow<AppScreen>(AppScreen.Main)
    val currentScreen: StateFlow<AppScreen> = _currentScreen.asStateFlow()

    private val _currentBottomTab = MutableStateFlow(BottomNavTab.HOME)
    val currentBottomTab: StateFlow<BottomNavTab> = _currentBottomTab.asStateFlow()

    private val _currentPlayingVideo = MutableStateFlow<VideoEntity?>(null)
    val currentPlayingVideo: StateFlow<VideoEntity?> = _currentPlayingVideo.asStateFlow()

    private val _searchQuery = MutableStateFlow("")
    val searchQuery: StateFlow<String> = _searchQuery.asStateFlow()

    private val _selectedCategory = MutableStateFlow("All")
    val selectedCategory: StateFlow<String> = _selectedCategory.asStateFlow()

    private val _authError = MutableStateFlow<String?>(null)
    val authError: StateFlow<String?> = _authError.asStateFlow()

    private val _authLoading = MutableStateFlow(false)
    val authLoading: StateFlow<Boolean> = _authLoading.asStateFlow()

    private val _isPiPMode = MutableStateFlow(false)
    val isPiPMode: StateFlow<Boolean> = _isPiPMode.asStateFlow()

    // Active User
    val currentUser: StateFlow<UserAccount?>

    // Subscriptions
    val subscribedChannels: StateFlow<List<ChannelEntity>>
    val allChannels: StateFlow<List<ChannelEntity>>

    // Strict Subscribed Videos Feed
    val filteredSubscribedVideos: StateFlow<List<VideoEntity>>

    // Downloads
    val allDownloads: StateFlow<List<DownloadEntity>>
    val totalDownloadSizeString: StateFlow<String>

    // Channel Search Results
    @OptIn(ExperimentalCoroutinesApi::class)
    val channelSearchResults: StateFlow<List<ChannelEntity>>

    init {
        val database = FocusTubeDatabase.getDatabase(application, viewModelScope)
        repository = FocusTubeRepository(
            userDao = database.userDao(),
            channelDao = database.channelDao(),
            subscribedChannelDao = database.subscribedChannelDao(),
            videoDao = database.videoDao(),
            downloadDao = database.downloadDao()
        )

        viewModelScope.launch {
            repository.ensureSeeded()
        }

        currentUser = repository.activeUser.stateIn(
            scope = viewModelScope,
            started = SharingStarted.WhileSubscribed(5000),
            initialValue = null
        )

        subscribedChannels = repository.subscribedChannels.stateIn(
            scope = viewModelScope,
            started = SharingStarted.WhileSubscribed(5000),
            initialValue = emptyList()
        )

        allChannels = repository.allChannels.stateIn(
            scope = viewModelScope,
            started = SharingStarted.WhileSubscribed(5000),
            initialValue = emptyList()
        )

        allDownloads = repository.allDownloads.stateIn(
            scope = viewModelScope,
            started = SharingStarted.WhileSubscribed(5000),
            initialValue = emptyList()
        )

        totalDownloadSizeString = repository.totalDownloadSizeBytes.map { bytes ->
            val total = bytes ?: 0L
            val mb = total / (1024.0 * 1024.0)
            if (mb > 1000) {
                String.format("%.1f GB", mb / 1024.0)
            } else {
                String.format("%.1f MB", mb)
            }
        }.stateIn(
            scope = viewModelScope,
            started = SharingStarted.WhileSubscribed(5000),
            initialValue = "0 MB"
        )

        filteredSubscribedVideos = combine(
            repository.subscribedVideosFeed,
            _selectedCategory
        ) { videos, category ->
            if (category == "All") {
                videos
            } else {
                videos.filter { it.category.equals(category, ignoreCase = true) }
            }
        }.stateIn(
            scope = viewModelScope,
            started = SharingStarted.WhileSubscribed(5000),
            initialValue = emptyList()
        )

        channelSearchResults = _searchQuery.flatMapLatest { query ->
            if (query.isBlank()) {
                repository.allChannels
            } else {
                repository.searchChannels(query)
            }
        }.stateIn(
            scope = viewModelScope,
            started = SharingStarted.WhileSubscribed(5000),
            initialValue = emptyList()
        )
    }

    fun navigateTo(screen: AppScreen) {
        _currentScreen.value = screen
    }

    fun selectBottomTab(tab: BottomNavTab) {
        _currentBottomTab.value = tab
        _currentScreen.value = AppScreen.Main
    }

    fun onSearchQueryChanged(newQuery: String) {
        _searchQuery.value = newQuery
    }

    fun selectCategory(category: String) {
        _selectedCategory.value = category
    }

    fun playVideo(video: VideoEntity) {
        _currentPlayingVideo.value = video
        _currentScreen.value = AppScreen.Player
    }

    fun playDownloadedVideo(download: DownloadEntity) {
        val video = VideoEntity(
            id = download.videoId,
            youtubeVideoId = download.youtubeVideoId,
            channelId = "downloaded",
            channelTitle = download.channelTitle,
            channelAvatarUrl = download.channelAvatarUrl,
            title = download.title,
            description = "Offline downloaded video • Quality: ${download.quality}",
            thumbnailUrl = download.thumbnailUrl,
            duration = download.duration,
            views = "Downloaded Offline",
            publishedAt = "Saved to device"
        )
        _currentPlayingVideo.value = video
        _currentScreen.value = AppScreen.Player
    }

    fun closePlayer() {
        _currentPlayingVideo.value = null
        _currentScreen.value = AppScreen.Main
    }

    fun setPiPMode(enabled: Boolean) {
        _isPiPMode.value = enabled
    }

    fun toggleSubscription(channelId: String) {
        viewModelScope.launch {
            repository.toggleSubscription(channelId)
        }
    }

    fun subscribeCustomChannel(name: String, handle: String) {
        viewModelScope.launch {
            repository.subscribeToCustomChannel(name, handle)
            _searchQuery.value = ""
            _currentScreen.value = AppScreen.Main
        }
    }

    // In-app video download
    fun startDownload(video: VideoEntity, quality: String = "720p HD") {
        viewModelScope.launch {
            repository.startDownload(video, quality)
        }
    }

    fun deleteDownload(videoId: String) {
        viewModelScope.launch {
            repository.deleteDownload(videoId)
        }
    }

    fun deleteAllDownloads() {
        viewModelScope.launch {
            repository.deleteAllDownloads()
        }
    }

    // Google Sign-In with 100% Reliability
    fun continueWithGoogle(
        email: String = "vinitkumar8102305471@gmail.com",
        displayName: String = "Vinit Kumar"
    ) {
        _authLoading.value = true
        _authError.value = null
        viewModelScope.launch {
            repository.signInWithGoogle(email, displayName)
            _authLoading.value = false
            _currentScreen.value = AppScreen.Main
        }
    }

    fun signIn(email: String, password: String) {
        if (email.isBlank() || password.isBlank()) {
            _authError.value = "Please enter both email and password."
            return
        }
        _authLoading.value = true
        _authError.value = null
        viewModelScope.launch {
            val result = repository.signIn(email, password)
            _authLoading.value = false
            result.onSuccess {
                _currentScreen.value = AppScreen.Main
            }.onFailure { err ->
                _authError.value = err.message ?: "Authentication failed."
            }
        }
    }

    fun guestSignIn() {
        _authLoading.value = true
        _authError.value = null
        viewModelScope.launch {
            repository.guestSignIn()
            _authLoading.value = false
            _currentScreen.value = AppScreen.Main
        }
    }

    fun signOut() {
        viewModelScope.launch {
            repository.signOut()
            _currentPlayingVideo.value = null
            _currentScreen.value = AppScreen.Auth
        }
    }
}
