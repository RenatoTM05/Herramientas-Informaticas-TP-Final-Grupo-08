/**
 * Configuración de Vitest para ejecución en entorno CI/CD (HU-12)
 *
 * Este archivo complementa la configuración base de Angular (@angular/build:unit-test).
 * Fuerza el modo "run" (una sola ejecución sin watcher) y el provider del navegador
 * en modo headless, lo que permite a GitHub Actions ejecutar las pruebas sin pantalla.
 *
 * El script "test:ci" del package.json invoca: ng test --no-progress
 * que a su vez usa @angular/build:unit-test, que respeta esta configuración.
 */
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Ejecutar una sola vez (no watch): requerido en entornos CI sin TTY
    watch: false,

    // Reporte legible en logs de GitHub Actions
    reporter: ['verbose'],
  },
});
