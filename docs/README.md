# 📚 Documentación - Backstage

Documentación completa del proyecto de email automation para notificaciones de SoundCloud.

---

## 🗂️ Estructura

### 🏗️ [Architecture](./architecture/)
Documentación de arquitectura y patrones de diseño.

- **[Clean Architecture](./architecture/CLEAN_ARCHITECTURE.md)** - Implementación completa de Clean Architecture + SOLID
- **[Refactoring Summary](./architecture/REFACTORING_SUMMARY.md)** - Resumen de todas las refactorizaciones aplicadas

### 🔄 [Refactoring](./refactoring/)
Documentación de procesos de refactoring.

- **[Refactor Plan](./refactoring/REFACTOR_PLAN.md)** - Planificación de refactorings
- **[Refactor Complete](./refactoring/REFACTOR_COMPLETE.md)** - Refactorings completados
- **[Refactor Summary](./refactoring/REFACTOR_SUMMARY.md)** - Resumen de refactorings
- **[Canonical Patterns](./refactoring/CANONICAL_PATTERNS.md)** - Patrones canónicos del proyecto

### 💻 [Implementation](./implementation/)
Documentación de implementaciones específicas.

- **[Implementation Summary](./implementation/IMPLEMENTATION_SUMMARY.md)** - Resumen de implementaciones
- **[Error Type Refactor Summary](./implementation/ERROR_TYPE_REFACTOR_SUMMARY.md)** - Refactor de tipos de error
- **[Verification Report](./implementation/VERIFICATION_REPORT.md)** - Reportes de verificación

### ⚙️ [Setup](./setup/)
Guías de configuración e instalación.

- **[Setup Neon](./setup/SETUP-NEON.md)** - Configuración de base de datos Neon PostgreSQL
- **[Setup Resend](./setup/SETUP-RESEND.md)** - Configuración del servicio de email Resend
- **[Deploy Vercel](./setup/DEPLOY-VERCEL.md)** - Despliegue en Vercel con cron jobs
- **[Crear API Key](./setup/CREAR-API-KEY.md)** - Generación de API keys
- **[Webhook Security](./setup/WEBHOOK-SECURITY.md)** - Seguridad de webhooks

### ✨ [Features](./features/)
Documentación de funcionalidades implementadas.

- **[Download Gates (Backend)](./features/BACKEND_DOWNLOAD_GATES_COMPLETE.md)** - Backend de download gates
- **[Download Gates (Frontend)](./features/FRONTEND_DOWNLOAD_GATES.md)** - Frontend de download gates
- **[Download Gate Plan](./features/DOWNLOAD_GATE_PLAN.md)** - Plan de download gates
- **[Email Template System](./features/EMAIL_TEMPLATE_SYSTEM.md)** - Sistema de templates de email
- **[Email Template Implementation](./features/EMAIL_TEMPLATE_SYSTEM_IMPLEMENTATION.md)** - Implementación detallada
- **[Unsubscribe Improvements](./features/UNSUBSCRIBE_IMPROVEMENTS.md)** - Sistema de unsubscribe con GDPR compliance

### 🔌 [Integrations](./integrations/)
Integraciones con servicios externos.

- **[Brevo Integration Summary](./integrations/BREVO-INTEGRATION-SUMMARY.md)** - Integración con Brevo
- **[Integration Analysis](./integrations/INTEGRATION_ANALYSIS.md)** - Análisis de integraciones

### 🏗️ [Infrastructure](./infrastructure/)
Documentación de infraestructura.

- **[Connection Pooling Summary](./infrastructure/CONNECTION_POOLING_SUMMARY.md)** - Gestión de pool de conexiones
- **[Rate Limiting Setup](./infrastructure/RATE_LIMITING_SETUP.md)** - Configuración de rate limiting
- **[Rate Limiting Testing](./infrastructure/RATE_LIMITING_TESTING.md)** - Testing de rate limiting
- **[Transaction Management](./infrastructure/TRANSACTION_MANAGEMENT.md)** - Gestión de transacciones
- **[Environment Validation](./infrastructure/ENVIRONMENT_VALIDATION.md)** - Validación de entorno
- **[Error Handling](./infrastructure/ERROR_HANDLING.md)** - Manejo de errores

### 📊 [Monitoring](./monitoring/)
Monitoreo y observabilidad.

- **[Sentry Setup](./monitoring/SENTRY_SETUP.md)** - Configuración de Sentry
- **[Sentry Implementation Summary](./monitoring/SENTRY_IMPLEMENTATION_SUMMARY.md)** - Implementación de Sentry
- **[Sentry Quick Start](./monitoring/SENTRY_QUICK_START.md)** - Quick start de Sentry

### 🔧 [Operations](./operations/)
Documentación operacional y mantenimiento.

- **[Monitoring Queries](./operations/MONITORING_QUERIES.md)** - Queries SQL para monitoreo
- **[Manual Replicar DJ](./operations/MANUAL-REPLICAR-OTRO-DJ.md)** - Guía para replicar setup para otro DJ

### ✅ [Testing](./testing/)
Documentación de testing.

- **[Admin Testing Guide](./testing/ADMIN_TESTING_GUIDE.md)** - Guía de testing de admin
- **[Admin Testing Checklist](./testing/ADMIN_TESTING_CHECKLIST.md)** - Checklist de testing

---

## 🚀 Quick Start

Para empezar rápidamente:

1. Lee **[Setup Neon](./setup/SETUP-NEON.md)** para configurar la base de datos
2. Lee **[Setup Resend](./setup/SETUP-RESEND.md)** para configurar el email
3. Lee **[Deploy Vercel](./setup/DEPLOY-VERCEL.md)** para hacer el deployment
4. Revisa **[Clean Architecture](./architecture/CLEAN_ARCHITECTURE.md)** para entender la estructura del código

---

## 📖 Documentación Adicional

### Proyecto
- **[README.md](../README.md)** - README principal del proyecto
- **[.claude/CLAUDE.md](../.claude/CLAUDE.md)** - Estándares de código SOLID + Clean Code

### Skills (Claude)
- **[Skills README](../.claude/skills/README.md)** - Skills disponibles para Claude
- **[Domain Entities](../.claude/skills/domain-entities.md)** - Skill para entidades de dominio

---

## 🎯 Documentos por Caso de Uso

### Quiero entender la arquitectura
→ [Architecture](./architecture/) + [Clean Architecture](./architecture/CLEAN_ARCHITECTURE.md)

### Quiero hacer un nuevo deployment
→ [Setup](./setup/) + [Deploy Vercel](./setup/DEPLOY-VERCEL.md)

### Quiero implementar una nueva feature
→ [Clean Architecture](./architecture/CLEAN_ARCHITECTURE.md) + [Features](./features/)

### Quiero configurar monitoreo
→ [Monitoring](./monitoring/) + [Sentry Quick Start](./monitoring/SENTRY_QUICK_START.md)

### Quiero monitorear el sistema
→ [Monitoring Queries](./operations/MONITORING_QUERIES.md)

### Quiero replicar esto para otro artista
→ [Manual Replicar DJ](./operations/MANUAL-REPLICAR-OTRO-DJ.md)

### Quiero hacer un refactoring
→ [Refactoring](./refactoring/) + [Canonical Patterns](./refactoring/CANONICAL_PATTERNS.md)

---

## 📊 Resumen del Sistema

**Stack**:
- Next.js 16+ (App Router + Turbopack)
- PostgreSQL (Neon)
- Resend (Email)
- Vercel (Hosting + Cron)
- Sentry (Monitoring)

**Arquitectura**:
- Clean Architecture
- SOLID Principles
- Repository Pattern
- Use Case Pattern
- Dependency Injection

**Features**:
- Email automation para tracks de SoundCloud
- Download Gates con integración Spotify/SoundCloud
- Sistema de unsubscribe GDPR-compliant
- Sistema de templates de email
- Webhook processing (Resend, Brevo)
- Analytics de email y download gates
- Consent history tracking
- Admin dashboard para gestión de usuarios

**Infraestructura**:
- Connection pooling optimizado
- Rate limiting
- Transaction management
- Error handling robusto
- Monitoreo con Sentry

---

**Última actualización**: 2025-12-30
