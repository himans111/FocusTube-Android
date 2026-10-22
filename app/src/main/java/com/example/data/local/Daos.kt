package com.example.data.local

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import androidx.room.Update
import com.example.data.model.ChannelEntity
import com.example.data.model.DownloadEntity
import com.example.data.model.SubscribedChannelEntity
import com.example.data.model.UserAccount
import com.example.data.model.VideoEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface UserDao {
    @Query("SELECT * FROM users WHERE email = :email LIMIT 1")
    suspend fun getUserByEmail(email: String): UserAccount?

    @Query("SELECT * FROM users WHERE isLoggedIn = 1 LIMIT 1")
    fun getActiveUserFlow(): Flow<UserAccount?>

    @Query("SELECT * FROM users WHERE isLoggedIn = 1 LIMIT 1")
    suspend fun getActiveUser(): UserAccount?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertUser(user: UserAccount): Long

    @Update
    suspend fun updateUser(user: UserAccount)

    @Query("UPDATE users SET isLoggedIn = 0")
    suspend fun logoutAllUsers()

    @Query("UPDATE users SET isLoggedIn = 1 WHERE id = :userId")
    suspend fun setLoggedInUser(userId: Long)
}

@Dao
interface SubscribedChannelDao {
    @Query("SELECT channelId FROM subscribed_channels ORDER BY subscribedAt DESC")
    fun getAllSubscribedChannelIdsFlow(): Flow<List<String>>

    @Query("SELECT * FROM subscribed_channels ORDER BY subscribedAt DESC")
    fun getAllSubscribedChannelsFlow(): Flow<List<SubscribedChannelEntity>>

    @Query("SELECT EXISTS(SELECT 1 FROM subscribed_channels WHERE channelId = :channelId)")
    suspend fun isChannelSubscribed(channelId: String): Boolean

    @Query("SELECT EXISTS(SELECT 1 FROM subscribed_channels WHERE channelId = :channelId)")
    fun isChannelSubscribedFlow(channelId: String): Flow<Boolean>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun subscribe(channel: SubscribedChannelEntity)

    @Query("DELETE FROM subscribed_channels WHERE channelId = :channelId")
    suspend fun unsubscribe(channelId: String)

    @Query("SELECT COUNT(*) FROM subscribed_channels")
    suspend fun getSubscribedCount(): Int
}

@Dao
interface ChannelDao {
    @Query("SELECT * FROM channels ORDER BY title ASC")
    fun getAllChannels(): Flow<List<ChannelEntity>>

    @Query("SELECT * FROM channels WHERE isSubscribed = 1 ORDER BY title ASC")
    fun getSubscribedChannels(): Flow<List<ChannelEntity>>

    @Query("SELECT * FROM channels WHERE title LIKE '%' || :query || '%' OR handle LIKE '%' || :query || '%' OR category LIKE '%' || :query || '%'")
    fun searchChannels(query: String): Flow<List<ChannelEntity>>

    @Query("SELECT * FROM channels WHERE id = :channelId LIMIT 1")
    suspend fun getChannelById(channelId: String): ChannelEntity?

    @Insert(onConflict = OnConflictStrategy.IGNORE)
    suspend fun insertChannels(channels: List<ChannelEntity>)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertOrUpdateChannel(channel: ChannelEntity)

    @Query("UPDATE channels SET isSubscribed = :isSubscribed WHERE id = :channelId")
    suspend fun updateSubscription(channelId: String, isSubscribed: Boolean)

    @Query("SELECT COUNT(*) FROM channels WHERE isSubscribed = 1")
    suspend fun getSubscribedCount(): Int
}

@Dao
interface VideoDao {
    @Query("""
        SELECT v.* FROM videos v
        INNER JOIN channels c ON v.channelId = c.id
        WHERE c.isSubscribed = 1
        ORDER BY v.id DESC
    """)
    fun getSubscribedVideosFeed(): Flow<List<VideoEntity>>

    @Query("SELECT * FROM videos WHERE channelId = :channelId ORDER BY id DESC")
    fun getVideosForChannel(channelId: String): Flow<List<VideoEntity>>

    @Query("SELECT * FROM videos WHERE youtubeVideoId = :videoId LIMIT 1")
    suspend fun getVideoByYoutubeId(videoId: String): VideoEntity?

    @Insert(onConflict = OnConflictStrategy.IGNORE)
    suspend fun insertVideos(videos: List<VideoEntity>)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertOrUpdateVideo(video: VideoEntity)
}

/**
 * DAO for managing offline downloaded videos just like YouTube.
 */
@Dao
interface DownloadDao {
    @Query("SELECT * FROM downloaded_videos ORDER BY downloadedAt DESC")
    fun getAllDownloadsFlow(): Flow<List<DownloadEntity>>

    @Query("SELECT * FROM downloaded_videos WHERE videoId = :videoId LIMIT 1")
    fun getDownloadFlow(videoId: String): Flow<DownloadEntity?>

    @Query("SELECT * FROM downloaded_videos WHERE videoId = :videoId LIMIT 1")
    suspend fun getDownload(videoId: String): DownloadEntity?

    @Query("SELECT EXISTS(SELECT 1 FROM downloaded_videos WHERE videoId = :videoId AND isCompleted = 1)")
    fun isDownloadedFlow(videoId: String): Flow<Boolean>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertOrUpdate(download: DownloadEntity)

    @Query("UPDATE downloaded_videos SET downloadProgress = :progress, isCompleted = :completed WHERE videoId = :videoId")
    suspend fun updateProgress(videoId: String, progress: Int, completed: Boolean)

    @Query("DELETE FROM downloaded_videos WHERE videoId = :videoId")
    suspend fun deleteDownload(videoId: String)

    @Query("DELETE FROM downloaded_videos")
    suspend fun deleteAllDownloads()

    @Query("SELECT SUM(fileSizeBytes) FROM downloaded_videos WHERE isCompleted = 1")
    fun getTotalDownloadSizeFlow(): Flow<Long?>
}
