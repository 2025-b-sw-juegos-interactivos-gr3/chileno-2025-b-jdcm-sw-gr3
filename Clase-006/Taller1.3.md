# 💻 Taller 1.3 (Asincrónico): Arqueología Digital
## Tema: La Evolución de la Industria - Cómo las Restricciones Crean Innovación

**Nombres:** Jefferson Chileno - David Quille

---

### Era Asignada: 💥 El Crash y el Amanecer de la 3.ª Generación (1983-1984)

**Juego Seleccionado: Tetris**
* **Año de Lanzamiento:** 1984
* **Plataforma(s) Originales:** Electrónika 60 (Minicomputadora soviética, Versión original)

---

## 1. Hito Tecnológico Clave

* **Tecnología Clave: Simplicidad y Portabilidad del Código.**
    * La verdadera innovación de *Tetris* no fue el hardware avanzado, sino su **absoluta independencia de hardware complejo**. Fue creado en una minicomputadora (Electrónika 60) que utilizaba solo **caracteres de texto (ASCII)** para dibujar las piezas.
    * Su código fuente era **extremadamente pequeño y eficiente**, lo que le permitió ser portado a **prácticamente cualquier sistema** con una pantalla y una CPU mínima, superando la necesidad de hardware gráfico dedicado que caracterizaba a los Arcades de la época.

---

## 2. Análisis de Diseño (MDA)

### Mecánicas (M):
* **Manipulación de Bloques (Tetrominós):** El jugador rota y mueve figuras compuestas por cuatro cuadrados mientras caen.
* **Limpieza de Líneas:** El objetivo central es **completar líneas horizontales sin huecos**. Las líneas completadas desaparecen, permitiendo que el juego continúe.
* **Aceleración Progresiva:** La velocidad de caída de las piezas aumenta gradualmente con el tiempo o los niveles, elevando dinámicamente la dificultad.

### Estéticas (A):
* **Desafío (Superación):** La lucha constante contra el tiempo y el desorden, y la **satisfacción** de limpiar cuatro líneas a la vez (un 'Tetris').
* **Control Físico:** La sensación de **control preciso** sobre las piezas que caen.
* **Tensión/Compulsión:** La naturaleza repetitiva y adictiva del juego (el famoso **"Efecto Tetris"**) impulsa al jugador a hacer "una partida más."

---

## 3. Innovación Clave (El "Salto")

* **Innovación: El Puzzle sin Fin y la Simplicidad Universal.**
    * *Tetris* es considerado uno de los primeros y más influyentes **juegos de puzle abstractos** sin un final predefinido, sino solo la inevitabilidad de la derrota.
    * Ayudó a definir el género de los "puzles de bloques que caen" y demostró que los videojuegos podían ser populares a nivel mundial sin necesidad de violencia, personajes complejos, o hardware caro, sentando las bases para el **mercado de juegos casuales**.

---

## 4. La "Restricción Ingeniosa" (El Desafío de Ingeniería)

### La Restricción:
* **No se Usó Aleatoriedad Pura para la Caída de Piezas (El Factor Frustración).**
    * Los desarrolladores se dieron cuenta de que una generación de piezas completamente aleatoria a menudo producía rachas de piezas idénticas o inútiles, lo que frustraba al jugador y acortaba el juego de forma injusta. Esto era un problema de diseño provocado por la **simplicidad forzada de la generación de piezas**.

### La Solución (El "Hack"):
* **El Algoritmo "7-Bag" o Generación No-Pura.**
    * **El *Hack*:** En lugar de una aleatoriedad pura, el juego toma las **siete posibles piezas**, las pone en una **"bolsa" virtual (7-Bag)**, las saca en un orden aleatorio (asegurando que obtienes una de cada tipo antes de que se repita una), y luego "reinicia la bolsa" para el siguiente grupo de siete.
    * **Resultado Ingenioso:** Esto garantiza que el jugador **nunca estará condenado por una mala racha de piezas** y siempre sabrá que la pieza que necesita (por ejemplo, la barra 'I') aparecerá en breve, manteniendo el juego **justo y desafiante** por más tiempo, a pesar de las limitaciones de hardware que podrían haber forzado una lógica de aleatoriedad más simple.

---
