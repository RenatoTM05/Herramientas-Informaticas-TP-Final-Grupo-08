/**
 * Suite de pruebas unitarias - Middleware sanitizeInput (HU-12 CI/CD)
 * Motor: Node.js built-in Test Runner (node:test) + assert nativo
 * No requiere dependencias externas ni conexión a base de datos.
 *
 * Ejecutar con: npm test
 */

'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

// Importar el middleware bajo prueba
const sanitizeInput = require('../src/middlewares/sanitize.middleware');

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Crea un objeto request de Express simulado (sin dependencias de HTTP).
 * @param {object} options - Propiedades opcionales: body, query, params.
 */
function buildReq({ body = {}, query = {}, params = {} } = {}) {
  return { body, query, params };
}

/**
 * Ejecuta el middleware de forma síncrona y retorna el req modificado.
 * Si el middleware llama a next() con un error, lanza la excepción.
 */
function runMiddleware(req) {
  let nextError = null;
  sanitizeInput(req, {}, (err) => {
    if (err) nextError = err;
  });
  if (nextError) throw nextError;
  return req;
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('sanitizeInput middleware', () => {

  describe('req.body', () => {

    it('debe eliminar una etiqueta <script> del body (prevención XSS básico)', () => {
      const req = buildReq({ body: { comentario: '<script>alert("xss")</script>' } });
      runMiddleware(req);
      assert.equal(req.body.comentario, '');
    });

    it('debe recortar espacios en blanco al inicio y al final de un string del body', () => {
      const req = buildReq({ body: { titulo: '  Halo Infinite  ' } });
      runMiddleware(req);
      assert.equal(req.body.titulo, 'Halo Infinite');
    });

    it('debe preservar texto limpio sin modificarlo', () => {
      const req = buildReq({ body: { titulo: 'God of War: Ragnarök', calificacion: 97 } });
      runMiddleware(req);
      assert.equal(req.body.titulo, 'God of War: Ragnarök');
      assert.equal(req.body.calificacion, 97); // número: no debe tocarse
    });

    it('debe neutralizar atributo onerror en etiqueta img (XSS por atributo)', () => {
      const req = buildReq({ body: { reseña: '<img src=x onerror=alert(1)>' } });
      runMiddleware(req);
      assert.ok(
        !req.body.reseña.includes('onerror'),
        'El atributo onerror no debe estar presente tras la sanitización'
      );
    });

    it('no debe fallar si body está vacío', () => {
      const req = buildReq({ body: {} });
      assert.doesNotThrow(() => runMiddleware(req));
    });
  });

  describe('req.query', () => {

    it('debe sanitizar y recortar strings en query params', () => {
      const req = buildReq({ query: { busqueda: '  <b>juego</b>  ' } });
      runMiddleware(req);
      assert.ok(!req.query.busqueda.startsWith(' '), 'No debe tener espacio al inicio');
    });

    it('no debe fallar si query está vacío', () => {
      const req = buildReq({ query: {} });
      assert.doesNotThrow(() => runMiddleware(req));
    });
  });

  describe('req.params', () => {

    it('debe sanitizar params de ruta', () => {
      const req = buildReq({ params: { id: '<script>1</script>' } });
      runMiddleware(req);
      assert.equal(req.params.id, '1');
    });

    it('no debe fallar si params está vacío', () => {
      const req = buildReq({ params: {} });
      assert.doesNotThrow(() => runMiddleware(req));
    });
  });

  describe('flujo de control', () => {

    it('debe invocar next() exactamente una vez (flujo continúa al siguiente middleware)', () => {
      let callCount = 0;
      const req = buildReq({ body: { x: 'texto' } });
      sanitizeInput(req, {}, () => { callCount++; });
      assert.equal(callCount, 1, 'next() debe llamarse exactamente una vez');
    });
  });
});
