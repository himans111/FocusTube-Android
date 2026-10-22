package com.example.data.model

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "users")
data class UserAccount(
    @PrimaryKey(autoGenerate = true)
    val id: Long = 0,
    val email: String,
    val passwordHash: String = "",
    val displayName: String,
    val avatarColorHex: String = "#FF0000",
    val photoUrl: String = "",
    val isGoogleAccount: Boolean = false,
    val isLoggedIn: Boolean = false
)

@Entity(tableName = "channels")
data class ChannelEntity(
    @PrimaryKey
    val id: String,
    val title: String,
    val handle: String,
    val avatarUrl: String,
    val subscriberCount: String,
    val description: String,
    val category: String,
    val isSubscribed: Boolean = false
)

@Entity(tableName = "subscribed_channels")
data class SubscribedChannelEntity(
    @PrimaryKey
    val channelId: String,
    val title: String,
    val handle: String,
    val subscribedAt: Long = System.currentTimeMillis()
)

@Entity(tableName = "videos")
data class VideoEntity(
    @PrimaryKey
    val id: String,
    val youtubeVideoId: String,
    val channelId: String,
    val channelTitle: String,
    val channelAvatarUrl: String,
    val title: String,
    val description: String,
    val thumbnailUrl: String,
    val duration: String,
    val views: String,
    val publishedAt: String,
    val category: String = "Education"
)

/**
 * YouTube-style offline in-app downloaded video record.
 */
@Entity(tableName = "downloaded_videos")
data class DownloadEntity(
    @PrimaryKey
    val videoId: String,
    val youtubeVideoId: String,
    val title: String,
    val channelTitle: String,
    val channelAvatarUrl: String,
    val thumbnailUrl: String,
    val duration: String,
    val quality: String, // "1080p Full HD", "720p HD", "360p Data Saver"
    val fileSizeBytes: Long,
    val downloadProgress: Int = 100, // 0 to 100
    val isCompleted: Boolean = true,
    val downloadedAt: Long = System.currentTimeMillis()
)
