# 📊 Imputation des Données Manquantes — Application Interactive

> Application web pédagogique pour comprendre, visualiser et comparer les méthodes d'imputation des données manquantes.

---

## 🎯 Description

Cette application permet aux étudiants et praticiens en Data Science de **visualiser en temps réel** l'effet de chaque méthode d'imputation sur un dataset, sans écrire une seule ligne de code.

---

## ✨ Fonctionnalités

- 🔬 **Onglet Démo** — Choisissez une variable et une méthode, observez instantanément les valeurs imputées surlignées dans le tableau
- 📊 **Onglet Comparaison** — Toutes les méthodes côte à côte avec statistiques (moyenne, écart-type, N)
- 🐍 **Onglet Python** — Formule mathématique + code `sklearn`/`pandas` prêt à copier pour chaque méthode

---

## 🧮 Méthodes implémentées

| Méthode | Icône | Cas d'usage |
|---|---|---|
| Données brutes | ⚠️ | Visualisation de l'état original |
| Moyenne | μ | Exploration rapide, taux < 5% |
| Médiane | M | Données avec outliers |
| Mode | Mo | Variables catégorielles |
| K-Nearest Neighbors | K | Usage général, taux < 30% |
| MICE | ∞ | Analyse formelle, taux < 50% |
| Interpolation Linéaire | ∿ | Séries temporelles |
| Suppression (Listwise) | ✕ | MCAR uniquement |

---

## 🚀 Installation et lancement

### Prérequis
- Node.js ≥ 18
- npm ≥ 9

### Étapes

```bash
# 1. Cloner le projet
git clone https://github.com/ton-username/mon-projet.git

# 2. Accéder au dossier
cd mon-projet

# 3. Installer les dépendances
npm install

# 4. Lancer en développement
npm run dev
```

L'application sera disponible sur `http://localhost:5173`

---

## 🏗️ Stack technique

| Technologie | Rôle |
|---|---|
| **React 18** | Framework UI |
| **Vite** | Bundler et serveur de développement |
| **JavaScript ES6+** | Algorithmes d'imputation (from scratch) |
| **CSS-in-JS** | Styles inline |
| **Google Fonts** | Typographie (Fraunces + DM Mono) |

---

## 📁 Structure du projet

```
src/
├── App.jsx          # Composant principal + tous les algorithmes
├── App.css          # Styles globaux
├── main.jsx         # Point d'entrée React
└── index.css        # Reset CSS
```

---

## 📐 Algorithmes implémentés

Tous les calculs sont effectués en JavaScript pur dans `App.jsx` :

- `calcMean()` — Moyenne arithmétique
- `calcMedian()` — Médiane avec tri
- `calcMode()` — Mode par fréquence
- `knnImpute()` — K-NN avec distance euclidienne normalisée
- `miceImpute()` — MICE simplifié (3 itérations, régression multivariée)
- `interpolationImpute()` — Interpolation linéaire séquentielle

---

## 📦 Librairies Python (onglet code)

Le code Python présenté dans l'application utilise :

```bash
pip install pandas numpy scikit-learn
pip install fancyimpute
pip install missingno
pip install matplotlib seaborn
```

---

## 🎓 Contexte académique

Projet réalisé dans le cadre d'une présentation sur le thème :
**"Imputation des données manquantes : méthodes et comparaison"**

---

## 👤 Auteure

**EDDRIOUCH AYA**
- LinkedIn : [www.linkedin.com/in/aya-eddriouch](https://www.linkedin.com/in/aya-eddriouch/)

---
