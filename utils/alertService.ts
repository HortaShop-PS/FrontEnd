import { Alert, Platform } from 'react-native';


interface AlertButton {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}


let isCustomAlertVisible = false;
let customAlertQueue: Array<{
  title: string;
  message: string;
  buttons?: AlertButton[];
  type?: 'success' | 'error' | 'info' | 'warning';
}> = [];

let showNextAlert: () => void;

export const setShowNextAlertCallback = (callback: () => void) => {
  showNextAlert = callback;
};


export const showAlert = (
  title: string,
  message: string,
  buttons?: AlertButton[],
  type: 'success' | 'error' | 'info' | 'warning' = 'info'
) => {
  
  if (!showNextAlert) {
    Alert.alert(title, message, buttons);
    return;
  }

  
  customAlertQueue.push({ title, message, buttons, type });
  
  if (!isCustomAlertVisible) {
    isCustomAlertVisible = true;
    showNextAlert();
  }
};


export const processNextAlert = () => {
  if (customAlertQueue.length > 0) {
    isCustomAlertVisible = true;
    showNextAlert();
  } else {
    isCustomAlertVisible = false;
  }
};


export const getNextAlert = () => {
  return customAlertQueue.shift();
};


export const showSuccess = (title: string, message: string, buttons?: AlertButton[]) => {
  showAlert(title, message, buttons, 'success');
};

export const showError = (title: string, message: string, buttons?: AlertButton[]) => {
  showAlert(title, message, buttons, 'error');
};

export const showWarning = (title: string, message: string, buttons?: AlertButton[]) => {
  showAlert(title, message, buttons, 'warning');
};

export const showInfo = (title: string, message: string, buttons?: AlertButton[]) => {
  showAlert(title, message, buttons, 'info');
};