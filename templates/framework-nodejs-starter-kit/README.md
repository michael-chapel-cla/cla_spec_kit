# Introduction 
TODO: Give a short introduction of your project. Let this section explain the objectives or the motivation behind this project. 

# Getting Started
TODO: Guide users through getting your code up and running on their own system. In this section you can talk about:
1.	Installation process
2.	Software dependencies
3.	Latest releases
4.	API references

# Build and Test
TODO: Describe and show how to build your code and run the tests. 

### Running Azure Authentication Optionally

#### From Host Machine (Outside Container)

1. Make sure to run "az login" to allow the docker container to pick up the credentials from host machine.
2. Do a "docker-compose restart <service_name>" after executing "az login" for the credentials to reflect.
3. azure-auth.sh script runs automatically whenever you spin up docker container, you can find the logs from "docker-compose logs <service_name>" but you also have the option to execute manually if needed. 

```bash
# Make sure the script is executable first
chmod +x scripts/azure-auth.sh

# Run the script directly from host
./scripts/azure-auth.sh

# Or run it with bash explicitly
bash scripts/azure-auth.sh
```


## Activating Pre-commit Hooks

After cloning the repository and installing dependencies, run the following command to activate the pre-commit hook:

```bash
chmod +x .husky/pre-commit

# Contribute
TODO: Explain how other users and developers can contribute to make your code better. 

If you want to learn more about creating good readme files then refer the following [guidelines](https://docs.microsoft.com/en-us/azure/devops/repos/git/create-a-readme?view=azure-devops). You can also seek inspiration from the below readme files:
- [ASP.NET Core](https://github.com/aspnet/Home)
- [Visual Studio Code](https://github.com/Microsoft/vscode)
- [Chakra Core](https://github.com/Microsoft/ChakraCore)