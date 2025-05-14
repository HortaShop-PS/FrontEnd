import React, { useState, useEffect } from 'react';
import CustomAlert from './CustomAlert';
import { setShowNextAlertCallback, getNextAlert, processNextAlert } from '../utils/alertService';

interface AlertProviderProps {
  children: React.ReactNode;
}

const AlertProvider: React.FC<AlertProviderProps> = ({ children }) => {
  const [visible, setVisible] = useState(false);
  const [currentAlert, setCurrentAlert] = useState<{
    title: string;
    message: string;
    buttons?: Array<{
      text: string;
      onPress?: () => void;
      style?: 'default' | 'cancel' | 'destructive';
    }>;
    type?: 'success' | 'error' | 'info' | 'warning';
  } | null>(null);

  useEffect(() => {
    
    setShowNextAlertCallback(() => {
      const nextAlert = getNextAlert();
      if (nextAlert) {
        setCurrentAlert(nextAlert);
        setVisible(true);
      }
    });
  }, []);

  const handleClose = () => {
    setVisible(false);
    setTimeout(() => {
      setCurrentAlert(null);
      processNextAlert();
    }, 300);
  };

  return (
    <>
      {children}
      {currentAlert && (
        <CustomAlert
          visible={visible}
          title={currentAlert.title}
          message={currentAlert.message}
          type={currentAlert.type || 'info'}
          buttons={
            currentAlert.buttons?.map(button => ({
              ...button,
              onPress: () => {
                if (button.onPress) {
                  button.onPress();
                }
              },
            })) || [{ text: 'OK', onPress: () => {}, style: 'default' }]
          }
          onClose={handleClose}
        />
      )}
    </>
  );
};

export default AlertProvider;