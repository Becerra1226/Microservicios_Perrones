
CREATE DATABASE IF NOT EXISTS `perrones`;
USE `perrones`;
SET FOREIGN_KEY_CHECKS=0;

DROP TABLE IF EXISTS `productos`;

CREATE TABLE `productos` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(50) NOT NULL,
  `descripcion` text DEFAULT NULL,
  `precio` decimal(10,2) NOT NULL,
  `imagen` varchar(300) DEFAULT NULL,
  `categoria` enum('Perros','Perras','Desgranados/Salchipapa','Bebidas','Entradas','Postres','Domicilios','Extras') NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=47 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;


LOCK TABLES `productos` WRITE;

INSERT INTO `productos` VALUES (1,'El Callejero','Pan brioche, salchicha americana, queso, cebolla crispy, ripio y salsas.',26000.00,NULL,'Perros'),(2,'El divino','Pan brioche, salchicha americana, tocineta, 2 huevos de codorniz, queso, cebolla crispy, ripio y salsas.',30000.00,NULL,'Perros'),(3,'La Golosa','Pan brioche, doble salchicha americana, doble porci├│n de tocineta, 3 huevos de codorniz, triple porci├│n de queso, cebolla crispy, ripio y salsas.',34000.00,NULL,'Perros'),(4,'El Ardido','Pan brioche, salchicha americana, tocineta, queso, jalape├▒o, sriracha, cebolla crispy, ripio y salsas.',29000.00,NULL,'Perros'),(5,'El Perron','Pan brioche, salchicha americana, bondiola de cerdo, tocineta, queso, cebolla crispy, ripio y salsa bbq de la casa.',32000.00,NULL,'Perros'),(6,'La Resabiada','Pan brioche, salchicha americana, panceta, maduro, tocineta, queso, e huevos de codorniz, cebolla crispy, ripio y salsas.',35000.00,NULL,'Perros'),(7,'La Perroneta','Cuatro perros mini (callejero, divino, t├│xica y perr├│n)',56000.00,NULL,'Perros'),(8,'Perron Box','Kids perr├│n (pan, salchicha americana, queso y ripio), porci├│n de papas a la francesa, jugo hit y dos juguetes sorpresa.',26000.00,NULL,'Perros'),(9,'Desgranado Mixto','Ma├¡z dulce, carne, pollo, tocineta, queso, ripio, lechuga y salsa de la casa.',40000.00,NULL,'Desgranados/Salchipapa'),(19,'Desgranado de Pollo','Ma├¡z dulce, pollo, tocineta, queso, ripio, lechuga y salsa de la casa',40000.00,NULL,'Desgranados/Salchipapa'),(20,'Desgranado de Carne','Ma├¡z dulce, Carne, tocineta, queso, ripio, lechuga y salsa de la casa',44000.00,NULL,'Desgranados/Salchipapa'),(21,'salchipapa La Legendaria','Papas a la francesa, salchicha americana, triple porci├│n de queso, pollo, carne, panceta, ripio y salsas (tomate, mayonesa y salsa de la casa).',60500.00,NULL,'Desgranados/Salchipapa'),(22,'Maltada de Milo','',16000.00,NULL,'Postres'),(23,'Maltada de Frutos rojos','',16000.00,NULL,'Postres'),(24,'Brownie con helado','',18000.00,NULL,'Postres'),(25,'Tocineta','',3500.00,NULL,'Extras'),(26,'Huevos(Dos)','',2500.00,NULL,'Extras'),(27,'Queso','',3500.00,NULL,'Extras'),(28,'Carne Bondiola','',6000.00,NULL,'Extras'),(29,'Jalape├▒o','',2000.00,NULL,'Extras'),(30,'Salsa','',2000.00,NULL,'Extras'),(31,'Papas a la Francesa','',8500.00,NULL,'Extras'),(32,'Salchicha','',4500.00,NULL,'Extras'),(33,'Maduro','',2500.00,NULL,'Extras'),(34,'Coca Cola Regular','',7000.00,NULL,'Bebidas'),(35,'Coca Cola Zero','',7000.00,NULL,'Bebidas'),(36,'Ginger','',7000.00,NULL,'Bebidas'),(37,'Agua','',6000.00,NULL,'Bebidas'),(38,'Agua con Gas','',6000.00,NULL,'Bebidas'),(39,'Cerveza Germania','',10500.00,NULL,'Bebidas'),(40,'La Toxica','Pan brioche, triple porci├│n de tocineta, 2 huevos de codorniz, triple porci├│n de queso, cebolla crispy, ripio y salsas.',29000.00,NULL,'Perras'),(41,'La Creida','Pan brioche, triple porci├│n de tocineta, triple porci├│n de queso, chicharr├│n dulce, queso Philadelphia, cebolla crispy, ripio y salsas (BBQ Y CASA )',33500.00,NULL,'Perras'),(42,'La Consentida','Pan brioche, triple porci├│n de tocineta, triple porci├│n de queso, chicharr├│n, ma├¡z dulce, 2 huevos de codorniz, cebolla crispy, ripio y salsas.',33000.00,NULL,'Perras'),(43,'Mozarello','Palitos de mozzarella apanados. Acompa├▒ados con pasta de tomate.',20000.00,NULL,'Entradas'),(44,'Papas Perronas','Papas a la francesa, queso mozzarella y tocineta.',20000.00,NULL,'Entradas'),(45,'Porky Perronas','Papas a la francesa, bondiola de cerdo (en salsa BBQ), queso mozzarella y tocineta.',26000.00,NULL,'Entradas'),(46,'Porky Perronas','Papas a la francesa, bondiola de cerdo (en salsa BBQ), queso mozzarella y tocineta.',26000.00,NULL,'Entradas');

UNLOCK TABLES;