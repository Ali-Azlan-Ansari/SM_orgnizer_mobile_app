import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Text,
  SafeAreaView,
  Platform,
  Dimensions,
} from 'react-native';
import LottieView from 'lottie-react-native';

interface SplashProps {
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
}

const Splash: React.FC<SplashProps> = ({ setIsLoading }) => {
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const mountedRef = useRef(true);
  const { height } = Dimensions.get('window');

  useEffect(() => {
    // Fade-in & pulse animation
    Animated.parallel([
      Animated.timing(titleOpacity, {
        toValue: 1,
        duration: 600,
        delay: 400,
        useNativeDriver: true,
      }),
      Animated.loop(
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 1.05,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
        ])
      ),
    ]).start();

    // Timeout for navigation or hiding splash
    const timeout = setTimeout(() => {
      if (mountedRef.current) setIsLoading(false);
    }, 2000);

    return () => {
      mountedRef.current = false;
      clearTimeout(timeout);
    };
  }, [titleOpacity, scaleAnim, setIsLoading]);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {/* Animation */}
        <LottieView
          source={require('./assets/animation.json')}
          autoPlay
          loop
          resizeMode="contain"
          style={[styles.animation, { height: height * 0.35, width: height * 0.35 }]}
        />

        {/* App Name Text */}
        <Animated.Text
          style={[
            styles.title,
            {
              opacity: titleOpacity,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          SM Organizer
        </Animated.Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#212b46',
    paddingTop: Platform.OS === 'android' ? 30 : 0, // Safe for Android notch
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  animation: {
    marginBottom: 40,
  },
  title: {
    fontSize: 34,
    fontWeight: '900',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 6,
    color: '#ffffff',
    letterSpacing: 1,
  },
});

export default Splash;
