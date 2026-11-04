# AutoDealer360

**Plataforma web para la exhibición y gestión de vehículos usados.**

AutoDealer360 es una aplicación web diseñada para un concesionario de automóviles usados. Centraliza la información del negocio y su inventario, permite a los clientes explorar los vehículos disponibles y facilita el contacto directo con un asesor comercial mediante WhatsApp.

El sistema cuenta con un portal público de consulta y un módulo privado de administración. Ambos comparten la misma información, de modo que los cambios realizados por el concesionario se reflejan en el catálogo.

## Funcionalidades principales

### Portal público

- **Información del concesionario:** presentación del negocio y sus canales de contacto.
- **Catálogo de vehículos:** consulta de automóviles disponibles para la venta.
- **Búsqueda y filtros:** localización de vehículos por marca, modelo, color y rango de precio.
- **Detalle de cada vehículo:** galería de fotografías, precio, año, kilometraje, transmisión, combustible, descripción y características mecánicas.
- **Contacto por WhatsApp:** acceso a una conversación con el concesionario mediante un mensaje que identifica el vehículo de interés.
- **Diseño adaptable:** navegación desde computadores, tabletas y teléfonos móviles.

### Administración del concesionario

- **Acceso privado:** inicio de sesión para usuarios administradores.
- **Gestión del inventario:** registro de vehículos y actualización de sus características, precios y descripciones.
- **Gestión de fotografías:** carga y organización de imágenes de cada automóvil.
- **Control de disponibilidad:** administración del estado de los vehículos, incluida la opción de marcarlos como vendidos.
- **Control de publicaciones:** posibilidad de mostrar u ocultar vehículos del catálogo público sin perder su información en el inventario.

## Tecnologías utilizadas

| Componente | Tecnología |
|---|---|
| Interfaz de usuario | HTML5, CSS3 y JavaScript |
| Servidor y API | Node.js y Express |
| Base de datos relacional | MySQL |
| Gestión de imágenes | Cloudinary |
| Control de versiones | Git y GitHub |

## Arquitectura general

La aplicación utiliza una arquitectura cliente-servidor:

1. **Frontend:** presenta el catálogo, los detalles de los vehículos y las interfaces administrativas.
2. **Backend:** procesa las solicitudes, aplica las reglas del sistema y controla el acceso a las operaciones privadas.
3. **Base de datos MySQL:** almacena los vehículos, sus características, las imágenes asociadas y la información necesaria para la administración.
4. **Cloudinary:** aloja las fotografías que se muestran en las publicaciones.

## Propósito del proyecto

AutoDealer360 busca facilitar la consulta del inventario de un concesionario de vehículos usados y simplificar su actualización. Los clientes pueden informarse sin necesidad de crear una cuenta, mientras que el personal autorizado administra las publicaciones desde un panel independiente.

El proyecto fue desarrollado como parte del proceso formativo de **Análisis y Desarrollo de Software (ADSO) del SENA**.