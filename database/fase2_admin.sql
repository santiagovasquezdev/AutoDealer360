-- AUTO DEALER 360 · FASE 2
-- Ejecutar UNA SOLA VEZ en Workbench después de fase 1 (no borra vehículos).
USE autodealer360;

CREATE TABLE IF NOT EXISTS admin_sesion (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  usuario_id INT UNSIGNED NOT NULL,
  token_hash CHAR(64) NOT NULL UNIQUE,
  csrf_token CHAR(64) NOT NULL,
  vence_en DATETIME NOT NULL,
  creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuario(id) ON DELETE CASCADE,
  INDEX idx_sesion_expiracion (vence_en)
) ENGINE=InnoDB;
