import React from 'react';
import styles from './InputField.module.css'; // Importe um arquivo CSS para estilos

interface InputFieldProps {
  label: string;
  type: string;
  placeholder?: string;
}

const InputField: React.FC<InputFieldProps> = ({ label, type, placeholder }) => {
  return (
    <div className={styles.inputContainer}>
      {/* Removi o label daqui, pois ele parece estar dentro do wrapper no protótipo */}
      <input
        type={type}
        id={label}
        placeholder={placeholder}
        className={styles.input}
      />
    </div>
  );
};

export default InputField;