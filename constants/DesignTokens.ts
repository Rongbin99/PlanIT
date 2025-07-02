/**
 * Design Tokens
 * 
 * Central design system constants for consistent styling across the PlanIT app.
 * Following the DRY principle to maintain a single source of truth for all design values.
 * 
 * @author Rongbin Gu (@rongbin99)
 */

// ========================================
// COLOR PALETTE
// ========================================

/**
 * UI color scheme for consistent styling
 */
export const COLORS = {
    primary: '#4B6CB7',
    secondary: '#888',
    text: '#333',
    lightText: '#666',
    // darkText: '#000',
    background: '#f8f9fa',
    white: '#ffffff',
    black: '#000000',
    border: '#e0e0e0',
    accent: '#e3f2fd',
} as const;

// ========================================
// TYPOGRAPHY SCALE
// ========================================

/**
 * Typography scale for consistent text sizing
 */
export const TYPOGRAPHY = {
    fontSize: {
        xs: 12,
        sm: 14,
        base: 16,
        lg: 20,
        xl: 24,
        xxl: 28,
    },
    fontWeight: {
        normal: '400' as const,
        medium: '500' as const,
        semibold: '600' as const,
        bold: 'bold' as const,
    },
    lineHeight: {
        tight: 18,
        normal: 20,
        relaxed: 22,
        loose: 24,
    },
} as const;

// ========================================
// SPACING SCALE
// ========================================

/**
 * Spacing scale for consistent margins and padding
 */
export const SPACING = {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    xxxl: 40,
} as const;

// ========================================
// BORDER RADIUS SCALE
// ========================================

/**
 * Border radius scale for consistent rounded corners
 */
export const RADIUS = {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    xxl: 24,
} as const;

// ========================================
// ICON SIZES
// ========================================

/**
 * Icon sizes for consistent iconography
 */
export const ICON_SIZES = {
    xs: 14,
    sm: 16,
    md: 18,
    lg: 20,
    xl: 24,
    xxl: 32,
} as const;

// ========================================
// SHADOW CONFIGURATIONS
// ========================================

/**
 * Shadow configurations for consistent elevation
 */
export const SHADOWS = {
    card: {
        shadowColor: COLORS.text,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    button: {
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 2,
    },
} as const;

// ========================================
// LAYOUT CONFIGURATIONS
// ========================================

/**
 * Layout configurations using design tokens
 */
export const LAYOUT = {
    header: {
        paddingTop: 50,
        paddingHorizontal: SPACING.xl,
        paddingBottom: SPACING.sm + SPACING.xs, // 14
    },
    content: {
        paddingHorizontal: SPACING.xl,
        paddingTop: SPACING.lg,
    },
    card: {
        marginBottom: SPACING.sm + SPACING.xs, // 14
        padding: SPACING.lg,
        borderRadius: RADIUS.lg,
    },
    emptyState: {
        paddingHorizontal: SPACING.xxl,
        paddingVertical: SPACING.xxxl,
    },
    button: {
        borderRadius: RADIUS.xxl,
        padding: SPACING.md,
        paddingHorizontal: SPACING.xxl,
    },
    hitSlop: {
        top: SPACING.sm + SPACING.xs, // 10
        bottom: SPACING.sm + SPACING.xs,
        left: SPACING.sm + SPACING.xs,
        right: SPACING.sm + SPACING.xs,
    },
} as const;

// ========================================
// PROFILE LAYOUT CONFIGURATIONS
// ========================================

/**
 * Profile-specific layout constants using design tokens
 */
export const PROFILE_LAYOUT = {
    bannerHeight: 250, // Banner height
    profileImageSize: SPACING.xxxl * 3, // 120px equivalent (40 * 3)
    profileImageRadius: SPACING.xxxl * 1.5, // 60px equivalent (40 * 1.5)
    editIconSize: SPACING.xl + SPACING.xs, // 30px (20 + 4 + 6)
    editIconRadius: SPACING.md + SPACING.xs - 1, // 15px (12 + 4 - 1)
    profileOverlayOffset: -SPACING.xxxl - SPACING.xl, // -60px (-40 - 20)
    statsContainerRadius: SPACING.xl,
    statDividerHeight: SPACING.xl + SPACING.xs + SPACING.xs + 2, // 30px
    settingsTopMargin: SPACING.xxxl * 2, // 80px (40 * 2)
} as const;

// ========================================
// TIME CONSTANTS
// ========================================

/**
 * Time calculation constants
 */
export const TIME_CONSTANTS = {
    MINUTE_MS: 1000 * 60,
    HOUR_MS: 1000 * 60 * 60,
    DAY_MS: 1000 * 60 * 60 * 24,
    WEEK_MS: 1000 * 60 * 60 * 24 * 7,
} as const;

// ========================================
// TYPE EXPORTS
// ========================================

/**
 * Type definitions for design token values
 */
export type ColorKeys = keyof typeof COLORS;
export type FontSizeKeys = keyof typeof TYPOGRAPHY.fontSize;
export type FontWeightKeys = keyof typeof TYPOGRAPHY.fontWeight;
export type LineHeightKeys = keyof typeof TYPOGRAPHY.lineHeight;
export type SpacingKeys = keyof typeof SPACING;
export type RadiusKeys = keyof typeof RADIUS;
export type IconSizeKeys = keyof typeof ICON_SIZES;
export type ShadowKeys = keyof typeof SHADOWS;
export type LayoutKeys = keyof typeof LAYOUT;
export type ProfileLayoutKeys = keyof typeof PROFILE_LAYOUT; 
