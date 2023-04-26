import type { AppStateStatus } from 'react-native';

import { Platform, AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import differenceInSeconds from 'date-fns/differenceInSeconds';
import isBefore from 'date-fns/isBefore';
import startOfToday from 'date-fns/startOfToday';
import startOfWeek from 'date-fns/startOfWeek';
import startOfMonth from 'date-fns/startOfMonth';
import startOfYear from 'date-fns/startOfYear';

interface Info {
  platform: string;
  platformVersion: string;
  luminVersion: string;
}

export interface LuminConfig {
  environment?: string;
  automaticallyTrackActiveUsers?: boolean;
  trackingIntervals?: {
    dailyActiveUser?: number;
    weeklyActiveUser?: number;
    monthlyActiveUser?: number;
    yearlyActiveUser?: number;
  };
  url?: string;
  logResponse?: boolean;
  logError?: boolean;
}

type AsyncStorageKeys = {
  firstOpenTime: string;
  endOfLastSession: string;
  lastDauTracked: string;
  lastWauTracked: string;
  lastMauTracked: string;
  lastYauTracked: string;
};

const defaultConfig: LuminConfig = {
  environment: 'default',
  automaticallyTrackActiveUsers: true,
  url: 'https://app.uselumin.co',
  logResponse: false,
  logError: true,
};

export class Lumin {
  id: string;
  token: string;
  config: LuminConfig;
  appState: AppStateStatus;
  sessionStartTime: Date;
  info: Info;
  asyncStorageKeys: AsyncStorageKeys;

  constructor(token: string, config: LuminConfig = {}) {
    const [appId, appToken] = token.trim().split(':');

    if (!appId || !appToken) {
      throw new Error('Lumin token malformed!');
    }

    this.asyncStorageKeys = {
      firstOpenTime: `lumin_${appId}_first_open_time`,
      endOfLastSession: `lumin_${appId}_end_of_last_session`,
      lastDauTracked: `lumin_${appId}_last_dau_tracked`,
      lastWauTracked: `lumin_${appId}_last_wau_tracked`,
      lastMauTracked: `lumin_${appId}_last_mau_tracked`,
      lastYauTracked: `lumin_${appId}_last_yau_tracked`,
    };

    this.id = appId;
    this.token = appToken;
    this.config = { ...defaultConfig, ...config };
    this.appState = AppState.currentState;
    this.sessionStartTime = new Date();
    this.info = {
      platform: Platform.OS,
      platformVersion:
        typeof Platform.Version === 'string'
          ? Platform.Version
          : Platform.Version.toString(),
      luminVersion: '0.4.2',
    };
  }

  init() {
    AppState.addEventListener('change', async (nextAppState) => {
      if (
        this.appState.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        // App has come to the foreground!
        if (this.config.automaticallyTrackActiveUsers) {
          this.trackActiveUser();
        }
        this.startSession();
      }

      if (
        this.appState === 'active' &&
        nextAppState.match(/inactive|background/)
      ) {
        // App has gone to the background!
        this.endSession();
      }

      this.appState = nextAppState;
    });

    this.setFirstOpenTime();

    if (this.config.automaticallyTrackActiveUsers) {
      this.trackActiveUser();
    }

    this.startSession();
  }

  protected async startSession() {
    this.sessionStartTime = new Date();

    const lastSessionEndTime = await AsyncStorage.getItem(
      this.asyncStorageKeys.endOfLastSession
    );

    let diff = null;

    if (lastSessionEndTime) {
      diff = differenceInSeconds(new Date(), new Date(lastSessionEndTime));
    }

    this.track('SESSION_START', {
      timeSinceLastSession: diff,
    });
  }

  protected endSession() {
    const diff = differenceInSeconds(new Date(), this.sessionStartTime);

    this.track('SESSION_END', {
      duration: diff,
    });

    AsyncStorage.setItem(
      this.asyncStorageKeys.endOfLastSession,
      new Date().toString()
    );
  }

  protected setFirstOpenTime() {
    AsyncStorage.getItem(this.asyncStorageKeys.firstOpenTime).then(
      (firstOpenTime) => {
        if (!firstOpenTime) {
          AsyncStorage.setItem(
            this.asyncStorageKeys.firstOpenTime,
            new Date().toString()
          );

          this.track('FIRST_OPEN');
        }
      }
    );
  }

  protected async getFirstOpenTime(): Promise<Date | null> {
    return AsyncStorage.getItem(this.asyncStorageKeys.firstOpenTime).then(
      (firstOpenTime) => {
        if (firstOpenTime) {
          return new Date(firstOpenTime);
        }

        return null;
      }
    );
  }

  trackActiveUser() {
    this.trackDailyActiveUser();
    this.trackWeeklyActiveUser();
    this.trackMonthlyActiveUser();
    this.trackYearlyActiveUser();
  }

  protected async trackDailyActiveUser() {
    const lastTimeActive = await AsyncStorage.getItem(
      this.asyncStorageKeys.lastDauTracked
    );

    if (lastTimeActive) {
      const timeCondition = this.config.trackingIntervals?.dailyActiveUser
        ? differenceInSeconds(new Date(), new Date(lastTimeActive)) >
          this.config.trackingIntervals?.dailyActiveUser
        : isBefore(new Date(lastTimeActive), startOfToday());

      if (timeCondition) {
        this.track('DAILY_ACTIVE_USER').then(() => {
          AsyncStorage.setItem(
            this.asyncStorageKeys.lastDauTracked,
            new Date().toString()
          );
        });
      }
    } else {
      this.track('DAILY_ACTIVE_USER').then(() => {
        AsyncStorage.setItem(
          this.asyncStorageKeys.lastDauTracked,
          new Date().toString()
        );
      });
    }
  }

  protected async trackWeeklyActiveUser() {
    const lastWauTrack = await AsyncStorage.getItem(
      this.asyncStorageKeys.lastWauTracked
    );

    if (lastWauTrack) {
      const timeCondition = this.config.trackingIntervals?.weeklyActiveUser
        ? differenceInSeconds(new Date(), new Date(lastWauTrack)) >
          this.config.trackingIntervals?.weeklyActiveUser
        : isBefore(new Date(lastWauTrack), startOfWeek(new Date()));

      if (timeCondition) {
        this.track('WEEKLY_ACTIVE_USER').then(() => {
          AsyncStorage.setItem(
            this.asyncStorageKeys.lastWauTracked,
            new Date().toString()
          );
        });
      }
    } else {
      this.track('WEEKLY_ACTIVE_USER').then(() => {
        AsyncStorage.setItem(
          this.asyncStorageKeys.lastWauTracked,
          new Date().toString()
        );
      });
    }
  }

  protected async trackMonthlyActiveUser() {
    const lastMauTrack = await AsyncStorage.getItem(
      this.asyncStorageKeys.lastMauTracked
    );

    if (lastMauTrack) {
      const timeCondition = this.config.trackingIntervals?.monthlyActiveUser
        ? differenceInSeconds(new Date(), new Date(lastMauTrack)) >
          this.config.trackingIntervals?.monthlyActiveUser
        : isBefore(new Date(lastMauTrack), startOfMonth(new Date()));

      if (timeCondition) {
        this.track('MONTHLY_ACTIVE_USER').then(() => {
          AsyncStorage.setItem(
            this.asyncStorageKeys.lastMauTracked,
            new Date().toString()
          );
        });
      }
    } else {
      this.track('MONTHLY_ACTIVE_USER').then(() => {
        AsyncStorage.setItem(
          this.asyncStorageKeys.lastMauTracked,
          new Date().toString()
        );
      });
    }
  }

  protected async trackYearlyActiveUser() {
    const lastYauTrack = await AsyncStorage.getItem(
      this.asyncStorageKeys.lastYauTracked
    );

    if (lastYauTrack) {
      const timeCondition = this.config.trackingIntervals?.yearlyActiveUser
        ? differenceInSeconds(new Date(), new Date(lastYauTrack)) >
          this.config.trackingIntervals?.yearlyActiveUser
        : isBefore(new Date(lastYauTrack), startOfYear(new Date()));

      if (timeCondition) {
        this.track('YEARLY_ACTIVE_USER').then(() => {
          AsyncStorage.setItem(
            this.asyncStorageKeys.lastYauTracked,
            new Date().toString()
          );
        });
      }
    } else {
      this.track('YEARLY_ACTIVE_USER').then(() => {
        AsyncStorage.setItem(
          this.asyncStorageKeys.lastYauTracked,
          new Date().toString()
        );
      });
    }
  }

  async track(event: string, data: any = {}) {
    fetch(`${this.config.url}/api/events/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: event,
        data: { $info: this.info, ...data },
        environment: this.config.environment,
        appToken: this.token,
      }),
    })
      .then((res) => {
        res.json().then((json) => {
          if (this.config.logResponse) {
            console.log(json);
          }
        });
      })
      .catch((err) => {
        if (this.config.logError) {
          console.log(err);
        }

        throw err;
      });
  }

  async trackCustomEvent(event: string, data: any = {}) {
    this.track(event, {
      $custom: true,
      ...data,
    });
  }

  async clearLuminItemsFromAsyncStorage() {
    await Promise.all([
      AsyncStorage.removeItem(this.asyncStorageKeys.firstOpenTime),
      AsyncStorage.removeItem(this.asyncStorageKeys.endOfLastSession),
      AsyncStorage.removeItem(this.asyncStorageKeys.lastDauTracked),
      AsyncStorage.removeItem(this.asyncStorageKeys.lastWauTracked),
      AsyncStorage.removeItem(this.asyncStorageKeys.lastMauTracked),
      AsyncStorage.removeItem(this.asyncStorageKeys.lastYauTracked),
    ]);
  }
}
