plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

android {
    namespace = "app.chaimai"
    compileSdk = 34

    signingConfigs {
        create("release") {
            if (project.hasProperty("android.injected.signing.store.file")) {
                storeFile = file(project.property("android.injected.signing.store.file") as String)
                storePassword = project.property("android.injected.signing.store.password") as String
                keyAlias = project.property("android.injected.signing.key.alias") as String
                keyPassword = project.property("android.injected.signing.key.password") as String
            }
        }
    }

    defaultConfig {
        applicationId = "app.chaimai"
        minSdk = 26
        targetSdk = 34
        versionCode = 1
        versionName = "1.0"
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            signingConfig = signingConfigs.getByName("release")
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions { jvmTarget = "17" }
    
    sourceSets.getByName("main").assets.srcDir("../../web")
}

dependencies {
    implementation("androidx.activity:activity-ktx:1.9.1")
    implementation("androidx.webkit:webkit:1.11.0")
}
