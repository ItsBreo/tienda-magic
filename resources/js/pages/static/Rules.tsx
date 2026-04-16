import React from 'react';
import { ScrollText, Zap, BookOpen, Skull, Flame, Droplets, TreePine, Sun, CircleDashed, Info } from 'lucide-react';

export default function Rules() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <div className="flex items-center gap-3 mb-8 pb-4 border-b border-border">
        <ScrollText className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-serif font-bold text-foreground">Guía de Inicio: ¿Cómo se juega a Magic?</h1>
      </div>
      
      <div className="space-y-12 text-muted-foreground leading-relaxed font-inter">
        
        {/* Intro */}
        <section>
          <p className="text-lg text-muted-foreground">
            Bienvenido a Magic: The Gathering, el rey absoluto de los juegos de cartas. Al principio puede parecer que necesitas un máster para entender todo, pero en el fondo es como un ajedrez donde tú eres un mago hiper-poderoso lanzando dragones y rayos letales. Vamos a ver cómo funciona esto sin enrollarnos demasiado.
          </p>
        </section>

        {/* 1. El objetivo */}
        <section className="bg-zinc-900/50 p-6 rounded-lg border border-zinc-800">
          <h2 className="text-xl font-bold text-primary mb-4 flex items-center gap-2">
            <BookOpen className="h-5 w-5" /> 1. Tú mandas (Eres un Planeswalker)
          </h2>
          <p className="mb-4">
            Dentro del <em>lore</em> del juego, tú y tu oponente sois <strong>Planeswalkers</strong>: hechiceros capaces de viajar por distintos mundos. En una partida normal, empiezas con <strong>20 vidas</strong> y tu mazo o biblioteca.
          </p>
          <p className="font-bold text-foreground">¿Cómo se gana una partida?</p>
          <ul className="list-disc pl-5 space-y-2 mt-2">
            <li>Bajando la vida de tu rival a 0 a base de tortas y hechizos directos a la cara.</li>
            <li>Consiguiendo que tu colega intente robar una carta, y resulta que ya no tiene mazo. Pierde por <em>deckearse*</em>.</li>
            <li>Usando alguna que especifique una condición de victoria.</li>
          </ul>
        </section>

        {/* 2. El Maná */}
        <section className="bg-zinc-900/50 p-6 rounded-lg border border-zinc-800">
          <h2 className="text-xl font-bold text-primary mb-4 flex items-center gap-2">
            <Zap className="h-5 w-5" /> Tierras y Maná
          </h2>
          <p className="mb-4">
            Los hechizos tienen su coste. Para jugar cualquier cosa necesitas energía, y esa energía se llama <strong>Maná</strong>. El maná lo sacas de las cartas de Tierra que bajas a la mesa (una por turno). Para usar ese maná de tu tierra al hechizo, tendrás que <em>tapearla*</em> (girarla).
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-6">
            <div className="flex items-center gap-2 bg-zinc-950 p-2 rounded border border-zinc-800"><Sun className="text-yellow-200 h-5 w-5"/> <span className="text-sm">Blanco (Llanuras)</span></div>
            <div className="flex items-center gap-2 bg-zinc-950 p-2 rounded border border-zinc-800"><Droplets className="text-blue-500 h-5 w-5"/> <span className="text-sm">Azul (Islas)</span></div>
            <div className="flex items-center gap-2 bg-zinc-950 p-2 rounded border border-zinc-800"><Skull className="text-purple-600 h-5 w-5"/> <span className="text-sm">Negro (Pantanos)</span></div>
            <div className="flex items-center gap-2 bg-zinc-950 p-2 rounded border border-zinc-800"><Flame className="text-red-500 h-5 w-5"/> <span className="text-sm">Rojo (Montañas)</span></div>
            <div className="flex items-center gap-2 bg-zinc-950 p-2 rounded border border-zinc-800"><TreePine className="text-green-500 h-5 w-5"/> <span className="text-sm">Verde (Bosques)</span></div>
            <div className="flex items-center gap-2 bg-zinc-950 p-2 rounded border border-zinc-800"><CircleDashed className="text-zinc-400 h-5 w-5"/> <span className="text-sm">Incoloro</span></div>
          </div>
        </section>

        {/* 3. Tipos de Cartas */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-amber-500 mb-4">3. ¿Qué llevas en tu deck? (Los Tipos de Carta)</h2>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-zinc-900/30 p-5 rounded-lg border border-zinc-800/50">
              <h3 className="font-bold text-zinc-100 mb-1">Tierras (Lands)</h3>
              <p className="text-sm">Los enchufes que te dan energía. Bajas una en tu turno, se quedan en la mesa y te permiten jugar lo demás.</p>
            </div>
            <div className="bg-zinc-900/30 p-5 rounded-lg border border-zinc-800/50">
              <h3 className="font-bold text-zinc-100 mb-1">Criaturas (Creatures)</h3>
              <p className="text-sm">Tus "bichos". Tienen dos números abajo: Fuerza (lo duro que pegan) y Resistencia (su salud). Sufren de "mareo", así que no pueden pegar nada más entrar al campo.</p>
            </div>
            <div className="bg-zinc-900/30 p-5 rounded-lg border border-zinc-800/50">
              <h3 className="font-bold text-zinc-100 mb-1">Conjuros (Sorceries)</h3>
              <p className="text-sm">Magias principales. Solo puedes lanzarlas en tu turno y con vía libre. Hacen su efecto molón y directos al cementerio.</p>
            </div>
            <div className="bg-zinc-900/30 p-5 rounded-lg border border-zinc-800/50">
              <h3 className="font-bold text-zinc-100 mb-1">Instantáneos (Instants)</h3>
              <p className="text-sm">El "truco" de Magic. Puedes tirarlos en <strong>cualquier momento</strong>, ¡incluso en el turno de tu rival para arruinarle los planes cuando menos se lo espera!</p>
            </div>
            <div className="bg-zinc-900/30 p-5 rounded-lg border border-zinc-800/50">
              <h3 className="font-bold text-zinc-100 mb-1">Artefactos / Encantamientos</h3>
              <p className="text-sm">Objetos o auras mágicas estáticas. Una vez pisas la mesa con ellos, se quedan ahí bufando a tus criaturas o dándote ventajas todo el rato.</p>
            </div>
            <div className="bg-zinc-900/30 p-5 rounded-lg border border-zinc-800/50">
              <h3 className="font-bold text-zinc-100 mb-1">Planeswalkers</h3>
              <p className="text-sm">El colega guapo. Esencialmente es un personaje secundario que invocas para que luche contigo. Tiene habilidades brutales limitadas por su propia "lealtad".</p>
            </div>
          </div>
        </section>

        {/* 4. Preparación Pre-partida */}
        <section className="bg-zinc-900/50 p-6 rounded-lg border border-zinc-800">
          <h2 className="text-xl font-bold text-amber-500 mb-4">4. Los preparativos y el Mulligan</h2>
          <p className="mb-4 text-sm text-zinc-400">Antes de empezar a lanzar hechizos, hay que sentar las bases:</p>
          <ul className="list-disc pl-5 space-y-3 font-medium text-sm">
            <li>
              <span className="text-zinc-100">¿Quién va primero?:</span> Tira un dado con tu rival para decidir. El que gana elije ir primero o robar primero. <em>Aviso importante: el que juega primero en el turno 1, se salta la fase de robar carta para equilibrar las cosas.</em>
            </li>
            <li>
              <span className="text-zinc-100">Las famosas 7 cartas:</span> Baraja a muerte tú mazo, corta el de tu rival y roba exactamente 7 cartas. ¿Estás contento de lo que has robado?
            </li>
            <li>
              <span className="text-zinc-100">El Mulligan*:</span> ¿Has robado todo tierras y ninguna criatura? ¿O puros bichos caros y ni una triste montaña de maná? No sufras, aplica el <em>Mulligan</em>. Devuelves tu mano de 7, barajas y vuelves a robar 7. La pega es que por cada vez que hagas Mulligan, deberás devolver una carta robada al fondo de tu mazo antes de empezar.
            </li>
          </ul>
        </section>

        {/* 5. Estructura del Turno */}
        <section className="bg-zinc-900/50 p-6 rounded-lg border border-zinc-800">
          <h2 className="text-xl font-bold text-amber-500 mb-4">5. Flujo del Turno: Aquí jugamos todos igual</h2>
          <p className="mb-4 text-sm text-zinc-400">El orden en Magic es la biblia. Cada turno sigue estrictamente estas fases (y en este orden):</p>
          <ol className="list-decimal pl-5 space-y-3 font-medium">
            <li>
              <span className="text-zinc-100">Fase Inicial (Enderezar y Robar):</span> Pones "de pie" (enderezas) todas tus tierras y cartas <em>tapeedas*</em> (agotadas). Luego, el gran premio: robas la cartita de tu turno.
            </li>
            <li>
              <span className="text-zinc-100">Fase Principal 1:</span> El pre-game del combate. Bajas tu tierra del turno y si quieres, gastas maná metiendo hechizos y criaturas.
            </li>
            <li>
              <span className="text-zinc-100">Fase de Combate:</span> Empieza la fiesta de tollinas. Lo decribimos en la secicón de abajo al detalle.
            </li>
            <li>
              <span className="text-zinc-100">Fase Principal 2 (Main 2):</span> Lo mismo que la fase uno, pero post-combate. Jugar todo siempre en esta fase (salvo que influya en la torta) suele ser de cracks para ocultar tus cartas en mano al rival hasta el último segundo.
            </li>
            <li>
              <span className="text-zinc-100">Fase Final:</span> Todo el daño que le hayas hecho a las criaturas y no las haya matado, se cura mágicamente a tope de nuevo. Le pasas turno al oponente con un mítico "Vas".
            </li>
          </ol>
        </section>

        {/* 6. El Combate */}
        <section className="bg-zinc-900/50 p-6 rounded-lg border border-red-900/20">
          <h2 className="text-xl font-bold text-red-400 mb-4">6. Fase de combate</h2>
          <p className="mb-4">
            Atento aquí, que esto lo hace mal muchísima gente al principio: <strong>Tú nunca atacas a las criaturas del oponente. Tú vas directo a partirle la cara al jugador rival.</strong> Es el jugador defensor el que decide si pone a sus bichos como escudo humano para frenarte el golpe.
          </p>
          <div className="space-y-4 text-sm bg-zinc-950/80 p-4 border border-zinc-800 rounded">
            <p className="text-zinc-300"><span className="font-bold text-amber-500">Paso Atacante:</span> Dices "Declaro atacantes" y giras a los bichos que se lanzan contra la vida de tu enemigo.</p>
            <p className="text-zinc-300"><span className="font-bold text-amber-500">Paso Bloqueador:</span> Tu rival mira tus criaturas y dice: "Pues yo le paro con mi duende a tu orco". Incluso puede lanzar a 3 bichitos suyos para bloquear a tu bestia gigante juntos. Eso es buscar buen <em>tradeo*</em>.</p>
            <p className="text-zinc-300"><span className="font-bold text-amber-500">Repartir Daño:</span> Las criaturas chocan. Todas se hacen pupa a la vez con su número de Fuerza. Quien pierda toda su Resistencia, acaba al cementerio.</p>
          </div>
        </section>

        {/* 7. La Pila */}
        <section className="bg-zinc-900/50 p-6 rounded-lg border border-indigo-900/30">
          <h2 className="text-xl font-bold text-primary mb-4">7. La Pila (The Stack)</h2>
          <p className="mb-3">
            Para evitar discusiones entre jugadores, está "La Pila". Piensa en una bandeja de comedor donde la gente va soltando sus bandejas sucias. La última bandeja que dejas es la primera que friegas.
          </p>
          <p className="italic text-foreground border-l-4 border-primary pl-4 py-2 mb-4 bg-accent/50 rounded-r shadow-inner">
            <strong>LIFO ("Last In, First Out"):</strong> El último hechizo que se lanza, es el primero en resolverse.
          </p>
          <p className="text-sm">
            Si le tiras un "Rayo Letal" al Dragón de tu amigo, el Rayo va a la bandeja (La Pila). Antes de que el dragón se fría, tu amigo lanza un instantáneo "Escudo Mágico" a la bandeja por encima de tu rayo. 
            <br/><br/>Ahora la pila se frena y empieza a resolverse hacia atrás. ¿El de arriba? ¡El Escudo! El dragón se protege. ¿El siguiente en resolverse al fondo de la pila? ¡A tu triste rayo se hace añicos <em>(se frizzea*)</em>!.
          </p>
        </section>

        {/* 8. Palabras Clave */}
        <section className="bg-zinc-950 p-6 rounded-lg border border-zinc-800">
          <h2 className="text-xl font-bold text-amber-500 mb-4">8. Palabras clave (Keywords) de interés (hay bastantes más)</h2>
          <div className="grid sm:grid-cols-2 gap-6 text-sm">
            <div>
              <p className="font-bold text-zinc-100 flex items-center gap-1.5 mb-1">Volar (Flying)</p>
              <p className="text-zinc-400">La criatura tiene la capacidad de pegar volando, unicamente puede ser defendida por otra que tenga alcance o que vuele.</p>
            </div>
            <div>
              <p className="font-bold text-zinc-100 flex items-center gap-1.5 mb-1">Arrollar (Trample)</p>
              <p className="text-zinc-400">Tu dinosaurio 8/8 arrolla y le bloquea un triste bicho ardilla 1/1. La ardilla muere machada usando 1 de fuerza, y los 7 de daño restantes van directos a la cara del oponente.</p>
            </div>
            <div>
              <p className="font-bold text-zinc-100 flex items-center gap-1.5 mb-1">Prisa (Haste)</p>
              <p className="text-zinc-400">La criatura no pasa al mareo de invocación y puede atacar directamente al oponente en el mismo turno.</p>
            </div>
            <div>
              <p className="font-bold text-zinc-100 flex items-center gap-1.5 mb-1">Vínculo Vital (Lifelink)</p>
              <p className="text-zinc-400">Por cada punto de daño que mete tu criatura, la vida de tu Planeswalker sube. Una cura constante y bestial para las partidas largas.</p>
            </div>
          </div>
        </section>

        {/* 9. Formatos Oficiales */}
        <section className="bg-zinc-900/50 p-6 rounded-lg border border-zinc-800">
          <h2 className="text-xl font-bold text-primary mb-4 flex items-center gap-2">
            9. Formatos de Juego (¿Cómo se juega?)
          </h2>
          <p className="mb-6 text-sm text-zinc-400">
            Existen diferentes formatos de juego, cada uno con sus propias reglas y restricciones. Aquí te presentamos los más comunes:
          </p>
          <div className="grid md:grid-cols-2 gap-4">
            
            <div className="bg-zinc-950 p-4 rounded border border-zinc-700/50">
              <h3 className="font-bold text-zinc-100 mb-1 flex items-center justify-between">
                Estándar (Standard) <span className="bg-zinc-800 text-xs px-2 py-0.5 rounded text-amber-500">Mazo</span>
              </h3>
              <ul className="text-sm text-zinc-300 space-y-1 list-disc pl-4 mt-2">
                <li><strong>Mazo Base:</strong> Min. 60 cartas. (Solo 4 copias iguales).</li>
                <li><strong>Vidas:</strong> 20.</li>
                <li><strong>Legalidad:</strong> Lo último de lo último. Solo cartas de los últimos 2-3 añitos. Si la rotación ocurre, toca mazo nuevo o pillarse otras piezas.</li>
              </ul>
            </div>

            <div className="bg-zinc-950 p-4 rounded border border-indigo-900/30">
              <h3 className="font-bold text-zinc-100 mb-1 flex items-center justify-between">
                Commander (EDH) <span className="bg-primary/20 text-xs px-2 py-0.5 rounded text-primary">Multijugador / Casual</span>
              </h3>
              <ul className="text-sm text-zinc-300 space-y-1 list-disc pl-4 mt-2">
                <li><strong>Mazo Base:</strong> Exactamente 100 cartas, pero "1 de 1" (ninguna carta puede repetirse salvo las tierras básicas).</li>
                <li><strong>Vidas:</strong> 40</li>
                <li><strong>La diferencia clave:</strong> En este formato se juega en multijugador, normalmente 4 jugadores. Cada jugador tiene un Comandante, que es una criatura legendaria que puede ser lanzada desde la zona de comandante pagando un coste adicional cada vez. (Commander tax)</li>
              </ul>
            </div>

            <div className="bg-zinc-950 p-4 rounded border border-zinc-700/50">
              <h3 className="font-bold text-zinc-100 mb-1 flex items-center justify-between">
                Modern <span className="bg-zinc-800 text-xs px-2 py-0.5 rounded text-amber-500">Mazo Infinito</span>
              </h3>
              <ul className="text-sm text-zinc-300 space-y-1 list-disc pl-4 mt-2">
                <li><strong>Mazo Base:</strong> Min. 60 cartas. (4 copias).</li>
                <li><strong>Vidas:</strong> 20.</li>
                <li><strong>Legalidad:</strong> Entran todas las colecciones desde hace milenios (2003 para adelante). Aquí las cartas antiguas poderosas pegan fuertísimo, pero oye, aquí juegas el mismo mazo toda tu vida sin rotaciones.</li>
              </ul>
            </div>

            <div className="bg-zinc-950 p-4 rounded border border-emerald-900/30">
              <h3 className="font-bold text-zinc-100 mb-1 flex items-center justify-between">
                Draft (Limitado) <span className="bg-accent text-xs px-2 py-0.5 rounded text-muted-foreground">De paquete</span>
              </h3>
              <ul className="text-sm text-zinc-300 space-y-1 list-disc pl-4 mt-2">
                <li><strong>Mazo Base:</strong> Min. 40 cartas de las que extraigas.</li>
                <li><strong>Vidas:</strong> 20.</li>
                <li><strong>Legalidad:</strong> Entra todo el mundo sin mazos. Se abren sobres ahí mismo, te quedas 1 carta, se lo pasas al vecino y así. Te acabas montando un mazo al azar sudando la gota gorda hasta encontrar combos raros. Es arte!</li>
              </ul>
            </div>

          </div>
        </section>

        {/* GLOSARIO */}
        <section className="mt-12 border-t-2 border-border pt-8">
          <h3 className="text-2xl font-serif font-bold text-foreground mb-6 flex items-center gap-2">
            <Info className="h-6 w-6 text-muted-foreground" /> Glosario
          </h3>
          <dl className="grid gap-x-8 gap-y-4 md:grid-cols-2 text-sm text-muted-foreground">
            <div className="bg-zinc-900/30 p-4 rounded border border-zinc-800">
              <dt className="font-bold text-amber-500 mb-1">Tapear / Girar (Tap)</dt>
              <dd>Doblar 90 grados la carta. Visualmente te dice que está "agotada" y que ya la acabas de aprovechar. Suena como "tapear" una mesa, literal.</dd>
            </div>
            <div className="bg-zinc-900/30 p-4 rounded border border-zinc-800">
              <dt className="font-bold text-amber-500 mb-1">Tradear (Tradeo)</dt>
              <dd>Del inglés "Exchange trade". Sacrificar voluntariamente a mi bicho 2/2 enfrentándolo al tuyo que es 3/3 usando algún truco del manga (instantáneo extra de daño) para conseguir que tu pedazo monstruo gigante muera intercambiado.</dd>
            </div>
            <div className="bg-zinc-900/30 p-4 rounded border border-zinc-800">
              <dt className="font-bold text-amber-500 mb-1">Mulligan</dt>
              <dd>Cambiar la mano completa porque tienes cero tierras y el karma no ayuda. Devolverás las 7 al mazo, barajas fuerte y robarás otras 7. Pena: una de tus robadas se va al pozo (al final del mazo).</dd>
            </div>
            <div className="bg-zinc-900/30 p-4 rounded border border-zinc-800">
              <dt className="font-bold text-amber-500 mb-1">Deckearse (Deck Out)</dt>
              <dd>Perder por avaricia pura (o asfixiado a base de combos). Llegó el momento de sacar una carta del mazo (deck) y se acabó el cartón. Literalmente, GG hermano.</dd>
            </div>
            <div className="bg-zinc-900/30 p-4 rounded border border-zinc-800">
              <dt className="font-bold text-amber-500 mb-1">Fizzle (Frizzearse)</dt>
              <dd>Tirar un hechizo al vacío con todo el hype de la galaxia para que sus condiciones queden extintas (ej. tiras rayo letal pero el enemigo devuelve su propia criatura a la mano antes de que de). ¡Fizzle! Adiós magia loca, pierdes el maná gastado.</dd>
            </div>
            <div className="bg-zinc-900/30 p-4 rounded border border-zinc-800">
              <dt className="font-bold text-amber-500 mb-1">GG (Good Game) / Conceder</dt>
              <dd>Rendirse dándose la mano virtual o fisicamente cuando te quedas a 1 vida, el bloque es invencible y admites de buen rollo que te han barrido el suelo.</dd>
            </div>
          </dl>
        </section>

      </div>
    </div>
  );
}
