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
  version: string;
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
}

const defaultConfig: LuminConfig = {
  environment: 'default',
  automaticallyTrackActiveUsers: true,
  url: 'https://app.uselumin.co',
};

export class Lumin {
  token: string;
  config: LuminConfig;
  appState: AppStateStatus;
  sessionStartTime: Date;
  info: Info;

  constructor(token: string, config: LuminConfig = defaultConfig) {
    this.token = token;
    this.config = { ...defaultConfig, ...config };
    this.appState = AppState.currentState;
    this.sessionStartTime = new Date();
    this.info = {
      platform: Platform.OS,
      version:
        typeof Platform.Version === 'string'
          ? Platform.Version
          : Platform.Version.toString(),
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

    if (this.config.automaticallyTrackActiveUsers) {
      this.trackActiveUser();
    }

    this.startSession();
  }

  protected async startSession() {
    this.sessionStartTime = new Date();

    const lastSessionEndTime = await AsyncStorage.getItem(
      'lumin_end_of_last_session'
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

    AsyncStorage.setItem('lumin_end_of_last_session', new Date().toString());
  }

  protected setFirstOpenTime() {
    AsyncStorage.getItem('lumin_first_open_time').then((firstOpenTime) => {
      if (!firstOpenTime) {
        AsyncStorage.setItem('lumin_first_open_time', new Date().toString());

        this.track('FIRST_OPEN');
      }
    });
  }

  protected async getFirstOpenTime(): Promise<Date | null> {
    return AsyncStorage.getItem('lumin_first_open_time').then(
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
    const lastTimeActive = await AsyncStorage.getItem('lumin_last_dau_tracked');

    if (lastTimeActive) {
      const timeCondition = this.config.trackingIntervals?.dailyActiveUser
        ? differenceInSeconds(new Date(), new Date(lastTimeActive)) >
          this.config.trackingIntervals?.dailyActiveUser
        : isBefore(new Date(lastTimeActive), startOfToday());

      if (timeCondition) {
        this.track('DAILY_ACTIVE_USER');
        AsyncStorage.setItem('lumin_last_dau_tracked', new Date().toString());
      }
    } else {
      this.track('DAILY_ACTIVE_USER');
      AsyncStorage.setItem('lumin_last_dau_tracked', new Date().toString());
    }
  }

  protected async trackWeeklyActiveUser() {
    const lastWauTrack = await AsyncStorage.getItem('lumin_last_wau_tracked');

    if (lastWauTrack) {
      const timeCondition = this.config.trackingIntervals?.weeklyActiveUser
        ? differenceInSeconds(new Date(), new Date(lastWauTrack)) >
          this.config.trackingIntervals?.weeklyActiveUser
        : isBefore(new Date(lastWauTrack), startOfWeek(new Date()));

      if (timeCondition) {
        this.track('WEEKLY_ACTIVE_USER');
        AsyncStorage.setItem('lumin_last_wau_tracked', new Date().toString());
      }
    } else {
      this.track('WEEKLY_ACTIVE_USER');
      AsyncStorage.setItem('lumin_last_wau_tracked', new Date().toString());
    }
  }

  protected async trackMonthlyActiveUser() {
    const lastMauTrack = await AsyncStorage.getItem('lumin_last_mau_tracked');

    if (lastMauTrack) {
      const timeCondition = this.config.trackingIntervals?.monthlyActiveUser
        ? differenceInSeconds(new Date(), new Date(lastMauTrack)) >
          this.config.trackingIntervals?.monthlyActiveUser
        : isBefore(new Date(lastMauTrack), startOfMonth(new Date()));

      if (timeCondition) {
        this.track('MONTHLY_ACTIVE_USER');
        AsyncStorage.setItem('lumin_last_mau_tracked', new Date().toString());
      }
    } else {
      this.track('MONTHLY_ACTIVE_USER');

      AsyncStorage.setItem('lumin_last_mau_tracked', new Date().toString());
    }
  }

  protected async trackYearlyActiveUser() {
    const lastYauTrack = await AsyncStorage.getItem('lumin_last_yau_tracked');

    if (lastYauTrack) {
      const timeCondition = this.config.trackingIntervals?.yearlyActiveUser
        ? differenceInSeconds(new Date(), new Date(lastYauTrack)) >
          this.config.trackingIntervals?.yearlyActiveUser
        : isBefore(new Date(lastYauTrack), startOfYear(new Date()));

      if (timeCondition) {
        this.track('YEARLY_ACTIVE_USER');
        AsyncStorage.setItem('lumin_last_yau_tracked', new Date().toString());
      }
    } else {
      this.track('YEARLY_ACTIVE_USER');
      AsyncStorage.setItem('lumin_last_yau_tracked', new Date().toString());
    }
  }

  track(event: string, data: any = {}) {
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
          console.log(json);
        });
      })
      .catch((err) => {
        console.log(err);
      });
  }
}
