/* Littera — Libro de muestra (texto original). Sirve para ver cómo funcionan el clasificador,
   las fichas, el lienzo y la exportación. Se usa desde Windows (main.js) y desde la web/iPad (shim.js). */
(function (root) {
  function sample() {
    const F = (id, t, p, o, extra) => Object.assign({ id, t, k: 'f', p, h: '', s: '', n: '', st: 'Borrador', o: o == null ? 1 : o }, extra || {});
    const D = (id, t, p, h, s, m, st) => ({ id, t, k: 'd', p, h, s, n: '', st: st || 'Borrador', m: m || {} });
    const C = (id, t, p, h, s) => ({ id, t, k: 'c', p, h, s, n: '', st: 'Borrador' });
    const L = (id, t, p, h, s) => ({ id, t, k: 'l', p, h, s, n: '', st: 'Borrador' });
    const items = [
      F('a', 'Manuscrito', null),
      F('c1', 'I · La llegada', 'a'),
      D('e1', 'El camino del faro', 'c1',
        '<h1>El camino del faro</h1>' +
        '<p>Inés llegó a Cala Muda con la última luz de la tarde y una sola maleta. El autobús la dejó junto a la fuente seca, <i>donde acababa el asfalto</i>, y desde allí el sendero subía entre tomillos y piedras blancas hasta el faro.</p>' +
        '<p>—¿Va usted a la torre? —le preguntó un hombre que remendaba una red—. Hace años que nadie sube.</p>' +
        '<p>—Subo yo —respondió ella, y le sorprendió lo firme que sonó su voz.</p>' +
        '<p>El viento traía olor a sal y a algas. Mientras caminaba, repasó de memoria la carta del notario: <b>una torre, una casa baja y un cuaderno</b>. Nada más había dejado su tío. Nada más, y sin embargo había sido suficiente para que ella dejara la ciudad.</p>' +
        '<p>Al llegar arriba, la puerta cedió con un quejido. Dentro olía a madera mojada y a tiempo detenido. Sobre la mesa, bajo una capa de polvo, esperaba el cuaderno.</p>',
        'Inés llega al pueblo y sube al faro heredado.', { pov: 'p1', lug: 'l2', pr: ['p1', 'p3'] }),
      D('e2', 'El cuaderno de Anselmo', 'c1',
        '<h1>El cuaderno de Anselmo</h1>' +
        '<p>La primera página decía solo: <i>«Si lees esto, ya has subido. Ahora toca esperar a que el mar hable.»</i></p>' +
        '<p>Inés pasó las hojas con cuidado. Había mareas anotadas con lápiz, nombres de barcos que nunca había oído y, en los márgenes, dibujos diminutos de una luz con tres rayos. Al final del cuaderno, una lista:</p>' +
        '<ul><li>Encender la lámpara cada noche, aunque no haya barcos.</li><li>No abrir el cuarto de la escalera hasta el primer temporal.</li><li>Confiar en Tomás.</li></ul>' +
        '<p>Se quedó mirando la última línea. No conocía a ningún Tomás. Fuera, el sol tocó el horizonte y, sin que nadie la tocase, la vieja lámpara de la torre chasqueó una vez, como quien se aclara la garganta.</p>',
        'Inés descubre el cuaderno y las tres reglas de su tío.', { pov: 'p1', lug: 'l1', pr: ['p1'] }),
      F('c2', 'II · El temporal', 'a'),
      D('e3', 'Tomás', 'c2',
        '<h1>Tomás</h1>' +
        '<p>Tomás apareció al tercer día, con un saco de pan y una desconfianza que no se molestó en ocultar. Era el hombre de la red, el mismo que la había visto subir.</p>' +
        '<p>—Anselmo decía que vendría alguien —dijo, dejando el pan sobre la mesa—. No dijo que sería tan joven.</p>' +
        '<p>—Tampoco dijo nada de ti en la carta del notario.</p>' +
        '<p>—Porque no hacía falta. —Sonrió apenas—. En este pueblo, todo lo importante se sabe sin que nadie lo diga.</p>' +
        '<p>Inés quiso preguntar por el cuarto de la escalera, por la luz de tres rayos, por el mar que debía hablar. Pero Tomás ya miraba el cielo por la ventana, y el cielo, hacia el oeste, se había vuelto del color de una moneda vieja.</p>',
        'Tomás se presenta y anuncia que viene tormenta.', { pov: 'p1', lug: 'l1', pr: ['p1', 'p2'] }),
      D('e4', 'La primera noche de viento', 'c2',
        '<h1>La primera noche de viento</h1>' +
        '<p>El temporal llegó a medianoche. Primero fue un silbido; luego, un empujón que hizo temblar los cristales de la linterna. Inés subió los ciento doce escalones con una vela en la mano y el cuaderno bajo el brazo.</p>' +
        '<p>Encendió la lámpara. La luz giró, partiéndose en tres rayos sobre las olas.</p>' +
        '<p>Entonces, abajo, en el cuarto de la escalera, algo llamó a la puerta <i>desde dentro</i>.</p>' +
        '<p>Tomás, que había subido tras ella, se quedó muy quieto.</p>' +
        '<p>—Ábrela —dijo por fin—. Anselmo lo escribió: el primer temporal.</p>',
        'Estalla la tormenta; el cuarto de la escalera se despierta.', { pov: 'p1', lug: 'l1', pr: ['p1', 'p2'] }),
      F('c3', 'III · Lo que guardaba el mar', 'a'),
      D('e5', 'La puerta del cuarto', 'c3',
        '<h1>La puerta del cuarto</h1>' +
        '<p>Detrás de la puerta no había un monstruo ni un tesoro. Había una escalera de caracol que bajaba, mucho más de lo que el faro permitía, hacia un rumor de agua.</p>' +
        '<p>Bajaron juntos. Al final, una gruta abierta al mar guardaba una barca pequeña, pintada de azul, con un nombre en la proa: <b>Inés</b>.</p>' +
        '<p>—Mi tío la llamó como yo —murmuró ella—. Antes de conocerme.</p>' +
        '<p>Tomás tocó el casco con la punta de los dedos.</p>' +
        '<p>—Anselmo sabía que algún día harías falta. La luz es para los barcos que llegan. La barca, para los que se quedaron sin volver.</p>',
        'Descubren la gruta y la barca con el nombre de Inés.', { pov: 'p1', lug: 'l3', pr: ['p1', 'p2'] }),
      D('e6', 'Cala Muda por la mañana', 'c3',
        '<h1>Cala Muda por la mañana</h1>' +
        '<p>Al amanecer el temporal se había ido, dejando el mar liso y brillante como una página en blanco. Inés se sentó en el borde de la torre con el cuaderno abierto y escribió, debajo de la lista de su tío, una cuarta línea:</p>' +
        '<p style="text-align:center;text-indent:0"><i>Quedarme.</i></p>' +
        '<p>Abajo, en el pueblo, alguien abrió una ventana. Alguien más salió a barrer su puerta. Y por primera vez en años, Cala Muda tuvo la sensación de que ya no estaba tan sola.</p>' +
        '<p style="text-align:center;text-indent:0">* * *</p>' +
        '<p style="text-align:center;text-indent:0"><i>Fin de la muestra</i></p>',
        'Inés decide quedarse en el faro.', { pov: 'p1', lug: 'l2', pr: ['p1'] }, 'Revisado'),
      F('pc', 'Personajes', null, 1, { sp: 'c' }),
      C('p1', 'Inés Valls', 'pc', '<p><b>Edad:</b> 29 años.</p><p>Archivera en una ciudad grande. Callada, observadora, terca cuando algo le importa. Hereda el faro de su tío al que apenas conoció.</p>', 'Protagonista. Hereda el faro.'),
      C('p2', 'Tomás Roig', 'pc', '<p><b>Edad:</b> 54 años.</p><p>Pescador y último amigo de Anselmo. Desconfiado en la forma, leal en el fondo.</p>', 'Aliado del pueblo. Guarda el secreto.'),
      C('p3', 'Anselmo Valls', 'pc', '<p>Tío de Inés y antiguo farero. Aparece solo en el cuaderno y en los recuerdos de otros.</p>', 'El farero ausente.'),
      F('lc', 'Escenarios', null, 1, { sp: 'l' }),
      L('l1', 'El faro', 'lc', '<p>Torre blanca de 112 escalones y una casa baja a sus pies. Huele a sal y a madera mojada. La lámpara tiene tres rayos.</p>', 'Torre y casa del farero.'),
      L('l2', 'El pueblo', 'lc', '<p>Cala Muda: veinte casas, una fuente seca y un solo autobús al día.</p>', 'Pueblo de pescadores.'),
      L('l3', 'La gruta', 'lc', '<p>Cueva abierta al mar bajo el faro, con una barca azul guardada.</p>', 'Gruta secreta bajo la torre.'),
      F('r', 'Investigación', null, 0, { st: 'Pendiente' }),
      D('n1', 'Notas de ambientación', 'r',
        '<h1>Notas de ambientación</h1><p>Ideas para seguir trabajando el libro:</p><ul><li>Ampliar el pasado de Anselmo y su relación con Tomás.</li><li>Decidir qué hay detrás de la luz de tres rayos.</li><li>Escribir la escena del primer barco que llega.</li></ul>',
        'Apuntes sueltos (no se compilan).', {}, 'Pendiente')
    ];
    items[items.findIndex(x => x.id === 'r')].nc = 1;
    const link = (id, a, b, lbl, c) => ({ id, a, b, lbl: lbl || '', st: 'solid', dir: 'f', c: c || '#8a4b2a' });
    const nd = (id, ref, x, y, c) => ({ id, type: 'item', ref, x, y, w: 190, h: 92, c });
    const cv = {
      x: 40, y: 40, z: 1, auto: true,
      nodes: [
        { id: 'f1', type: 'frame', x: 20, y: 10, w: 640, h: 420, tx: 'Parte I — Llegada', c: '#6b6b6b' },
        { id: 'f2', type: 'frame', x: 700, y: 10, w: 640, h: 420, tx: 'Parte II — El mar habla', c: '#6b6b6b' },
        nd('n_e1', 'e1', 50, 70, '#8a4b2a'), nd('n_e2', 'e2', 340, 70, '#8a4b2a'),
        nd('n_e3', 'e3', 730, 70, '#8a4b2a'), nd('n_e4', 'e4', 1020, 70, '#8a4b2a'),
        nd('n_e5', 'e5', 730, 250, '#8a4b2a'), nd('n_e6', 'e6', 1020, 250, '#8a4b2a'),
        nd('n_p1', 'p1', 50, 260, '#2f6fb5'), nd('n_p2', 'p2', 340, 260, '#2f6fb5'),
        { id: 'nt1', type: 'note', x: 340, y: 340, w: 200, h: 70, tx: 'Idea: ¿quién llama desde dentro?', c: '#d68910' },
        { id: 'ev1', type: 'ev', x: 560, y: 450, w: 190, h: 46, tx: 'Primer temporal', c: '#2f6fb5' },
        { id: 'tl1', type: 'tl', x: 20, y: 520, w: 1320, h: 64, tx: 'Línea de tiempo', c: '#8a4b2a' }
      ],
      links: [
        link('k1', 'n_e1', 'n_e2'), link('k2', 'n_e2', 'n_e3'), link('k3', 'n_e3', 'n_e4'), link('k4', 'n_e4', 'n_e5'), link('k5', 'n_e5', 'n_e6'),
        link('k6', 'n_p1', 'n_e1', 'protagoniza', '#2f6fb5'), link('k7', 'n_p2', 'n_e3', 'aparece', '#2f6fb5'),
        link('k8', 'nt1', 'n_e4', '', '#d68910')
      ]
    };
    return {
      sel: 'e1', target: 0, items, cv,
      bk: {
        tit: 'El faro de Cala Muda', sub: 'Libro de muestra', aut: 'Autor de ejemplo', tag: 'Una novela breve',
        cov_on: 1, cov: 'Cenefa griega', cbg: '#f8f1e0', ctx: '#2b2218', cac: '#7a4a22'
      }
    };
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = sample; else root.LITTERA_SAMPLE = sample;
})(typeof window !== 'undefined' ? window : globalThis);
