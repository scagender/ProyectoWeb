# grupo_Portal-Uc_backend

Para correr:

- Instalar docker y docker-compose
- Correr comando `docker-compose up -d`. Podrias correr solo `docker-compose up`, pero la terminal quedaria bloqueada reportando el runtime del compose, `d` es abreviado de `detached`. La unica consideracion que hay que tener es que hay que recordar detener el backend manualmente cuando se quiera dejar de correr, si no sigue corriendo por detras.
- Listo, el backend esta escuchando en los puertos especificados en el `docker-compose`!.
   - Actualmente los puertos expuestos son:
     -  `koa`: puerto 3000
     -  `postgres`: puerto 5432


Para que el programa funcione correctamente hay que crear el usuario admin primero, ya que al crearlo se crean las mallas base. El admin debe tener mail planner@uc.cl y debe ser el primer usuario creado. Luego, no hay restricciones.

_Eslint_
Correrlo en backend: primero ./node_modules/.bin/eslint --init, se elige check syntax, find problems and enforce code style, JavaScript modules, None, No typescript, Node, use a popular guide, Standard, JSON. Luego correr ./node_modules/.bin/eslint . --fix

PS C:\Users\juamp\OneDrive\Escritorio\ProyectoWeb> ./node_modules/.bin/eslint --init 
You can also run this command directly using 'npm init @eslint/config'.
√ How would you like to use ESLint? · style
√ What type of modules does your project use? · esm
√ Which framework does your project use? · react
√ Does your project use TypeScript? · No / Yes
√ Where does your code run? · browser
√ How would you like to define a style for your project? · guide
√ Which style guide do you want to follow? · standard
√ What format do you want your config file to be in? · JSON
Checking peerDependencies of eslint-config-standard@latest
The config that you've selected requires the following dependencies:

eslint-plugin-react@latest eslint-config-standard@latest eslint@^8.0.1 eslint-plugin-import@^2.25.2 eslint-plugin-n@^15.0.0 || ^16.0.0  eslint-plugin-promise@^6.0.0
√ Would you like to install them now? · No / Yes
√ Which package manager do you want to use? · npm