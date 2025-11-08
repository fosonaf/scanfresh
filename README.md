# Scanfresh

## Description

Scanfresh est une application web qui permet de gérer votre bibliothèque numérique de mangas. L'application vous offre la possibilité de télécharger des pages web contenant des images de mangas, de les compiler en fichiers PDF et de les organiser dans votre bibliothèque personnelle.

### Fonctionnalités principales

- **Compilation de mangas en PDF** : Téléchargez et compilez automatiquement des images de mangas depuis des URLs de pages web en fichiers PDF
- **Gestion de bibliothèque** : Sauvegardez, organisez et gérez votre collection de mangas numériques
- **Téléchargement de PDFs** : Téléchargez vos mangas compilés depuis votre bibliothèque
- **Suppression de fichiers** : Supprimez les mangas de votre bibliothèque lorsque nécessaire

## Technologies utilisées

### Frontend
- React 19
- TypeScript
- Vite
- TailwindCSS
- React Router

### Backend
- Node.js
- Express
- TypeScript
- MongoDB (GridFS pour le stockage des PDFs)
- Python (script de téléchargement et compilation d'images)

## Prérequis

- Node.js (version 18 ou supérieure)
- Python 3 (avec pip)
- MongoDB (local ou via Docker)
- npm ou yarn

## Démarrer le serveur

```bash
cd server
npm run dev
```

Le serveur sera accessible sur `http://localhost:3001`

## Démarrer le client (dans un autre terminal)

```bash
cd client
npm run dev
```

Le client sera accessible sur `http://localhost:5173` (ou un autre port si 5173 est occupé)

## Utilisation

1. Accédez à l'application via votre navigateur
2. Naviguez vers la page "Compile to PDF"
3. Entrez un titre pour votre manga (optionnel)
4. Collez les URLs des pages web contenant les images de mangas (une URL par ligne)
5. Cliquez sur "Submit" pour télécharger directement le PDF, ou sur "Save PDF" pour l'ajouter à votre bibliothèque
6. Accédez à la page "Downloads" pour voir, télécharger ou supprimer les mangas de votre bibliothèque

## Notes

- Il est recommandé de ne pas compiler plus de 4 URLs à la fois pour éviter les problèmes de performance
- Les PDFs sont stockés dans MongoDB GridFS
