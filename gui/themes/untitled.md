# Untitled

Generated from the current project, including edits awaiting autosave. Return to the [theme index](../themes.md). Install the selected fonts and icons using the setup below; assets are acquired separately from their official sources.

## Font and icon setup

Follow [asset installation](../assets.md) when implementing this theme. Download and configure the selected free assets from their official sources; no font files or icon artwork are bundled. Weights below are the authored requests: load matching static faces or a variable range and report any unavailable weight. Register the exact family aliases below, or map the role tokens to the loader’s actual family.

| Selected font | Roles | Weights | Family stack | Setup |
| --- | --- | --- | --- | --- |
| <code>Open Runde</code> (free) | brand, ui, editorial, data | 400, 700, 800 | <code>"Open Runde", -apple-system, BlinkMacSystemFont, sans-serif</code> | Download and load [Open Runde](https://github.com/lauridskern/open-runde/releases/latest) in the app. |

### Icons

Selected: [Central](https://iconists.co/central), filled. Use the user’s licensed Central artwork if supplied under the [vendor license](https://iconists.co/license). Otherwise install [Lucide](https://lucide.dev/guide/react/getting-started) (React: <code>lucide-react</code>) and wire it into the app’s icon adapter. Tell the user that Lucide is active and that they can license Central at the vendor link, add its files to the app’s icon asset location, and update that adapter to restore Central.

Preserve icon size, color, weight, style, and accessible names. Match the selected style only where the pack supports it; Lucide’s official pack supplies outlines, so report a filled-style gap rather than claiming exact filled artwork. Keep existing package versions and add only missing packages using the receiving project’s package manager.

## Foundations

```json
{
  "name": "Untitled",
  "primaryForeground": {
    "light": "neutral-10",
    "dark": "neutral-2"
  },
  "iconFamily": "Central",
  "animation": {
    "duration": 200,
    "easing": [
      0.16,
      1,
      0.3,
      1
    ],
    "large": {
      "duration": 360,
      "easing": [
        0.22,
        1,
        0.36,
        1
      ]
    },
    "popupScale": 0.96,
    "pressDistance": 1
  },
  "spacing": {
    "zero": 0,
    "xxs": 4,
    "xs": 8,
    "s": 12,
    "m": 16,
    "l": 24,
    "xl": 32,
    "xxl": 48
  },
  "text": {
    "xxs": {
      "size": 10,
      "lineHeight": 14
    },
    "xs": {
      "size": 12,
      "lineHeight": 16
    },
    "s": {
      "size": 14,
      "lineHeight": 20
    },
    "m": {
      "size": 16,
      "lineHeight": 24
    },
    "l": {
      "size": 24,
      "lineHeight": 32
    },
    "xl": {
      "size": 36,
      "lineHeight": 40
    },
    "xxl": {
      "size": 48,
      "lineHeight": 52
    }
  },
  "fonts": {
    "ui": {
      "family": "\"Open Runde\", -apple-system, BlinkMacSystemFont, sans-serif",
      "weights": {
        "regular": 400,
        "medium": 700,
        "heavy": 800
      }
    },
    "brand": {
      "family": "\"Open Runde\", -apple-system, BlinkMacSystemFont, sans-serif",
      "weights": {
        "regular": 400,
        "medium": 700,
        "heavy": 800
      }
    },
    "editorial": {
      "family": "\"Open Runde\", -apple-system, BlinkMacSystemFont, sans-serif",
      "weights": {
        "regular": 400,
        "medium": 700,
        "heavy": 800
      }
    },
    "data": {
      "family": "\"Open Runde\", -apple-system, BlinkMacSystemFont, sans-serif",
      "weights": {
        "regular": 400,
        "medium": 700,
        "heavy": 800
      }
    }
  },
  "radius": {
    "zero": 0,
    "xs": 8,
    "s": 16,
    "m": 22,
    "l": 28,
    "xl": 40,
    "full": 9999
  },
  "border": {
    "none": 0,
    "s": 0,
    "m": 0,
    "l": 0
  },
  "shadows": {
    "s": {
      "x": 0,
      "y": 2,
      "blur": 4,
      "spread": 0,
      "opacity": 0,
      "color": {
        "light": "neutral-10",
        "dark": "neutral-1"
      }
    },
    "m": {
      "x": 0,
      "y": 8,
      "blur": 24,
      "spread": 0,
      "opacity": 12,
      "color": {
        "light": "neutral-10",
        "dark": "neutral-1"
      }
    },
    "l": {
      "x": 0,
      "y": 16,
      "blur": 48,
      "spread": 0,
      "opacity": 0,
      "color": {
        "light": "neutral-10",
        "dark": "neutral-1"
      }
    }
  },
  "iconStyle": "filled",
  "buttonRadius": "full",
  "neutralTone": "warm",
  "letterSpacing": {
    "xs": -0.02,
    "s": -0.01,
    "m": 0,
    "l": 0.01,
    "xl": 0.02
  },
  "colorEmphasis": 75
}
```

## light CSS variables

Define these in the app’s existing theme scope for this mode. Keep component styles linked to the variables.

| Variable | Value |
| --- | --- |
| `--theme-name` | Untitled |
| `--theme-icon-family` | Central |
| `--theme-icon-style` | filled |
| `--toolbar-divider-bleed` | 0 |
| `--focus-ring-outline` | initial |
| `--icon-stroke-width` | 2 |
| `--icon-light-display` | none |
| `--icon-regular-display` | inline |
| `--icon-bold-display` | none |
| `--motion-duration` | 200ms |
| `--motion-easing` | cubic-bezier(0.16, 1, 0.3, 1) |
| `--motion-type` | easing |
| `--motion-visual-duration` | 0.2 |
| `--motion-bounce` | 0.2 |
| `--motion-enabled` | 1 |
| `--motion-small-iterations` | infinite |
| `--motion-large-duration` | 360ms |
| `--motion-large-easing` | cubic-bezier(0.22, 1, 0.36, 1) |
| `--motion-large-type` | easing |
| `--motion-large-visual-duration` | 0.36 |
| `--motion-large-bounce` | 0.2 |
| `--motion-large-iterations` | infinite |
| `--motion-popup-scale` | 0.96 |
| `--motion-press-distance` | 1px |
| `--option-badge-background` | #00c853 |
| `--option-badge-foreground` | #000000 |
| `--navigation-active-foreground` | #000000 |
| `--emphasis-chart-fill` | #00c85333 |
| `--emphasis-balance-background` | #b6ebd8 |
| `--emphasis-rewards-background` | #07376b |
| `--emphasis-icon-background` | #ffb8da |
| `--emphasis-icon-foreground` | #000000 |
| `--emphasis-type-background` | #00c853 |
| `--emphasis-type-foreground` | #000000 |
| `--navigation-active-background` | #00c853 |
| `--surface-raised-image` | none |
| `--surface-raised-shadow` | 0 0 0 0 transparent |
| `--surface-recessed-image` | none |
| `--surface-recessed-shadow` | 0 0 0 0 transparent |
| `--space-zero` | 0px |
| `--space-xxs` | 4px |
| `--space-xs` | 8px |
| `--space-s` | 12px |
| `--space-m` | 16px |
| `--space-l` | 24px |
| `--space-xl` | 32px |
| `--space-xxl` | 48px |
| `--tracking-xs` | -0.02em |
| `--tracking-s` | -0.01em |
| `--tracking-m` | 0em |
| `--tracking-l` | 0.01em |
| `--tracking-xl` | 0.02em |
| `--size-xxs` | 10px |
| `--line-xxs` | 14px |
| `--letter-spacing-xxs` | 0.02em |
| `--size-xs` | 12px |
| `--line-xs` | 16px |
| `--letter-spacing-xs` | 0.01em |
| `--size-s` | 14px |
| `--line-s` | 20px |
| `--letter-spacing-s` | 0.01em |
| `--size-m` | 16px |
| `--line-m` | 24px |
| `--letter-spacing-m` | 0em |
| `--size-l` | 24px |
| `--line-l` | 32px |
| `--letter-spacing-l` | -0.01em |
| `--size-xl` | 36px |
| `--line-xl` | 40px |
| `--letter-spacing-xl` | -0.01em |
| `--size-xxl` | 48px |
| `--line-xxl` | 52px |
| `--letter-spacing-xxl` | -0.02em |
| `--radius-zero` | 0px |
| `--radius-xs` | 8px |
| `--radius-s` | 16px |
| `--radius-m` | 22px |
| `--radius-l` | 28px |
| `--radius-xl` | 40px |
| `--radius-full` | 9999px |
| `--border-none` | 0px |
| `--border-s` | 0px |
| `--border-m` | 0px |
| `--border-l` | 0px |
| `--border-default-color` | #e9e6e033 |
| `--border-shadow-none` | 0 0 0 0 transparent |
| `--border-shadow-s` | 0 0 0 0 transparent |
| `--border-shadow-m` | 0 0 0 0 transparent |
| `--border-shadow-l` | 0 0 0 0 transparent |
| `--font-ui` | "Open Runde", -apple-system, BlinkMacSystemFont, sans-serif |
| `--weight-ui-regular` | 400 |
| `--weight-ui-medium` | 700 |
| `--weight-ui-heavy` | 800 |
| `--font-brand` | "Open Runde", -apple-system, BlinkMacSystemFont, sans-serif |
| `--weight-brand-regular` | 400 |
| `--weight-brand-medium` | 700 |
| `--weight-brand-heavy` | 800 |
| `--font-editorial` | "Open Runde", -apple-system, BlinkMacSystemFont, sans-serif |
| `--weight-editorial-regular` | 400 |
| `--weight-editorial-medium` | 700 |
| `--weight-editorial-heavy` | 800 |
| `--font-data` | "Open Runde", -apple-system, BlinkMacSystemFont, sans-serif |
| `--weight-data-regular` | 400 |
| `--weight-data-medium` | 700 |
| `--weight-data-heavy` | 800 |
| `--color-none` | transparent |
| `--color-1` | #00c853 |
| `--color-1-transparent` | #00c85333 |
| `--color-2` | #07376b |
| `--color-2-transparent` | #07376b33 |
| `--color-3` | #ffb8da |
| `--color-3-transparent` | #ffb8da33 |
| `--color-4` | #b6ebd8 |
| `--color-4-transparent` | #b6ebd833 |
| `--neutral-1` | #ffffff |
| `--neutral-1-transparent` | #ffffff33 |
| `--neutral-2` | #fbfbfa |
| `--neutral-2-transparent` | #fbfbfa33 |
| `--neutral-3` | #f5f4f1 |
| `--neutral-3-transparent` | #f5f4f133 |
| `--neutral-4` | #e9e6e0 |
| `--neutral-4-transparent` | #e9e6e033 |
| `--neutral-5` | #d2ccc0 |
| `--neutral-5-transparent` | #d2ccc033 |
| `--neutral-6` | #a6a094 |
| `--neutral-6-transparent` | #a6a09433 |
| `--neutral-7` | #837d72 |
| `--neutral-7-transparent` | #837d7233 |
| `--neutral-8` | #59544a |
| `--neutral-8-transparent` | #59544a33 |
| `--neutral-9` | #373228 |
| `--neutral-9-transparent` | #37322833 |
| `--neutral-10` | #000000 |
| `--neutral-10-transparent` | #00000033 |
| `--success` | #00c853 |
| `--success-transparent` | #00c85333 |
| `--warning` | #ffea00 |
| `--warning-transparent` | #ffea0033 |
| `--error` | #fc032d |
| `--error-transparent` | #fc032d33 |
| `--shadow-none` | none |
| `--shadow-s` | 0px 2px 4px 0px #00000000 |
| `--shadow-m` | 0px 2px 6px 0px #0000000d, 0px 8px 24px 0px #00000013 |
| `--shadow-l` | 0px 16px 48px 0px #00000000 |
| `--cte-canvas` | #ffffff |
| `--cte-surface` | #fbfbfa |
| `--cte-surface-muted` | #f5f4f1 |
| `--cte-text` | #000000 |
| `--cte-text-muted` | #837d72 |
| `--cte-border` | #e9e6e033 |
| `--cte-accent` | #00c853 |
| `--cte-accent-text` | #000000 |
| `--cte-danger` | #fc032d |
| `--cte-focus` | #00c853 |
| `--cte-font` | "Open Runde", -apple-system, BlinkMacSystemFont, sans-serif |
| `--cte-font-size` | 14px |
| `--cte-font-weight` | 400 |
| `--cte-line-height` | 20px |
| `--cte-letter-spacing` | 0.01em |
| `--cte-detail-font-size` | 12px |
| `--cte-detail-line-height` | 16px |
| `--cte-detail-letter-spacing` | 0.01em |

## dark CSS variables

Define these in the app’s existing theme scope for this mode. Keep component styles linked to the variables.

| Variable | Value |
| --- | --- |
| `--theme-name` | Untitled |
| `--theme-icon-family` | Central |
| `--theme-icon-style` | filled |
| `--toolbar-divider-bleed` | 0 |
| `--focus-ring-outline` | initial |
| `--icon-stroke-width` | 2 |
| `--icon-light-display` | none |
| `--icon-regular-display` | inline |
| `--icon-bold-display` | none |
| `--motion-duration` | 200ms |
| `--motion-easing` | cubic-bezier(0.16, 1, 0.3, 1) |
| `--motion-type` | easing |
| `--motion-visual-duration` | 0.2 |
| `--motion-bounce` | 0.2 |
| `--motion-enabled` | 1 |
| `--motion-small-iterations` | infinite |
| `--motion-large-duration` | 360ms |
| `--motion-large-easing` | cubic-bezier(0.22, 1, 0.36, 1) |
| `--motion-large-type` | easing |
| `--motion-large-visual-duration` | 0.36 |
| `--motion-large-bounce` | 0.2 |
| `--motion-large-iterations` | infinite |
| `--motion-popup-scale` | 0.96 |
| `--motion-press-distance` | 1px |
| `--option-badge-background` | #00c853 |
| `--option-badge-foreground` | #241f16 |
| `--navigation-active-foreground` | #241f16 |
| `--emphasis-chart-fill` | #00c85333 |
| `--emphasis-balance-background` | #b6ebd8 |
| `--emphasis-rewards-background` | #07376b |
| `--emphasis-icon-background` | #ffb8da |
| `--emphasis-icon-foreground` | #000000 |
| `--emphasis-type-background` | #00c853 |
| `--emphasis-type-foreground` | #241f16 |
| `--navigation-active-background` | #00c853 |
| `--surface-raised-image` | none |
| `--surface-raised-shadow` | 0 0 0 0 transparent |
| `--surface-recessed-image` | none |
| `--surface-recessed-shadow` | 0 0 0 0 transparent |
| `--space-zero` | 0px |
| `--space-xxs` | 4px |
| `--space-xs` | 8px |
| `--space-s` | 12px |
| `--space-m` | 16px |
| `--space-l` | 24px |
| `--space-xl` | 32px |
| `--space-xxl` | 48px |
| `--tracking-xs` | -0.02em |
| `--tracking-s` | -0.01em |
| `--tracking-m` | 0em |
| `--tracking-l` | 0.01em |
| `--tracking-xl` | 0.02em |
| `--size-xxs` | 10px |
| `--line-xxs` | 14px |
| `--letter-spacing-xxs` | 0.02em |
| `--size-xs` | 12px |
| `--line-xs` | 16px |
| `--letter-spacing-xs` | 0.01em |
| `--size-s` | 14px |
| `--line-s` | 20px |
| `--letter-spacing-s` | 0.01em |
| `--size-m` | 16px |
| `--line-m` | 24px |
| `--letter-spacing-m` | 0em |
| `--size-l` | 24px |
| `--line-l` | 32px |
| `--letter-spacing-l` | -0.01em |
| `--size-xl` | 36px |
| `--line-xl` | 40px |
| `--letter-spacing-xl` | -0.01em |
| `--size-xxl` | 48px |
| `--line-xxl` | 52px |
| `--letter-spacing-xxl` | -0.02em |
| `--radius-zero` | 0px |
| `--radius-xs` | 8px |
| `--radius-s` | 16px |
| `--radius-m` | 22px |
| `--radius-l` | 28px |
| `--radius-xl` | 40px |
| `--radius-full` | 9999px |
| `--border-none` | 0px |
| `--border-s` | 0px |
| `--border-m` | 0px |
| `--border-l` | 0px |
| `--border-default-color` | #413c3233 |
| `--border-shadow-none` | 0 0 0 0 transparent |
| `--border-shadow-s` | 0 0 0 0 transparent |
| `--border-shadow-m` | 0 0 0 0 transparent |
| `--border-shadow-l` | 0 0 0 0 transparent |
| `--font-ui` | "Open Runde", -apple-system, BlinkMacSystemFont, sans-serif |
| `--weight-ui-regular` | 400 |
| `--weight-ui-medium` | 700 |
| `--weight-ui-heavy` | 800 |
| `--font-brand` | "Open Runde", -apple-system, BlinkMacSystemFont, sans-serif |
| `--weight-brand-regular` | 400 |
| `--weight-brand-medium` | 700 |
| `--weight-brand-heavy` | 800 |
| `--font-editorial` | "Open Runde", -apple-system, BlinkMacSystemFont, sans-serif |
| `--weight-editorial-regular` | 400 |
| `--weight-editorial-medium` | 700 |
| `--weight-editorial-heavy` | 800 |
| `--font-data` | "Open Runde", -apple-system, BlinkMacSystemFont, sans-serif |
| `--weight-data-regular` | 400 |
| `--weight-data-medium` | 700 |
| `--weight-data-heavy` | 800 |
| `--color-none` | transparent |
| `--color-1` | #00c853 |
| `--color-1-transparent` | #00c85333 |
| `--color-2` | #07376b |
| `--color-2-transparent` | #07376b33 |
| `--color-3` | #ffb8da |
| `--color-3-transparent` | #ffb8da33 |
| `--color-4` | #b6ebd8 |
| `--color-4-transparent` | #b6ebd833 |
| `--neutral-1` | #000000 |
| `--neutral-1-transparent` | #00000033 |
| `--neutral-2` | #241f16 |
| `--neutral-2-transparent` | #241f1633 |
| `--neutral-3` | #2f2a21 |
| `--neutral-3-transparent` | #2f2a2133 |
| `--neutral-4` | #413c32 |
| `--neutral-4-transparent` | #413c3233 |
| `--neutral-5` | #5b564c |
| `--neutral-5-transparent` | #5b564c33 |
| `--neutral-6` | #888277 |
| `--neutral-6-transparent` | #88827733 |
| `--neutral-7` | #b0aa9e |
| `--neutral-7-transparent` | #b0aa9e33 |
| `--neutral-8` | #d4cec2 |
| `--neutral-8-transparent` | #d4cec233 |
| `--neutral-9` | #f5f4f1 |
| `--neutral-9-transparent` | #f5f4f133 |
| `--neutral-10` | #ffffff |
| `--neutral-10-transparent` | #ffffff33 |
| `--success` | #00c853 |
| `--success-transparent` | #00c85333 |
| `--warning` | #ffea00 |
| `--warning-transparent` | #ffea0033 |
| `--error` | #fc032d |
| `--error-transparent` | #fc032d33 |
| `--shadow-none` | none |
| `--shadow-s` | 0px 2px 4px 0px #00000000 |
| `--shadow-m` | 0px 2px 6px 0px #0000000d, 0px 8px 24px 0px #00000013 |
| `--shadow-l` | 0px 16px 48px 0px #00000000 |
| `--cte-canvas` | #000000 |
| `--cte-surface` | #241f16 |
| `--cte-surface-muted` | #2f2a21 |
| `--cte-text` | #ffffff |
| `--cte-text-muted` | #b0aa9e |
| `--cte-border` | #413c3233 |
| `--cte-accent` | #00c853 |
| `--cte-accent-text` | #241f16 |
| `--cte-danger` | #fc032d |
| `--cte-focus` | #00c853 |
| `--cte-font` | "Open Runde", -apple-system, BlinkMacSystemFont, sans-serif |
| `--cte-font-size` | 14px |
| `--cte-font-weight` | 400 |
| `--cte-line-height` | 20px |
| `--cte-letter-spacing` | 0.01em |
| `--cte-detail-font-size` | 12px |
| `--cte-detail-line-height` | 16px |
| `--cte-detail-letter-spacing` | 0.01em |

## Authored component assignments

These are project edits. The [component reference](untitled-components.md) includes the effective assignments with defaults and shared parts resolved.

```json
{
  "componentTokens": {
    "button:primary:rest": {
      "paddingTop": "s",
      "paddingBottom": "s",
      "paddingX": "l"
    },
    "button:secondary:rest": {
      "paddingTop": "s",
      "paddingBottom": "s",
      "paddingX": "l"
    },
    "button:outline:rest": {
      "paddingTop": "s",
      "paddingBottom": "s",
      "paddingX": "l"
    },
    "button:ghost:rest": {
      "paddingTop": "s",
      "paddingBottom": "s",
      "paddingX": "l"
    },
    "button:danger:rest": {
      "paddingTop": "s",
      "paddingBottom": "s",
      "paddingX": "l"
    },
    "input:default:rest": {
      "background": "neutral-3",
      "paddingTop": "s",
      "paddingBottom": "s",
      "paddingX": "m"
    },
    "select:default:rest": {
      "background": "neutral-3",
      "paddingTop": "s",
      "paddingBottom": "s",
      "paddingX": "m"
    },
    "combobox:default:rest": {
      "background": "neutral-3",
      "paddingTop": "s",
      "paddingBottom": "s",
      "paddingX": "m"
    },
    "autocomplete:default:part:popover:rest": {
      "radius": "s"
    },
    "autocomplete:default:part:input:rest": {
      "paddingTop": "s",
      "paddingRight": "s",
      "paddingBottom": "s",
      "paddingLeft": "s",
      "paddingX": "s"
    },
    "autocomplete:default:part:option:selected": {
      "paddingTop": "xs",
      "paddingRight": "xs",
      "paddingBottom": "xs",
      "paddingLeft": "xs",
      "paddingX": "xs"
    },
    "autocomplete:default:part:option:rest": {
      "paddingTop": "xs",
      "paddingRight": "xs",
      "paddingBottom": "xs",
      "paddingLeft": "xs",
      "paddingX": "xs"
    },
    "checkbox:default:part:control:rest": {
      "controlSize": "l"
    },
    "combobox:default:part:option:selected": {
      "paddingTop": "xs",
      "paddingRight": "xs",
      "paddingBottom": "xs",
      "paddingLeft": "xs",
      "paddingX": "xs"
    },
    "combobox:default:part:option:rest": {
      "paddingTop": "xs",
      "paddingRight": "xs",
      "paddingBottom": "xs",
      "paddingLeft": "xs",
      "paddingX": "xs"
    },
    "menu:default:part:option:selected": {
      "paddingTop": "xs",
      "paddingRight": "xs",
      "paddingBottom": "xs",
      "paddingLeft": "xs",
      "paddingX": "xs"
    },
    "menu:default:part:option:rest": {
      "paddingTop": "xs",
      "paddingRight": "xs",
      "paddingBottom": "xs",
      "paddingLeft": "xs",
      "paddingX": "xs"
    },
    "otp-field:default:part:input:rest": {
      "paddingTop": "xs",
      "paddingRight": "s",
      "paddingBottom": "xs",
      "paddingLeft": "s",
      "paddingX": "s"
    },
    "slider:default:part:track:rest": {
      "controlSize": "xl"
    },
    "slider:default:part:thumb:rest": {
      "controlSize": "l"
    },
    "switch:default:part:control:rest": {
      "controlSize": "xl"
    }
  },
  "componentVariants": {}
}
```
