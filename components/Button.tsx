import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';

interface ButtonProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  backgroundColor?: string; // Add a prop for custom background color
}

const Button: React.FC<ButtonProps> = ({ title, onPress, disabled, backgroundColor }) => {
  return (
    <TouchableOpacity 
      style={[styles.button, { backgroundColor: backgroundColor || '#8bc34a' }, disabled && styles.buttonDisabled]} 
      onPress={onPress}
      disabled={disabled}
    >
      <Text style={styles.buttonText}>{title}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    padding: 12,
    borderRadius: 5,
    width: '100%',
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#cccccc',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  }
});

export default Button;