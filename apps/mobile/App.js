import { SafeAreaView, Platform } from 'react-native';
import Constants from 'expo-constants';
import { WebView } from 'react-native-webview';

// Update this URL with your actual GitHub Pages URL
// Format: https://YOUR_USERNAME.github.io/Rental_App/
const SITE_URL = 'https://hones.github.io/Rental_App/';

export default function App() {
  return (
    <SafeAreaView style={{ flex: 1, paddingTop: Platform.OS === 'android' ? Constants.statusBarHeight : 0 }}>
      <WebView
        source={{ uri: SITE_URL }}
        style={{ flex: 1 }}
        originWhitelist={['*']}
        allowsInlineMediaPlayback
        javaScriptEnabled
        domStorageEnabled
        mixedContentMode="always"
        setSupportMultipleWindows={false}
        startInLoadingState
        onError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          console.warn('WebView error: ', nativeEvent);
        }}
        onHttpError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          console.warn('WebView HTTP error: ', nativeEvent);
        }}
      />
    </SafeAreaView>
  );
}
