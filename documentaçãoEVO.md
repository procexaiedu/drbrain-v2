--- START OF FILE documentaçãoEVO.md ---

TITLE: Core Server Configuration Variables
DESCRIPTION: Essential environment variables for configuring the EvolutionAPI server's basic operation, including the server URL and WebSocket settings. These variables dictate how the API interacts with its environment and clients.
SOURCE: https://github.com/evolutionapi/docs-evolution/blob/main/v1/en/env.mdx#_snippet_0

LANGUAGE: APIDOC
CODE:
```
SERVER_URL: The address for your running server. This address is used to return internal request data, such as webhook links. (Example: https://example.evolution-api.com)
WEBSOCKET_ENABLED: Enable or disable WebSocket (Example: true)
WEBSOCKET_GLOBAL_EVENTS: Enable Websocket globally (Example: true)
CONFIG_SESSION_PHONE_CLIENT: Name that will be displayed on smartphone connection (Example: EvolutionAPI)
CONFIG_SESSION_PHONE_NAME: Browser name that will be displayed on smartphone connection (Example: Chrome)
```

----------------------------------------

TITLE: Instance Management Environment Variables
DESCRIPTION: Defines environment variables related to the automatic deletion of disconnected instances in EvolutionAPI.
SOURCE: https://github.com/evolutionapi/docs-evolution/blob/main/v2/en/env.mdx#_snippet_4

LANGUAGE: APIDOC
CODE:
```
DEL_INSTANCE: In how many minutes an instance will be deleted if not connected. Use "false" to never delete - Example: false
```

----------------------------------------

TITLE: Instance Management Environment Variables
DESCRIPTION: Details environment variables that control the lifecycle and deletion behavior of application instances, including automatic deletion policies for disconnected or temporary instances.
SOURCE: https://github.com/evolutionapi/docs-evolution/blob/main/v1/en/env.mdx#_snippet_8

LANGUAGE: APIDOC
CODE:
```
DEL_INSTANCE: In how many minutes an instance will be deleted if not connected. Use "false" to never delete.
DEL_TEMP_INSTANCES: Delete closed instances on startup
```

----------------------------------------

TITLE: QR Code Configuration
DESCRIPTION: Configures the behavior and appearance of generated QR codes, including their validity duration and visual color.
SOURCE: https://github.com/evolutionapi/docs-evolution/blob/main/v2/en/env.mdx#_snippet_9

LANGUAGE: APIDOC
CODE:
```
QRCODE_LIMIT: How long the QR code will last (Example: 30)
QRCODE_COLOR: Color of the generated QR code (Example: #175197)
```

----------------------------------------

TITLE: Server Configuration Environment Variables
DESCRIPTION: Defines environment variables for configuring the EvolutionAPI server, including type, port, and URL.
SOURCE: https://github.com/evolutionapi/docs-evolution/blob/main/v2/en/env.mdx#_snippet_0

LANGUAGE: APIDOC
CODE:
```
SERVER_TYPE: The type of server (http or https) - Example: http
SERVER_PORT: Port on which the server will run - Example: 8080
SERVER_URL: The address for your running server. This address is used to return data from internal requests, such as webhook links. - Example: https://example.evolution-api.com
```

----------------------------------------

TITLE: Logging Configuration Environment Variables
DESCRIPTION: Defines environment variables for configuring logging behavior in EvolutionAPI, including log levels and color settings.
SOURCE: https://github.com/evolutionapi/docs-evolution/blob/main/v2/en/env.mdx#_snippet_3

LANGUAGE: APIDOC
CODE:
```
LOG_LEVEL: Logs that will be displayed among: ERROR, WARN, DEBUG, INFO, LOG, VERBOSE, DARK, WEBHOOKS - Example: ERROR,WARN,DEBUG,INFO,LOG,VERBOSE,DARK,WEBHOOKS
LOG_COLOR: Whether or not to show colors in Logs (true or false) - Example: true
LOG_BAILEYS: Which Baileys logs will be displayed among: "fatal", "error", "warn", "info", "debug", "trace" - Example: error
```

----------------------------------------

TITLE: Authentication Configuration Variables
DESCRIPTION: Defines environment variables for API authentication, supporting JWT or API key methods, including key exposure, token expiration, and secret management.
SOURCE: https://github.com/evolutionapi/docs-evolution/blob/main/v1/en/env.mdx#_snippet_13

LANGUAGE: APIDOC
CODE:
```
AUTHENTICATION_TYPE:
  Description: Authentication type (jwt or apikey)
AUTHENTICATION_API_KEY:
  Description: API key to be used for authentication
AUTHENTICATION_EXPOSE_IN_FETCH_INSTANCES:
  Description: (No description provided in source)
AUTHENTICATION_JWT_EXPIRIN_IN:
  Description: JWT token expiration time
AUTHENTICATION_JWT_SECRET:
  Description: Secret used to generate the JWT
```

----------------------------------------

TITLE: Persistent Storage Data Saving Options
DESCRIPTION: Defines environment variables to control which types of data are saved to persistent storage in EvolutionAPI.
SOURCE: https://github.com/evolutionapi/docs-evolution/blob/main/v2/en/env.mdx#_snippet_6

LANGUAGE: APIDOC
CODE:
```
DATABASE_SAVE_DATA_INSTANCE: Saves instance data
DATABASE_SAVE_DATA_NEW_MESSAGE: Saves new messages
DATABASE_SAVE_MESSAGE_UPDATE: Saves message updates
DATABASE_SAVE_DATA_CONTACTS: Saves contacts
DATABASE_SAVE_DATA_CHATS: Saves chats
DATABASE_SAVE_DATA_LABELS: Saves labels
DATABASE_SAVE_DATA_HISTORIC: Saves event history
```

----------------------------------------

TITLE: Persistent Storage Configuration Environment Variables
DESCRIPTION: Defines environment variables for configuring persistent storage in EvolutionAPI, including database enablement, provider, connection URI, and client name.
SOURCE: https://github.com/evolutionapi/docs-evolution/blob/main/v2/en/env.mdx#_snippet_5

LANGUAGE: APIDOC
CODE:
```
DATABASE_ENABLED: Whether persistent storage is enabled (true or false) - Example: true
DATABASE_PROVIDER: Database provider (postgresql or mysql) - Example: postgresql
DATABASE_CONNECTION_URI: The database connection URI - Example: postgresql://user:pass@localhost:5432/evolution?schema=public
DATABASE_CONNECTION_CLIENT_NAME: Client name for the database connection, used to separate one API installation from another using the same database - Example: evolution_exchange
```

----------------------------------------

TITLE: Install NVM using cURL
DESCRIPTION: Downloads and executes the NVM installation script from GitHub. This command initiates the process of setting up NVM on your system.
SOURCE: https://github.com/evolutionapi/docs-evolution/blob/main/v2/en/install/nvm.mdx#_snippet_0

LANGUAGE: bash
CODE:
```
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
```

----------------------------------------

TITLE: OpenAPI v2 Root GET Endpoint Definition
DESCRIPTION: Defines the base GET endpoint ('/') for the API, adhering to the OpenAPI v2 specification. This endpoint is typically used to retrieve general information or the API's root resource.
SOURCE: https://github.com/evolutionapi/docs-evolution/blob/main/v2/api-reference/get-information.mdx#_snippet_0

LANGUAGE: APIDOC
CODE:
```
openapi: openapi-v2 GET /
```

----------------------------------------

TITLE: Get Instance Connection State API Endpoint
DESCRIPTION: This API endpoint allows you to query the current connection state of a specified instance. It is a GET request that requires the instance identifier as a path parameter to return its status.
SOURCE: https://github.com/evolutionapi/docs-evolution/blob/main/v2/api-reference/instance-controller/connection-state.mdx#_snippet_0

LANGUAGE: APIDOC
CODE:
```
API Endpoint:
  Method: GET
  Path: /instance/connectionState/{instance}
Parameters:
  - name: instance
    in: path
    type: string
    description: The unique identifier of the instance whose connection state is to be retrieved.
Returns:
  string: The current connection state of the instance (e.g., 'connected', 'disconnected', 'error').
```

----------------------------------------

TITLE: Define Evolution API v2 Service with Docker Compose
DESCRIPTION: This YAML configuration defines a Docker Compose service for Evolution API v2. It specifies the container name, image, restart policy, port mapping, environment file, and a volume for instances data. This setup is suitable for standalone deployments.
SOURCE: https://github.com/evolutionapi/docs-evolution/blob/main/v2/en/install/docker.mdx#_snippet_0

LANGUAGE: yaml
CODE:
```
version: '3.9'
services:
  evolution-api:
    container_name: evolution_api
    image: atendai/evolution-api:v2.1.1
    restart: always
    ports:
      - "8080:8080"
    env_file:
      - .env
    volumes:
      - evolution_instances:/evolution/instances

volumes:
  evolution_instances:
```

----------------------------------------

TITLE: Configure Nginx as Reverse Proxy for Evolution API
DESCRIPTION: Sets up Nginx to listen on port 80 and proxy all incoming requests to the Evolution API running on `http://127.0.0.1:8080`. It includes necessary headers for proper proxying, caching rules for static assets, and security measures to deny access to hidden files.
SOURCE: https://github.com/evolutionapi/docs-evolution/blob/main/v2/en/install/nginx.mdx#_snippet_3

LANGUAGE: nginx
CODE:
```
server {
  listen 80;
  listen [::]:80;
  server_name _;

  location / {
    proxy_pass http://127.0.0.1:8080;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_cache_bypass $http_upgrade;
  }

  location ~* \.(jpg|jpeg|gif|png|webp|svg|woff|woff2|ttf|css|js|ico|xml)$ {
    expires 360d;
  }

  location ~ /\.ht {
    deny all;
  }
}
```

----------------------------------------

TITLE: Pull Latest Docker Image for Evolution API
DESCRIPTION: This command pulls the most recent Docker image for the Evolution API from the `atendai/evolution-api` repository, ensuring you have the latest version available for deployment.
SOURCE: https://github.com/evolutionapi/docs-evolution/blob/main/v1/en/updates.mdx#_snippet_0

LANGUAGE: shell
CODE:
```
docker-compose pull atendai/evolution-api:latest
```

----------------------------------------

TITLE: Install AppArmor Utilities on Hetzner Server
DESCRIPTION: Updates the package list and installs 'apparmor-utils', a utility for managing AppArmor profiles, specifically for Hetzner servers.
SOURCE: https://github.com/evolutionapi/docs-evolution/blob/main/v2/en/install/docker.mdx#_snippet_15

LANGUAGE: bash
CODE:
```
sudo apt-get update && apt-get install -y apparmor-utils
```

----------------------------------------

TITLE: Install Redis Server on Ubuntu
DESCRIPTION: Updates package lists and installs the Redis server package on Ubuntu-based systems for a local Redis setup.
SOURCE: https://github.com/evolutionapi/docs-evolution/blob/main/v2/en/requirements/redis.mdx#_snippet_2

LANGUAGE: bash
CODE:
```
sudo apt-get update
sudo apt-get install redis-server
```

----------------------------------------

TITLE: Update System and Install AppArmor Utilities on Hetzner Server
DESCRIPTION: This command sequence updates the package list and installs `apparmor-utils`. This step might be necessary for specific configurations or security hardening on Hetzner servers, ensuring system readiness for Docker Swarm.
SOURCE: https://github.com/evolutionapi/docs-evolution/blob/main/v2/en/install/docker.mdx#_snippet_5

LANGUAGE: bash
CODE:
```
sudo apt-get update && apt-get install -y apparmor-utils
```

----------------------------------------

TITLE: Mark Message As Read API Endpoint
DESCRIPTION: Details the OpenAPI specification for marking a message as read. This PUT request requires an `instance` path parameter to identify the chat session.
SOURCE: https://github.com/evolutionapi/docs-evolution/blob/main/v1/api-reference/chat-controller/mark-as-read.mdx#_snippet_0

LANGUAGE: APIDOC
CODE:
```
API Endpoint: Mark Message As Read
  Method: PUT
  Path: /chat/markMessageAsRead/{instance}
  OpenAPI Version: openapi-v1
  Path Parameters:
    instance: string (Required) - The unique identifier of the chat instance.
```

----------------------------------------

TITLE: Build and Start Evolution API
DESCRIPTION: This snippet provides the commands to build the Evolution API project and then start it in production mode using npm scripts, preparing it for deployment.
SOURCE: https://github.com/evolutionapi/docs-evolution/blob/main/v1/en/install/nvm.mdx#_snippet_3

LANGUAGE: bash
CODE:
```
npm run build
npm run start:prod
```

----------------------------------------

TITLE: Install NVM and Node.js
DESCRIPTION: This snippet provides commands to download and install NVM, then use NVM to install a specific version of Node.js and set it as default. It also includes commands to load NVM into the environment and an optional command to configure the server's timezone.
SOURCE: https://github.com/evolutionapi/docs-evolution/blob/main/v1/en/install/nvm.mdx#_snippet_0

LANGUAGE: bash
CODE:
```
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
```

LANGUAGE: bash
CODE:
```
source ~/.bashrc

export NVM_DIR="$([ -z "${XDG_CONFIG_HOME-}" ] && printf %s "${HOME}/.nvm" || printf %s "${XDG_CONFIG_HOME}/nvm")"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh" # This loads nvm

nvm install v20.10.0 && nvm use v20.10.0
```

LANGUAGE: bash
CODE:
```
command -v nvm
```

LANGUAGE: bash
CODE:
```
dpkg-reconfigure tzdata
```

----------------------------------------

TITLE: Start Evolution API Services with Docker Compose
DESCRIPTION: This command starts all services defined in the `docker-compose.yml` file in detached mode, allowing them to run in the background. It handles downloading necessary Docker images and creating services, networks, and volumes.
SOURCE: https://github.com/evolutionapi/docs-evolution/blob/main/v2/en/install/docker.mdx#_snippet_2

LANGUAGE: bash
CODE:
```
docker compose up -d
```

----------------------------------------

TITLE: Stop Evolution API Services with Docker Compose
DESCRIPTION: This command stops and removes the containers, networks, and volumes created by `docker compose up`. It effectively brings down the Evolution API service and cleans up its associated Docker resources.
SOURCE: https://github.com/evolutionapi/docs-evolution/blob/main/v2/en/install/docker.mdx#_snippet_4

LANGUAGE: bash
CODE:
```
docker compose down
```

----------------------------------------

TITLE: Install and Configure PM2 for API Management
DESCRIPTION: Installs PM2 globally, starts the Evolution API process with PM2, configures PM2 to start on boot, and saves the current process list. PM2 is used for managing and keeping the API process alive.
SOURCE: https://github.com/evolutionapi/docs-evolution/blob/main/v2/en/install/nvm.mdx#_snippet_9

LANGUAGE: bash
CODE:
```
npm install pm2 -g
pm2 start 'npm run start:prod' --name ApiEvolution
pm2 startup
pm2 save --force
```

----------------------------------------

TITLE: Open Nginx Virtual Host Configuration File
DESCRIPTION: These commands first navigate to the user's home directory and then open the api configuration file located in /etc/nginx/sites-available using the nano text editor. This file is where the specific Nginx server block for your subdomain will be defined, allowing for custom routing and proxy settings.
SOURCE: https://github.com/evolutionapi/docs-evolution/blob/main/v1/en/install/nvm.mdx#_snippet_11

LANGUAGE: bash
CODE:
```
cd ~
nano /etc/nginx/sites-available/api
```

----------------------------------------

TITLE: Traefik Docker Swarm Deployment Configuration
DESCRIPTION: A Docker Compose YAML configuration for deploying Traefik as a reverse proxy on a Docker Swarm. It includes settings for the API dashboard, Docker provider in swarm mode, HTTP/HTTPS entrypoints, Let's Encrypt certificate resolution, logging, and volume/network definitions.
SOURCE: https://github.com/evolutionapi/docs-evolution/blob/main/v2/en/install/docker.mdx#_snippet_23

LANGUAGE: yaml
CODE:
```
version: "3.7"

services:
  traefik:
    image: traefik:2.11.2
    command:
      - "--api.dashboard=true"
      - "--providers.docker.swarmMode=true"
      - "--providers.docker.endpoint=unix:///var/run/docker.sock"
      - "--providers.docker.exposedbydefault=false"
      - "--providers.docker.network=network_public"
      - "--entrypoints.web.address=:80"
      - "--entrypoints.web.http.redirections.entryPoint.to=websecure"
      - "--entrypoints.web.http.redirections.entryPoint.scheme=https"
      - "--entrypoints.web.http.redirections.entrypoint.permanent=true"
      - "--entrypoints.websecure.address=:443"
      - "--certificatesresolvers.letsencryptresolver.acme.httpchallenge=true"
      - "--certificatesresolvers.letsencryptresolver.acme.httpchallenge.entrypoint=web"
      - "--certificatesresolvers.letsencryptresolver.acme.email=your@email.com"
      - "--certificatesresolvers.letsencryptresolver.acme.storage=/etc/traefik/letsencrypt/acme.json"
      - "--log.level=DEBUG"
      - "--log.format=common"
      - "--log.filePath=/var/log/traefik/traefik.log"
      - "--accesslog=true"
      - "--accesslog.filepath=/var/log/traefik/access-log"
    deploy:
      placement:
        constraints:
          - node.role == manager
      restart_policy:
        condition: on-failure
        delay: 5s
      labels:
        - "traefik.enable=true"
        - "traefik.http.middlewares.redirect-https.redirectscheme.scheme=https"
        - "traefik.http.middlewares.redirect-https.redirectscheme.permanent=true"
        - "traefik.http.routers.http-catchall.rule=hostregexp(`{host:.+}`)"
        - "traefik.http.routers.http-catchall.entrypoints=web"
        - "traefik.http.routers.http-catchall.middlewares=redirect-https@docker"
        - "traefik.http.routers.http-catchall.priority=1"
    volumes:
      - "/var/run/docker.sock:/var/run/docker.sock:ro"
      - "vol_certificates:/etc/traefik/letsencrypt"
    ports:
      - target: 80
        published: 80
        mode: host
      - target: 443
        published: 443
        mode: host
    networks:
      - network_public

volumes:
  vol_certificates:
    external: true
    name: volume_swarm_certificates

networks:
  network_public:
    external: true
    name: network_public
```

----------------------------------------

TITLE: Start PostgreSQL Container with Docker Compose
DESCRIPTION: This command starts the PostgreSQL database container in detached mode using a `docker-compose.yaml` file. Ensure the `docker-compose.yaml` for PostgreSQL is in the current directory before execution.
SOURCE: https://github.com/evolutionapi/docs-evolution/blob/main/v2/en/requirements/database.mdx#_snippet_0

LANGUAGE: bash
CODE:
```
docker-compose up -d
```

----------------------------------------

TITLE: Configure PM2 with Memory Limits for Evolution API
DESCRIPTION: Starts the Evolution API with PM2, specifying Node.js arguments to increase the old space size and setting a memory restart threshold. This configuration is recommended for servers with at least 4GB of RAM dedicated to the API.
SOURCE: https://github.com/evolutionapi/docs-evolution/blob/main/v2/en/install/nvm.mdx#_snippet_10

LANGUAGE: bash
CODE:
```
pm2 start 'npm run start:prod' --name ApiEvolution -- start --node-args="--max-old-space-size=4096" --max-memory-restart 4G
```

----------------------------------------

TITLE: Generate Prisma Client and Deploy Database Migrations
DESCRIPTION: Executes npm scripts to generate Prisma client files and deploy pending database migrations. These steps are crucial for setting up and updating the database schema for the Evolution API.
SOURCE: https://github.com/evolutionapi/docs-evolution/blob/main/v2/en/install/nvm.mdx#_snippet_7

LANGUAGE: bash
CODE:
```
npm run db:generate
```

LANGUAGE: bash
CODE:
```
npm run db:deploy
```

----------------------------------------

TITLE: Build and Start Evolution API in Production Mode
DESCRIPTION: Builds the Evolution API project for production and then starts it. This command initiates the API server, making it accessible.
SOURCE: https://github.com/evolutionapi/docs-evolution/blob/main/v2/en/install/nvm.mdx#_snippet_8

LANGUAGE: bash
CODE:
```
npm run build
npm run start:prod
```

----------------------------------------

TITLE: Configure Nginx Virtual Host for a Domain
DESCRIPTION: Defines a server block for a specific domain, `replace-this-with-your-cool-domain.com`, acting as a reverse proxy to the Evolution API backend. This configuration is suitable for hosting the API under a custom domain.
SOURCE: https://github.com/evolutionapi/docs-evolution/blob/main/v2/en/install/nginx.mdx#_snippet_7

LANGUAGE: nginx
CODE:
```
server {
  server_name replace-this-with-your-cool-domain.com;

  location / {
    proxy_pass http://127.0.0.1:8080;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_cache_bypass $http_upgrade;
  }
}
```

----------------------------------------

TITLE: Load NVM and Install Node.js v20.10.0
DESCRIPTION: Loads NVM into the current shell environment and then installs and uses the specified Node.js version (v20.10.0). This ensures the correct Node.js runtime is active for the Evolution API.
SOURCE: https://github.com/evolutionapi/docs-evolution/blob/main/v2/en/install/nvm.mdx#_snippet_1

LANGUAGE: bash
CODE:
```
# Load NVM into the current environment
source ~/.bashrc

# Install and use the required Node.js version
nvm install v20.10.0 && nvm use v20.10.0
```

----------------------------------------

TITLE: Update Profile Name API Endpoint
DESCRIPTION: Details the HTTP method and path for updating a user's profile name via the Evolution API. The '{instance}' path parameter specifies the target instance.
SOURCE: https://github.com/evolutionapi/docs-evolution/blob/main/v1/api-reference/profile-settings/update-profile-name.mdx#_snippet_0

LANGUAGE: APIDOC
CODE:
```
POST /chat/updateProfileName/{instance}
```

----------------------------------------

TITLE: Update Profile Name API Endpoint Definition
DESCRIPTION: Defines the HTTP POST endpoint for updating a profile name, including the OpenAPI version and the instance path parameter.
SOURCE: https://github.com/evolutionapi/docs-evolution/blob/main/v2/api-reference/profile-settings/update-profile-name.mdx#_snippet_0

LANGUAGE: APIDOC
CODE:
```
POST /chat/updateProfileName/{instance}
  OpenAPI Version: openapi-v2
```

----------------------------------------

TITLE: Create EvoAI Bot Instance API
DESCRIPTION: This API endpoint facilitates the creation of a new EvoAI Bot instance. It requires a POST request to the specified path, including the instance identifier as a path parameter.
SOURCE: https://github.com/evolutionapi/docs-evolution/blob/main/v2/api-reference/integrations/evoai/create-evoai.mdx#_snippet_0

LANGUAGE: APIDOC
CODE:
```
openapi: openapi-v2
POST /evoai/create/{instance}
  Description: Creates a new EvoAI Bot instance.
  Parameters:
    instance: (path) The unique identifier for the new EvoAI Bot instance.
  Responses:
    200 OK: Successfully created the EvoAI Bot instance.
    400 Bad Request: Invalid instance identifier or request.
    500 Internal Server Error: An unexpected error occurred on the server.
```

----------------------------------------

TITLE: Amazon S3 / MinIO Storage Configuration
DESCRIPTION: Configures parameters for object storage using Amazon S3 or MinIO, including access keys, bucket names, connection ports, endpoints, and SSL usage.
SOURCE: https://github.com/evolutionapi/docs-evolution/blob/main/v2/en/env.mdx#_snippet_15

LANGUAGE: APIDOC
CODE:
```
S3_ENABLED: Enables storage on S3 (true or false) (Example: false)
S3_ACCESS_KEY: S3 access key (Example: -)
S3_SECRET_KEY: S3 secret key (Example: -)
S3_BUCKET: S3 bucket name (Example: evolution)
S3_PORT: S3 connection port (Example: 443)
S3_ENDPOINT: S3 (or MinIO) endpoint (Example: s3.amazonaws.com)
S3_USE_SSL: Uses SSL for S3 connection (true or false) (Example: true)
```

----------------------------------------

TITLE: Configure SSL Certificate with Certbot and Nginx
DESCRIPTION: Runs Certbot to automatically obtain and install an SSL certificate for the specified domain using the Nginx plugin. This command configures Nginx to serve content over HTTPS, securing the Evolution API.
SOURCE: https://github.com/evolutionapi/docs-evolution/blob/main/v2/en/install/nginx.mdx#_snippet_11

LANGUAGE: bash
CODE:
```
certbot --nginx -d replace-this-with-your-cool-domain.com
```

----------------------------------------

TITLE: Verify Redis Server Status
DESCRIPTION: Pings the Redis server using the command-line interface to confirm it is running correctly. A successful response is 'PONG'.
SOURCE: https://github.com/evolutionapi/docs-evolution/blob/main/v2/en/requirements/redis.mdx#_snippet_4

LANGUAGE: bash
CODE:
```
redis-cli ping
```

----------------------------------------

TITLE: Create Instance API Endpoint
DESCRIPTION: Defines the API endpoint for creating a new instance, specifying the HTTP method and path according to OpenAPI v2 specification.
SOURCE: https://github.com/evolutionapi/docs-evolution/blob/main/v2/api-reference/instance-controller/create-instance-basic.mdx#_snippet_0

LANGUAGE: APIDOC
CODE:
```
Path: /instance/create
Method: POST
Specification: OpenAPI v2
```

----------------------------------------

TITLE: Create Traefik YAML Configuration File
DESCRIPTION: Opens or creates the 'traefik.yaml' file using 'nano', where the Docker Compose configuration for Traefik will be defined.
SOURCE: https://github.com/evolutionapi/docs-evolution/blob/main/v2/en/install/docker.mdx#_snippet_22

LANGUAGE: bash
CODE:
```
nano traefik.yaml
```

----------------------------------------

TITLE: Edit /etc/hosts File
DESCRIPTION: This command opens the `/etc/hosts` file using the `nano` editor. It allows manual modification of local hostname mappings, which is required to add the new manager hostname.
SOURCE: https://github.com/evolutionapi/docs-evolution/blob/main/v2/en/install/docker.mdx#_snippet_7

LANGUAGE: bash
CODE:
```
nano /etc/hosts
```

----------------------------------------

TITLE: Reboot System to Apply Hostname Changes
DESCRIPTION: This command reboots the system. A reboot is necessary for the newly configured hostname to take full effect across all system services and configurations.
SOURCE: https://github.com/evolutionapi/docs-evolution/blob/main/v2/en/install/docker.mdx#_snippet_9

LANGUAGE: bash
CODE:
```
reboot
```

----------------------------------------

TITLE: Configure Redis Environment Variables
DESCRIPTION: These environment variables configure Redis settings for caching and data storage within the Evolution API, applicable for Docker and NPM setups. They control Redis enablement, connection URI, key prefix, data TTL, and WhatsApp credential saving.
SOURCE: https://github.com/evolutionapi/docs-evolution/blob/main/v1/en/optional-resources/redis.mdx#_snippet_0

LANGUAGE: shell
CODE:
```
# Set to true to enable Redis.
CACHE_REDIS_ENABLED=false
# Redis server URI
CACHE_REDIS_URI=redis://redis:6379
# Prefix key word for redis data
CACHE_REDIS_PREFIX_KEY=evolution
# Time to keep data cached
CACHE_REDIS_TTL=604800
# Save WhatsApp credentials on Redis
CACHE_REDIS_SAVE_INSTANCES=true
```

----------------------------------------

TITLE: Update Chat Profile Status API Endpoint
DESCRIPTION: This API documentation describes the `POST /chat/updateProfileStatus/{instance}` endpoint. It is used to update the status of a specific chat profile. The `{instance}` path parameter identifies the target profile.
SOURCE: https://github.com/evolutionapi/docs-evolution/blob/main/v2/api-reference/profile-settings/update-profile-status.mdx#_snippet_0

LANGUAGE: APIDOC
CODE:
```
Endpoint: POST /chat/updateProfileStatus/{instance}
Description: Updates the status of a chat profile.
OpenAPI Version: openapi-v2

Path Parameters:
  instance: string (Required)
    Description: The unique identifier for the chat profile whose status is to be updated.
```

----------------------------------------

TITLE: Configure Minimal Environment Variables for Evolution API
DESCRIPTION: This snippet shows the minimal content for a `.env` file required by the Evolution API service. It sets the `AUTHENTICATION_API_KEY` which needs to be changed from its default value for security.
SOURCE: https://github.com/evolutionapi/docs-evolution/blob/main/v2/en/install/docker.mdx#_snippet_1

LANGUAGE: bash
CODE:
```
AUTHENTICATION_API_KEY=change-me
```

----------------------------------------

TITLE: Update Evolution API using Docker Compose CLI
DESCRIPTION: This snippet provides the commands to update your Evolution API instance when installed via Docker Compose CLI. It involves pulling the latest image and then stopping and restarting the containers to apply the update.
SOURCE: https://github.com/evolutionapi/docs-evolution/blob/main/v1/pt/updates.mdx#_snippet_0

LANGUAGE: shell
CODE:
```
docker compose pull atendai/evolution-api:latest
```

LANGUAGE: shell
CODE:
```
docker compose down && docker compose up -d
```

----------------------------------------

TITLE: Pull Latest Evolution API Docker Image
DESCRIPTION: This command pulls the most recent version of the Evolution API Docker image from the 'atendai' registry. It's the first step in updating your Docker-based Evolution API installation.
SOURCE: https://github.com/evolutionapi/docs-evolution/blob/main/v2/pt/updates.mdx#_snippet_0

LANGUAGE: shell
CODE:
```
docker pull atendai/evolution-api:v2.1.1
```

----------------------------------------

TITLE: Validate Nginx Configuration Syntax
DESCRIPTION: This command performs a syntax check on all Nginx configuration files, verifying their correctness without actually reloading the service. It is a critical step to identify and fix any errors before reloading Nginx, preventing potential service disruptions caused by malformed configurations.
SOURCE: https://github.com/evolutionapi/docs-evolution/blob/main/v1/en/install/nvm.mdx#_snippet_14

LANGUAGE: bash
CODE:
```
nginx -t
```

----------------------------------------

TITLE: Final Reload of Nginx Service
DESCRIPTION: This command reloads the Nginx service one final time, ensuring that all previously made configuration changes, including the newly enabled virtual host and any SSL settings, are fully applied. This step is essential for the Nginx server to operate with the updated settings.
SOURCE: https://github.com/evolutionapi/docs-evolution/blob/main/v1/en/install/nvm.mdx#_snippet_15

LANGUAGE: bash
CODE:
```
systemctl reload nginx
```

----------------------------------------

TITLE: Start Redis Service on Linux
DESCRIPTION: Starts the Redis server service after installation on Linux systems.
SOURCE: https://github.com/evolutionapi/docs-evolution/blob/main/v2/en/requirements/redis.mdx#_snippet_3

LANGUAGE: bash
CODE:
```
sudo service redis-server start
```

----------------------------------------

TITLE: Logging Configuration Variables
DESCRIPTION: Environment variables to control the logging behavior of the EvolutionAPI. These settings allow users to specify which log levels are displayed and whether log output should include color for better readability.
SOURCE: https://github.com/evolutionapi/docs-evolution/blob/main/v1/en/env.mdx#_snippet_1

LANGUAGE: APIDOC
CODE:
```
LOG_LEVEL: Logs to be shown: ERROR, WARN, DEBUG, INFO, LOG, VERBOSE, DARK, WEBHOOKS (Example: ERROR,WARN,DEBUG,INFO,LOG,VERBOSE,DARK,WEBHOOKS)
LOG_COLOR: Show colors in Logs (true or false) (Example: true)
LOG_BAILEYS: Which Baileys logs to show: "fatal", "error", "warn", "info", "debug", and "trace" (Example: error)
```

----------------------------------------

TITLE: Create 'evolution' Database for MySQL
DESCRIPTION: This command creates a new MySQL database named 'evolution' for the Evolution API v2. It requires the root user password for execution.
SOURCE: https://github.com/evolutionapi/docs-evolution/blob/main/v2/en/requirements/database.mdx#_snippet_8

LANGUAGE: bash
CODE:
```
mysql -u root -p -e "CREATE DATABASE evolution;"
```

----------------------------------------

TITLE: Fetch Privacy Settings API Endpoint
DESCRIPTION: This API endpoint allows retrieval of privacy settings for a specific instance. It utilizes the GET HTTP method and adheres to the OpenAPI v2 specification. The '{instance}' path parameter should be replaced with the actual instance identifier.
SOURCE: https://github.com/evolutionapi/docs-evolution/blob/main/v2/api-reference/profile-settings/fetch-privacy-settings.mdx#_snippet_0

LANGUAGE: APIDOC
CODE:
```
openapi: openapi-v2 GET /chat/fetchPrivacySettings/{instance}
```

----------------------------------------

TITLE: Remove Default Nginx Configuration
DESCRIPTION: Deletes the default Nginx configuration file, which is typically located in the `sites-enabled` directory, to prepare for a custom server block setup.
SOURCE: https://github.com/evolutionapi/docs-evolution/blob/main/v2/en/install/nginx.mdx#_snippet_1

LANGUAGE: bash
CODE:
```
rm /etc/nginx/sites-enabled/default
```

----------------------------------------

TITLE: Retrieve Root API Information (APIDOC)
DESCRIPTION: This snippet defines the root endpoint (`/`) for an API using OpenAPI v1 specification. It indicates a GET request is used to retrieve information from this endpoint, typically providing basic API metadata or versioning details.
SOURCE: https://github.com/evolutionapi/docs-evolution/blob/main/v1/api-reference/get-information.mdx#_snippet_0

LANGUAGE: APIDOC
CODE:
```
openapi: openapi-v1 GET /
```

----------------------------------------

TITLE: Stop and Restart Docker Compose Containers
DESCRIPTION: After successfully pulling the new Docker image, this command is used to gracefully stop all currently running containers defined in your Docker Compose file and then restart them in detached mode. This action ensures that the updated image is utilized for the Evolution API instance.
SOURCE: https://github.com/evolutionapi/docs-evolution/blob/main/v2/en/updates.mdx#_snippet_1

LANGUAGE: shell
CODE:
```
docker compose down && docker compose up -d
```

----------------------------------------

TITLE: Configure SSL Certificate with Certbot and Nginx
DESCRIPTION: Runs Certbot to automatically obtain and install an SSL certificate for the specified domain using the Nginx plugin. This command configures Nginx to serve content over HTTPS, securing the Evolution API.
SOURCE: https://github.com/evolutionapi/docs-evolution/blob/main/v1/en/install/nvm.mdx#_snippet_17

LANGUAGE: bash
CODE:
```
certbot --nginx -d replace-this-with-your-cool-domain.com
```

----------------------------------------

TITLE: Set Instance Settings API Endpoint
DESCRIPTION: This API endpoint allows clients to modify or set configuration parameters for a designated instance. It requires a POST request to the specified path, including the instance identifier. The endpoint adheres to OpenAPI v2 specifications.
SOURCE: https://github.com/evolutionapi/docs-evolution/blob/main/v2/api-reference/settings/set.mdx#_snippet_0

LANGUAGE: APIDOC
CODE:
```
Path: /settings/set/{instance}
  Method: POST
  OpenAPI Version: v2
```

----------------------------------------

TITLE: Clean Install NPM Dependencies and Restart Evolution API
DESCRIPTION: These shell commands are used to manage the PM2 process for the Evolution API. `pm2 flush` clears all accumulated logs, which is useful for troubleshooting. `pm2 stop ApiEvolution` safely halts the running Evolution API process, a crucial step before applying updates or performing maintenance.
SOURCE: https://github.com/evolutionapi/docs-evolution/blob/main/v1/en/optional-resources/mongo-db.mdx#_snippet_1

LANGUAGE: shell
CODE:
```
# Clear all PM2 logs
pm2 flush

# Stop the current Evolution API process
pm2 stop ApiEvolution
```

----------------------------------------

TITLE: Configure Nginx Server Block for Evolution API
DESCRIPTION: This snippet demonstrates how to remove the default Nginx site configuration and create a new server block file for the Evolution API, including common configurations for serving web content, handling PHP, and setting long browser cache times for static assets.
SOURCE: https://github.com/evolutionapi/docs-evolution/blob/main/v1/en/install/nvm.mdx#_snippet_7

LANGUAGE: bash
CODE:
```
rm /etc/nginx/sites-enabled/default
```

LANGUAGE: bash
CODE:
```
nano /etc/nginx/conf.d/default.conf
```

LANGUAGE: nginx
CODE:
```
server {
  listen 80;
  listen [::]:80;
  server_name _;
  root /var/www/html/;
  index index.php index.html index.htm index.nginx-debian.html;

location / {
    try_files $uri $uri/ /index.php;
  }

location ~ \.php$ {
    fastcgi_pass unix:/run/php/php7.4-fpm.sock;
    fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
    include fastcgi_params;
    include snippets/fastcgi-php.conf;
  }

# Long browser cache time can speed up repeat visits to your page
location ~* \.(jpg|jpeg|gif|png|webp|svg|woff|woff2|ttf|css|js|ico|xml)$ {
       access_log off;
       log_not_found off;
       expires 360d;
  }
```

----------------------------------------

TITLE: Set Instance Settings API Endpoint
DESCRIPTION: This API endpoint facilitates the modification of settings for a designated instance. It accepts a POST request, with the instance identifier provided as a path parameter.
SOURCE: https://github.com/evolutionapi/docs-evolution/blob/main/v1/api-reference/settings/set.mdx#_snippet_0

LANGUAGE: APIDOC
CODE:
```
openapi: openapi-v1 POST /settings/set/{instance}
```

----------------------------------------

TITLE: Remove Profile Picture API Endpoint
DESCRIPTION: This snippet documents the API endpoint for removing a profile picture. It specifies the OpenAPI version, the HTTP DELETE method, and the path including the instance identifier.
SOURCE: https://github.com/evolutionapi/docs-evolution/blob/main/v2/api-reference/profile-settings/remove-profile-picture.mdx#_snippet_0

LANGUAGE: APIDOC
CODE:
```
OpenAPI Specification:
  Version: openapi-v2
  Endpoint:
    Method: DELETE
    Path: /chat/removeProfilePicture/{instance}
    Description: Removes the profile picture for a specified chat instance.
    Parameters:
      instance: (path parameter) The unique identifier of the chat instance.
```

----------------------------------------

TITLE: Clean Install NPM Dependencies and Restart Evolution API
DESCRIPTION: These commands facilitate a clean installation of Node.js dependencies and restart the Evolution API after an update. 'rm -rf node_modules' removes existing dependencies to prevent conflicts, 'npm i' installs the necessary new ones, and 'pm2 start ApiEvolution' restarts the application. 'pm2 log ApiEvolution' is an optional command for verifying the API's status.
SOURCE: https://github.com/evolutionapi/docs-evolution/blob/main/v2/en/updates.mdx#_snippet_5

LANGUAGE: shell
CODE:
```
# Remove the current node_modules directory to ensure a clean installation
rm -rf node_modules

# Install dependencies with NPM
npm i

# Restart the Evolution API with the updated version
pm2 start ApiEvolution

# Optionally, view the PM2 logs for the Evolution API
pm2 log ApiEvolution
```

----------------------------------------

TITLE: Check Evolution API Container Logs
DESCRIPTION: This command displays the logs for the `evolution_api` container. It is useful for verifying that the service is running correctly and for debugging any issues that may arise during startup or operation.
SOURCE: https://github.com/evolutionapi/docs-evolution/blob/main/v2/en/install/docker.mdx#_snippet_3

LANGUAGE: bash
CODE:
```
docker logs evolution_api
```

----------------------------------------

TITLE: Execute Evolution API Data Migration to MongoDB
DESCRIPTION: This command initiates the data migration process for the Evolution API, moving existing data to MongoDB. Executed from the installation directory, `npx evolution-manager api migrate-to-mongo` guides the user through steps to migrate specific WhatsApp instances or all instances, ensuring data continuity with the new database setup.
SOURCE: https://github.com/evolutionapi/docs-evolution/blob/main/v1/en/optional-resources/mongo-db.mdx#_snippet_3

LANGUAGE: shell
CODE:
```
npx evolution-manager api migrate-to-mongo
```

----------------------------------------

TITLE: Send Presence API Endpoint
DESCRIPTION: This API endpoint facilitates sending presence updates for a specific chat instance. It is defined as a POST request under the OpenAPI v2 specification, targeting the /chat/sendPresence/{instance} path.
SOURCE: https://github.com/evolutionapi/docs-evolution/blob/main/v2/api-reference/chat-controller/send-presence.mdx#_snippet_0

LANGUAGE: APIDOC
CODE:
```
Endpoint: /chat/sendPresence/{instance}
Method: POST
OpenAPI Version: v2
```

----------------------------------------

TITLE: Deploy Evolution API v2 Docker Stack
DESCRIPTION: This bash command is used to deploy the Docker stack defined in the `evolution_api_v2.yaml` file. The `--prune` flag removes services that are no longer defined in the stack file, and `--resolve-image always` ensures that the latest image is pulled.
SOURCE: https://github.com/evolutionapi/docs-evolution/blob/main/v2/en/install/docker.mdx#_snippet_26

LANGUAGE: bash
CODE:
```
docker stack deploy --prune --resolve-image always -c evolution_api_v2.yaml evolution_v2
```

----------------------------------------

TITLE: Obtain SSL Certificate for Domain with Certbot
DESCRIPTION: This command uses Certbot to automatically obtain and install an SSL/TLS certificate for the specified domain, configuring Nginx to use HTTPS. It streamlines the process of securing your API subdomain, ensuring all traffic is encrypted and trusted by web browsers.
SOURCE: https://github.com/evolutionapi/docs-evolution/blob/main/v1/en/install/nvm.mdx#_snippet_17

LANGUAGE: bash
CODE:
```
certbot --nginx -d replace-this-with-your-cool-domain.com
```

----------------------------------------

TITLE: Update Profile Picture API Endpoint
DESCRIPTION: Defines the OpenAPI endpoint for updating a profile picture. This is a POST request to the specified path, requiring an instance identifier.
SOURCE: https://github.com/evolutionapi/docs-evolution/blob/main/v2/api-reference/profile-settings/update-profile-picture.mdx#_snippet_0

LANGUAGE: APIDOC
CODE:
```
openapi-v2 POST /chat/updateProfilePicture/{instance}
```

----------------------------------------

TITLE: Telemetry Configuration Environment Variables
DESCRIPTION: Defines environment variables for enabling and configuring telemetry reporting for the EvolutionAPI.
SOURCE: https://github.com/evolutionapi/docs-evolution/blob/main/v2/en/env.mdx#_snippet_1

LANGUAGE: APIDOC
CODE:
```
TELEMETRY: Enables or disables telemetry (true or false) - Example: true
TELEMETRY_URL: URL of the telemetry server - Example: https://telemetry.example.com
```

----------------------------------------

TITLE: CORS Configuration Environment Variables
DESCRIPTION: Defines environment variables for configuring Cross-Origin Resource Sharing (CORS) policies for the EvolutionAPI, including allowed origins, methods, and credentials.
SOURCE: https://github.com/evolutionapi/docs-evolution/blob/main/v2/en/env.mdx#_snippet_2

LANGUAGE: APIDOC
CODE:
```
CORS_ORIGIN: Allowed origins for the API, separated by commas (use "*" to accept requests from any origin) - Example: *
CORS_METHODS: Allowed HTTP methods, separated by commas - Example: GET,POST,PUT,DELETE
CORS_CREDENTIALS: Permission for cookies in requests (true or false) - Example: true
```

----------------------------------------

TITLE: API Language Configuration
DESCRIPTION: Specifies the default language for the API's responses and internal processing.
SOURCE: https://github.com/evolutionapi/docs-evolution/blob/main/v2/en/env.mdx#_snippet_17

LANGUAGE: APIDOC
CODE:
```
LANGUAGE: API language (Example: en)
```

----------------------------------------

TITLE: Configure Server Timezone
DESCRIPTION: Reconfigures the system's timezone data. This is an optional but recommended step to ensure correct timestamps for logs and operations.
SOURCE: https://github.com/evolutionapi/docs-evolution/blob/main/v2/en/install/nvm.mdx#_snippet_3

LANGUAGE: bash
CODE:
```
dpkg-reconfigure tzdata
```

----------------------------------------

TITLE: Deploy Evolution API v2 Docker Stack
DESCRIPTION: This bash command is used to deploy the Docker stack defined in the `evolution_api_v2.yaml` file. The `--prune` flag removes services that are no longer defined in the stack file, and `--resolve-image always` ensures that the latest image is pulled.
SOURCE: https://github.com/evolutionapi/docs-evolution/blob/main/v2/en/install/docker.mdx#_snippet_26

LANGUAGE: bash
CODE:
```
docker stack deploy --prune --resolve-image always -c evolution_api_v2.yaml evolution_v2
```

----------------------------------------

TITLE: Deploy Traefik Stack to Docker Swarm
DESCRIPTION: Deploys the Traefik service stack to the Docker Swarm cluster using the specified 'traefik.yaml' configuration file. The '--prune' flag removes services not defined in the stack file, and '--resolve-image always' ensures the latest image is pulled.
SOURCE: https://github.com/evolutionapi/docs-evolution/blob/main/v2/en/install/docker.mdx#_snippet_24

LANGUAGE: bash
CODE:
```
docker stack deploy --prune --resolve-image always -c traefik.yaml traefik
```

----------------------------------------

TITLE: Nginx Virtual Host Reverse Proxy Configuration
DESCRIPTION: This Nginx server block configures a virtual host to act as a reverse proxy for a specified domain, forwarding requests to a backend application running on http://127.0.0.1:8080. It includes crucial proxy_set_header directives to correctly pass host, IP, and protocol information, and handles WebSocket upgrades, making it suitable for modern web applications.
SOURCE: https://github.com/evolutionapi/docs-evolution/blob/main/v1/en/install/nvm.mdx#_snippet_12

LANGUAGE: nginx
CODE:
```
server {
  server_name replace-this-with-your-cool-domain.com;

location / {
    proxy_pass http://127.0.0.1:8080;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_cache_bypass $http_upgrade;
  }
}
```

----------------------------------------

TITLE: Set Hostname for Docker Swarm Manager
DESCRIPTION: This command sets the system's hostname to `manager1`. This helps identify the server within a Docker Swarm cluster and is a crucial step for proper cluster management and communication.
SOURCE: https://github.com/evolutionapi/docs-evolution/blob/main/v2/en/install/docker.mdx#_snippet_6

LANGUAGE: bash
CODE:
```
hostnamectl set-hostname manager1
```

----------------------------------------

TITLE: Find Dify Bots API Endpoint
DESCRIPTION: Documents the OpenAPI v2 GET endpoint for finding Dify bot instances. This endpoint allows retrieval of information about specific Dify bots based on the provided instance identifier.
SOURCE: https://github.com/evolutionapi/docs-evolution/blob/main/v2/api-reference/integrations/dify/find-dify.mdx#_snippet_0

LANGUAGE: APIDOC
CODE:
```
openapi-v2 GET /dify/find/{instance}
```

----------------------------------------

TITLE: Deploy EvolutionAPI with Docker Run for Quick Start
DESCRIPTION: This command quickly deploys EvolutionAPI as a Docker container in detached mode, exposing it on port 8080. It's suitable for testing or development purposes, using a basic API key.
SOURCE: https://github.com/evolutionapi/docs-evolution/blob/main/v1/en/install/docker.mdx#_snippet_0

LANGUAGE: bash
CODE:
```
docker run -d \
    --name evolution-api \
    -p 8080:8080 \
    -e AUTHENTICATION_API_KEY=change-me \
    atendai/evolution-api
```

----------------------------------------

TITLE: Define EvolutionAPI Service with Docker Compose YAML
DESCRIPTION: This `docker-compose.yml` file defines the EvolutionAPI service for a standalone environment, including container name, image, port mapping, restart policy, environment variables from a .env file, and persistent volumes for data storage.
SOURCE: https://github.com/evolutionapi/docs-evolution/blob/main/v1/en/install/docker.mdx#_snippet_2

LANGUAGE: yaml
CODE:
```
version: '3'
services:
  evolution-api:
    container_name: evolution_api
    image: atendai/evolution-api
    restart: always
    ports:
      - "8080:8080"
    env_file:
      - .env
    volumes:
      - evolution_store:/evolution/store
      - evolution_instances:/evolution/instances

volumes:
  evolution_store:
  evolution_instances:
```

----------------------------------------

TITLE: Install Docker Engine
DESCRIPTION: Downloads and executes the official Docker installation script, providing a convenient way to set up Docker on the system.
SOURCE: https://github.com/evolutionapi/docs-evolution/blob/main/v2/en/install/docker.mdx#_snippet_20

LANGUAGE: bash
CODE:
```
curl -fsSL https://get.docker.com | bash
```

----------------------------------------

TITLE: Create Overlay Network for Docker Swarm
DESCRIPTION: This command creates an overlay network named `network_public` within the Docker Swarm. Overlay networks enable seamless communication between services running on different nodes in the swarm, crucial for distributed applications.
SOURCE: https://github.com/evolutionapi/docs-evolution/blob/main/v2/en/install/docker.mdx#_snippet_13

LANGUAGE: bash
CODE:
```
docker network create --driver=overlay network_public
```

----------------------------------------

TITLE: Docker Swarm Configuration for Evolution API v2
DESCRIPTION: This YAML configuration defines the Docker Swarm service for Evolution API v2. It specifies the Docker image, persistent volumes, network connections, and a wide range of environment variables for database, caching, S3 integration, and authentication. It also includes deployment constraints and Traefik labels for routing and TLS.
SOURCE: https://github.com/evolutionapi/docs-evolution/blob/main/v2/en/install/docker.mdx#_snippet_25

LANGUAGE: yaml
CODE:
```
version: "3.7"

services:
  evolution_v2:


    image: atendai/evolution-api:v2.1.1
    volumes:
      - evolution_instances:/evolution/instances
    networks:
      - network_public
    environment:
      - SERVER_URL=https://evo2.site.com
      - DEL_INSTANCE=false
      - DATABASE_ENABLED=true
      - DATABASE_PROVIDER=postgresql
      - DATABASE_CONNECTION_URI=postgresql://postgres:PASSWORD@postgres:5432/evolution
      - DATABASE_SAVE_DATA_INSTANCE=true
      - DATABASE_SAVE_DATA_NEW_MESSAGE=true
      - DATABASE_SAVE_MESSAGE_UPDATE=true
      - DATABASE_SAVE_DATA_CONTACTS=true
      - DATABASE_SAVE_DATA_CHATS=true
      - DATABASE_SAVE_DATA_LABELS=true
      - DATABASE_SAVE_DATA_HISTORIC=true
      - DATABASE_CONNECTION_CLIENT_NAME=evolution_v2
      - RABBITMQ_ENABLED=false
      - RABBITMQ_URI=amqp://admin:admin@rabbitmq:5672/default
      - CACHE_REDIS_ENABLED=true
      - CACHE_REDIS_URI=redis://evo_redis:6379/1
      - CACHE_REDIS_PREFIX_KEY=evolution_v2
      - CACHE_REDIS_SAVE_INSTANCES=false
      - CACHE_LOCAL_ENABLED=false
      - S3_ENABLED=true
      - S3_ACCESS_KEY=
      - S3_SECRET_KEY=
      - S3_BUCKET=evolution
      - S3_PORT=443
      - S3_ENDPOINT=files.site.com
      - S3_USE_SSL=true
      - AUTHENTICATION_API_KEY=429683C4C977415CAAFCCE10F7D57E11
    deploy:
      mode: replicated
      replicas: 1
      placement:
        constraints:
          - node.hostname == evolution-manager
      labels:
        - traefik.enable=true
        - traefik.http.routers.evolution_v2.rule=Host(`evo2.site.com`)
        - traefik.http.routers.evolution_v2.entrypoints=websecure
        - traefik.http.routers.evolution_v2.tls.certresolver=letsencryptresolver
        - traefik.http.routers.evolution_v2.service=evolution_v2
        - traefik.http.services.evolution_v2.loadbalancer.server.port=8080
        - traefik.http.services.evolution_v2.loadbalancer.passHostHeader=true

volumes:
  evolution_instances:
    external: true
    name: evolution_v2_data

networks:
  network_public:
    external: true
    name: network_public
```

----------------------------------------

TITLE: Initialize Docker Swarm Manager
DESCRIPTION: This command initializes Docker Swarm on the current server, making it a manager node. The `--advertise-addr` flag specifies the IP address that other nodes will use to communicate with this manager.
SOURCE: https://github.com/evolutionapi/docs-evolution/blob/main/v2/en/install/docker.mdx#_snippet_12

LANGUAGE: bash
CODE:
```
docker swarm init --advertise-addr IP_SERVER
```

----------------------------------------

TITLE: Update Docker Compose Image Version in Portainer
DESCRIPTION: This YAML snippet illustrates how to specify the Evolution API Docker image version within a 'docker-compose.yml' file, particularly when managing containers via Portainer. Users should modify the 'image' field to 'atendai/evolution-api:v2.1.1' or 'atendai/evolution-api:v2.x.x' to ensure the desired version is deployed.
SOURCE: https://github.com/evolutionapi/docs-evolution/blob/main/v2/en/updates.mdx#_snippet_2

LANGUAGE: yaml
CODE:
```
# ... (other services and configurations)
  evolution_api:
    # Update the Evolution API image version here
    # Use 'atendai/evolution-api:latest' for the latest version
    # Or specify a specific version like 'atendai/evolutionapi:v2.1.1'
    image: atendai/evolution-api:v2.x.x
    networks:
      - your_network
```

----------------------------------------

TITLE: Example Evolution API Health Check Response
DESCRIPTION: Illustrates the expected JSON response when accessing the Evolution API's health check endpoint (e.g., http://localhost:8080). This response indicates the API's operational status, version, and other relevant information.
SOURCE: https://github.com/evolutionapi/docs-evolution/blob/main/v2/en/install/nvm.mdx#_snippet_11

LANGUAGE: json
CODE:
```
{
  "status": 200,
  "message": "Welcome to the Evolution API, it is working!",
  "version": "2.0.10",
  "clientName": "evolution01",
  "manager": "https://evo2.site.com/manager",
  "documentation": "https://doc.evolution-api.com"
}
```

----------------------------------------

TITLE: Update Profile Picture API Endpoint
DESCRIPTION: Defines the REST API endpoint for updating the profile picture of a specific group instance. This operation uses the HTTP PUT method and requires the instance identifier.
SOURCE: https://github.com/evolutionapi/docs-evolution/blob/main/v1/api-reference/group-controller/update-group-picture.mdx#_snippet_0

LANGUAGE: APIDOC
CODE:
```
PUT /group/updateGroupPicture/{instance}
  Version: openapi-v1
```

----------------------------------------

TITLE: Install Docker Engine via Convenience Script
DESCRIPTION: This command downloads and executes the official Docker installation script. It provides a convenient and recommended way to install Docker Engine on a Linux system, preparing it for Swarm initialization.
SOURCE: https://github.com/evolutionapi/docs-evolution/blob/main/v2/en/install/docker.mdx#_snippet_11

LANGUAGE: bash
CODE:
```
curl -fsSL https://get.docker.com | bash
```

----------------------------------------

TITLE: Change Directory to Evolution API Installation
DESCRIPTION: This simple shell command changes the current working directory to the `evolution-api` installation folder. This step is a prerequisite for executing any management or migration commands that operate within the project's context.
SOURCE: https://github.com/evolutionapi/docs-evolution/blob/main/v1/en/optional-resources/mongo-db.mdx#_snippet_2

LANGUAGE: shell
CODE:
```
cd evolution-api
```

----------------------------------------

TITLE: Pull Latest Evolution API Docker Image
DESCRIPTION: This command pulls the most recent version of the Evolution API Docker image from the 'atendai/evolution-api' repository. It's the essential first step when updating a Docker-based installation to ensure you have the latest code.
SOURCE: https://github.com/evolutionapi/docs-evolution/blob/main/v2/en/updates.mdx#_snippet_0

LANGUAGE: shell
CODE:
```
docker compose pull atendai/evolution-api:v2.1.1
```

----------------------------------------

TITLE: Evolution API Automatic and Workflow Variables
DESCRIPTION: Documents the automatic variables provided by Evolution API, including contact, instance, server, and API key details, as well as the special `query` variable used in workflow bots for message content. These variables are automatically populated and available for use within bot logic.
SOURCE: https://github.com/evolutionapi/docs-evolution/blob/main/v2/en/integrations/flowise.mdx#_snippet_4

LANGUAGE: APIDOC
CODE:
```
Automatic Variables:
  remoteJid: JID of the contact the bot is interacting with.
  pushName: Contact's name on WhatsApp.
  instanceName: Name of the instance running the bot.
  serverUrl: URL of the server where Evolution API is hosted.
  apiKey: API key used to authenticate requests.

Special Variables for Workflows:
  query: The received message content, sent within the inputs for workflow bots.
```

----------------------------------------

TITLE: Fetch Instances API Endpoint Definition
DESCRIPTION: Defines the OpenAPI specification for retrieving instances. It specifies the API version, HTTP method (GET), and the resource path.
SOURCE: https://github.com/evolutionapi/docs-evolution/blob/main/v2/api-reference/instance-controller/fetch-instances.mdx#_snippet_0

LANGUAGE: APIDOC
CODE:
```
openapi: openapi-v2 GET /instance/fetchInstances
```

----------------------------------------

TITLE: Set Nginx Web Directory Ownership
DESCRIPTION: Changes the ownership of the Nginx default web root directory (`/usr/share/nginx/html`) and its contents recursively to the `www-data` user and group. This is often necessary for Nginx to have proper read/write permissions.
SOURCE: https://github.com/evolutionapi/docs-evolution/blob/main/v2/en/install/nginx.mdx#_snippet_5

LANGUAGE: bash
CODE:
```
chown www-data:www-data /usr/share/nginx/html -R
```

----------------------------------------

TITLE: Install and Enable Nginx
DESCRIPTION: Installs the Nginx web server, starts its service, enables it to launch automatically on system boot, and checks its current status to confirm successful operation.
SOURCE: https://github.com/evolutionapi/docs-evolution/blob/main/v2/en/install/nginx.mdx#_snippet_0

LANGUAGE: bash
CODE:
```
apt-get install -y nginx
systemctl start nginx
systemctl enable nginx
systemctl status nginx
```

----------------------------------------

TITLE: Reload Nginx Service
DESCRIPTION: Applies any changes made to the Nginx configuration files by gracefully reloading the service. This ensures new settings take effect without interrupting active connections.
SOURCE: https://github.com/evolutionapi/docs-evolution/blob/main/v2/en/install/nginx.mdx#_snippet_4

LANGUAGE: bash
CODE:
```
systemctl reload nginx
```

----------------------------------------

TITLE: Install Certbot for SSL Certificates
DESCRIPTION: Installs Certbot, a free and open-source tool for automating the use of Let's Encrypt certificates, using the Snap package manager. The `--classic` flag ensures it runs in a traditional environment.
SOURCE: https://github.com/evolutionapi/docs-evolution/blob/main/v2/en/install/nginx.mdx#_snippet_10

LANGUAGE: bash
CODE:
```
snap install --classic certbot
```

----------------------------------------

TITLE: Create New Nginx Default Configuration File
DESCRIPTION: Opens a new or existing file named `default.conf` in the Nginx `conf.d` directory using the Nano editor. This file will contain the primary reverse proxy configuration.
SOURCE: https://github.com/evolutionapi/docs-evolution/blob/main/v2/en/install/nginx.mdx#_snippet_2

LANGUAGE: bash
CODE:
```
nano /etc/nginx/conf.d/default.conf
```

----------------------------------------

TITLE: Start MySQL Container with Docker Compose
DESCRIPTION: This command starts the MySQL database container in detached mode using a `docker-compose.yaml` file. Ensure the `docker-compose.yaml` for MySQL is in the current directory before execution.
SOURCE: https://github.com/evolutionapi/docs-evolution/blob/main/v2/en/requirements/database.mdx#_snippet_1

LANGUAGE: bash
CODE:
```
docker-compose up -d
```

----------------------------------------

TITLE: Start PostgreSQL Service on Ubuntu
DESCRIPTION: This command initiates the PostgreSQL database service on Ubuntu-based systems. It's essential to run this after installation to make the database accessible.
SOURCE: https://github.com/evolutionapi/docs-evolution/blob/main/v2/en/requirements/database.mdx#_snippet_4

LANGUAGE: bash
CODE:
```
sudo service postgresql start
```

----------------------------------------

TITLE: Create 'evolution' Database for PostgreSQL
DESCRIPTION: This command creates a new PostgreSQL database named 'evolution' for the Evolution API v2. It is executed as the `postgres` superuser to ensure proper permissions.
SOURCE: https://github.com/evolutionapi/docs-evolution/blob/main/v2/en/requirements/database.mdx#_snippet_5

LANGUAGE: bash
CODE:
```
sudo -u postgres createdb evolution
```

----------------------------------------

TITLE: Evolution API Webhook Configuration Response Schema
DESCRIPTION: Defines the JSON structure returned when querying an active webhook using the 'Find Webhook' endpoint. This schema provides details such as the webhook's enabled status, its URL, whether it's configured for event-based dispatch, and a list of associated events.
SOURCE: https://github.com/evolutionapi/docs-evolution/blob/main/v1/en/configuration/webhooks.mdx#_snippet_6

LANGUAGE: json
CODE:
```
{
  "enabled": true,
  "url": "[url]",
  "webhookByEvents": false,
  "events": [
    [events]
  ]
}
```

----------------------------------------

TITLE: Start Redis with Docker Compose
DESCRIPTION: Executes the `docker-compose.yaml` file in detached mode to start the Redis service, making it available on `localhost:6379`.
SOURCE: https://github.com/evolutionapi/docs-evolution/blob/main/v2/en/requirements/redis.mdx#_snippet_0

LANGUAGE: bash
CODE:
```
docker-compose up -d
```

----------------------------------------

TITLE: Temporary Storage Cleaning Configuration
DESCRIPTION: Variables to configure the cleaning interval and specific data types for deletion from temporary storage. These settings help manage memory usage by periodically clearing old or unnecessary temporary data.
SOURCE: https://github.com/evolutionapi/docs-evolution/blob/main/v1/en/env.mdx#_snippet_3

LANGUAGE: APIDOC
CODE:
```
CLEAN_STORE_CLEANING_INTERVAL: Cleaning interval in seconds
CLEAN_STORE_MESSAGES: Whether to delete messages (true or false)
CLEAN_STORE_MESSAGE_UP: Whether to delete message updates (true or false)
CLEAN_STORE_CONTACTS: Whether to delete contacts (true or false)
CLEAN_STORE_CHATS: Whether to delete chats (true or false)
```

----------------------------------------

TITLE: Retrieve SQS Instance Details via API
DESCRIPTION: This API documentation snippet describes a GET endpoint used to retrieve information about a specific SQS instance by its identifier. It's part of the `openapi-v1` specification.
SOURCE: https://github.com/evolutionapi/docs-evolution/blob/main/v1/api-reference/integrations/sqs/find-sqs.mdx#_snippet_0

LANGUAGE: APIDOC
CODE:
```
GET /sqs/find/{instance}
  Description: Retrieves details for a specific SQS instance.
  Path Parameters:
    instance: The unique identifier of the SQS instance.
```

----------------------------------------

TITLE: Fetch Business Profile API Endpoint
DESCRIPTION: Details the API endpoint for retrieving a business profile. This is a POST request that requires an instance identifier.
SOURCE: https://github.com/evolutionapi/docs-evolution/blob/main/v1/api-reference/profile-settings/fetch-business-profile.mdx#_snippet_0

LANGUAGE: APIDOC
CODE:
```
Endpoint: POST /chat/fetchBusinessProfile/{instance}
OpenAPI Version: openapi-v1
```

----------------------------------------

TITLE: Fetch Business Profile API Endpoint Definition
DESCRIPTION: This snippet defines the OpenAPI v2 endpoint for fetching a business profile associated with a specific instance. It uses the HTTP POST method and includes the instance identifier as a path parameter.
SOURCE: https://github.com/evolutionapi/docs-evolution/blob/main/v2/api-reference/profile-settings/fetch-business-profile.mdx#_snippet_0

LANGUAGE: APIDOC
CODE:
```
API Endpoint:
  Method: POST
  Path: /chat/fetchBusinessProfile/{instance}
  OpenAPI Version: openapi-v2
```

----------------------------------------

TITLE: API Endpoint: Update Privacy Settings
DESCRIPTION: This API endpoint allows for the modification of privacy settings for a specific instance. It requires a PUT request to the specified path, including the instance identifier.
SOURCE: https://github.com/evolutionapi/docs-evolution/blob/main/v1/api-reference/profile-settings/update-privacy-settings.mdx#_snippet_0

LANGUAGE: APIDOC
CODE:
```
Method: PUT
Path: /chat/updatePrivacySettings/{instance}
Version: openapi-v1
```

----------------------------------------

TITLE: Remove Profile Picture API Endpoint
DESCRIPTION: This API endpoint facilitates the removal of a profile picture for a specified chat instance. It utilizes the HTTP PUT method.

**Method:** PUT
**Endpoint:** /chat/removeProfilePicture/{instance}
SOURCE: https://github.com/evolutionapi/docs-evolution/blob/main/v1/api-reference/profile-settings/remove-profile-picture.mdx#_snippet_0

LANGUAGE: APIDOC
CODE:
```
PUT /chat/removeProfilePicture/{instance}

Path Parameters:
  instance: (string) The unique identifier of the chat instance from which the profile picture should be removed.
```

----------------------------------------

TITLE: Example Amazon S3 Configuration for Evolution API
DESCRIPTION: This example demonstrates a typical configuration for integrating Evolution API with Amazon S3. It highlights the correct format for specifying the S3 endpoint, including the region, and placeholders for user-specific access credentials and bucket name.
SOURCE: https://github.com/evolutionapi/docs-evolution/blob/main/v2/en/integrations/s3minio.mdx#_snippet_1

LANGUAGE: plaintext
CODE:
```
S3_ENABLED=true
S3_ACCESS_KEY=your-aws-access-key
S3_SECRET_KEY=your-aws-secret-key
S3_BUCKET=my-s3-bucket
S3_PORT=443
S3_ENDPOINT=s3.eu-west-3.amazonaws.com
S3_USE_SSL=true
S3_REGION=eu-west-3
```

----------------------------------------

TITLE: Fetch All Groups API Endpoint
DESCRIPTION: Defines the OpenAPI specification for retrieving all groups for a given instance. This endpoint requires an instance identifier as a path parameter.
SOURCE: https://github.com/evolutionapi/docs-evolution/blob/main/v1/api-reference/group-controller/fetch-all-groups.mdx#_snippet_0

LANGUAGE: APIDOC
CODE:
```
openapi: openapi-v1 GET /group/fetchAllGroups/{instance}
```

----------------------------------------

TITLE: Update Profile Status API Endpoint
DESCRIPTION: Defines the API endpoint for updating the status of a chat profile, specifying the HTTP method and path, along with its associated API version.
SOURCE: https://github.com/evolutionapi/docs-evolution/blob/main/v1/api-reference/profile-settings/update-profile-status.mddx#_snippet_0

LANGUAGE: APIDOC
CODE:
```
POST /chat/updateProfileStatus/{instance}
  API Version: openapi-v1
```

----------------------------------------

TITLE: WhatsApp Cloud API Instance Creation Request Body
DESCRIPTION: Defines the JSON payload structure for creating a new instance in Evolution API v2 that integrates with the WhatsApp Cloud API. It specifies parameters like instance name, permanent token, WhatsApp number ID, business ID, QR code setting, and integration type.
SOURCE: https://github.com/evolutionapi/docs-evolution/blob/main/v2/en/integrations/cloudapi.mdx#_snippet_0

LANGUAGE: json
CODE:
```
{
    "instanceName": "INSTANCE NAME",
    "token": "PERMANENT TOKEN OF BM ADMIN USER",
    "number": "WHATSAPP NUMBER ID",
    "businessId": "BUSINESS ID OF WHATSAPP ACCOUNT",
    "qrcode": false,
    "integration": "WHATSAPP-BUSINESS"
}
```

----------------------------------------

TITLE: WhatsApp Cloud API Webhook Token Environment Variable
DESCRIPTION: Defines the environment variable `WA_BUSINESS_TOKEN_WEBHOOK` used to store the token for validating webhook requests from Meta, ensuring secure communication.
SOURCE: https://github.com/evolutionapi/docs-evolution/blob/main/v2/en/integrations/cloudapi.mdx#_snippet_3

LANGUAGE: plaintext
CODE:
```
WA_BUSINESS_TOKEN_WEBHOOK=your_webhook_token
```

----------------------------------------

TITLE: Install Docker Engine via Convenience Script
DESCRIPTION: This command downloads and executes the official Docker installation script. It provides a convenient and recommended way to install Docker Engine on a Linux system, preparing it for Swarm initialization.
SOURCE: https://github.com/evolutionapi/docs-evolution/blob/main/v2/en/install/docker.mdx#_snippet_11

LANGUAGE: bash
CODE:
```
curl -fsSL https://get.docker.com | bash
```

----------------------------------------

TITLE: Find Contacts API Endpoint Definition
DESCRIPTION: Documents the API endpoint used to find contacts. This is a POST request that requires an instance identifier as part of the path. It adheres to the OpenAPI v2 specification.
SOURCE: https://github.com/evolutionapi/docs-evolution/blob/main/v2/api-reference/chat-controller/find-contacts.mdx#_snippet_0

LANGUAGE: APIDOC
CODE:
```
API Endpoint:
  Method: POST
  Path: /chat/findContacts/{instance}
  Description: Finds contacts associated with a specific instance.
  API Specification: openapi-v2
```

----------------------------------------

TITLE: Logout Instance API Endpoint Definition
DESCRIPTION: This snippet defines the OpenAPI 2.0 specification for the DELETE endpoint used to log out a specific instance. It specifies the HTTP method and the parameterized path for the logout operation.
SOURCE: https://github.com/evolutionapi/docs-evolution/blob/main/v2/api-reference/instance-controller/logout-instance.mdx#_snippet_0

LANGUAGE: APIDOC
CODE:
```
openapi: openapi-v2
DELETE /instance/logout/{instance}
```

----------------------------------------

TITLE: Delete Message for Everyone API Endpoint
DESCRIPTION: Documents the API endpoint for deleting a message for everyone in a chat instance. This operation requires specifying the unique identifier of the chat instance.
SOURCE: https://github.com/evolutionapi/docs-evolution/blob/main/v2/api-reference/chat-controller/delete-message-for-everyone.mdx#_snippet_0

LANGUAGE: APIDOC
CODE:
```
API Endpoint: Delete Message for Everyone
Method: DELETE
Path: /chat/deleteMessageForEveryone/{instance}

Path Parameters:
  instance: string (required)
    Description: The identifier of the chat instance where the message should be deleted for all participants.
```

----------------------------------------

TITLE: Temporary Data Storage Configuration
DESCRIPTION: Variables to enable or disable the temporary storage of various data types within the EvolutionAPI, such as messages, message updates, contacts, and chats. These settings control what data is held in volatile memory.
SOURCE: https://github.com/evolutionapi/docs-evolution/blob/main/v1/en/env.mdx#_snippet_2

LANGUAGE: APIDOC
CODE:
```
STORE_MESSAGES: Store messages
STORE_MESSAGE_UP: Store message updates
STORE_CONTACTS: Store contacts
STORE_CHATS: Store chats
```

----------------------------------------

TITLE: Restart Instance API Endpoint
DESCRIPTION: Defines the API endpoint for restarting a specific instance. It uses a PUT request to the `/instance/restart/{instance}` path, following OpenAPI v2 specification.
SOURCE: https://github.com/evolutionapi/docs-evolution/blob/main/v2/api-reference/instance-controller/restart-instance.mdx#_snippet_0

LANGUAGE: APIDOC
CODE:
```
openapi: openapi-v2 PUT /instance/restart/{instance}
```

----------------------------------------

TITLE: Update Message Block Status API Endpoint
DESCRIPTION: This snippet documents the OpenAPI v2 specification for the POST /message/updateBlockStatus/{instance} endpoint, which is used to modify the block status of messages for a given instance.
SOURCE: https://github.com/evolutionapi/docs-evolution/blob/main/v2/api-reference/chat-controller/updateBlockStatus.mdx#_snippet_0

LANGUAGE: APIDOC
CODE:
```
openapi: openapi-v2 POST /message/updateBlockStatus/{instance}
```

----------------------------------------

TITLE: Find Contacts API Endpoint Definition
DESCRIPTION: This snippet defines the API endpoint for finding contacts. It specifies a POST request method to the `/chat/findContacts/{instance}` path, where `{instance}` is a required path parameter.
SOURCE: https://github.com/evolutionapi/docs-evolution/blob/main/v1/api-reference/chat-controller/find-contacts.mdx#_snippet_0

LANGUAGE: APIDOC
CODE:
```
openapi: openapi-v1 POST /chat/findContacts/{instance}
```

----------------------------------------

TITLE: Delete Instance API Endpoint
DESCRIPTION: Defines the OpenAPI specification for the endpoint used to delete a specific instance. This endpoint requires the instance identifier as a path parameter.
SOURCE: https://github.com/evolutionapi/docs-evolution/blob/main/v1/api-reference/instance-controller/delete-instance.mdx#_snippet_0

LANGUAGE: APIDOC
CODE:
```
Endpoint: /instance/delete/{instance}
Method: DELETE
Description: Deletes a specific instance.
Parameters:
  instance:
    Type: string
    Description: The unique identifier of the instance to delete.
```

----------------------------------------

TITLE: Update Privacy Settings API Endpoint
DESCRIPTION: This API documentation describes the endpoint used to update privacy settings for a specific instance. It is a POST request and requires an instance identifier.
SOURCE: https://github.com/evolutionapi/docs-evolution/blob/main/v2/api-reference/profile-settings/update-privacy-settings.mdx#_snippet_0

LANGUAGE: APIDOC
CODE:
```
openapi-v2 POST /chat/updatePrivacySettings/{instance}
```

----------------------------------------

TITLE: Restart Instance API Endpoint Definition
DESCRIPTION: Defines the API endpoint for restarting a specific instance. This endpoint uses a PUT request and requires the instance identifier as a path parameter.
SOURCE: https://github.com/evolutionapi/docs-evolution/blob/main/v1/api-reference/instance-controller/restart-instance.mdx#_snippet_0

LANGUAGE: APIDOC
CODE:
```
PUT /instance/restart/{instance}
  Version: openapi-v1
```

----------------------------------------

TITLE: API Reference: Connect Instance Endpoint
DESCRIPTION: Documents the API endpoint for initiating a connection to a specific instance. This endpoint uses the HTTP GET method and requires an instance identifier as a path parameter.
SOURCE: https://github.com/evolutionapi/docs-evolution/blob/main/v1/api-reference/instance-controller/instance-connect.mdx#_snippet_0

LANGUAGE: APIDOC
CODE:
```
API Endpoint: /instance/connect/{instance}
Method: GET
API Spec Version: openapi-v1
```

----------------------------------------

TITLE: Get Instance Connection State API Endpoint
DESCRIPTION: This API endpoint allows you to retrieve the current connection state for a specified instance. It uses the GET HTTP method and requires the instance identifier as a path parameter.
SOURCE: https://github.com/evolutionapi/docs-evolution/blob/main/v1/api-reference/instance-controller/connection-state.mdx#_snippet_0

LANGUAGE: APIDOC
CODE:
```
GET /instance/connectionState/{instance}

Path Parameters:
  instance: string (Required) - The unique identifier of the instance whose connection state is to be retrieved.

Response:
  Returns the current connection state of the specified instance.
```

----------------------------------------

TITLE: Update Message API Endpoint Definition
DESCRIPTION: This snippet defines the OpenAPI specification for updating a chat message. It specifies the OpenAPI version, the HTTP POST method, and the endpoint path including a dynamic instance identifier.
SOURCE: https://github.com/evolutionapi/docs-evolution/blob/main/v2/api-reference/chat-controller/update-message.mdx#_snippet_0

LANGUAGE: APIDOC
CODE:
```
openapi: openapi-v2
POST /chat/updateMessage/{instance}
```

----------------------------------------

TITLE: Start EvolutionAPI Services with Docker Compose
DESCRIPTION: This command starts the services defined in the `docker-compose.yml` file in detached mode, downloading necessary images and creating containers, networks, and volumes as specified.
SOURCE: https://github.com/evolutionapi/docs-evolution/blob/main/v1/en/install/docker.mdx#_snippet_4

LANGUAGE: bash
CODE:
```
docker compose up -d
```

----------------------------------------

TITLE: API Endpoint: Send Plain Text Message
DESCRIPTION: This API endpoint facilitates sending plain text messages. It requires a POST request to the specified path, including the instance identifier as a path parameter. This operation is part of the 'openapi-v1' specification.
SOURCE: https://github.com/evolutionapi/docs-evolution/blob/main/v1/api-reference/message-controller/send-text.mdx#_snippet_0

LANGUAGE: APIDOC
CODE:
```
Method: POST
Path: /message/sendText/{instance}

Description: Send a plain text message to a specific instance.

Path Parameters:
  instance:
    Type: string
    Description: The identifier of the instance to send the message from.
```

----------------------------------------

TITLE: Send Presence API Endpoint Definition
DESCRIPTION: This snippet defines the OpenAPI endpoint for sending presence updates. It specifies the HTTP method, path, and version for the API call.
SOURCE: https://github.com/evolutionapi/docs-evolution/blob/main/v1/api-reference/chat-controller/send-presence.mdx#_snippet_0

LANGUAGE: APIDOC
CODE:
```
Endpoint: POST /chat/sendPresence/{instance}
Version: openapi-v1
```

----------------------------------------

TITLE: Clean Install Node.js Dependencies and Restart Evolution API
DESCRIPTION: This sequence of commands performs a clean installation of Node.js dependencies and restarts the Evolution API. `rm -rf node_modules` removes the existing `node_modules` directory to prevent conflicts, `npm i` installs fresh dependencies, and `pm2 start ApiEvolution` restarts the API process with the updated code and dependencies. `pm2 log ApiEvolution` is an optional command to view logs for verification.
SOURCE: https://github.com/evolutionapi/docs-evolution/blob/main/v1/en/updates.mdx#_snippet_5

LANGUAGE: shell
CODE:
```
# Remove the current node_modules directory to ensure a clean installation
rm -rf node_modules

# Install the dependencies with NPM
npm i

# Restart the Evolution API with the updated version
pm2 start ApiEvolution

# Optionally, view the PM2 logs for the Evolution API
pm2 log ApiEvolution
```

----------------------------------------

TITLE: Stop and Remove EvolutionAPI Services with Docker Compose
DESCRIPTION: This command stops and removes the containers, networks, and volumes created by `docker compose up`, effectively cleaning up the EvolutionAPI deployment.
SOURCE: https://github.com/evolutionapi/docs-evolution/blob/main/v1/en/install/docker.mdx#_snippet_6

LANGUAGE: bash
CODE:
```
docker compose down
```

----------------------------------------

TITLE: Find Webhook API Endpoint Definition
DESCRIPTION: Defines the HTTP GET endpoint for retrieving a specific webhook instance. This API allows users to query for a webhook's details by providing its unique instance identifier as a path parameter.
SOURCE: https://github.com/evolutionapi/docs-evolution/blob/main/v2/api-reference/webhook/get.mdx#_snippet_0

LANGUAGE: APIDOC
CODE:
```
GET /webhook/find/{instance}
  Description: Retrieves details for a specific webhook instance.
  Parameters:
    instance:
      Type: string
      Description: The unique identifier of the webhook instance to retrieve.
```

----------------------------------------

TITLE: Retrieve Active Webhook Details via GET API
DESCRIPTION: This API endpoint allows users to find and retrieve information about any active webhook configured for a specific instance. It uses a GET request to a predefined URL, requiring the instance identifier as part of the path.
SOURCE: https://github.com/evolutionapi/docs-evolution/blob/main/v2/en/configuration/webhooks.mdx#_snippet_3

LANGUAGE: APIDOC
CODE:
```
Method: GET
Endpoint: [baseUrl]/webhook/find/[instance]
```

----------------------------------------

TITLE: Configure Instance Webhooks with JSON Payload
DESCRIPTION: This JSON example demonstrates how to set up instance-specific webhooks. It specifies the `webhookUrl`, disables `webhook_by_events` and `webhook_base64`, and lists common events like `QRCODE_UPDATED` and `MESSAGES_UPSERT` for real-time notifications.
SOURCE: https://github.com/evolutionapi/docs-evolution/blob/main/v2/en/configuration/webhooks.mdx#_snippet_0

LANGUAGE: json
CODE:
```
{
  "url": "{{webhookUrl}}",
  "webhook_by_events": false,
  "webhook_base64": false,
  "events": [
      "QRCODE_UPDATED",
      "MESSAGES_UPSERT",
      "MESSAGES_UPDATE",
      "MESSAGES_DELETE",
      "SEND_MESSAGE",
      "CONNECTION_UPDATE",
      "TYPEBOT_START",
      "TYPEBOT_CHANGE_STATUS"
  ]
}
```

----------------------------------------

TITLE: API Reference for Webhook Configuration Parameters
DESCRIPTION: This section details the parameters used when configuring webhooks. It includes `enabled` (boolean, required), `url` (string, required), `webhook_by_events` (boolean, optional), and `events` (array, optional), along with their descriptions.
SOURCE: https://github.com/evolutionapi/docs-evolution/blob/main/v2/en/configuration/webhooks.mdx#_snippet_1

LANGUAGE: APIDOC
CODE:
```
Parameters:
  enabled: boolean (Required)
    Description: Enter "true" to create or change Webhook data, or "false" if you want to stop using it.
  url: string (Required)
    Description: Webhook URL to receive event data.
  webhook_by_events: boolean (Optional)
    Description: Whether to generate a specific Webhook URL for each of your events.
  events: array (Optional)
    Description: List of events to be processed. If you don't want to use some of these events, simply remove them from the list.
```

----------------------------------------

TITLE: Toggle Ephemeral API Endpoint Definition
DESCRIPTION: Defines the OpenAPI v2 POST endpoint for toggling ephemeral status within a group. This endpoint typically requires an instance identifier as a path parameter.
SOURCE: https://github.com/evolutionapi/docs-evolution/blob/main/v2/api-reference/group-controller/toggle-ephemeral.mdx#_snippet_0

LANGUAGE: APIDOC
CODE:
```
openapi: openapi-v2 POST /group/toggleEphemeral/{instance}
```

----------------------------------------

TITLE: API Endpoint: Create Instance
DESCRIPTION: Defines the OpenAPI endpoint for creating a new instance. This is a POST request to the /instance/create path, adhering to openapi-v1 specification.
SOURCE: https://github.com/evolutionapi/docs-evolution/blob/main/v1/api-reference/instance-controller/create-instance-basic.mdx#_snippet_0

LANGUAGE: APIDOC
CODE:
```
openapi-v1 POST /instance/create
```

----------------------------------------

TITLE: Delete Message for Everyone API Endpoint
DESCRIPTION: This API endpoint allows for the deletion of a specific message for all participants in a chat. It uses the HTTP DELETE method and requires an instance identifier.
SOURCE: https://github.com/evolutionapi/docs-evolution/blob/main/v1/api-reference/chat-controller/delete-message-for-everyone.mdx#_snippet_0

LANGUAGE: APIDOC
CODE:
```
openapi: openapi-v1
DELETE /chat/deleteMessageForEveryone/{instance}
```

----------------------------------------

TITLE: API Endpoint: Check WhatsApp Number Existence
DESCRIPTION: This API endpoint allows you to check if a given number is a WhatsApp number for a specified instance. It uses a POST request.
SOURCE: https://github.com/evolutionapi/docs-evolution/blob/main/v1/api-reference/chat-controller/check-is-whatsapp.mdx#_snippet_0

LANGUAGE: APIDOC
CODE:
```
openapi: openapi-v1
Method: POST
Path: /chat/whatsappNumbers/{instance}
```

----------------------------------------

TITLE: Install Certbot via Snap Package Manager
DESCRIPTION: This command installs Certbot, a free and open-source tool for automating SSL/TLS certificate issuance and renewal, using the Snap package manager. Installing Certbot is the first step towards securing your domain with HTTPS, enabling encrypted communication between clients and your server.
SOURCE: https://github.com/evolutionapi/docs-evolution/blob/main/v1/en/install/nvm.mdx#_snippet_16

LANGUAGE: bash
CODE:
```
snap install --classic certbot
```

----------------------------------------

TITLE: Stop and Restart Docker Compose Containers
DESCRIPTION: After pulling the new Docker image, this command stops all currently running containers defined in your 'docker-compose.yml' file and then restarts them in detached mode, applying the updated image.
SOURCE: https://github.com/evolutionapi/docs-evolution/blob/main/v2/pt/updates.mdx#_snippet_1

LANGUAGE: shell
CODE:
```
docker compose down && docker compose up -d
```

----------------------------------------

TITLE: Clear PM2 Logs and Stop Evolution API Process
DESCRIPTION: These commands are crucial preparatory steps for an NPM-based update of the Evolution API. 'pm2 flush' clears all existing PM2 logs, which is beneficial for troubleshooting after the update, while 'pm2 stop ApiEvolution' safely halts the running API process to allow for updates.
SOURCE: https://github.com/evolutionapi/docs-evolution/blob/main/v2/en/updates.mdx#_snippet_3

LANGUAGE: shell
CODE:
```
# Clear all PM2 logs
pm2 flush

# Stop the current Evolution API process
pm2 stop ApiEvolution
```

----------------------------------------

TITLE: Join Docker Swarm Cluster as Worker
DESCRIPTION: Executes the 'docker swarm join' command to add the current machine as a worker node to an existing Docker Swarm cluster, using a provided token and manager IP address.
SOURCE: https://github.com/evolutionapi/docs-evolution/blob/main/v2/en/install/docker.mdx#_snippet_21

LANGUAGE: bash
CODE:
```
docker swarm join --token HASH IP_SERVER:2377
```

----------------------------------------

TITLE: Clone Evolution API Repository and Install Dependencies
DESCRIPTION: This snippet outlines the steps to clone the Evolution API GitHub repository to your server, navigate into its directory, and install the necessary Node.js dependencies using npm.
SOURCE: https://github.com/evolutionapi/docs-evolution/blob/main/v1/en/install/nvm.mdx#_snippet_1

LANGUAGE: bash
CODE:
```
git clone https://github.com/EvolutionAPI/evolution-api.git
```

LANGUAGE: bash
CODE:
```
cd evolution-api
npm install
```

----------------------------------------

TITLE: Copy and Edit Evolution API Environment Configuration
DESCRIPTION: This snippet shows how to copy the default development environment file (`dev-env.yml`) to `env.yml` and then open it for editing using the nano text editor to configure application settings like database connections or API keys.
SOURCE: https://github.com/evolutionapi/docs-evolution/blob/main/v1/en/install/nvm.mdx#_snippet_2

LANGUAGE: bash
CODE:
```
cp src/dev-env.yml src/env.yml
```

LANGUAGE: bash
CODE:
```
nano src/env.yml
```

----------------------------------------

TITLE: Nginx Configuration to Deny Access to Hidden Files
DESCRIPTION: This Nginx configuration block prevents web access to hidden files, such as .htaccess files, by denying all requests to paths matching /\.ht. It also disables access logging and 'not found' logging for these specific requests, enhancing the security of your web server by preventing sensitive file exposure.
SOURCE: https://github.com/evolutionapi/docs-evolution/blob/main/v1/en/install/nvm.mdx#_snippet_8

LANGUAGE: nginx
CODE:
```
location ~ /\.ht {
      access_log off;
      log_not_found off;
      deny all;
  }
}
```

----------------------------------------

TITLE: Evolution API Welcome Status JSON Response
DESCRIPTION: This JSON object represents the expected response when accessing the Evolution API's root endpoint (e.g., http://localhost:8080). It confirms the API is running, provides its version, and includes links to the Swagger documentation and the API manager.
SOURCE: https://github.com/evolutionapi/docs-evolution/blob/main/v1/en/get-started/introduction.mdx#_snippet_1

LANGUAGE: json
CODE:
```
{
   "status":200,
   "message":"Welcome to the Evolution API, it is working!",
   "version":"1.x.x",
   "swagger":"http://localhost:8080/docs",
   "manager":"http://localhost:8080/manager",
   "documentation":"https://doc.evolution-api.com"
}
```

----------------------------------------

TITLE: Install and Configure PM2 for Process Management
DESCRIPTION: This snippet details how to install PM2 globally, start the Evolution API process with PM2, configure PM2 to start on boot, and save the current process list. It also includes an optional command to allocate more memory for the PM2 process.
SOURCE: https://github.com/evolutionapi/docs-evolution/blob/main/v1/en/install/nvm.mdx#_snippet_4

LANGUAGE: bash
CODE:
```
npm install pm2 -g
pm2 start 'npm run start:prod' --name ApiEvolution
pm2 startup
pm2 save --force
```

LANGUAGE: bash
CODE:
```
pm2 start 'npm run start:prod' --name ApiEvolution -- start --node-args="--max-old-space-size=4096" --max-memory-restart 4G
```

----------------------------------------

TITLE: Set Presence API Endpoint
DESCRIPTION: This API endpoint allows users to set the presence status for a given instance. It uses the HTTP POST method and requires an instance identifier in the path.
SOURCE: https://github.com/evolutionapi/docs-evolution/blob/main/v1/api-reference/instance-controller/set-presence.mdx#_snippet_0

LANGUAGE: APIDOC
CODE:
```
Endpoint: /instance/setPresence/{instance}
Method: POST
Version: openapi-v1
Description: Sets the presence for a specific instance.
Path Parameters:
  instance: The ID or name of the instance.
```

----------------------------------------

TITLE: Install and Verify Nginx Service
DESCRIPTION: This snippet provides commands to install Nginx, start it, enable it to run on boot, and check its current status to ensure it's active and running before proceeding with configuration.
SOURCE: https://github.com/evolutionapi/docs-evolution/blob/main/v1/en/install/nvm.mdx#_snippet_6

LANGUAGE: bash
CODE:
```
apt-get install -y nginx
systemctl start nginx
systemctl enable nginx
systemctl status nginx
```

----------------------------------------

TITLE: JSON Request Body for Creating WhatsApp Cloud API Instance
DESCRIPTION: Defines the structure for the request body used to create a new instance in Evolution API v2, specifically for integrating with the WhatsApp Cloud API. It includes parameters like instance name, permanent token, WhatsApp number ID, business ID, and integration type.
SOURCE: https://github.com/evolutionapi/docs-evolution/blob/main/v2/pt/integrations/cloudapi.mdx#_snippet_0

LANGUAGE: json
CODE:
```
{
    "instanceName": "NOME DA INSTANCIA",
    "token": "TOKEN PERMANENTE DO USUARIO ADMIN DA BM",
    "number": "NUMBER ID DO WHATSAPP",
    "businessId": "BUSINESS ID DA CONTA DO WHATSAPP",
    "qrcode": false,
    "integration": "WHATSAPP-BUSINESS"
}
```

----------------------------------------

TITLE: Retrieve EvoAI Bot Instance API Endpoint
DESCRIPTION: This snippet documents the API endpoint for retrieving a specific EvoAI bot instance. It specifies a GET request to the `/evoai/find/:evoaiId/{instance}` path, which requires both an `evoaiId` and an `instance` identifier as path parameters.
SOURCE: https://github.com/evolutionapi/docs-evolution/blob/main/v2/api-reference/integrations/evoai/find-bot-evoai.mdx#_snippet_0

LANGUAGE: APIDOC
CODE:
```
GET /evoai/find/:evoaiId/{instance}
  Description: Retrieve a specific EvoAI bot instance.
  Path Parameters:
    evoaiId: string - The unique identifier of the EvoAI bot.
    instance: string - The specific instance identifier of the bot.
```

----------------------------------------

TITLE: Change Session Status API Endpoint
DESCRIPTION: This API endpoint facilitates the modification of a session's status. It uses a POST request and requires the specific instance identifier as a path parameter to target the correct session.
SOURCE: https://github.com/evolutionapi/docs-evolution/blob/main/v2/api-reference/integrations/typebot/change-session-status.mdx#_snippet_0

LANGUAGE: APIDOC
CODE:
```
Method: POST
Path: /typebot/changeStatus/{instance}
Description: Changes the status of a specific session instance.

Parameters:
  instance:
    Type: string (path parameter)
    Description: The unique identifier of the session instance whose status is to be changed.
```

----------------------------------------

TITLE: Send List Message API Endpoint
DESCRIPTION: This snippet documents the API endpoint used to send list messages. It specifies the HTTP POST method and the path, which includes a dynamic `instance` parameter.
SOURCE: https://github.com/evolutionapi/docs-evolution/blob/main/v2/api-reference/message-controller/send-list.mdx#_snippet_0

LANGUAGE: APIDOC
CODE:
```
Endpoint: /message/sendList/{instance}
Method: POST
Version: openapi-v2
```

----------------------------------------

TITLE: API Reference: POST /message/sendWhatsAppAudio/{instance}
DESCRIPTION: This API endpoint allows sending audio messages via WhatsApp for a specified instance. It uses the POST method and requires an instance identifier in the path.
SOURCE: https://github.com/evolutionapi/docs-evolution/blob/main/v1/api-reference/message-controller/send-audio.mdx#_snippet_0

LANGUAGE: APIDOC
CODE:
```
openapi: openapi-v1 POST /message/sendWhatsAppAudio/{instance}
```

----------------------------------------

TITLE: API Endpoint: Send Plain Text Message
DESCRIPTION: This snippet defines the API endpoint for sending plain text messages. It uses a POST request to the specified path, including an instance identifier. This is part of an OpenAPI v2 specification.
SOURCE: https://github.com/evolutionapi/docs-evolution/blob/main/v2/api-reference/message-controller/send-text.mdx#_snippet_0

LANGUAGE: APIDOC
CODE:
```
Method: POST
Path: /message/sendText/{instance}
OpenAPI Version: openapi-v2
```

----------------------------------------

TITLE: Evolution Channel Message Input Webhook
DESCRIPTION: This section describes the webhook endpoint for receiving messages in the Evolution Channel after an instance has been created. It provides the HTTP method and URL, along with an example JSON payload illustrating the format of incoming messages and an explanation of each field.
SOURCE: https://github.com/evolutionapi/docs-evolution/blob/main/v2/en/integrations/evolution-channel.mdx#_snippet_1

LANGUAGE: http
CODE:
```
POST {{baseUrl}}/webhook/evolution
```

LANGUAGE: json
CODE:
```
{
    "numberId": "1234567", 
    "key": {
        "remoteJid": "557499879409",
        "fromMe": false,
        "id": "ABC1234"
    },
    "pushName": "Davidson",
    "message": {
        "conversation": "What is your name?"
    },
    "messageType": "conversation"
}
```

LANGUAGE: APIDOC
CODE:
```
numberId: ID of the number registered when creating the instance.
key:
  remoteJid: Number or unique ID of the contact who sent the message.
  fromMe: Indicates whether the message was sent by the contact (`false`) or by the system itself (`true`).
  id: Unique ID of the message.
pushName: Name of the contact who sent the message.
message:
  conversation: Content of the received message.
messageType: Type of message (in this case, `conversation`).
```

----------------------------------------

TITLE: Update Docker Compose Image Version in Portainer
DESCRIPTION: This YAML snippet illustrates how to specify or update the Docker image for the `evolution_api` service within a `docker-compose.yml` file. It shows options for using the `latest` tag or a specific version (e.g., `v1.x.x`) for the `atendai/evolution-api` image, typically used when updating via Portainer's stack editor.
SOURCE: https://github.com/evolutionapi/docs-evolution/blob/main/v1/en/updates.mdx#_snippet_2

LANGUAGE: yaml
CODE:
```
# ... (other services and configurations)
  evolution_api:
    # Update the Evolution API image version here
    # Use 'atendai/evolution-api:latest' for the latest version
    # Or specify a specific version like 'atendai/evolutionapi:v1.6.0'
    image: atendai/evolution-api:v1.x.x
    networks:
      - your_network

# ... (remaining Docker Compose configuration)
```

----------------------------------------

TITLE: WhatsApp Cloud API Webhook URL Configuration
DESCRIPTION: Specifies the URL endpoint to be configured in the Meta app for receiving webhook events and messages from WhatsApp, pointing to the Evolution API v2 webhook handler.
SOURCE: https://github.com/evolutionapi/docs-evolution/blob/main/v2/en/integrations/cloudapi.mdx#_snippet_2

LANGUAGE: plaintext
CODE:
```
API_URL/webhook/meta
```

----------------------------------------

TITLE: JSON Request Body for Instance-Specific RabbitMQ Configuration
DESCRIPTION: This JSON payload defines the events to be enabled for a particular instance's RabbitMQ integration. Set 'enabled' to true and list the desired event types in the 'events' array. It is recommended to remove unused events to optimize RabbitMQ resource usage for the specific instance.
SOURCE: https://github.com/evolutionapi/docs-evolution/blob/main/v2/en/integrations/rabbitmq.mdx#_snippet_3

LANGUAGE: json
CODE:
```
{
    "enabled": true,
    "events": [
        "APPLICATION_STARTUP",
        "QRCODE_UPDATED",
        "MESSAGES_SET",
        "MESSAGES_UPSERT",
        "MESSAGES_UPDATE",
        "MESSAGES_DELETE",
        "SEND_MESSAGE",
        "CONTACTS_SET",
        "CONTACTS_UPSERT",
        "CONTACTS_UPDATE",
        "PRESENCE_UPDATE",
        "CHATS_SET",
        "CHATS_UPSERT",
        "CHATS_UPDATE",
        "CHATS_DELETE",
        "GROUPS_UPSERT",
        "GROUP_UPDATE",
        "GROUP_PARTICIPANTS_UPDATE",
        "CONNECTION_UPDATE",
        "CALL",
        "NEW_JWT_TOKEN"
    ]
}
```

----------------------------------------

TITLE: API Parameters for Webhook Instance Endpoint
DESCRIPTION: This section documents the parameters used when configuring webhooks for a specific instance. It details each parameter's data type, whether it's mandatory, and its function, such as enabling/disabling the webhook, specifying the URL, or listing events.
SOURCE: https://github.com/evolutionapi/docs-evolution/blob/main/v1/en/configuration/webhooks.mdx#_snippet_1

LANGUAGE: APIDOC
CODE:
```
Parameter: enabled
  Type: boolean
  Required: true
  Description: Enter "true" to create or change Webhook data, or "false" if you want to stop using it.
Parameter: url
  Type: string
  Required: true
  Description: Webhook URL to receive event data.
Parameter: webhook_by_events
  Type: boolean
  Required: false
  Description: Want to generate a specific Webhook URL for each of your events.
Parameter: events
  Type: array
  Required: false
  Description: List of events to be processed. If you don't want to use some of these events, just remove them from the list.
```

----------------------------------------

TITLE: Prepare and Sync Evolution API Repository (NPM)
DESCRIPTION: These commands are the initial steps for updating Evolution API installed via NPM. They involve clearing PM2 logs, stopping the current API process, resetting the local Git repository, and pulling the latest code updates. An optional command for checking out a specific version is also included for production environments.
SOURCE: https://github.com/evolutionapi/docs-evolution/blob/main/v1/pt/updates.mdx#_snippet_2

LANGUAGE: shell
CODE:
```
# Limpar todos os logs do PM2
pm2 flush

# Parar o processo atual da Evolution API
pm2 stop ApiEvolution
```

LANGUAGE: shell
CODE:
```
# Resetar seu repositório local para o commit mais recente
git reset --hard HEAD

# Puxar as atualizações mais recentes do repositório
git pull

# Para uma versão específica, use 'git checkout main' para a mais recente,
# ou 'git checkout 1.x.x' para uma versão específica. Exemplo:
git checkout 1.x.x
```

----------------------------------------

TITLE: Evolution API Database Environment Variables Configuration
DESCRIPTION: This `.env` file configuration enables the database, specifies the provider (PostgreSQL or MySQL), and defines the connection URI. It also includes settings for the client name and various data saving preferences within the application database.
SOURCE: https://github.com/evolutionapi/docs-evolution/blob/main/v2/en/requirements/database.mdx#_snippet_2

LANGUAGE: env
CODE:
```
# Enable the use of the database
DATABASE_ENABLED=true

# Choose the database provider: postgresql or mysql
DATABASE_PROVIDER=postgresql

# Database connection URI
DATABASE_CONNECTION_URI='postgresql://user:pass@localhost:5432/evolution?schema=public'

# Client name for the database connection
DATABASE_CONNECTION_CLIENT_NAME=evolution_exchange

# Choose the data you want to save in the application database
DATABASE_SAVE_DATA_INSTANCE=true
DATABASE_SAVE_DATA_NEW_MESSAGE=true
DATABASE_SAVE_MESSAGE_UPDATE=true
DATABASE_SAVE_DATA_CONTACTS=true
DATABASE_SAVE_DATA_CHATS=true
DATABASE_SAVE_DATA_LABELS=true
DATABASE_SAVE_DATA_HISTORIC=true
```

----------------------------------------

TITLE: Create Bots with OpenAI
DESCRIPTION: After configuring credentials, you can create multiple bots that use a trigger system to initiate interactions. This is achieved via the `/openai/create/{{instance}}` endpoint. This snippet details the endpoint, an example request body, and a comprehensive explanation of all available parameters for bot configuration.
SOURCE: https://github.com/evolutionapi/docs-evolution/blob/main/v2/pt/integrations/openai.mdx#_snippet_1

LANGUAGE: HTTP
CODE:
```
POST {{baseUrl}}/openai/create/{{instance}}
```

LANGUAGE: JSON
CODE:
```
{
    "enabled": true,
    "openaiCredsId": "clyrx36wj0001119ucjjzxik1",
    "botType": "assistant", 
    "assistantId": "asst_LRNyh6qC4qq8NTyPjHbcJjSp",
    "functionUrl": "https://n8n.site.com", 
    "model": "gpt-4",
    "systemMessages": [
        "You are a helpful assistant."
    ],
    "assistantMessages": [
        "\n\nHello there, how may I assist you today?"
    ],
    "userMessages": [
        "Hello!"
    ],
    "maxTokens": 300,
    "triggerType": "keyword", 
    "triggerOperator": "equals", 
    "triggerValue": "teste",
    "expire": 20,
    "keywordFinish": "#SAIR",
    "delayMessage": 1000,
    "unknownMessage": "Mensagem não reconhecida",
    "listeningFromMe": false,
    "stopBotFromMe": false,
    "keepOpen": false,
    "debounceTime": 10,
    "ignoreJids": []
}
```

LANGUAGE: APIDOC
CODE:
```
Endpoint: /openai/create/{{instance}}
Method: POST

Request Body Parameters:
- enabled: boolean
    Description: Activates (true) or deactivates (false) the bot.
- openaiCredsId: string
    Description: ID of the previously registered credential.
- botType: string
    Description: Type of bot ('assistant' or 'chatCompletion').

  For Assistants (`assistant`):
  - assistantId: string
      Description: OpenAI assistant ID.
  - functionUrl: string
      Description: URL to be called if the assistant needs to perform an action.

  For Chat Completion (`chatCompletion`):
  - model: string
      Description: OpenAI model to use (e.g., `gpt-4`).
  - systemMessages: array of strings
      Description: Messages that configure the bot's behavior.
  - assistantMessages: array of strings
      Description: Initial messages from the bot.
  - userMessages: array of strings
      Description: Example user messages.
  - maxTokens: number
      Description: Maximum number of tokens used in the response.

  Options:
  - triggerType: string
      Description: Type of trigger to start the bot ('all' or 'keyword').
  - triggerOperator: string
      Description: Operator used to evaluate the trigger ('contains', 'equals', 'startsWith', 'endsWith', 'regex', 'none').
  - triggerValue: string
      Description: Value used in the trigger (e.g., a keyword or regex).
  - expire: number
      Description: Time in minutes after which the bot expires, restarting if the session expired.
  - keywordFinish: string
      Description: Keyword that ends the bot session.
  - delayMessage: number
      Description: Delay (in milliseconds) to simulate typing before sending a message.
  - unknownMessage: string
      Description: Message sent when user input is not recognized.
  - listeningFromMe: boolean
      Description: Defines whether the bot should listen to messages sent by the user themselves (true or false).
  - stopBotFromMe: boolean
      Description: Defines whether the bot should stop when the user themselves sends a message (true or false).
  - keepOpen: boolean
      Description: Keeps the session open, preventing the bot from restarting for the same contact.
  - debounceTime: number
      Description: Time (in seconds) to combine multiple messages into one.
  - ignoreJids: array of strings
      Description: List of JIDs of contacts that will not activate the bot.
```

----------------------------------------

TITLE: Example Minio Configuration for Evolution API
DESCRIPTION: This example illustrates how to configure Evolution API for use with a Minio instance. It shows how the S3_ENDPOINT variable can be set to a custom domain for a self-hosted Minio service, along with placeholders for Minio-specific access credentials and bucket name.
SOURCE: https://github.com/evolutionapi/docs-evolution/blob/main/v2/en/integrations/s3minio.mdx#_snippet_2

LANGUAGE: plaintext
CODE:
```
S3_ENABLED=true
S3_ACCESS_KEY=your-minio-access-key
S3_SECRET_KEY=your-minio-secret-key
S3_BUCKET=my-minio-bucket
S3_PORT=443
S3_ENDPOINT=minio.mycompany.com
S3_USE_SSL=true
```

----------------------------------------

TITLE: JSON Response Structure for Webhook Details
DESCRIPTION: This JSON object represents the data returned when successfully calling the webhook location endpoint. It provides comprehensive information about the webhook, including its enabled status, the URL it points to, whether it's configured by events, and a list of those events.
SOURCE: https://github.com/evolutionapi/docs-evolution/blob/main/v2/en/configuration/webhooks.mdx#_snippet_4

LANGUAGE: json
CODE:
```
{
  "enabled": true,
  "url": "[url]",
  "webhookByEvents": false,
  "events": [
    [events]
  ]
}
```

----------------------------------------

TITLE: Chatwoot Integration Configuration
DESCRIPTION: Manages settings for integrating with Chatwoot, including enabling the integration, message synchronization (read/delete), and database connection for importing messages.
SOURCE: https://github.com/evolutionapi/docs-evolution/blob/main/v2/en/env.mdx#_snippet_11

LANGUAGE: APIDOC
CODE:
```
CHATWOOT_ENABLED: Enables integration with Chatwoot (true or false) (Example: false)
CHATWOOT_MESSAGE_READ: Marks the client's last WhatsApp message as read when sending a message in Chatwoot (true or false) (Example: true)
CHATWOOT_MESSAGE_DELETE: Deletes the message in Chatwoot when deleted in WhatsApp (true or false) (Example: true)
CHATWOOT_IMPORT_DATABASE_CONNECTION_URI: Database connection URI for Chatwoot to import messages (Example: postgresql://user:password@host:5432/chatwoot?sslmode=disable)
CHATWOOT_IMPORT_PLACEHOLDER_MEDIA_MESSAGE: Imports media messages as a placeholder in Chatwoot (true or false) (Example: true)
```

----------------------------------------

TITLE: Cache Configuration
DESCRIPTION: Defines settings for caching mechanisms, including enabling Redis or local in-memory cache, specifying Redis connection details, and controlling the saving of WhatsApp connection credentials.
SOURCE: https://github.com/evolutionapi/docs-evolution/blob/main/v2/en/env.mdx#_snippet_14

LANGUAGE: APIDOC
CODE:
```
CACHE_REDIS_ENABLED: Enables Redis cache (true or false) (Example: true)
CACHE_REDIS_URI: Redis connection URI (Example: redis://localhost:6379/6)
CACHE_REDIS_PREFIX_KEY: Prefix to differentiate data from one installation to another using the same Redis (Example: evolution)
CACHE_REDIS_SAVE_INSTANCES: Saves WhatsApp connection credentials in Redis (true or false) (Example: false)
CACHE_LOCAL_ENABLED: Enables local in-memory cache as an alternative to Redis (true or false) (Example: false)
```

----------------------------------------

TITLE: Copy and Edit Environment Variables
DESCRIPTION: Copies the example environment file (`.env.example`) to a new `.env` file and then opens it for editing. This allows customization of settings such as database connection strings, API keys, and server ports.
SOURCE: https://github.com/evolutionapi/docs-evolution/blob/main/v2/en/install/nvm.mdx#_snippet_6

LANGUAGE: bash
CODE:
```
cp ./.env.example ./.env
nano ./.env
```

----------------------------------------

TITLE: Enable Nginx Virtual Host with Symbolic Link
DESCRIPTION: This command creates a symbolic link from the Nginx virtual host configuration file in sites-available to the sites-enabled directory. Creating this link activates the virtual host, instructing Nginx to include this configuration when processing incoming requests for the defined domain.
SOURCE: https://github.com/evolutionapi/docs-evolution/blob/main/v1/en/install/nvm.mdx#_snippet_13

LANGUAGE: bash
CODE:
```
ln -s /etc/nginx/sites-available/api /etc/nginx/sites-enabled
```

----------------------------------------

TITLE: Install PostgreSQL and Contrib Packages on Ubuntu
DESCRIPTION: These commands update the package lists and install the PostgreSQL server along with its additional contributed modules on Ubuntu-based systems. This is a prerequisite for local PostgreSQL setup.
SOURCE: https://github.com/evolutionapi/docs-evolution/blob/main/v2/en/requirements/database.mdx#_snippet_3

LANGUAGE: bash
CODE:
```
sudo apt-get update
sudo apt-get install postgresql postgresql-contrib
```

----------------------------------------

TITLE: Define EvoAI Default Bot Settings Endpoint and Request Body
DESCRIPTION: Describes the API endpoint and JSON payload for setting default configurations for EvoAI bots. These settings are applied when specific parameters are not provided during bot creation.
SOURCE: https://github.com/evolutionapi/docs-evolution/blob/main/v2/en/integrations/evoai.mdx#_snippet_1

LANGUAGE: http
CODE:
```
POST {{baseUrl}}/evoai/settings/{{instance}}
```

LANGUAGE: json
CODE:
```
{
    "expire": 20,
    "keywordFinish": "#EXIT",
    "delayMessage": 1000,
    "unknownMessage": "Message not recognized",
    "listeningFromMe": false,
    "stopBotFromMe": false,
    "keepOpen": false,
    "debounceTime": 0,
    "ignoreJids": [],
    "evoaiIdFallback": "clyja4oys0a3uqpy7k3bd7swe"
}
```

LANGUAGE: APIDOC
CODE:
```
Parameters:
  expire (number): Time in minutes after which the bot expires.
  keywordFinish (string): Keyword that ends the bot session.
  delayMessage (number): Delay to simulate typing before sending a message.
  unknownMessage (string): Message sent when the user's input is not recognized.
  listeningFromMe (boolean): Defines if the bot should listen to messages sent by the user.
  stopBotFromMe (boolean): Defines if the bot should stop when the user sends a message.
  keepOpen (boolean): Keeps the session open, preventing the bot from restarting for the same contact.
  debounceTime (number): Time to combine multiple messages into one.
  ignoreJids (array of strings): List of JIDs of contacts that will not activate the bot.
  evoaiIdFallback (string): Fallback bot ID that will be used if no trigger is activated.
```

----------------------------------------

TITLE: Environment Variable for WhatsApp Business Webhook Token
DESCRIPTION: Defines the environment variable `WA_BUSINESS_TOKEN_WEBHOOK` used to store the secret token for validating webhook requests from Meta. This token ensures the authenticity of incoming webhook calls.
SOURCE: https://github.com/evolutionapi/docs-evolution/blob/main/v2/pt/integrations/cloudapi.mdx#_snippet_3

LANGUAGE: plaintext
CODE:
```
WA_BUSINESS_TOKEN_WEBHOOK=seu_token_webhook
```

----------------------------------------

TITLE: Navigate and Install Evolution API Dependencies
DESCRIPTION: Changes the current directory to the cloned Evolution API project and then installs all required Node.js dependencies using npm. This prepares the project for building and running.
SOURCE: https://github.com/evolutionapi/docs-evolution/blob/main/v2/en/install/nvm.mdx#_snippet_5

LANGUAGE: bash
CODE:
```
cd evolution-api
npm install
```

----------------------------------------

TITLE: Manage EvoAI Bot Session Status Endpoint and Request Body
DESCRIPTION: Outlines the API endpoint and JSON structure for managing the status of EvoAI bot sessions, allowing changes to 'opened', 'paused', or 'closed' for specific contacts.
SOURCE: https://github.com/evolutionapi/docs-evolution/blob/main/v2/en/integrations/evoai.mdx#_snippet_2

LANGUAGE: http
CODE:
```
POST {{baseUrl}}/evoai/changeStatus/{{instance}}
```

LANGUAGE: json
CODE:
```
{
    "remoteJid": "5511912345678@s.whatsapp.net",
    "status": "closed"
}
```

LANGUAGE: APIDOC
CODE:
```
Parameters:
  remoteJid (string): JID (identifier) of the contact on WhatsApp.
  status (string): Session status (opened, paused, closed).
```

----------------------------------------

TITLE: Close WebSocket Connection
DESCRIPTION: This JavaScript method is used to gracefully close an active WebSocket connection. It's important to call this when your application or component unmounts to prevent memory leaks and ensure efficient resource usage.
SOURCE: https://github.com/evolutionapi/docs-evolution/blob/main/v2/en/integrations/websocket.mdx#_snippet_4

LANGUAGE: javascript
CODE:
```
socket.disconnect();
```

----------------------------------------

TITLE: RabbitMQ Configuration Environment Variables
DESCRIPTION: Defines environment variables for enabling and configuring RabbitMQ integration with EvolutionAPI, including connection details and exchange names.
SOURCE: https://github.com/evolutionapi/docs-evolution/blob/main/v2/en/env.mdx#_snippet_7

LANGUAGE: APIDOC
CODE:
```
RABBITMQ_ENABLED: Enables RabbitMQ (true or false) - Example: false
RABBITMQ_URI: RabbitMQ connection URI - Example: amqp://localhost
RABBITMQ_EXCHANGE_NAME: Exchange name - Example: evolution
RABBITMQ_GLOBAL_ENABLED: Enables RabbitMQ globally (true or false) - Example: false
```

----------------------------------------

TITLE: View EvolutionAPI Container Logs
DESCRIPTION: This command displays the real-time logs for the `evolution_api` container, which is useful for monitoring its status, debugging issues, and verifying successful startup.
SOURCE: https://github.com/evolutionapi/docs-evolution/blob/main/v1/en/install/docker.mdx#_snippet_5

LANGUAGE: bash
CODE:
```
docker logs evolution_api
```

----------------------------------------

TITLE: Configure EvolutionAPI Environment Variables for Docker Compose
DESCRIPTION: This `.env` file sets the `AUTHENTICATION_API_KEY` for the EvolutionAPI service when deployed with Docker Compose, allowing for easy configuration of sensitive parameters.
SOURCE: https://github.com/evolutionapi/docs-evolution/blob/main/v1/en/install/docker.mdx#_snippet_3

LANGUAGE: bash
CODE:
```
AUTHENTICATION_API_KEY=change-me
```

----------------------------------------

TITLE: Fetch Profile Picture URL API Endpoint
DESCRIPTION: This API endpoint allows fetching the profile picture URL for a given instance. It uses a POST request to a specific path.
SOURCE: https://github.com/evolutionapi/docs-evolution/blob/main/v1/api-reference/chat-controller/fetch-profilepic-url.mdx#_snippet_0

LANGUAGE: APIDOC
CODE:
```
POST /chat/fetchProfilePictureUrl/{instance}
  Description: Fetches the profile picture URL for a specific instance.
  Parameters:
    instance: string (Path Parameter) - The identifier of the instance.
```

----------------------------------------

TITLE: Install MySQL Server on Ubuntu
DESCRIPTION: These commands update the package lists and install the MySQL server on Ubuntu-based systems. This step is necessary before configuring and using MySQL locally.
SOURCE: https://github.com/evolutionapi/docs-evolution/blob/main/v2/en/requirements/database.mdx#_snippet_6

LANGUAGE: bash
CODE:
```
sudo apt-get update
sudo apt-get install mysql-server
```

----------------------------------------

TITLE: Set Worker Server Hostname
DESCRIPTION: Changes the machine's hostname to 'worker1' using 'hostnamectl', which is essential for identifying the server within a cluster.
SOURCE: https://github.com/evolutionapi/docs-evolution/blob/main/v2/en/install/docker.mdx#_snippet_16

LANGUAGE: bash
CODE:
```
hostnamectl set-hostname worker1
```

----------------------------------------

TITLE: Reboot System
DESCRIPTION: Initiates a system reboot, which is often required for hostname and network configuration changes to take full effect.
SOURCE: https://github.com/evolutionapi/docs-evolution/blob/main/v2/en/install/docker.mdx#_snippet_19

LANGUAGE: bash
CODE:
```
reboot
```

----------------------------------------

TITLE: Start MySQL Service on Ubuntu
DESCRIPTION: This command initiates the MySQL database service on Ubuntu-based systems. It must be run after installation to ensure the database is operational.
SOURCE: https://github.com/evolutionapi/docs-evolution/blob/main/v2/en/requirements/database.mdx#_snippet_7

LANGUAGE: bash
CODE:
```
sudo service mysql start
```

----------------------------------------

TITLE: Redis Caching Configuration
DESCRIPTION: Variables for configuring Redis as a caching mechanism for EvolutionAPI. These settings cover Redis connection details, key prefixes, time-to-live (TTL) for cached data, and options for an alternative local memory cache.
SOURCE: https://github.com/evolutionapi/docs-evolution/blob/main/v1/en/env.mdx#_snippet_5

LANGUAGE: APIDOC
CODE:
```
CACHE_REDIS_ENABLED: Whether Redis is enabled (true or false) (Example: true)
CACHE_REDIS_URI: Redis connection URI (Example: redis://redis:6379)
CACHE_REDIS_PREFIX_KEY: Key name prefix (Example: evolution)
CACHE_REDIS_TTL: Time to keep cached data in Redis (Example: 604800)
CACHE_REDIS_SAVE_INSTANCES: Save WhatsApp connection credentials on Redis (Example: false)
CACHE_LOCAL_ENABLED: Cache data in memory (an alternative for Redis) (Example: false)
CACHE_LOCAL_TTL: Time to keep cached data in memory (Example: 604800)
```

----------------------------------------

TITLE: Configure Global Amazon SQS with Environment Variables
DESCRIPTION: This snippet shows the environment variables required to enable and configure Amazon SQS globally for centralized event processing in the Evolution API. It includes authentication credentials (access key ID, secret access key), AWS account ID, and the region where SQS queues are located.
SOURCE: https://github.com/evolutionapi/docs-evolution/blob/main/v2/en/integrations/sqs.mdx#_snippet_0

LANGUAGE: plaintext
CODE:
```
SQS_ENABLED=true
SQS_ACCESS_KEY_ID=your-access-key-id
SQS_SECRET_ACCESS_KEY=your-secret-access-key
SQS_ACCOUNT_ID=your-account-id
SQS_REGION=your-region
```

----------------------------------------

TITLE: Configure MongoDB Environment Variables for Evolution API
DESCRIPTION: This snippet outlines the essential environment variables required to enable and configure MongoDB integration with the Evolution API. These settings, typically found in `.env` or `dev-env.yml`, control the database connection URI, naming conventions, and specific data saving preferences for WhatsApp instances, messages, contacts, and chats.
SOURCE: https://github.com/evolutionapi/docs-evolution/blob/main/v1/en/optional-resources/mongo-db.mdx#_snippet_0

LANGUAGE: shell
CODE:
```
# Set to true to enable MongoDB.
DATABASE_ENABLED=true
# Your MongoDB connection string.
DATABASE_CONNECTION_URI=mongodb://user:password@database_URL/?authSource=admin&readPreference=primary&ssl=false&directConnection=true
# Prefix for your database name.
DATABASE_CONNECTION_DB_PREFIX_NAME=evo
# Save WhatsApp connection credentials on Mongo
DATABASE_SAVE_DATA_INSTANCE=false
# Save new messages on Mongo
DATABASE_SAVE_DATA_NEW_MESSAGE=false
# Save message updates on Mongo
DATABASE_SAVE_MESSAGE_UPDATE=false
# Save imported contacts and new ones
DATABASE_SAVE_DATA_CONTACTS=false
# Save imported chats and new ones
DATABASE_SAVE_DATA_CHATS=false
```

----------------------------------------

TITLE: Update Evolution API Image in Docker Compose (Portainer)
DESCRIPTION: This YAML snippet shows how to specify the Evolution API image version within a Docker Compose stack file, typically managed via Portainer. Users should update the 'image' field to the desired version (e.g., 'v2.1.1' or 'v2.x.x'). This ensures Portainer deploys the correct image.
SOURCE: https://github.com/evolutionapi/docs-evolution/blob/main/v2/pt/updates.mdx#_snippet_2

LANGUAGE: yaml
CODE:
```
# ... (outros serviços e configurações)
  evolution_api:
    # Atualize a versão da imagem da Evolution API aqui
    # Use 'atendai/evolution-api:latest' para a versão mais recente
    # Ou especifique uma versão específica como 'atendai/evolutionapi:2.1.1'
    image: atendai/evolution-api:v2.x.x
    networks:
      - your_network
```

----------------------------------------

TITLE: Update Group Picture API Endpoint
DESCRIPTION: Documents the API endpoint for updating a group's profile picture. This is a POST request to the /group/updateGroupPicture/{instance} path, where '{instance}' is a path parameter representing the group instance identifier.
SOURCE: https://github.com/evolutionapi/docs-evolution/blob/main/v2/api-reference/group-controller/update-group-picture.mdx#_snippet_0

LANGUAGE: APIDOC
CODE:
```
Endpoint: /group/updateGroupPicture/{instance}
Method: POST
Description: Updates the profile picture for a specific group instance.

Path Parameters:
  instance:
    Type: string
    Description: The identifier for the group instance.
```

----------------------------------------

TITLE: Clean Install Dependencies and Restart Evolution API
DESCRIPTION: This sequence of commands handles dependency management and process restart for NPM-based updates. 'rm -rf node_modules' removes existing dependencies to ensure a clean slate. 'npm i' installs new dependencies. Finally, 'pm2 start ApiEvolution' restarts the API, and 'pm2 log ApiEvolution' allows monitoring its logs.
SOURCE: https://github.com/evolutionapi/docs-evolution/blob/main/v2/pt/updates.mdx#_snippet_5

LANGUAGE: shell
CODE:
```
# Remover o diretório node_modules atual para garantir uma instalação limpa
rm -rf node_modules

# Instalar dependências com NPM
npm i

# Reiniciar a Evolution API com a versão atualizada
pm2 start ApiEvolution

# Opcionalmente, visualizar os logs do PM2 para a Evolution API
pm2 log ApiEvolution
```

----------------------------------------

TITLE: Evolution API Webhook Example with Stored Media URL
DESCRIPTION: This JSON snippet demonstrates a typical webhook payload sent by the Evolution API when a media file is received and successfully stored in S3 or Minio. It specifically highlights the `mediaUrl` field, which provides a direct public link to the stored media file.
SOURCE: https://github.com/evolutionapi/docs-evolution/blob/main/v2/en/integrations/s3minio.mdx#_snippet_3

LANGUAGE: json
CODE:
```
{
    "event": "messages.upsert",
    "data": {
        "message": {
            "...",
            "mediaUrl": "https://files.evolution-api-pro.com/bucket/path/to/media/file.jpg",
            "..."
        }
    }
}
```

----------------------------------------

TITLE: Run Mintlify Local Development Server
DESCRIPTION: This command starts a local development server for your Mintlify documentation. It allows you to preview changes in real-time in your browser. This command must be executed from the root directory of your documentation project, where the `mint.json` file is located.
SOURCE: https://github.com/evolutionapi/docs-evolution/blob/main/README.md#_snippet_1

LANGUAGE: shell
CODE:
```
mintlify dev
```

----------------------------------------

TITLE: Clear PM2 Logs and Stop Evolution API Process
DESCRIPTION: These commands are used when updating an NPM-based Evolution API installation. 'pm2 flush' clears all PM2 logs, which can be useful for troubleshooting. 'pm2 stop ApiEvolution' gracefully stops the running Evolution API process managed by PM2, preparing it for updates.
SOURCE: https://github.com/evolutionapi/docs-evolution/blob/main/v2/pt/updates.mdx#_snippet_3

LANGUAGE: shell
CODE:
```
# Limpar todos os logs do PM2
pm2 flush

# Parar o processo atual da Evolution API
pm2 stop ApiEvolution
```

----------------------------------------

TITLE: Stop and Restart Docker Containers for Evolution API
DESCRIPTION: This command sequence first stops and removes all containers, networks, and volumes defined in the `docker-compose.yml` file (`docker-compose down`), and then recreates and starts them in detached mode (`docker-compose up -d`), applying the newly pulled image.
SOURCE: https://github.com/evolutionapi/docs-evolution/blob/main/v1/en/updates.mdx#_snippet_1

LANGUAGE: shell
CODE:
```
docker-compose down && docker-compose up -d
```

----------------------------------------

TITLE: Fetch User Profile API Endpoint
DESCRIPTION: This snippet documents the OpenAPI specification for fetching a user profile. It specifies the HTTP method (POST), the API version (openapi-v2), and the endpoint path, including a dynamic instance parameter.
SOURCE: https://github.com/evolutionapi/docs-evolution/blob/main/v2/api-reference/profile-settings/fetch-profile.mdx#_snippet_0

LANGUAGE: APIDOC
CODE:
```
openapi: openapi-v2 POST /chat/fetchProfile/{instance}
```

----------------------------------------

TITLE: Update Profile Picture API Endpoint
DESCRIPTION: This API endpoint allows updating the profile picture for a specific instance. It uses the PUT HTTP method and requires an instance identifier in the path.
SOURCE: https://github.com/evolutionapi/docs-evolution/blob/main/v1/api-reference/profile-settings/update-profile-picture.mdx#_snippet_0

LANGUAGE: APIDOC
CODE:
```
Endpoint: PUT /chat/updateProfilePicture/{instance}
Version: openapi-v1
Description: Updates the profile picture for a given instance.
Parameters:
  instance:
    Type: string
    Description: The identifier of the instance.
```

----------------------------------------

TITLE: Create Evolution Channel Instance
DESCRIPTION: This section details how to create a new instance within the Evolution Channel by making a POST request to the `/instance/create` endpoint. It includes the required request body parameters and an example `curl` command for demonstration.
SOURCE: https://github.com/evolutionapi/docs-evolution/blob/main/v2/en/integrations/evolution-channel.mdx#_snippet_0

LANGUAGE: http
CODE:
```
POST {{baseUrl}}/instance/create
```

LANGUAGE: json
CODE:
```
{
    "instanceName": "INSTANCE NAME",
    "token": "INSTANCE TOKEN (OPTIONAL)",
    "number": "INSTANCE NUMBER ID",
    "qrcode": false,
    "integration": "EVOLUTION"
}
```

LANGUAGE: APIDOC
CODE:
```
instanceName: Name of the instance you are creating.
token: Optional token to authenticate the instance.
number: Number ID of the instance that will be used to receive and send messages.
qrcode: Set to `false` because the integration does not require a QR Code.
integration: Use "EVOLUTION" to specify that this integration is with the universal Evolution channel.
```

LANGUAGE: bash
CODE:
```
curl -X POST http://API_URL/instance/create \
-H "Content-Type: application/json" \
-d '{
    "instanceName": "MyInstance",
    "token": "123456",
    "number": "9876543210",
    "qrcode": false,
    "integration": "EVOLUTION"
}'
```

----------------------------------------

TITLE: Send Template API Endpoint Definition
DESCRIPTION: Defines the HTTP POST endpoint for sending templates through a specific instance of the Evolution API. This is a core part of the message sending functionality.
SOURCE: https://github.com/evolutionapi/docs-evolution/blob/main/v1/api-reference/message-controller/send-template.mdx#_snippet_0

LANGUAGE: APIDOC
CODE:
```
POST /message/sendTemplate/{instance}

This endpoint is part of the openapi-v1 specification for the Evolution API. It allows users to send pre-defined templates by making a POST request to the specified instance.
```

----------------------------------------

TITLE: Send Media API Endpoint Definition
DESCRIPTION: Defines the OpenAPI v1 endpoint for sending media files. This is a POST request that targets a specific instance.
SOURCE: https://github.com/evolutionapi/docs-evolution/blob/main/v1/api-reference/message-controller/send-media.mdx#_snippet_0

LANGUAGE: APIDOC
CODE:
```
OpenAPI v1 Endpoint:
  Method: POST
  Path: /message/sendMedia/{instance}
```

----------------------------------------

TITLE: cURL Example for Creating WhatsApp Cloud API Instance
DESCRIPTION: Illustrates how to make a POST request to the Evolution API v2's `/instance/create` endpoint using cURL. This example demonstrates the correct headers and JSON payload for setting up a new WhatsApp Cloud API integration instance.
SOURCE: https://github.com/evolutionapi/docs-evolution/blob/main/v2/pt/integrations/cloudapi.mdx#_snippet_1

LANGUAGE: bash
CODE:
```
curl -X POST http://API_URL/instance/create \
-H "Content-Type: application/json" \
-d '{
    "instanceName": "MinhaInstancia",
    "token": "EAAGm0PX4ZCpsBA...",
    "number": "1234567890",
    "businessId": "9876543210",
    "qrcode": false,
    "integration": "WHATSAPP-BUSINESS"
}'
```

----------------------------------------

TITLE: Webhook URL for Meta Integration
DESCRIPTION: Specifies the endpoint URL to be configured in the Facebook Developers panel for receiving webhook events and messages from WhatsApp. This URL directs incoming events to the Evolution API v2.
SOURCE: https://github.com/evolutionapi/docs-evolution/blob/main/v2/pt/integrations/cloudapi.mdx#_snippet_2

LANGUAGE: plaintext
CODE:
```
API_URL/webhook/meta
```

----------------------------------------

TITLE: OpenAPI v2 Definition for Find Settings Endpoint
DESCRIPTION: This entry details the OpenAPI v2 specification for the API endpoint used to retrieve settings. It defines a GET request to the `/settings/find/{instance}` path, where `{instance}` is a required path parameter for identifying the specific instance.
SOURCE: https://github.com/evolutionapi/docs-evolution/blob/main/v2/api-reference/settings/get.mdx#_snippet_0

LANGUAGE: APIDOC
CODE:
```
openapi: openapi-v2
GET /settings/find/{instance}
```

----------------------------------------

TITLE: API Endpoint Definition: Send Contact
DESCRIPTION: This snippet defines the HTTP method and resource path for the 'Send Contact' API endpoint, indicating it's part of the openapi-v1 specification.
SOURCE: https://github.com/evolutionapi/docs-evolution/blob/main/v1/api-reference/message-controller/send-contact.mdx#_snippet_0

LANGUAGE: APIDOC
CODE:
```
openapi-v1 POST /message/sendContact/{instance}
```

----------------------------------------

TITLE: Verify Evolution API Status
DESCRIPTION: This snippet shows an example JSON response expected when accessing the Evolution API's root endpoint (http://localhost:8080), indicating a successful startup and providing basic information about the API.
SOURCE: https://github.com/evolutionapi/docs-evolution/blob/main/v1/en/install/nvm.mdx#_snippet_5

LANGUAGE: json
CODE:
```
{
    "status": 200,
    "message": "Welcome to Evolution API, it is working!",
    "version": "1.x.x",
    "documentation": "http://localhost:8080/docs"
}
```

----------------------------------------

TITLE: Send Location API Endpoint Definition
DESCRIPTION: Defines the API endpoint for sending location data. This is a POST request that requires an instance identifier as a path parameter.
SOURCE: https://github.com/evolutionapi/docs-evolution/blob/main/v1/api-reference/message-controller/send-location.mdx#_snippet_0

LANGUAGE: APIDOC
CODE:
```
POST /message/sendLocation/{instance}
  Description: Sends location data for a specified instance.
  Parameters:
    instance (string, path, required): The unique identifier of the instance to which the location data will be sent.
  Responses:
    200 OK: Location data successfully sent.
    400 Bad Request: Invalid instance ID or malformed request.
    404 Not Found: Instance not found.
```

----------------------------------------

TITLE: WhatsApp Number Verification API Endpoint
DESCRIPTION: This API endpoint facilitates the verification of WhatsApp numbers. It requires a POST request to the specified path, including an instance identifier.
SOURCE: https://github.com/evolutionapi/docs-evolution/blob/main/v2/api-reference/chat-controller/check-is-whatsapp.mdx#_snippet_0

LANGUAGE: APIDOC
CODE:
```
API Endpoint: POST /chat/whatsappNumbers/{instance}
Description: Checks if a number is a WhatsApp number for a specific instance.
OpenAPI Version: v2

Parameters:
  - instance (path):
    Type: string
    Description: The identifier for the WhatsApp instance.
```

----------------------------------------

TITLE: Fetch Profile Picture URL API Endpoint
DESCRIPTION: This API endpoint allows fetching the profile picture URL for a given instance. It uses a POST request to a specific path.
SOURCE: https://github.com/evolutionapi/docs-evolution/blob/main/v2/api-reference/chat-controller/fetch-profilepic-url.mdx#_snippet_0

LANGUAGE: APIDOC
CODE:
```
openapi: openapi-v2 POST /chat/fetchProfilePictureUrl/{instance}
```

----------------------------------------

TITLE: Fetch Chat Profile API Endpoint
DESCRIPTION: Documents the API endpoint used to fetch a chat profile. It specifies the HTTP method, the resource path, and the API specification version.
SOURCE: https://github.com/evolutionapi/docs-evolution/blob/main/v1/api-reference/profile-settings/fetch-profile.mdx#_snippet_0

LANGUAGE: APIDOC
CODE:
```
API Endpoint: /chat/fetchProfile/{instance}
Method: POST
API Specification: openapi-v1
```

----------------------------------------

TITLE: Mark Chat Message as Unread API Endpoint
DESCRIPTION: This API endpoint allows marking a specific chat message as unread within an instance. It uses a POST request to the `/chat/markChatUnread/{instance}` path, following the OpenAPI v2 specification.
SOURCE: https://github.com/evolutionapi/docs-evolution/blob/main/v2/api-reference/chat-controller/mark-as-unread.mdx#_snippet_0

LANGUAGE: APIDOC
CODE:
```
openapi: openapi-v2 POST /chat/markChatUnread/{instance}
```

----------------------------------------

TITLE: Retrieve Settings by Instance API Endpoint
DESCRIPTION: This API endpoint allows clients to retrieve configuration settings for a given instance. It is a standard GET request and requires an instance identifier as a path parameter.
SOURCE: https://github.com/evolutionapi/docs-evolution/blob/main/v1/api-reference/settings/get.mdx#_snippet_0

LANGUAGE: APIDOC
CODE:
```
openapi: openapi-v1
GET /settings/find/{instance}
```

----------------------------------------

TITLE: Evolution API Find Webhook Endpoint
DESCRIPTION: Describes the API endpoint used to retrieve information about any active webhook configured for a specific instance. This allows users to inspect the current webhook settings.
SOURCE: https://github.com/evolutionapi/docs-evolution/blob/main/v1/en/configuration/webhooks.mdx#_snippet_5

LANGUAGE: APIDOC
CODE:
```
Endpoint: GET /webhook/find/[instance]
  Description: Retrieve information about an active webhook for a specific instance.
  Parameters:
    instance: string (Path Parameter) - The identifier of the instance.
  Returns: Webhook configuration details.
```

----------------------------------------

TITLE: Mark Message As Read API Endpoint
DESCRIPTION: This API endpoint allows marking a specific message as read within a chat instance. It utilizes the HTTP POST method and requires an instance identifier as a path parameter.
SOURCE: https://github.com/evolutionapi/evolution-api/docs-evolution/blob/main/v2/api-reference/chat-controller/mark-as-read.mdx#_snippet_0

LANGUAGE: APIDOC
CODE:
```
openapi: openapi-v2 POST /chat/markMessageAsRead/{instance}
```

----------------------------------------

TITLE: Retrieve Webhook Instance Details API
DESCRIPTION: This API endpoint allows you to retrieve the details of a specific webhook instance. It uses the OpenAPI v1 specification and requires the instance identifier as a path parameter.
SOURCE: https://github.com/evolutionapi/docs-evolution/blob/main/v1/api-reference/webhook/get.mdx#_snippet_0

LANGUAGE: APIDOC
CODE:
```
openapi: openapi-v1 GET /webhook/find/{instance}
```

----------------------------------------

TITLE: Find Chats API Endpoint Reference
DESCRIPTION: Documents the OpenAPI specification for the 'Find Chats' endpoint. This endpoint uses a GET request to retrieve chat information for a specific instance.
SOURCE: https://github.com/evolutionapi/docs-evolution/blob/main/v1/api-reference/chat-controller/find-chats.mdx#_snippet_0

LANGUAGE: APIDOC
CODE:
```
openapi: openapi-v1 GET /chat/findChats/{instance}
```

----------------------------------------

TITLE: Supported Webhook Events and Endpoints
DESCRIPTION: Lists all available webhook events for the Evolution API, their corresponding URL paths, and a brief description of what each event signifies. When the WEBHOOK_BY_EVENTS option is enabled, these paths are appended to the base webhook URL, with event names hyphenated (e.g., /application-startup).
SOURCE: https://github.com/evolutionapi/docs-evolution/blob/main/v1/en/configuration/webhooks.mdx#_snippet_3

LANGUAGE: APIDOC
CODE:
```
Webhook Events:
- APPLICATION_STARTUP:
    URL: /application-startup
    Description: Notifies you when an application startup
- QRCODE_UPDATED:
    URL: /qrcode-updated
    Description: Sends the base64 of the qrcode for reading
- CONNECTION_UPDATE:
    URL: /connection-update
    Description: Informs the status of the connection with WhatsApp
- MESSAGES_SET:
    URL: /messages-set
    Description: Sends a list of all your messages uploaded on WhatsApp. This event occurs only once
- MESSAGES_UPSERT:
    URL: /messages-upsert
    Description: Notifies you when a message is received
- MESSAGES_UPDATE:
    URL: /messages-update
    Description: Tells you when a message is updated
- MESSAGES_DELETE:
    URL: /messages-delete
    Description: Tells you when a message is deleted
- SEND_MESSAGE:
    URL: /send-message
    Description: Notifies when a message is sent
- CONTACTS_SET:
    URL: /contacts-set
    Description: Performs initial loading of all contacts.This event occurs only once
- CONTACTS_UPSERT:
    URL: /contacts-upsert
    Description: Reloads all contacts with additional information.This event occurs only once
- CONTACTS_UPDATE:
    URL: /contacts-update
    Description: Informs you when the chat is updated
- PRESENCE_UPDATE:
    URL: /presence-update
    Description: Informs if the user is online, if he is performing some action like writing or recording and his last seen: 'unavailable', 'available', 'composing', 'recording', 'paused'
- CHATS_SET:
    URL: /chats-set
    Description: Send a list of all loaded chats
- CHATS_UPDATE:
    URL: /chats-update
    Description: Informs you when the chat is updated
- CHATS_UPSERT:
    URL: /chats-upsert
    Description: Sends any new chat information
- CHATS_DELETE:
    URL: /chats-delete
    Description: Notify you when a message is deleted
- GROUPS_UPSERT:
    URL: /groups-upsert
    Description: Notifies when a group is created
- GROUPS_UPDATE:
    URL: /groups-update
    Description: Notifies when a group has its information updated
- GROUP_PARTICIPANTS_UPDATE:
    URL: /group-participants-update
    Description: Notifies when an action occurs involving a participant: 'add', 'remove', 'promote', 'demote'
- NEW_TOKEN:
    URL: /new-jwt
    Description: Notifies when the token (jwt) is updated
```

----------------------------------------

TITLE: Logout Instance API Endpoint Definition
DESCRIPTION: This snippet defines the OpenAPI reference for the DELETE method used to log out an instance, including the path and version.
SOURCE: https://github.com/evolutionapi/docs-evolution/blob/main/v1/api-reference/instance-controller/logout-instance.mdx#_snippet_0

LANGUAGE: APIDOC
CODE:
```
openapi: openapi-v1 DELETE /instance/logout/{instance}
```

----------------------------------------

TITLE: Session Configuration Variables
DESCRIPTION: Defines variables related to session management and display names for the Evolution API, affecting how the API interacts with smartphone connections and browser identification.
SOURCE: https://github.com/evolutionapi/docs-evolution/blob/main/v2/en/env.mdx#_snippet_8

LANGUAGE: APIDOC
CODE:
```
CONFIG_SESSION_PHONE_CLIENT: Name that will be displayed on the smartphone connection (Example: Evolution API)
CONFIG_SESSION_PHONE_NAME: Browser name (Chrome, Firefox, Edge, Opera, Safari) (Example: Chrome)
```

----------------------------------------

TITLE: SQS Environment Variables Configuration
DESCRIPTION: Specifies environment variables required for integrating with Amazon SQS (Simple Queue Service), including enabling SQS and providing credentials and region details.
SOURCE: https://github.com/evolutionapi/docs-evolution/blob/main/v1/en/env.mdx#_snippet_7

LANGUAGE: APIDOC
CODE:
```
SQS_ENABLED: Whether SQS is enabled (true or false)
SQS_ACCESS_KEY_ID: SQS access key ID
SQS_SECRET_ACCESS_KEY: SQS access key
SQS_ACCOUNT_ID: Account ID
SQS_REGION: SQS region
```

----------------------------------------

TITLE: Example cURL Request for Instance Creation
DESCRIPTION: Illustrates how to send a POST request using cURL to the `/instance/create` endpoint of Evolution API v2, including the necessary JSON body for WhatsApp Cloud API integration.
SOURCE: https://github.com/evolutionapi/docs-evolution/blob/main/v2/en/integrations/cloudapi.mdx#_snippet_1

LANGUAGE: bash
CODE:
```
curl -X POST http://API_URL/instance/create \
-H "Content-Type: application/json" \
-d '{
    "instanceName": "MyInstance",
    "token": "EAAGm0PX4ZCpsBA...",
    "number": "1234567890",
    "businessId": "9876543210",
    "qrcode": false,
    "integration": "WHATSAPP-BUSINESS"
}'
```

----------------------------------------

TITLE: Authentication Configuration
DESCRIPTION: Sets up API key-based authentication for global access and controls whether instance information is exposed in the fetch endpoint.
SOURCE: https://github.com/evolutionapi/docs-evolution/blob/main/v2/en/env.mdx#_snippet_16

LANGUAGE: APIDOC
CODE:
```
AUTHENTICATION_API_KEY: API key used for global authentication (Example: 429683C4C977415CAAFCCE10F7D57E11)
AUTHENTICATION_EXPOSE_IN_FETCH_INSTANCES: Shows instances in the fetch endpoint (true or false) (Example: true)
```

----------------------------------------

TITLE: JSON Request Body for Creating WhatsApp Cloud API Instance
DESCRIPTION: Defines the structure for the request body used to create a new instance in Evolution API v2, specifically for integrating with the WhatsApp Cloud API. It includes parameters like instance name, permanent token, WhatsApp number ID, business ID, and integration type.
SOURCE: https://github.com/evolutionapi/docs-evolution/blob/main/v2/pt/integrations/cloudapi.mdx#_snippet_0

LANGUAGE: json
CODE:
```
{
    "instanceName": "NOME DA INSTANCIA",
    "token": "TOKEN PERMANENTE DO USUARIO ADMIN DA BM",
    "number": "NUMBER ID DO WHATSAPP",
    "businessId": "BUSINESS ID DA CONTA DO WHATSAPP",
    "qrcode": false,
    "integration": "WHATSAPP-BUSINESS"
}
```

----------------------------------------

TITLE: Verify System Hostname Configuration
DESCRIPTION: This command displays the current hostname settings. It allows verification that the hostname has been correctly applied after configuration and system reboot.
SOURCE: https://github.com/evolutionapi/docs-evolution/blob/main/v2/en/install/docker.mdx#_snippet_10

LANGUAGE: bash
CODE:
```
hostnamectl
```

----------------------------------------

TITLE: Activate Global WebSocket Events
DESCRIPTION: Configuration to enable global WebSocket events by setting the `WEBSOCKET_GLOBAL_EVENTS` environment variable to `true` in the `.env` file. This allows the WebSocket to send events from all instances.
SOURCE: https://github.com/evolutionapi/docs-evolution/blob/main/v2/en/integrations/websocket.mdx#_snippet_0

LANGUAGE: plaintext
CODE:
```
WEBSOCKET_GLOBAL_EVENTS=true
```

----------------------------------------

TITLE: Install Dependencies and Restart Evolution API (NPM)
DESCRIPTION: These commands complete the NPM update process by ensuring a clean installation of Node.js dependencies and restarting the Evolution API using PM2. An optional command to view PM2 logs is also provided for verification.
SOURCE: https://github.com/evolutionapi/docs-evolution/blob/main/v1/pt/updates.mdx#_snippet_3

LANGUAGE: shell
CODE:
```
# Remover o diretório node_modules atual para garantir uma instalação limpa
rm -rf node_modules

# Instalar dependências com NPM
npm i

# Reiniciar a Evolution API com a versão atualizada
pm2 start ApiEvolution

# Opcionalmente, visualizar os logs do PM2 para a Evolution API
pm2 log ApiEvolution
```

----------------------------------------

TITLE: Fetch Chat Profile API Endpoint
DESCRIPTION: Documents the API endpoint used to fetch a chat profile. It specifies the HTTP method, the resource path, and the API specification version.
SOURCE: https://github.com/evolutionapi/docs-evolution/blob/main/v1/api-reference/profile-settings/fetch-profile.mdx#_snippet_0

LANGUAGE: APIDOC
CODE:
```
API Endpoint: /chat/fetchProfile/{instance}
Method: POST
API Specification: openapi-v1
```

----------------------------------------

TITLE: Evolution API Supported Webhook Events
DESCRIPTION: Lists all available webhook events in the Evolution API, their corresponding URL paths, and a brief description of what each event signifies. These events trigger webhooks to notify external systems of changes.
SOURCE: https://github.com/evolutionapi/docs-evolution/blob/main/v2/en/configuration/webhooks.mdx#_snippet_5

LANGUAGE: APIDOC
CODE:
```
Webhook Events:
- APPLICATION_STARTUP:
    URL Path: /application-startup
    Description: Notifies when an application startup occurs
- QRCODE_UPDATED:
    URL Path: /qrcode-updated
    Description: Sends the QR code in base64 format for scanning
- CONNECTION_UPDATE:
    URL Path: /connection-update
    Description: Informs the status of the WhatsApp connection
- MESSAGES_SET:
    URL Path: /messages-set
    Description: Sends a list of all messages loaded in WhatsApp. This event occurs only once
- MESSAGES_UPSERT:
    URL Path: /messages-upsert
    Description: Notifies when a message is received
- MESSAGES_UPDATE:
    URL Path: /messages-update
    Description: Informs when a message is updated
- MESSAGES_DELETE:
    URL Path: /messages-delete
    Description: Informs when a message is deleted
- SEND_MESSAGE:
    URL Path: /send-message
    Description: Notifies when a message is sent
- CONTACTS_SET:
    URL Path: /contacts-set
    Description: Performs the initial loading of all contacts. This event occurs only once
- CONTACTS_UPSERT:
    URL Path: /contacts-upsert
    Description: Reloads all contacts with additional information. This event occurs only once
- CONTACTS_UPDATE:
    URL Path: /contacts-update
    Description: Informs when a contact is updated
- PRESENCE_UPDATE:
    URL Path: /presence-update
    Description: Informs if the user is online, performing an action such as typing or recording, and their last seen status: 'unavailable', 'available', 'typing', 'recording', 'paused'
- CHATS_SET:
    URL Path: /chats-set
    Description: Sends a list of all loaded chats
- CHATS_UPDATE:
    URL Path: /chats-update
    Description: Informs when a chat is updated
- CHATS_UPSERT:
    URL Path: /chats-upsert
    Description: Sends any new chat information
- CHATS_DELETE:
    URL Path: /chats-delete
    Description: Notifies when a chat is deleted
- GROUPS_UPSERT:
    URL Path: /groups-upsert
    Description: Notifies when a group is created
- GROUPS_UPDATE:
    URL Path: /groups-update
    Description: Notifies when a group has its information updated
- GROUP_PARTICIPANTS_UPDATE:
    URL Path: /group-participants-update
    Description: Notifies when an action occurs involving a participant: 'add', 'remove', 'promote', 'demote'
- NEW_TOKEN:
    URL Path: /new-jwt
    Description: Notifies when the token (jwt) is updated
```

----------------------------------------

TITLE: Session Configuration Variables
DESCRIPTION: Defines variables related to session management and display names for the Evolution API, affecting how the API interacts with smartphone connections and browser identification.
SOURCE: https://github.com/evolutionapi/docs-evolution/blob/main/v2/en/env.mdx#_snippet_8

LANGUAGE: APIDOC
CODE:
```
CONFIG_SESSION_PHONE_CLIENT: Name that will be displayed on the smartphone connection (Example: Evolution API)
CONFIG_SESSION_PHONE_NAME: Browser name (Chrome, Firefox, Edge, Opera, Safari) (Example: Chrome)
```

----------------------------------------

TITLE: Example cURL Request for Instance Creation
DESCRIPTION: Illustrates how to send a POST request using cURL to the `/instance/create` endpoint of Evolution API v2, including the necessary JSON body for WhatsApp Cloud API integration.
SOURCE: https://github.com/evolutionapi/docs-evolution/blob/main/v2/en/integrations/cloudapi.mdx#_snippet_1

LANGUAGE: bash
CODE:
```
curl -X POST http://API_URL/instance/create \
-H "Content-Type: application/json" \
-d '{
    "instanceName": "MyInstance",
    "token": "EAAGm0PX4ZCpsBA...",
    "number": "1234567890",
    "businessId": "9876543210",
    "qrcode": false,
    "integration": "WHATSAPP-BUSINESS"
}'
```

----------------------------------------

TITLE: Authentication Configuration
DESCRIPTION: Sets up API key-based authentication for global access and controls whether instance information is exposed in the fetch endpoint.
SOURCE: https://github.com/evolutionapi/docs-evolution/blob/main/v2/en/env.mdx#_snippet_16

LANGUAGE: APIDOC
CODE:
```
AUTHENTICATION_API_KEY: API key used for global authentication (Example: 429683C4C977415CAAFCCE10F7D57E11)
AUTHENTICATION_EXPOSE_IN_FETCH_INSTANCES: Shows instances in the fetch endpoint (true or false) (Example: true)
```

----------------------------------------

TITLE: JSON Request Body for Creating WhatsApp Cloud API Instance
DESCRIPTION: Defines the structure for the request body used to create a new instance in Evolution API v2, specifically for integrating with the WhatsApp Cloud API. It includes parameters like instance name, permanent token, WhatsApp number ID, business ID, and integration type.
SOURCE: https://github.com/evolutionapi/docs-evolution/blob/main/v2/pt/integrations/cloudapi.mdx#_snippet_0

LANGUAGE: json
CODE:
```
{
    "instanceName": "NOME DA INSTANCIA",
    "token": "TOKEN PERMANENTE DO USUARIO ADMIN DA BM",
    "number": "NUMBER ID DO WHATSAPP",
    "businessId": "BUSINESS ID DA CONTA DO WHATSAPP",
    "qrcode": false,
    "integration": "WHATSAPP-BUSINESS"
}
```

----------------------------------------

TITLE: Verify System Hostname Configuration
DESCRIPTION: This command displays the current hostname settings. It allows verification that the hostname has been correctly applied after configuration and system reboot.
SOURCE: https://github.com/evolutionapi/docs-evolution/blob/main/v2/en/install/docker.mdx#_snippet_10

LANGUAGE: bash
CODE:
```
hostnamectl
```

----------------------------------------

TITLE: Activate Global WebSocket Events
DESCRIPTION: Configuration to enable global WebSocket events by setting the `WEBSOCKET_GLOBAL_EVENTS` environment variable to `true` in the `.env` file. This allows the WebSocket to send events from all instances.
SOURCE: https://github.com/evolutionapi/docs-evolution/blob/main/v2/en/integrations/websocket.mdx#_snippet_0

LANGUAGE: plaintext
CODE:
```
WEBSOCKET_GLOBAL_EVENTS=true
```

----------------------------------------

TITLE: Install Dependencies and Restart Evolution API (NPM)
DESCRIPTION: These commands complete the NPM update process by ensuring a clean installation of Node.js dependencies and restarting the Evolution API using PM2. An optional command to view PM2 logs is also provided for verification.
SOURCE: https://github.com/evolutionapi/docs-evolution/blob/main/v1/pt/updates.mdx#_snippet_3

LANGUAGE: shell
CODE:
```
# Remover o diretório node_modules atual para garantir uma instalação limpa
rm -rf node_modules

# Instalar dependências com NPM
npm i

# Reiniciar a Evolution API com a versão atualizada
pm2 start ApiEvolution

# Opcionalmente, visualizar os logs do PM2 para a Evolution API
pm2 log ApiEvolution
```

--- END OF FILE documentaçãoEVO.md ---