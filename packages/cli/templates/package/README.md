crie os arquivos `.gitignore` e `.npmignore`.

file: `.npmignore`:
```.npmignore
/node_modules
/playground
/src
/tests
/build.ts
/tsconfig.json
package-lock.json

.env
.env.*
```

file: `.gitignore`:
```.gitignore
# Dependencies
node_modules

# Build
dist

# Logs
*.log
logs

# Environment
.env
.env.local
.env.development.local
.env.production.local

# Bun
bun.lock
bun.lockb

# IDE
.vscode
.idea

# OS
.DS_Store
Thumbs.db

# Coverage
coverage

# TypeScript
*.tsbuildinfo
``` 