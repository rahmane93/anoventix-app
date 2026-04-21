# Migration HTTP → HTTPS

## Contexte

L'API backend tourne sur un VPS (51.178.49.231) derrière un reverse proxy Nginx dans Docker.
L'app Android consommait l'API en HTTP, ce qui posait deux problèmes :
- Données transmises en clair
- Android 9+ bloque les requêtes HTTP en mode release par défaut

---

## Prérequis

- Domaine : `anoventix.com` (registrar OVH)
- VPS : `51.178.49.231`, user `deploy`
- Docker + Nginx déjà configurés (ports 80 et 443 exposés, volume `/etc/letsencrypt` monté)

---

## Étapes

### 1. Enregistrement DNS chez OVH

Dans l'interface OVH → **Web Cloud** → **Noms de domaine** → `anoventix.com` → **Zone DNS** :

| Type | Sous-domaine | Cible          |
|------|--------------|----------------|
| A    | api          | 51.178.49.231  |

Vérification propagation :
```bash
dig api.anoventix.com +short
# → 51.178.49.231
```

---

### 2. Certificat Let's Encrypt sur le VPS

```bash
ssh deploy@51.178.49.231

# Arrêter nginx pour libérer le port 80
cd ~/AnnoncesAPI && sudo docker compose stop nginx

# Obtenir le certificat
sudo certbot certonly --standalone \
  -d api.anoventix.com \
  --non-interactive \
  --agree-tos \
  -m admin@anoventix.com
```

Certificat généré dans :
- `/etc/letsencrypt/live/api.anoventix.com/fullchain.pem`
- `/etc/letsencrypt/live/api.anoventix.com/privkey.pem`

Expiration : 2026-07-20 (renouvellement automatique via cron certbot).

---

### 3. Configuration Nginx (`~/AnnoncesAPI/nginx/default.conf`)

```nginx
server {
    listen 80;
    server_name api.anoventix.com;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name api.anoventix.com;

    ssl_certificate /etc/letsencrypt/live/api.anoventix.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.anoventix.com/privkey.pem;

    location / {
        proxy_pass http://app:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Relancer nginx :
```bash
sudo docker compose start nginx
```

Vérification :
```bash
curl -s -o /dev/null -w "%{http_code}" https://api.anoventix.com/api/biens-immo/filter?page=0&size=1
# → 200
```

---

### 4. Mise à jour de l'app Android

**`.env`**
```diff
- EXPO_PUBLIC_API_URL=http://51.178.49.231:80
+ EXPO_PUBLIC_API_URL=https://api.anoventix.com
```

**`android/app/src/main/AndroidManifest.xml`**
```diff
- android:usesCleartextTraffic="true"
+ android:usesCleartextTraffic="false"
```

> `usesCleartextTraffic="true"` avait été ajouté temporairement pour contourner le blocage HTTP d'Android 9+. Il n'est plus nécessaire avec HTTPS.

Rebuild et installation :
```bash
cd android && ./gradlew assembleRelease
adb install -r app/build/outputs/apk/release/app-release.apk
```
