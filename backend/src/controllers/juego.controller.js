const { Op } = require('sequelize');
const Juego = require('../models/juego.model'); 
const igdbService = require('../services/igdb.service'); //servicio de API externa

const juegoCtrl = {}; // Objeto para guardar funciones

// Obtener TODOS los juegos de nuestra base local (GET)
juegoCtrl.getJuegos = async (req, res) => {
    try {
        const juegos = await Juego.findAll(); 
        res.json(juegos);
    } catch (error) {
        res.status(500).json({ status: '0', msg: 'Error al obtener los juegos.' });
    }
};

juegoCtrl.getTest= async(req, res)=>{
    try {
        const { id } = req.params;
        const resultado = await igdbService.testGame(id);
        if (!resultado) {
            return res.status(404).json({ status: '0', msg: `Juego con id ${id} no encontrado en IGDB.` });
        }
        res.json(resultado);
    } catch (error) {
        console.error(`Error en getTest con id ${id}:`, error.message);
        res.status(500).json({ status: '0', msg: 'Error en obtener detalles extensos', error: error.message });
    }
}

// variables fuera del controlador para que persistan en memoria mientras el servidor corre
let cachePopulares = null;
let ultimaActualizacion = null;

juegoCtrl.getMasJugados = async (req, res) => {
    try {
        const ahora = new Date();
        
        // buscamos si en cache existe y si tiene menos de 24 horas (86400000 ms)
        if (cachePopulares && ultimaActualizacion && (ahora - ultimaActualizacion < 86400000)) {
            console.log('Sirviendo desde cache en memoria...');
            return res.json({ status: '1', data: cachePopulares });
        }

        // Si no hay cache o pasaron mas de 24 horas hacemos peticion
        console.log('Actualizando cache de "Mas Jugados" desde IGDB...');
        const juegos = await igdbService.obtenerMasJugados();
        
        // guardamos
        cachePopulares = juegos;
        ultimaActualizacion = ahora;

        res.json({ status: '1', data: juegos });
    } catch (error) {
        res.status(500).json({ status: '0', msg: 'Error al obtener los más jugados.' });
    }
};

juegoCtrl.getSugerencias = async (req, res) => {
    try {
        const { nombre } = req.params;
        // llamamos a buscarJuegos
        const resultados = await igdbService.buscarJuegos(nombre); 
        res.json({ status: '1', data: resultados });
    } catch (error) {
        res.status(500).json({ status: '0', msg: 'Error en sugerencias' });
    }
};

// Obtener el detalle completo de un juego y cachearlo
juegoCtrl.getDetalleJuego = async (req, res) => {
    try {
        const { id } = req.params;
        const juegoId = parseInt(id, 10); // convertimos el id en integer y base 10

        // buscamos primero en nuestra BD
        let juegoLocal = await Juego.findByPk(juegoId);

        if (juegoLocal) {
            console.log('⚡ Cache Hit: Juego cargado desde PostgreSQL');
            return res.json({ status: '1', data: juegoLocal });
        }

        // no esta local, consultamos a IGDB
        console.log('🌐 Cache Miss: Juego no encontrado en local, solicitando a IGDB...');
        const detalleCompleto = await igdbService.obtenerDetallePorId(juegoId);

        if (!detalleCompleto) {
            return res.status(404).json({ status: '0', msg: 'Juego no encontrado en IGDB.' });
        }

        // guardamos el juego para ahorrar token si se busca el mismo juego
        const juegoNuevo = await Juego.create({
            id: detalleCompleto.id,
            titulo: detalleCompleto.titulo,
            descripcion: detalleCompleto.descripcion,
            imagen_portada: detalleCompleto.imagen_portada,
            plataformas: detalleCompleto.plataformas,
            generos: detalleCompleto.generos,
            trailer_id: detalleCompleto.trailer_id,
            fecha_lanzamiento: detalleCompleto.fecha_lanzamiento,
            calificacion: detalleCompleto.calificacion,
            desarrolladora: detalleCompleto.desarrolladora,
            capturas: detalleCompleto.capturas,
            juegos_similares: detalleCompleto.juegos_similares,
            dlcs: detalleCompleto.dlcs,
            expansiones: detalleCompleto.expansiones,
            saga: detalleCompleto.saga
        });

        //lo mandamos al Frontend
        res.json({ status: '1', data: juegoNuevo });

    } catch (error) {
        console.error('Error en getDetalleJuego:', error);
        res.status(500).json({ status: '0', msg: 'Error procesando el detalle del juego.' });
    }
};

module.exports = juegoCtrl;