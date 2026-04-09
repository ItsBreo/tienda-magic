# Stripe Testing en Local - Tienda Magic

## Introducción

Tienda Magic utiliza **Stripe Webhooks** para sincronizar la base de datos local con los eventos de pago. Cuando un cliente completa una compra, Stripe envía un webhook a nuestra aplicación para confirmar el pago y actualizar el estado del pedido automáticamente.

Este documento explica cómo configurar tu entorno local para probar la pasarela de pagos de Stripe en menos de 5 minutos.

## Paso 0: Instalación de Stripe CLI

Es necesario instalar **Stripe CLI** para simular webhooks de pago en tu entorno local.

### Opción A: Manual (Recomendada para todos)

1. Ve a los releases de GitHub: https://github.com/stripe/stripe-cli/releases/latest
2. Descarga el archivo `.zip` correspondiente a Windows
3. Extrae el `stripe.exe` y arrástralo a la raíz del proyecto
4. **Importante**: `stripe.exe` está ignorado en `.gitignore`, no se subirá al repositorio

### Opción B: Avanzada (Usuarios experimentados)

**Windows con Scoop:**
```bash
scoop install stripe
```

**Mac con Homebrew:**
```bash
brew install stripe/stripe-cli/stripe
```

## Paso 1: Actualizar el Entorno

Asegúrate de tener la última versión del proyecto y todas las dependencias:

```bash
git pull
composer install
npm install
php artisan migrate
```

## Paso 2: Túnel de Webhooks

Inicia el túnel para que Stripe pueda enviar webhooks a tu aplicación local:

```bash
./stripe login
```

Te abrirá una ventana del navegador para autenticarte con tu cuenta de Stripe.

Luego, inicia el listener de webhooks:

```bash
./stripe listen --forward-to http://127.0.0.1:8000/api/stripe/webhook
```

**Importante:** Esta terminal debe permanecer abierta durante toda la sesión de pruebas. Si la cierras, los webhooks no llegarán a tu aplicación.

La terminal te mostrará un webhook secret que necesitarás en el siguiente paso.

## Paso 3: Variables de Entorno

Configura las siguientes variables en tu archivo `.env`:

```env
STRIPE_KEY=pk_test_...
STRIPE_SECRET=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

- `STRIPE_KEY`: Tu clave publicable de prueba
- `STRIPE_SECRET`: Tu clave secreta de prueba  
- `STRIPE_WEBHOOK_SECRET`: El valor `whsec_...` que te devolvió la terminal del paso anterior

## Paso 4: Tarjetas Mágicas de Prueba

Usa estas tarjetas de prueba para simular diferentes escenarios de pago:

| Propósito | Número de Tarjeta | Fecha | CVC | Resultado |
|-----------|-------------------|-------|-----|-----------|
| **Éxito** | 4242 4242 4242 4242 | Cualquier fecha futura | Cualquier código de 3 dígitos | ✅ Pago exitoso |
| **Fondos insuficientes** | 4000 0000 0000 9995 | Cualquier fecha futura | Cualquier código de 3 dígitos | ❌ Pago rechazado |
| **CVC incorrecto** | 4000 0000 0000 0127 | Cualquier fecha futura | Cualquier código incorrecto | ❌ Pago rechazado |

## Paso 5: Flujo de Validación

Sigue estos pasos para validar que todo funciona correctamente:

1. **Inicia el backend:**
   ```bash
   php artisan serve
   ```

2. **Inicia el frontend:**
   ```bash
   npm run dev
   ```

3. **Asegúrate de que el túnel de Stripe está activo** (Paso 2)

4. **Realiza una compra de prueba:**
   - Añade productos al carrito
   - Procede al checkout
   - Usa la tarjeta **4242 4242 4242 4242** para un pago exitoso

5. **Verifica el resultado:**
   - El pago debe completarse exitosamente
   - En la terminal de Stripe CLI deberías ver el webhook recibido
   - En la base de datos, el estado del pedido debe cambiarse automáticamente
   - Recibirás un email de confirmación (si está configurado)

## Troubleshooting

### Webhook no llega
- Verifica que la terminal de `stripe listen` esté activa
- Confirma que tu aplicación Laravel esté corriendo en `http://127.0.0.1:8000`
- Revisa que `STRIPE_WEBHOOK_SECRET` sea correcto

### Pago rechazado inesperadamente
- Usa únicamente las tarjetas de prueba listadas arriba
- Verifica que estés usando el modo de prueba (claves `pk_test_` y `sk_test_`)

### Base de datos no se actualiza
- Revisa los logs de Laravel: `php artisan log:tail`
- Verifica que el endpoint `/api/stripe/webhook` esté accesible

---

**Tiempo estimado de configuración:** 3-5 minutos

**Soporte:** Si tienes problemas, contacta al equipo de desarrollo
