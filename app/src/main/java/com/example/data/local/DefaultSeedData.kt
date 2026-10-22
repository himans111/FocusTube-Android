package com.example.data.local

import com.example.data.model.ChannelEntity
import com.example.data.model.VideoEntity

object DefaultSeedData {

    val INITIAL_CHANNELS = listOf(
        ChannelEntity(
            id = "c_freecodecamp",
            title = "freeCodeCamp.org",
            handle = "@freecodecamp",
            avatarUrl = "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=200&h=200&fit=crop",
            subscriberCount = "10.1M",
            description = "Learn to code for free with full-length tutorials on Python, Kotlin, Web development, and AI.",
            category = "Coding",
            isSubscribed = true // Pre-subscribed for a great zero-state experience
        ),
        ChannelEntity(
            id = "c_veritasium",
            title = "Veritasium",
            handle = "@veritasium",
            avatarUrl = "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=200&h=200&fit=crop",
            subscriberCount = "16.8M",
            description = "An element of truth - videos about science, education, physics, and mind-bending discoveries.",
            category = "Science",
            isSubscribed = true
        ),
        ChannelEntity(
            id = "c_androiddevs",
            title = "Android Developers",
            handle = "@AndroidDevelopers",
            avatarUrl = "https://images.unsplash.com/photo-1607252650355-f7fd0460ccdb?w=200&h=200&fit=crop",
            subscriberCount = "1.5M",
            description = "Official announcements, deep dives into Jetpack Compose, Kotlin, and modern Android development.",
            category = "Technology",
            isSubscribed = true
        ),
        ChannelEntity(
            id = "c_3blue1brown",
            title = "3Blue1Brown",
            handle = "@3blue1brown",
            avatarUrl = "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=200&h=200&fit=crop",
            subscriberCount = "6.5M",
            description = "Grant Sanderson's animation-driven mathematics, neural networks, and linear algebra breakdowns.",
            category = "Math & Science",
            isSubscribed = false
        ),
        ChannelEntity(
            id = "c_mit_ocw",
            title = "MIT OpenCourseWare",
            handle = "@mitocw",
            avatarUrl = "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=200&h=200&fit=crop",
            subscriberCount = "5.3M",
            description = "Full MIT college courses and lectures freely available to curious minds worldwide.",
            category = "Education",
            isSubscribed = false
        ),
        ChannelEntity(
            id = "c_teded",
            title = "TED-Ed",
            handle = "@TEDEd",
            avatarUrl = "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=200&h=200&fit=crop",
            subscriberCount = "19.5M",
            description = "Lessons worth sharing — captivating short animations answering curious questions of life and history.",
            category = "Education",
            isSubscribed = false
        ),
        ChannelEntity(
            id = "c_fireship",
            title = "Fireship",
            handle = "@Fireship",
            avatarUrl = "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=200&h=200&fit=crop",
            subscriberCount = "3.4M",
            description = "High-intensity code tutorials and tech industry breakdown in 100 seconds.",
            category = "Coding",
            isSubscribed = false
        ),
        ChannelEntity(
            id = "c_kurzgesagt",
            title = "Kurzgesagt – In a Nutshell",
            handle = "@kurzgesagt",
            avatarUrl = "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=200&h=200&fit=crop",
            subscriberCount = "22.8M",
            description = "Videos explaining things with optimistic nihilism: space, science, humanity, and philosophy.",
            category = "Science",
            isSubscribed = false
        )
    )

    val INITIAL_VIDEOS = listOf(
        // freeCodeCamp videos
        VideoEntity(
            id = "v_fcc_1",
            youtubeVideoId = "fis26HvvDII",
            channelId = "c_freecodecamp",
            channelTitle = "freeCodeCamp.org",
            channelAvatarUrl = "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=200&h=200&fit=crop",
            title = "Kotlin Programming Course - Tutorial for Beginners",
            description = "Learn Kotlin programming in this complete course. Kotlin is a modern programming language that compiles to Java bytecode.",
            thumbnailUrl = "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&h=450&fit=crop",
            duration = "2:37:12",
            views = "840K views",
            publishedAt = "2 weeks ago",
            category = "Coding"
        ),
        VideoEntity(
            id = "v_fcc_2",
            youtubeVideoId = "bbZ_Ie_D9Jk",
            channelId = "c_freecodecamp",
            channelTitle = "freeCodeCamp.org",
            channelAvatarUrl = "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=200&h=200&fit=crop",
            title = "Android App Development with Jetpack Compose - Full Course",
            description = "Build modern Android applications using Jetpack Compose, Kotlin, Stateflow, and Architecture Components.",
            thumbnailUrl = "https://images.unsplash.com/photo-1607252650355-f7fd0460ccdb?w=800&h=450&fit=crop",
            duration = "4:15:30",
            views = "1.2M views",
            publishedAt = "1 month ago",
            category = "Coding"
        ),

        // Veritasium videos
        VideoEntity(
            id = "v_ver_1",
            youtubeVideoId = "heKK95DAKms",
            channelId = "c_veritasium",
            channelTitle = "Veritasium",
            channelAvatarUrl = "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=200&h=200&fit=crop",
            title = "Why Gravity is NOT a Force",
            description = "Einstein's General Relativity revealed that gravity is not an invisible force pulling objects, but the warping of spacetime.",
            thumbnailUrl = "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&h=450&fit=crop",
            duration = "17:15",
            views = "14M views",
            publishedAt = "3 days ago",
            category = "Science"
        ),
        VideoEntity(
            id = "v_ver_2",
            youtubeVideoId = "4b84kS2Ei3s",
            channelId = "c_veritasium",
            channelTitle = "Veritasium",
            channelAvatarUrl = "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=200&h=200&fit=crop",
            title = "The Simplest Math Problem No One Can Solve",
            description = "The Collatz Conjecture is the simplest problem in mathematics that remains completely unproven.",
            thumbnailUrl = "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=800&h=450&fit=crop",
            duration = "22:04",
            views = "32M views",
            publishedAt = "1 month ago",
            category = "Science"
        ),

        // Android Developers videos
        VideoEntity(
            id = "v_and_1",
            youtubeVideoId = "D_kP07oVb30",
            channelId = "c_androiddevs",
            channelTitle = "Android Developers",
            channelAvatarUrl = "https://images.unsplash.com/photo-1607252650355-f7fd0460ccdb?w=200&h=200&fit=crop",
            title = "What's new in Jetpack Compose and Material 3",
            description = "Discover the newest APIs, performance improvements, and adaptive UI layouts in Jetpack Compose.",
            thumbnailUrl = "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&h=450&fit=crop",
            duration = "24:38",
            views = "320K views",
            publishedAt = "5 days ago",
            category = "Technology"
        ),
        VideoEntity(
            id = "v_and_2",
            youtubeVideoId = "eo_ZkE1R1x0",
            channelId = "c_androiddevs",
            channelTitle = "Android Developers",
            channelAvatarUrl = "https://images.unsplash.com/photo-1607252650355-f7fd0460ccdb?w=200&h=200&fit=crop",
            title = "Building Picture-in-Picture & Multi-window on Android",
            description = "Learn how to optimize video streaming apps for seamless Picture-in-Picture transitions and background playback.",
            thumbnailUrl = "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=800&h=450&fit=crop",
            duration = "14:50",
            views = "180K views",
            publishedAt = "2 weeks ago",
            category = "Technology"
        ),

        // 3Blue1Brown videos (available once subscribed)
        VideoEntity(
            id = "v_3b1b_1",
            youtubeVideoId = "aircAruvnKk",
            channelId = "c_3blue1brown",
            channelTitle = "3Blue1Brown",
            channelAvatarUrl = "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=200&h=200&fit=crop",
            title = "Neural Networks - But What is a Neural Network? Chapter 1",
            description = "What are the neurons, weights, biases, and matrix operations that make deep learning actually work?",
            thumbnailUrl = "https://images.unsplash.com/photo-1509228468518-180dd4864904?w=800&h=450&fit=crop",
            duration = "19:13",
            views = "18M views",
            publishedAt = "3 weeks ago",
            category = "Math & Science"
        ),

        // MIT OCW video
        VideoEntity(
            id = "v_mit_1",
            youtubeVideoId = "7K1sB05pE0A",
            channelId = "c_mit_ocw",
            channelTitle = "MIT OpenCourseWare",
            channelAvatarUrl = "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=200&h=200&fit=crop",
            title = "MIT 6.0001 Introduction to Computer Science and Programming",
            description = "MIT Professor Ana Bell introduces fundamental concepts of computational problem solving and algorithms.",
            thumbnailUrl = "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800&h=450&fit=crop",
            duration = "51:44",
            views = "4.2M views",
            publishedAt = "1 month ago",
            category = "Education"
        )
    )
}
