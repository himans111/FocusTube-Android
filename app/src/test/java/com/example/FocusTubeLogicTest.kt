package com.example

import com.example.data.model.ChannelEntity
import com.example.data.model.DownloadEntity
import com.example.data.model.UserAccount
import com.example.data.model.VideoEntity
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertTrue
import org.junit.Test

class FocusTubeLogicTest {

    @Test
    fun `subscribed channel filter strictly excludes unapproved channels`() {
        val channels = listOf(
            ChannelEntity("c1", "Coding Edu", "@coding", "", "1M", "", "Tech", isSubscribed = true),
            ChannelEntity("c2", "Random Distraction", "@clickbait", "", "5M", "", "Vlogs", isSubscribed = false)
        )

        val videos = listOf(
            VideoEntity("v1", "yt1", "c1", "Coding Edu", "", "Learn Kotlin", "", "", "10:00", "100K", "Today"),
            VideoEntity("v2", "yt2", "c2", "Random Distraction", "", "Shocking Viral Video", "", "", "5:00", "2M", "Today")
        )

        val subscribedChannelIds = channels.filter { it.isSubscribed }.map { it.id }.toSet()
        val filteredVideos = videos.filter { it.channelId in subscribedChannelIds }

        assertEquals(1, filteredVideos.size)
        assertEquals("v1", filteredVideos.first().id)
        assertEquals("Learn Kotlin", filteredVideos.first().title)
        assertFalse(filteredVideos.any { it.channelId == "c2" })
    }

    @Test
    fun `channel subscription toggling updates state correctly`() {
        var channel = ChannelEntity("c1", "Veritasium", "@veritasium", "", "16M", "", "Science", isSubscribed = false)
        assertFalse(channel.isSubscribed)

        // Subscribe
        channel = channel.copy(isSubscribed = true)
        assertTrue(channel.isSubscribed)

        // Unsubscribe
        channel = channel.copy(isSubscribed = false)
        assertFalse(channel.isSubscribed)
    }

    @Test
    fun `offline video download creation calculates correct storage and completion`() {
        val download = DownloadEntity(
            videoId = "v100",
            youtubeVideoId = "yt_test",
            title = "Android Jetpack Compose",
            channelTitle = "Android Devs",
            channelAvatarUrl = "",
            thumbnailUrl = "",
            duration = "14:20",
            quality = "1080p Full HD",
            fileSizeBytes = 48_500_000L,
            downloadProgress = 100,
            isCompleted = true
        )

        assertTrue(download.isCompleted)
        assertEquals(100, download.downloadProgress)
        assertEquals("1080p Full HD", download.quality)
        assertTrue(download.fileSizeBytes > 40_000_000L)
    }

    @Test
    fun `google account sign-in sets isGoogleAccount flag and active session`() {
        val googleUser = UserAccount(
            email = "vinitkumar8102305471@gmail.com",
            displayName = "Vinit Kumar",
            isGoogleAccount = true,
            isLoggedIn = true
        )

        assertTrue(googleUser.isGoogleAccount)
        assertTrue(googleUser.isLoggedIn)
        assertEquals("vinitkumar8102305471@gmail.com", googleUser.email)
    }
}
