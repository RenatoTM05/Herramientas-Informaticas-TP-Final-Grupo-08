require('dotenv').config();
const axios = require('axios');
const { translate } = require('google-translate-api-x');

const igdbService = {}; //contenedor

const obtenerToken = async () => {
    try {
        const params = new URLSearchParams();
        params.append('client_id', process.env.IGDB_CLIENT_ID);
        params.append('client_secret', process.env.IGDB_CLIENT_SECRET);
        params.append('grant_type', 'client_credentials');

        const response = await axios.post('https://id.twitch.tv/oauth2/token', params);
        return response.data.access_token;
    } catch (error) {
        console.error('DETALLE DEL ERROR TWITCH:', error.response?.data);
        throw new Error('No se pudo autenticar con IGDB');
    }
};

igdbService.testGame = async(juegoID) =>{
    try {
        const token = await obtenerToken();
        // genres.name trae el nombre de los generos, no solo los id
        const query = `
            where id = ${juegoID};
            fields 
                name, 
                summary, 
                storyline,
                rating,
                total_rating,
                cover.url, 
                screenshots.url,
                videos.video_id,
                genres.name, 
                themes.name,
                platforms.name,
                game_modes.name,
                player_perspectives.name,
                involved_companies.company.name, involved_companies.developer, involved_companies.publisher,
                websites.url, websites.category;
            limit 1;
        `;
				const response = await axios.post('https://api.igdb.com/v4/games', query, {
            headers: {
                'Client-ID': process.env.IGDB_CLIENT_ID,
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json',
                'Content-Type': 'text/plain'
            }
        });
        // devuelve un array
        return response.data.length > 0 ? response.data[0] : null;
    } catch (error) {
        console.error('Error obteniendo detalle en IGDB:', error.message);
        throw new Error('Falló la consulta de detalles');
    }
}

igdbService.buscarJuegos = async (nombreJuego) => {
    try {
        const token = await obtenerToken();
        const query = `
            search "${nombreJuego}";
            fields name, cover.url, platforms.name, genres.name, first_release_date ;
            where game_type = (0, 8, 9) & version_parent = null;
            limit 15;
        `;

        const response = await axios.post('https://api.igdb.com/v4/games', query, {
            headers: {
                'Client-ID': process.env.IGDB_CLIENT_ID,
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json',
                'Content-Type': 'text/plain'
            }
        });

        // mapeamos la respuesta limpia para el front
        return response.data.map(juego => {
            // La logica para la fecha, igdb tiene fecha en formato Unix Timestamp, la convertimos a año-mes-dia
            const fechaLanzamiento = juego.first_release_date
                ? new Date(juego.first_release_date * 1000).toISOString().split('T')[0]
                : 'Fecha desconocida';

            return {
                id: juego.id,
                titulo: juego.name,
                plataformas: (juego.platforms || []).map(p => p.name),
                generos: (juego.genres || []).map(g => g.name),
                imagen_portada: juego.cover ? `https:${juego.cover.url.replace('t_thumb', 't_cover_big')}` : null,
                fecha_lanzamiento: fechaLanzamiento,
            };
        });

    } catch (error) {
        console.error('Error en buscarJuegos:', error.response?.data || error.message);
        throw new Error('Error en la busqueda de sugerencias');
    }
};

igdbService.obtenerMasJugados = async () => {
    try {
        const token = await obtenerToken();
        // juegos con muchas valoraciones y alta popularidad
        // lenguaje propio de igdb
        const query = `
            fields name, cover.url, total_rating_count, genres.name, platforms.name;
            where total_rating_count > 1000; 
            sort total_rating_count desc; 
            limit 10;
        `;
        const response = await axios.post('https://api.igdb.com/v4/games', query, {
            headers: {
                'Client-ID': process.env.IGDB_CLIENT_ID,
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json',
                'Content-Type': 'text/plain'
            }
        });

        return response.data.map(juego => ({
            id: juego.id,
            titulo: juego.name,
            imagen_portada: juego.cover ? `https:${juego.cover.url.replace('t_thumb', 't_cover_big')}` : null,
            plataformas: (juego.platforms || []).map(p => p.name),
            generos: (juego.genres || []).map(g => g.name)
        }));
    } catch (error) {
        console.error('Error en servicio de populares:', error.message);
        throw error;
    }
};

// detalle completo de un juego (el id de recibimos de buscarJuego)
igdbService.obtenerDetallePorId = async (juegoId) => {
    try {
        const token = await obtenerToken();
        //Apicalypse
        const query = `
            where id = ${juegoId};
            fields 
                name, summary, cover.url, videos.video_id,
                platforms.name,
                genres.name,
                first_release_date, total_rating,
                involved_companies.developer, involved_companies.company.name,
                screenshots.url,
                similar_games.name, similar_games.cover.url, 
                dlcs.name, dlcs.cover.url, 
                expansions.name, expansions.cover.url,
                franchises.games.name, franchises.games.cover.url;
            limit 1;
        `;

        const response = await axios.post('https://api.igdb.com/v4/games', query, {
            headers: {
                'Client-ID': process.env.IGDB_CLIENT_ID,
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json',
                'Content-Type': 'text/plain'
            }
        });

        if (response.data.length === 0) return null;

        const juego = response.data[0];
				
				// NORMALIZADOR DE DATOS y carga completa de imagenes en calidad buena
        const limpiarListaJuegos = (lista) => {
            if (!lista || !Array.isArray(lista)) return [];
            return lista.map(g => ({
                id: g.id,
                titulo: g.name || 'Desconocido',
                imagen_portada: g.cover ? `https:${g.cover.url.replace('t_thumb', 't_cover_big')}` : null
            }));
        };

        // igdb tiene fecha en formato Unix Timestamp, la convertimos a año-mes-dia
        const fechaLanzamiento = juego.first_release_date 
            ? new Date(juego.first_release_date * 1000).toISOString().split('T')[0] 
            : 'Fecha desconocida';

        // desarrolladora principal
        const developerObj = juego.involved_companies?.find(company => company.developer);
        const desarrolladora = developerObj ? developerObj.company.name : 'Desconocida';

        // Capturas de pantalla 
        const capturas = (juego.screenshots || [])
						.slice(0, 5)//filtra 5 capturas
						.map(s => `https:${s.url.replace('t_thumb', 't_1080p')}`
        );

        let descripcionEspañol = 'Sin descripción disponible';
        
        if (juego.summary) {
            try {
                // Le pasamos el texto en ingles y le forzamos el destino a 'es' (Español)
                const traduccion = await translate(juego.summary, { to: 'es' });
                descripcionEspañol = traduccion.text;
            } catch (translationError) {
                console.error('Error al traducir, manteniendo texto original:', translationError.message);
                descripcionEspañol = juego.summary; // si falla devuelve en ingles
            }
        }

        return {
            id: juego.id,
            titulo: juego.name,
            descripcion: descripcionEspañol,
            imagen_portada: juego.cover ? `https:${juego.cover.url.replace('t_thumb', 't_cover_big')}` : null,
            plataformas: (juego.platforms || []).map(p => p.name),
            generos: (juego.genres || []).map(g => g.name),
            trailer_id: juego.videos && juego.videos.length > 0 ? juego.videos[0].video_id : null,
            fecha_lanzamiento: fechaLanzamiento,
            calificacion: juego.total_rating ? Math.round(juego.total_rating) : null,
            desarrolladora: desarrolladora,
            capturas: capturas,
            juegos_similares: limpiarListaJuegos(juego.similar_games),
            dlcs: limpiarListaJuegos(juego.dlcs),
            expansiones: limpiarListaJuegos(juego.expansions),
            saga: juego.franchises && juego.franchises.length > 0 ? limpiarListaJuegos(juego.franchises[0].games) : []
        };

    } catch (error) {
        console.error('Error obteniendo detalle en IGDB:', error.response?.data || error.message);
        throw new Error('Falló la consulta de detalles');
    }
};

module.exports = igdbService;
