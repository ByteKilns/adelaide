import 'package:flutter/material.dart';

class AppColors {
  AppColors._();

  static const background = Color(0xFFF5F1FA);
  static const surface = Color(0xFFFFFFFF);
  static const primary = Color(0xFF5B3FA6);
  static const textPrimary = Color(0xFF1A1625);
  static const textMuted = Color(0xFF8A8398);
  static const accentLight = Color(0xFFF3E8FF);
  static const accentLightForeground = Color(0xFF7C3AED);
}

class AppTheme {
  AppTheme._();

  static const eyebrow = TextStyle(
    fontFamily: 'SpaceGrotesk',
    fontWeight: FontWeight.w500,
    fontSize: 12,
    letterSpacing: 1.5,
    color: AppColors.textMuted,
  );

  static const headline = TextStyle(
    fontFamily: 'SpaceGrotesk',
    fontWeight: FontWeight.w700,
    fontSize: 32,
    color: AppColors.textPrimary,
    height: 1.15,
  );

  static const wordmark = TextStyle(
    fontFamily: 'SpaceGrotesk',
    fontWeight: FontWeight.w700,
    fontSize: 32,
    color: AppColors.textPrimary,
  );

  static const sectionHeading = TextStyle(
    fontFamily: 'SpaceGrotesk',
    fontWeight: FontWeight.w700,
    fontSize: 20,
    color: AppColors.textPrimary,
  );

  static const subtitle = TextStyle(
    fontFamily: 'SpaceGrotesk',
    fontSize: 15,
    color: AppColors.textMuted,
  );

  static ThemeData get theme {
    final base = ThemeData(
      useMaterial3: true,
      colorSchemeSeed: AppColors.primary,
      fontFamily: 'SpaceGrotesk',
    );

    final inputBorder = OutlineInputBorder(
      borderRadius: BorderRadius.circular(14),
      borderSide: BorderSide(color: AppColors.textMuted.withValues(alpha: 0.25)),
    );

    return base.copyWith(
      scaffoldBackgroundColor: AppColors.background,
      colorScheme: base.colorScheme.copyWith(
        primary: AppColors.primary,
        surface: AppColors.surface,
      ),
      appBarTheme: const AppBarTheme(
        backgroundColor: AppColors.background,
        foregroundColor: AppColors.textPrimary,
        elevation: 0,
        surfaceTintColor: Colors.transparent,
        titleTextStyle: TextStyle(
          fontFamily: 'SpaceGrotesk',
          fontWeight: FontWeight.w700,
          fontSize: 22,
          color: AppColors.textPrimary,
        ),
      ),
      textTheme: base.textTheme.apply(
        fontFamily: 'SpaceGrotesk',
        bodyColor: AppColors.textPrimary,
        displayColor: AppColors.textPrimary,
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: AppColors.surface,
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        border: inputBorder,
        enabledBorder: inputBorder,
        focusedBorder: inputBorder.copyWith(
          borderSide: const BorderSide(color: AppColors.primary, width: 1.5),
        ),
        labelStyle: const TextStyle(color: AppColors.textMuted, fontFamily: 'SpaceGrotesk'),
        hintStyle: TextStyle(color: AppColors.textMuted.withValues(alpha: 0.6), fontFamily: 'SpaceGrotesk'),
      ),
      filledButtonTheme: FilledButtonThemeData(
        style: FilledButton.styleFrom(
          backgroundColor: AppColors.textPrimary,
          foregroundColor: Colors.white,
          minimumSize: const Size.fromHeight(52),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
          textStyle: const TextStyle(fontFamily: 'SpaceGrotesk', fontWeight: FontWeight.w500, fontSize: 16),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: AppColors.primary,
          side: const BorderSide(color: AppColors.primary),
          minimumSize: const Size.fromHeight(52),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
          textStyle: const TextStyle(fontFamily: 'SpaceGrotesk', fontWeight: FontWeight.w500, fontSize: 16),
        ),
      ),
    );
  }
}
