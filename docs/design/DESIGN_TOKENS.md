# Design Tokens System

Sistema centralizado de design tokens para The Backstage, siguiendo principios SOLID y Clean Architecture.

## 📍 Ubicación

```
domain/types/design-tokens.ts
```

## 🎯 Propósito

**Problema**: Valores hardcodeados esparcidos por toda la aplicación
- `bg-white/90 dark:bg-[#0A0A0A]` repetido en 20+ lugares
- Cambiar un color requiere editar múltiples archivos
- No hay single source of truth
- Difícil mantener consistencia

**Solución**: Design tokens centralizados
- ✅ Single source of truth
- ✅ Fácil de mantener y actualizar
- ✅ Type-safe (TypeScript)
- ✅ Sigue DRY (Don't Repeat Yourself)
- ✅ Sigue SOLID principles

## 🏗️ Arquitectura

```
domain/types/design-tokens.ts (Domain Layer)
    ↓
components/ (Presentation Layer)
    ↓
Browser (Visual Output)
```

**Clean Architecture**: Los tokens están en el domain layer, componentes dependen de ellos (Dependency Inversion Principle).

## 📦 Tokens Disponibles

### 1. **CARD_STYLES** - Cards y Contenedores

```tsx
import { CARD_STYLES, cn } from '@/domain/types/design-tokens';

<div className={cn(
  CARD_STYLES.base,
  CARD_STYLES.background.default,
  CARD_STYLES.border.default,
  CARD_STYLES.padding.md
)}>
  Card content
</div>
```

**Variaciones**:
- `background.default` - `bg-white/90 dark:bg-[#0A0A0A]`
- `background.solid` - `bg-white dark:bg-[#0A0A0A]`
- `background.subtle` - `bg-white/60 dark:bg-[#0A0A0A]/60`
- `border.default` - `border border-black/5 dark:border-white/10`
- `padding.sm/md/lg` - `p-4 / p-6 / p-8`

### 2. **INPUT_STYLES** - Inputs y Forms

```tsx
import { INPUT_STYLES, cn } from '@/domain/types/design-tokens';

<input
  className={cn(
    INPUT_STYLES.base,
    INPUT_STYLES.appearance,
    INPUT_STYLES.focus,
    INPUT_STYLES.focusColors.primary,
    INPUT_STYLES.text
  )}
/>
```

**Variaciones**:
- `base` - Tamaño y padding base
- `appearance` - Background y bordes
- `focus` - Estados de focus
- `focusColors.primary` - Ring color (accent)
- `focusColors.soundcloud` - Ring color (SoundCloud brand)
- `text` - Colores de texto y placeholder
- `disabled` - Estado disabled

### 3. **BUTTON_STYLES** - Botones

```tsx
import { BUTTON_STYLES, cn } from '@/domain/types/design-tokens';

<button className={cn(
  BUTTON_STYLES.base,
  BUTTON_STYLES.size.md,
  BUTTON_STYLES.variant.primary
)}>
  Save Changes
</button>
```

**Variantes**:
- `variant.primary` - Acción primaria (brand color)
- `variant.secondary` - Acción secundaria (subtle)
- `variant.danger` - Acción destructiva (rojo)
- `variant.ghost` - Sin background

**Tamaños**:
- `size.xs` - `h-8 px-3 text-xs`
- `size.sm` - `h-9 px-4 text-xs`
- `size.md` - `h-10 px-6 text-sm`
- `size.lg` - `h-12 px-8 text-base`

### 4. **TEXT_STYLES** - Tipografía

```tsx
import { TEXT_STYLES } from '@/domain/types/design-tokens';

<h1 className={TEXT_STYLES.heading.h1}>Title</h1>
<p className={TEXT_STYLES.body.base}>Body text</p>
<label className={TEXT_STYLES.label.small}>LABEL</label>
```

### 5. **LAYOUT_STYLES** - Layout y Spacing

```tsx
import { LAYOUT_STYLES } from '@/domain/types/design-tokens';

<div className={LAYOUT_STYLES.page}>
  <main className={LAYOUT_STYLES.container.md}>
    <form className={LAYOUT_STYLES.spacing.section}>
      {/* content */}
    </form>
  </main>
</div>
```

### 6. **THEME_TOGGLE_STYLES** - Theme Switcher

```tsx
import { THEME_TOGGLE_STYLES, cn } from '@/domain/types/design-tokens';

<div className={THEME_TOGGLE_STYLES.container}>
  <button className={cn(
    THEME_TOGGLE_STYLES.button,
    isActive ? THEME_TOGGLE_STYLES.active : THEME_TOGGLE_STYLES.inactive
  )}>
    Theme
  </button>
</div>
```

## 🔧 Utility: `cn()` Function

Combina clases de forma limpia:

```tsx
import { cn } from '@/domain/types/design-tokens';

// Sin cn()
<div className={`${CARD_STYLES.base} ${CARD_STYLES.background.default} ${CARD_STYLES.border.default}`}>

// Con cn() ✅
<div className={cn(
  CARD_STYLES.base,
  CARD_STYLES.background.default,
  CARD_STYLES.border.default,
  someCondition && 'extra-class'
)}>
```

**Ventajas**:
- Filtra `undefined` y `false`
- Más legible
- Type-safe

## 📝 Ejemplo Completo: Form Card

```tsx
import {
  CARD_STYLES,
  INPUT_STYLES,
  BUTTON_STYLES,
  TEXT_STYLES,
  LAYOUT_STYLES,
  cn
} from '@/domain/types/design-tokens';

export function SettingsCard() {
  return (
    <div className={cn(
      CARD_STYLES.base,
      CARD_STYLES.background.default,
      CARD_STYLES.border.default,
      CARD_STYLES.padding.md
    )}>
      <h2 className={TEXT_STYLES.heading.h2}>
        Personal Information
      </h2>
      <p className={TEXT_STYLES.body.subtle}>
        Manage your account details
      </p>

      <form className={LAYOUT_STYLES.spacing.section}>
        <div className={LAYOUT_STYLES.spacing.stack}>
          <label className={TEXT_STYLES.label.small}>
            FULL NAME
          </label>
          <input
            type="text"
            className={cn(
              INPUT_STYLES.base,
              INPUT_STYLES.appearance,
              INPUT_STYLES.focus,
              INPUT_STYLES.focusColors.primary,
              INPUT_STYLES.text
            )}
            placeholder="John Doe"
          />
        </div>

        <button className={cn(
          BUTTON_STYLES.base,
          BUTTON_STYLES.size.md,
          BUTTON_STYLES.variant.primary
        )}>
          Save Changes
        </button>
      </form>
    </div>
  );
}
```

## 🎨 Cómo Cambiar Colores Globalmente

Para cambiar un color en toda la aplicación:

**Antes** (sin design tokens):
```tsx
// Necesitas cambiar en 20+ archivos
className="bg-white/90 dark:bg-[#0A0A0A]"
```

**Ahora** (con design tokens):
```tsx
// 1. Edita domain/types/design-tokens.ts
export const CARD_STYLES = {
  background: {
    default: 'bg-white/95 dark:bg-[#1A1A1A]', // ← Cambio aquí
  },
}

// 2. Todos los componentes se actualizan automáticamente ✅
```

## ✅ Beneficios

### SOLID Compliance

1. **Single Responsibility**: Cada token group tiene un propósito único
2. **Open/Closed**: Fácil extender sin modificar existente
3. **Liskov Substitution**: Tokens son intercambiables
4. **Interface Segregation**: Tokens específicos, no genéricos
5. **Dependency Inversion**: Componentes dependen de abstracciones

### DRY (Don't Repeat Yourself)

- ✅ Un solo lugar para definir estilos
- ✅ Sin duplicación de valores
- ✅ Actualizaciones centralizadas

### Type Safety

```tsx
// TypeScript autocomplete ✅
CARD_STYLES.background.  // → default, solid, subtle

// Error si usas valor incorrecto ❌
CARD_STYLES.background.invalid // → Error de compilación
```

### Mantenibilidad

- ✅ Fácil encontrar dónde cambiar valores
- ✅ Cambios globales en segundos
- ✅ Sin búsqueda manual en archivos

## 🔄 Migración Gradual

No necesitas refactorizar todo de una vez:

```tsx
// Antes
<div className="bg-white/90 dark:bg-[#0A0A0A] border border-black/5 dark:border-white/10">

// Durante migración (mixto está OK)
<div className={cn(
  CARD_STYLES.background.default,
  CARD_STYLES.border.default,
  "rounded-2xl p-6" // ← Hardcoded temporal
)}>

// Después (completamente con tokens)
<div className={cn(
  CARD_STYLES.base,
  CARD_STYLES.background.default,
  CARD_STYLES.border.default,
  CARD_STYLES.padding.md
)}>
```

## 📚 Referencias

- **Archivo**: `domain/types/design-tokens.ts`
- **Ejemplo**: `app/settings/ThemeSwitcher.tsx` (ya migrado)
- **Documentación Tailwind**: https://tailwindcss.com/docs

---

**Última actualización**: 2026-01-09
**Estado**: ✅ Sistema implementado y funcionando
**Next steps**: Migrar componentes existentes gradualmente
