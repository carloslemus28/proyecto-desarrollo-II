CREATE DATABASE IF NOT EXISTS cobranzaDB;
USE cobranzaDB;

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS CasosArchivos;
DROP TABLE IF EXISTS ActividadesCaso;
DROP TABLE IF EXISTS Casos;
DROP TABLE IF EXISTS Deudores;
DROP TABLE IF EXISTS CatalogoEstados;

DROP TABLE IF EXISTS UsuariosRoles;
DROP TABLE IF EXISTS RolesPermisos;
DROP TABLE IF EXISTS Usuarios;
DROP TABLE IF EXISTS Permisos;
DROP TABLE IF EXISTS Roles;

SET FOREIGN_KEY_CHECKS = 1;

-- SEGURIDAD (ROLES/PERMISOS)


CREATE TABLE Roles (
  RolId INT NOT NULL AUTO_INCREMENT,
  Nombre VARCHAR(50) NOT NULL UNIQUE,
  Activo TINYINT(1) NOT NULL DEFAULT 1,
  CreadoEn DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (RolId)
) ENGINE=InnoDB;

CREATE TABLE Permisos (
  PermisoId INT NOT NULL AUTO_INCREMENT,
  Codigo VARCHAR(100) NOT NULL UNIQUE,
  Descripcion VARCHAR(200) NULL,
  Activo TINYINT(1) NOT NULL DEFAULT 1,
  CreadoEn DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (PermisoId)
) ENGINE=InnoDB;

CREATE TABLE RolesPermisos (
  RolId INT NOT NULL,
  PermisoId INT NOT NULL,
  PRIMARY KEY (RolId, PermisoId),
  CONSTRAINT FK_RolesPermisos_Roles FOREIGN KEY (RolId) REFERENCES Roles(RolId),
  CONSTRAINT FK_RolesPermisos_Permisos FOREIGN KEY (PermisoId) REFERENCES Permisos(PermisoId)
) ENGINE=InnoDB;

CREATE TABLE Usuarios (
  UsuarioId INT NOT NULL AUTO_INCREMENT,
  Nombre VARCHAR(100) NOT NULL,
  Email VARCHAR(150) NOT NULL UNIQUE,
  PasswordHash VARCHAR(200) NOT NULL,
  Telefono VARCHAR(30) NULL,
  Activo TINYINT(1) NOT NULL DEFAULT 1,
  UltimoAcceso DATETIME NULL,
  CreadoEn DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (UsuarioId)
) ENGINE=InnoDB;

CREATE TABLE UsuariosRoles (
  UsuarioId INT NOT NULL,
  RolId INT NOT NULL,
  PRIMARY KEY (UsuarioId, RolId),
  CONSTRAINT FK_UsuariosRoles_Usuarios FOREIGN KEY (UsuarioId) REFERENCES Usuarios(UsuarioId),
  CONSTRAINT FK_UsuariosRoles_Roles FOREIGN KEY (RolId) REFERENCES Roles(RolId)
) ENGINE=InnoDB;

--  COBRANZA (CASOS/ACTIVIDADES/ARCHIVOS)

CREATE TABLE CatalogoEstados (
  EstadoId INT NOT NULL AUTO_INCREMENT,
  Codigo VARCHAR(50) NOT NULL UNIQUE,
  Nombre VARCHAR(100) NOT NULL,
  Activo TINYINT(1) NOT NULL DEFAULT 1,
  Orden INT NOT NULL DEFAULT 1,
  PRIMARY KEY (EstadoId)
) ENGINE=InnoDB;

CREATE TABLE Deudores (
  DeudorId INT NOT NULL AUTO_INCREMENT,
  Nombres VARCHAR(150) NOT NULL,
  Apellidos VARCHAR(150) NOT NULL,
  Documento VARCHAR(50) NULL,
  Telefono VARCHAR(30) NULL,
  Email VARCHAR(150) NULL,
  Direccion VARCHAR(300) NULL,
  Lat DECIMAL(9,6) NULL,
  Lng DECIMAL(9,6) NULL,
  CreadoEn DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (DeudorId)
) ENGINE=InnoDB;

CREATE TABLE Casos (
  CasoId INT NOT NULL AUTO_INCREMENT,
  CodigoCaso VARCHAR(50) NOT NULL UNIQUE,
  DeudorId INT NOT NULL,
  EstadoId INT NOT NULL,
  Monto DECIMAL(18,2) NOT NULL DEFAULT 0,
  Descripcion VARCHAR(500) NULL,
  AsignadoAUsuarioId INT NULL,
  FechaApertura DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FechaCierre DATETIME NULL,
  Activo TINYINT(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (CasoId),
  CONSTRAINT FK_Casos_Deudores FOREIGN KEY (DeudorId) REFERENCES Deudores(DeudorId),
  CONSTRAINT FK_Casos_Estados FOREIGN KEY (EstadoId) REFERENCES CatalogoEstados(EstadoId),
  CONSTRAINT FK_Casos_Usuarios FOREIGN KEY (AsignadoAUsuarioId) REFERENCES Usuarios(UsuarioId)
) ENGINE=InnoDB;

CREATE TABLE ActividadesCaso (
  ActividadId INT NOT NULL AUTO_INCREMENT,
  CasoId INT NOT NULL,
  UsuarioId INT NOT NULL,
  Tipo VARCHAR(50) NOT NULL,
  Nota VARCHAR(1000) NULL,
  CreadoEn DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  Activo TINYINT(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (ActividadId),
  CONSTRAINT FK_Actividades_Casos FOREIGN KEY (CasoId) REFERENCES Casos(CasoId),
  CONSTRAINT FK_Actividades_Usuarios FOREIGN KEY (UsuarioId) REFERENCES Usuarios(UsuarioId)
) ENGINE=InnoDB;

CREATE TABLE CasosArchivos (
  ArchivoId INT NOT NULL AUTO_INCREMENT,
  CasoId INT NOT NULL,
  UsuarioId INT NOT NULL,
  Categoria VARCHAR(80) NULL,
  NombreOriginal VARCHAR(260) NOT NULL,
  NombreServidor VARCHAR(260) NOT NULL,
  MimeType VARCHAR(100) NULL,
  TamanoBytes BIGINT NULL,
  Ruta VARCHAR(400) NOT NULL,
  CreadoEn DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (ArchivoId),
  CONSTRAINT FK_Archivos_Casos FOREIGN KEY (CasoId) REFERENCES Casos(CasoId),
  CONSTRAINT FK_Archivos_Usuarios FOREIGN KEY (UsuarioId) REFERENCES Usuarios(UsuarioId)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS RefreshTokens (
  TokenId INT NOT NULL AUTO_INCREMENT,
  UsuarioId INT NOT NULL,
  TokenHash VARCHAR(255) NOT NULL,
  ExpiresAt DATETIME NOT NULL,
  RevokedAt DATETIME NULL,
  CreatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (TokenId),
  KEY idx_usuario (UsuarioId),
  CONSTRAINT FK_RefreshTokens_Usuarios
    FOREIGN KEY (UsuarioId) REFERENCES Usuarios(UsuarioId)
) ENGINE=InnoDB;

-- INSERCION DE DATOS BASE (roles, permisos, estados)

INSERT INTO Roles (Nombre) VALUES ('ADMIN'), ('AGENTE');

INSERT INTO Permisos (Codigo, Descripcion) VALUES
('USERS_MANAGE','Crear/editar/eliminar usuarios'),
('ROLES_MANAGE','Gestionar roles'),
('PERMISSIONS_MANAGE','Gestionar permisos'),
('CATALOGS_MANAGE','Gestionar catálogos'),
('CASES_READ','Ver casos'),
('CASES_MANAGE','Crear/editar/asignar casos'),
('FILES_UPLOAD','Subir archivos'),
('REPORTS_VIEW','Ver reportes');

-- ADMIN: todos los permisos
INSERT INTO RolesPermisos (RolId, PermisoId)
SELECT r.RolId, p.PermisoId
FROM Roles r
CROSS JOIN Permisos p
WHERE r.Nombre = 'ADMIN';

-- AGENTE: permisos operativos
INSERT INTO RolesPermisos (RolId, PermisoId)
SELECT r.RolId, p.PermisoId
FROM Roles r
JOIN Permisos p ON p.Codigo IN ('CASES_READ','CASES_MANAGE','FILES_UPLOAD')
WHERE r.Nombre = 'AGENTE';

INSERT INTO CatalogoEstados (Codigo, Nombre, Orden) VALUES
('NUEVO','Nuevo',1),
('EN_GESTION','En gestión',2),
('PROMESA_PAGO','Promesa de pago',3),
('INCUMPLIDO','Incumplido',4),
('CERRADO','Cerrado',5);

INSERT INTO Usuarios (Nombre, Email, PasswordHash, Activo)
VALUES ('Administrador', 'admin@cobranza.com', '$2b$10$z/Z.LdxyW5YXbLmkgFrksun5KVwXj2M9ZR899luCcbLl12A64nUh6', 1);

-- Asignar rol ADMIN
INSERT INTO UsuariosRoles (UsuarioId, RolId)
SELECT u.UsuarioId, r.RolId
FROM Usuarios u
JOIN Roles r ON r.Nombre = 'ADMIN'
WHERE u.Email = 'admin@cobranza.com';
