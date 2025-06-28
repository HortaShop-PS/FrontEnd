import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface AvatarProps {
  size?: number;
  backgroundColor?: string;
  iconColor?: string;
  borderColor?: string;
  style?: any;
}

export const Avatar: React.FC<AvatarProps> = ({
  size = 100,
  backgroundColor = '#F0F8FF',
  iconColor = '#6CC51D',
  borderColor = '#6CC51D',
  style
}) => {
  const iconSize = size * 0.5;

  return (
    <View 
      style={[
        styles.container, 
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor,
          borderColor,
        },
        style
      ]}
    >
      <Ionicons name="person" size={iconSize} color={iconColor} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 2,
  },
});