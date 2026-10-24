import {
  provideKeycloak,
  createInterceptorCondition,
  IncludeBearerTokenCondition,
  INCLUDE_BEARER_TOKEN_INTERCEPTOR_CONFIG,
  withAutoRefreshToken,
  AutoRefreshTokenService,
  UserActivityService
} from 'keycloak-angular';

// =========================================
// BACKEND API AUTHENTICATION
// =========================================

// Der Bearer-Token wird ausschließlich
// an unser SCEM-Backend gesendet.

const localhostCondition =
  createInterceptorCondition<IncludeBearerTokenCondition>({
    urlPattern: /^http:\/\/localhost:5123(?:\/|$)/i
  });

// =========================================
// KEYCLOAK CONFIGURATION
// =========================================

export const provideKeycloakAngular = () =>
  provideKeycloak({

    config: {
      realm: 'myTest',
      url: 'https://auth.aitenbichler.cc',
      clientId: 'myTestUI'
    },

    // =====================================
    // INITIALIZATION
    // =====================================

    initOptions: {
      onLoad: 'check-sso',

      silentCheckSsoRedirectUri:
        document.baseURI.slice(0, -1) +
        '/silent-check-sso.html',

      redirectUri:
        document.baseURI.slice(0, -1) + '/'
    },

    // =====================================
    // AUTOMATIC TOKEN REFRESH
    // =====================================

    features: [

      withAutoRefreshToken({

        // Bei Inaktivität abmelden
        onInactivityTimeout: 'logout',

        // 60 Minuten Inaktivität
        sessionTimeout: 3600000

      })

    ],

    // =====================================
    // PROVIDERS
    // =====================================

    providers: [

      AutoRefreshTokenService,

      UserActivityService,

      {
        provide:
          INCLUDE_BEARER_TOKEN_INTERCEPTOR_CONFIG,

        useValue: [localhostCondition]
      }

    ]

  });