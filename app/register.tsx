import React from 'react';
import InputField from '../components/InputField';
import Button from '../components/Button';
import { Link } from 'react-router-dom'; 
import styles from './register.module.css'; 
import EmailIcon from '../assets/email.svg'; 
import PhoneIcon from '../assets/phone.svg';
import LockIcon from '../assets/lock.svg';
import EyeIcon from '../assets/eye.svg';
import EyeOffIcon from '../assets/eye-off.svg';

const RegisterScreen: React.FC = () => {
  const [passwordVisible, setPasswordVisible] = React.useState(false);

  const togglePasswordVisibility = () => {
    setPasswordVisible(!passwordVisible);
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Criar conta</h2>
      <p className={styles.subtitle}>Crie sua conta e comece a comprar</p>

      <div className={styles.inputWrapper}>
        <img src={EmailIcon} alt="Ícone de e-mail" className={styles.icon} />
        <InputField
          label="Endereço de E-mail"
          type="email"
          placeholder="Endereço de E-mail"
        />
      </div>

      <div className={styles.inputWrapper}>
        <img src={PhoneIcon} alt="Ícone de telefone" className={styles.icon} />
        <InputField
          label="Número de telefone"
          type="tel"
          placeholder="Número de telefone"
        />
      </div>

      <div className={styles.passwordInputWrapper}>
        <img src={LockIcon} alt="Ícone de senha" className={styles.icon} />
        <InputField
          label="Senha"
          type={passwordVisible ? 'text' : 'password'}
          placeholder="Senha"
        />
        <button
          type="button"
          onClick={togglePasswordVisibility}
          className={styles.eyeButton}
        >
          <img
            src={passwordVisible ? EyeOffIcon : EyeIcon}
            alt={passwordVisible ? 'Ocultar senha' : 'Mostrar senha'}
            className={styles.eyeIcon}
          />
        </button>
      </div>

      <Button onClick={() => console.log('Criar conta')}>Criar</Button>

      <div className={styles.links}>
        <p>
          Já tem uma conta? <Link to="/login"><strong>Entrar</strong></Link>
        </p>
        <p>
          É produtor? <Link to="/criar-vendedor"><strong>Criar conta de vendedor</strong></Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterScreen;