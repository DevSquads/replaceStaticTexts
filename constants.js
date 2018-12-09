/* eslint import/prefer-default-export: "off" */
import emoji from "node-emoji";
import I18n from './services/internationalizations/i18n';

const smileyEmoji = emoji.get("smiley");

export const ALPHA_ENV = 'ALPHA';
export const PROD_ENV = 'PROD';

export const ENVIRONMENT = ALPHA_ENV;

const baseUrl = ENVIRONMENT === PROD_ENV ? "https://www.myshapa.com/api/v1" : "https://shapa-alpha.herokuapp.com/api/v1";
export const BASE_URL = baseUrl;
// export const BASE_URL = "http://localhost:3000/api/v1";
// export const BASE_URL = "http://10.0.2.2:3000/api/v1";

export const DEFAULT_ANIMATION_TYPE = "slide-horizontal";

export const SHAPA_CONTACT_NUMBER = {
    usage: "4082075201",
    display: "(408) 207-5201"
};

export const SCREENS = {
    APP: "shapa.App",
    CREATE_ACCOUNT: "shapa.CreateAccountScreen",
    DASHBOARD: "shapa.DashboardScreen",
    DEV_MENU: "shapa.DevMenuScreen",
    FORGOT_PASSWORD: "shapa.ForgotPasswordScreen",
    IDEAL_WEIGHT_EDIT: "shapa.IdealWeightEditScreen",
    INTRO: "shapa.IntroScreen",
    LOG_IN: "shapa.LoginScreen",
    MENU: "shapa.MenuScreen",
    NOTIFICATION_SETTINGS: "shapa.NotificationSettingsScreen",
    POST_ACCOUNT_CREATION: "shapa.PostAccountCreationScreen",
    POST_QUESTIONNAIRE: "shapa.PostQuestionnaireScreen",
    PROFILE: "shapa.ProfileScreen",
    PROFILE_EDIT: "shapa.ProfileEditScreen",
    QUESTIONNAIRE: "shapa.QuestionnaireScreen",
    SIGN_UP: "shapa.SignupScreen",
    TAKING_MEASUREMENT: "shapa.TakingMeasurementScreen",
    VACATION_SETTINGS: "shapa.VacationSettingsScreen",
    WELCOME_TO_SHAPA: "shapa.WelcomeToShapaScreen",
    MESSAGES_SCREEN: "shapa.MessagesScreen",
    SUPPORT_SCREEN: "shapa.SupportScreen",
    HELP_SCREEN: "shapa.HelpScreen",
    CONTACT_SCREEN: "shapa.ContactUs",
    PROMPT_MODAL: "shapa.PromptModal",
    NETWORK_ERROR_SCREEN: "shapa.NetworkErrorScreen",
    LINK_FACEBOOK_ACCOUNT: "shapa.LinkFacebookAccount",
    LINK_FACEBOOK_ACCOUNT_PASSWORD: "shapa.LinkFacebookAccountPassword",
    FACEBOOK_EMAIL: "shapa.FacebookEmail",
    NEW_ACCOUNT_VIA_FACEBOOK: "shapa.NewAccountViaFacebook",
    FACEBOOK_ACCOUNT_SIGNUP: "shapa.FacebookAccountSignup",
    FACEBOOK_SIGNUP_SUCCESS: "shapa.FacebookSignupSuccess",
    HISTORY_SCREEN: "shapa.HistoryScreen",
    VIDEO_SCREEN: "shapa.VideoScreen",
    STEP_TIP_SCREEN: "shapa.StepTipScreen",
    ENABLE_BLUETOOTH_SCREEN: "shapa.EnableBluetoothScreen",
    LICENSE_KEY_LINK_SCREEN: "shapa.LicenseKeyLinkScreen",
    VITALITY_DATA_SHARING_SCREEN: "shapa.VitalityDataSharingScreen",
    PWA: {
        CYCLE_TYPE: "shapa.PeriodWeightAdjuster.cycleType",
        START_DATE_QUES: "shapa.PeriodWeightAdjuster.startDateQuestion",
        START_DATEPICKER: "shapa.PeriodWeightAdjuster.startDatePicker",
        COMPLETED: "shapa.PeriodWeightAdjuster.completed",
        DEFERRED: "shapa.PeriodWeightAdjuster.deferred",
        DEFERRED_DATEPICKER: "shapa.PeriodWeightAdjuster.deferredDatePicker",
        CYCLE_LENGTH: "shapa.PeriodWeightAdjuster.cycleLength",
        IRREGULAR_PERIOD_LOGGED: "shapa.PeriodWeightAdjuster.irregularPeriodLogged"
    },
    PERIOD_HISTORY_SCREEN: "shapa.PeriodHistoryScreen",
    PROGRESS_REVIEW_SCREEN: "shapa.ProgressReviewScreen",
    CONFIGURE_REMINDERS_SCREEN: "shapa.ConfigureRemindersScreen",
    NOTIFICATION_REQUEST_SCREEN: "shapa.NotificationRequestScreen",
    REMINDER_ADJUSTMENT_SCREEN: "shapa.ReminderAdjustmentScreen",
    SETTINGS_SCREEN: "shapa.SettingsScreen",
    CHANGE_PASSWORD_SCREEN: "shapa.changePasswordScreen"
};

export const DEVICE_EVENT_TYPES = {
    MEASUREMENT_DONE: "MeasurementDone",
    CONNECTED: "Connected"
};

export const SHAPA_COLORS = {
    DARK_GRAY: {
        NUMERIC_VALUE: 2,
        SOUND: I18n.t("_constants.ObjectProperty.index(0)"),
        CORE_BACKGROUND_COLOR: I18n.t("_constants.ObjectProperty.index(1)"),
        INNER_RING_BACKGROUND_COLOR: I18n.t("_constants.ObjectProperty.index(2)"),
        OUTER_RING_BACKGROUND_COLOR: I18n.t("_constants.ObjectProperty.index(3)"),
        COLOR_TEXT: I18n.t("_constants.ObjectProperty.index(4)"),
        FEEDBACK: {
            MAINTAINED: {
                0: {
                    A: I18n.t("_constants.ObjectProperty.index(5)"),
                    B: I18n.t("_constants.ObjectProperty.index(6)")
                },
                1: {
                    A: I18n.t("_constants.ObjectProperty.index(7)"),
                    B: I18n.t("_constants.ObjectProperty.index(8)")
                },
                2: {
                    A: I18n.t("_constants.ObjectProperty.index(9)"),
                    B: I18n.t("_constants.ObjectProperty.index(10)")
                },
                3: {
                    A: I18n.t("_constants.ObjectProperty.index(11)"),
                    B: I18n.t("_constants.ObjectProperty.index(12)")
                },
                4: {
                    A: I18n.t("_constants.ObjectProperty.index(13)"),
                    B: I18n.t("_constants.ObjectProperty.index(14)")
                },
                5: {
                    A: I18n.t("_constants.ObjectProperty.index(15)"),
                    B: I18n.t("_constants.ObjectProperty.index(16)")
                },
                6: {
                    A: I18n.t("_constants.ObjectProperty.index(17)"),
                    B: I18n.t("_constants.ObjectProperty.index(18)")
                }
            }
        }
    },
    GRAY: {
        NUMERIC_VALUE: 1,
        SOUND: I18n.t("_constants.ObjectProperty.index(19)"),
        CORE_BACKGROUND_COLOR: I18n.t("_constants.ObjectProperty.index(20)"),
        INNER_RING_BACKGROUND_COLOR: I18n.t("_constants.ObjectProperty.index(21)"),
        OUTER_RING_BACKGROUND_COLOR: I18n.t("_constants.ObjectProperty.index(22)"),
        COLOR_TEXT: I18n.t("_constants.ObjectProperty.index(23)"),
        FEEDBACK: {
            MAINTAINED: {
                0: {
                    A: I18n.t("_constants.ObjectProperty.index(24)"),
                    B: I18n.t("_constants.ObjectProperty.index(25)")
                },
                1: {
                    A: I18n.t("_constants.ObjectProperty.index(26)"),
                    B: I18n.t("_constants.ObjectProperty.index(27)")
                },
                2: {
                    A: I18n.t("_constants.ObjectProperty.index(28)"),
                    B: I18n.t("_constants.ObjectProperty.index(29)")
                },
                3: {
                    A: I18n.t("_constants.ObjectProperty.index(30)"),
                    B: I18n.t("_constants.ObjectProperty.index(31)")
                },
                4: {
                    A: I18n.t("_constants.ObjectProperty.index(32)"),
                    B: I18n.t("_constants.ObjectProperty.index(33)")
                }
            },
            IMPROVED: {
                0: {
                    A: I18n.t("_constants.ObjectProperty.index(34)"),
                    B: I18n.t("_constants.ObjectProperty.index(35)")
                },
                1: {
                    A: I18n.t("_constants.ObjectProperty.index(36)"),
                    B: I18n.t("_constants.ObjectProperty.index(37)")
                },
                2: {
                    A: I18n.t("_constants.ObjectProperty.index(38)"),
                    B: I18n.t("_constants.ObjectProperty.index(39)")
                },
                3: {
                    A: I18n.t("_constants.ObjectProperty.index(40)"),
                    B: I18n.t("_constants.ObjectProperty.index(41)")
                },
                4: {
                    A: I18n.t("_constants.ObjectProperty.index(42)"),
                    B: I18n.t("_constants.ObjectProperty.index(43)")
                }
            }
        }
    },
    GREEN: {
        NUMERIC_VALUE: 0,
        ANDROID_SHARE_ASSET: I18n.t("_constants.ObjectProperty.index(44)"),
        SOUND: I18n.t("_constants.ObjectProperty.index(45)"),
        CORE_BACKGROUND_COLOR: I18n.t("_constants.ObjectProperty.index(46)"),
        INNER_RING_BACKGROUND_COLOR: I18n.t("_constants.ObjectProperty.index(47)"),
        OUTER_RING_BACKGROUND_COLOR: I18n.t("_constants.ObjectProperty.index(48)"),
        COLOR_TEXT: I18n.t("_constants.ObjectProperty.index(49)"),
        FEEDBACK: {
            MAINTAINED: {
                0: {
                    A: I18n.t("_constants.ObjectProperty.index(50)"),
                    B: I18n.t("_constants.ObjectProperty.index(51)")
                },
                1: {
                    A: I18n.t("_constants.ObjectProperty.index(52)"),
                    B: I18n.t("_constants.ObjectProperty.index(53)")
                },
                2: {
                    A: I18n.t("_constants.ObjectProperty.index(54)"),
                    B: I18n.t("_constants.ObjectProperty.index(55)")
                },
                3: {
                    A: I18n.t("_constants.ObjectProperty.index(56)"),
                    B: I18n.t("_constants.ObjectProperty.index(57)")
                },
                4: {
                    A: I18n.t("_constants.ObjectProperty.index(58)"),
                    B: I18n.t("_constants.ObjectProperty.index(59)")
                },
                5: {
                    A: I18n.t("_constants.ObjectProperty.index(60)"),
                    B: I18n.t("_constants.ObjectProperty.index(61)")
                }
            },
            IMPROVED: {
                0: {
                    A: I18n.t("_constants.ObjectProperty.index(62)"),
                    B: I18n.t("_constants.ObjectProperty.index(63)")
                },
                1: {
                    A: I18n.t("_constants.ObjectProperty.index(64)"),
                    B: I18n.t("_constants.ObjectProperty.index(65)")
                },
                2: {
                    A: I18n.t("_constants.ObjectProperty.index(66)"),
                    B: I18n.t("_constants.ObjectProperty.index(67)")
                },
                3: {
                    A: I18n.t("_constants.ObjectProperty.index(68)"),
                    B: I18n.t("_constants.ObjectProperty.index(69)")
                }
            }
        }
    },
    TEAL: {
        NUMERIC_VALUE: -1,
        SOUND: I18n.t("_constants.ObjectProperty.index(70)"),
        ANDROID_SHARE_ASSET: I18n.t("_constants.ObjectProperty.index(71)"),
        CORE_BACKGROUND_COLOR: I18n.t("_constants.ObjectProperty.index(72)"),
        INNER_RING_BACKGROUND_COLOR: I18n.t("_constants.ObjectProperty.index(73)"),
        OUTER_RING_BACKGROUND_COLOR: I18n.t("_constants.ObjectProperty.index(74)"),
        COLOR_TEXT: I18n.t("_constants.ObjectProperty.index(75)"),
        FEEDBACK: {
            MAINTAINED: {
                0: {
                    A: I18n.t("_constants.ObjectProperty.index(76)"),
                    B: I18n.t("_constants.ObjectProperty.index(77)")
                },
                1: {
                    A: I18n.t("_constants.ObjectProperty.index(78)"),
                    B: I18n.t("_constants.ObjectProperty.index(79)")
                },
                2: {
                    A: I18n.t("_constants.ObjectProperty.index(80)"),
                    B: I18n.t("_constants.ObjectProperty.index(81)")
                },
                3: {
                    A: I18n.t("_constants.ObjectProperty.index(82)"),
                    B: ""
                }
            },
            IMPROVED: {
                0: {
                    A: I18n.t("_constants.ObjectProperty.index(83)"),
                    B: I18n.t("_constants.ObjectProperty.index(84)")
                },
                1: {
                    A: I18n.t("_constants.ObjectProperty.index(85)"),
                    B: I18n.t("_constants.ObjectProperty.index(86)")
                },
                2: {
                    A: I18n.t("_constants.ObjectProperty.index(87)"),
                    B: I18n.t("_constants.ObjectProperty.index(88)")
                },
                3: {
                    A: I18n.t("_constants.ObjectProperty.index(89)"),
                    B: I18n.t("_constants.ObjectProperty.index(90)")
                },
                4: {
                    A: I18n.t("_constants.ObjectProperty.index(91)"),
                    B: I18n.t("_constants.ObjectProperty.index(92)")
                },
                5: {
                    A: I18n.t("_constants.ObjectProperty.index(93)"),
                    B: ""
                },
                6: {
                    A: I18n.t("_constants.ObjectProperty.index(94)"),
                    B: ""
                }
            }
        }
    },
    BLUE: {
        NUMERIC_VALUE: -2,
        SOUND: I18n.t("_constants.ObjectProperty.index(95)"),
        ANDROID_SHARE_ASSET: I18n.t("_constants.ObjectProperty.index(96)"),
        COLOR_TEXT: I18n.t("_constants.ObjectProperty.index(97)"),
        CORE_BACKGROUND_COLOR: I18n.t("_constants.ObjectProperty.index(98)"),
        INNER_RING_BACKGROUND_COLOR: I18n.t("_constants.ObjectProperty.index(99)"),
        OUTER_RING_BACKGROUND_COLOR: I18n.t("_constants.ObjectProperty.index(100)"),
        FEEDBACK: {
            MAINTAINED: {
                0: {
                    A: I18n.t("_constants.ObjectProperty.index(101)"),
                    B: I18n.t("_constants.ObjectProperty.index(102)")
                },
                1: {
                    A: I18n.t("_constants.ObjectProperty.index(103)"),
                    B: I18n.t("_constants.ObjectProperty.index(104)")
                },
                2: {
                    A: I18n.t("_constants.ObjectProperty.index(105)"),
                    B: ""
                },
                3: {
                    A: I18n.t("_constants.ObjectProperty.index(106)"),
                    B: I18n.t("_constants.ObjectProperty.index(107)")
                },
                4: {
                    A: I18n.t("_constants.ObjectProperty.index(108)"),
                    B: ""
                },
                5: {
                    A: I18n.t("_constants.ObjectProperty.index(109)"),
                    B: ""
                },
                6: {
                    A: I18n.t("_constants.ObjectProperty.index(110)"),
                    B: ""
                },
                7: {
                    A: I18n.t("_constants.ObjectProperty.index(111)"),
                    B: I18n.t("_constants.ObjectProperty.index(112)")
                },
                8: {
                    A: `${I18n.t("_constants.TemplateElement.index(0)")}${smileyEmoji} ${smileyEmoji} ${smileyEmoji}${I18n.t("_constants.TemplateElement.index(1)")}`,
                    B: ""
                }
            },
            IMPROVED: {
                0: {
                    A: I18n.t("_constants.ObjectProperty.index(113)"),
                    B: I18n.t("_constants.ObjectProperty.index(114)")
                },
                1: {
                    A: I18n.t("_constants.ObjectProperty.index(115)"),
                    B: I18n.t("_constants.ObjectProperty.index(116)")
                },
                2: {
                    A: I18n.t("_constants.ObjectProperty.index(117)"),
                    B: I18n.t("_constants.ObjectProperty.index(118)")
                },
                3: {
                    A: I18n.t("_constants.ObjectProperty.index(119)"),
                    B: I18n.t("_constants.ObjectProperty.index(120)")
                },
                4: {
                    A: I18n.t("_constants.ObjectProperty.index(121)"),
                    B: I18n.t("_constants.ObjectProperty.index(122)")
                },
                5: {
                    A: I18n.t("_constants.ObjectProperty.index(123)"),
                    B: I18n.t("_constants.ObjectProperty.index(124)")
                },
                6: {
                    A: I18n.t("_constants.ObjectProperty.index(125)"),
                    B: I18n.t("_constants.ObjectProperty.index(126)")
                },
                7: {
                    A: I18n.t("_constants.ObjectProperty.index(127)"),
                    B: I18n.t("_constants.ObjectProperty.index(128)")
                },
                8: {
                    A: I18n.t("_constants.ObjectProperty.index(129)"),
                    B: I18n.t("_constants.ObjectProperty.index(130)")
                },
                9: {
                    A: I18n.t("_constants.ObjectProperty.index(131)"),
                    B: I18n.t("_constants.ObjectProperty.index(132)")
                },
                10: {
                    A: I18n.t("_constants.ObjectProperty.index(133)"),
                    B: I18n.t("_constants.ObjectProperty.index(134)")
                }
            }
        }
    }
};
export const MEASUREMENT_HISTORY_MESSAGES = {
    FAT_NEGATIVE: {
        WEIGHT_NEGATIVE: [I18n.t("_constants.ObjectProperty.index(135)"), I18n.t("_constants.ObjectProperty.index(136)"), I18n.t("_constants.ObjectProperty.index(137)")],
        WEIGHT_POSITIVE: [I18n.t("_constants.ObjectProperty.index(138)"), I18n.t("_constants.ObjectProperty.index(139)"), I18n.t("_constants.ObjectProperty.index(140)")],
        WEIGHT_NEUTRAL: [I18n.t("_constants.ObjectProperty.index(141)"), I18n.t("_constants.ObjectProperty.index(142)"), I18n.t("_constants.ObjectProperty.index(143)")]
    },
    FAT_POSITIVE: {
        WEIGHT_NEGATIVE: [I18n.t("_constants.ObjectProperty.index(144)"), I18n.t("_constants.ObjectProperty.index(145)"), I18n.t("_constants.ObjectProperty.index(146)")],
        WEIGHT_POSITIVE: [I18n.t("_constants.ObjectProperty.index(147)"), I18n.t("_constants.ObjectProperty.index(148)"), I18n.t("_constants.ObjectProperty.index(149)")],
        WEIGHT_NEUTRAL: [I18n.t("_constants.ObjectProperty.index(150)"), I18n.t("_constants.ObjectProperty.index(151)"), I18n.t("_constants.ObjectProperty.index(152)")]
    },
    FAT_NEUTRAL: {
        WEIGHT_NEGATIVE: [I18n.t("_constants.ObjectProperty.index(153)"), I18n.t("_constants.ObjectProperty.index(154)"), I18n.t("_constants.ObjectProperty.index(155)")],
        WEIGHT_POSITIVE: [I18n.t("_constants.ObjectProperty.index(156)"), I18n.t("_constants.ObjectProperty.index(157)"), I18n.t("_constants.ObjectProperty.index(158)")],
        WEIGHT_NEUTRAL: [I18n.t("_constants.ObjectProperty.index(159)"), I18n.t("_constants.ObjectProperty.index(160)"), I18n.t("_constants.ObjectProperty.index(161)")]
    }
};

// For determining how many weigh-ins a user has made in a day, and how that corresponds to their calibration status.
export const WEIGH_IN_STATUSES = {
    NO_MEASUREMENTS_TAKEN: "NO_MEASUREMENTS_TAKEN",
    ONE_CALIBRATION_MEASUREMENT_TAKEN_RECENTLY:
        "ONE_CALIBRATION_MEASUREMENT_TAKEN_RECENTLY",
    ONE_CALIBRATION_MEASUREMENT_TAKEN: "ONE_CALIBRATION_MEASUREMENT_TAKEN",
    ALL_MEASUREMENTS_TAKEN: "ALL_MEASUREMENTS_TAKEN"
};

// Enumeration of the possible states that can occur when calculating a measurement.
export const MEASUREMENT_CALCULATING_STATES = {
    CALCULATING: "calculating",
    DONE: "done",
    ERROR: "error"
};

export const MEASUREMENT_RESULT_STATES = {
    FIRST_MEASUREMENT: "FIRST_MEASUREMENT",
    IS_CALIBRATING: "IS_CALIBRATING",
    GROUP_A: "GROUP_A",
    FINAL_CALIBRATION: "FINAL_CALIBRATION",
    COLOR_IMPROVED: "COLOR_IMPROVED",
    COLOR_MAINTAINED: "COLOR_MAINTAINED",
    COLOR_DECLINED: "COLOR_DECLINED"
};

// Unique Ids required for identifying modals throughout the application.
export const MODAL_IDS = {
    FORGOT_PASSWORD: "FORGOT_PASSWORD",
    NETWORK_ERROR: "NETWORK_ERROR",
    MEASUREMENT_ERROR: "MEASUREMENT_ERROR",
    WEB_VIEW: "WEB_VIEW",
    CONFETTI_CELEBRATION: "CONFETTI_CELEBRATION",
    BIRTHDAY_CELEBRATION: "BIRTHDAY_CELEBRATION",
    MISSION_START: "MISSION_START",
    MISSION_COMPLETED: "MISSION_COMPLETED",
    MISSION_SUGGEST_SKIP: "MISSION_SUGGEST_SKIP",
    MISSION_DECLINED_WEAK_WARNING: "MISSION_DECLINED_WEAK_WARNING",
    MISSION_DECLINED_STRONG_WARNING: "MISSION_DECLINED_STRONG_WARNING",
    MISSION_MODIFY_HISTORY: "MISSION_MODIFY_HISTORY",
    EMAIL_SUCCESS: "EMAIL_SUCCESS",
    DASH_WEIGH_IN_REMINDER: "DASH_WEIGH_IN_REMINDER",
    CALIBRATION_COMPLETE: "CALIBRATION_COMPLETE",
    SHAPA_AGE_IMPROVEMENT: "SHAPA_AGE_IMPROVEMENT",
    SHAPA_AGE_DID_YOU_KNOW: "SHAPA_AGE_DID_YOU_KNOW",
    FOOD_TRACKER: "FOOD_TRACKER",
    ACTIVITY_TRACKER: "ACTIVITY_TRACKER",
    VACATION_ENDED: "VACATION_ENDED",
    WELCOME_BACK: "WELCOME_BACK",
    BATTERY_LEVEL_WARNING: "BATTERY_LEVEL_WARNING",
    FACEBOOK_SHARE_SUCCESS: "FACEBOOK_SHARE_SUCCESS",
    FACEBOOK_SHARE_FAILURE: "FACEBOOK_SHARE_FAILURE",
    MEASUREMENT_COMPLETED: "MEASUREMENT_COMPLETED",
    // Using an array here allows us to crush some lines of logic on the Dashboard. Instead of calculating which id should be shown based on the days remaining of the user's subscription,
    // We just use that days remaining number as the address in which the id is stored. 0 === Final Warning, 7 === First Warning, ect
    SUBSCRIPTION: ["SUB_FINAL_WARNING", "SUB_SEVENTH_WARNING", "SUB_SIXTH_WARNING", "SUB_FIFTH_WARNING", "SUB_FOURTH_WARNING", "SUB_THIRD_WARNING", "SUB_SECOND_WARNING", "SUB_FIRST_WARNING"],
    VIDEO: {
        MISSIONS: "MISSIONS",
        INSTRUCTIONAL_10_DAYS: "INSTRUCTIONAL_10_DAYS",
        HOW_MISSIONS_ARE_CHOSEN: "HOW_MISSIONS_ARE_CHOSEN",
        COLOR: "COLOR"
    },
    NEW_BADGE: "NEW_BADGE",
    FEATURES: {
        // Displayed on the Dashboard
        BADGES_REVEAL: "BADGES_REVEAL",
        // Displayed after the user has seen the "BADGES_REVEAL" modal,
        // contains more information on the badges project.
        MORE_BADGE_INFORMATION: "MORE_BADGE_INFORMATION",
        // Displayed on the Dashboard
        HISTORY_REVEAL: "HISTORY_REVEAL",
        // Displayed after the user has seen the "HISTORY_REVEAL" modal,
        // contains more information on the history project.
        MORE_HISTORY_INFORMATION: "MORE_HISTORY_INFORMATION"
    },
    APP_RATING: "APP_RATING",
    RA_CLASS_ATTENDANCE_INFO: "RA_CLASS_ATTENDANCE_INFO",
    UPDATE_RA_CLASS_ATTENDANCE: "UPDATE_RA_CLASS_ATTENDANCE",
    CUSTOM_REMINDER_INPUT: "CUSTOM_REMINDER_INPUT",
    VITALITY_PERMISSION_PROMPT_ACCEPT: "VITALITY_PERMISSION_PROMPT_ACCEPT",
    VITALITY_PERMISSION_PROMPT_DECLINE: "VITALITY_PERMISSION_PROMPT_DECLINE"
};

export const URLS = {
    CONTACT_US: "https://www.shapa.me/",
    LOG_IN: "https://www.myshapa.com/users",
    PROFILE_PAGE: "https://www.myshapa.com/users",
    TOS_POLICY: "https://www.myshapa.com/policies/terms-and-conditions",
    PRIVACY_POLICY: "https://www.myshapa.com/policies/privacy",
    VIDEO: {
        MISSIONS: "https://www.myshapa.com/videos/instructional_MISSIONS_low.mp4",
        INSTRUCTIONAL_10_DAYS: "https://www.myshapa.com/videos/instructional_10_days_low.mp4",
        HOW_MISSIONS_ARE_CHOSEN: "https://www.myshapa.com/videos/instructional_how_are_missions_chosen_low.mp4",
        COLOR: "https://www.myshapa.com/videos/instructional_COLOR_low.mp4"
    },
    REALAPPEAL_RESCHEDULE: "https://member.realappeal.com/"
};

// These are the possible states of an active mission for a given day.
export const ACTIVE_MISSION_STATE = {
    COMPLETE: "COMPLETE",
    INCOMPLETE: "INCOMPLETE",
    UNKNOWN: "UNKNOWN"
};

export const CALENDAR_AUTH_STATUSES = {
    UNDETERMINED: "undetermined",
    AUTHORIZED: "authorized",
    RESTRICTED: "restricted",
    DENIED: "denied"
}

export const PWA_QUESTIONS = {
    PERIOD_CYCLE_TYPE: "PERIOD_CYCLE_TYPE",
    PERIOD_START_DATE_KNOWN: "PERIOD_START_DATE_KNOWN",
    PERIOD_START_DATE: "PERIOD_START_DATE",
    PWA_COMPLETED: "PWA_COMPLETED",
    PWA_DEFERRED: "PWA_DEFERRED",
    PERIOD_CYCLE_LENGTH: "PERIOD_CYCLE_LENGTH",
    IRREGULAR_PERIOD_LOGGED: "IRREGULAR_PERIOD_LOGGED"
}

export const SQL_FORMATS = {
    DATE: 'YYYY-MM-DD',
    DATETIME: 'YYYY-MM-DD HH:mm:ss', // UTC TIME, so no offset
    TIME: "h:mm:sa"
}

export const VERSION_NUMBERS = {
    FEATURES: {
        BADGES: "2.1.5"
    }
}

export const VALIDATION_TEMPLATES = {
    NOT_EMPTY: "NOT EMPTY",
    EMAIL: "EMAIL",
    PHONE_NUMBER: "PHONE NUMBER"
};

export const EVENT_IDS = {
    DASHBOARD_AGE_ANIMATION: "DASHBOARD_AGE_ANIMATION",
    APP_OPENED: "APP_OPENED",
    DISMISSED_EXPIRED_SUBSCRIPTION_NOTIFICATION: "DISMISSED_EXPIRED_SUBSCRIPTION_NOTIFICATION",
    RATING_REQUIRED: "RATING_REQUIRED"
};

export const ANALYTICS_EVENTS = {
    SIGN_UP: "_userauth.sign_up",
    SIGN_IN: "_userauth.sign_in",
    AUTH_FAIL: "_userauth.auth_fail",
    APP_OPENED: "APP_OPENED",
    APP_CLOSED: "APP_CLOSED",
    TAB_OPENED: "TAB_OPENED",
    VACATION_MODE: "VACATION_MODE",
    FB_SHARE: "FB_SHARE",
    VIDEO_WATCHED: "VIDEO_WATCHED",
    MENU_OPENED: "MENU_OPENED"
}

export const APP_RATING_CONFIG = {
    AppleAppID: "1053767884",
    GooglePackageName: "com.shapa.android",
    preferInApp: true,
    openAppStoreIfInAppFails: true,
    fallbackPlatformURL: "http://myshapa.com/review"
}

// This slot # represents a mission that has been closed out (basically taken out of consideration from being displayed in the UI).
// Note that this number must be in sync with the corresponding server constant.
export const CLOSED_OUT_REC_SLOT = 9999;

/**
 * PROGRAM_TYPES contains the strings associated with
 * specific programs users are enrolled in.
 */
export const PROGRAM_TYPES = {
    REAL_APPEAL: "Real Appeal"
};

export const RA_CLASS_STATUSES = {
    ATTENDED: "ATTENDED",
    UNATTENDED: "UNATTENDED",
    UNKNOWN: "UNKNOWN"
};

export const VITALITY_AUTH_STATES = {
    ACCEPTED: "ACCEPTED",
    DECLINED: "DECLINED",
    UNKNOWN: 'UNKNOWN'
}
