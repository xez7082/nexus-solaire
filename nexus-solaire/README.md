# ☀️ Nexus Solaire

Trois tableaux de bord solaires plein écran (style HUD) pour Home Assistant, pensés pour tablettes murales :

| Page | Contenu |
|---|---|
| **Prévisions solaires** | trajectoire du soleil, azimut/élévation, prévisions Solcast, météo, vent, lune |
| **Centrale solaire** | production par installation, consommation, réseau, parc de batteries, objectif mensuel |
| **Économies solaires** | gains du jour / mois / année, amortissement, date de rentabilité |

**Tu utilises tes propres capteurs** : rien n'est écrit en dur. Chaque page a un bouton ⚙ qui liste tes entités.

## Installation

1. HACS → ⋮ → **Dépôts personnalisés** → colle l'URL de ce dépôt, catégorie **Intégration**.
2. Télécharge **Nexus Solaire**, puis **redémarre** Home Assistant.
3. *Paramètres → Appareils et services → Ajouter une intégration → Nexus Solaire*.
4. Trois onglets apparaissent dans la barre latérale.

## Configuration des capteurs

Au premier lancement de chaque page, l'écran de réglages s'ouvre tout seul (ensuite : bouton ⚙ en bas à droite).
Tape quelques lettres : la liste de **tes** entités se propose. Clique sur **Enregistrer**.

- Les réglages sont stockés dans le navigateur de l'appareil : ils survivent aux mises à jour HACS.
- Pour une autre tablette : copie le **JSON** en bas de l'écran ⚙, puis colle-le avec « Appliquer le JSON ».
- Les pages « Centrale solaire » demandent aussi la liste de tes installations (`PLANTS`) et de tes batteries (`CELLS`) en JSON, avec un exemple pré-rempli.

### Capteurs attendus

| Page | Rôle | Unité attendue |
|---|---|---|
| Prévisions | azimut, élévation | ° (intégration *Sun*, active par défaut) |
| Prévisions | pic / total du jour | kW / kWh (intégration *Solcast PV Forecast*) |
| Prévisions | météo, vent, lune | `weather.*`, km/h, `sensor.moon_phase` |
| Centrale | production totale, conso maison, réseau, import/export | W |
| Centrale | production jour / mois, objectifs | kWh |
| Centrale | gains jour / mois / année | € |
| Centrale | batteries : SOC, puissance, température, énergie stockée | %, W, °C, kWh ou Wh |
| Économies | gains (jour, mois, année, net annuel), tarif | €, €/kWh |

Les capteurs de **gain** sont des capteurs *template* à créer toi-même : voir `examples/template_sensors.yaml`.
Les valeurs d'investissement (coût panneaux/batteries, durées, abonnement) se règlent aussi dans ⚙.

## Authentification et sécurité

Les pages sont servies par Home Assistant lui-même : elles réutilisent la **session déjà ouverte** dans le navigateur
(aucun jeton à saisir). Si l'appareil n'est pas connecté à HA, la page demande un jeton longue durée, gardé localement.

> ⚠️ Ne colle **jamais** de jeton dans un fichier HTML ni dans un dépôt public.

## Dépannage

- *Valeurs « -- »* : l'entité choisie n'existe pas ou n'est pas numérique → vérifie-la dans ⚙.
- *Page vide / 404* : redémarre HA après l'installation, et vérifie que l'intégration est ajoutée.
- *Réinitialiser une page* : ⚙ → « Valeurs par défaut ».

Licence MIT.
