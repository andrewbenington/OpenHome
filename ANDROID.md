# Android Development Notes

- Run `pnpm tauri android init` to generate the Android project
- Update `src-tauri/gen/android/app/src/main/AndroidManifest.xml` to have file access permissions:
  - ```XML
    <manifest xmlns:android="http://schemas.android.com/apk/res/android">
        <uses-permission android:name="android.permission.INTERNET" />
        <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE"/>
        <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
        ...
    ```
- You may have issues with the Tauri commands accessing `pnpm`. I had to add a hard symlink at `/usr/local/bin/pnpm`.
- Menu functionality is not compatible
- Reading a file seems to give a `content://` link instead of a filepath. This will not work with the `fs` calls in Rust, but will work with the Tauri fs plugin
- I've only tried it on a tablet. I imagine the UI needs to be significantly adjusted for a phone display
