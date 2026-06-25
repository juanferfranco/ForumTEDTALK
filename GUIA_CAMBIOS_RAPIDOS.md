# Guia de cambios rapidos

Esta experiencia esta pensada para operar como una pieza escenica en navegador:
no usa PowerPoint, no requiere internet para correr y separa los textos del motor
visual.

## Como correrla

1. Abre una terminal en esta carpeta.
2. Ejecuta:

```powershell
python -m http.server 4173
```

3. Abre `http://localhost:4173` en Chrome, Edge o Safari.
4. Presiona `F` para pantalla completa.

Si el computador no tiene Python, cualquier servidor estatico sirve. Por ejemplo:
`npx serve .`

## Operacion durante la charla

- `Espacio` o `Flecha derecha`: siguiente momento.
- `Flecha izquierda`: momento anterior.
- `F`: pantalla completa.
- `H`: ocultar o mostrar ayudas y controles.
- `R`: reiniciar desde el primer momento.
- En movil o tablet: desliza a izquierda/derecha.
- En la ayuda, usa `ES` o `PT` para cambiar el idioma sin editar codigo.

## Idioma y textos

Los 13 momentos estan en:

```text
moments.js
```

Cada bloque tiene esta forma:

```js
{
  copy: {
    es: {
      title: "El futuro no se hereda. Se construye.",
      subtitle: "",
    },
    pt: {
      title: "O futuro não se herda. Ele se constrói.",
      subtitle: "",
    },
  },
  state: "future",
  intensity: 0.96,
  colors: ["#f7f7f4", "#08a9dd", "#f7353f"],
  behavior: {
    spiral: 0.92,
    network: 0.88,
    architecture: 0.18,
    archive: 0.12,
    stability: 0.64,
  },
}
```

La experiencia abre en portugues por defecto. Para cambiarlo, abre `config.js`
y ajusta:

```js
defaultLanguage: "pt",
```

Usa `"es"` para abrir en espanol.

Alma no necesita editar codigo durante la charla: puede escoger `ES` o `PT` en
la ayuda. Si quiere personalizar frases antes del evento, puede cambiar `title`,
`kicker` o `subtitle` en el idioma correspondiente. Los subtitulos pueden
quedar vacios con `subtitle: ""`.

## Imagen de ceremonia de grados

El momento 2 incluye una imagen generica temporal:

```text
assets/ceremonia-grados-placeholder.png
```

Para reemplazarla, guarda una nueva foto con ese mismo nombre y formato en la
carpeta `assets`. No hace falta tocar el codigo.

La imagen se usa como fondo escenico intervenido, no como recuadro de slide.
Funciona mejor si es horizontal, amplia, con buena profundidad y sin texto
importante cerca de los bordes.

Si quieres usar otro nombre, cambia el campo `src` del momento `auditorio-grados`
en `moments.js`.

## Donde cambiar QR y parametros globales

Abre:

```text
config.js
```

Actualiza estos enlaces cuando existan las URLs finales:

```js
qr: {
  memoryUrl: "https://centrodeeventos.upb.edu.co/",
  socialUrl: "https://www.instagram.com/centrodeeventosupb/",
  memoryImage: "./assets/qr-memory.png",
  socialImage: "./assets/qr-social.png",
}
```

Los PNG actuales estan en `assets/qr-memory.png` y `assets/qr-social.png`.
Si cambias las URLs finales, reemplaza esos PNG por nuevos QR con el mismo
nombre o actualiza `memoryImage` y `socialImage` para apuntar a los nuevos
archivos.

## Estados visuales disponibles

- `latent`: apertura con energia contenida.
- `architecture`: Forum como espacio/arquitectura.
- `opening`: estructura que se abre al mundo.
- `triad`: academia, industria y ciudad.
- `impact`: ondas de impacto.
- `community`: red viva.
- `trust`: conexiones mas estables.
- `routes`: trayectorias y caminos.
- `duality`: dos generaciones coexistiendo.
- `convergence`: generaciones trabajando juntas.
- `present`: energia joven al frente.
- `future`: expansion maxima.
- `qr`: cierre con codigos.

## Paleta actual

La paleta esta ajustada para dialogar con Future Leaders Forum World Cup Edition
2026:

- Cyan: `#08a9dd`
- Rojo: `#f7353f`
- Magenta: `#e96daa`
- Blanco: `#f7f7f4`
- Negro: `#222326`
