# AutoDealer360 — Fase 4 · Diseño adaptable (responsive)

Esta versión se creó a partir de la **Fase 3**, que ya funciona con MySQL, sesiones privadas y Cloudinary. **No cambia ninguna tabla ni requiere volver a crear administradores**.

## Qué se actualizó

- Menú de navegación desplegable en el catálogo, la ficha de vehículos y «Nosotros» para pantallas pequeñas. Los enlaces de WhatsApp conservan la configuración de `.env`.
- Filtros del catálogo contraídos al entrar desde un celular; se pueden abrir, aplicar y cerrar con «Ver resultados». En escritorio siguen a la vista.
- Inventario administrativo: tabla en escritorio y tarjetas independientes con precio completo, estado, publicación y acciones en celular.
- Formulario administrativo: retoques de tamaños y controles táctiles sin modificar la lógica de guardado o carga de fotografías.
- Se distinguen con precisión los estados «Publicada» y «Oculta» de «Disponible» y «Vendido».

## Actualización sin perder información

1. Detén el servidor de la fase anterior con `Ctrl + C`.
2. Descomprime esta Fase 4 y abre su carpeta en VS Code. Conserva Fase 3 como respaldo.
3. Copia **únicamente** el archivo `.env` de Fase 3 a la raíz de Fase 4, sin mostrar sus contraseñas ni subirlo a GitHub.
4. En la terminal de VS Code ejecuta `npm.cmd install`.
5. Ejecuta `npm.cmd run dev`. Abre `http://localhost:3000` y `http://localhost:3000/admin.html`.
6. Usa Chrome > F12 > Ctrl+Shift+M para revisar iPhone 16 / 393 × 852.

**No ejecutar** scripts SQL ni `create-admin`: la base de datos y el administrador existentes se conservan.

## Comprobaciones recomendadas

- En celular: abrir «Menú», navegar, abrir y cerrar «Mostrar filtros», filtrar y tocar «Ver resultados».
- En celular: entrar al panel, verificar que precio y botones sean completos, editar uno de los vehículos existentes.
- En computador: comprobar que continúe la tabla administrativa y que los filtros estén a la izquierda.
- Verificar que fotografías y WhatsApp sigan funcionando.

## Pruebas automatizadas

`npm.cmd test`

Estas pruebas validan parte de la lógica del sistema, pero no reemplazan el examen responsive en un navegador real ni una prueba de extremo a extremo con MySQL y Cloudinary.

## Pendiente antes de publicar

Revisión de seguridad del servidor y la cuenta de BD, optimización accesibilidad/SEO, políticas de privacidad, fotografías y datos reales, así como despliegue con HTTPS.
