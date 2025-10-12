import React, { Dispatch, SetStateAction, useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Text, SafeAreaView, Platform } from 'react-native';
import LottieView from 'lottie-react-native';

interface SplashProps {
  setIsLoading: Dispatch<SetStateAction<boolean>>;
  appName?: string;
}

const Splash: React.FC<SplashProps> = ({
  setIsLoading,
  appName = 'Study Material Organizer',
}) => {
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const organizerScale = useRef(new Animated.Value(1)).current;
  const mountedRef = useRef(true);

  useEffect(() => {
    // parallel: title & tagline (staggered), plus pulse
    Animated.parallel([
      Animated.timing(titleOpacity, {
        toValue: 1,
        duration: 150,
        delay: 0,
        useNativeDriver: true,
      }),
      Animated.timing(taglineOpacity, {
        toValue: 1,
        duration: 150,
        delay: 100, // slight stagger but still within 1s
        useNativeDriver: true,
      }),
    ]).start();

    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(organizerScale, {
          toValue: 1.08,
          duration: 120,
          useNativeDriver: true,
        }),
        Animated.timing(organizerScale, {
          toValue: 1,
          duration: 80,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();

    // exactly 1s then finish loading
    const fallback = setTimeout(() => {
      if (mountedRef.current) setIsLoading(false);
    }, 1000);

    return () => {
      mountedRef.current = false;
      clearTimeout(fallback);
      pulse.stop();
    };
  }, [titleOpacity, taglineOpacity, organizerScale, setIsLoading]);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <LottieView
          source={require('./assets/animation.json')}
          autoPlay
          loop={true}
          resizeMode='contain'
          style={styles.animation}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#212b46',
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#212b46',
  },
  animation: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  textWrapper: {
    position: 'absolute',
    bottom: 100,
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 34,
    fontWeight: '900',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 6,
    flexWrap: 'wrap',
  },
  study: {
    color: '#ffa500',
   
  },
  material: {
    color: '#ffa500',
   
  },
  organizer: {
    color: '#ffa500',
  
  },
  tagline: {
    fontSize: 16,
    marginTop: 6,
    fontStyle: 'italic',
    color: '#ffa500',
  },
});

export default Splash;
