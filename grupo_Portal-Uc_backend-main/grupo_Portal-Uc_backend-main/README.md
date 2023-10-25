# grupo_Portal-Uc_backend

Para correr:

- Instalar docker y docker-compose
- Correr comando `docker-compose up -d`. Podrias correr solo `docker-compose up`, pero la terminal quedaria bloqueada reportando el runtime del compose, `d` es abreviado de `detached`. La unica consideracion que hay que tener es que hay que recordar detener el backend manualmente cuando se quiera dejar de correr, si no sigue corriendo por detras.
- Listo, el backend esta escuchando en los puertos especificados en el `docker-compose`!.
   - Actualmente los puertos expuestos son:
     -  `koa`: puerto 3000
     -  `postgres`: puerto 5432