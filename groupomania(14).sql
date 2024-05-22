-- SQLBook: Code
-- phpMyAdmin SQL Dump
-- version 5.2.0
-- https://www.phpmyadmin.net/
--
-- Hôte : 127.0.0.1:3306
-- Généré le : dim. 04 juin 2023 à 12:00
-- Version du serveur : 8.0.31
-- Version de PHP : 8.0.26

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de données : `groupomania`
--

-- --------------------------------------------------------

--
-- Structure de la table `commentaires`
--

DROP TABLE IF EXISTS `commentaires`;
CREATE TABLE IF NOT EXISTS `commentaires` (
  `idComment` int NOT NULL AUTO_INCREMENT,
  `idMessage` int NOT NULL,
  `PostTexte` varchar(230) DEFAULT NULL,
  `PostImg` varchar(255) DEFAULT NULL,
  `PostDate` datetime DEFAULT NULL,
  `idUser` int NOT NULL,
  PRIMARY KEY (`idComment`),
  KEY `idUser` (`idUser`),
  KEY `idMessage` (`idMessage`)
) ENGINE=InnoDB AUTO_INCREMENT=30 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `commentaires`
--

INSERT INTO `commentaires` (`idComment`, `idMessage`, `PostTexte`, `PostImg`, `PostDate`, `idUser`) VALUES
(1, 2, 'On Dit Oui Chef !', NULL, '2023-05-29 00:00:00', 1),
(2, 2, 'Et on touche pas a l\'index !', NULL, '2023-05-29 00:00:00', 1),
(3, 2, 'Bon courage les gars', NULL, '2023-05-29 20:00:36', 3),
(4, 3, '', NULL, '2023-05-29 20:09:47', 3),
(5, 3, '', NULL, '2023-05-29 20:10:01', 1),
(6, 3, 'Hello', NULL, '2023-05-29 21:56:26', 1),
(7, 2, 'dsqd', NULL, '2023-05-29 22:03:39', 1);

-- --------------------------------------------------------

--
-- Structure de la table `dislikes`
--

DROP TABLE IF EXISTS `dislikes`;
CREATE TABLE IF NOT EXISTS `dislikes` (
  `idDislike` int NOT NULL AUTO_INCREMENT,
  `UserDislike` int DEFAULT NULL,
  `PostDislike` int DEFAULT NULL,
  PRIMARY KEY (`idDislike`),
  KEY `UserDislike` (`UserDislike`),
  KEY `PostDislike` (`PostDislike`)
) ENGINE=InnoDB AUTO_INCREMENT=53 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `dislikes`
--

INSERT INTO `dislikes` (`idDislike`, `UserDislike`, `PostDislike`) VALUES
(44, 1, 3);

-- --------------------------------------------------------

--
-- Structure de la table `likes`
--

DROP TABLE IF EXISTS `likes`;
CREATE TABLE IF NOT EXISTS `likes` (
  `idLike` int NOT NULL AUTO_INCREMENT,
  `UserLike` int DEFAULT NULL,
  `PostLike` int DEFAULT NULL,
  PRIMARY KEY (`idLike`),
  KEY `UserLike` (`UserLike`),
  KEY `PostLike` (`PostLike`)
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `likes`
--

INSERT INTO `likes` (`idLike`, `UserLike`, `PostLike`) VALUES
(8, 1, 2),
(11, 1, 12),
(12, 1, 2),
(15, 7, 17),
(16, 1, 4);

-- --------------------------------------------------------

--
-- Structure de la table `messages`
--

DROP TABLE IF EXISTS `messages`;
CREATE TABLE IF NOT EXISTS `messages` (
  `idMessage` int NOT NULL AUTO_INCREMENT,
  `MessageText` varchar(230) DEFAULT NULL,
  `MessageDate` datetime DEFAULT NULL,
  `idUser` int NOT NULL,
  `MessageImage` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`idMessage`),
  KEY `idUser` (`idUser`)
) ENGINE=InnoDB AUTO_INCREMENT=22 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `messages`
--

INSERT INTO `messages` (`idMessage`, `MessageText`, `MessageDate`, `idUser`, `MessageImage`) VALUES
(2, 'Bienvenue Petit Kenzo N\'oublie pas de faire l\'update sépare les controleurs de l\'update email & password de celui de l\'image de l\'utilisateur . Je serais dispo dans la soirée si tu veut pas avant malheureusement💻 ', '2023-05-29 00:28:29', 1, NULL),
(3, 'Hello guys ! It\'s a sunny day today 😊 !', '2023-05-29 20:01:52', 3, '1685383312600-mWDEa.jpg'),
(4, 'Coucou', '2023-05-30 00:10:25', 1, NULL),
(17, 'JE PEUT OUUUUUUUUUUU QUE LES PTIT ??????\r\n', '2023-06-01 23:08:21', 7, '1685653701049-UlP2r.jpeg'),
(18, 'ggggg', '2023-06-02 01:22:40', 7, NULL),
(19, '.', '2023-06-02 10:00:20', 1, NULL),
(20, 'jnjnk,\r\n', '2023-06-02 15:47:36', 7, NULL),
(21, 'Coucou', '2023-06-03 19:54:36', 1, '1685814876792-V8ec0.jpg');

-- --------------------------------------------------------

--
-- Structure de la table `users`
--

DROP TABLE IF EXISTS `users`;
CREATE TABLE IF NOT EXISTS `users` (
  `idUser` int NOT NULL AUTO_INCREMENT,
  `UserName` varchar(45) NOT NULL,
  `UserEmail` varchar(150) NOT NULL,
  `UserPassword` varchar(150) NOT NULL,
  `UserProfileImage` varchar(255) DEFAULT 'defaultimg.jpg',
  `UserRoles` varchar(45) DEFAULT NULL,
  PRIMARY KEY (`idUser`),
  UNIQUE KEY `UserEmail_UNIQUE` (`UserEmail`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `users`
--

INSERT INTO `users` (`idUser`, `UserName`, `UserEmail`, `UserPassword`, `UserProfileImage`, `UserRoles`) VALUES
(1, 'Aymerick', 'aymericksh@gmail.com', '$2a$08$zgE52.aKmtZ.K3BbmzimPu7rAtAFIRuxuibhuiz7gRyLJqHoSeGde', 'images.jpg', 'admin'),
(3, 'ninilarageuse', 'luismidream@hotmail.com', '$2a$08$vcQfVlgNjebqGgdCzNGiputtKKzHbhIevV5VpGV92zvvM/DIycfgq', 'defaultimg.jpg ', 'admin'),
(5, 'Test', 'test@test.test', '$2a$08$lKjGp/F0orrAZXKr5Ak2x.OTPDU1zSVm/WwalJrDAJcZzoOP/vMtC', 'defaultimg.jpg', NULL),
(7, 'Kenzo', 'kenzotanougast@gmail.com', '$2a$08$UmxDj8G/ufib62H9KJyX3eSdDbQhmtsnHxERbBRFvhpXO1c6JurcO', '1685653678780-pviBd.jpg', 'admin');

--
-- Contraintes pour les tables déchargées
--

--
-- Contraintes pour la table `commentaires`
--
ALTER TABLE `commentaires`
  ADD CONSTRAINT `fk_commentaires_messages` FOREIGN KEY (`idMessage`) REFERENCES `messages` (`idMessage`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_commentaires_users` FOREIGN KEY (`idUser`) REFERENCES `users` (`idUser`) ON DELETE CASCADE;

--
-- Contraintes pour la table `messages`
--
ALTER TABLE `messages`
  ADD CONSTRAINT `fk_messages_users` FOREIGN KEY (`idUser`) REFERENCES `users` (`idUser`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
