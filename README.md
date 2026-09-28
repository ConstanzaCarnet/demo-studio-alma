# Studio Alma — Demo de reservas + asistente IA

Demo comercial para negocios de belleza (peluquería, estética, spa, manicuría, barbería): página pública con servicios y equipo, reserva online con disponibilidad real, asistente "Alma" y panel administrativo en `/admin`.

## Ejecutar

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # typecheck + build de producción en dist/
```

No necesita backend: los datos se guardan en `localStorage`. El sitio público y el panel se sincronizan entre pestañas. Para volver a los datos iniciales: **Admin → Configuración → Restablecer datos demo**.

## Publicar

- **Vercel:** importar el repositorio en vercel.com (detecta Vite solo). `vercel.json` ya resuelve las rutas `/admin` y `/reservar`.
- **GitHub Pages:** en el repo, *Settings → Pages → Source: GitHub Actions*. Cada push a `main` publica en `https://<usuario>.github.io/<repo>/`.

## Guion de la demo (2–5 min)

1. Página pública: hero, servicios con precio y duración, equipo.
2. **Reservar turno** → servicio → profesional → fecha → horario → datos → confirmar.
3. Confirmación: agregar al calendario (.ics) / enviar por WhatsApp.
4. Abrir **✨ Asistente** y probar: *"Quiero hacerme las uñas esta semana"* → *"Sí"* → elegir día y horario.
5. Ir a `/admin`: el turno recién creado aparece en el dashboard y en la agenda.

## Estructura

| Carpeta | Contenido |
|---|---|
| `src/data` | Configuración del negocio (`business.ts`) y datos semilla. Para adaptar la demo a otro local se cambia esto. |
| `src/domain` | Tipos del dominio. |
| `src/services` | Store, **motor de disponibilidad** (única fuente de verdad), reservas, acciones del admin y estadísticas. |
| `src/ai` | `AIService` (`ask(message, context)`), proveedor demo basado en reglas + datos reales, y `RemoteAIProvider` para un LLM real. |
| `src/components`, `src/pages` | UI (sitio público, flujo de reserva, panel admin). |

La disponibilidad tiene en cuenta el horario del negocio y del profesional, los descansos, los feriados, la duración del servicio, los turnos existentes y la anticipación mínima. Antes de guardar, `createBooking` vuelve a verificar el horario, así que no puede haber doble reserva, venga el pedido del formulario o del asistente.

## Conectar una IA real

El asistente nunca reserva por su cuenta: sólo ofrece horarios que devolvió el motor de disponibilidad. Para usar un proveedor real (OpenAI, Gemini, etc.), implementá un endpoint propio (la API key no va en el navegador) que use las herramientas de `src/ai/tools.ts` y devuelva un `AIResponse`. Después configurá:

```
VITE_AI_PROVIDER=remote
VITE_AI_ENDPOINT=/api/assistant
```

Los precios, profesionales, clientes y turnos son **datos ficticios de demostración**.
