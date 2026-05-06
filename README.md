# Test-VTC API

![CI](https://github.com/khilairet/test-vtc/workflows/CI/badge.svg)
![Version](https://img.shields.io/badge/version-1.0.0-blue)
![Node](https://img.shields.io/badge/node-20.x-brightgreen)
![License](https://img.shields.io/badge/license-Private-red)

API REST en TypeScript avec Fastify et une architecture DDD.

- Choix de Fastify pour rester proche de la stack de l'entreprise.
- Architecture DDD avec factories pour moduler facilement providers, logique métier et dépendances.

Note: n’ayant pas utilisé Fastify auparavant, certains choix d’architecture peuvent être perfectibles.

## Prérequis

- Node.js 20.x (LTS)
- npm
- Docker + Docker Compose (optionnel, pour le mode conteneurisé)

## Variables d'environnement

Copier et renommer le fichier `.env.sample` en `.env` puis renseigner les valeurs :

```
SERVER_PORT=8080
OPENWEATHER_API_KEY=
```

- `SERVER_PORT` : port HTTP (par défaut 8080)
- `OPENWEATHER_API_KEY` : clé API OpenWeather utilisée par le provider météo

## JSON Condition

Un service dédié évalue un JSON de restrictions de promocode. Il est implémenté sous forme de classe statique pour limiter l’overhead d’instanciation. L’option `worker_threads` a été envisagée pour traiter des lots, mais jugée non pertinente au vu de la taille des règles traitées.

Exemples d’opérateurs supportés: `and`, `or`, `date.after/before`, `age.eq/lt/gt`, `weather.is`, `weather.temp.gt`.

## Améliorations possibles

- Lisibilité et performances du moteur « JSON Condition »
- Meilleure intégration via plugins Fastify (services, repositories)
- Middleware d’authentification (JWT, API key…)
- IoC/DI (`reflect-metadata`, `typedi`) si la complexité augmente
- Ajout d'un OpenAPI/Swagger

## Architecture (DDD)

- Domaine: entités et règles métier (ex: `discount`, `JsonCondition`)
- Application: cas d’usage et orchestration (services)
- Interfaces: controllers, routes, DTO
- Infrastructure: serveur HTTP, providers externes (météo), dépôts en mémoire

Arborescence clé: `src/domain`, `src/application`, `src/infrastructure`, `src/interfaces`.

## Installation (sans Docker)

1. Installer les dépendances :

```bash
npm install
```

2. Compiler :

```bash
npm run build
```

## Démarrage (sans Docker)

- Mode développement (ts-node) :

```bash
npm run dev
```

- Mode production (après build) :

```bash
npm start
```

## Installation et démarrage avec Docker

- Construire l'image et démarrer en arrière-plan :

```bash
npm run docker:build
npm run docker:up
```

- Arrêter et nettoyer :

```bash
npm run docker:down
```

Les commandes ci-dessus s'appuient sur `docker-compose.yml` (port par défaut 8080).

## Endpoints principaux

J'ai créé 2 endpoints (`GET /discount/:name`, `POST /discount/validate`) pour la vérification d'un promocode ne sachant pas le meilleur format. J'ai une préférence pour le `validate` qui permet d'être plus exhaustif.

Base: `http://localhost:8080`

- POST `/discount` (créer un promocode)

  - Body:
    ```json
    {
      "name": "WeatherCode",
      "advantage": { "percent": 20 },
      "restrictions": [
        { 
          "date": { 
            "after": "2019-01-01", 
            "before": "2026-06-30" 
          } 
        },
        {
          "or": [
            { "age": { "eq": 40 } },
            {
              "and": [
                { "age": { "lt": 30, "gt": 15 } }, 
                { 
                  "weather": {
                     "is": "clear", "temp": { "gt": 15 } 
                  } 
                }
              ]
            }
          ]
        }
      ]
    }
    ```
  - Réponses:
    - 201 Created, JSON du promocode
    - 400 en cas de payload invalide

- GET `/discount/:name?age={number}&town={string}` (valider un promocode)

  - Exemple: `/discount/WeatherCode?age=25&town=Paris`
  - Réponses:
    ```json
    { "status": "accepted", "advantage": { "percent": 20 } }
    ```
    ou
    ```json
    { "status": "denied" }
    ```
    - 404 si le promocode n’existe pas

- POST `/discount/validate` (valider via body)
  - Body:
    ```json
    { "promocode_name": "WeatherCode", "arguments": { "age": 25, "town": "Paris" } }
    ```
  - Réponses: même format que l’endpoint GET

### Exemples cURL

```bash
# Création
curl -X POST http://localhost:8080/discount \
  -H "Content-Type: application/json" \
  -d '{
    "name": "WeatherCode",
    "advantage": { "percent": 20 },
    "restrictions": [ { "date": { "after": "2019-01-01", "before": "2026-06-30" } } ]
  }'

# Validation par query
curl "http://localhost:8080/discount/WeatherCode?age=25&town=Paris"

# Validation par body
curl -X POST http://localhost:8080/discount/validate \
  -H "Content-Type: application/json" \
  -d '{ "promocode_name": "WeatherCode", "arguments": { "age": 25, "town": "Paris" } }'
```

## Lancer les tests

- Tests unitaires et e2e :

```bash
npm test
```

- Watch mode :

```bash
npm run test:watch
```

- Couverture :

```bash
npm run test:coverage
```

Le rapport de couverture est disponible dans `coverage/`.
