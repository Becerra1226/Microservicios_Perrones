
CREATE DATABASE IF NOT EXISTS `usuarios`;
USE `usuarios`;
SET FOREIGN_KEY_CHECKS=0;

DROP TABLE IF EXISTS `usuarios`;

CREATE TABLE `usuarios` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) NOT NULL,
  `apellido` varchar(100) NOT NULL,
  `correo` varchar(150) NOT NULL,
  `telefono` varchar(20) DEFAULT NULL,
  `password` varchar(255) NOT NULL,
  `rol` enum('ADMIN','CAJERO') NOT NULL DEFAULT 'CAJERO',
  `fecha_creacion` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `correo` (`correo`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

LOCK TABLES `usuarios` WRITE;

INSERT INTO `usuarios` VALUES (8,'Isabella','Becerra','isabecari@hotmail.com','1234567890','$2b$10$xhmDPxGnWU/NjCDUUcpfTu/FTqzgVzY1Ueor88C3yhV/cHeoy5bfy','CAJERO','2026-07-11 00:56:11'),(10,'Sebastian','Becerra','becerrasebastian081@gmail.com','3233960046','$2b$10$4ZkpHLmH84QWg..HBETw..Eyn2FIKmujLkf0q4ppeb9CoEdmx8Nd6','ADMIN','2026-07-11 02:27:08');

UNLOCK TABLES;