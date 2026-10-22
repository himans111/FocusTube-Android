package com.example.data.local

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase
import androidx.sqlite.db.SupportSQLiteDatabase
import com.example.data.model.ChannelEntity
import com.example.data.model.DownloadEntity
import com.example.data.model.SubscribedChannelEntity
import com.example.data.model.UserAccount
import com.example.data.model.VideoEntity
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

@Database(
    entities = [
        UserAccount::class,
        ChannelEntity::class,
        SubscribedChannelEntity::class,
        VideoEntity::class,
        DownloadEntity::class
    ],
    version = 3,
    exportSchema = false
)
abstract class FocusTubeDatabase : RoomDatabase() {
    abstract fun userDao(): UserDao
    abstract fun channelDao(): ChannelDao
    abstract fun subscribedChannelDao(): SubscribedChannelDao
    abstract fun videoDao(): VideoDao
    abstract fun downloadDao(): DownloadDao

    companion object {
        @Volatile
        private var INSTANCE: FocusTubeDatabase? = null

        fun getDatabase(context: Context, scope: CoroutineScope): FocusTubeDatabase {
            return INSTANCE ?: synchronized(this) {
                val instance = Room.databaseBuilder(
                    context.applicationContext,
                    FocusTubeDatabase::class.java,
                    "focustube_database"
                )
                .addCallback(DatabaseCallback(scope))
                .fallbackToDestructiveMigration()
                .build()
                INSTANCE = instance
                instance
            }
        }

        private class DatabaseCallback(
            private val scope: CoroutineScope
        ) : RoomDatabase.Callback() {
            override fun onCreate(db: SupportSQLiteDatabase) {
                super.onCreate(db)
                INSTANCE?.let { database ->
                    scope.launch(Dispatchers.IO) {
                        populateInitialData(database)
                    }
                }
            }

            private suspend fun populateInitialData(database: FocusTubeDatabase) {
                database.channelDao().insertChannels(DefaultSeedData.INITIAL_CHANNELS)
                database.videoDao().insertVideos(DefaultSeedData.INITIAL_VIDEOS)
                
                DefaultSeedData.INITIAL_CHANNELS
                    .filter { it.isSubscribed }
                    .forEach { channel ->
                        database.subscribedChannelDao().subscribe(
                            SubscribedChannelEntity(
                                channelId = channel.id,
                                title = channel.title,
                                handle = channel.handle
                            )
                        )
                    }

                // Default initial account
                database.userDao().insertUser(
                    UserAccount(
                        email = "vinitkumar8102305471@gmail.com",
                        passwordHash = "google",
                        displayName = "Vinit Kumar",
                        avatarColorHex = "#FF0000",
                        isGoogleAccount = true,
                        isLoggedIn = true
                    )
                )

                // Pre-seed one sample downloaded video so the user can immediately experience offline playback!
                val sample = DefaultSeedData.INITIAL_VIDEOS.first()
                database.downloadDao().insertOrUpdate(
                    DownloadEntity(
                        videoId = sample.id,
                        youtubeVideoId = sample.youtubeVideoId,
                        title = sample.title,
                        channelTitle = sample.channelTitle,
                        channelAvatarUrl = sample.channelAvatarUrl,
                        thumbnailUrl = sample.thumbnailUrl,
                        duration = sample.duration,
                        quality = "720p HD",
                        fileSizeBytes = 28_400_000L,
                        downloadProgress = 100,
                        isCompleted = true
                    )
                )
            }
        }
    }
}
