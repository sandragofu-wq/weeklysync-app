# WeeklySync 🚀

Plataforma interactiva para reuniones de equipo semanales.

---

## Cómo subir a GitHub Pages (paso a paso)

### 1. Crea el repositorio en GitHub
- Ve a https://github.com/new
- Nombre: `weeklysync`
- Visibilidad: **Public** (necesario para GitHub Pages gratis)
- **No** marques "Initialize repository"
- Haz clic en **Create repository**

### 2. Sube los archivos desde tu ordenador

Abre una terminal en la carpeta del proyecto y ejecuta:

```bash
git init
git add .
git commit -m "first commit"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/weeklysync.git
git push -u origin main
```

> ⚠️ Cambia `TU_USUARIO` por tu nombre de usuario de GitHub

### 3. Activa GitHub Pages
- Ve a tu repo → **Settings** → **Pages**
- En "Source" selecciona **GitHub Actions**
- Guarda

### 4. Espera 1-2 minutos
GitHub compilará y publicará la app automáticamente.  
Tu link será: `https://TU_USUARIO.github.io/weeklysync/`

---

## Para actualizar la app

Cada vez que hagas cambios y los subas con `git push`, GitHub Pages se actualiza solo en 1-2 minutos.

```bash
git add .
git commit -m "descripción del cambio"
git push
```

---

## Desarrollo local

```bash
npm install
npm run dev
```

Abre http://localhost:5173
