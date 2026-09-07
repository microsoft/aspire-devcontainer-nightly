# Getting started with Aspire nightly and Dev Containers

Build apps with JavaScript/TypeScript, Python, .NET, or a mix of languages using [Aspire](https://aspire.dev). This repository provides a ready-to-use development environment for Visual Studio Code Dev Containers and GitHub Codespaces, with nightly Aspire builds and additional tooling for Aspire team dogfooding.

> [!NOTE]
> This repository installs the latest daily builds of Aspire. Use [microsoft/aspire-devcontainer](https://github.com/microsoft/aspire-devcontainer) as a template for the latest released bits. Aspire team members can create a Codespace directly from this repository to take advantage of prebuilds and reduce startup time.

## What's included

The container uses an Ubuntu 24.04 base image, with language tooling installed as Dev Container Features:

| Tooling | Purpose |
| --- | --- |
| Nightly Aspire CLI and Aspire VS Code extension | Dogfood orchestration and debug your app's services |
| Docker-in-Docker | Run containers for databases, caches, and other dependencies |
| Node.js LTS and npm | Develop JavaScript and TypeScript apps |
| Python and uv | Develop Python apps and manage packages and virtual environments |
| .NET 10 SDK and C# Dev Kit | Develop .NET apps |
| PowerShell | Run cross-platform automation scripts |
| Azure CLI, Azure Developer CLI (`azd`), and Azure/Bicep extensions | Exercise Azure deployment scenarios |
| kubectl, Helm, Minikube, and the Kubernetes extension | Exercise Kubernetes development and deployment scenarios |

VS Code includes JavaScript/TypeScript support, with ESLint, Python, and Pylance extensions installed alongside the existing Aspire, .NET, Azure, Kubernetes, and GitHub Copilot extensions. Codespaces requests 8 CPUs, 32 GB of memory, and 64 GB of storage.

## Get started

1. Create a Codespace directly from this repository for team testing, or [create a repository from this template](https://github.com/new?template_name=aspire-devcontainer-nightly&template_owner=microsoft).
2. Alternatively, clone the repository and select **Dev Containers: Reopen in Container** in VS Code. Local development requires Docker and the [Dev Containers extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers).
3. Run `aspire new` in the container terminal to choose an app template, or bring your existing services into the repository.

For more guidance, see:

- [Aspire and GitHub Codespaces](https://aspire.dev/get-started/github-codespaces/)
- [Aspire and Visual Studio Code Dev Containers](https://aspire.dev/get-started/dev-containers/)

## Customize your environment

Edit [`.devcontainer/devcontainer.json`](.devcontainer/devcontainer.json) to change language versions, add tooling, or remove features you don't need. Rebuild the container after changing its configuration. The [Dev Container configuration reference](https://containers.dev/implementors/json_reference/) describes the available options.

Unlike the released template, this repository installs the Aspire CLI through [`oncreate.sh`](.devcontainer/oncreate.sh) using the installer's `-q dev` option. Installation retries transient failures, then clears NuGet caches when the standalone SDK is present to keep Codespaces prebuilds small. The hook runs during creation/prebuild, not every restart. The [Dockerfile](.devcontainer/Dockerfile) supplies ICU for the CLI even without a standalone .NET SDK, and the remote environment puts the nightly CLI on `PATH` for terminals and lifecycle commands.

The template does not run an application-specific restore command. Install your app's dependencies with its package manager, such as `npm install`, `uv sync`, or `dotnet restore`. The repository's [`nuget.config`](nuget.config) retains NuGet.org and the `dotnet10` feed for team testing.

The container configures HTTPS development certificates at startup through Aspire, independent of your app's language:

```sh
aspire certs trust --non-interactive
```

Aspire stores these certificates under `~/.aspnet/dev-certs/trust`. The container's remote environment includes this directory in `SSL_CERT_DIR` so OpenSSL-based tools such as `curl` can verify HTTPS endpoints from the container terminal.

Trust inside the container does not automatically make your host browser trust the certificate. Follow the [Dev Containers HTTPS guidance](https://aspire.dev/get-started/dev-containers/) for local browser setup.

> [!NOTE]
> Once you have created your repository from this template please remember to review the included files such as `LICENSE`, `CODE_OF_CONDUCT.md`, `SECURITY.md` and this `README.md` file to ensure they are appropriate for your circumstances.

## CI checks

The [Devcontainer workflow](.github/workflows/devcontainer.yml) runs on pull requests, pushes to `main`, and manual dispatch. Each matrix job starts the actual nightly devcontainer and runs [smoke checks](.github/scripts/smoke-test.mjs) before and after stopping and reopening it:

| Scenario | AppHost and services |
| --- | --- |
| Python and React | TypeScript AppHost, FastAPI, React, and Redis; also compiles a .NET console app |
| C# and Blazor | C# AppHost, ASP.NET Core API, Blazor, and Redis |
| TypeScript without .NET SDK | TypeScript AppHost, Express, and React, with the standalone .NET SDK feature omitted |

All jobs check non-root workspace access, language and team CLI tooling, startup certificate trust, Docker-in-Docker, and app endpoints. HTTPS requests verify certificates normally. The SDK-free job checks that `dotnet` is absent from `PATH` before and after running Aspire; Aspire still manages its own bundled .NET components. This is a test-only configuration, not a separate editor preset.

Sample projects stay inside the container, with a copy of the repository's NuGet configuration in their parent directory so restores inherit the team feeds. The Redis check uses a non-expiring sentinel value rather than timing-dependent response comparisons. Failures preserve container, AppHost, and resource logs as workflow artifacts. VS Code extensions, debugging, browser rendering, IDE port forwarding, and actual Azure/Kubernetes deployments are not covered.

To run the same checks locally with Docker running:

```sh
npx --yes --package @devcontainers/cli@0.89.0 devcontainer up --workspace-folder . --mount-workspace-git-root false --no-lockfile
npx --yes --package @devcontainers/cli@0.89.0 devcontainer exec --workspace-folder . node .github/scripts/smoke-test.mjs
```

The default scenario is `python`; append `csharp` to the smoke command for the C# AppHost. For the SDK-free scenario, generate a temporary configuration with `node .github/scripts/prepare-config.mjs --output /tmp/aspire-nightly-no-dotnet/devcontainer.json --without-dotnet`, pass `--config /tmp/aspire-nightly-no-dotnet/devcontainer.json` to both CLI commands, and append `typescript-no-dotnet` to the smoke command. The helper preserves the Dockerfile and build context paths when relocating the configuration.

To check restart behavior, stop the container identified by the `up` output, then run both commands again. The smoke script stops its Aspire app; the devcontainer remains running for further use.

## Code of Conduct

This project has adopted the code of conduct defined by the Contributor Covenant
to clarify expected behavior in our community.

For more information, see the [.NET Foundation Code of Conduct](https://dotnetfoundation.org/code-of-conduct).
