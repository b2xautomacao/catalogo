import React, { createContext, useContext, useEffect } from 'react';

export type ButtonStyle = 'flat' | 'modern' | 'rounded';

interface ButtonStyleContextType {
  buttonStyle: ButtonStyle;
  setButtonStyle: (style: ButtonStyle) => void;
}

const ButtonStyleContext = createContext<ButtonStyleContextType | undefined>(undefined);

export const useButtonStyle = () => {
  const context = useContext(ButtonStyleContext);
  if (!context) {
    throw new Error('useButtonStyle must be used within ButtonStyleProvider');
  }
  return context;
};

interface ButtonStyleProviderProps {
  children: React.ReactNode;
  buttonStyle?: ButtonStyle;
}

export const ButtonStyleProvider: React.FC<ButtonStyleProviderProps> = ({
  children,
  buttonStyle = 'modern',
}) => {
  const [currentStyle, setCurrentStyle] = React.useState<ButtonStyle>(buttonStyle);

  useEffect(() => {
    setCurrentStyle(buttonStyle);
    applyButtonStyle(buttonStyle);
  }, [buttonStyle]);

  const applyButtonStyle = (style: ButtonStyle) => {
    const root = document.documentElement;

    // Remover classes anteriores
    root.classList.remove('button-style-flat', 'button-style-modern', 'button-style-rounded');
    
    // Adicionar nova classe
    root.classList.add(`button-style-${style}`);

    // Aplicar CSS variables baseado no estilo
    switch (style) {
      case 'flat':
        root.style.setProperty('--button-border-radius', '4px');
        root.style.setProperty('--button-shadow', 'none');
        root.style.setProperty('--button-hover-shadow', '0 1px 3px rgba(0,0,0,0.1)');
        root.style.setProperty('--button-padding-x', '16px');
        root.style.setProperty('--button-padding-y', '8px');
        break;
      
      case 'modern':
        root.style.setProperty('--button-border-radius', '8px');
        root.style.setProperty('--button-shadow', '0 1px 3px rgba(0,0,0,0.1)');
        root.style.setProperty('--button-hover-shadow', '0 4px 12px rgba(0,0,0,0.15)');
        root.style.setProperty('--button-padding-x', '20px');
        root.style.setProperty('--button-padding-y', '10px');
        break;
      
      case 'rounded':
        root.style.setProperty('--button-border-radius', '24px');
        root.style.setProperty('--button-shadow', '0 2px 8px rgba(0,0,0,0.12)');
        root.style.setProperty('--button-hover-shadow', '0 6px 20px rgba(0,0,0,0.2)');
        root.style.setProperty('--button-padding-x', '24px');
        root.style.setProperty('--button-padding-y', '12px');
        break;
    }

    console.log(`🎨 Button style aplicado: ${style}`);
  };

  const setButtonStyle = (style: ButtonStyle) => {
    setCurrentStyle(style);
    applyButtonStyle(style);
  };

  return (
    <ButtonStyleContext.Provider value={{ buttonStyle: currentStyle, setButtonStyle }}>
      {children}
    </ButtonStyleContext.Provider>
  );
};

// CSS Global para estilos de botões
export const ButtonStyleCSS = `
  .button-style-flat button,
  .button-style-flat .btn {
    border-radius: var(--button-border-radius, 4px);
    box-shadow: var(--button-shadow, none);
    transition: all 0.2s ease;
  }

  .button-style-flat button:hover,
  .button-style-flat .btn:hover {
    box-shadow: var(--button-hover-shadow);
    transform: translateY(-1px);
  }

  .button-style-modern button,
  .button-style-modern .btn {
    border-radius: var(--button-border-radius, 8px);
    box-shadow: var(--button-shadow);
    transition: all 0.3s ease;
  }

  .button-style-modern button:hover,
  .button-style-modern .btn:hover {
    box-shadow: var(--button-hover-shadow);
    transform: translateY(-2px);
  }

  .button-style-rounded button,
  .button-style-rounded .btn {
    border-radius: var(--button-border-radius, 24px);
    box-shadow: var(--button-shadow);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .button-style-rounded button:hover,
  .button-style-rounded .btn:hover {
    box-shadow: var(--button-hover-shadow);
    transform: translateY(-3px) scale(1.02);
  }
`;

