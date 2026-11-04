-- AUTO DEALER 360 / FASE 1
-- Importa este archivo con MySQL Workbench. Todos los datos de ejemplo son ficticios.
CREATE DATABASE IF NOT EXISTS autodealer360 CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE autodealer360;

CREATE TABLE IF NOT EXISTS rol (
  id TINYINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  nombre VARCHAR(40) NOT NULL UNIQUE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS usuario (
  id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  rol_id TINYINT UNSIGNED NOT NULL,
  nombre VARCHAR(120) NOT NULL,
  email VARCHAR(190) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (rol_id) REFERENCES rol(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS marca (
  id SMALLINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  nombre VARCHAR(80) NOT NULL UNIQUE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS modelo (
  id SMALLINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  marca_id SMALLINT UNSIGNED NOT NULL,
  nombre VARCHAR(80) NOT NULL,
  UNIQUE KEY uq_modelo_marca (marca_id, nombre),
  FOREIGN KEY (marca_id) REFERENCES marca(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS estado_vehiculo (
  id TINYINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  nombre VARCHAR(30) NOT NULL UNIQUE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS vehiculo (
  id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  modelo_id SMALLINT UNSIGNED NOT NULL,
  estado_id TINYINT UNSIGNED NOT NULL,
  version VARCHAR(100) NOT NULL,
  anio SMALLINT UNSIGNED NOT NULL,
  precio DECIMAL(14,0) NOT NULL,
  kilometraje INT UNSIGNED NOT NULL DEFAULT 0,
  color VARCHAR(60) NOT NULL,
  transmision VARCHAR(40) NOT NULL,
  combustible VARCHAR(40) NOT NULL,
  cilindraje VARCHAR(40) NOT NULL,
  ciudad VARCHAR(80) NOT NULL,
  descripcion_general TEXT,
  descripcion_mecanica TEXT,
  destacado BOOLEAN NOT NULL DEFAULT FALSE,
  publicado BOOLEAN NOT NULL DEFAULT TRUE,
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (modelo_id) REFERENCES modelo(id),
  FOREIGN KEY (estado_id) REFERENCES estado_vehiculo(id),
  INDEX idx_publicados (publicado, estado_id, destacado),
  INDEX idx_precio (precio),
  INDEX idx_color (color)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS imagen_vehiculo (
  id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  vehiculo_id INT UNSIGNED NOT NULL,
  url VARCHAR(1000) NOT NULL,
  public_id VARCHAR(255) NULL,
  orden SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  es_principal BOOLEAN NOT NULL DEFAULT FALSE,
  FOREIGN KEY (vehiculo_id) REFERENCES vehiculo(id) ON DELETE CASCADE,
  INDEX idx_vehiculo_orden (vehiculo_id, es_principal, orden)
) ENGINE=InnoDB;

-- Reservada para registrar clics/solicitudes en una fase futura (WhatsApp externo no confirma conversaciones).
CREATE TABLE IF NOT EXISTS solicitud_contacto (
  id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  vehiculo_id INT UNSIGNED NULL,
  medio VARCHAR(30) NOT NULL DEFAULT 'whatsapp',
  fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (vehiculo_id) REFERENCES vehiculo(id) ON DELETE SET NULL
) ENGINE=InnoDB;

INSERT IGNORE INTO rol(id,nombre) VALUES (1,'Administrador');
INSERT IGNORE INTO estado_vehiculo(id,nombre) VALUES (1,'Disponible'),(2,'Reservado'),(3,'Vendido');
INSERT IGNORE INTO marca(id,nombre) VALUES
(1,'Volkswagen'),(2,'Mazda'),(3,'Chevrolet'),(4,'Kia'),(5,'Renault');
INSERT IGNORE INTO modelo(id,marca_id,nombre) VALUES
(1,1,'Gol'),(2,1,'Voyage'),(3,2,'3'),(4,3,'Onix'),(5,4,'Rio'),(6,5,'Sandero');

-- Vehículos de ejemplo SOLO para desarrollo. Reemplazar por inventario verdadero antes de publicar.
INSERT INTO vehiculo(id,modelo_id,estado_id,version,anio,precio,kilometraje,color,transmision,combustible,cilindraje,ciudad,descripcion_general,descripcion_mecanica,destacado)
VALUES
(1,1,1,'Trendline 1.6',2021,44900000,48300,'Gris','Manual','Gasolina','1.6 L','Bogotá','Información de demostración: sedán compacto con equipamiento urbano.','Revisión mecánica pendiente de confirmar.',1),
(2,3,1,'Touring 2.0',2020,68900000,55900,'Rojo','Automática','Gasolina','2.0 L','Bogotá','Información de demostración: conectividad y comodidad.','Mantenimiento e inspección pendientes de confirmar.',1),
(3,4,1,'Premier Turbo',2022,63900000,29900,'Blanco','Automática','Gasolina','1.0 L Turbo','Bogotá','Información de demostración: diseño y tecnología.','Estado mecánico pendiente de confirmar.',0),
(4,5,1,'Vibrant',2019,51900000,71400,'Azul','Manual','Gasolina','1.4 L','Bogotá','Información de demostración: vehículo urbano.','Revisión general pendiente de confirmar.',0),
(5,6,1,'Intens',2021,46900000,60200,'Gris','Manual','Gasolina','1.6 L','Bogotá','Información de demostración: hatchback versátil.','Revisión general pendiente de confirmar.',0),
(6,2,1,'Comfortline 1.6',2020,48900000,68200,'Blanco','Manual','Gasolina','1.6 L','Bogotá','Información de demostración: espacio y confort.','Revisión general pendiente de confirmar.',0)
ON DUPLICATE KEY UPDATE id=id;

INSERT INTO imagen_vehiculo(vehiculo_id,url,orden,es_principal)
SELECT v.id, CONCAT('/assets/auto-',
CASE v.color WHEN 'Rojo' THEN 'rojo' WHEN 'Blanco' THEN 'blanco' WHEN 'Azul' THEN 'azul' ELSE 'gris' END,
'.svg'), 0, 1
FROM vehiculo v WHERE v.id BETWEEN 1 AND 6
AND NOT EXISTS(SELECT 1 FROM imagen_vehiculo i WHERE i.vehiculo_id=v.id);

-- No insertamos un usuario administrador ni contraseñas de ejemplo.
-- En la siguiente fase crearemos un mecanismo seguro para registrar al primer administrador.
