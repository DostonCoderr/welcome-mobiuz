import { useEffect, useState, useCallback } from 'react';

interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  is_premium?: boolean;
  photo_url?: string;
}

interface TelegramWebApp {
  ready: () => void;
  expand: () => void;
  close: () => void;
  initData: string;
  initDataUnsafe: {
    user?: TelegramUser;
    query_id?: string;
    auth_date?: number;
    hash?: string;
  };
  version: string;
  platform: string;
  colorScheme: 'light' | 'dark';
  themeParams: {
    bg_color?: string;
    text_color?: string;
    hint_color?: string;
    link_color?: string;
    button_color?: string;
    button_text_color?: string;
    secondary_bg_color?: string;
  };
  isExpanded: boolean;
  viewportHeight: number;
  viewportStableHeight: number;
  headerColor: string;
  backgroundColor: string;
  isClosingConfirmationEnabled: boolean;
  BackButton: {
    isVisible: boolean;
    show: () => void;
    hide: () => void;
    onClick: (callback: () => void) => void;
    offClick: (callback: () => void) => void;
  };
  MainButton: {
    text: string;
    color: string;
    textColor: string;
    isVisible: boolean;
    isActive: boolean;
    isProgressVisible: boolean;
    setText: (text: string) => void;
    onClick: (callback: () => void) => void;
    offClick: (callback: () => void) => void;
    show: () => void;
    hide: () => void;
    enable: () => void;
    disable: () => void;
    showProgress: (leaveActive?: boolean) => void;
    hideProgress: () => void;
    setParams: (params: any) => void;
  };
  HapticFeedback: {
    impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void;
    notificationOccurred: (type: 'error' | 'success' | 'warning') => void;
    selectionChanged: () => void;
  };
  showAlert: (message: string, callback?: () => void) => void;
  showConfirm: (message: string, callback?: (confirmed: boolean) => void) => void;
  showPopup: (params: any, callback?: (id: string) => void) => void;
  setHeaderColor: (color: string) => void;
  setBackgroundColor: (color: string) => void;
  enableClosingConfirmation: () => void;
  disableClosingConfirmation: () => void;
  onEvent: (eventType: string, eventHandler: () => void) => void;
  offEvent: (eventType: string, eventHandler: () => void) => void;
  sendData: (data: string) => void;
  openLink: (url: string, options?: { try_instant_view?: boolean }) => void;
  openTelegramLink: (url: string) => void;
  openInvoice: (url: string, callback?: (status: string) => void) => void;
}

declare global {
  interface Window {
    Telegram?: {
      WebApp: TelegramWebApp;
    };
  }
}

export const useTelegram = () => {
  const [tg, setTg] = useState<TelegramWebApp | null>(null);
  const [user, setUser] = useState<TelegramUser | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [colorScheme, setColorScheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    if (window.Telegram?.WebApp) {
      const webApp = window.Telegram.WebApp;
      
      // Tayyorlash
      webApp.ready();
      webApp.expand();
      
      // Sozlash
      setTg(webApp);
      setUser(webApp.initDataUnsafe?.user || null);
      setColorScheme(webApp.colorScheme || 'light');
      setIsReady(true);

      // Header rangini o'rnatish (Mobiuz ko'k)
      try {
  webApp.setHeaderColor('#ff2a3a');      // hero-gradient boshlanishi bilan bir xil
  webApp.setBackgroundColor('#14161a');  // pastki fon (dark)
  // yangi Telegram versiyalarida pastki panel rangi ham:
  (webApp as any).setBottomBarColor?.('#14161a');
} catch (e) {
  console.log('Theme setup skipped');
}

      // Viewport balandligini kuzatish
      const handleViewportChange = () => {
        document.documentElement.style.setProperty(
          '--tg-viewport-height',
          `${webApp.viewportHeight}px`
        );
      };
      
      webApp.onEvent('viewportChanged', handleViewportChange);
      
      return () => {
        webApp.offEvent('viewportChanged', handleViewportChange);
      };
    } else {
      console.log('Telegram WebApp is not available (running in browser)');
      setIsReady(true);
    }
  }, []);

  // Haptic feedback (tebranish)
  const hapticFeedback = useCallback(
    (type: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft' = 'light') => {
      if (tg?.HapticFeedback) {
        tg.HapticFeedback.impactOccurred(type);
      }
    },
    [tg]
  );

  // Notification feedback (muvaffaqiyat/xato)
  const hapticNotification = useCallback(
    (type: 'error' | 'success' | 'warning') => {
      if (tg?.HapticFeedback) {
        tg.HapticFeedback.notificationOccurred(type);
      }
    },
    [tg]
  );

  // Selection changed
  const hapticSelection = useCallback(() => {
    if (tg?.HapticFeedback) {
      tg.HapticFeedback.selectionChanged();
    }
  }, [tg]);

  // Alert ko'rsatish
  const showAlert = useCallback(
    (message: string, callback?: () => void) => {
      if (tg?.showAlert) {
        tg.showAlert(message, callback);
      } else {
        alert(message);
        callback?.();
      }
    },
    [tg]
  );

  // Confirm ko'rsatish
  const showConfirm = useCallback(
    (message: string, callback?: (confirmed: boolean) => void) => {
      if (tg?.showConfirm) {
        tg.showConfirm(message, callback);
      } else {
        const confirmed = confirm(message);
        callback?.(confirmed);
      }
    },
    [tg]
  );

  // MainButton boshqarish
  const mainButton = {
    show: useCallback((text: string, onClick: () => void) => {
      if (tg?.MainButton) {
        tg.MainButton.setText(text);
        tg.MainButton.onClick(onClick);
        tg.MainButton.show();
      }
    }, [tg]),
    hide: useCallback(() => {
      if (tg?.MainButton) {
        tg.MainButton.hide();
      }
    }, [tg]),
    setProgress: useCallback((visible: boolean) => {
      if (tg?.MainButton) {
        if (visible) {
          tg.MainButton.showProgress();
        } else {
          tg.MainButton.hideProgress();
        }
      }
    }, [tg]),
  };

  // BackButton boshqarish
  const backButton = {
    show: useCallback((onClick: () => void) => {
      if (tg?.BackButton) {
        tg.BackButton.onClick(onClick);
        tg.BackButton.show();
      }
    }, [tg]),
    hide: useCallback(() => {
      if (tg?.BackButton) {
        tg.BackButton.hide();
      }
    }, [tg]),
  };

  // Link ochish
  const openLink = useCallback(
    (url: string) => {
      if (tg?.openLink) {
        tg.openLink(url);
      } else {
        window.open(url, '_blank');
      }
    },
    [tg]
  );

  // Telegram link ochish
  const openTelegramLink = useCallback(
    (url: string) => {
      if (tg?.openTelegramLink) {
        tg.openTelegramLink(url);
      } else {
        window.open(url, '_blank');
      }
    },
    [tg]
  );

  // Yopish
  const close = useCallback(() => {
    if (tg?.close) {
      tg.close();
    }
  }, [tg]);

  return {
    tg,
    user,
    isReady,
    colorScheme,
    hapticFeedback,
    hapticNotification,
    hapticSelection,
    showAlert,
    showConfirm,
    mainButton,
    backButton,
    openLink,
    openTelegramLink,
    close,
  };
};

export default useTelegram;