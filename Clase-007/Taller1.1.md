# Taller 1.1 (Asincrónico): Deconstruyendo la Diversión 
## Tema: El "Qué" y el "Dónde" - Análisis de Sistemas con el Framework MDA 

**Nombre:** Jefferson Chileno


## 🎮 Ficha de Análisis: Tabla Comparativa MDA

Se han seleccionado juegos canónicos que ejemplifican fuertemente las características de sus respectivos géneros.

| Género | Juego Seleccionado (y Año) | Mecánicas Clave (M) (¿Cuáles son los "verbos" y reglas principales?) | Dinámicas Emergentes (D) (¿Qué estrategias o comportamientos surgen?) | Estética Dominante (A) (¿Cuál es la "diversión" o el objetivo emocional principal?) |
| :--- | :--- | :--- | :--- | :--- |
| **Acción** | **Celeste (2018)** | • Saltar() • Dash() (en 8 direcciones) • Escalar() (resistencia limitada) • Regla: Reset del Dash al tocar el suelo. | • Encadenamiento de saltos y dashes ("speedrunning"). • Tácticas de "baile" para evitar obstáculos. • Búsqueda de rutas óptimas. | • **Desafío** (Precisión, tiempo) • **Dominio** (Sentirse hábil a través de la repetición). |
| **Aventura** | **The Legend of Zelda: Ocarina of Time (1998)** | • Explorar() (mundo abierto con secciones bloqueadas) • UsarObjeto() (ganchos, arcos, bombas) • CombateZTargeting() (Sistema de fijación de enemigos) • ResolverPuzleAmbiente() (uso de objetos o física). | • Deducir la secuencia correcta de uso de ítems para progresar. • Tácticas de posicionamiento en combate para exponer debilidades. • **Teoría de "cadena de llaves"** (adquirir un objeto para desbloquear una nueva área/puzle). | • **Descubrimiento** (Revelar el mapa y los secretos) • **Fantasía** (Ser un héroe salvando un mundo mágico) • **Narrativa** (Progresión a través de la historia). |
| **RPG (Juego de Rol)** | **Final Fantasy VII (1997)** | • CombateTurnos() (Sistema ATB - Active Time Battle) • SubirNivel() (incremento de estadísticas HPMP/ATK/MAG) • EquiparMateria() (personalización de habilidades y magia) • GestionarInventario() (consumibles, equipo). | • **"Grinding"** (Repetir combates para subir nivel/recursos). • Optimización de "builds" (combinaciones de equipo/materia/clase) para maximizar daño/defensa. • Estrategia reactiva durante la batalla (elegir el comando óptimo por turno). | • **Progresión** (Ver crecer y volverse más fuerte al personaje) • **Narrativa** (Profundidad de la historia y desarrollo de personajes) • **Dominio** (Sobre las reglas del sistema de combate). |
| **Estrategia** | **StarCraft: Brood War (1998)** | • RecolectarRecursos() (minerales, gas) • ConstruirUnidad() (basado en un árbol tecnológico) • MoverUnidad() (Control de grupo, micromanagement) • AtacarObjetivo(). | • **"Build Orders"** (Secuencias de construcción óptimas). • Macromanagement (Economía y expansión) vs. Micromanagement (Control de unidades en batalla). • **"Rush"** (Ataque rápido y temprano) vs. **"Tech"** (Inversión en tecnología avanzada). | • **Desafío** (Estrategia y velocidad de decisión/ejecución) • **Dominio** (Superioridad mental sobre el oponente) • **Tensión** (Competencia directa en tiempo real). |
| **Simulación** | **The Sims 4 (2014)** | • SatisfacerNecesidad() (hambre, vejiga, social, etc.) • ConstruirCasa() (compra/venta de objetos) • IrATrabajo() (sistema de progresión laboral/habilidades) • InteractuarSocialmente(). | • **"God-playing"** (Controlar el destino de los Sims, desde la prosperidad hasta la muerte). • **Optimización del tiempo** (Priorizar necesidades y acciones para maximizar el progreso). • **Contar historias emergentes** (Crear dramas, familias o situaciones extravagantes). | • **Crecimiento/Logro** (Mejorar las vidas y carreras de los Sims) • **Fantasía** (Vida idealizada o alternativa) • **Expresión** (Construcción y diseño de la casa/personajes). |
| **Puzle** | **Tetris (1984)** | • RotarPieza() (90 grados) • MoverHorizontalmente() • DejarCaer() (Caída suave/dura) • Regla: Se **EliminaFila()** si todos sus bloques están ocupados. | • **"Stacking"** (Apilar bloques de manera controlada para dejar un "pozo" para la pieza larga "I"). • **Respuesta de Crisis** (Limpieza rápida de pilas altas bajo presión). • **Planificación Multi-Pieza** (Pensar 2 o 3 piezas adelante). | • **Desafío** (Mental, espacial y de velocidad) • **Satisfacción** (Eliminar líneas de forma eficiente) • **Dominio** (Superar el aumento de la velocidad/dificultad). |

---


¡De acuerdo! Seré más conciso y puntual en el **Análisis Comparativo** solicitado en la Sección 5, manteniendo el formato Markdown.

---

## Análisis Comparativo MDA
### 1. Análisis de Diferencias: Acción (Celeste) vs. Estrategia (StarCraft)

| Aspecto | Acción (Celeste) | Estrategia (StarCraft) |
| :--- | :--- | :--- |
| **Bucle de Juego** | **Reflejo-Ejecución-Muerte-Reintento** (Ciclo muy rápido). | **Evaluación-Planificación-Ejecución (largo plazo)-Resultado** (Ciclo lento y acumulativo). |
| **Presión Central** | **Velocidad de reacción física** y precisión motora. | **Calidad de la planificación** a largo plazo y multitarea (Macro/Micro). |
| **Foco del Error** | **Consecuencia inmediata** (muerte). Falla en la ejecución del momento. | **Consecuencia diferida** (pérdida de ventaja económica/militar). Falla en la toma de decisión. |
| **Estética Primaria** | **Desafío** y **Dominio** (habilidad motora). | **Dominio** y **Tensión** (superioridad mental y económica). |

### 2. Análisis de Similitudes (Polimorfismo de Mecánicas)

La mecánica compartida es la **Gestión de Recursos** (GestionarRecursos()). Su **polimorfismo** (cómo cambia su forma y significado) se observa en el contexto que genera dinámicas y estéticas diferentes:

| Género | Contexto de la Mecánica | Dinámica Generada | Estética Dominante |
| :--- | :--- | :--- | :--- |
| **RPG (FFVII)** | **Supervivencia Táctica Finitiva** (Pociones, Magia). | **Decisión crítica de gasto** durante el combate: ¿Cuándo usar el recurso limitado para sobrevivir? | **Desafío/Dominio** sobre el encuentro específico. |
| **Estrategia (StarCraft)** | **Producción y Crecimiento Infinito** (Minerales, Gas, *Supply*). | **Decisión económica y de producción:** ¿Invertir en expansión, tecnología, o unidades de combate? | **Crecimiento/Dominio** sobre el mapa y el oponente. |



### 3. Análisis de Híbridos: Aventura (Zelda) y RPG (Final Fantasy)

Los juegos modernos son inherentemente híbridos, y esta comparación subraya que la diferencia entre géneros es menos sobre la existencia de una mecánica y más sobre su **peso jerárquico** en el **bucle de juego central**.

* **Zelda: Ocarina of Time (Aventura)** **toma prestado** del RPG:
    * **Mecánicas RPG:** Progresión de HP (Contenedores de Corazón), Gestión de MP (Magia), Inventario de ítems.
    * **¿El núcleo es RPG?** No. El progreso principal se logra al obtener un nuevo ítem/habilidad que permite **resolver un puzle de entorno** y desbloquear un área. La Estética clave es el **Descubrimiento**.

* **Final Fantasy VII (RPG)** **toma prestado** de la Aventura:
    * **Mecánicas Aventura:** Puzles de entorno simples (interruptores, navegación), Exploración de mapa.
    * **¿El núcleo es Aventura?** No. Estos elementos sirven para avanzar la **Narrativa**. El progreso real se logra a través de SubirNivel(), EquiparMateria() y la **optimización de estadísticas** frente a los jefes. La Estética clave es la **Progresión/Crecimiento**.
