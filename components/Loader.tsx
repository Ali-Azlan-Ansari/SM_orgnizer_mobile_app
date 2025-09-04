import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LoaderKitView } from 'react-native-loader-kit';
import { primaryColor } from './Color';

interface LoaderProps {
  visible: boolean;
  size?: number;
  animationSpeedMultiplier?: number;
  color?: string;
}

const Loader: React.FC<LoaderProps> = ({
  visible,
  size = 80,
  animationSpeedMultiplier = 1.0,
  color = primaryColor,
}) => {
  if (!visible) return null;

  return (
    <View style={styles.container} pointerEvents="none">
      <LoaderKitView
        style={{ width: size, height: size }}
        name="Orbit"
        animationSpeedMultiplier={animationSpeedMultiplier}
        color={color}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject, // full screen
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999, // upar dikhayega
  },
});

export default Loader;
