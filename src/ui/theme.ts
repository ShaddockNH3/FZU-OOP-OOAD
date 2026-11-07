import type { GlobalThemeOverrides } from 'naive-ui';

/** 浅色主题：白卡片 + #f4f6fa 底 + 深蓝主色 + 金色点缀（比分）。 */
export const themeOverrides: GlobalThemeOverrides = {
  common: {
    primaryColor: '#1f4e9c',
    primaryColorHover: '#2a62bd',
    primaryColorPressed: '#16386f',
    primaryColorSuppl: '#1f4e9c',
    successColor: '#1f9d55',
    warningColor: '#d97706',
    errorColor: '#d7263d',
    textColorBase: '#1c2434',
    bodyColor: '#f4f6fa',
    borderRadius: '10px',
    borderRadiusSmall: '8px',
    fontFamily: '"Inter", "PingFang SC", "Microsoft YaHei", system-ui, sans-serif'
  },
  Card: {
    color: '#ffffff',
    borderColor: '#e4e9f2',
    titleFontWeight: '600',
    titleFontSizeMedium: '16px'
  },
  DataTable: {
    thColor: '#f3f6fb',
    thTextColor: '#51607a',
    tdColor: '#ffffff',
    borderColor: '#eef2f8',
    thFontWeight: '600'
  },
  Tag: {
    borderRadius: '8px'
  },
  Slider: {
    fillColor: '#1f4e9c',
    fillColorHover: '#2a62bd',
    handleColor: '#1f4e9c'
  }
};

export const SCORE_COLOR = '#b07d1a';
