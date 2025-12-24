# Test Data for Contact Import

Este directorio contiene archivos de prueba para testear la funcionalidad de importación de contactos.

## Archivos Disponibles

### 1. `contacts-sample.csv`
**Propósito**: Prueba completa con múltiples escenarios

**Contenido**:
- 14 filas totales
- Columnas: email, name, subscribed, country, source
- **Casos de prueba**:
  - ✅ Emails válidos con diferentes dominios
  - ✅ Diferentes formatos de subscribed (true, yes, 1, active, false, no, 0, inactive, subscribed)
  - ✅ Metadata adicional (country, source)
  - ❌ Email inválido (sin @)
  - ❌ Email vacío
  - ❌ Emails duplicados

**Resultado esperado**:
- 10 contactos insertados exitosamente
- 4 errores (email inválido, email vacío, 2 duplicados)

---

### 2. `contacts-simple.csv`
**Propósito**: Prueba básica con solo email y nombre

**Contenido**:
- 4 filas
- Columnas: email, name
- Todos subscribed por defecto (sin columna)

**Resultado esperado**:
- 4 contactos insertados
- Todos con subscribed = true
- 0 errores

---

### 3. `contacts-sample.json`
**Propósito**: Prueba de importación JSON

**Contenido**:
- 4 contactos
- Diferentes estructuras (con/sin nombre, con/sin metadata)
- Subscribed con valores true/false

**Resultado esperado**:
- 4 contactos insertados
- Metadata (country, campaign) guardada como JSONB
- 0 errores

---

## Cómo Probar

### Prueba 1: CSV Completo
1. Abre la aplicación en `/dashboard`
2. Ve a la sección Contacts
3. Click en "Import"
4. Arrastra `contacts-sample.csv`
5. **Verifica auto-detección**:
   - Email → email (confianza alta)
   - Name → name (confianza alta)
   - Subscribed → subscribed (confianza alta)
6. Selecciona "country" y "source" como metadata
7. Preview debe mostrar 14 filas
8. Importar
9. **Resultado esperado**: 10 inserted, 0 updated, 4 skipped

### Prueba 2: CSV Simple
1. Importa `contacts-simple.csv`
2. **Verifica**: Solo email y name detectados
3. No hay columna subscribed → todos default a true
4. **Resultado esperado**: 4 inserted, 0 updated, 0 skipped

### Prueba 3: JSON
1. Importa `contacts-sample.json`
2. Detecta estructuras JSON
3. **Resultado esperado**: 4 inserted, 0 updated, 0 skipped

### Prueba 4: Deduplicación
1. Importa `contacts-simple.csv` (4 contactos nuevos)
2. Re-importa `contacts-simple.csv` otra vez
3. **Resultado esperado**: 0 inserted, 4 updated, 0 skipped
4. Verifica que los nombres se actualizaron si cambiaste el CSV

---

## Escenarios de Error

El archivo `contacts-sample.csv` incluye:

1. **Fila 11**: `invalid-email` → Error: "Invalid email format"
2. **Fila 12**: Email vacío → Error: "Email is required"
3. **Filas 13-14**: Duplicados → Solo se importa el último

---

## Auto-Detección Esperada

### CSV con headers
```csv
email,name,subscribed
```
- ✅ Email: Confianza 95% (match exacto + tiene @)
- ✅ Name: Confianza 80% (match exacto)
- ✅ Subscribed: Confianza 90% (match exacto + valores booleanos)

### CSV con headers alternativos
```csv
e-mail,full name,status
```
- ✅ Email: Confianza 70-85% (match parcial)
- ✅ Name: Confianza 65% (match parcial)
- ✅ Subscribed: Confianza 75% (match parcial)

---

## Notas

- **Duplicados**: Se determina por `(user_id, email)` en la base de datos
- **Metadata**: Cualquier columna no mapeada se guarda como JSONB
- **Subscribed**: Acepta múltiples formatos (true, yes, y, 1, active, subscribed)
- **Unsubscribed**: Acepta (false, no, n, 0, inactive, unsubscribed)
- **Default**: Si no hay columna subscribed, todos = true
