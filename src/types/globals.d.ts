export {};

declare global {
  interface CustomJwtSessionClaims {
    metadata: {
      isOnboarded?: boolean;
    };
  }
}
