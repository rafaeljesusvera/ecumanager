# Legacy

Este directorio contiene el **prototipo original** de Equmanager: un único archivo HTML que sirve React + Tailwind por CDN, compila JSX en el navegador con Babel y persiste datos en Supabase.

## ¿Por qué sigue aquí?

Mientras avanza la migración al monorepo profesional ([ver README raíz](../README.md)), este prototipo sigue **operativo** para no romper el servicio. Es la versión que actualmente atienden los clubes.

## Cómo se usa

Abre `equmanager.html` directamente en un navegador o sírvelo con cualquier servidor estático:

```bash
npx serve legacy
# o
python3 -m http.server -d legacy 8080
```

## ¿Cuándo se retira?

Cuando el panel web (`apps/web`) cubra **todas** las funcionalidades del prototipo. Se retirará en un PR explícito con changelog.

## Estado de paridad funcional

Comparativa actualizada con el panel nuevo:

| Funcionalidad | Legacy | apps/web |
|---|:---:|:---:|
| Login | Código de club (sin auth) | ✅ Email + password |
| Listado de caballos | ✅ | ✅ |
| Alta / edición de caballos | ✅ | ⏳ |
| Listado de jinetes | ✅ | ✅ |
| Alta / edición de jinetes | ✅ | ⏳ |
| Gestión de clases | ✅ | ⏳ |
| Insignias | ✅ | ⏳ |
| Subida de fotos | ✅ | ⏳ |
| Sincronización tiempo real | ⚠️ Polling | ⏳ Subscriptions |
