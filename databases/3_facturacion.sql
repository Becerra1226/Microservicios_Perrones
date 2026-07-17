CREATE DATABASE IF NOT EXISTS `facturacion`;
USE `facturacion`;
SET FOREIGN_KEY_CHECKS=0;

DROP TABLE IF EXISTS `facturas`;
CREATE TABLE `facturas` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `codigo` varchar(20) NOT NULL,
  `orden_id` bigint(20) NOT NULL,
  `subtotal` decimal(10,2) NOT NULL,
  `propina` decimal(10,2) DEFAULT 0.00,
  `total` decimal(10,2) NOT NULL,
  `fecha_facturacion` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_orden` (`orden_id`),
  UNIQUE KEY `codigo` (`codigo`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

LOCK TABLES `facturas` WRITE;

INSERT INTO `facturas` VALUES (1,'FAC-000001',1,90500.00,5000.00,95500.00,'2026-07-15 23:02:14'),(2,'FAC-000002',2,90500.00,5000.00,95500.00,'2026-07-15 23:32:48'),(3,'FAC-000003',4,154000.00,8000.00,162000.00,'2026-07-15 23:39:34'),(4,'FAC-000004',3,115500.00,8000.00,123500.00,'2026-07-15 23:40:39'),(5,'FAC-000005',13,112000.00,0.00,112000.00,'2026-07-16 21:20:03'),(6,'FAC-000006',14,119000.00,5000.00,124000.00,'2026-07-16 21:23:56'),(7,'FAC-000007',16,29000.00,2900.00,31900.00,'2026-07-16 22:56:54'),(8,'FAC-000008',17,34000.00,0.00,34000.00,'2026-07-16 22:57:22'),(9,'FAC-000009',18,102500.00,2000.00,104500.00,'2026-07-16 23:01:42'),(10,'FAC-000010',19,56000.00,5600.00,61600.00,'2026-07-16 23:02:42'),(11,'FAC-000011',20,63000.00,0.00,63000.00,'2026-07-16 23:03:33'),(12,'FAC-000012',22,26000.00,2600.00,28600.00,'2026-07-17 05:22:23'),(13,'FAC-000013',23,34000.00,3400.00,37400.00,'2026-07-17 05:26:26');

UNLOCK TABLES;

DROP TABLE IF EXISTS `idempotency_keys`;

CREATE TABLE `idempotency_keys` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `idempotency_key` varchar(255) NOT NULL,
  `endpoint` varchar(100) NOT NULL,
  `response` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`response`)),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `idempotency_key` (`idempotency_key`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

LOCK TABLES `idempotency_keys` WRITE;

INSERT INTO `idempotency_keys` VALUES (1,'123456','/facturas','{\"mensaje\":\"Factura creada correctamente\",\"factura_id\":2,\"codigo\":\"FAC-000002\",\"subtotal\":90500,\"propina\":5000,\"total\":95500,\"metodo_pago\":\"EFECTIVO\"}','2026-07-15 23:32:48'),(2,'123457','/facturas','{\"mensaje\":\"Factura creada correctamente\",\"factura_id\":3,\"codigo\":\"FAC-000003\",\"subtotal\":154000,\"propina\":8000,\"total\":162000,\"metodo_pago\":\"TRANSFERENCIA\"}','2026-07-15 23:39:34'),(3,'123459','/facturas','{\"mensaje\":\"Factura creada correctamente\",\"factura_id\":4,\"codigo\":\"FAC-000004\",\"subtotal\":115500,\"propina\":8000,\"total\":123500,\"metodo_pago\":\"TRANSFERENCIA\"}','2026-07-15 23:40:39'),(4,'11111','/facturas','{\"mensaje\":\"Factura creada correctamente\",\"factura_id\":5,\"codigo\":\"FAC-000005\",\"subtotal\":112000,\"propina\":0,\"total\":112000,\"pagos\":[{\"metodo_pago\":\"EFECTIVO\",\"valor\":36500},{\"metodo_pago\":\"TARJETA\",\"valor\":75500}]}','2026-07-16 21:20:03'),(5,'111112','/facturas','{\"mensaje\":\"Factura creada correctamente\",\"factura_id\":6,\"codigo\":\"FAC-000006\",\"subtotal\":119000,\"propina\":5000,\"total\":124000,\"pagos\":[{\"metodo_pago\":\"TARJETA\",\"valor\":124000}]}','2026-07-16 21:23:56'),(6,'42b95f53-09ec-46ca-9415-246dde8ad9d4','/facturas','{\"mensaje\":\"Factura creada correctamente\",\"factura_id\":7,\"codigo\":\"FAC-000007\",\"subtotal\":29000,\"propina\":2900,\"total\":31900,\"pagos\":[{\"metodo_pago\":\"EFECTIVO\",\"valor\":31900}]}','2026-07-16 22:56:54'),(7,'6dae5a47-8751-44f1-8207-7e995a84f780','/facturas','{\"mensaje\":\"Factura creada correctamente\",\"factura_id\":8,\"codigo\":\"FAC-000008\",\"subtotal\":34000,\"propina\":0,\"total\":34000,\"pagos\":[{\"metodo_pago\":\"EFECTIVO\",\"valor\":20000},{\"metodo_pago\":\"TRANSFERENCIA\",\"valor\":14000}]}','2026-07-16 22:57:22'),(8,'50cb6eb2-7feb-4b0d-adaa-3a9b7e0e5f41','/facturas','{\"mensaje\":\"Factura creada correctamente\",\"factura_id\":9,\"codigo\":\"FAC-000009\",\"subtotal\":102500,\"propina\":2000,\"total\":104500,\"pagos\":[{\"metodo_pago\":\"EFECTIVO\",\"valor\":50000},{\"metodo_pago\":\"TRANSFERENCIA\",\"valor\":54500}]}','2026-07-16 23:01:42'),(9,'3d0d7176-6f6a-41bf-af74-75a4d11afbeb','/facturas','{\"mensaje\":\"Factura creada correctamente\",\"factura_id\":10,\"codigo\":\"FAC-000010\",\"subtotal\":56000,\"propina\":5600,\"total\":61600,\"pagos\":[{\"metodo_pago\":\"TARJETA\",\"valor\":61600}]}','2026-07-16 23:02:42'),(10,'71c1dbaa-27e5-4fcd-9394-3e963df48b1d','/facturas','{\"mensaje\":\"Factura creada correctamente\",\"factura_id\":11,\"codigo\":\"FAC-000011\",\"subtotal\":63000,\"propina\":0,\"total\":63000,\"pagos\":[{\"metodo_pago\":\"EFECTIVO\",\"valor\":34000},{\"metodo_pago\":\"TRANSFERENCIA\",\"valor\":29000}]}','2026-07-16 23:03:33'),(11,'7081ee8e-1064-4b56-ba29-9680b92443f2','/facturas','{\"mensaje\":\"Factura creada correctamente\",\"factura_id\":12,\"codigo\":\"FAC-000012\",\"subtotal\":26000,\"propina\":2600,\"total\":28600,\"pagos\":[{\"metodo_pago\":\"TARJETA\",\"valor\":28600}]}','2026-07-17 05:22:23'),(12,'85c89c76-996e-4f1f-b2a3-25299f93d0e9','/facturas','{\"mensaje\":\"Factura creada correctamente\",\"factura_id\":13,\"codigo\":\"FAC-000013\",\"subtotal\":34000,\"propina\":3400,\"total\":37400,\"pagos\":[{\"metodo_pago\":\"TARJETA\",\"valor\":37400}]}','2026-07-17 05:26:26');

UNLOCK TABLES;

DROP TABLE IF EXISTS `pagos`;

CREATE TABLE `pagos` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `factura_id` bigint(20) NOT NULL,
  `metodo_pago` enum('EFECTIVO','TARJETA','TRANSFERENCIA') NOT NULL,
  `valor` decimal(10,2) NOT NULL CHECK (`valor` > 0),
  `fecha_pago` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `fk_factura_pago` (`factura_id`),
  CONSTRAINT `fk_factura_pago` FOREIGN KEY (`factura_id`) REFERENCES `facturas` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

LOCK TABLES `pagos` WRITE;

INSERT INTO `pagos` VALUES (1,5,'EFECTIVO',36500.00,'2026-07-16 21:20:03'),(2,5,'TARJETA',75500.00,'2026-07-16 21:20:03'),(3,6,'TARJETA',124000.00,'2026-07-16 21:23:56'),(4,7,'EFECTIVO',31900.00,'2026-07-16 22:56:54'),(5,8,'EFECTIVO',20000.00,'2026-07-16 22:57:22'),(6,8,'TRANSFERENCIA',14000.00,'2026-07-16 22:57:22'),(7,9,'EFECTIVO',50000.00,'2026-07-16 23:01:42'),(8,9,'TRANSFERENCIA',54500.00,'2026-07-16 23:01:42'),(9,10,'TARJETA',61600.00,'2026-07-16 23:02:42'),(10,11,'EFECTIVO',34000.00,'2026-07-16 23:03:33'),(11,11,'TRANSFERENCIA',29000.00,'2026-07-16 23:03:33'),(12,12,'TARJETA',28600.00,'2026-07-17 05:22:23'),(13,13,'TARJETA',37400.00,'2026-07-17 05:26:26');

UNLOCK TABLES;