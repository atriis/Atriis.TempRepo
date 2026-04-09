---
name: azure-devops-cli
description: Manage Azure DevOps resources via CLI including projects, repos, pipelines, builds, pull requests, work items, artifacts, and service endpoints. Use when working with Azure DevOps, az commands, devops automation, CI/CD, or when user mentions Azure DevOps CLI.
---

# Azure DevOps CLI

Manage Azure DevOps resources using the Azure CLI with the Azure DevOps extension.

**CLI Version:** 2.81.0 (current as of 2025)

## Prerequisites

```bash
# Install Azure CLI
brew install azure-cli  # macOS
curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash  # Linux

# Install Azure DevOps extension
az extension add --name azure-devops
```

## Authentication

```bash
# Login with PAT token
az devops login --organization https://dev.azure.com/{org} --token YOUR_PAT_TOKEN

# Set default organization and project
az devops configure --defaults organization=https://dev.azure.com/{org} project={project}

# List current configuration
az devops configure --list
```

## CLI Structure

```
az devops          # Main DevOps commands
az pipelines       # Azure Pipelines
az boards          # Azure Boards
az repos           # Azure Repos
az artifacts       # Azure Artifacts
```

## Reference Files

Read the relevant reference file based on the user's task:

| File | When to read | Covers |
|---|---|---|
| `references/repos-and-prs.md` | Repos, branches, pull requests, branch policies | Repositories, Import, PRs, Git refs, Branch policies |
| `references/pipelines-and-builds.md` | Pipelines, builds, releases, artifacts | Pipelines CRUD, runs, builds, releases, artifacts |
| `references/boards-and-iterations.md` | Work items, sprints, area paths | Work items (WIQL/create/update/relations), Area paths, Iterations |
| `references/variables-and-agents.md` | Pipeline variables, agent pools | Pipeline variables, Variable groups, Pipeline folders, Agent pools/queues |
| `references/org-and-security.md` | Projects, teams, users, permissions, wikis | Projects, Extensions, Teams, Users, Security groups/permissions, Wikis |
| `references/advanced-usage.md` | Output formatting, JMESPath queries | Output formats, JMESPath queries, Global args, Git aliases |
| `references/workflows-and-patterns.md` | Automation scripts, best practices | Common workflows, Best practices, Error handling, Scripting patterns |
